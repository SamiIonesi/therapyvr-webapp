// ── Reports Page ──────────────────────────────────────────────────────
import { Page } from '../core/router.js';
import { U } from '../utils.js';
import { UI } from '../core/ui.js';
import { shapeRoName } from '../shapes/preview.js';

export class ReportsPage extends Page{
  constructor(app,params){super(app);this._pid=params?.patientId||null;this._sess=[];this._pts=[];}
  html(){return`<div class="wrap">
    <div class="ph"><div class="pt">Rapoarte Sesiuni</div><div class="ps">Istoricul sesiunilor și metricile cognitive</div></div>
    <div style="display:flex;gap:10px;margin-bottom:20px;align-items:center;flex-wrap:wrap">
      <label style="font-size:12px;color:var(--txd)">Pacient:</label>
      <select class="patient-fsel" id="pfil"><option value="">Toți pacienții</option></select>
      <span id="rcnt" style="font-size:12px;color:var(--txd);font-family:var(--mono);margin-left:auto"></span>
    </div>
    <div id="rlist" class="rlist"><div style="color:var(--txm);font-size:13px;padding:20px">Se încarcă...</div></div>
  </div>`}
  async mount(){
    this._pts=await this.app.patients.getAll();
    const sel=document.getElementById('pfil');
    this._pts.forEach(p=>{const o=document.createElement('option');o.value=p.id;o.textContent=U.fname(p);if(p.id===this._pid)o.selected=true;sel.appendChild(o);});
    sel.onchange=async()=>{this._pid=sel.value||null;await this._load();};
    await this._load();
  }
  async _load(){
    const l=document.getElementById('rlist');l.innerHTML='<div style="color:var(--txm);font-size:13px;padding:20px">Se încarcă...</div>';
    try{
      const sessions=this._pid?await this.app.sess.sessionsForPatient(this._pid):await this.app.sess.allSessions();
      const metricsArr=await Promise.all(sessions.map(s=>this.app.sess.getMetrics(s.id).catch(()=>null)));
      this._sess=sessions.map((s,i)=>({...s,...(metricsArr[i]||{})}));
      this._render();
    }catch(e){l.innerHTML=`<div style="color:var(--red);font-size:13px;padding:20px">Eroare: ${e.message}</div>`;}
  }
  _render(){
    const l=document.getElementById('rlist'),cnt=document.getElementById('rcnt');
    if(cnt)cnt.textContent=this._sess.length+' sesiuni';
    if(!this._sess.length){l.innerHTML='<div class="empty"><div class="empty-icon">📊</div><div class="empty-t">Nicio sesiune înregistrată</div></div>';return;}
    l.innerHTML=this._sess.map(s=>{
      const pt=this._pts.find(p=>p.id===s.patientId),pn=s.patientName||(pt?U.fname(pt):'—');
      const sc=s.cognitiveScore!=null?Math.round(s.cognitiveScore*100):'—';
      const dur=s.elapsedSeconds?U.ft(s.elapsedSeconds):(s.duration?s.duration+' min':'—');
      const cls=typeof sc==='number'?sc>=70?'b-grn':sc>=40?'b-amb':'b-red':'b-blue';
      return`<div class="ritem" data-sid="${s.id}">
        <div class="rscore" style="${typeof sc==='number'?sc>=70?'border-color:rgba(34,197,94,.4);background:rgba(34,197,94,.1);color:var(--grn)':sc>=40?'border-color:rgba(245,158,11,.4);background:rgba(245,158,11,.1);color:var(--amb)':'border-color:rgba(239,68,68,.4);background:rgba(239,68,68,.1);color:var(--red)':''}">${sc}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:14px;font-weight:700">${U.esc(pn)}</div>
          <div style="font-size:12px;color:var(--txd);font-family:var(--mono);margin-top:3px">Nivel ${s.level||1} · ${s.roundsCompleted||'?'} runde · ${s.shapesPlaced||'?'} forme</div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div style="font-size:11px;color:var(--txd);font-family:var(--mono)">${U.fdatetime(s.startTime)}</div>
          <div style="font-size:13px;font-weight:600;margin-top:4px">${dur}</div>
          <span class="badge ${cls}" style="margin-top:5px" title="${typeof sc==='number'?sc>=70?'Excelent — Scor ≥70/100. Performanță cognitivă superioară, nivel poate crește.':sc>=40?'Mediu — Scor 40–69/100. Performanță în parametri terapeutici normali, nivel stabil.':'În progres — Scor <40/100. Necesită atenție, nivel poate scădea.'  :'Scor cognitiv indisponibil pentru această sesiune'}">${typeof sc==='number'?sc>=70?'Excelent':sc>=40?'Mediu':'În progres':'N/A'}</span>
          <button class="btn btn-d btn-sm drep" data-sid="${s.id}" data-name="${U.esc(pn)}" style="margin-top:6px;padding:4px 8px;font-size:13px;line-height:1" title="Șterge raport" onclick="event.stopPropagation()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>
        </div>
      </div>`;
    }).join('');
    l.querySelectorAll('.ritem').forEach(item=>{item.onclick=()=>{const s=this._sess.find(x=>x.id===item.dataset.sid),pt=this._pts.find(p=>p.id===s?.patientId);this.app.router.navigate('report-detail',{session:s,patient:pt,returnPatientId:this._pid});};});
    l.querySelectorAll('.drep').forEach(btn=>{btn.onclick=async(e)=>{e.stopPropagation();UI.modal('Ștergere raport',`Ești sigur că ștergi raportul pentru <strong>${U.esc(btn.dataset.name)}</strong>?`,'Șterge',async()=>{try{await this.app.sess.deleteSession(btn.dataset.sid);await this.app.sess.deleteMetrics(btn.dataset.sid);UI.toast('Raport șters.','info');await this._load();}catch(ex){UI.toast('Eroare: '+ex.message,'error');}});};});
  }
}

// ══════════════════════════════════════════════════════════════════════
// REPORT DETAIL PAGE
// ══════════════════════════════════════════════════════════════════════
