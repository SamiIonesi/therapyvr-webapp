// ── Session Timer ─────────────────────────────────────────────────────
export class Timer{
  constructor(mins,onTick,onExpire){this._total=mins*60;this._el=0;this._run=false;this._iv=null;this._tick=onTick;this._exp=onExpire}
  get remaining(){return Math.max(0,this._total-this._el)}
  get elapsed(){return this._el}
  get running(){return this._run}
  start(){if(this._run)return;this._run=true;this._iv=setInterval(()=>{this._el++;this._tick(this.remaining,this._el);if(this.remaining===0){this.stop();this._exp?.();}},1000)}
  pause(){if(!this._run)return;this._run=false;clearInterval(this._iv);this._iv=null;this._tick(this.remaining,this._el)}
  resume(){this.start()}
  stop(){this._run=false;clearInterval(this._iv);this._iv=null}
  destroy(){this.stop()}
}


