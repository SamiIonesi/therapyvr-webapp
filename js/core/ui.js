// ── UI Manager (Toast + Modal) ────────────────────────────────────────
import { U } from '../utils.js';
export class UI{
  static toast(msg,type='info'){
    const icons={success:'✅',error:'❌',info:'ℹ️',warn:'⚠️'};
    const el=document.createElement('div');el.className=`toast ${type}`;
    el.innerHTML=`<span>${icons[type]||''}</span><span>${U.esc(msg)}</span>`;
    document.getElementById('toast-root').appendChild(el);
    setTimeout(()=>el.remove(),4000);
  }
  static modal(title,bodyHtml,confirmLabel,onConfirm,cls='btn-d'){
    document.getElementById('modal-root').innerHTML=`<div class="mo" id="mo"><div class="modal"><div class="mt">${U.esc(title)}</div><div class="mb">${bodyHtml}</div><div class="ma"><button class="btn btn-g btn-sm" onclick="document.getElementById('modal-root').innerHTML=''">Anulează</button><button class="btn ${cls} btn-sm" id="mc">${U.esc(confirmLabel)}</button></div></div></div>`;
    document.getElementById('mo').addEventListener('click',e=>{if(e.target===e.currentTarget)document.getElementById('modal-root').innerHTML='';});
    document.getElementById('mc').onclick=()=>{
      const fd={};
      document.getElementById('modal-root').querySelectorAll('input,select,textarea').forEach(el=>{if(el.id)fd[el.id]=el.value;});
      document.getElementById('modal-root').innerHTML='';
      onConfirm(fd);
    };
  }
}

// ── SESSION TIMER ─────────────────────────────────────────────────────
