// ── Login Page ────────────────────────────────────────────────────────
import { Page } from '../core/router.js';
import { U } from '../utils.js';

export class LoginPage extends Page{
  html(){return`<div class="login-screen"><div class="login-card">
    <div class="login-logo"><svg width="30" height="30" viewBox="0 0 28 28" fill="none"><rect width="28" height="28" rx="7" fill="rgba(77,159,255,.15)"/><path d="M14 5C9.03 5 5 9.03 5 14s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9z" stroke="#7ec8ff" stroke-width="1.5" fill="none"/><path d="M10 14h8M14 10v8" stroke="#7ec8ff" stroke-width="2" stroke-linecap="round"/></svg><span style="font-size:22px;font-weight:800;color:var(--ac2)">TherapyVR</span></div>
    <div style="font-size:20px;font-weight:700;margin-bottom:4px">Bun venit</div>
    <div style="font-size:13px;color:var(--txd);margin-bottom:20px">Autentifică-te pentru a accesa sistemul</div>
    <button class="btn btn-g btn-lg" style="width:100%;gap:10px;margin-bottom:4px" id="lbg"><svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg> Continuă cu Google</button>
    <div style="display:flex;align-items:center;gap:12px;margin:12px 0"><div style="flex:1;height:1px;background:var(--bd)"></div><span style="font-size:11px;color:var(--txm)">sau cu email</span><div style="flex:1;height:1px;background:var(--bd)"></div></div>
    <div class="field"><label>Email</label><input type="email" id="le" placeholder="terapeut@therapyvr.com" autocomplete="email"></div>
    <div class="field"><label>Parolă</label><input type="password" id="lp" placeholder="••••••••" autocomplete="current-password"></div>
    <button class="btn btn-p btn-lg" style="width:100%" id="lb">Autentificare</button>
    <div class="login-err" id="lerr"></div>
  </div></div>`}
  mount(){
    const go=async()=>{
      const e=document.getElementById('le').value.trim(),p=document.getElementById('lp').value,err=document.getElementById('lerr'),btn=document.getElementById('lb');
      err.style.display='none';btn.textContent='Se autentifică...';btn.disabled=true;
      try{await this.app.auth.signIn(e,p);}
      catch(ex){err.style.display='block';err.textContent=this._err(ex.code);btn.textContent='Autentificare';btn.disabled=false;}
    };
    document.getElementById('lb').onclick=go;
    document.getElementById('lp').onkeydown=e=>{if(e.key==='Enter')go()};
    document.getElementById('lbg')?.addEventListener('click',async()=>{
      const btn=document.getElementById('lbg'),err=document.getElementById('lerr');
      err.style.display='none';btn.disabled=true;btn.textContent='Se conectează...';
      try{await this.app.auth.signInGoogle();}
      catch(ex){
        err.style.display='block';
        err.textContent=ex.code==='auth/popup-closed-by-user'?'Fereastra a fost închisă.':ex.code==='auth/unauthorized-domain'?'Domeniu neautorizat — activează localhost în Firebase Console.':'Eroare Google: '+ex.message;
        btn.disabled=false;btn.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/></svg> Continuă cu Google';
      }
    });
  }
  _err(c){const m={'auth/invalid-credential':'Credențiale incorecte.','auth/user-not-found':'Utilizatorul nu există.','auth/wrong-password':'Parolă incorectă.','auth/invalid-email':'Email invalid.','auth/too-many-requests':'Prea multe încercări.'};return m[c]||'Eroare autentificare.'}
}

// ══════════════════════════════════════════════════════════════════════
// DASHBOARD PAGE
// ══════════════════════════════════════════════════════════════════════
