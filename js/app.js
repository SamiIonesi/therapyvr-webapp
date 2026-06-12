// ── Main Application ──────────────────────────────────────────────────
import { FB_CFG, initializeApp, getFirestore, getAuth, getStorage, collection, doc, onSnapshot, setDoc, serverTimestamp, getDoc } from './config.js';
import { FBService, AuthSvc, PatientSvc, SessionSvc, HeadsetSvc } from './services.js';
import { Router } from './core/router.js';
import { UI } from './core/ui.js';
import { U, ICONS } from './utils.js';

// Pages
import { LoginPage } from './pages/login.js';
import { DashboardPage } from './pages/dashboard.js';
import { PatientsPage } from './pages/patients.js';
import { PatientFormPage } from './pages/patient-form.js';
import { ReportsPage } from './pages/reports.js';
import { ReportDetailPage } from './pages/report-detail.js';
import { EvolutionListPage, PatientEvolutionPage } from './pages/evolution.js';
import { AccountPage } from './pages/account.js';

// Data & Shapes (side-effects: sets window.showMetricInfo, window.showShapePreview, etc.)
import './data/metric-info.js';
import './shapes/preview.js';

export class App{
  constructor(){
    this.fb=new FBService(FB_CFG);
    this.auth=new AuthSvc(this.fb);
    this.patients=new PatientSvc(this.fb);
    this.sess=new SessionSvc(this.fb);
    this.headsets=new HeadsetSvc(this.fb);
    this.router=new Router();
    this.state={pat:null,headset:null,_questOnlineMap:{}};
    this._questsList=[];
    this._cur=null;this._dp=null;this._hselUnsub=null;this._questOnlineUnsub=null;
  }
  init(){
    this.auth.onChanged(u=>{u?this._showApp(u):this._showLogin();});
    this.router.onNav((pg,p)=>this._go(pg,p));
  }
  _showLogin(){document.getElementById('nav').style.display='none';this._go('login');}
  _showApp(u){
    const nav=document.getElementById('nav');nav.style.display='flex';
    const name=u.displayName||'Terapeut';
    const email=u.email||'';
    const photo=u.photoURL||null;
    const initials=(name.split(' ').map(w=>w[0]||'').join('').substring(0,2)||email.substring(0,2)).toUpperCase();
    // Profile avatar button
    const accBtn=document.getElementById('btn-acc');
    if(accBtn){
      if(photo){accBtn.innerHTML=`<img src="${photo}" style="width:100%;height:100%;border-radius:8px;object-fit:cover" onerror="this.parentElement.textContent='${initials}'">`;accBtn.style.display='flex';}
      else{accBtn.textContent=initials;accBtn.style.display='flex';}
      accBtn.title=email;
      // Load custom photo from Firestore for email users
if(!photo && u.uid){
  getDoc(doc(this.fb.db,'therapists',u.uid)).then(snap=>{
    if(snap.exists()&&snap.data().photoURL){
      const url=snap.data().photoURL;
      const btn=document.getElementById('btn-acc');
      if(btn)btn.innerHTML=`<img src="${url}" style="width:100%;height:100%;border-radius:8px;object-fit:cover">`;
      const av=document.getElementById('pd-av');
      if(av)av.innerHTML=`<img src="${url}">`;
    }
  }).catch(()=>{});
}
    }
    // Profile dropdown content
    const pdAv=document.getElementById('pd-av');
    if(pdAv){
      if(photo)pdAv.innerHTML=`<img src="${photo}" onerror="this.parentElement.textContent='${initials}'">`;
      else pdAv.textContent=initials;
    }
    const pdName=document.getElementById('pd-name');if(pdName)pdName.textContent=name;
    const pdEmail=document.getElementById('pd-email');if(pdEmail)pdEmail.textContent=email;
    // Toggle profile dropdown
    accBtn?.addEventListener('click',e=>{e.stopPropagation();const dd=document.getElementById('profile-dd');if(dd){const v=dd.style.display==='none';dd.style.display=v?'block':'none';}document.getElementById('hsel-dd').style.display='none';});
    document.getElementById('pd-account')?.addEventListener('click',()=>{document.getElementById('profile-dd').style.display='none';this.router.navigate('account');});
    document.getElementById('pd-logout')?.addEventListener('click',async()=>{if(this._dp?._active){UI.toast('Finalizați sesiunea înainte.','error');return;}document.getElementById('profile-dd').style.display='none';await this.auth.signOut();});
    document.addEventListener('click',()=>{const dd=document.getElementById('profile-dd');if(dd)dd.style.display='none';document.getElementById('hsel-dd').style.display='none';},{once:false});
    // Nav links
    const routes=[
      {k:'dashboard',l:'Dashboard',i:ICONS.dashboard},
      {k:'patients',l:'Pacienți',i:ICONS.patients},
      {k:'reports',l:'Rapoarte',i:ICONS.reports},
      {k:'evolution',l:'Evoluție',i:ICONS.evolution},
    ];
    document.getElementById('nav-links').innerHTML=routes.map(r=>`<button class="nl" data-r="${r.k}">${r.i}<span class="nt">${r.l}</span></button>`).join('');
    routes.forEach(r=>document.querySelector(`[data-r="${r.k}"]`).onclick=()=>this.router.navigate(r.k));
    // CHANGE 8: show headset selector + init headset service
    const hselWrap=document.getElementById('hsel-wrap');if(hselWrap)hselWrap.style.display='flex';
    this._initHeadsets();
    this._initAIToggle();
    this.sess.cmd({command:'waiting',status:'idle'});
    this.router.navigate('dashboard');
  }

  // CHANGE 8: headset selector logic
  _initHeadsets(){
    const btn=document.getElementById('hsel-btn'),dd=document.getElementById('hsel-dd'),list=document.getElementById('hsel-list');
    if(!btn||!dd||!list)return;
    btn.addEventListener('click',e=>{e.stopPropagation();dd.style.display=dd.style.display==='none'?'block':'none';document.getElementById('profile-dd').style.display='none';});
    document.getElementById('hsel-add').addEventListener('click',()=>{
      UI.modal('Adaugă cască',
        '<div class="field"><label>Cod cască (unic, ex: Q001)</label><input id="hc" type="text" placeholder="Q001" autocomplete="off"></div><div class="field"><label>Nume afișat (opțional)</label><input id="hn" type="text" placeholder="Cască Andrei" autocomplete="off"></div>',
        'Adaugă',async(fd)=>{
          const code=(fd.hc||'').trim().toUpperCase();
          const name=(fd.hn||'').trim();
          if(!code){UI.toast('Codul pentru cască este obligatoriu.','error');return;}
          if((this._questsList||[]).some(h=>(h.headsetCode||h.id)===code)){
            UI.toast('Codul "'+code+'" există deja.','error');return;
          }
          await this.headsets.add(code,name||code);
          UI.toast('Cască adăugată: '+(name||code),'success');
        },'btn-p');
      dd.style.display='none';
    });
    this._hselUnsub=this.headsets.onHeadsets(hs=>{
      this._questsList=hs;
      // Auto-restore quest selection after page refresh
	if(!this.state.headset){
    				const sq=(()=>{try{return JSON.parse(sessionStorage.getItem('tvr_session')||'null')?.questCode;}catch{return null;}})();
    				if(sq){
        				const h=hs.find(x=>(x.headsetCode||x.id)===sq);
        				if(h){
            					this.state.headset=h;
            					this.sess.setHeadset(sq);
            					const lbl=document.getElementById('hsel-label');if(lbl)lbl.textContent=h.headsetName||h.id;
            					const hbtn=document.getElementById('hsel-btn');if(hbtn)hbtn.className='hsel-btn sel';
        				}
    				}
	}
      if(!hs.length){list.innerHTML='<div style="padding:12px 14px;font-size:12px;color:var(--txm)">Nici o cască înregistrată.</div>';return;}
      const cur=this.state.headset?.id||null;
      list.innerHTML=hs.map(h=>`<div class="hsel-item ${h.id===cur?'act':''}" data-id="${h.id}" data-code="${h.headsetCode||h.id}" data-name="${h.headsetName||h.id}" style="justify-content:space-between">
        <div style="display:flex;align-items:center;gap:10px">
          <div class="hsel-odot ${this.state._questOnlineMap?.[h.id]?'on':''}" id="qd_${h.id}"></div>
          <div><div class="hsel-oname">${h.headsetName||h.id}</div><div class="hsel-ocode">${h.headsetCode||h.id}</div></div>
        </div>
        <button onclick="event.stopPropagation();window._removeHeadset('${h.id}')" style="background:transparent;border:none;color:var(--red);cursor:pointer;padding:4px;font-size:16px;line-height:1" title="Șterge">×</button>
      </div>`).join('');
      window._removeHeadset=async(id)=>{if(this.state.headset?.id===id){this.state.headset=null;this._applyHeadset(null);}await this.headsets.remove(id);UI.toast('Cască ștersă.','info');};
      list.querySelectorAll('.hsel-item').forEach(el=>{
        el.addEventListener('click',()=>{
          const h=hs.find(x=>x.id===el.dataset.id);if(!h)return;
          const isSel=this.state.headset?.id===h.id;
          if(isSel){
            this.state.headset=null;this._applyHeadset(null);
            list.querySelectorAll('.hsel-item').forEach(x=>x.classList.remove('act'));
          }else{
            this.state.headset=h;this._applyHeadset(h);
            list.querySelectorAll('.hsel-item').forEach(x=>x.classList.remove('act'));el.classList.add('act');
          }
          dd.style.display='none';
        });
      });
    });
    // Listen to all quest docs for online status dots
    this._questOnlineUnsub=onSnapshot(collection(this.fb.db,'sessions'),snap=>{
      this.state._questOnlineMap={};
      snap.docs.forEach(d=>{
        const id=d.id,data=d.data();
        if(id.startsWith('quest_')){const code=id.replace('quest_','');this.state._questOnlineMap[code]=data.questOnline===true;}
      });
      // Refresh dots
      document.querySelectorAll('[id^="qd_"]').forEach(dot=>{const id=dot.id.replace('qd_','');const code=document.querySelector(`.hsel-item[data-id="${id}"]`)?.dataset.code;if(code)dot.className='hsel-odot '+(this.state._questOnlineMap[code]?'on':'');});
    });
  }
  _initAIToggle(){
    const btn=document.getElementById('btn-ai-toggle');
     if(!btn)return;
     btn.addEventListener('click',async()=>{
       await this.sess.cmd({command:'ai_connect',t:Date.now()});
        UI.toast('Semnal de reconectare trimis.','info');
    });
  }
  _applyHeadset(h){
    const code=h?.headsetCode||h?.id||null;
    this.sess.setHeadset(code);
    const lbl=document.getElementById('hsel-label');if(lbl)lbl.textContent=h?(h.headsetName||h.id):'Cască';
    const btn=document.getElementById('hsel-btn');if(btn)btn.className='hsel-btn'+(h?' sel':'');
    if(this._dp)this._dp.onHeadsetChanged?.();
    if(h)UI.toast('Cască selectată: '+(h.headsetName||h.id),'success');
    else UI.toast('Cască deselectată.','info');
  }
  _go(pg,p={}){
    document.querySelectorAll('.nl').forEach(l=>l.classList.toggle('active',
      l.dataset.r===pg||
      (pg.includes('patient')&&l.dataset.r==='patients')||
      (pg==='report-detail'&&l.dataset.r==='reports')||
      (pg==='patient-evolution'&&l.dataset.r==='evolution')
    ));
    // Profile avatar stays as-is in nav regardless of page
    const pageDiv=document.getElementById('page');
    const dashDiv=document.getElementById('dash-slot');
    if(pg==='dashboard'){
      if(!this._dp){this._dp=new DashboardPage(this);this._dp.render(dashDiv);}
      dashDiv.style.display='';pageDiv.style.display='none';
      this._cur=this._dp;return;
    }
    dashDiv.style.display='none';pageDiv.style.display='';
    if(this._cur!==this._dp)this._cur?.destroy();
    let page;
    switch(pg){
      case'login':           page=new LoginPage(this);break;
      case'patients':        page=new PatientsPage(this,p);break;
      case'patient-form':    page=new PatientFormPage(this,p);break;
      case'reports':         page=new ReportsPage(this,p);break;
      case'report-detail':   page=new ReportDetailPage(this,p);break;
      case'evolution':         page=new EvolutionListPage(this,p);break;
      case'patient-evolution':page=new PatientEvolutionPage(this,p);break;
      case'account':         page=new AccountPage(this);break;
      default:               page=new PatientsPage(this,p);
    }
    this._cur=page;page.render(pageDiv);
  }
}


const app=new App();app.init();

