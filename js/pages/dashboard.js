// ── Dashboard Page ────────────────────────────────────────────────────
import { Page } from '../core/router.js';
import { U, ICONS } from '../utils.js';
import { UI } from '../core/ui.js';
import { Timer } from '../core/timer.js';
import { serverTimestamp, doc, setDoc } from '../config.js';
import { shapeRoName, showShapePreview, hideShapePreview, wrapShapeEl } from '../shapes/preview.js';

export class DashboardPage extends Page{
  constructor(app){
    super(app);
    this._pat=app.state.pat||null;
    this._active=false;this._dur=10;this._lvl=1;
    this._sid=null;this._timer=null;this._hmd=true;
    this._questReady=false;this._hmdDown=false;this._gamePaused=false;this._aiConnected=false;this._greetSent=false;
    this._metricsUnsub=null;
    this._qstates=new Map();
    this._currentQCode=null;
    this._lastFbCurrentLevel=null;
  }

  html(){
    const CIRC=364.4;
    return`<div class="wrap">
    <div class="ph" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
      <div>
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <div class="pt">Dashboard Sesiune</div>
          <span id="active-quest-badge" style="display:none;padding:4px 12px;border-radius:20px;border:1px solid rgba(77,159,255,.4);background:var(--acg);color:var(--ac2);font-size:12px;font-weight:700;font-family:var(--mono)"></span>
        </div>
        <div class="ps">Controlul sesiunii de terapie în timp real</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px"><div class="sdot" id="sdot"></div><span id="slabel" style="font-size:13px;font-weight:600;color:var(--txd)">Sesiune inactivă</span></div>
    </div>
    <div class="dg">
      <!-- LEFT COLUMN -->
      <div>
        <!-- Patient banner -->
        <div style="margin-bottom:14px">
          <div class="sl">Pacient selectat</div>
          <div class="card"><div class="cb" style="padding:14px">
            <div id="spb" style="display:${this._pat?'block':'none'};background:var(--acg);border:1px solid rgba(77,159,255,.3);border-radius:var(--r);padding:12px 14px;margin-bottom:11px">
              <div style="display:flex;align-items:center;gap:10px">
                <div style="width:36px;height:36px;border-radius:10px;background:rgba(77,159,255,.2);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:var(--ac2);flex-shrink:0" id="spb-av">${this._pat?U.fini(this._pat):''}</div>
                <div>
                  <div style="font-size:15px;font-weight:800;color:var(--ac2)" id="spb-n">${U.esc(this._pat?U.fname(this._pat):'')}</div>
                  <div style="font-size:11px;color:var(--txd);font-family:var(--mono);margin-top:2px" id="spb-i">${this._pat?(this._pat.diagnosis||'Fără diagnostic')+(this._pat.dateOfBirth?' · '+U.age(this._pat.dateOfBirth)+' ani':''):''}</div>
                </div>
              </div>
              <div id="spb-rl" style="display:none;align-items:center;gap:5px;margin-top:8px;background:rgba(77,159,255,.12);border:1px solid rgba(77,159,255,.25);border-radius:20px;padding:3px 10px;font-size:11px;color:var(--ac2);font-family:var(--mono)">📋 Nivel recomandat: <strong id="spb-rl-val">—</strong></div>
            </div>
            <button class="btn btn-g" style="width:100%;gap:8px" id="btn-cp">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
              ${this._pat?'Schimbă pacientul':'Selectează pacient'}
            </button>
          </div></div>
        </div>

        <!-- Session control card -->
        <div class="card">
          <div class="ch">
            <div class="ct">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Control Sesiune
            </div>
            <div id="sc-pn" style="font-size:12px;color:var(--ac2);font-family:var(--mono)">${this._pat?U.esc(U.fname(this._pat)):'—'}</div>
          </div>
          <div class="cb">
            <!-- Timer ring -->
	    <div class="timer-wrap" style="padding: 12px 16px; align-items: stretch;">
              <div style="text-align: center; margin-bottom: 8px;">
                <div class="timer-main" id="tmr" style="font-size: 42px; font-weight: 400; line-height: 1;">${U.ft(this._dur*60)}</div>
              </div>
              
              <div style="height: 6px; background: var(--sf3); border-radius: 3px; overflow: hidden; margin-bottom: 10px;">
                <div id="tmr-line" style="height: 100%; width: 100%; background: var(--ac); border-radius: 3px; transition: width 1s linear;"></div>
              </div>
              
              <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--txd); opacity: 0.8;">
                <span>Timp rămas</span>
                <span>Scurs: <span id="tel" style="font-family: var(--mono); color: var(--tx);">00:00</span></span>
              </div>
    
            </div>

            <!-- Duration -->
            <div style="margin-bottom:12px">
              <div style="font-size:10px;color:var(--txm);text-transform:uppercase;letter-spacing:.1em;font-weight:700;margin-bottom:8px">Durată sesiune</div>
              <div style="display:flex;gap:6px;flex-wrap:wrap">${[5,10,15,20,30].map(m=>`<button class="chip ${m===this._dur?'active':''}" data-d="${m}">${m} min</button>`).join('')}</div>
            </div>

            <!-- Level row + Delia: chips left half, Delia right half = exact START width -->
            <div style="margin-bottom:10px">
              <div style="font-size:10px;color:var(--txm);text-transform:uppercase;letter-spacing:.1em;font-weight:700;margin-bottom:8px">Nivel joc</div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:9px;align-items:center">
                <div style="display:flex;gap:8px;align-items:center">
                  ${[1,2,3].map(l=>`<button class="lchip ${l===1?'active':''}" data-l="${l}">${l}</button>`).join('')}
                </div>
                <button class="delia-btn" id="bdelia" disabled title="Necesită Quest activ + AI activ" style="width:100%;margin:0">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  Bun venit
                </button>
              </div>
            </div>

            <!-- Control buttons -->
            <div class="ctrl-grid">
              <button class="cbtn c-cal" id="bcal" disabled title="Calibrare poziție pacient">
                <span class="ci">${ICONS.cal}</span>
                <span class="cl">CALIBRARE</span>
              </button>
              <button class="cbtn c-sta" id="bsta" disabled title="Pornire sesiune">
                <span class="ci">${ICONS.play}</span>
                <span class="cl">START</span>
              </button>
              <button class="cbtn c-pau" id="bpau" disabled>
                <span class="ci" id="bpau-icon" style="font-size:20px;line-height:1">⏸</span>
                <span class="cl" id="bpau-label">PAUZĂ</span>
              </button>
              <button class="cbtn c-res" id="bres" disabled title="Reset joc curent">
                <span class="ci">${ICONS.refresh}</span>
                <span class="cl">RESET JOC</span>
              </button>
              <button class="cbtn c-end" id="bend" disabled title="Finalizare sesiune">
                <span class="ci">${ICONS.stop}</span>
                <span class="cl">FINALIZARE SESIUNE</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT COLUMN -->
      <div>
        <div class="sl">Metrici live</div>
        <div class="mg" style="margin-bottom:14px">
          <div class="mc" data-tip="Plasări corecte din total încercări.">
            <div class="mic-row"><div class="mic">${ICONS.target}</div><div class="mlabel">Acuratețe</div><button class="minfo-btn" onclick="showMetricInfo('accuracy')" title="Detalii metrică">ⓘ</button></div>
            <div class="mval" id="ma">—</div>
            <div class="mbar"><div class="mbar-fill" id="ma-bar" style="width:0%"></div></div>
          </div>
          <div class="mc" data-tip="Timpul mediu de la apariția formei până la plasarea corectă.">
            <div class="mic-row"><div class="mic">${ICONS.zap}</div><div class="mlabel">Timp reacție</div><button class="minfo-btn" onclick="showMetricInfo('reactionTime')" title="Detalii metrică">ⓘ</button></div>
            <div class="mval" id="mrt">—</div>
            <div class="mbar"><div class="mbar-fill" id="mrt-bar" style="width:0%;background:var(--amb)"></div></div>
          </div>
          <div class="mc" data-tip="Mâna folosită cel mai frecvent în sesiune.">
            <div class="mic-row"><div class="mic">${ICONS.hand}</div><div class="mlabel">Mâna dominantă</div><button class="minfo-btn" onclick="showMetricInfo('dominantHand')" title="Detalii metrică">ⓘ</button></div>
            <div class="mval" id="mh" style="font-size:18px">—</div>
            <div class="mbar"><div class="mbar-fill" id="mh-bar" style="width:50%;background:var(--pur)"></div></div>
          </div>
          <div class="mc" data-tip="Numărul total de forme plasate corect în sesiunea curentă.">
            <div class="mic-row"><div class="mic">${ICONS.shapes}</div><div class="mlabel">Forme plasate</div><button class="minfo-btn" onclick="showMetricInfo('shapesPlaced')" title="Detalii metrică">ⓘ</button></div>
            <div class="mval" id="ms">—</div>
            <div class="mbar"><div class="mbar-fill" id="ms-bar" style="width:0%;background:var(--pur)"></div></div>
          </div>
          <div class="mc" data-tip="Scor sintetic al sesiunii [0–100]">
            <div class="mic-row"><div class="mic">${ICONS.brain}</div><div class="mlabel">Scor cognitiv</div><button class="minfo-btn" onclick="showMetricInfo('cognitiveScore')" title="Detalii metrică">ⓘ</button></div>
            <div class="mval" id="msc">—</div>
            <div class="mbar"><div class="mbar-fill" id="msc-bar" style="width:0%"></div></div>
          </div>
          <div class="mc" data-tip="Numărul de runde complete finalizate în sesiunea curentă.">
            <div class="mic-row"><div class="mic">${ICONS.repeat}</div><div class="mlabel">Runde complete</div><button class="minfo-btn" onclick="showMetricInfo('roundsCompleted')" title="Detalii metrică">ⓘ</button></div>
            <div class="mval" id="mr">—</div>
            <div class="mbar"><div class="mbar-fill" id="mr-bar" style="width:0%;background:var(--pur)"></div></div>
          </div>
          <div class="mc" data-tip="Procentul plasărilor greșite din total.">
            <div class="mic-row"><div class="mic">${ICONS.xmark}</div><div class="mlabel">Rata erori</div><button class="minfo-btn" onclick="showMetricInfo('errorRate')" title="Detalii metrică">ⓘ</button></div>
            <div class="mval" id="me">—</div>
            <div class="mbar"><div class="mbar-fill" id="me-bar" style="width:0%;background:var(--red)"></div></div>
          </div>
          <div class="mc" data-tip="Durata medie a unei runde complete (secunde).">
            <div class="mic-row"><div class="mic">${ICONS.clock}</div><div class="mlabel">Timp rundă</div><button class="minfo-btn" onclick="showMetricInfo('roundTime')" title="Detalii metrică">ⓘ</button></div>
            <div class="mval" id="mrt2">—</div>
            <div class="mbar"><div class="mbar-fill" id="mrt2-bar" style="width:0%;background:var(--amb)"></div></div>
          </div>
          <div class="mc" data-tip="Forma geometrică la care pacientul a greșit cel mai mult.">
            <div class="mic-row"><div class="mic">${ICONS.warn}</div><div class="mlabel">Formă erori max</div><button class="minfo-btn" onclick="showMetricInfo('worstShape')" title="Detalii metrică">ⓘ</button></div>
            <div class="mval" id="mw" style="font-size:14px">—</div>
            <div class="mbar"><div class="mbar-fill" style="width:0%"></div></div>
          </div>
          <!-- Hidden metrics for JS -->
          <div style="display:none"><span id="mef">—</span></div>
          <div style="display:none"><span id="mstr">—</span></div>
          <div style="display:none"><span id="mhb">—</span></div>
          <div style="display:none"><span id="mft">—</span></div>
        </div>

        <!-- Command log -->
        <div class="log-wrap">
          <div class="log-header">
            <div class="log-title"><div class="log-dot"></div>Log comenzi</div>
            <button id="btn-clear-log" style="background:transparent;border:1px solid var(--bd);border-radius:6px;padding:3px 10px;font-size:10px;color:var(--txd);cursor:pointer;font-family:var(--sans);font-weight:600">Șterge</button>
          </div>
          <div id="clog" class="log-body"></div>
        </div>
      </div>
    </div>
  </div>`;
  }

  mount(){
    const saved=sessionStorage.getItem('tvr_session');
    if(saved){
      try{
        const s=JSON.parse(saved);
        if(s.sid&&s.patientId){
          this._sid=s.sid;this._active=true;
          this._dur=s.dur||10;this._lvl=s.lvl||1;
          this._gamePaused=s.gamePaused||false;
	  if(s.questCode){
    				this._currentQCode=s.questCode;
   				this.app.sess.setHeadset(s.questCode);
    				const badge=document.getElementById('active-quest-badge');
    				if(badge){badge.textContent=s.questName||s.questCode;badge.style.display='inline-flex';}
    				const lbl=document.getElementById('hsel-label');if(lbl)lbl.textContent=s.questName||s.questCode;
    				const hbtn=document.getElementById('hsel-btn');if(hbtn)hbtn.className='hsel-btn sel';
	  }
          this.app.patients.getAll().then(pts=>{
            const p=pts.find(x=>x.id===s.patientId);
            if(p){this._pat=p;this.app.state.pat=p;this._showBanner(p);}
          });
          const extraSeconds=s.gamePaused?0:Math.floor((Date.now()-(s.savedAt||Date.now()))/1000);
          this._startTimerFrom((s.elapsed||0)+extraSeconds);
          this._listenMetrics();
          this._updStatus(this._gamePaused?'paused':'active');
          this._log('🔄 Sesiune restaurată după refresh');
          UI.toast('Sesiune activă restaurată.','info');
        }
      }catch(_){this._clearSession();}
    }
    // Initialize ring
    this._updRing(this._dur*60);
    if(this._pat)this._showBanner(this._pat);
    this._updBtns();
    document.querySelectorAll('[data-d]').forEach(b=>{b.onclick=()=>{if(this._active)return;this._dur=parseInt(b.dataset.d);document.querySelectorAll('[data-d]').forEach(x=>x.classList.remove('active'));b.classList.add('active');if(!this._active){document.getElementById('tmr').textContent=U.ft(this._dur*60);this._updRing(this._dur*60);}};});
    document.querySelectorAll('[data-l]').forEach(b=>{b.onclick=()=>{if(this._active)return;const l=parseInt(b.dataset.l);this._lvl=l;document.querySelectorAll('[data-l]').forEach(x=>x.classList.remove('active'));b.classList.add('active');};});
    document.getElementById('btn-cp').onclick=()=>{if(this._active){UI.toast('Nu poți schimba pacientul în sesiune.','error');return;}this.app.router.navigate('patients',{selectMode:true});};
    document.getElementById('bcal').onclick=()=>this._onCal();
    document.getElementById('bsta').onclick=()=>this._onStart();
    document.getElementById('bpau').onclick=()=>this._onPause();
    document.getElementById('bres').onclick=()=>this._onReset();
    document.getElementById('bend').onclick=()=>this._onEnd();
    document.getElementById('bdelia').onclick=()=>this._onDelia();
    document.getElementById('btn-clear-log').onclick=()=>{const e=document.getElementById('clog');if(e)e.innerHTML='';};
    this._sub(this.app.sess.onSession(data=>{
      if(!data)return;
      const wasReady=this._questReady;
      this._questReady=data.questOnline===true;
      if(!wasReady&&this._questReady){this._updQuestNav(true,false);this._log('🟢 Quest conectat');}
      this._updBtns();
      if(wasReady&&!this._questReady){
        const wasActive=this._active;
        this._active=false;this._hmdDown=false;this._timer?.stop();this._updBtns();
        const tp=document.getElementById('tpaused');if(tp)tp.style.display='none';
        const tm=document.getElementById('tmr');if(tm)tm.classList.remove('paused');
        this._updQuestNav(false,false);
        this._updStatus(wasActive?'ended':'idle');
        this._log('🔴 Quest deconectat');
        UI.toast('Quest deconectat.','error');
        setTimeout(()=>this._resetUI(),1000);
      }
      const hmdNow=data.hmdMounted!==false;
      if(this._questReady&&data.questOnline===true&&!hmdNow&&!this._hmdDown){
  			this._hmdDown=true;
  			if(this._timer?.running)this._timer.pause();
  			const tm=document.getElementById('tmr');if(tm&&this._active)tm.classList.add('paused');
  			this._updBtns();this._updQuestNav(true,true);
	 this._syncTimerVisual();
 			this._log('🥽 Casca dată jos');
      }else if(this._questReady&&data.questOnline===true&&hmdNow&&this._hmdDown){
  			this._hmdDown=false;
  			if(this._active&&this._timer&&!this._gamePaused)this._timer.resume();
  			const tm=document.getElementById('tmr');
  			if(tm){if(!this._gamePaused)tm.classList.remove('paused');else tm.classList.add('paused');}
  			this._updBtns();this._updQuestNav(true,false);
	 this._syncTimerVisual();
  			this._log('🥽 Casca pusă pe cap');
	}	
      this._updQuestStatus(data.command,data.status,data.questOnline);
      const aiOn=data.aiConnected===true&&data.questOnline===true;
      this._aiConnected=aiOn;
      this._updBtns();
      const ad=document.getElementById('aiDot'),at=document.getElementById('aiTxt');
      if(ad&&at){ad.className='ai-dot'+(aiOn?' on':'');at.textContent=aiOn?'Asistent AI activ':'Asistent AI inactiv';}
      const aiBtn=document.getElementById('btn-ai-toggle');
      if(aiBtn){
        // Apare DOAR dacă Quest e activ dar AI s-a deconectat
        const questOn=data.questOnline===true;
        aiBtn.style.display=(questOn&&!aiOn)?'block':'none';
      }
    }));
  }

  // ── Ring helper ──
  async _onDelia(){
    await this.app.sess.cmd({
      command:'greet',
      t:Date.now(),
      patientFirstName: this._pat?.firstName||null,
      patientName: U.fname(this._pat)||null
    });
    this._greetSent=true;
    this._updBtns();
    this._log('Bun venit trimis — Delia');
    UI.toast('Semnal de bun venit trimis Deliei.','info');
  }


  _saveQState(code){
    if(!code)return;
    if(this._timer){
      const qc=code;
      this._timer._tick=(rem,el)=>{
        if(this._currentQCode===qc){
          const t=document.getElementById('tmr'),te=document.getElementById('tel');
          if(t){t.textContent=U.ft(rem);if(rem===0)t.classList.add('expired');}
          if(te)te.textContent=U.ft(el);
          this._updRing(rem);
          if(el%10===0)this._saveSession();
        }
      };
    }
    this._qstates.set(code,{
      pat:this._pat,active:this._active,dur:this._dur,lvl:this._lvl,
      sid:this._sid,timer:this._timer,gamePaused:this._gamePaused,
      greetSent:this._greetSent,questReady:this._questReady,
      hmdDown:this._hmdDown,aiConnected:this._aiConnected,
    });
  }
  _restoreQState(code){
    const s=this._qstates.get(code);
    this._pat        =s?.pat        ??null;
    this._active     =s?.active     ??false;
    this._dur        =s?.dur        ??10;
    this._lvl        =s?.lvl        ??1;
    this._sid        =s?.sid        ??null;
    this._timer      =s?.timer      ??null;
    this._gamePaused =s?.gamePaused ??false;
    this._greetSent  =s?.greetSent  ??false;
    this._questReady =s?.questReady ??false;
    this._hmdDown    =s?.hmdDown    ??false;
    this._aiConnected=s?.aiConnected??false;
  }
  _refreshUI(){
    const rem=this._timer?.remaining??(this._dur*60),el=this._timer?.elapsed??0;
    const tmr=document.getElementById('tmr');
    if(tmr) tmr.textContent=U.ft(rem);
	this._syncTimerVisual();
    const tel=document.getElementById('tel');if(tel)tel.textContent=U.ft(el);
    this._updRing(rem);
    const tp=document.getElementById('tpaused');if(tp)tp.style.display=(this._active&&this._gamePaused)?'block':'none';
    const pi=document.getElementById('bpau-icon'),pl=document.getElementById('bpau-label');
    if(pi)pi.textContent=this._gamePaused?'▶':'⏸';if(pl)pl.textContent=this._gamePaused?'RELUARE':'PAUZĂ';
    document.querySelectorAll('[data-d]').forEach(b=>b.classList.toggle('active',parseInt(b.dataset.d)===this._dur));
    document.querySelectorAll('[data-l]').forEach(b=>b.classList.toggle('active',parseInt(b.dataset.l)===this._lvl));
    if(this._pat)this._showBanner(this._pat);
    else{
      const spb=document.getElementById('spb');if(spb)spb.style.display='none';
      const scpn=document.getElementById('sc-pn');if(scpn)scpn.textContent='—';
      const bc=document.getElementById('btn-cp');
      if(bc)bc.innerHTML=`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg> Selectează pacient`;
    }
    if(!this._active){
      ['ma','mrt','mh','me','ms','msc','mr','mrt2','mw','mef','mstr','mhb','mft'].forEach(id=>{const e=document.getElementById(id);if(e){e.textContent='—';e.style.color='var(--ac2)';}});
      ['ma-bar','mrt-bar','msc-bar','mr-bar','me-bar','mrt2-bar','ms-bar'].forEach(id=>{const e=document.getElementById(id);if(e)e.style.width='0%';});
    }
    this._updStatus(this._active?(this._gamePaused?'paused':'active'):'idle');
    this._updQuestNav(this._questReady,this._hmdDown);
    const ad=document.getElementById('aiDot'),at=document.getElementById('aiTxt');
    if(ad&&at){ad.className='ai-dot'+(this._aiConnected?' on':'');at.textContent=this._aiConnected?'Asistent AI activ':'Asistent AI inactiv';}
    const aiBtn=document.getElementById('btn-ai-toggle');
    if(aiBtn)aiBtn.style.display=(this._questReady&&!this._aiConnected)?'block':'none';
    this._updBtns();
  }
  _updRing(rem){
    const line=document.getElementById('tmr-line');
    if(!line)return;
    const total=this._dur*60;
    const pct=total>0?Math.max(0,rem/total):1;
    
    // Scade lățimea în procente (de la 100% la 0%)
    line.style.width=(pct*100).toFixed(1)+'%';
    
    // Schimbă culoarea din albastru -> galben -> roșu pe măsură ce scade timpul
    if(pct>0.5){
      line.style.background='var(--ac)';
      line.style.boxShadow='0 0 10px rgba(77,159,255,0.4)';
    }else if(pct>0.2){
      line.style.background='var(--amb)';
      line.style.boxShadow='0 0 10px rgba(245,158,11,0.4)';
    }else{
      line.style.background='var(--red)';
      line.style.boxShadow='0 0 10px rgba(239,68,68,0.4)';
    }
  }

  _syncTimerVisual(){
  		const tmr=document.getElementById('tmr');if(!tmr)return;
  		if(this._active&&(this._gamePaused||this._hmdDown)){
    			tmr.classList.add('paused');tmr.classList.remove('expired');
    			tmr.style.color='var(--amb)';
    			tmr.style.animation='bl 1s infinite';
  		}else{
    			tmr.classList.remove('paused');
    			tmr.style.color='';
    			tmr.style.animation='';
  		}
  	this._updRing(this._timer?.remaining??(this._dur*60));
  }

  _onCal(){
    if(this._active){UI.modal('Calibrare în sesiune activă','<strong>Atenție:</strong> Sesiunea este activă. Ești sigur că vrei să recalibrezi acum?','Da, calibrează',()=>this._sendCal(),'btn-p');}
    else this._sendCal();
  }
  async _sendCal(){await this.app.sess.cmd({command:'calibrate',status:'calibrating',t:Date.now()});this._log('🎯 Calibrare trimisă');UI.toast('Calibrare trimisă.','info');}

  _saveSession(){
    if(!this._active)return;
    sessionStorage.setItem('tvr_session',JSON.stringify({
        sid:this._sid,patientId:this._pat?.id||null,
        dur:this._dur,lvl:this._lvl,gamePaused:this._gamePaused,
        elapsed:this._timer?.elapsed||0,savedAt:Date.now(),
        questCode:this._currentQCode||null,
        questName:this.app.state.headset?.headsetName||this._currentQCode||null
    }));
}
  _clearSession(){sessionStorage.removeItem('tvr_session');}

  async _onStart(){
    if(!this._pat){UI.toast('Selectează un pacient mai întâi.','error');return;}
    this._sid='session_'+Date.now();this._active=true;
    this._lastFbCurrentLevel = null;
    this._updMwCard(this._lvl);
    const sessionNumber=await this._getSessionNumber();
    await this.app.sess.cmd({command:'start',status:'active',patientId:this._pat.id,patientName:U.fname(this._pat),patientFirstName:this._pat.firstName||null,level:this._lvl,startTime:serverTimestamp(),sessionId:this._sid,hmdMounted:true,patientAge:this._pat.dateOfBirth?U.age(this._pat.dateOfBirth):(this._pat.age||null),patientDiagnosis:this._pat.diagnosis||null,patientDominantHand:this._pat.dominantHand||null,patientDiagnosisDetails:this._pat.diagnosisDetails||null,sessionNumber:sessionNumber});
    await setDoc(doc(this.app.fb.db,'sessions',this._sid),{patientId:this._pat.id,patientName:U.fname(this._pat),level:this._lvl,status:'active',startTime:serverTimestamp(),duration:this._dur});
    this._startTimer();this._listenMetrics();this._updBtns();this._updStatus('active');
    this._saveSession();this._log('▶ Sesiune pornită — Nivel '+this._lvl);UI.toast('Sesiune pornită!','success');
  }
  async _getSessionNumber(){
    try{const sessions=await this.app.sess.sessionsForPatient(this._pat.id);return(sessions?.length||0)+1;}catch(e){return 1;}
  }

  _onPause(){
    if(!this._gamePaused){
      this._gamePaused=true;this._timer?.pause();
      if(this._metricsUnsub){this._metricsUnsub();this._metricsUnsub=null;}
      this.app.sess.cmd({command:'pause',status:'paused'});
      const icon=document.getElementById('bpau-icon'),lbl=document.getElementById('bpau-label');
      if(icon)icon.textContent='▶';if(lbl)lbl.textContent='RELUARE';
      const tm=document.getElementById('tmr');if(tm)tm.classList.add('paused');
      this._updStatus('paused');this._saveSession();this._log('⏸ Joc pus pe pauză');
      UI.toast('Joc pe pauză.','info');
    }else{
      this._gamePaused=false;this._timer?.resume();this._listenMetrics();
      this.app.sess.cmd({command:'resume',status:'active'});
      const icon=document.getElementById('bpau-icon'),lbl=document.getElementById('bpau-label');
      if(icon)icon.textContent='⏸';if(lbl)lbl.textContent='PAUZĂ';
      const tm=document.getElementById('tmr');
      if(tm){tm.classList.remove('paused');tm.style.color='';tm.style.animation='';}
      this._updStatus('active');this._saveSession();this._log('▶ Joc reluat de terapeut');
      UI.toast('Joc reluat!','success');
    }
  }
  _onReset(){UI.modal('Reset joc','Resetezi jocul curent? Metricile rundelor anterioare se păstrează.','Reset',async()=>{await this.app.sess.cmd({command:'reset',t:Date.now()});this._log('↺ Reset trimis');UI.toast('Reset trimis.','info');},'btn-p');}
  _onEnd(){UI.modal('Finalizare sesiune','Finalizezi sesiunea? Metricile vor fi salvate iar raportul va fi disponibil în secțiunea Rapoarte.','Finalizează',async()=>await this._endSession());}
  async _endSession(){
    hideShapePreview();
    this._timer?.stop();this._active=false;this._clearSession();
    await this.app.sess.cmd({command:'end',status:'ending',endTime:serverTimestamp()});
    if(this._sid)await this.app.sess.updateSession(this._sid,{status:'ended',endTime:serverTimestamp(),elapsedSeconds:this._timer?.elapsed||0});
    await this._updateRecommendedLevel();
    this._updBtns();this._updStatus('ended');this._log('⏹ Sesiune finalizată');
    UI.toast('Sesiune finalizată. Raportul e disponibil în Rapoarte.','success');
    setTimeout(()=>this.app.router.navigate('reports',{patientId:this._pat?.id}),2000);
    setTimeout(()=>this._resetUI(),2500);
  }
  async _updateRecommendedLevel(){
    if(!this._pat||!this._sid)return;
    try{
      const m=await this.app.sess.getMetrics(this._sid);
      if(!m||m.cognitiveScore==null)return;
      const score=m.cognitiveScore,currentLevel=this._lvl||1;
      let newLevel=currentLevel;
      if(score>0.8)newLevel=Math.min(currentLevel+1,3);
      else if(score<0.6)newLevel=Math.max(currentLevel-1,1);
      await this.app.patients.update(this._pat.id,{recommendedLevel:newLevel});
      if(newLevel!==currentLevel){this._log(`📋 Nivel recomandat actualizat: ${currentLevel} → ${newLevel} (scor: ${(score*100).toFixed(0)})`);UI.toast(`Nivel recomandat actualizat: ${currentLevel} → ${newLevel}`,'info');}
      else{this._log(`📋 Nivel recomandat neschimbat: ${currentLevel} (scor: ${(score*100).toFixed(0)})`);}
    }catch(e){console.warn('[updateRecommendedLevel]',e);}
  }

  _resetUI(){
    this._pat=null;this.app.state.pat=null;
    this._sid=null;this._timer?.destroy();this._timer=null;this._clearSession();
    this._gamePaused=false;this._hmdDown=false;this._greetSent=false;
    const bpauIcon=document.getElementById('bpau-icon'),bpauLbl=document.getElementById('bpau-label');
    if(bpauIcon)bpauIcon.textContent='⏸';if(bpauLbl)bpauLbl.textContent='PAUZĂ';
    if(this._metricsUnsub){this._metricsUnsub();this._metricsUnsub=null;}
    const tmr=document.getElementById('tmr');if(tmr){tmr.textContent=U.ft(this._dur*60);tmr.classList.remove('paused','expired');tmr.style.color='';tmr.style.animation='';}
    const tel=document.getElementById('tel');if(tel)tel.textContent='00:00';
    const tp=document.getElementById('tpaused');if(tp)tp.style.display='none';
    // Reset metrics
    ['ma','mrt','mh','me','ms','msc','mr','mrt2','mw','mef','mstr','mhb','mft'].forEach(id=>{const e=document.getElementById(id);if(e){e.textContent='—';e.style.color='var(--ac2)';}});
    hideShapePreview();
    const mwEl = document.getElementById('mw');
    if(mwEl) mwEl._getShapeName = () => null;
    // Reset bars
    ['ma-bar','mrt-bar','msc-bar','mr-bar','me-bar','mrt2-bar','ms-bar'].forEach(id=>{const e=document.getElementById(id);if(e)e.style.width='0%';});
    const spb=document.getElementById('spb');if(spb)spb.style.display='none';
    const scpn=document.getElementById('sc-pn');if(scpn)scpn.textContent='—';
    const btncp=document.getElementById('btn-cp');if(btncp)btncp.innerHTML=`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg> Selectează pacient`;
    this._updRing(this._dur*60);
    this._updBtns();this._updStatus('idle');this._updQuestNav(this._questReady,false);
    this._updMwCard(1);
          this._lastFbCurrentLevel = null;
  }

  _startTimerFrom(elapsed){
    this._timer?.destroy();
    this._timer=new Timer(this._dur,(rem,el)=>{
      const t=document.getElementById('tmr'),te=document.getElementById('tel');
      if(t){t.textContent=U.ft(rem);if(rem===0)t.classList.add('expired');}
      if(te)te.textContent=U.ft(el);
      this._updRing(rem);
      this._saveSession();
    },async()=>{UI.toast('Timp expirat — sesiune finalizată automat.','warn');this._log('⏰ Timp expirat');await this._endSession();});
    this._timer._el=elapsed;
    if(!this._gamePaused)this._timer.start();
    else{const t=document.getElementById('tmr');if(t){t.textContent=U.ft(this._timer.remaining);t.classList.add('paused');}this._updRing(this._timer.remaining);}
  }
  _startTimer(){
    this._timer?.destroy();
    this._timer=new Timer(this._dur,(rem,el)=>{
      const t=document.getElementById('tmr'),te=document.getElementById('tel');
      if(t){t.textContent=U.ft(rem);if(rem===0)t.classList.add('expired');}
      if(te)te.textContent=U.ft(el);
      this._updRing(rem);
      if(el%10===0)this._saveSession();
    },async()=>{UI.toast('Timp expirat — sesiune finalizată automat.','warn');this._log('⏰ Timp expirat');await this._endSession();});
    this._timer.start();
  }

  _listenMetrics(){
    if(!this._sid)return;
    if(this._metricsUnsub){this._metricsUnsub();this._metricsUnsub=null;}
    const u=this.app.sess.onMetrics(this._sid,d=>{
      if(!d)return;
      const p=v=>v!=null?(v*100).toFixed(0)+'%':'—',f=v=>v!=null?parseFloat(v).toFixed(1):'—',hd=v=>v==='right'?'Dreaptă':v==='left'?'Stângă':'—';
      const hasData=(d.shapesPlaced??0)>0||(d.totalAttempts??0)>0;
      const neutral='var(--ac2)';
      // Accuracy — higher is better
      const accVal=d.accuracy!=null?d.accuracy*100:null;
      const accCol=!hasData||accVal==null?neutral:accVal>=80?'var(--grn)':accVal>=60?'var(--amb)':'var(--red)';
      this._m('ma',hasData?p(d.accuracy):'—',accCol,hasData?accVal:null);
      // Reaction time — lower is better
      const rtVal=d.avgReactionTime;
      const rtCol=!hasData||rtVal==null?neutral:rtVal<=3?'var(--grn)':rtVal<=6?'var(--amb)':'var(--red)';
      this._m('mrt',hasData?f(d.avgReactionTime):'—',rtCol,hasData&&rtVal!=null?Math.max(0,100-rtVal*10):0,'mrt-bar');
      // Hand
      this._m('mh',hd(d.dominantHand),'var(--ac2)',50);
      // Shapes
      this._m('ms',d.shapesPlaced??'—','var(--pur)',null);
      // Cognitive score — higher is better
      const scVal=d.cognitiveScore!=null?d.cognitiveScore*100:null;
      const scCol=!hasData||scVal==null?neutral:scVal>=80?'var(--grn)':scVal>=60?'var(--amb)':'var(--red)';
      this._m('msc',hasData&&scVal!=null?scVal.toFixed(0):'—',scCol,hasData?scVal:null);
      // Rounds
      this._m('mr',d.roundsCompleted??'—','var(--ac2)',null);
      // Error rate — lower is better
      const errVal=d.errorRate!=null?d.errorRate*100:null;
      const errCol=!hasData||errVal==null?neutral:errVal<=20?'var(--grn)':errVal<=40?'var(--amb)':'var(--red)';
      this._m('me',hasData?p(d.errorRate):'—',errCol,hasData?errVal:null,'me-bar');
      // Round time
      this._m('mrt2',d.currentRoundTime!=null?U.ft(d.currentRoundTime):'—','var(--ac2)',null);
      // Worst shape or color
const fbLvl = d.currentLevel ?? null;
// Accept level change only if Firebase value actually changed (not just initial default write)
if(fbLvl !== null && this._lastFbCurrentLevel !== null && fbLvl !== this._lastFbCurrentLevel){
    this._lvl = fbLvl; // adaptive change confirmed
}
this._lastFbCurrentLevel = fbLvl;
const _isL2 = this._lvl === 2;
const _mwKey = _isL2 ? (d.worstColor||'') : (d.worstShape||'');
this._updMwCard(this._lvl);
this._m('mw',_mwKey?U.esc(shapeRoName(_mwKey)):'—','var(--amb)',null);
if(_mwKey){const mwEl=document.getElementById('mw');if(mwEl)wrapShapeEl(mwEl,()=>_mwKey);}
      // Hidden
      this._m('mef',d.efficiencyRate!=null?p(d.efficiencyRate):'—');
      this._m('mstr',d.maxConsecutiveCorrect??'—');
      this._m('mhb',d.handBalanceScore!=null?p(d.handBalanceScore):'—');
      this._m('mft',d.firstTryCorrect??'—');
    });
    this._metricsUnsub=u;this._sub(u);
  }

  _m(id,v,col,barPct,barId){
    const e=document.getElementById(id);
    if(e){e.textContent=v;if(col)e.style.color=col;}
    // Update bar if provided
    const bid=barId||(id+'-bar');
    const bar=document.getElementById(bid);
    if(bar&&barPct!=null){
      const w=Math.min(100,Math.max(0,parseFloat(barPct)||0));
      bar.style.width=w+'%';
      if(col&&col!=='var(--ac2)')bar.style.background=col;
    }
  }

  _showBanner(p){
    const b=document.getElementById('spb');if(!b)return;
    b.style.display='block';
    const av=document.getElementById('spb-av');if(av)av.textContent=U.fini(p);
    const n=document.getElementById('spb-n');if(n)n.textContent=U.fname(p);
    const i=document.getElementById('spb-i');if(i)i.textContent=(p.diagnosis||'Fără diagnostic')+(p.dateOfBirth?' · '+U.age(p.dateOfBirth)+' ani':'');
    const rl=document.getElementById('spb-rl'),rlv=document.getElementById('spb-rl-val');
    if(rl&&rlv){if(p.recommendedLevel){rl.style.display='inline-flex';rlv.textContent=p.recommendedLevel;}else{rl.style.display='none';}}
    const sc=document.getElementById('sc-pn');if(sc)sc.textContent=U.fname(p);
    const cb=document.getElementById('btn-cp');if(cb)cb.innerHTML=`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg> Schimbă pacientul`;
  }
  _updBtns(){
    const has=!!this._pat,s=this._active,q=this._questReady,h=this._hmdDown;
    this._dis('bcal',!has||!q||h);
    this._dis('bsta',!has||s||!q||h);
    this._dis('bpau',!s||h);
    this._dis('bres',!s||h);
    this._dis('bend',!s);
    this._dis('bdelia', !has||!q||!this._aiConnected||this._greetSent||s||h);
    document.querySelectorAll('[data-l]').forEach(b=>{b.disabled=!has||!!s||!q||h;});
    document.querySelectorAll('[data-d]').forEach(b=>{b.disabled=!has||!!s||!q||h;});
  }
  _dis(id,v){const e=document.getElementById(id);if(e)e.disabled=v;}
  _updStatus(st){
    const d=document.getElementById('sdot'),l=document.getElementById('slabel');
    if(!d)return;d.className='sdot '+st;
    const m={idle:'Sesiune inactivă',waiting:'Sesiune inactivă',active:'Sesiune activă',ended:'Sesiune finalizată',inactive:'Sesiune inactivă',paused:'Sesiune în pauză'};
    if(l)l.textContent=m[st]||'Sesiune inactivă';
  }
  _updQuestNav(online,hmdDown){
    const d=document.getElementById('qdot'),t=document.getElementById('qtext');
    if(!d||!t)return;
    if(!online){d.className='qdot';t.textContent='Quest inactiv';return;}
    if(hmdDown){d.className='qdot paused';t.textContent='Casca dată jos';return;}
    d.className='qdot on';t.textContent='Quest activ';
  }
  _updQuestStatus(cmd,st,online){this._updQuestNav(online,this._hmdDown);}
  onHeadsetChanged(){
    const h=this.app.state.headset;
    const newCode=h?(h.headsetCode||h.id):null;
    // Update badge
    const badge=document.getElementById('active-quest-badge');
    if(badge){
      if(h){badge.textContent=h.headsetName||h.headsetCode||h.id;badge.style.display='inline-flex';}
      else{badge.style.display='none';}
    }
    // Save current quest state (patient, session, timer, etc.)
    this._saveQState(this._currentQCode);
    // Unsubscribe ALL listeners (session + metrics)
    this._us.forEach(u=>u?.());this._us=[];
    if(this._metricsUnsub){this._metricsUnsub();this._metricsUnsub=null;}
    // Switch quest
    this._currentQCode=newCode;
    if(!newCode){
      // No quest selected — clean state
      this._pat=null;this._active=false;this._dur=10;this._lvl=1;
      this._sid=null;this._timer=null;this._gamePaused=false;this._greetSent=false;
      this._questReady=false;this._hmdDown=false;this._aiConnected=false;
      this._refreshUI();return;
    }
    // Restore saved state for this quest
    this._restoreQState(newCode);
    // Reconnect timer DOM updates if timer is running
    if(this._timer&&this._active){
      const qcode=newCode;
      this._timer._tick=(rem,el)=>{
        if(this._currentQCode===qcode){
          const t=document.getElementById('tmr'),te=document.getElementById('tel');
          if(t){t.textContent=U.ft(rem);if(rem===0)t.classList.add('expired');}
          if(te)te.textContent=U.ft(el);
          this._updRing(rem);
	  if(el%10===0)this._saveSession();
        }
      };
    }
    // Re-subscribe Firebase session listener
    this._sub(this.app.sess.onSession(data=>{
      if(!data)return;
      const wasReady=this._questReady;
      this._questReady=data.questOnline===true;
      if(!wasReady&&this._questReady){this._updQuestNav(true,false);this._log('🟢 Quest conectat');}
      this._updBtns();
      if(wasReady&&!this._questReady){
        const wa=this._active;this._active=false;this._hmdDown=false;this._timer?.stop();this._updBtns();
        const tp=document.getElementById('tpaused');if(tp)tp.style.display='none';
        const tm=document.getElementById('tmr');
	if(tm){tm.classList.remove('paused');tm.style.color='';tm.style.animation='';}
        this._updQuestNav(false,false);this._updStatus(wa?'ended':'idle');
        this._log('🔴 Quest deconectat');UI.toast('Quest deconectat.','error');
        setTimeout(()=>this._resetUI(),1000);
      }
      const hmdNow=data.hmdMounted!==false;
if(this._questReady&&data.questOnline===true&&!hmdNow&&!this._hmdDown){
  this._hmdDown=true;if(this._timer?.running)this._timer.pause();
  this._updBtns();this._updQuestNav(true,true);
  this._syncTimerVisual();
  this._log('🥽 Casca dată jos');
}else if(this._questReady&&data.questOnline===true&&hmdNow&&this._hmdDown){
  this._hmdDown=false;
  if(this._active&&this._timer&&!this._gamePaused)this._timer.resume();
  this._updBtns();this._updQuestNav(true,false);
  this._syncTimerVisual();
  this._log('🥽 Casca pusă pe cap');
}
      this._updQuestStatus(data.command,data.status,data.questOnline);
      // AI status — read ONLY from this quest's doc
      const aiOn=data.aiConnected===true&&data.questOnline===true;
      this._aiConnected=aiOn;this._updBtns();
      const ad=document.getElementById('aiDot'),at=document.getElementById('aiTxt');
      if(ad&&at){ad.className='ai-dot'+(aiOn?' on':'');at.textContent=aiOn?'Asistent AI activ':'Asistent AI inactiv';}
      const aiBtn=document.getElementById('btn-ai-toggle');
      if(aiBtn){const qOn=data.questOnline===true;aiBtn.style.display=(qOn&&!aiOn)?'block':'none';}
    }));
    // Re-subscribe metrics if active session
    if(this._sid&&this._active)this._listenMetrics();
    // Refresh all UI
    this._refreshUI();
    this._log('🔄 Quest: '+newCode);
  }

  _log(msg){
    const e=document.getElementById('clog');if(!e)return;
    const t=new Date().toLocaleTimeString('ro-RO',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
    e.innerHTML=`<div class="log-entry"><span class="log-time">${t}</span><span style="color:var(--ac2)">${U.esc(msg)}</span></div>`+e.innerHTML;
  }
  
   _updMwCard(lvl){
    	const lbl=document.querySelector('#mw')?.closest('.mc')?.querySelector('.mlabel');
    	if(lbl)lbl.textContent=lvl===2?'Culoare dificilă':'Formă erori max';
     }


  setPatient(p){
    this._pat=p;this.app.state.pat=p;this._showBanner(p);this._updBtns();
    this._saveQState(this._currentQCode);
    const sc=document.getElementById('sc-pn');if(sc)sc.textContent=U.fname(p);
    if(p.recommendedLevel){
      this._lvl=p.recommendedLevel;
      document.querySelectorAll('[data-l]').forEach(x=>x.classList.remove('active'));
      const btn=document.querySelector(`[data-l="${p.recommendedLevel}"]`);
      if(btn)btn.classList.add('active');
      this._log(`📋 Nivel recomandat din profil: Nivel ${p.recommendedLevel}`);
    }
  }
  destroy(){this._timer?.destroy();super.destroy();}
}

// ══════════════════════════════════════════════════════════════════════
// PATIENTS PAGE
// ══════════════════════════════════════════════════════════════════════
