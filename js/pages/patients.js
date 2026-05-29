// ── Patients Page ─────────────────────────────────────────────────────
import { Page } from '../core/router.js';
import { U } from '../utils.js';
import { UI } from '../core/ui.js';

export class PatientsPage extends Page{
  constructor(app,params){super(app);this._pts=[];this._f='';this._sel=params?.selectMode||false;}
  html(){return`<div class="wrap">
    <div class="ph" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
      <div><div class="pt">${this._sel?'Selectează Pacient':'Pacienți'}</div><div class="ps">${this._sel?'Alege pacientul pentru sesiunea curentă':'Gestionarea profilurilor pacienților'}</div></div>
      ${!this._sel?`<button class="btn btn-p" id="badd"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Pacient nou</button>`:''}
    </div>
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;flex-wrap:wrap">
      <input class="sbar" id="psearch" placeholder="Caută după nume..." type="text">
      <span id="pcnt" style="font-size:12px;color:var(--txd);font-family:var(--mono);margin-left:auto"></span>
    </div>
    <div class="pgrid" id="pgrid"><div style="color:var(--txm);font-size:13px">Se încarcă...</div></div>
  </div>`}
  mount(){
    if(!this._sel)document.getElementById('badd').onclick=()=>this.app.router.navigate('patient-form',{mode:'add'});
    document.getElementById('psearch').oninput=e=>{this._f=e.target.value.toLowerCase();this._rg();};
    this._sub(this.app.patients.onPatients(pts=>{this._pts=pts.sort((a,b)=>U.fname(a).localeCompare(U.fname(b)));this._rg();}));
  }
  _rg(){
    const g=document.getElementById('pgrid');if(!g)return;
    const fil=this._pts.filter(p=>U.fname(p).toLowerCase().includes(this._f)||(p.diagnosis||'').toLowerCase().includes(this._f));
    const cnt=document.getElementById('pcnt');if(cnt)cnt.textContent=fil.length+' pacienți';
    if(!fil.length){g.innerHTML=`<div class="empty"><div class="empty-icon">👤</div><div class="empty-t">Niciun pacient găsit</div></div>`;return;}
    const selId=this.app.state.pat?.id;
    g.innerHTML=fil.map(p=>{
      const age=p.dateOfBirth?U.age(p.dateOfBirth):null;
      return`<div class="pcard ${p.id===selId?'sel':''}" data-id="${p.id}">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
          <div class="pav">${U.fini(p)}</div>
          <div><div style="font-size:15px;font-weight:700">${U.esc(U.fname(p))}</div><div style="font-size:11px;color:var(--txd)">${U.esc(p.diagnosis||'Fără diagnostic')}</div></div>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:12px;font-size:12px;color:var(--txd)">
          ${age!==null?`<div>🎂 ${age} ani</div>`:''}
          ${p.contactName?`<div>📞 ${U.esc(p.contactName)}${p.contactPhone?' · '+U.esc(p.contactPhone):''}</div>`:''}
          <div>📋 ${U.esc((p.diagnosisDetails||p.notes||'Fără observații').substring(0,60))}${(p.diagnosisDetails||p.notes||'').length>60?'...':''}</div>
        </div>
        <div style="display:flex;gap:8px;justify-content:flex-end">
          ${this._sel
            ?`<button class="btn btn-p btn-sm sbtn" data-id="${p.id}">✓ Selectează</button>`
            :`<button class="btn btn-g btn-sm ebtn" data-id="${p.id}">✏️</button>
              <button class="btn btn-d btn-sm dbtn" data-id="${p.id}" data-name="${U.esc(U.fname(p))}">🗑️</button>`}
        </div>
      </div>`;
    }).join('');
    if(this._sel){
      g.querySelectorAll('.sbtn').forEach(b=>{b.onclick=e=>{e.stopPropagation();const p=this._pts.find(x=>x.id===b.dataset.id);if(p)this._selPat(p);};});
    }else{
      g.querySelectorAll('.ebtn').forEach(b=>{b.onclick=e=>{e.stopPropagation();const p=this._pts.find(x=>x.id===b.dataset.id);this.app.router.navigate('patient-form',{mode:'edit',patient:p});};});
      g.querySelectorAll('.dbtn').forEach(b=>{b.onclick=e=>{e.stopPropagation();UI.modal('Ștergere pacient',`Ești sigur că ștergi <strong>${U.esc(b.dataset.name)}</strong>?`,'Șterge',async()=>{await this.app.patients.delete(b.dataset.id);if(this.app.state.pat?.id===b.dataset.id)this.app.state.pat=null;UI.toast('Pacient șters.','info');});};});
      g.querySelectorAll('.pcard').forEach(c=>{c.onclick=()=>{const p=this._pts.find(x=>x.id===c.dataset.id);if(p)this.app.router.navigate('reports',{patientId:p.id});};});
    }
  }
  _selPat(p){this.app.state.pat=p;if(this.app._dp)this.app._dp.setPatient(p);UI.toast('Pacient selectat: '+U.fname(p),'success');this.app.router.navigate('dashboard');}
}

// ══════════════════════════════════════════════════════════════════════
// PATIENT FORM PAGE
// ══════════════════════════════════════════════════════════════════════
