import * as THREE from 'three';
// Compact spatial ending: 360-degree procedural environment and independent XR controls.
export const MUSIC_LINKS={
 spotify:'https://open.spotify.com/track/7JTEfJqz2rBNOkRB7A9w4K',
 apple:'https://music.apple.com/us/album/atmosphere-single/6815019097',
 instagram:'https://www.instagram.com/oktopus.art/'
};
const items=[
 {id:'VR',label:'WATCH AGAIN',sub:'IN VR'},
 {id:'MR',label:'MIXED REALITY',sub:'WATCH AGAIN'},
 {id:'spotify',label:'SPOTIFY',sub:'FOLLOW'},
 {id:'apple',label:'APPLE MUSIC',sub:'FOLLOW'},
 {id:'instagram',label:'INSTAGRAM',sub:'@OKTOPUS.ART'}
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
 const fallbackSkyMaterial=new THREE.ShaderMaterial({vertexShader,fragmentShader,uniforms:{uTime:{value:0}},
  side:THREE.BackSide,depthWrite:false,depthTest:false});
 const sky=new THREE.Mesh(new THREE.SphereGeometry(28,36,20),fallbackSkyMaterial);
 sky.frustumCulled=false;sky.renderOrder=-1000;sky.visible=false;scene.add(sky);
 // Production ending uses a separate 5.7K equirectangular texture. UI remains a distinct interactive layer.
 const skyLoader=new THREE.TextureLoader();
 skyLoader.load('https://raw.githubusercontent.com/OktopusXR/atmosphere-xr./refs/heads/main/atmosphere-end-skybox-5.7k.jpg',texture=>{
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.mapping=THREE.EquirectangularReflectionMapping;
  texture.wrapS=THREE.RepeatWrapping;texture.repeat.x=-1;
  texture.anisotropy=1;
   texture.generateMipmaps=false;
   texture.minFilter=THREE.LinearFilter;
   texture.magFilter=THREE.LinearFilter;
  sky.material.dispose();
  skyTexture=texture;sky.material=new THREE.MeshBasicMaterial({map:texture,side:THREE.BackSide,depthWrite:false,depthTest:false});skyReady=true;
   if(visible&&immersive&&isVR)sky.visible=true;
 },undefined,()=>console.warn('5.7K end skybox not found; procedural fallback remains active.'));
 const raycaster=new THREE.Raycaster(),origin=new THREE.Vector3(),q=new THREE.Quaternion(),local=new THREE.Vector3();
 const cursor=new THREE.Mesh(new THREE.SphereGeometry(.009,8,6),
  new THREE.MeshBasicMaterial({color:0xee5599,depthTest:false,depthWrite:false}));
 cursor.visible=false;cursor.renderOrder=270;scene.add(cursor);
 const beamGeo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]);
 const beam=new THREE.Line(beamGeo,new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.3,depthTest:false}));
 beam.visible=false;beam.renderOrder=260;scene.add(beam);
 const beamPts=beamGeo.getAttribute('position');
 const centers=[215,490,768,1046,1320],cy=432,rad=57;
 let busy=false,visible=false,immersive=false,isVR=true,audioCtx=null,audioTimer=null,audioMaster=null,beat=0,skyReady=false,skyTexture=null;
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
  ctx.fillStyle='#bbb';ctx.font='18px Arial';ctx.fillText('THANK YOU FOR BEING PART OF IT',768,641);
  tex.needsUpdate=true;
 }
 draw();
 const overlay=document.createElement('div');
 overlay.style.cssText=`display:none;position:fixed;inset:0;z-index:185;overflow:auto;color:#fff;align-items:center;justify-content:center;flex-direction:column;padding:22px;gap:22px;font-family:Arial;text-align:center;background-color:#050509;background-image:linear-gradient(rgba(0,0,0,.32),rgba(0,0,0,.48)),url('https://raw.githubusercontent.com/OktopusXR/atmosphere-xr./refs/heads/main/atmosphere-end-skybox-5.7k.jpg');background-size:cover;background-position:center;background-repeat:no-repeat`;
 const h=document.createElement('div');h.innerHTML='<div style="font-size:clamp(20px,4vw,34px);letter-spacing:.35em">ATMOSPHERE</div><div style="font-size:clamp(48px,9vw,82px);font-weight:200;line-height:1.1;margin:14px 0">XR</div><div style="font-size:clamp(18px,3.5vw,29px);letter-spacing:.42em">THE END</div>';h.style.cssText='font-weight:300;text-shadow:0 2px 18px #000;margin-bottom:8px';
 overlay.appendChild(h);
 const buttons=document.createElement('div');buttons.style.cssText='display:flex;flex-wrap:wrap;gap:20px;justify-content:center;max-width:760px;background:rgba(0,0,0,.22);backdrop-filter:blur(4px);padding:18px 20px;border-radius:28px';
 items.forEach(item=>{
  const btn=document.createElement('button');btn.textContent=item.label;
  btn.style.cssText='border:1px solid rgba(255,255,255,.55);border-radius:50%;background:rgba(8,8,13,.62);color:white;width:96px;height:96px;font:11px Arial;letter-spacing:.08em;cursor:pointer;box-shadow:0 0 22px rgba(236,69,140,.12)'
  btn.onclick=()=>choose(item.id);buttons.appendChild(btn);
 });
 overlay.appendChild(buttons);const thanks=document.createElement('div');thanks.textContent='THANK YOU FOR BEING PART OF IT';thanks.style.cssText='font-size:12px;letter-spacing:.28em;color:#ddd;text-shadow:0 2px 12px #000;margin-top:10px';overlay.appendChild(thanks);document.body.appendChild(overlay);
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
  sky.visible=visible&&immersive&&isVR&&skyReady;
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
  sky.position.copy(origin);if(sky.material.uniforms?.uTime)if(sky.material.uniforms?.uTime)sky.material.uniforms.uTime.value=performance.now()*.001;
 }
 function animate(camera){
  if(!visible)return;
  if(sky.material.uniforms?.uTime)sky.material.uniforms.uTime.value=performance.now()*.001;
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
 return {panel,sky,overlay,show,update,animate,aimRay,selectPoint,selectRay,reset,get skyReady(){return skyReady}};
}
