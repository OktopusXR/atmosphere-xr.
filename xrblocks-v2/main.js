import * as THREE from 'three';
import {makeClouds} from './cloud.js?build=score-v5';
import {createForeground} from './stage.js?build=score-v5';
import * as xb from 'xrblocks';

// ATMOSPHERE XR Blocks V2 — MUSIC MASTER CLOCK.
// Soundtrack is the single timeline. Cues are explicitly provisional until the
// complete master has been annotated against its real musical phrases.
const $ = id => document.getElementById(id);
const music = new Audio('../atmosphereADM_binaural.mp3');
music.preload='auto';
const narration = new Audio('../atmosphere-intro-female.mp3');
narration.preload='auto';
const phrases=[
 ['Invisible networks connect all forms of life.','Redes invisibles conectan todas las formas de vida.'],
 ['From body to Earth. From Earth to cosmos.','Del cuerpo a la Tierra. De la Tierra al cosmos.'],
 ['Listen. You are part of this resonance.','Escucha. Eres parte de esta resonancia.']
];
let introStarted=false,introFinished=false,started=false,mode=new URLSearchParams(location.search).get('mode')==='mr'?'MR':'VR',timers=[];
let audioContext,analyser,timeBins,freqBins,audioSource,prevEnergy=0;
let bass=0,mid=0,high=0,rms=0,pulse=0,transient=0,smoothedMid=0;
let lastAudioTime=0,lastFrameSec=0,showScene=-1;
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
function caption(i){$('en').textContent=phrases[i][0];$('es').textContent=phrases[i][1];paintIntro();}
function finishIntro(){
 if(introFinished)return;
 introFinished=true;timers.forEach(clearTimeout);timers.length=0;
 narration.pause();$('voice').style.display='none';
 $('en').textContent='';$('es').textContent='';
 $('start').hidden=true;$('skip').hidden=true;$('enter').hidden=false;paintIntro();
}
function beginIntro(){
 if(introStarted)return;
 introStarted=true;$('start').hidden=true;$('skip').hidden=false;$('voice').style.display='block';
 caption(0);
 const duration=Number.isFinite(narration.duration)&&narration.duration>1?narration.duration:11.598367;
 for(const [i,ms] of [[1,3650],[2,9000]])timers.push(setTimeout(()=>{if(!introFinished)caption(i)},ms));
 timers.push(setTimeout(finishIntro,Math.max(10,duration+1.1)*1000));
 narration.onended=finishIntro;
 narration.play().catch(()=>{
   $('status').textContent='Female narrator file not yet available; subtitles remain visible';
   /* Require recorded female voice; subtitles remain if the file fails. */
 });
}
$('start').onclick=beginIntro;$('skip').onclick=finishIntro;
async function startMusic(){
 if(!introFinished)finishIntro();
 if(!audioContext){
  audioContext=new (window.AudioContext||window.webkitAudioContext)();
  analyser=audioContext.createAnalyser();analyser.fftSize=2048;analyser.smoothingTimeConstant=.35;
  freqBins=new Uint8Array(analyser.frequencyBinCount);timeBins=new Float32Array(analyser.fftSize);
  audioSource=audioContext.createMediaElementSource(music);
  audioSource.connect(analyser);analyser.connect(audioContext.destination);
 }
 // Preserve the same direct input gesture for both audio-context unlock and play.
 const unlock=audioContext.resume(),playback=music.play();
 await Promise.all([unlock,playback]);
 started=true;$('intro').style.display='none';paintIntro();
 $('status').textContent='ATMOSPHERE — score follows music.currentTime';
}
$('enter').onclick=()=>startMusic().catch(e=>$('status').textContent='Audio error: '+e.message);
music.onended=()=>{started=false;$('status').textContent='ATMOSPHERE · END';};
function spectrumBand(a,b){
 if(!audioContext)return 0;
 const nyq=audioContext.sampleRate/2,n=freqBins.length;
 const from=Math.floor(a/nyq*n),to=Math.max(from+1,Math.ceil(b/nyq*n));
 let value=0;for(let i=from;i<Math.min(to,n);i++)value+=freqBins[i];
 return value/Math.max(1,to-from)/255;
}
function soundFrame(dt){
 if(!analyser||music.paused)return;
 analyser.getByteFrequencyData(freqBins);analyser.getFloatTimeDomainData(timeBins);
 let sum=0;for(let i=0;i<timeBins.length;i+=4)sum+=timeBins[i]*timeBins[i];
 const measured=Math.sqrt(sum/(timeBins.length/4));
 rms+=(measured-rms)*.24;
 bass+=(spectrumBand(26,170)-bass)*.24;
 mid+=(spectrumBand(170,2200)-mid)*.25;
 high+=(spectrumBand(2200,12000)-high)*.26;
 // Audio attack detector: sharp jumps in the actual playback amplitude.
 const rise=Math.max(0,measured-prevEnergy);
 prevEnergy=measured;
 transient=Math.max(0,transient-dt*3);
 if(rise>.018&&measured>.028)transient=1;
 pulse+=(bass-pulse)*Math.min(1,dt*26);
 smoothedMid+=(mid-smoothedMid)*Math.min(1,dt*4);
}
function findCue(t){
 // Real time, not animation-frame accumulation.
 for(let i=CUES.length-2;i>=0;i--)if(t>=CUES[i].sec)return i;
 return 0;
}
const root=new THREE.Group();
const cloudEngine=makeClouds(root);
const foreground=createForeground(root);
let canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;
const cx=canvas.getContext('2d'),introTexture=new THREE.CanvasTexture(canvas);
let introPlane;
function paintIntro(){
 cx.clearRect(0,0,1024,512);
 cx.textAlign='center';
 cx.strokeStyle='rgba(242,242,242,.22)';cx.lineWidth=1;
 cx.beginPath();cx.ellipse(512,255,184,184,0,0,Math.PI*2);cx.stroke();
 cx.font='19px Arial';cx.fillStyle='#bbb';cx.fillText('TECHNO POESIS',512,80);
 if(introStarted&&!introFinished){
  const l=phrases.find(p=>p[0]===$('en').textContent)||phrases[0];
  cx.fillStyle='#fff';cx.font='25px Arial';cx.fillText(l[0],512,226);
  cx.fillStyle='#bbb';cx.font='18px Arial';cx.fillText(l[1],512,268);
 }else{
  cx.fillStyle='#fff';cx.font='38px Arial';cx.fillText('A T M O S P H E R E',512,239);
 }
 cx.font='17px Arial';cx.fillStyle='#bbb';cx.fillText('Ricardo P. Tapia Fernández · Oktopus Art Studio',512,348);
 cx.font='15px Arial';cx.fillText('@oktopus.art',512,379);
 cx.fillStyle='#eee';cx.font='20px Arial';
 cx.fillText(introFinished?'PINCH TO BEGIN':introStarted?'LISTEN':'ENTER VR',512,453);
 introTexture.needsUpdate=true;
}
paintIntro();
let lastCue=-1;
class Atmosphere extends xb.Script {
 init(){
  this.add(root);
  introPlane=new THREE.Mesh(new THREE.PlaneGeometry(1.6,.8),
    new THREE.MeshBasicMaterial({map:introTexture,transparent:true,depthWrite:false,depthTest:false}));
  introPlane.renderOrder=110;this.add(introPlane);
  this.last=0;
 }
 update(){
  const now=performance.now()/1000,dt=Math.min(.06,Math.max(0,now-this.last));this.last=now;
  if(introPlane){
   introPlane.visible=!started;
   const cam=xb.core.camera,p=new THREE.Vector3(),q=new THREE.Quaternion();
   cam.getWorldPosition(p);cam.getWorldQuaternion(q);
   introPlane.position.copy(p).add(new THREE.Vector3(0,0,-1.4).applyQuaternion(q));
   introPlane.quaternion.copy(q);
  }
  if(!started)return;
  soundFrame(dt);
  const duration=Number.isFinite(music.duration)&&music.duration>10?music.duration:402;
  const t=music.currentTime*402/duration;
  let cue=0;for(let i=cues.length-2;i>=0;i--)if(t>=cues[i].sec){cue=i;break}
  cloudEngine.update(t,{...params,intensity:params.intensity*.36},cue,bass,mid,high,transient);
  foreground.update(t,{bass,mid,high,attack:transient});
  if(showScene!==cue){showScene=cue;$('status').textContent=cues[cue].name+' · '+Math.floor(t)+'s'}
 }
 onSelectEnd(){
  if(started)return;
  if(!introStarted)beginIntro();else if(!introFinished)finishIntro();
  else startMusic().catch(err=>$('status').textContent=err.message);
 }
}
// XR Blocks creates the ONE renderer, camera and WebXR lifecycle.
const options=new xb.Options().enableXRTransitions();
options.xrSessionMode=mode==='VR'?'immersive-vr':'immersive-ar';
options.enableHands();
options.hands.visualization=false;
options.simulator.defaultMode=xb.SimulatorMode.CONTROLLER;
options.xrButton.showEnterSimulatorButton=true;
xb.add(new Atmosphere());
xb.init(options).then(()=>{
 const xrTransition=xb.core.transition;
 if(mode==='VR')xrTransition?.toVR({color:0x000000});else xrTransition?.toAR();
 $('status').textContent='Mode: '+(mode==='VR'?'virtual reality':'mixed reality')+' · select ENTER XR';
 $('vr').onclick=()=>{
  if(mode==='VR')return;
  location.href='./?mode=vr';
 };
 $('mr').onclick=()=>{
  if(mode==='MR')return;
  location.href='./?mode=mr';
 };
}).catch(e=>$('status').textContent='XR Blocks error: '+e.message);
