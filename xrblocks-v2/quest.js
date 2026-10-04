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
 // Type floats directly in the world. No rectangular background or opaque card.
 ctx.clearRect(0,0,1024,600);
 const soft=(text,y,font,color='#eeeeee')=>{
  ctx.fillStyle=color;ctx.font=font;ctx.textAlign='center';ctx.fillText(text,512,y);
 };
 ctx.save();
 ctx.strokeStyle='rgba(240,240,240,.24)';ctx.lineWidth=1;
 ctx.beginPath();ctx.ellipse(512,289,215,215,0,0,Math.PI*2);ctx.stroke();
 ctx.strokeStyle='rgba(240,240,240,.075)';
 ctx.beginPath();ctx.ellipse(512,289,224,224,0,0,Math.PI*2);ctx.stroke();
 if(!introStarted){
  soft('TECHNO POESIS',144,'22px Arial','#cccccc');
  soft('A T M O S P H E R E',254,'44px Arial');
 }else if(!introFinished){
  const parts=lines[captionIndex];
  soft(parts[0],259,'26px Arial');
  soft(parts[1],313,'19px Arial','#bbbbbb');
 }else soft('A T M O S P H E R E',273,'39px Arial');
 soft('Ricardo P. Tapia Fernández',411,'19px Arial','#d9d9d9');
 soft('OKTOPUS ART STUDIO   /   @oktopus.art',445,'14px Arial','#aaaaaa');
 soft(introFinished?'PINCH TO BEGIN':introStarted?'LISTEN':'START',524,'19px Arial','#dedede');
 ctx.restore();boardTex.needsUpdate=true;
}
function setCaption(i){captionIndex=i;$('en').textContent=lines[i][0];$('es').textContent=lines[i][1];drawIntro()}
function clearTimers(){timers.forEach(clearTimeout);timers=[]}
function finishIntro(){
 if(introFinished)return;introFinished=true;clearTimers();narration.pause();if(speechFallback&&'speechSynthesis' in window)speechSynthesis.cancel();
 $('en').textContent='';$('es').textContent='';$('start').hidden=true;$('skip').hidden=true;
 $('enter').hidden=false;$('voice').style.display='none';drawIntro();
}
let speechFallback=null;
function voiceFallback(){
 // Browser voice is a fallback, never a second simultaneous narrator.
 if(!('speechSynthesis' in window)){$('status').textContent='Narration audio not available';return}
 speechSynthesis.cancel();
 const u=new SpeechSynthesisUtterance(lines.map(v=>v[0]).join(' ... '));
 u.lang='en-US';u.rate=.88;u.pitch=.9;
 speechFallback=u;
 speechSynthesis.speak(u);
}
function startIntro(){
 if(introStarted)return;
 introStarted=true;$('start').hidden=true;$('skip').hidden=false;
 $('voice').style.display='block';setCaption(0);
 const duration=Number.isFinite(narration.duration)&&narration.duration>1?narration.duration:7.51;
 // The repository's real Ogg Opus voice is 7.51s, NOT 12.6s.
 const times=[.32,.66];
 times.forEach((fraction,j)=>timers.push(setTimeout(()=>{if(!introFinished)setCaption(j+1)},duration*fraction*1000)));
 narration.onended=()=>{if(!introFinished)finishIntro()};
 narration.onerror=()=>{voiceFallback();if(!introFinished)timers.push(setTimeout(finishIntro,12500))};
 const playback=narration.play();
 if(playback?.catch)playback.catch(()=>{voiceFallback();if(!introFinished)timers.push(setTimeout(finishIntro,12500))});
 timers.push(setTimeout(finishIntro,Math.max(10,duration+1.5)*1000));
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
