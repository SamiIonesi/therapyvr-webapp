// ── Shape 3D Preview System ──────────────────────────────────────────
import { makeCuboid, makeDiamondo, makeDoubleDiamond, makeHeart, makeHexagon, makePenta, makeRuby, makeSphereGem, makeSpiral, makeStar } from './geometry.js';

export const SHAPE_NAMES_RO={
  'Cuboid':'Cub','Diamondo':'Diamant','DoubleDiamond':'Diamant Dublu',
  'Heart':'Inimă','Hexagon':'Hexagon','Penta':'Pentagon',
  'Ruby':'Rubin','SphereGem':'Sferă','Spiral':'Spirală','Star':'Stea'
};
export const SHAPE_GEO_MAP={
  'Cuboid':makeCuboid,'Diamondo':makeDiamondo,'DoubleDiamond':makeDoubleDiamond,
  'Heart':makeHeart,'Hexagon':makeHexagon,'Penta':makePenta,
  'Ruby':makeRuby,'SphereGem':makeSphereGem,'Spiral':makeSpiral,'Star':makeStar
};

export const COLOR_NAMES_RO={
  'blue':'Albastru','orange':'Portocaliu','pink':'Roz',
  'purple':'Mov','turquoise':'Turcoaz','yellow':'Galben'
};

export const COLOR_HEX={
  'blue':'#4d9fff','orange':'#f59e0b','pink':'#ec4899',
  'purple':'#9f7aea','turquoise':'#0d9488','yellow':'#eab308'
};

let _shapeTooltipEl=null,_shapeTooltipR=null,_shapeTooltipRaf=null;

export function shapeRoName(en){
  return SHAPE_NAMES_RO[en] || COLOR_NAMES_RO[en] || en;
}

export function showShapePreview(shapeName,anchorEl){
  if(!shapeName||shapeName==='—')return;
if(COLOR_HEX[shapeName]){
  hideShapePreview();
  const tt=document.createElement('div');
  tt.id='shape-tooltip';
  tt.style.cssText='position:fixed;z-index:9999;background:rgba(6,13,26,.97);border:1px solid #243d60;border-radius:12px;padding:14px;pointer-events:none;box-shadow:0 8px 32px rgba(0,0,0,.7);text-align:center';
  tt.innerHTML=`<div style="width:80px;height:80px;border-radius:10px;background:${COLOR_HEX[shapeName]};margin:0 auto;box-shadow:0 0 20px ${COLOR_HEX[shapeName]}66"></div><div style="font-size:11px;color:#7ec8ff;margin-top:8px;font-weight:700;font-family:sans-serif;letter-spacing:.05em">${(COLOR_NAMES_RO[shapeName]||shapeName).toUpperCase()}</div>`;
  document.body.appendChild(tt);
  _shapeTooltipEl=tt;
  const rect=anchorEl.getBoundingClientRect();
  tt.style.left=Math.max(8,rect.left+rect.width/2-54)+'px';
  tt.style.top=Math.max(8,rect.top-160)+'px';
  return;
}
if(!SHAPE_GEO_MAP[shapeName])return;
  hideShapePreview();
  const tt=document.createElement('div');
  tt.id='shape-tooltip';
  tt.style.cssText='position:fixed;z-index:9999;background:rgba(6,13,26,.97);border:1px solid #243d60;border-radius:12px;padding:10px;pointer-events:none;box-shadow:0 8px 32px rgba(0,0,0,.7)';
  const cv=document.createElement('canvas');cv.width=120;cv.height=120;
  const lbl=document.createElement('div');
  lbl.style.cssText='font-size:11px;text-align:center;color:#7ec8ff;margin-top:6px;font-weight:700;font-family:sans-serif;letter-spacing:.05em';
  lbl.textContent=shapeRoName(shapeName).toUpperCase();
  tt.appendChild(cv);tt.appendChild(lbl);
  document.body.appendChild(tt);
  _shapeTooltipEl=tt;
  // Position near anchor
  const rect=anchorEl.getBoundingClientRect();
  const tx=rect.left+rect.width/2-70;
  const ty=rect.top-160;
  tt.style.left=Math.max(8,tx)+'px';
  tt.style.top=Math.max(8,ty)+'px';
  // Three.js render
  if(typeof THREE==='undefined')return;
  const renderer=new THREE.WebGLRenderer({canvas:cv,alpha:true,antialias:true});
  renderer.setSize(120,120);renderer.setPixelRatio(window.devicePixelRatio||1);renderer.setClearColor(0,0);
  const scene=new THREE.Scene();
  const cam=new THREE.PerspectiveCamera(38,1,0.1,100);
  cam.position.set(0,0.6,4.5);cam.lookAt(0,0.2,0);
  const geo=SHAPE_GEO_MAP[shapeName]();
  const mat=new THREE.MeshLambertMaterial({color:0x1a6fc8,emissive:0x0a2a55,side:THREE.FrontSide});
  const edgeMat=new THREE.LineBasicMaterial({color:0x7ec8ff,transparent:true,opacity:0.28});
  const group=new THREE.Group();
  group.add(new THREE.Mesh(geo,mat));
  group.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo),edgeMat));
  scene.add(group);
  scene.add(new THREE.AmbientLight(0x112244,0.8));
  const key=new THREE.DirectionalLight(0xffffff,1.1);key.position.set(2,3,2);scene.add(key);
  const fill=new THREE.DirectionalLight(0x4488ff,0.4);fill.position.set(-2,0,-1);scene.add(fill);
  _shapeTooltipR=renderer;
  (function anim(){_shapeTooltipRaf=requestAnimationFrame(anim);group.rotation.y+=0.0025;renderer.render(scene,cam);})();
}

export function hideShapePreview(){
  if(_shapeTooltipRaf){cancelAnimationFrame(_shapeTooltipRaf);_shapeTooltipRaf=null;}
  if(_shapeTooltipR){_shapeTooltipR.dispose();_shapeTooltipR=null;}
  if(_shapeTooltipEl){_shapeTooltipEl.remove();_shapeTooltipEl=null;}
}

// Helper: wrap a shape name element with hover preview
export function wrapShapeEl(el, getNameFn) {
  if (!el) return;
  if (el._shapeWrapped) {
    el._getShapeName = getNameFn; // actualizează getter-ul, nu mai ieși
    return;
  }
  el._shapeWrapped = true;
  el._getShapeName = getNameFn;
  el.style.cursor = 'help';
  el.addEventListener('mouseenter', () => showShapePreview(el._getShapeName(), el));
  el.addEventListener('mouseleave', hideShapePreview);
}


// Expose shape preview functions globally for inline handlers
window.showShapePreview=showShapePreview;
window.hideShapePreview=hideShapePreview;
window.shapeRoName=shapeRoName;

