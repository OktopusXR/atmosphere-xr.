import * as THREE from 'three';
// Very small, camera-peripheral wayfinding cue: only if art is out of view.
export function createDirectionCue(scene){
 const canvas=document.createElement('canvas');canvas.width=192;canvas.height=192;
 const ctx=canvas.getContext('2d'),texture=new THREE.CanvasTexture(canvas);
 const arrow=new THREE.Mesh(new THREE.PlaneGeometry(.14,.14),
  new THREE.MeshBasicMaterial({map:texture,transparent:true,opacity:.72,depthTest:false,depthWrite:false}));
 arrow.visible=false;arrow.renderOrder=190;scene.add(arrow);
 const eye=new THREE.Vector3(),q=new THREE.Quaternion(),local=new THREE.Vector3();
 const offset=new THREE.Vector3(.37,-.02,-1.5);
 let prev=-999;
 function draw(angle,back){
  ctx.clearRect(0,0,192,192);
  ctx.translate(96,96);ctx.rotate(-angle);
  ctx.strokeStyle='#ffffff';ctx.lineWidth=8;ctx.lineCap='round';ctx.lineJoin='round';
  ctx.beginPath();ctx.moveTo(0,54);ctx.lineTo(0,-43);
  ctx.moveTo(-24,-18);ctx.lineTo(0,-45);ctx.lineTo(24,-18);ctx.stroke();
  if(back){
   ctx.globalAlpha=.5;ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,4,64,.16*Math.PI,.84*Math.PI);ctx.stroke();
  }
  ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;texture.needsUpdate=true;
 }
 function update(camera,focus,enabled=true){
  arrow.visible=false;
  if(!enabled||!camera||!focus)return;
  camera.getWorldPosition(eye);camera.getWorldQuaternion(q);
  local.copy(focus).sub(eye).applyQuaternion(q.clone().invert());
  if(local.lengthSq()<.001)return;
  local.normalize();
  // No indicator when the artwork is within a comfortable central gaze cone.
  const heading=Math.atan2(local.x,-local.z);
  const elev=Math.atan2(local.y,Math.hypot(local.x,local.z));
  const back=local.z>0;
  if(!back&&Math.abs(heading)<.30&&Math.abs(elev)<.24)return;
  const angle=Math.atan2(Math.sin(heading),elev*.85);
  if(Math.abs(angle-prev)>.055||back!==update.previousBack){
   draw(angle,back);prev=angle;update.previousBack=back;
  }
  arrow.position.copy(eye).add(offset.clone().applyQuaternion(q));
  arrow.quaternion.copy(q);arrow.visible=true;
 }
 return {update,mesh:arrow};
}
