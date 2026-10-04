import * as THREE from 'three';
import {makeClouds} from './cloud.js';
const $=id=>document.getElementById(id),vrMode='VR';
window.atmosAppReady=true;
$('development').textContent='NATIVE QUEST · READY';
const music=new Audio('../atmosphereADM_binaural.mp3');music.preload='auto';
const narration=new Audio('../atmosphere-intro.ogg');narration.preload='auto';
const lines=[
 ['Invisible networks connect all forms of life.','Redes invisibles conectan todas las formas de vida.'],
 ['From body to Earth. From Earth to cosmos.','Del cuerpo a la Tierra. De la Tierra al cosmos.'],
 ['Listen. You are part of this resonance.','Escucha. Eres parte de esta resonancia.']
];
let selectedMode=vrMode,introStarted=false,introFinished=false,entered=false,completed=false,timers=[],captionIndex=0;
let context,source,analyser,fft,td,bass=0,mid=0,high=0,rms=0,attack=0,previousRms=0,lastCue=-1;
const soundtrackDuration=402;
const cues=[
 {sec:0,name:'SUBTERRANEAN'},
 {sec:39,name:'SPORES'},
 {sec:97,name:'COLONIZATION'},
 {sec:158,name:'SYMBIOSIS'},
 {sec:224,name:'NETWORK'},
 {sec:289,name:'ATMOSPHERE'},
 {sec:353,name:'RESPIRATION'},
 {sec:402,name:'END'}
];
const params={intensity:.95,density:.82,scale:1,speed:.6,motion:.8};
const scene=new THREE.Scene();scene.background=new THREE.Color(0);
const camera=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,.02,90);
camera.position.set(0,1.6,0);
const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});
renderer.xr.enabled=true;renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);
document.body.appendChild(renderer.domElement);renderer.domElement.style.position='fixed';renderer.domElement.style.inset=0;renderer.domElement.style.zIndex='0';
$('intro').style.zIndex='100';
const root=new THREE.Group();scene.add(root);

const cloudEngine=makeClouds(root);
const board=document.createElement('canvas');board.width=1024;board.height=600;
const ctx=board.getContext('2d'),boardTex=new THREE.CanvasTexture(board);
const introBoard=new THREE.Mesh(new THREE.PlaneGeometry(1.68,.985),
 new THREE.MeshBasicMaterial({map:boardTex,transparent:true,depthWrite:false,depthTest:false}));
introBoard.renderOrder=100;scene.add(introBoard);
function drawIntro(){
 ctx.clearRect(0,0,1024,600);
 ctx.fillStyle=selectedMode==='MR'?'rgba(0,0,0,.78)':'rgba(0,0,0,.96)';
 ctx.fillRect(0,0,1024,600);ctx.textAlign='center';ctx.fillStyle='#fff';
 ctx.font='23px Arial';ctx.fillText('TECHNO POESIS',512,72);
 ctx.font='61px Arial';ctx.fillText('ATMOSPHERE',512,164);
 if(introStarted&&!introFinished){
  ctx.font='27px Arial';ctx.fillText(lines[captionIndex][0],512,276);
  ctx.fillStyle='#bbb';ctx.font='22px Arial';ctx.fillText(lines[captionIndex][1],512,320);
 }else if(!introFinished){
  ctx.font='24px Arial';ctx.fillText('Invisible networks connect all forms of life.',512,285);
 }
 ctx.fillStyle='#ccc';ctx.font='21px Arial';ctx.fillText('Ricardo P. Tapia Fernández · Oktopus Art Studio',512,403);
 ctx.font='18px Arial';ctx.fillText('@oktopus.art',512,437);
 ctx.fillStyle='#fff';ctx.font='27px Arial';
 ctx.fillText(introFinished?'PINCH / TRIGGER · ENTER EXPERIENCE':introStarted?'PINCH / TRIGGER · SKIP':'PINCH / TRIGGER · START',512,527);
 boardTex.needsUpdate=true;
}
function setCaption(i){captionIndex=i;$('en').textContent=lines[i][0];$('es').textContent=lines[i][1];drawIntro()}
function clearTimers(){timers.forEach(clearTimeout);timers=[]}
function finishIntro(){
 if(introFinished)return;introFinished=true;clearTimers();narration.pause();
 $('en').textContent='';$('es').textContent='';$('start').hidden=true;$('skip').hidden=true;
 $('enter').hidden=false;$('voice').style.display='none';drawIntro();
}
function startIntro(){
 if(introStarted)return;introStarted=true;
 $('start').hidden=true;$('skip').hidden=false;$('voice').style.display='block';setCaption(0);
 const d=Number.isFinite(narration.duration)&&narration.duration>6?narration.duration:12.6;
 for(const [idx,fraction] of [[1,.32],[2,.66]])
  timers.push(setTimeout(()=>{if(!introFinished)setCaption(idx)},d*fraction*1000));
 timers.push(setTimeout(finishIntro,Math.max(10.2,d+1.1)*1000));
 narration.play().catch(e=>{$('status').textContent='Narration unavailable: '+e.message});
}
$('start').onclick=startIntro;$('skip').onclick=finishIntro;
async function startMusic(){
 if(!introFinished)finishIntro();
 if(!context){
  context=new (window.AudioContext||window.webkitAudioContext)();
  analyser=context.createAnalyser();analyser.fftSize=2048;analyser.smoothingTimeConstant=.35;
  fft=new Uint8Array(analyser.frequencyBinCount);
  td=new Float32Array(analyser.fftSize);
  source=context.createMediaElementSource(music);source.connect(analyser);analyser.connect(context.destination);
 }
 const a=context.resume(),b=music.play();await Promise.all([a,b]);
 entered=true;completed=false;$('intro').style.display='none';introBoard.visible=false;
 $('status').textContent='ATMOSPHERE · MUSIC MASTER CLOCK';
}
$('enter').onclick=()=>startMusic().catch(e=>$('status').textContent='AUDIO: '+e.message);
music.onended=()=>{$('status').textContent='ATMOSPHERE · END';completed=true;entered=false;introBoard.visible=false};
function spectrum(f1,f2){
 const hi=Math.min(fft.length,Math.ceil(f2/(context.sampleRate/2)*fft.length));
 const lo=Math.floor(f1/(context.sampleRate/2)*fft.length);let sum=0;
 for(let i=lo;i<hi;i++)sum+=fft[i];
 return sum/Math.max(1,hi-lo)/255;
}
function analyze(dt){
 if(!analyser||music.paused)return;
 analyser.getByteFrequencyData(fft);analyser.getFloatTimeDomainData(td);
 let sum=0;for(let i=0;i<td.length;i+=4)sum+=td[i]*td[i];
 const r=Math.sqrt(sum/(td.length/4));
 rms+=(r-rms)*.25;bass+=(spectrum(25,170)-bass)*.2;
 mid+=(spectrum(170,2000)-mid)*.2;high+=(spectrum(2000,12000)-high)*.2;
 attack=Math.max(0,attack-dt*2.8);
 if(r-previousRms>.018&&r>.028)attack=1;
 previousRms=r;
}

// Musical score is tied to music.currentTime; cue times still require fine annotation.
const onsets=[0,9,22,39,54,69,84,97,119,142,158,175,190,210,224,241,263,276,289,314,335,353,372,391];
function updateScore(dt){
 analyze(dt);
 const duration=Number.isFinite(music.duration)&&music.duration>10?music.duration:soundtrackDuration;
 const t=music.currentTime*soundtrackDuration/duration;
 let cue=0;for(let i=cues.length-2;i>=0;i--)if(t>=cues[i].sec){cue=i;break}
 let last=0;for(const o of onsets)if(o<=t)last=o;else break;
 const accent=Math.max(attack,Math.exp(-(t-last)*3.4)*.85);
 cloudEngine.update(t,params,cue,bass,mid,high,accent);
 if(cue!==lastCue){lastCue=cue;$('status').textContent=cues[cue].name+' · '+Math.floor(t)+'s'}
}
const controller1=renderer.xr.getController(0),controller2=renderer.xr.getController(1);
scene.add(controller1,controller2);
function advance(){
 if(entered)return;
 if(!introStarted)startIntro();else if(!introFinished)finishIntro();
 else startMusic().catch(e=>$('status').textContent=e.message);
}
for(const ctl of [controller1,controller2])ctl.addEventListener('selectstart',advance);
let pinched=false;
function handInput(frame){
 if(!renderer.xr.isPresenting||!frame||entered)return;
 const session=renderer.xr.getSession(),space=renderer.xr.getReferenceSpace();
 if(!space)return;
 let touching=false;
 for(const src of session.inputSources){
  if(!src.hand)continue;
  const a=frame.getJointPose(src.hand.get('thumb-tip'),space);
  const b=frame.getJointPose(src.hand.get('index-finger-tip'),space);
  if(!a||!b)continue;
  const p=a.transform.position,q=b.transform.position;
  if(Math.hypot(p.x-q.x,p.y-q.y,p.z-q.z)<.025)touching=true;
 }
 if(touching&&!pinched)advance();pinched=touching;
}
async function enterXR(mode){
 if(!navigator.xr){$('status').textContent='WebXR unavailable in this browser';return}
 if(renderer.xr.isPresenting){await renderer.xr.getSession().end();return}
 try{
  const vr=mode==='VR';selectedMode=mode;drawIntro();
  scene.background=vr?new THREE.Color(0):null;renderer.setClearColor(0,vr?1:0);
  const xrMode=vr?'immersive-vr':'immersive-ar';
  const session=await navigator.xr.requestSession(xrMode,{optionalFeatures:['local-floor','hand-tracking']});
  await renderer.xr.setSession(session);
  $('status').textContent='XR SESSION ACTIVE · '+mode;
 }catch(e){$('status').textContent='XR SESSION ERROR: '+e.message}
}
$('vr').onclick=()=>{if(!renderer.xr.isPresenting){selectedMode='VR';btn.textContent='ENTER VR'}drawIntro()};
$('mr').onclick=()=>{if(!renderer.xr.isPresenting){selectedMode='MR';btn.textContent='ENTER MR'}drawIntro()};
const btn=document.createElement('button');btn.textContent='ENTER '+vrMode;
$('xrButton').appendChild(btn);
btn.onclick=()=>enterXR(selectedMode);
renderer.xr.addEventListener('sessionstart',()=>{btn.textContent='EXIT XR'});
renderer.xr.addEventListener('sessionend',()=>{btn.textContent='ENTER '+selectedMode;
 scene.background=new THREE.Color(0);renderer.setClearColor(0,1);
});
const clock=new THREE.Clock(),pos=new THREE.Vector3(),quat=new THREE.Quaternion(),offset=new THREE.Vector3(0,0,-1.7);
renderer.setAnimationLoop((t,frame)=>{
 const dt=Math.min(.06,clock.getDelta());
 handInput(frame);
 introBoard.visible=!entered&&!completed;
 if(!entered&&!completed){
  const cam=renderer.xr.isPresenting?renderer.xr.getCamera():camera;
  cam.getWorldPosition(pos);cam.getWorldQuaternion(quat);
  introBoard.position.copy(pos).add(offset.clone().applyQuaternion(quat));
  introBoard.quaternion.copy(quat);
 }
 if(entered)updateScore(dt);
 renderer.render(scene,camera);
});
window.addEventListener('resize',()=>{
 camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
 renderer.setSize(innerWidth,innerHeight);
});
drawIntro();
$('development').textContent='QUEST ENGINE READY · select VR or MIXED REALITY';
window.atmosAppReady=true;
