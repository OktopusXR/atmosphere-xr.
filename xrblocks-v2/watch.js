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
  cx.font='18px Arial';cx.fillText('ATMOSPHERE',256,34);
  cx.font='bold 25px Arial';cx.fillText('XR / CONTROL',256,105);
  cx.font='16px Arial';cx.fillStyle='#aaa';cx.fillText('INTERACTIVE SCORE',256,131);
  cx.strokeStyle='#fff';cx.beginPath();cx.moveTo(53,197);cx.lineTo(459,197);cx.stroke();
  rows.forEach((r,i)=>{
   const y=245+i*55,raw=controls[r.key],v=clamp((raw-r.min)/(r.max-r.min),0,1);
   if(highlight===i){cx.fillStyle='rgba(255,255,255,.18)';cx.fillRect(35,y-26,444,52)}
   cx.textAlign='left';cx.fillStyle='#ddd';cx.font='17px Arial';cx.fillText(r.label,45,y+5);
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
