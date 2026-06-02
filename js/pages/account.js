// ── Account Page ──────────────────────────────────────────────────────
import { Page } from '../core/router.js';
import { U, ICONS } from '../utils.js';
import { UI } from '../core/ui.js';
import { doc, setDoc, getDoc, serverTimestamp } from '../config.js';

export class AccountPage extends Page{
  constructor(app){super(app);this._profile={};}
  html(){
    const u=this.app.auth.user;
    const email=u?.email||'';
    const name=u?.displayName||'Terapeut';
    const photo=u?.photoURL||null;
    const initials=(name.split(' ').map(w=>w[0]||'').join('').substring(0,2)||email.substring(0,2)).toUpperCase();
    const isGoogle=u?.providerData?.some(p=>p.providerId==='google.com');
    return`<div class="wrap">
      <div class="ph"><div class="pt">Cont</div><div class="ps">Profilul terapeutului</div></div>

        <!-- Profile header -->
        <div class="card" style="margin-bottom:16px">
          <div class="ch"><div class="ct">${ICONS.account} Profil</div></div>
          <div class="cb" style="display:flex;align-items:center;gap:20px;flex-wrap:wrap">
            <div style="position:relative;flex-shrink:0">
    			   	<div class="acc-avatar-big" style="width:72px;height:72px;overflow:hidden;font-size:22px" id="acc-av-preview">
    						${photo?`<img src="${photo}" style="width:100%;height:100%;object-fit:cover;border-radius:18px" onerror="this.parentElement.innerHTML='<span>${initials}</span>'">`:`<span>${initials}</span>`}
  					</div>
  					<label for="acc-photo-input" style="position:absolute;bottom:-4px;right:-4px;width:22px;height:22px;border-radius:50%;background:var(--ac);border:2px solid var(--sf);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .15s" title="Schimbă poza">
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
  					</label>
  					<input type="file" id="acc-photo-input" accept="image/*" style="display:none">
  					<div id="acc-photo-status" style="position:absolute;top:-4px;right:-4px;display:none"></div>
	</div>
            <div style="flex:1;min-width:0">
              <div style="font-size:20px;font-weight:800;margin-bottom:4px" id="acc-disp-name">${U.esc(name)}</div>
              <div style="font-size:13px;color:var(--txd);font-family:var(--mono);margin-bottom:10px">${U.esc(email)}</div>
              <div style="display:flex;gap:8px;flex-wrap:wrap">
                <span class="badge b-blue">Cont Terapeut Autorizat</span>
                ${isGoogle?'<span class="badge b-grn">✓ Google</span>':''}
              </div>
            </div>
          </div>
        </div>

        <!-- Editable profile -->
        <div class="card" style="margin-bottom:16px">
          <div class="ch">
            <div class="ct">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Date personale
            </div>
          </div>
          <div class="cb">
            <div class="fg" style="margin-bottom:14px">
              <div class="field">
                <label>Prenume</label>
                <input type="text" id="ap-fn" placeholder="Ion">
              </div>
              <div class="field">
                <label>Nume familie</label>
                <input type="text" id="ap-ln" placeholder="Popescu">
              </div>
            </div>
            <div class="fg" style="margin-bottom:14px">
              <div class="field">
                <label>Data nașterii</label>
                <input type="date" id="ap-dob">
              </div>
              <div class="field">
                <label>Sex</label>
                <select id="ap-gen">
                  <option value="">Nespecificat</option>
                  <option value="M">Masculin</option>
                  <option value="F">Feminin</option>
                </select>
              </div>
            </div>
            <div class="fg" style="margin-bottom:14px">
              <div class="field">
                <label>Telefon</label>
                <input type="tel" id="ap-tel" placeholder="07xx xxx xxx">
              </div>
              <div class="field">
                <label>Email de contact</label>
                <input type="email" id="ap-email2" placeholder="alternativ@email.com">
              </div>
            </div>
            <div class="field" style="margin-bottom:14px">
              <label>Adresă</label>
              <input type="text" id="ap-addr" placeholder="Str. Exemplu nr. 1, Iași">
            </div>
            <div class="fg" style="margin-bottom:0">
              <div class="field">
                <label>Specialitate</label>
                <select id="ap-spec">
                  <option value="">Selectează...</option>
                  <option value="Kinetoterapeut">Kinetoterapeut</option>
                  <option value="Terapeut ocupațional">Terapeut ocupațional</option>
                  <option value="Logoped">Logoped</option>
                  <option value="Neurolog">Neurolog</option>
                  <option value="Psiholog">Psiholog</option>
                  <option value="Medic recuperare">Medic recuperare</option>
                  <option value="Altele">Altele</option>
                </select>
              </div>
              <div class="field">
                <label>Instituție / Clinică</label>
                <input type="text" id="ap-inst" placeholder="Spitalul X, Iași">
              </div>
            </div>
          </div>
          <div class="cb" style="border-top:1px solid var(--bd);padding-top:14px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
            <span id="acc-save-status" style="font-size:12px;color:var(--txm)"></span>
            <button class="btn btn-p" id="acc-save" style="gap:8px">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              Salvează profilul
            </button>
          </div>
        </div>

        <!-- Auth info (read-only) -->
        <div class="card" style="margin-bottom:16px">
          <div class="ch"><div class="ct">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Informații cont
          </div></div>
          <div class="cb">
            <div class="acc-info-row">
              <div class="acc-field"><div class="acc-field-label">Email autentificare</div><div class="acc-field-val">${U.esc(email)}</div></div>
              <div class="acc-field"><div class="acc-field-label">Metodă login</div><div class="acc-field-val">${isGoogle?'Google OAuth':'Email / Parolă'}</div></div>
              <div class="acc-field"><div class="acc-field-label">Rol sistem</div><div class="acc-field-val">Terapeut</div></div>
              <div class="acc-field"><div class="acc-field-label">Aplicație</div><div class="acc-field-val">TherapyVR v1.0</div></div>
            </div>
          </div>
        </div>

        <!-- Logout -->
        <div class="card">
          <div class="ch"><div class="ct">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Sesiune
          </div></div>
          <div class="cb">
            <div style="padding:11px 14px;background:var(--sf2);border:1px solid var(--bd);border-radius:var(--r);margin-bottom:12px;font-size:13px;color:var(--txd)">
              Autentificat ca <strong style="color:var(--tx);font-family:var(--mono)">${U.esc(email)}</strong>
            </div>
            <p style="font-size:12px;color:var(--txm);margin-bottom:14px">La deconectare, un alt terapeut se poate autentifica din pagina de login.</p>
            <button class="btn btn-d" id="logout-acc" style="gap:8px">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Deconectare
            </button>
          </div>
        </div>

    </div>`;
  }
  async mount(){
    const uid=this.app.auth.user?.uid;
	// Photo upload
document.getElementById('acc-photo-input').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file || !uid) return;
  if (file.size > 5 * 1024 * 1024) { UI.toast('Poza trebuie să fie sub 5MB.', 'error'); return; }

  const status = document.getElementById('acc-photo-status');
  status.style.display = 'flex';
  status.innerHTML = '<div style="width:20px;height:20px;border:2px solid var(--ac);border-top-color:transparent;border-radius:50%;animation:spin .8s linear infinite"></div>';

  try {
    // Comprimă imaginea la 200x200px în canvas
    const url = await new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => {
        const SIZE = 200;
        const canvas = document.createElement('canvas');
        canvas.width = SIZE; canvas.height = SIZE;
        const ctx = canvas.getContext('2d');
        // Crop pătrat centrat
        const min = Math.min(img.width, img.height);
        const sx = (img.width - min) / 2, sy = (img.height - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, SIZE, SIZE);
        res(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.onerror = rej;
      img.src = URL.createObjectURL(file);
    });

    // Salvează base64 direct în Firestore
    await setDoc(doc(this.app.fb.db, 'therapists', uid), { photoURL: url, updatedAt: serverTimestamp() }, { merge: true });

    // Actualizează UI
    const preview = document.getElementById('acc-av-preview');
    if (preview) preview.innerHTML = `<img src="${url}" style="width:100%;height:100%;object-fit:cover;border-radius:18px">`;
    const navBtn = document.getElementById('btn-acc');
    if (navBtn) navBtn.innerHTML = `<img src="${url}" style="width:100%;height:100%;border-radius:8px;object-fit:cover">`;
    const pdAv = document.getElementById('pd-av');
    if (pdAv) pdAv.innerHTML = `<img src="${url}">`;

    status.style.display = 'none';
    UI.toast('Poză actualizată cu succes!', 'success');
  } catch (ex) {
    status.style.display = 'none';
    UI.toast('Eroare: ' + ex.message, 'error');
  }
});
    // Load existing profile from Firestore
    if(uid){
      try{
        const snap=await getDoc(doc(this.app.fb.db,'therapists',uid));
        if(snap.exists()){
          const p=snap.data();this._profile=p;
          this._fill(p);
        }
      }catch(e){console.warn('[AccountPage] load profile',e);}
    }
    // Save button
    document.getElementById('acc-save').onclick=async()=>{
      if(!uid){UI.toast('Nu ești autentificat.','error');return;}
      const btn=document.getElementById('acc-save'),st=document.getElementById('acc-save-status');
      btn.disabled=true;st.textContent='Se salvează...';
      const data={
        firstName:document.getElementById('ap-fn').value.trim()||null,
        lastName:document.getElementById('ap-ln').value.trim()||null,
        dateOfBirth:document.getElementById('ap-dob').value||null,
        gender:document.getElementById('ap-gen').value||null,
        phone:document.getElementById('ap-tel').value.trim()||null,
        email2:document.getElementById('ap-email2').value.trim()||null,
        address:document.getElementById('ap-addr').value.trim()||null,
        specialization:document.getElementById('ap-spec').value||null,
        institution:document.getElementById('ap-inst').value.trim()||null,
        updatedAt:serverTimestamp(),
      };
      try{
        await setDoc(doc(this.app.fb.db,'therapists',uid),data,{merge:true});
        // Update display name in header
        const dn=document.getElementById('acc-disp-name');
        const full=[data.firstName,data.lastName].filter(Boolean).join(' ');
        if(dn&&full)dn.textContent=full;
        st.textContent='✓ Salvat — '+new Date().toLocaleTimeString('ro-RO',{hour:'2-digit',minute:'2-digit'});
        UI.toast('Profil salvat cu succes.','success');
      }catch(e){st.textContent='Eroare: '+e.message;UI.toast('Eroare la salvare.','error');}
      btn.disabled=false;
    };
    // Logout
    document.getElementById('logout-acc').onclick=async()=>{
      if(this.app._dp?._active){UI.toast('Finalizați sesiunea înainte de deconectare.','error');return;}
      await this.app.auth.signOut();
    };
  }
  _fill(p){
    const set=(id,v)=>{const e=document.getElementById(id);if(e&&v!=null)e.value=v;};
    set('ap-fn',p.firstName);set('ap-ln',p.lastName);
    set('ap-dob',p.dateOfBirth);set('ap-gen',p.gender);
    set('ap-tel',p.phone);set('ap-email2',p.email2);
    set('ap-addr',p.address);set('ap-spec',p.specialization);
    set('ap-inst',p.institution);
    const st=document.getElementById('acc-save-status');
    if(st&&p.updatedAt)st.textContent='Ultima salvare: '+U.fdatetime(p.updatedAt);
    if(p.photoURL){
  	 const preview=document.getElementById('acc-av-preview');
  	 if(preview)preview.innerHTML=`<img src="${p.photoURL}" style="width:100%;height:100%;object-fit:cover;border-radius:18px">`;
  	 const navBtn=document.getElementById('btn-acc');
  	 if(navBtn)navBtn.innerHTML=`<img src="${p.photoURL}" style="width:100%;height:100%;border-radius:8px;object-fit:cover">`;
  	 const pdAv=document.getElementById('pd-av');
 	 if(pdAv)pdAv.innerHTML=`<img src="${p.photoURL}">`;
}
  }
}

// ══════════════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════════════
