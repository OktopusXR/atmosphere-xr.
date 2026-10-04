import * as THREE from 'three';
import {scoreEnvelope} from './score.js?build=score-v9';
import {makeClouds} from './cloud.js?build=score-v9';
import {createWatch} from './watch.js?build=score-v9';
import {createForeground} from './stage.js?build=score-v9';
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
const params={intensity:1,density:.67,scale:1,speed:.6,motion:.8,variation:.55};
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
let visualStartedAt=0;
async function startMusic(){
 if(!introFinished)finishIntro();
 visualStartedAt=performance.now();
 started=true;$('intro').style.display='none';paintIntro();
 await music.play();
 $('status').textContent='ATMOSPHERE — score follows music.currentTime';
}
$('enter').onclick=()=>startMusic().catch(e=>$('status').textContent='Audio pending; visual animation active · '+e.message);
music.onended=()=>{started=false;$('status').textContent='ATMOSPHERE · END';};
const root=new THREE.Group();
const cloudEngine=makeClouds(root);
const foreground=createForeground(root);
const wrist=createWatch(root,params,()=>{
 const xr=xb.core?.transition;
 if(mode==='VR'){mode='MR';wrist.setMode('MR');xr?.toAR?.();}
 else{mode='VR';wrist.setMode('VR');xr?.toVR?.({color:0x000000});}
});
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
  cx.fillStyle='#fff';cx.font='bold 27px Arial';cx.fillText(l[0],512,226);
  cx.fillStyle='#bbb';cx.font='bold 20px Arial';cx.fillText(l[1],512,268);
 }else{
  cx.fillStyle='#fff';cx.font='38px Arial';cx.fillText('A T M O S P H E R E',512,239);
 }
 cx.font='bold 20px Arial';cx.fillStyle='#bbb';cx.fillText('Ricardo P. Tapia Fernández · Oktopus Art Studio',512,348);
 cx.font='bold 18px Arial';cx.fillText('@oktopus.art',512,379);
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
 update(time,frame){
  const now=performance.now()/1000,dt=Math.min(.06,Math.max(0,now-this.last));this.last=now;
  if(introPlane){
   introPlane.visible=!started;
   const cam=xb.core.camera,p=new THREE.Vector3(),q=new THREE.Quaternion();
   cam.getWorldPosition(p);cam.getWorldQuaternion(q);
   introPlane.position.copy(p).add(new THREE.Vector3(0,0,-1.4).applyQuaternion(q));
   introPlane.quaternion.copy(q);
  }
  const renderer=xb.core?.renderer||xb.core?.engine?.renderer;
  if(renderer?.xr){wrist.update(frame||renderer.xr.getFrame?.(),renderer,started)}
  if(!started)return;
  // XR Blocks supplies selected controller rays, including trigger drag.
  for(const ctl of xb.core?.input?.controllers||[]){
   if(ctl?.userData?.selected&&ctl?.userData?.handedness!=='left')wrist.controllerSelect(ctl);
  }
  const duration=Number.isFinite(music.duration)&&music.duration>10?music.duration:402;
  const t=(music.currentTime>0||!music.paused)?music.currentTime*402/duration:Math.min(402,Math.max(0,(performance.now()-visualStartedAt)/1000));
  const env=scoreEnvelope(t);
  let cue=0;for(let i=cues.length-2;i>=0;i--)if(t>=cues[i].sec){cue=i;break}
  cloudEngine.update(t,{...params,intensity:params.intensity*.38},0,env.bass,env.mid,env.high,env.attack);
  foreground.update(t,env,params);
  if(showScene!==cue){showScene=cue;$('status').textContent=cues[cue].name+' · '+Math.floor(t)+'s'}
 }
 onSelectStart(event){
  if(!started)return;
  if(event?.intersection?.point)wrist.hitPosition(event.intersection.point);
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
 const xrRenderer=xb.core?.renderer||xb.core?.engine?.renderer;
 if(xrRenderer?.xr)for(let i=0;i<2;i++){
  xrRenderer.xr.getController(i)?.addEventListener('selectstart',e=>{
   if(started&&e?.data?.handedness!=='left')wrist.controllerSelect(xrRenderer.xr.getController(i));
  });
 }
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
