import * as THREE from 'three';
// Compact spatial ending: 360-degree procedural environment and independent XR controls.
export const MUSIC_LINKS={
 spotify:'https://open.spotify.com/track/7JTEfJqz2rBNOkRB7A9w4K',
 apple:'https://music.apple.com/us/album/atmosphere-single/6815019097',
 instagram:'https://www.instagram.com/oktopus.art/'
};
const items=[
 {id:'VR',label:'VR',sub:'REPLAY'},
 {id:'MR',label:'MR',sub:'REPLAY'},
 {id:'spotify',label:'SPOTIFY',sub:'LISTEN'},
 {id:'apple',label:'APPLE MUSIC',sub:'LISTEN'},
 {id:'instagram',label:'@OKTOPUS.ART',sub:'FOLLOW'}
];
export function createEndMenu(scene,onChoose){
 const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=720;
 const ctx=canvas.getContext('2d'),tex=new THREE.CanvasTexture(canvas);
 const panel=new THREE.Mesh(new THREE.PlaneGeometry(2.4,1.125),
  new THREE.MeshBasicMaterial({map:tex,transparent:true,depthTest:false,depthWrite:false,side:THREE.DoubleSide}));
 panel.renderOrder=250;panel.visible=false;scene.add(panel);
 const vertexShader=`varying vec3 vDir;void main(){vDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
 const fragmentShader=`
 precision mediump float;varying vec3 vDir;uniform float uTime;
 float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
 void main(){
  vec3 p=normalize(vDir);
  float a=atan(p.z,p.x),e=asin(p.y),t=uTime*.015;
  float filaments=0.;
  for(int i=0;i<9;i++){
   float f=float(i);
   float warp=.19*sin(a*(2.+mod(f,3.))+t+f*1.3)+.08*sin(a*7.-t*.7+f);
   float strand=abs(sin((e-warp+f*.23)*22.+2.*sin(a*3.+f)));
   filaments+=pow(1.-strand,38.)*.045;
  }
  float porous=pow(max(0.,sin(a*18.+sin(e*11.))*sin(e*23.-sin(a*9.))),16.)*.07;
  float stars=step(.9987,hash(floor(vec3(a*180.,e*150.,p.z*70.))))*.15;
  vec3 base=vec3(.005,.006,.012)+vec3(.65,.68,.78)*(filaments+porous);
  float pink=pow(max(0.,sin(a*4.+e*9.+t)),22.)*filaments*.75;
  base+=vec3(.9,.05,.37)*pink+vec3(stars);
  gl_FragColor=vec4(base,1.);
 }`;
 const sky=new THREE.Mesh(new THREE.SphereGeometry(28,48,32),
  new THREE.ShaderMaterial({vertexShader,fragmentShader,uniforms:{uTime:{value:0}},
   side:THREE.BackSide,depthWrite:false,depthTest:false}));
 sky.frustumCulled=false;sky.renderOrder=-1000;sky.visible=false;scene.add(sky);
 const raycaster=new THREE.Raycaster(),origin=new THREE.Vector3(),q=new THREE.Quaternion(),local=new THREE.Vector3();
 const cursor=new THREE.Mesh(new THREE.SphereGeometry(.009,8,6),
  new THREE.MeshBasicMaterial({color:0xee5599,depthTest:false,depthWrite:false}));
 cursor.visible=false;cursor.renderOrder=270;scene.add(cursor);
 const beamGeo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]);
 const beam=new THREE.Line(beamGeo,new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.3,depthTest:false}));
 beam.visible=false;beam.renderOrder=260;scene.add(beam);
 const beamPts=beamGeo.getAttribute('position');
 const centers=[215,490,768,1046,1320],cy=432,rad=57;
 let busy=false,visible=false,immersive=false,isVR=true,audioCtx=null,audioTimer=null,audioMaster=null,beat=0;
 function draw(){
  ctx.clearRect(0,0,1536,720);
  ctx.textAlign='center';
  ctx.fillStyle='#d8d8de';ctx.font='29px Arial';ctx.fillText('A T M O S P H E R E',768,119);
  ctx.fillStyle='#fff';ctx.font='300 51px Arial';ctx.fillText('THE END',768,212);
  ctx.fillStyle='#777';ctx.font='18px Arial';ctx.fillText('TECHNO POESIS',768,250);
  const symbols=['↺','◇','♫','♪','◎'];
  items.forEach((item,i)=>{
   const x=centers[i];
   ctx.beginPath();ctx.arc(x,cy,rad,0,Math.PI*2);
   ctx.strokeStyle='rgba(255,255,255,.52)';ctx.lineWidth=2;ctx.stroke();
   ctx.beginPath();ctx.arc(x+rad*.7,cy-rad*.7,4,0,Math.PI*2);
   ctx.fillStyle='#ec458c';ctx.fill();
   ctx.fillStyle='#f4f4f4';ctx.font='39px Arial';ctx.fillText(symbols[i],x,cy+13);
   ctx.fillStyle='#ddd';ctx.font='20px Arial';ctx.fillText(item.label,x,cy+99,242);
   ctx.fillStyle='#999';ctx.font='15px Arial';ctx.fillText(item.sub,x,cy+122);
  });
  ctx.fillStyle='#bbb';ctx.font='18px Arial';ctx.fillText('GRACIAS POR SER PARTE',768,641);
  tex.needsUpdate=true;
 }
 draw();
 const overlay=document.createElement('div');
 overlay.style.cssText='display:none;position:fixed;inset:0;z-index:185;background:#050509;overflow:auto;color:#fff;align-items:center;justify-content:center;flex-direction:column;padding:22px;gap:13px;font-family:Arial;text-align:center';
 const h=document.createElement('h1');h.textContent='ATMOSPHERE · THE END';h.style.cssText='font-weight:300;letter-spacing:.15em;font-size:clamp(25px,5vw,46px)';
 overlay.appendChild(h);
 const buttons=document.createElement('div');buttons.style.cssText='display:flex;flex-wrap:wrap;gap:12px;justify-content:center;max-width:700px';
 items.forEach(item=>{
  const btn=document.createElement('button');btn.textContent=item.label;
  btn.style.cssText='border:1px solid #666;border-radius:50%;background:#101015;color:white;width:105px;height:105px;font:12px Arial;letter-spacing:.07em;cursor:pointer';
  btn.onclick=()=>choose(item.id);buttons.appendChild(btn);
 });
 overlay.appendChild(buttons);document.body.appendChild(overlay);
 function tone(freq,at,dur,vol,type='sine'){
  if(!audioCtx||!audioMaster)return;
  const osc=audioCtx.createOscillator(),gain=audioCtx.createGain();
  osc.type=type;osc.frequency.setValueAtTime(freq,at);
  gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(vol,at+.012);
  gain.gain.exponentialRampToValueAtTime(.0001,at+dur);
  osc.connect(gain);gain.connect(audioMaster);osc.start(at);osc.stop(at+dur+.02);
 }
 function pulse(){
  if(!audioCtx||audioCtx.state!=='running')return;
  const t=audioCtx.currentTime+.035,step=beat++%16;
  if(step%4===0){tone(54,t,.42,.17);tone(108,t,.18,.035);}
  if(step%4===2)tone(180,t,.08,.013,'triangle');
  if(step%2===0)tone(440+step*8,t,.035,.006,'triangle');
  if(step===0||step===8)tone(step===0?110:146.83,t,1.3,.016,'sine');
 }
 function startAudio(){
  if(audioTimer)return;
  try{
   const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
   audioCtx=audioCtx||new AC();
   audioMaster=audioCtx.createGain();audioMaster.gain.value=.36;audioMaster.connect(audioCtx.destination);
   audioCtx.resume().catch(()=>{});
   beat=0;pulse();audioTimer=setInterval(pulse,187.5); // 80 BPM, 16 steps / 3 seconds
  }catch(e){console.warn('End ambience unavailable',e);}
 }
 function stopAudio(){
  if(audioTimer){clearInterval(audioTimer);audioTimer=null}
  if(audioMaster){audioMaster.gain.setTargetAtTime(.0001,audioCtx.currentTime,.08);
   const master=audioMaster;setTimeout(()=>master.disconnect(),400);audioMaster=null}
 }
 function choose(id){
  if(busy)return false;busy=true;onChoose(id);return true;
 }
 function show(next,vrImmersive=false,mode='VR'){
  const was=visible;visible=!!next;immersive=!!vrImmersive;isVR=mode!=='MR';
  panel.visible=visible&&immersive;
  sky.visible=visible&&immersive&&isVR;
  overlay.style.display=visible&&!immersive?'flex':'none';
  if(visible&&!was)startAudio();
  if(!visible&&was)stopAudio();
  if(!visible){busy=false;cursor.visible=false;beam.visible=false;}
 }
 function update(camera){
  if(!panel.visible||!camera)return;
  camera.getWorldPosition(origin);camera.getWorldQuaternion(q);
  panel.position.copy(origin).add(new THREE.Vector3(0,0,-2.3).applyQuaternion(q));
  panel.quaternion.copy(q);
  sky.position.copy(origin);sky.material.uniforms.uTime.value=performance.now()*.001;
 }
 function animate(camera){
  if(!visible)return;
  sky.material.uniforms.uTime.value=performance.now()*.001;
  if(camera){camera.getWorldPosition(origin);sky.position.copy(origin);}
 }
 function aimRay(start,dir){
  cursor.visible=false;beam.visible=false;if(!panel.visible)return false;
  panel.updateMatrixWorld(true);raycaster.set(start,dir.clone().normalize());
  const hit=raycaster.intersectObject(panel,false)[0];if(!hit)return false;
  cursor.position.copy(hit.point).addScaledVector(raycaster.ray.direction,-.01);cursor.visible=true;
  beamPts.setXYZ(0,start.x,start.y,start.z);beamPts.setXYZ(1,hit.point.x,hit.point.y,hit.point.z);
  beamPts.needsUpdate=true;beam.visible=true;return true;
 }
 function selectPoint(point){
  if(!panel.visible)return false;
  panel.updateMatrixWorld(true);local.copy(point);panel.worldToLocal(local);
  if(Math.abs(local.z)>.15)return false;
  const x=(local.x/2.4+.5)*1536,y=(.5-local.y/1.125)*720;
  const i=centers.findIndex(cx=>Math.hypot(x-cx,y-cy)<rad+17);
  return i<0?false:choose(items[i].id);
 }
 function selectRay(start,dir){
  if(!panel.visible)return false;
  panel.updateMatrixWorld(true);raycaster.set(start,dir.clone().normalize());
  const hit=raycaster.intersectObject(panel,false)[0];
  return hit?selectPoint(hit.point):false;
 }
 function reset(){busy=false}
 return {panel,sky,overlay,show,update,animate,aimRay,selectPoint,selectRay,reset};
}
