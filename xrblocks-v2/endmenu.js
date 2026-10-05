import * as THREE from 'three';
// Shared V16 XR ending. Each selection is explicit; no 'click anywhere' replay.
export const MUSIC_LINKS={
 spotify:'https://open.spotify.com/track/7JTEfJqz2rBNOkRB7A9w4K',
 apple:'https://music.apple.com/us/album/atmosphere-single/6815019097',
 instagram:'https://www.instagram.com/oktopus.art/'
};
const items=[
 {id:'VR',label:'VOLVER A VER EN VR',sub:'EXPERIENCIA INMERSIVA'},
 {id:'MR',label:'VOLVER A VER EN MR',sub:'REALIDAD MIXTA'},
 {id:'spotify',label:'ESCUCHAR EN SPOTIFY',sub:'ATMOSPHERE · OKTOPUS ART STUDIO'},
 {id:'apple',label:'ESCUCHAR EN APPLE MUSIC',sub:'DOLBY ATMOS · SI ESTÁ DISPONIBLE'},
 {id:'instagram',label:'SEGUIR @OKTOPUS.ART',sub:'INSTAGRAM'}
];
export function createEndMenu(scene,onChoose){
 const c=document.createElement('canvas');c.width=1024;c.height=1180;
 const ctx=c.getContext('2d'),tex=new THREE.CanvasTexture(c);
 const panel=new THREE.Mesh(new THREE.PlaneGeometry(1.9,2.19),
  new THREE.MeshBasicMaterial({map:tex,transparent:true,depthTest:false,depthWrite:false,side:THREE.DoubleSide}));
 panel.visible=false;panel.renderOrder=250;scene.add(panel);
 const origin=new THREE.Vector3(),orientation=new THREE.Quaternion();
 const raycaster=new THREE.Raycaster(),inv=new THREE.Vector3();
 // One tiny pointer indicates exactly which action the right hand/ray is targeting.
 const cursor=new THREE.Mesh(new THREE.SphereGeometry(.018,8,6),
  new THREE.MeshBasicMaterial({color:0xffffff,depthTest:false,depthWrite:false}));
 cursor.renderOrder=265;cursor.visible=false;scene.add(cursor);
 const beamGeo=new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(),new THREE.Vector3()]);
 const beam=new THREE.Line(beamGeo,new THREE.LineBasicMaterial({
  color:0xffffff,transparent:true,opacity:.65,depthTest:false}));
 beam.renderOrder=260;beam.visible=false;scene.add(beam);
 const beamPts=beamGeo.getAttribute('position'),aimOrigin=new THREE.Vector3(),
  aimDir=new THREE.Vector3();
 function aimRay(start,dir){
  cursor.visible=false;beam.visible=false;
  if(!panel.visible)return false;
  panel.updateMatrixWorld(true);raycaster.set(start,dir.clone().normalize());
  const hit=raycaster.intersectObject(panel,false)[0];
  if(!hit)return false;
  cursor.position.copy(hit.point).addScaledVector(raycaster.ray.direction,-.015);
  cursor.visible=true;
  beamPts.setXYZ(0,start.x,start.y,start.z);
  beamPts.setXYZ(1,hit.point.x,hit.point.y,hit.point.z);
  beamPts.needsUpdate=true;beam.visible=true;return true;
 }

 const top=324,step=154,height=112,left=89,width=846;
 let busy=false;
 function draw(){
  ctx.clearRect(0,0,1024,1180);
  ctx.textAlign='center';ctx.fillStyle='#fff';ctx.font='bold 108px Arial';
  ctx.fillText('THE END',512,174);
  ctx.fillStyle='#ccc';ctx.font='bold 26px Arial';
  ctx.fillText('ATMOSPHERE · TECHNO POESIS',512,226);
  items.forEach((item,i)=>{
   const y=top+i*step;
   ctx.beginPath();ctx.roundRect(left,y,width,height,56);ctx.fillStyle='#101115';ctx.fill();
   ctx.strokeStyle='rgba(255,255,255,.4)';ctx.lineWidth=2;ctx.stroke();
   ctx.beginPath();ctx.arc(left+46,y+height/2,6,0,Math.PI*2);ctx.fillStyle=i<2?'#ed0075':'#aaaaaa';ctx.fill();
   ctx.textAlign='center';ctx.fillStyle='#fff';ctx.font='bold 40px Arial';
   ctx.fillText(item.label,512,y+49,750);
   ctx.fillStyle='#bcbcbc';ctx.font='bold 22px Arial';
   ctx.fillText(item.sub,512,y+83,750);
  });
  ctx.fillStyle='#888';ctx.font='22px Arial';ctx.textAlign='center';
  ctx.fillText('SELECCIONA CON PINZA O GATILLO',512,1155);
  tex.needsUpdate=true;
 }
 draw();
 const overlay=document.createElement('div');
 overlay.style.cssText='display:none;position:fixed;inset:0;z-index:185;background:#000f;overflow:auto;color:#fff;align-items:center;justify-content:center;flex-direction:column;padding:24px;gap:12px;font-family:Arial;text-align:center';
 const h=document.createElement('h1');h.textContent='THE END';h.style.cssText='font-size:clamp(48px,9vw,92px);margin:0 0 22px';overlay.appendChild(h);
 items.forEach(item=>{
  const btn=document.createElement('button');btn.textContent=item.label;
  btn.style.cssText='background:#111;color:#fff;border:1px solid #ccc;border-radius:999px;padding:16px 24px;min-height:52px;font:bold 16px Arial;width:min(460px,90vw)';
  btn.onclick=()=>choose(item.id);
  overlay.appendChild(btn);
 });
 document.body.appendChild(overlay);
 function choose(id){
  if(busy)return false;
  busy=true;onChoose(id);
  // Only guard against one gesture selecting multiple buttons.
  // The menu is hidden during XR session changes/replay.
  return true;
 }
 function show(visible,immersive=false){
  panel.visible=!!(visible&&immersive);
  overlay.style.display=visible&&!immersive?'flex':'none';
  if(!visible){busy=false;beam.visible=false;cursor.visible=false}
 }
 function update(camera){
  if(!panel.visible||!camera)return;
  camera.getWorldPosition(origin);camera.getWorldQuaternion(orientation);
  panel.position.copy(origin).add(new THREE.Vector3(0,0,-2.05).applyQuaternion(orientation));
  panel.quaternion.copy(orientation);
 }
 function selectPoint(point){
  if(!panel.visible)return false;
  panel.updateMatrixWorld(true);
  inv.copy(point);panel.worldToLocal(inv);
  if(Math.abs(inv.x)>0.95||Math.abs(inv.y)>1.095||Math.abs(inv.z)>.14)return false;
  const x=(inv.x/1.9+.5)*1024,y=(.5-inv.y/2.19)*1180;
  if(x<left||x>left+width)return false;
  const i=Math.floor((y-top)/step);
  if(i<0||i>=items.length||y>top+i*step+height)return false;
  return choose(items[i].id);
 }
 function selectRay(start,dir){
  if(!panel.visible)return false;
  panel.updateMatrixWorld(true);raycaster.set(start,dir.clone().normalize());
  const hit=raycaster.intersectObject(panel,false)[0];
  return hit?selectPoint(hit.point):false;
 }
 function reset(){busy=false}
 return {panel,overlay,show,update,aimRay,selectPoint,selectRay,reset};
}
