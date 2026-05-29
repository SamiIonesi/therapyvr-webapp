// ── Patient Form Page ─────────────────────────────────────────────────
import { Page } from '../core/router.js';
import { U } from '../utils.js';
import { UI } from '../core/ui.js';

export class PatientFormPage extends Page{
  constructor(app,params){super(app);this._mode=params?.mode||'add';this._p=params?.patient||null;}
  html(){
    const p=this._p||{},e=this._mode==='edit';
    const diags=['Post-AVC','Parkinson','Alzheimer','ADHD','Altele'];
    return`<div class="wrap">
      <div class="ph" style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
        <button class="btn btn-g btn-sm" id="bbk">← Înapoi</button>
        <div><div class="pt">${e?'Editare profil pacient':'Pacient nou'}</div><div class="ps">${e?'Actualizare date pentru '+U.esc(U.fname(p)):'Completați datele pacientului'}</div></div>
      </div>
      <div class="card">
        <div class="ch"><div class="ct">Date personale</div></div>
        <div class="cb">
          <div class="fg">
            <div class="field"><label>Prenume *</label><input type="text" id="ff" placeholder="Ion" value="${U.esc(p.firstName||'')}"></div>
            <div class="field"><label>Nume familie *</label><input type="text" id="fl" placeholder="Popescu" value="${U.esc(p.lastName||'')}"></div>
          </div>
          <div class="fg">
            <div class="field"><label>Data nașterii *</label><input type="date" id="fdob" value="${U.esc(p.dateOfBirth||'')}">
              <div class="age-disp" id="agedisp" style="${p.dateOfBirth?'':'display:none'}">📅 Vârstă: <strong id="ageval">${p.dateOfBirth?U.age(p.dateOfBirth)+' ani':''}</strong></div>
            </div>
            <div class="field"><label>Sex *</label><select id="fgen"><option value="">Nespecificat</option><option value="M" ${p.gender==='M'?'selected':''}>Masculin</option><option value="F" ${p.gender==='F'?'selected':''}>Feminin</option></select></div>
          </div>
        </div>
        <div class="ch"><div class="ct">Persoană de contact (aparținător)</div></div>
        <div class="cb">
          <div class="fg">
            <div class="field"><label>Nume aparținător</label><input type="text" id="fcn" placeholder="Maria Popescu (fiică)" value="${U.esc(p.contactName||'')}"></div>
            <div class="field"><label>Telefon aparținător</label><input type="tel" id="fcp" placeholder="07xx xxx xxx" value="${U.esc(p.contactPhone||'')}"></div>
          </div>
        </div>
        <div class="ch"><div class="ct">Informații medicale</div></div>
        <div class="cb">
          <div class="fg">
            <div class="field"><label>Diagnostic principal *</label><select id="fdiag"><option value="">Selectează...</option>${diags.map(d=>`<option ${p.diagnosis===d?'selected':''}>${d}</option>`).join('')}</select></div>
            <div class="field"><label>Mâna dominantă (pre-boală) *</label><select id="fdh"><option value="">Necunoscută</option><option value="right" ${p.dominantHand==='right'?'selected':''}>Dreaptă</option><option value="left" ${p.dominantHand==='left'?'selected':''}>Stângă</option></select></div>
          </div>
          <div class="field"><label>Detalii diagnostic / anamneză</label><textarea id="fdd" placeholder="Descriere detaliată...">${U.esc(p.diagnosisDetails||'')}</textarea></div>
          <div class="field"><label>Observații terapeut</label><textarea id="fn" placeholder="Observații comportamentale, recomandări...">${U.esc(p.notes||'')}</textarea></div>
          <div class="field" style="max-width:200px"><label>Nivel recomandat</label><select id="frl">${[1,2,3].map(l=>`<option value="${l}" ${p.recommendedLevel==l?'selected':''}>Nivel ${l}</option>`).join('')}</select></div>
        </div>
        <div class="cb" style="border-top:1px solid var(--bd);display:flex;gap:10px;justify-content:flex-end">
          <button class="btn btn-g" id="bcan">Anulează</button>
          <button class="btn btn-p btn-lg" id="bsave">${e?'💾 Salvează modificările':'✅ Adaugă pacient'}</button>
        </div>
      </div>
    </div>`
  }
  mount(){
    document.getElementById('bbk').onclick=()=>this.app.router.navigate('patients');
    document.getElementById('bcan').onclick=()=>this.app.router.navigate('patients');
    document.getElementById('fdob').onchange=e=>{const v=e.target.value,d=document.getElementById('agedisp'),a=document.getElementById('ageval');if(v){d.style.display='inline-flex';a.textContent=U.age(v)+' ani';}else d.style.display='none';};
    document.getElementById('bsave').onclick=()=>this._save();
  }
  async _save(){
    const fn=document.getElementById('ff').value.trim(),ln=document.getElementById('fl').value.trim();
    const dob=document.getElementById('fdob').value;
    const gender=document.getElementById('fgen').value;
    const diag=document.getElementById('fdiag').value;
    const dh=document.getElementById('fdh').value;
    // Highlight missing fields and show specific error
    const missing=[];
    if(!fn)missing.push('Prenume');
    if(!ln)missing.push('Nume familie');
    if(!dob)missing.push('Data nașterii');
    if(!gender)missing.push('Sex');
    if(!diag)missing.push('Diagnostic principal');
    if(!dh)missing.push('Mâna dominantă');
    if(missing.length){
      // Highlight empty required fields
      const fieldMap={'Prenume':'ff','Nume familie':'fl','Data nașterii':'fdob','Sex':'fgen','Diagnostic principal':'fdiag','Mâna dominantă':'fdh'};
      missing.forEach(f=>{const el=document.getElementById(fieldMap[f]);if(el){el.style.borderColor='var(--red)';el.addEventListener('input',()=>el.style.borderColor='',{once:true});}});
      UI.toast('Câmpuri obligatorii lipsă: '+missing.join(', '),'error');
      return;
    }
    const btn=document.getElementById('bsave');btn.disabled=true;btn.textContent='Se salvează...';
    const data={firstName:fn,lastName:ln,dateOfBirth:document.getElementById('fdob').value||null,gender:document.getElementById('fgen').value||null,contactName:document.getElementById('fcn').value.trim()||null,contactPhone:document.getElementById('fcp').value.trim()||null,diagnosis:document.getElementById('fdiag').value||null,dominantHand:document.getElementById('fdh').value||null,diagnosisDetails:document.getElementById('fdd').value.trim()||null,notes:document.getElementById('fn').value.trim()||null,recommendedLevel:parseInt(document.getElementById('frl').value)||1};
    try{
      if(this._mode==='edit'&&this._p)await this.app.patients.update(this._p.id,data);
      else await this.app.patients.create(data);
      UI.toast(this._mode==='edit'?'Pacient actualizat.':'Pacient adăugat.','success');
      this.app.router.navigate('patients');
    }catch(e){UI.toast('Eroare: '+e.message,'error');btn.disabled=false;btn.textContent=this._mode==='edit'?'💾 Salvează':'✅ Adaugă pacient';}
  }
}

// ══════════════════════════════════════════════════════════════════════
// REPORTS PAGE
// ══════════════════════════════════════════════════════════════════════
