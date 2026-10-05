import * as THREE from 'three';
// Peripheral gaze cue. If the viewer ignores it, it pulses and points to an eye icon.
export function createDirectionCue(scene){
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
 const ctx=canvas.getContext('2d'),texture=new THREE.CanvasTexture(canvas);
 const mat=new THREE.MeshBasicMaterial({map:texture,transparent:true,opacity:.62,depthTest:false,depthWrite:false});
 const arrow=new THREE.Mesh(new THREE.PlaneGeometry(.145,.145),mat);
 arrow.visible=false;arrow.renderOrder=190;scene.add(arrow);
 const eye=new THREE.Vector3(),q=new THREE.Quaternion(),local=new THREE.Vector3();
 const offset=new THREE.Vector3(.42,-.10,-1.45);
 let prev=-999,shownAt=0,wasVisible=false;
 function draw(angle,back){
  ctx.clearRect(0,0,256,256);
  ctx.save();ctx.translate(128,128);ctx.rotate(angle);
  ctx.strokeStyle='#fff';ctx.lineWidth=5;ctx.lineCap='round';ctx.lineJoin='round';
  // shaft stops at the eye; arrowhead visually targets it.
  ctx.beginPath();ctx.moveTo(0,54);ctx.lineTo(0,-40);
  ctx.moveTo(-17,-22);ctx.lineTo(0,-42);ctx.lineTo(17,-22);ctx.stroke();
  // eye icon at the destination point.
  ctx.beginPath();ctx.moveTo(-25,-70);ctx.quadraticCurveTo(0,-91,25,-70);
  ctx.quadraticCurveTo(0,-49,-25,-70);ctx.stroke();
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(0,-70,5.5,0,Math.PI*2);ctx.fill();
  if(back){ctx.globalAlpha=.48;ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,8,75,.15*Math.PI,.85*Math.PI);ctx.stroke();}
  ctx.restore();texture.needsUpdate=true;
 }
 function update(camera,focus,enabled=true){
  arrow.visible=false;
  if(!enabled||!camera||!focus){wasVisible=false;return}
  camera.getWorldPosition(eye);camera.getWorldQuaternion(q);
  local.copy(focus).sub(eye).applyQuaternion(q.clone().invert());
  if(local.lengthSq()<.001){wasVisible=false;return}
  local.normalize();
  const heading=Math.atan2(local.x,-local.z);
  const elev=Math.atan2(local.y,Math.hypot(local.x,local.z));
  const back=local.z>0;
  // Looking toward the intended point immediately dismisses the cue.
  if(!back&&Math.abs(heading)<.30&&Math.abs(elev)<.24){wasVisible=false;return}
  const angle=Math.atan2(Math.sin(heading),elev*.85);
  if(Math.abs(angle-prev)>.045||back!==update.previousBack){draw(angle,back);prev=angle;update.previousBack=back}
  if(!wasVisible){shownAt=performance.now();wasVisible=true}
  const ignored=(performance.now()-shownAt)>900;
  // Gentle CTA pulse only after the viewer has ignored the direction.
  const pulse=ignored?.52+.43*(.5+.5*Math.sin(performance.now()*.010)):.66;
  const scale=ignored?1+.10*(.5+.5*Math.sin(performance.now()*.010)):1;
  mat.opacity=pulse;arrow.scale.setScalar(scale);
  arrow.position.copy(eye).add(offset.clone().applyQuaternion(q));
  arrow.quaternion.copy(q);arrow.visible=true;
 }
 return {update,mesh:arrow};
}
