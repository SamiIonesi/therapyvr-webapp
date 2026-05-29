// ── Router & Page Base ────────────────────────────────────────────────
export class Router{
  constructor(){this._ls=[]}
  navigate(page,params={}){this._current=page;this._params=params;this._ls.forEach(f=>f(page,params))}
  onNav(f){this._ls.push(f)}
  get current(){return this._current}
  get params(){return this._params}
}
export class Page{
  constructor(app){this.app=app;this._us=[]}
  render(el){el.innerHTML=this.html();this.mount()}
  html(){return''}mount(){}
  destroy(){this._us.forEach(u=>u?.());this._us=[]}
  _sub(u){this._us.push(u)}
}

// ══════════════════════════════════════════════════════════════════════
