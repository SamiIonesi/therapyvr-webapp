// ── Evolution Pages (List + Patient) ──────────────────────────────────
import { Page } from '../core/router.js';
import { U, ICONS } from '../utils.js';
import { shapeRoName, showShapePreview, hideShapePreview } from '../shapes/preview.js';

export class EvolutionListPage extends Page{
  constructor(app,p){super(app);this._pts=[];this._f='';}
  html(){return`<div class="wrap">
    <div class="ph"><div class="pt">Evoluție pacienți</div><div class="ps">Selectează un pacient pentru a vedea graficele de evoluție</div></div>
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;flex-wrap:wrap">
      <input class="sbar" id="evsearch" placeholder="Caută după nume sau diagnostic..." type="text">
      <span id="evcnt" style="font-size:12px;color:var(--txd);font-family:var(--mono);margin-left:auto"></span>
    </div>
    <div class="pgrid" id="evgrid"><div style="color:var(--txm);font-size:13px">Se încarcă...</div></div>
  </div>`;}
  mount(){
    document.getElementById('evsearch').oninput=e=>{this._f=e.target.value.toLowerCase();this._rg();};
    this._sub(this.app.patients.onPatients(pts=>{this._pts=pts.sort((a,b)=>U.fname(a).localeCompare(U.fname(b)));this._rg();}));
  }
  _rg(){
    const g=document.getElementById('evgrid');if(!g)return;
    const fil=this._pts.filter(p=>U.fname(p).toLowerCase().includes(this._f)||(p.diagnosis||'').toLowerCase().includes(this._f));
    const cnt=document.getElementById('evcnt');if(cnt)cnt.textContent=fil.length+' pacienți';
    if(!fil.length){g.innerHTML=`<div class="empty"><div class="empty-icon">📈</div><div class="empty-t">Niciun pacient găsit</div></div>`;return;}
    g.innerHTML=fil.map(p=>{
      const age=p.dateOfBirth?U.age(p.dateOfBirth):null;
      return`<div class="pcard" data-id="${p.id}" style="cursor:pointer">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
          <div class="pav">${U.fini(p)}</div>
          <div>
            <div style="font-size:15px;font-weight:700">${U.esc(U.fname(p))}</div>
            <div style="font-size:11px;color:var(--txd)">${U.esc(p.diagnosis||'Fără diagnostic')}</div>
          </div>
        </div>
        <div style="display:flex;gap:12px;font-size:12px;color:var(--txd);margin-bottom:12px;flex-wrap:wrap">
          ${age!==null?`<span>🎂 ${age} ani</span>`:''}
          ${p.recommendedLevel?`<span>📋 Nivel ${p.recommendedLevel}</span>`:''}
        </div>
        <button class="btn btn-p btn-sm" style="width:100%;gap:8px">
          ${ICONS.evolution} Vezi evoluție
        </button>
      </div>`;
    }).join('');
    g.querySelectorAll('.pcard').forEach(card=>{
      card.onclick=()=>{
        const p=this._pts.find(x=>x.id===card.dataset.id);
        if(p)this.app.router.navigate('patient-evolution',{patient:p});
      };
    });
  }
}

export class PatientEvolutionPage extends Page{
  constructor(app,p){super(app);this._pat=p.patient;this._chart=null;this._idx=0;this._data=[];this._labels=[];this._allData=[];this._range=null;}
  html(){
    const p=this._pat;
    return`<div class="wrap">
      <div class="ph" style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
        <button class="btn btn-g btn-sm" id="bevk">← Înapoi</button>
        <div><div class="pt">Evoluție — ${U.esc(U.fname(p))}</div>
        <div class="ps">${U.esc(p.diagnosis||'Fără diagnostic')}${p.dateOfBirth?' · '+U.age(p.dateOfBirth)+' ani':''}</div></div>
      </div>
      <div id="evStats" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:24px"></div>
      <div id="evEmpty" style="display:none;text-align:center;padding:80px 20px;color:var(--txd)">
        <div style="font-size:52px;margin-bottom:14px">📊</div>
        <div style="font-size:17px;font-weight:600;color:var(--tx)">Nicio sesiune finalizată</div>
        <div style="font-size:13px;margin-top:8px">Datele de evoluție apar după prima sesiune completă.</div>
      </div>
      <div id="evChartWrap" style="display:none">
        <!-- CHANGE 4: Time range + Refresh toolbar -->
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap">
          <div style="font-size:11px;color:var(--txm);text-transform:uppercase;letter-spacing:.08em;font-weight:700">Interval</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap" id="evRangeChips">
            <button class="chip active" data-range="all">Tot istoricul</button>
            <button class="chip" data-range="90">Ultimele 90 zile</button>
            <button class="chip" data-range="30">Ultima lună</button>
            <button class="chip" data-range="7">Ultima săptămână</button>
          </div>
          <button id="evRefresh" class="btn btn-g btn-sm" style="margin-left:auto;gap:7px" title="Reîncarcă datele din Firebase">
            <svg id="evRefreshIcon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
            Refresh
          </button>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
          <button id="evPrev" class="btn btn-g" style="width:52px;height:52px;font-size:26px;padding:0;border-radius:50%;flex-shrink:0">‹</button>
          <div style="text-align:center;flex:1;padding:0 16px">
            <div style="display:flex;align-items:center;justify-content:center;gap:0">
              <div id="evTitle" style="font-size:18px;font-weight:700;color:var(--tx)"></div>
              <i class="ev-info" id="evInfo" data-tip="">ℹ</i>
            </div>
            <div id="evCounter" style="font-size:11px;color:var(--txm);margin-top:4px">— / 10</div>
          </div>
          <button id="evNext" class="btn btn-g" style="width:52px;height:52px;font-size:26px;padding:0;border-radius:50%;flex-shrink:0">›</button>
        </div>
        <div class="card"><div class="cb" style="padding:24px 20px">
          
          <div style="position:relative;height:400px;width:100%"><canvas id="evCanvas"></canvas></div>
        </div></div>
        <div id="evDots" style="display:flex;justify-content:center;gap:8px;margin-top:16px;flex-wrap:wrap"></div>
      </div>
    </div>`;
  }
  async mount(){
    document.getElementById('bevk').onclick=()=>this.app.router.navigate('evolution');
    document.getElementById('evPrev').onclick=()=>this._nav(-1);
    document.getElementById('evNext').onclick=()=>this._nav(1);
    // CHANGE 4: time range chips
    document.querySelectorAll('[data-range]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        document.querySelectorAll('[data-range]').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        this._range=btn.dataset.range==='all'?null:parseInt(btn.dataset.range);
        this._applyRange();
      });
    });
    // CHANGE 4: refresh button
    document.getElementById('evRefresh').addEventListener('click',async()=>{
      const icon=document.getElementById('evRefreshIcon');
      icon.style.animation='spin 0.8s linear infinite';
      await this._load();
      icon.style.animation='';
    });
    await this._load();
  }
  _applyRange(){
    if(!this._allData)return;
    if(!this._range){
      this._data=[...this._allData];
    }else{
      const cutoff=Date.now()-this._range*24*60*60*1000;
      this._data=this._allData.filter(d=>{
        const ts=d.startTime?.toDate?.()?.getTime()||d.startTime?.seconds*1000||0;
        return ts>=cutoff;
      });
    }
    this._labels=this._data.map(d=>{const dt=d.startTime?.toDate?.();return dt?dt.toLocaleDateString('ro-RO',{day:'2-digit',month:'short'}):'-';});
    if(!this._data.length){
      document.getElementById('evEmpty').style.display='block';
      document.getElementById('evChartWrap').style.display='none';
    }else{
      document.getElementById('evEmpty').style.display='none';
      document.getElementById('evChartWrap').style.display='block';
      this._renderStats();this._renderDots();this._showChart(this._idx);
    }
  }
  async _load(){
    try{
      const sessions=await this.app.sess.sessionsForPatient(this._pat.id);
      if(!sessions.length){document.getElementById('evEmpty').style.display='block';return;}
      const metricsArr=await Promise.all(sessions.map(s=>this.app.sess.getMetrics(s.id).catch(()=>null)));
      this._allData=sessions.map((s,i)=>({...s,...(metricsArr[i]||{})})).filter(s=>s.cognitiveScore!=null).sort((a,b)=>(a.startTime?.seconds||0)-(b.startTime?.seconds||0));
      this._applyRange();
    }catch(e){console.error('[PatientEvolution]',e);}
  }
  _nav(dir){this._idx=(this._idx+dir+10)%10;this._showChart(this._idx);}
  _renderDots(){
    const c=document.getElementById('evDots');
    c.innerHTML=Array.from({length:10},(_,i)=>`<div class="evdot" data-i="${i}" style="height:8px;border-radius:4px;cursor:pointer;transition:all .2s;background:var(--bd);width:8px"></div>`).join('');
    c.querySelectorAll('.evdot').forEach(d=>{d.onclick=()=>this._showChart(parseInt(d.dataset.i));});
  }
  _updateDots(idx){document.querySelectorAll('.evdot').forEach((d,i)=>{d.style.background=i===idx?'var(--ac)':'var(--bd)';d.style.width=i===idx?'28px':'8px';});}
  _goToSession(dataIdx){const s=this._data[dataIdx];if(!s)return;this.app.router.navigate('report-detail',{session:s,patient:this._pat,returnPatientId:this._pat.id,returnTo:'patient-evolution',returnPatient:this._pat});}
  _showChart(idx){
    this._idx=idx;
    const CHARTS=[
      {title:'Scor cognitiv în timp',sub:'Evoluția scorului sintetic [0–100] per sesiune. \n\nScorul combină acuratețe (40%), viteză de reacție (30%) și rata erorilor (30%). \n\n Creșterea indică recuperare terapeutică. \n\n Scăderea poate semnala oboseală sau deteriorare. \n\n Scor >80 → nivel crește; <60 → nivel scade.',n:'1'},
      {title:'Timp de reacție (s)',sub:'Viteza medie de procesare vizuo-spațială per sesiune, în secunde. \n\n Valori mici = procesare rapidă și fluentă. \n\n Valori mari = procesare îngreunată sau deficit cognitiv. \n\n Creșterea valorilor = oboseală sau deteriorare. \n\n Scăderea progresivă = îmbunătățire reală.',n:'2'},
      {title:'Utilizare mâini',sub:'Numărul de plasări per mână (stânga vs dreapta) per sesiune. \n\n Important post-AVC: identifică dacă pacientul evită mâna afectată. \n\n Echilibru ideal = distribuție apropiată între cele două mâini. \n\n Dominanța extremă a unei mâini poate indica compensare.',n:'3'},
      {title:'Progres nivel de dificultate',sub:'Nivelul de joc selectat per sesiune (1-3). \n\n Creșterea = progres terapeutic, pacientul a atins pragul de performanță. \n\n Scăderea = adaptare la dificultate după performanță slabă. \n\n Nivelul este ajustat automat după scorul cognitiv al sesiunii precedente.',n:'4'},
      {title:'Acuratețe și eficiență (%)',sub:'Acuratețea (plasări corecte din total) și eficiența (corecte din prima încercare), ambele în procente.  \n\n Acuratețe mare + eficiență mare = procesare bună, puțin impulsivă. \n\n Acuratețe mare + eficiență mică = reușește, dar cu multe corecturi. \n\n Creșterea ambelor = progres.',n:'5'},
      {title:'Rata erorilor (%)',sub:'Procentul plasărilor greșite per sesiune. \n\n Scăderea = îmbunătățire. \n\n Creșterea bruscă poate semnala oboseală, schimbare de nivel sau deteriorare. \n\n Rată mare + timp scurt = impulsivitate. \n\n Rată mare + timp lung = confuzie vizuo-spațială reală.',n:'6'},
      {title:'Runde complete per sesiune',sub:'Numărul de cicluri de 6 forme finalizate per sesiune. \n\n Creșterea = rezistență cognitivă mai bună, capacitate de concentrare susținută. \n\n Scăderea = posibilă oboseală sau sesiune mai scurtă. \n\n Raportați la durata sesiunii pentru context complet.',n:'7'},
      {title:'Echilibru mâini (%)',sub:'Cât de echilibrat utilizează pacientul ambele mâini, în procente (100% = perfect egal). \n\n Valori aproape de 100% indică recuperare bilaterală bună. \n\n Valori mici indică dominanță extremă a unei mâini — posibil compensare sau refuz de a folosi mâna afectată.',n:'8'},
      {title:'Îmbunătățire intra-sesiune',sub:'Diferența procentuală între scorul cognitiv al ultimei runde și primul scor din sesiune. \n\n Valori pozitive (verde) = pacientul s-a îmbunătățit pe parcursul sesiunii — efect de încălzire. \n\n Valori negative (roșu) = pacientul s-a deteriorat — semnal de oboseală cognitivă.',n:'9'},
      {title:'Durata medie rundă (s)',sub:'Timpul mediu necesar pentru a completa un ciclu de 6 forme, în secunde. \n\n Scăderea = îmbunătățire a vitezei de execuție. \n\n Creșterea bruscă = oboseală sau creștere a dificultății. \n\n Valori stabile = pacient consistent. \n\n Comparați cu nivelul de dificultate pentru context.',n:'10'},
    ];
    const ch=CHARTS[idx];
    document.getElementById('evTitle').textContent=ch.title;
    document.getElementById('evInfo').setAttribute('data-tip',ch.sub);
    document.getElementById('evCounter').textContent=`${ch.n} / 10`;
    this._updateDots(idx);
    if(this._chart){try{this._chart.destroy();}catch(_){}this._chart=null;}
    const ctx=document.getElementById('evCanvas').getContext('2d');
    const d=this._data,lb=this._labels;
    const clickHandler=(evt,els)=>{if(els&&els.length>0)this._goToSession(els[0].index);};
    const hoverHandler=(evt,els)=>{if(evt.native)evt.native.target.style.cursor=els&&els.length?'pointer':'default';};
    const base={responsive:true,maintainAspectRatio:false,animation:{duration:350},onClick:clickHandler,onHover:hoverHandler,plugins:{legend:{labels:{color:'#a0aec0',font:{size:12},padding:18,usePointStyle:true}},tooltip:{backgroundColor:'rgba(6,13,26,.96)',titleColor:'#e2e8f0',bodyColor:'#a0aec0',borderColor:'rgba(77,159,255,.3)',borderWidth:1,padding:12,callbacks:{title:items=>`Sesiune: ${lb[items[0].dataIndex]}`,afterBody:items=>`\n🖱 Click pentru raportul complet`}}},scales:{x:{ticks:{color:'#718096',font:{size:11},maxRotation:45},grid:{color:'rgba(255,255,255,.04)'}},y:{ticks:{color:'#718096',font:{size:11}},grid:{color:'rgba(255,255,255,.04)'}}}};
    const line=(datasets,yOpts)=>({type:'line',data:{labels:lb,datasets},options:{...base,scales:{...base.scales,y:{...base.scales.y,...(yOpts||{})}}}});
    if(idx===0){this._chart=new Chart(ctx,line([{label:'Scor cognitiv',data:d.map(x=>Math.round((x.cognitiveScore||0)*100)),borderColor:'#4d9fff',backgroundColor:'rgba(77,159,255,.15)',tension:.4,fill:true,pointBackgroundColor:'#4d9fff',pointRadius:6,pointHoverRadius:9,pointHitRadius:14}],{min:0,max:100,ticks:{...base.scales.y.ticks,callback:v=>v+'/100'}}));}
    else if(idx===1){this._chart=new Chart(ctx,line([{label:'Timp reacție (s)',data:d.map(x=>x.avgReactionTime!=null?+x.avgReactionTime.toFixed(2):null),borderColor:'#f6c90e',backgroundColor:'rgba(246,201,14,.12)',tension:.4,fill:false,pointBackgroundColor:'#f6c90e',pointRadius:6,pointHoverRadius:9,pointHitRadius:14,spanGaps:true}],{ticks:{...base.scales.y.ticks,callback:v=>v+'s'}}));}
    else if(idx===2){this._chart=new Chart(ctx,{type:'bar',data:{labels:lb,datasets:[{label:'Mâna stângă',data:d.map(x=>x.leftHandCount||0),backgroundColor:'rgba(77,159,255,.75)',borderRadius:5,hoverBackgroundColor:'rgba(77,159,255,1)'},{label:'Mâna dreaptă',data:d.map(x=>x.rightHandCount||0),backgroundColor:'rgba(72,199,142,.75)',borderRadius:5,hoverBackgroundColor:'rgba(72,199,142,1)'}]},options:{...base,scales:{x:{...base.scales.x,stacked:true},y:{...base.scales.y,stacked:true}}}});}
    else if(idx===3){this._chart=new Chart(ctx,{type:'line',data:{labels:lb,datasets:[{label:'Nivel',data:d.map(x=>x.level||1),borderColor:'#9f7aea',backgroundColor:'rgba(159,122,234,.15)',stepped:true,fill:true,pointBackgroundColor:'#9f7aea',pointRadius:6,pointHoverRadius:9,pointHitRadius:14}]},options:{...base,scales:{...base.scales,y:{...base.scales.y,min:0.5,max:3.5,ticks:{...base.scales.y.ticks,stepSize:1,callback:v=>v===1?'Nivel 1':v===2?'Nivel 2':v===3?'Nivel 3':''}}}}}); }
    else if(idx===4){this._chart=new Chart(ctx,line([{label:'Acuratețe %',data:d.map(x=>x.accuracy!=null?+(x.accuracy*100).toFixed(1):null),borderColor:'#48c78e',tension:.4,fill:false,pointBackgroundColor:'#48c78e',pointRadius:6,pointHoverRadius:9,pointHitRadius:14,spanGaps:true},{label:'Eficiență %',data:d.map(x=>x.efficiencyRate!=null?+(x.efficiencyRate*100).toFixed(1):null),borderColor:'#ff7043',tension:.4,fill:false,pointBackgroundColor:'#ff7043',pointRadius:6,pointHoverRadius:9,pointHitRadius:14,spanGaps:true}],{min:0,max:100,ticks:{...base.scales.y.ticks,callback:v=>v+'%'}}));}
    else if(idx===5){this._chart=new Chart(ctx,line([{label:'Rata erorilor %',data:d.map(x=>x.errorRate!=null?+(x.errorRate*100).toFixed(1):null),borderColor:'#fc5c65',backgroundColor:'rgba(252,92,101,.12)',tension:.4,fill:true,pointBackgroundColor:'#fc5c65',pointRadius:6,pointHoverRadius:9,pointHitRadius:14,spanGaps:true}],{min:0,max:100,ticks:{...base.scales.y.ticks,callback:v=>v+'%'}}));}
    else if(idx===6){this._chart=new Chart(ctx,{type:'bar',data:{labels:lb,datasets:[{label:'Runde complete',data:d.map(x=>x.roundsCompleted||0),backgroundColor:'rgba(77,159,255,.7)',borderRadius:6,hoverBackgroundColor:'rgba(77,159,255,1)'}]},options:{...base,scales:{...base.scales,y:{...base.scales.y,ticks:{...base.scales.y.ticks,stepSize:1}}}}});}
    else if(idx===7){this._chart=new Chart(ctx,line([{label:'Echilibru mâini %',data:d.map(x=>x.handBalanceScore!=null?+(x.handBalanceScore*100).toFixed(1):null),borderColor:'#26de81',backgroundColor:'rgba(38,222,129,.12)',tension:.4,fill:true,pointBackgroundColor:'#26de81',pointRadius:6,pointHoverRadius:9,pointHitRadius:14,spanGaps:true}],{min:0,max:100,ticks:{...base.scales.y.ticks,callback:v=>v+'%'}}));}
    else if(idx===8){const barData=d.map(x=>x.improvementRate!=null?+(x.improvementRate*100).toFixed(1):null);this._chart=new Chart(ctx,{type:'bar',data:{labels:lb,datasets:[{label:'Îmbunătățire intra-sesiune',data:barData,backgroundColor:barData.map(v=>v!=null&&v>=0?'rgba(72,199,142,.75)':'rgba(252,92,101,.75)'),borderRadius:5,hoverBackgroundColor:barData.map(v=>v!=null&&v>=0?'rgba(72,199,142,1)':'rgba(252,92,101,1)')}]},options:{...base,scales:{...base.scales,y:{...base.scales.y,ticks:{...base.scales.y.ticks,callback:v=>(v>0?'+':'')+v}}}}});}
    else if(idx===9){this._chart=new Chart(ctx,line([{label:'Durată medie rundă (s)',data:d.map(x=>x.avgRoundDuration!=null?+(x.avgRoundDuration).toFixed(1):null),borderColor:'#fd9644',backgroundColor:'rgba(253,150,68,.12)',tension:.4,fill:false,pointBackgroundColor:'#fd9644',pointRadius:6,pointHoverRadius:9,pointHitRadius:14,spanGaps:true}],{ticks:{...base.scales.y.ticks,callback:v=>v+'s'}}));}
  }
  _renderStats(){
    const d=this._data,total=d.length,totalTime=d.reduce((s,x)=>s+(x.elapsedSeconds||0),0);
    const avgScore=d.reduce((s,x)=>s+(x.cognitiveScore||0),0)/total;
    const bestScore=Math.max(...d.map(x=>x.cognitiveScore||0));
    const worstMap={};d.forEach(x=>{if(x.worstShape&&x.worstShape!=='—')worstMap[x.worstShape]=(worstMap[x.worstShape]||0)+1;});
    const worstShape=Object.keys(worstMap).sort((a,b)=>worstMap[b]-worstMap[a])[0]||'—';
    const STAT_DEFS=[
      {svg:ICONS.repeat,col:'var(--ac2)',label:'Total sesiuni',val:total},
      {svg:ICONS.clock,col:'var(--amb)',label:'Timp total',val:U.ft(totalTime)},
      {svg:ICONS.brain,col:'var(--pur)',label:'Scor mediu',val:Math.round(avgScore*100)+'/100'},
      {svg:ICONS.shapes,col:'var(--grn)',label:'Cel mai bun',val:Math.round(bestScore*100)+'/100'},
      {svg:ICONS.warn,col:'var(--red)',label:'Formă dificilă',val:shapeRoName(worstShape),rawName:worstShape},
    ];
    document.getElementById('evStats').innerHTML=STAT_DEFS.map(s=>`<div class="card"><div class="cb" style="padding:14px;text-align:center">
      <div style="width:36px;height:36px;border-radius:10px;background:rgba(255,255,255,.05);border:1px solid var(--bd);display:flex;align-items:center;justify-content:center;margin:0 auto 10px;color:${s.col}">${s.svg}</div>
      <div style="font-size:22px;font-weight:700;font-family:var(--mono);color:var(--ac2);${s.rawName&&s.rawName!=='—'?'cursor:help':''}" ${s.rawName&&s.rawName!=='—'?`onmouseenter="showShapePreview('${s.rawName}',this)" onmouseleave="hideShapePreview()"`:''}>
        ${s.val}
      </div>
      <div style="font-size:10px;color:var(--txm);margin-top:4px;text-transform:uppercase;letter-spacing:.06em">${s.label}</div>
    </div></div>`).join('');
  }
  destroy(){if(this._chart){try{this._chart.destroy();}catch(_){}}this._chart=null;super.destroy();}
}

// ══════════════════════════════════════════════════════════════════════
// ACCOUNT PAGE — full editable profile stored in Firestore therapists/{uid}
// ══════════════════════════════════════════════════════════════════════
