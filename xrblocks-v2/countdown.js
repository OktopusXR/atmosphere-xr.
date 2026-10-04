import * as THREE from 'three';
// Minimal temporal indicator — rendered in the XR world, peripheral to the gaze.
// Canvas is redrawn only when the remaining whole second changes.
export function createCountdown(scene,duration=402){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;
 const ctx=canvas.getContext('2d'),texture=new THREE.CanvasTexture(canvas);
 const label=new THREE.Mesh(new THREE.PlaneGeometry(.37,.093),
  new THREE.MeshBasicMaterial({
   map:texture,transparent:true,opacity:.72,depthTest:false,depthWrite:false,
   toneMapped:false
  }));
 label.renderOrder=180;label.visible=false;scene.add(label);
 const p=new THREE.Vector3(),q=new THREE.Quaternion(),
       offset=new THREE.Vector3(.47,.315,-1.58);
 let last=-1;
 function draw(seconds){
  ctx.clearRect(0,0,512,128);
  const min=String(Math.floor(seconds/60)).padStart(2,'0');
  const sec=String(seconds%60).padStart(2,'0');
  ctx.textAlign='right';
  ctx.font='600 58px Arial, sans-serif';
  ctx.fillStyle='rgba(255,255,255,.92)';
  ctx.fillText(min+':'+sec,493,81);
  ctx.font='bold 21px Arial, sans-serif';
  ctx.fillStyle='rgba(245,245,245,.70)';
  ctx.fillText('REMAINING',486,115);
  texture.needsUpdate=true;
 }
 function update(camera,t,visible=true){
  label.visible=!!(visible&&camera);
  if(!label.visible)return;
  const remaining=Math.max(0,Math.ceil(duration-Math.max(0,t||0)));
  if(remaining!==last){last=remaining;draw(remaining)}
  camera.getWorldPosition(p);camera.getWorldQuaternion(q);
  label.position.copy(p).add(offset.clone().applyQuaternion(q));
  label.quaternion.copy(q);
 }
 draw(duration);
 return {update,mesh:label};
}
