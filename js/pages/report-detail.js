// ── Report Detail Page ────────────────────────────────────────────────
import { Page } from '../core/router.js';
import { U } from '../utils.js';
import { UI } from '../core/ui.js';
import { shapeRoName, showShapePreview, hideShapePreview } from '../shapes/preview.js';

export class ReportDetailPage extends Page{
  constructor(app,params){super(app);this._s=params?.session||null;this._pt=params?.patient||null;this._m=null;this._rpid=params?.returnPatientId||null;this._returnTo=params?.returnTo||null;this._returnPatient=params?.returnPatient||null;}
  html(){return`<div class="wrap">
    <div class="ph" style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
      <button class="btn btn-g btn-sm" id="bbkr">← Rapoarte</button>
      <div><div class="pt">Raport Sesiune</div><div class="ps" id="rdsub">Se încarcă...</div></div>
    </div>
    <div id="rdcontent" style="color:var(--txm)">Se încarcă metricile...</div>
  </div>`}
  async mount(){
    document.getElementById('bbkr').onclick=()=>{if(this._returnTo==='patient-evolution'){this.app.router.navigate('patient-evolution',{patient:this._returnPatient});}else{this.app.router.navigate('reports',{patientId:this._rpid});}};
    if(!this._s){document.getElementById('rdcontent').textContent='Sesiune negăsită.';return;}
    this._m=await this.app.sess.getMetrics(this._s.id);this._render();
  }
  _render(){
    const s=this._s,m=this._m||{},pn=this._pt?U.fname(this._pt):(s.patientName||'—');
    const age=this._pt?.dateOfBirth?`, ${U.age(this._pt.dateOfBirth)} ani`:'';
    document.getElementById('rdsub').textContent=`${pn}${age} · ${U.fdatetime(s.startTime)} · Nivel ${s.level||1}`;
    const acc=m.accuracy!=null?(m.accuracy*100).toFixed(1):'—',rt=m.avgReactionTime!=null?m.avgReactionTime.toFixed(2):'—';
    const err=m.errorRate!=null?(m.errorRate*100).toFixed(1):'—',sc=m.cognitiveScore!=null?(m.cognitiveScore*100).toFixed(0):'0';
    const hd=m.dominantHand==='right'?'Dreaptă':m.dominantHand==='left'?'Stângă':'—';
    const dur=s.elapsedSeconds?U.ft(s.elapsedSeconds):'—';
    const lh=m.leftHandCount||0,rh=m.rightHandCount||0,tot=lh+rh;
    const rnds=m.rounds||[];
    document.getElementById('rdcontent').innerHTML=`
    <div class="card" style="margin-bottom:20px"><div class="cb">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:12px">
        <div><div style="font-size:11px;color:var(--txd);text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px">Scor cognitiv compozit</div>
          <div style="font-size:48px;font-weight:800;font-family:var(--mono);color:var(--ac2);line-height:1">${sc}<span style="font-size:20px;color:var(--txd)">/100</span></div></div>
        <span class="badge ${parseFloat(sc)>=70?'b-grn':parseFloat(sc)>=40?'b-amb':'b-red'}" style="font-size:14px;padding:8px 16px" title="${parseFloat(sc)>=70?'Excelent — Scor ≥70/100. Performanță cognitivă superioară, nivel poate crește la sesiunea următoare.':parseFloat(sc)>=40?'Mediu — Scor 40–69/100. Performanță în parametri terapeutici normali, nivel rămâne stabil.':'În progres — Scor <40/100. Necesită atenție și monitorizare suplimentară, nivel poate scădea.'}">${parseFloat(sc)>=70?'Excelent':parseFloat(sc)>=40?' Mediu':'În progres'}</span>
      </div>
      <div><div style="height:10px;background:var(--sf3);border-radius:5px;overflow:hidden"><div class="sbfill" id="sb" style="width:0%"></div></div></div>
    </div></div>
    <div class="rdg">
      <div class="rdm hi" data-tip="Scor sintetic [0–100].&#10;Formula: 50% acuratețe + 25% viteză reacție + 25% eficiență&#10;&gt;80=Bun · 60–80=Mediu · &lt;60=Necesită atenție"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px"><div class="rdml" style="margin:0">Scor cognitiv</div><button class="minfo-btn" onclick="showMetricInfo('cognitiveScore')" title="Detalii">ⓘ</button></div><div class="rdmv">${sc}</div><div class="rdmu">/100</div></div>
      <div class="rdm" data-tip="Plasări corecte din total încercări.&#10;Formula: corecte / (corecte + greșeli) × 100"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px"><div class="rdml" style="margin:0">Acuratețe</div><button class="minfo-btn" onclick="showMetricInfo('accuracy')" title="Detalii">ⓘ</button></div><div class="rdmv">${acc}</div><div class="rdmu">%</div></div>
      <div class="rdm" data-tip="Timpul mediu de la apariția formei până la plasarea corectă."><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px"><div class="rdml" style="margin:0">Timp reacție mediu</div><button class="minfo-btn" onclick="showMetricInfo('reactionTime')" title="Detalii">ⓘ</button></div><div class="rdmv">${rt}</div><div class="rdmu">secunde</div></div>
      <div class="rdm" data-tip="Procentul plasărilor greșite din total."><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px"><div class="rdml" style="margin:0">Rata erorilor</div><button class="minfo-btn" onclick="showMetricInfo('errorRate')" title="Detalii">ⓘ</button></div><div class="rdmv">${err}</div><div class="rdmu">%</div></div>
      <div class="rdm" data-tip="Numărul total de forme plasate corect în sesiune."><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px"><div class="rdml" style="margin:0">Forme plasate corect</div><button class="minfo-btn" onclick="showMetricInfo('shapesPlaced')" title="Detalii">ⓘ</button></div><div class="rdmv">${m.shapesPlaced??'—'}</div><div class="rdmu">total</div></div>
      <div class="rdm" data-tip="Durata efectivă a sesiunii de terapie (mm:ss)."><div class="rdml">Durată sesiune</div><div class="rdmv">${dur}</div><div class="rdmu">mm:ss</div></div>
      <div class="rdm" data-tip="Numărul de runde finalizate complet de pacient."><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px"><div class="rdml" style="margin:0">Runde complete</div><button class="minfo-btn" onclick="showMetricInfo('roundsCompleted')" title="Detalii">ⓘ</button></div><div class="rdmv">${m.roundsCompleted??s.roundsCompleted??'—'}</div><div class="rdmu">runde</div></div>
      <div class="rdm" data-tip="Mâna folosită cel mai frecvent în sesiune."><div class="rdml">Mâna dominantă</div><div class="rdmv" style="font-size:18px">${hd}</div><div class="rdmu">utilizată</div></div>
      <div class="rdm" data-tip="Forma geometrică la care pacientul a greșit cel mai mult."><div class="rdml">Formă cu erori max</div><div class="rdmv" style="font-size:16px">${m.worstShape&&m.worstShape!=='—'?`<span onmouseenter="showShapePreview('${m.worstShape}',this)" onmouseleave="hideShapePreview()" style="cursor:help">${U.esc(shapeRoName(m.worstShape))}</span>`:'—'}</div><div class="rdmu">obiect</div></div>
	<div class="rdm" data-tip="Culoarea la care pacientul a greșit cel mai mult (Level 2).">
  <div class="rdml">Culoare dificilă</div>
  <div class="rdmv" style="font-size:16px">
    ${m.worstColor&&m.worstColor!=='—'&&m.worstColor!==''
      ?`<span onmouseenter="showShapePreview('${m.worstColor}',this)" 
              onmouseleave="hideShapePreview()" 
              style="cursor:help">${shapeRoName(m.worstColor)}</span>`
      :'—'}
  </div>
  <div class="rdmu">culoare</div>
</div>
      <div class="rdm" data-tip="% forme plasate corect din prima încercare."><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px"><div class="rdml" style="margin:0">Eficiență (prima încercare)</div><button class="minfo-btn" onclick="showMetricInfo('efficiency')" title="Detalii">ⓘ</button></div><div class="rdmv">${m.efficiencyRate!=null?(m.efficiencyRate*100).toFixed(1)+'%':'—'}</div><div class="rdmu">%</div></div>
      <div class="rdm" data-tip="Numărul total de plasări (corecte + greșite)."><div class="rdml">Total încercări</div><div class="rdmv">${m.totalAttempts??'—'}</div><div class="rdmu">plasări</div></div>
      <div class="rdm" data-tip="Numărul maxim de plasări corecte consecutive."><div class="rdml">Streak maxim corect</div><div class="rdmv">${m.maxConsecutiveCorrect??'—'}</div><div class="rdmu">consecutive</div></div>
      <div class="rdm" data-tip="Numărul maxim de greșeli consecutive."><div class="rdml">Streak maxim greșit</div><div class="rdmv">${m.maxConsecutiveWrong??'—'}</div><div class="rdmu">consecutive</div></div>
      <div class="rdm" data-tip="Echilibrul utilizării între mâna stângă și dreaptă [0–100%]."><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px"><div class="rdml" style="margin:0">Echilibru mâini</div><button class="minfo-btn" onclick="showMetricInfo('dominantHand')" title="Detalii">ⓘ</button></div><div class="rdmv">${m.handBalanceScore!=null?(m.handBalanceScore*100).toFixed(0)+'%':'—'}</div><div class="rdmu">%</div></div>
      <div class="rdm" data-tip="Numărul de plasări per mână (stângă / dreaptă)."><div class="rdml">Mâna stângă / dreaptă</div><div class="rdmv" style="font-size:18px">${m.leftHandCount??'—'} / ${m.rightHandCount??'—'}</div><div class="rdmu">plasări</div></div>
      <div class="rdm" data-tip="Diferența dintre scorul cognitiv al ultimei runde și primul scor al sesiunii."><div class="rdml">Îmbunătățire</div><div class="rdmv">${m.improvementRate!=null?((m.improvementRate>0?'+':'')+(m.improvementRate*100).toFixed(1)+'%'):'—'}</div><div class="rdmu">față de start</div></div>
      <div class="rdm" data-tip="Durata medie a unei runde complete (secunde)."><div class="rdml">Durată medie rundă</div><div class="rdmv">${m.avgRoundDuration!=null?m.avgRoundDuration.toFixed(0)+'s':'—'}</div><div class="rdmu">secunde</div></div>
      <div class="rdm" data-tip="Durata totală scursă de la start până la finalizarea sesiunii."><div class="rdml">Durată totală sesiune</div><div class="rdmv">${m.sessionDuration!=null?U.ft(Math.round(m.sessionDuration)):'—'}</div><div class="rdmu">timp</div></div>
    </div>
    <div class="card" style="margin-bottom:20px"><div class="ch"><div class="ct">Utilizare mâini</div></div><div class="cb">
      <div style="margin-bottom:12px"><div style="font-size:12px;color:var(--txd);margin-bottom:6px">Mâna dreaptă: <strong style="color:var(--tx)">${rh} acțiuni</strong></div>
        <div style="height:8px;background:var(--sf3);border-radius:4px;overflow:hidden"><div style="height:100%;background:var(--ac2);border-radius:4px;width:${tot>0?(rh/tot*100).toFixed(0):0}%;transition:width 1s ease"></div></div></div>
      <div><div style="font-size:12px;color:var(--txd);margin-bottom:6px">Mâna stângă: <strong style="color:var(--tx)">${lh} acțiuni</strong></div>
        <div style="height:8px;background:var(--sf3);border-radius:4px;overflow:hidden"><div style="height:100%;background:var(--pur);border-radius:4px;width:${tot>0?(lh/tot*100).toFixed(0):0}%;transition:width 1s ease"></div></div></div>
    </div></div>
    ${rnds.length>0?`<div class="card" style="margin-bottom:20px"><div class="ch"><div class="ct">Detaliu pe runde</div></div><div class="cb" style="padding:0">
      <table class="rtable"><thead><tr><th>Rundă</th><th>Durată</th><th>Corecte</th><th>Greșeli</th><th>Acuratețe</th></tr></thead><tbody>
      ${rnds.map(r=>`<tr><td style="color:var(--tx)">Runda ${r.roundNumber}</td><td>${r.duration!=null?U.ft(r.duration):'—'}</td><td style="color:var(--grn)">${r.correct??'—'}</td><td style="color:var(--red)">${r.wrong??'—'}</td><td>${r.correct!=null&&r.wrong!=null&&(r.correct+r.wrong)>0?((r.correct/(r.correct+r.wrong))*100).toFixed(0)+'%':'—'}</td></tr>`).join('')}
      </tbody></table></div></div>`:''}
    <div class="card"><div class="ch"><div class="ct">Note terapeut</div></div><div class="cb">
      <div style="background:var(--sf2);border:1px solid var(--bd);border-radius:var(--r);padding:13px;margin-bottom:12px">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:.07em;color:var(--txm);margin-bottom:7px">Observații</div>
        <textarea id="ntxt" style="width:100%;background:transparent;border:none;color:var(--tx);font-family:var(--mono);font-size:13px;resize:vertical;min-height:80px;outline:none" placeholder="Adaugă observații despre sesiune...">${U.esc(s.therapistNotes||'')}</textarea>
      </div>
      <div style="display:flex;gap:10px">
        <button class="btn btn-p btn-sm" id="bsn">💾 Salvează note</button>
        <button class="btn btn-g btn-sm" onclick="window.print()">🖨️ Printează</button>
      </div>
    </div></div>`;
    setTimeout(()=>{const e=document.getElementById('sb');if(e)e.style.width=Math.min(100,parseFloat(sc)||0)+'%';},300);
    document.getElementById('bsn').onclick=async()=>{const n=document.getElementById('ntxt').value.trim();await this.app.sess.updateSession(s.id,{therapistNotes:n});UI.toast('Note salvate.','success');};
  }
}

// ══════════════════════════════════════════════════════════════════════
// PATIENT EVOLUTION PAGE
// ══════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════
// EVOLUTION LIST PAGE — select patient → view evolution
// ══════════════════════════════════════════════════════════════════════
