import * as THREE from 'three';
// ATMOSPHERE / WATCH V6 - one wearable interface for XR Blocks and Quest.
// All controller and hand interactions map into the same watch canvas coordinates.
export function createWatch(scene,controls,onMode){
 const size={w:.255,h:.337};
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=676;
 const cx=canvas.getContext('2d'),texture=new THREE.CanvasTexture(canvas);
 const watch=new THREE.Mesh(new THREE.PlaneGeometry(size.w,size.h),
  new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,depthTest:false,side:THREE.DoubleSide}));
 watch.renderOrder=300;watch.visible=false;scene.add(watch);
 const rows=[
  {key:'intensity',label:'LIGHT',min:.25,max:2},
  {key:'density',label:'DENSITY',min:.16,max:1},
  {key:'scale',label:'SCALE',min:.5,max:1.9},
  {key:'motion',label:'MOTION',min:.1,max:1.8},
  {key:'speed',label:'SPEED',min:.1,max:2},
  {key:'variation',label:'MUTATION',min:0,max:1}
 ];
 // Right hand: anatomically connected, minimalist visible fingers; buffer reused each XR frame.
 const fingerNames=[
  ['wrist','thumb-metacarpal','thumb-phalanx-proximal','thumb-phalanx-distal','thumb-tip'],
  ['wrist','index-finger-metacarpal','index-finger-phalanx-proximal','index-finger-phalanx-intermediate','index-finger-phalanx-distal','index-finger-tip'],
  ['wrist','middle-finger-metacarpal','middle-finger-phalanx-proximal','middle-finger-phalanx-intermediate','middle-finger-phalanx-distal','middle-finger-tip'],
  ['wrist','ring-finger-metacarpal','ring-finger-phalanx-proximal','ring-finger-phalanx-intermediate','ring-finger-phalanx-distal','ring-finger-tip'],
  ['wrist','pinky-finger-metacarpal','pinky-finger-phalanx-proximal','pinky-finger-phalanx-intermediate','pinky-finger-phalanx-distal','pinky-finger-tip']
 ];
 const segmentCount=fingerNames.reduce((n,chain)=>n+chain.length-1,0);
 const handData=new Float32Array(segmentCount*6),handGeo=new THREE.BufferGeometry();
 handGeo.setAttribute('position',new THREE.BufferAttribute(handData,3).setUsage(THREE.DynamicDrawUsage));
 const handMesh=new THREE.LineSegments(handGeo,new THREE.LineBasicMaterial({color:0xf5f5f5,transparent:true,opacity:.89,depthWrite:false,depthTest:false}));
 handMesh.renderOrder=320;handMesh.frustumCulled=false;handMesh.visible=false;scene.add(handMesh);
 const fingertip=new THREE.Mesh(new THREE.SphereGeometry(.008,6,5),new THREE.MeshBasicMaterial({color:0xffffff,depthTest:false}));
 fingertip.renderOrder=321;fingertip.visible=false;scene.add(fingertip);
 const laserGeo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3(0,0,-1)]);
 const laser=new THREE.Line(laserGeo,new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.72,depthTest:false}));
 laser.renderOrder=319;laser.visible=false;scene.add(laser);
 const laserPositions=laserGeo.getAttribute('position'),laserEnd=new THREE.Vector3(),laserOrigin=new THREE.Vector3(),laserDir=new THREE.Vector3();
 let lastPoseRight=null;
 function updateHandVisual(frame,space,right){
  handMesh.visible=false;fingertip.visible=false;
  if(!right?.hand)return false;
  const poses=new Map();
  for(const chain of fingerNames)for(const name of chain){
   if(poses.has(name))continue;
   const joint=right.hand.get(name);
   if(joint){const pose=frame.getJointPose(joint,space);if(pose)poses.set(name,pose.transform.position)}
  }
  let i=0;
  for(const chain of fingerNames)for(let j=1;j<chain.length;j++){
   const a=poses.get(chain[j-1]),b=poses.get(chain[j]);
   if(!a||!b)return false;
   const off=i++*6;
   handData[off]=a.x;handData[off+1]=a.y;handData[off+2]=a.z;
   handData[off+3]=b.x;handData[off+4]=b.y;handData[off+5]=b.z;
  }
  handGeo.attributes.position.needsUpdate=true;handMesh.visible=true;
  const tip=poses.get('index-finger-tip');
  if(tip){fingertip.position.set(tip.x,tip.y,tip.z);fingertip.visible=true}
  return true;
 }
 function updateLaser(frame,space,right,handPresent){
  laser.visible=false;if(!right)return;
  if(right.hand&&handPresent){
   const a=frame.getJointPose(right.hand.get('index-finger-phalanx-distal'),space);
   const b=frame.getJointPose(right.hand.get('index-finger-tip'),space);
   if(!a||!b)return;
   const p=a.transform.position,q=b.transform.position;
   laserOrigin.set(q.x,q.y,q.z);laserDir.set(q.x-p.x,q.y-p.y,q.z-p.z).normalize();
  }else if(right.targetRaySpace){
   const pose=frame.getPose(right.targetRaySpace,space);if(!pose)return;
   const p=pose.transform.position,o=pose.transform.orientation;
   laserOrigin.set(p.x,p.y,p.z);
   laserDir.set(0,0,-1).applyQuaternion(new THREE.Quaternion(o.x,o.y,o.z,o.w)).normalize();
  }else return;
  laserPositions.setXYZ(0,laserOrigin.x,laserOrigin.y,laserOrigin.z);
  ray.set(laserOrigin,laserDir);
  const hit=watch.visible?ray.intersectObject(watch,false)[0]:null;
  laserEnd.copy(laserOrigin).addScaledVector(laserDir,hit?hit.distance:1.3);
  laserPositions.setXYZ(1,laserEnd.x,laserEnd.y,laserEnd.z);
  laserPositions.needsUpdate=true;
  laser.visible=watch.visible;
 }
 const ray=new THREE.Raycaster(),direction=new THREE.Vector3(),temp=new THREE.Vector3(),look=new THREE.Vector3();
 let highlight=-1,hold=false,modeLock=0,anchor=false;
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function paint(){
  cx.clearRect(0,0,512,676);
  cx.fillStyle='rgba(7,9,12,.89)';cx.beginPath();
  cx.roundRect(8,7,496,663,82);cx.fill();
  cx.strokeStyle='rgba(248,248,248,.65)';cx.lineWidth=2;cx.stroke();
  cx.beginPath();cx.arc(256,120,68,0,Math.PI*2);cx.stroke();
  cx.strokeStyle='rgba(255,255,255,.25)';cx.beginPath();
  cx.arc(256,120,53,-Math.PI*.72,Math.PI*.72);cx.stroke();
  cx.fillStyle='#fff';cx.textAlign='center';
  cx.font='bold 21px Arial';cx.fillText('ATMOSPHERE',256,34);
  cx.font='bold 25px Arial';cx.fillText('XR / CONTROL',256,105);
  cx.font='bold 19px Arial';cx.fillStyle='#eee';cx.fillText('INTERACTIVE SCORE',256,131);
  cx.strokeStyle='#fff';cx.beginPath();cx.moveTo(53,197);cx.lineTo(459,197);cx.stroke();
  rows.forEach((r,i)=>{
   const y=245+i*55,raw=controls[r.key],v=clamp((raw-r.min)/(r.max-r.min),0,1);
   if(highlight===i){cx.fillStyle='rgba(255,255,255,.18)';cx.fillRect(35,y-26,444,52)}
   cx.textAlign='left';cx.fillStyle='#ddd';cx.font='bold 22px Arial';cx.fillText(r.label,45,y+5);
   cx.fillStyle='#40464c';cx.fillRect(215,y-6,225,5);
   cx.fillStyle='#fff';cx.fillRect(215,y-6,225*v,5);
   cx.beginPath();cx.arc(215+225*v,y-3.5,10,0,Math.PI*2);cx.fill();
  });
  cx.strokeStyle='#888';cx.strokeRect(40,588,432,55);
  cx.fillStyle='#fff';cx.font='bold 19px Arial';cx.textAlign='center';
  cx.fillText('VR  /  SWITCH TO MR',256,624);
  texture.needsUpdate=true;
 }
 paint();
 function hitPosition(world,dragging=false){
  if(!watch.visible)return false;
  watch.updateMatrixWorld(true);
  const p=watch.worldToLocal(world.clone());
  if(Math.abs(p.z)>.075||Math.abs(p.x)>size.w/2||Math.abs(p.y)>size.h/2)return false;
  const x=(p.x/size.w+.5)*512,y=(.5-p.y/size.h)*676;
  if(y>=585){
   if(performance.now()>modeLock){modeLock=performance.now()+1600;onMode?.()}
   return true;
  }
  const i=Math.round((y-245)/55);
  if(i<0||i>=rows.length||Math.abs(y-(245+i*55))>25)return false;
  const r=rows[i],v=clamp((x-215)/225,0,1);
  const next=r.min+(r.max-r.min)*v;
  if(Math.abs(controls[r.key]-next)>.007||highlight!==i){
   controls[r.key]=next;highlight=i;paint();
  }
  return true;
 }
 function hitRay(origin,vector){
  if(!watch.visible)return false;
  ray.set(origin,vector.clone().normalize());
  const result=ray.intersectObject(watch,false)[0];
  return result?hitPosition(result.point,true):false;
 }
 function controllerSelect(controller){
  if(!watch.visible)return false;
  controller.getWorldPosition(temp);
  controller.getWorldDirection(direction).negate();
  return hitRay(temp,direction);
 }
 let lastPinch=false;
 function update(frame,renderer,enabled){
  if(!renderer?.xr?.isPresenting||!frame||!enabled){
   watch.visible=false;lastPinch=false;return;
  }
  const session=renderer.xr.getSession(),space=renderer.xr.getReferenceSpace();
  if(!session||!space)return;
  let left=null,right=null;
  for(const src of session.inputSources){
   if(src.handedness==='left')left=src;
   if(src.handedness==='right')right=src;
  }
  let leftPose=null;
  if(left?.hand)leftPose=frame.getJointPose(left.hand.get('wrist'),space);
  if(!leftPose&&left?.gripSpace)leftPose=frame.getPose(left.gripSpace,space);
  if(leftPose){
   const p=leftPose.transform.position;
   watch.position.set(p.x+.055,p.y+.135,p.z-.07);
   renderer.xr.getCamera().getWorldPosition(look);watch.lookAt(look);
   watch.visible=true;
  }else watch.visible=false;
  const handPresent=updateHandVisual(frame,space,right);
  updateLaser(frame,space,right,handPresent);
  if(!watch.visible||!right?.hand){lastPinch=false;return}
  const thumb=frame.getJointPose(right.hand.get('thumb-tip'),space);
  const index=frame.getJointPose(right.hand.get('index-finger-tip'),space);
  const distal=frame.getJointPose(right.hand.get('index-finger-phalanx-distal'),space);
  if(!thumb||!index)return;
  const a=thumb.transform.position,b=index.transform.position;
  const pinching=Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)<.033;
  if(pinching){
   const tip=new THREE.Vector3(b.x,b.y,b.z);
   let did=hitPosition(tip,true);
   // Project the right index finger forward toward the watch for distant selection.
   if(!did&&distal){
    const d=distal.transform.position;
    const vec=new THREE.Vector3(b.x-d.x,b.y-d.y,b.z-d.z).normalize();
    did=hitRay(tip,vec);
   }
  }
  if(!pinching&&lastPinch){highlight=-1;paint()}
  lastPinch=pinching;
 }
 return {watch,update,controllerSelect,paint,hitPosition};
}
