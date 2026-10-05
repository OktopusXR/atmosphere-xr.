import * as THREE from 'three';
import {createDirectionCue} from './direction.js?build=score-v34';
import {createEndMenu,MUSIC_LINKS} from './endmenu.js?build=score-v34';
import {createCountdown} from './countdown.js?build=score-v34';
import {scoreEnvelope} from './score.js?build=score-v34';
import {makeClouds} from './cloud.js?build=score-v34';
import {createWatch} from './watch.js?build=score-v34';
import {createForeground} from './stage.js?build=score-v34';
const $=id=>document.getElementById(id),vrMode='VR';
window.atmosAppReady=true;
$('development').textContent='NATIVE QUEST · READY';
const music=new Audio('../atmosphereADM_binaural.mp3');music.preload='auto';
const narration=new Audio('../atmosphere-intro-female.mp3');narration.preload='auto';
const lines=[
 ['Invisible networks connect all forms of life.','Redes invisibles conectan todas las formas de vida.'],
 ['From body to Earth. From Earth to cosmos.','Del cuerpo a la Tierra. De la Tierra al cosmos.'],
 ['Listen. You are part of this resonance.','Escucha. Eres parte de esta resonancia.']
];
let selectedMode=vrMode,introStarted=false,introFinished=false,entered=false,completed=false,timers=[],captionIndex=0;
const previewEnd=new URLSearchParams(location.search).get('preview')==='end';
let context,source,analyser,fft,td,bass=0,mid=0,high=0,rms=0,attack=0,previousRms=0,lastCue=-1,prevRawBass=0,prevRawMid=0;
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
const params={intensity:2,density:1,scale:1.9,speed:2,motion:1.8,variation:1};
const scene=new THREE.Scene();scene.background=new THREE.Color(0);
const camera=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,.02,90);
camera.position.set(0,1.6,0);
const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});
renderer.xr.enabled=true;renderer.xr.setFramebufferScaleFactor(.82);renderer.setPixelRatio(Math.min(devicePixelRatio,1.0));renderer.setSize(innerWidth,innerHeight);
document.body.appendChild(renderer.domElement);renderer.domElement.style.position='fixed';renderer.domElement.style.inset=0;renderer.domElement.style.zIndex='0';
$('intro').style.zIndex='100';
const root=new THREE.Group();scene.add(root);

const cloudEngine=makeClouds(root);
const foreground=createForeground(root);
const countdown=createCountdown(scene,soundtrackDuration);
const directionCue=createDirectionCue(scene);
const board=document.createElement('canvas');board.width=1024;board.height=600;
const ctx=board.getContext('2d'),boardTex=new THREE.CanvasTexture(board);
const introBoard=new THREE.Mesh(new THREE.PlaneGeometry(2.3,1.35),
 new THREE.MeshBasicMaterial({map:boardTex,transparent:true,depthWrite:false,depthTest:false}));

introBoard.renderOrder=100;scene.add(introBoard);
// Shared five-action immersive final menu; no automatic replay on any click.
const endMenu=createEndMenu(scene,onEndAction);
let menuPositioned=false,replayAfterMode=false;
function drawIntro(){
 // Editorial layout inspired by the user's NODE Institute reference.
 ctx.clearRect(0,0,1024,600);
 ctx.textAlign='left';
 ctx.fillStyle='#eee';ctx.font='bold 31px Arial';
 ctx.fillText('TECHNO POESIS',67,76);
 ctx.fillStyle='#eee';ctx.font='bold 27px Arial';
 ctx.fillText('AN IMMERSIVE XR EXPERIENCE',67,110);
 ctx.strokeStyle='rgba(255,255,255,.2)';ctx.lineWidth=1;
 ctx.beginPath();ctx.arc(754,280,207,0,Math.PI*2);ctx.stroke();
 if(introStarted&&!introFinished){
  ctx.fillStyle='#fff';ctx.font='bold 30px Arial';
  ctx.fillText(lines[captionIndex][0],67,255,885);
  ctx.fillStyle='#b6b6b6';ctx.font='23px Arial';
  ctx.fillText(lines[captionIndex][1],67,308,885);
 }else{
  ctx.fillStyle='#f1f1f1';ctx.font='27px Arial';
  ctx.fillText('INVISIBLE NETWORKS   /   RESONANCE',67,261);
 }
 ctx.fillStyle='#fff';ctx.font='bold 108px Arial';
 ctx.fillText('ATMOSPHERE',62,438,940);
 ctx.fillStyle='#ddd';ctx.font='20px Arial';
 ctx.fillText('Ricardo P. Tapia Fernández  /  Oktopus Art Studio',68,500);
 ctx.fillStyle='#a5a5a5';ctx.font='17px Arial';
 ctx.fillText('@oktopus.art',68,529);
 ctx.fillStyle='#fff';ctx.font='20px Arial';ctx.textAlign='right';
 ctx.fillText(introFinished?'ENTER EXPERIENCE':introStarted?'LISTEN':'ENTER VR',948,559);
 boardTex.needsUpdate=true;
}
function setCaption(i){captionIndex=i;$('en').textContent=lines[i][0];$('es').textContent=lines[i][1];drawIntro()}
function clearTimers(){timers.forEach(clearTimeout);timers=[]}
function finishIntro(){
 if(introFinished)return;introFinished=true;clearTimers();narration.pause();
 $('en').textContent='';$('es').textContent='';$('start').hidden=true;$('skip').hidden=true;
 $('enter').hidden=false;$('voice').style.display='none';drawIntro();
}
// Never use browser speechSynthesis: its timbre is robotic and unpredictable.
// The master narration must be replaced by a studio-quality female voice file.
function speechBackup(){
 if(introFinished)return;
 narration.pause();
 $('status').textContent='Narration recording unavailable · subtitles only';
 // Preserve the full caption progression, without generating synthetic speech.
}
function startIntro(){
 if(introStarted)return;
 introStarted=true;$('start').hidden=true;$('skip').hidden=false;
 $('voice').style.display='none';setCaption(0);
 // Master: natural female recording supplied by the artist, unprocessed and centered.
 narration.volume=1;narration.playbackRate=1;
 const dur=Number.isFinite(narration.duration)&&narration.duration>1?narration.duration:11.563537;
 timers.push(setTimeout(()=>{if(!introFinished)setCaption(1)},3650));
 timers.push(setTimeout(()=>{if(!introFinished)setCaption(2)},9000));
 narration.onended=finishIntro;
 narration.onerror=()=>{ $('status').textContent='Missing audio asset: atmosphere-intro-female.mp3 · subtitles only'; };
 const play=narration.play();
 if(play?.catch)play.catch(()=>{ $('status').textContent='Female narration audio file not published yet · subtitles only'; });
 timers.push(setTimeout(()=>{if(!introFinished)finishIntro()},Math.max(12,dur+3)*1000));
}
$('start').onclick=()=>{enterXR('VR');startIntro()};$('skip').onclick=finishIntro;
let visualStartedAt=0;
async function startMusic(){
 if(!introFinished)finishIntro();
 visualStartedAt=performance.now();
 entered=true;completed=false;$('intro').style.display='none';introBoard.visible=false;
 await music.play();
 $('status').textContent='ATMOSPHERE · MUSIC MASTER CLOCK';
}
// ENTER EXPERIENCE enters immersive VR and starts the sound together.
function showEnd(){
 entered=false;completed=true;introBoard.visible=false;
 menuPositioned=false;endMenu.reset();
 endMenu.show(true,renderer.xr.isPresenting,selectedMode);
 $('status').textContent='THE END';
}
async function restartExperience(){
 if(!completed)return;
 completed=false;root.visible=true;endMenu.show(false);menuPositioned=false;
 Object.assign(params,{intensity:2,density:1,scale:1.9,speed:2,motion:1.8,variation:1});
 watch.paint();
 music.pause();music.currentTime=0;lastCue=-1;visualStartedAt=performance.now();
 entered=true;introBoard.visible=false;
 $('status').textContent='ATMOSPHERE · RESTARTED';
 try{await music.play()}catch(e){$('status').textContent='Audio pending · '+e.message}
}
function onEndAction(id){
 if(MUSIC_LINKS[id]){
  const opened=window.open(MUSIC_LINKS[id],'_blank');
  if(opened)opened.opener=null;else window.location.href=MUSIC_LINKS[id];
  endMenu.reset();return;
 }
 if(id!=='VR'&&id!=='MR')return;
 if(renderer.xr.isPresenting&&selectedMode===id){
  restartExperience();return;
 }
 if(renderer.xr.isPresenting){
  replayAfterMode=true;requestedMode=id;
  renderer.xr.getSession().end().catch(()=>offerContinue(id));
 }else{
  replayAfterMode=true;offerContinue(id);
 }
}
music.onended=showEnd;
// Playback time alone drives a precomposed, continuously interpolated score.
function updateScore(){
 const duration=Number.isFinite(music.duration)&&music.duration>10?music.duration:soundtrackDuration;
 const t=(music.currentTime>0||!music.paused)?music.currentTime*soundtrackDuration/duration:Math.min(soundtrackDuration,Math.max(0,(performance.now()-visualStartedAt)/1000));
 const env=scoreEnvelope(t);
 cloudEngine.update(t,{...params,intensity:params.intensity*.7},0,
  env.bass,env.mid,env.high,env.attack);
 foreground.update(t,env,params,renderer.xr.isPresenting?renderer.xr.getCamera():camera);
 const marker=Math.floor(t/2);
 if(marker!==lastCue){lastCue=marker;$('status').textContent=foreground.active+' · '+Math.floor(t)+'s'}
 return t;
}

const controller1=renderer.xr.getController(0),controller2=renderer.xr.getController(1);
scene.add(controller1,controller2);
const watch=createWatch(scene,params,()=>changeMode());
watch.setMode('VR');
let lastAdvance=0;
function advance(){
 if(entered)return;
 const now=performance.now();if(now-lastAdvance<650)return;lastAdvance=now;
 if(!introStarted)startIntro();else if(!introFinished)finishIntro();
 else enterExperience();
}
for(const ctl of [controller1,controller2]){
 ctl.userData.watchSelecting=false;
 ctl.addEventListener('selectstart',event=>{
 if(completed){
  const origin=new THREE.Vector3(),dir=new THREE.Vector3();
  ctl.getWorldPosition(origin);ctl.getWorldDirection(dir).negate();
  endMenu.selectRay(origin,dir);return;
 }
 if(entered){
  const handed=event?.data?.handedness||event?.inputSource?.handedness;
  if(handed==='right'||(!handed&&ctl===controller2)){
   ctl.userData.watchSelecting=true;watch.controllerSelect(ctl);
  }
  return;
 }
 advance();
 });
 ctl.addEventListener('selectend',()=>{ctl.userData.watchSelecting=false;watch.releaseSelection()});
}
let pinched=false,handDetectedAt=0;
function handInput(frame){
 if(!renderer.xr.isPresenting||!frame||entered){handDetectedAt=0;pinched=false;return;}
 const session=renderer.xr.getSession(),space=renderer.xr.getReferenceSpace();
 if(!space)return;
 let touching=false;
 for(const src of session.inputSources){
  if(!src.hand||src.handedness!=='right')continue;
  if(!handDetectedAt)handDetectedAt=performance.now();
  const a=frame.getJointPose(src.hand.get('thumb-tip'),space);
  const b=frame.getJointPose(src.hand.get('index-finger-tip'),space);
  if(!a||!b)continue;
  const p=a.transform.position,q=b.transform.position;
  if(Math.hypot(p.x-q.x,p.y-q.y,p.z-q.z)<.032)touching=true;
 }
 if(touching&&!pinched&&performance.now()-handDetectedAt>900){
  if(completed){
   // Right-hand index ray must intersect a specific menu action.
   const right=[...session.inputSources].find(src=>src.handedness==='right'&&src.hand);
   if(right){
    const a=frame.getJointPose(right.hand.get('index-finger-phalanx-distal'),space);
    const b=frame.getJointPose(right.hand.get('index-finger-tip'),space);
    if(a&&b){
     const p=a.transform.position,q=b.transform.position;
     const o=new THREE.Vector3(q.x,q.y,q.z);
     const dir=new THREE.Vector3(q.x-p.x,q.y-p.y,q.z-p.z).normalize();
     endMenu.selectRay(o,dir);
    }
   }
  }else advance();
 }
 pinched=touching;
}

async function enterXR(mode='VR'){
 if(!navigator.xr){$('status').textContent='WebXR unavailable';return false}
 if(renderer.xr.isPresenting){
  if(selectedMode===mode)return true;
  $('status').textContent='EXITING '+selectedMode+' · CONTINUE IN '+mode;
  try{await renderer.xr.getSession().end()}catch(e){}
  return false;
 }
 try{
  selectedMode=mode;watch.setMode(mode);drawIntro();
  const vr=mode==='VR';
  scene.background=vr?new THREE.Color(0):null;renderer.setClearColor(0,vr?1:0);
  const session=await navigator.xr.requestSession(vr?'immersive-vr':'immersive-ar',
    {optionalFeatures:['local-floor','hand-tracking']});
  await renderer.xr.setSession(session);
  $('status').textContent='ATMOSPHERE '+mode+' · PLAYING';
  return true;
 }catch(e){
  $('status').textContent='XR ENTRY FAILED: '+e.message;
  return false;
 }
}
function enterExperience(){
 // Both requests begin *inside* the same user activation; audio begins
 // without relying on another click after the XR session is established.
 if(!introFinished)finishIntro();
 const xr=renderer.xr.isPresenting?Promise.resolve(true):enterXR('VR');
 const audio=startMusic().catch(e=>$('status').textContent='Audio pending; visual animation active · '+e.message);
 Promise.allSettled([xr,audio]).then(([result])=>{
  if(result.status==='fulfilled'&&result.value===false)
   $('status').textContent='VR not supported. Audio started; use Quest Browser WebXR.';
 });
}
$('enter').onclick=enterExperience;
let changingMode=false,requestedMode=null;
function offerContinue(mode){
 const overlay=$('xrButton');
 overlay.style.display='block';
 overlay.innerHTML='';
 const action=document.createElement('button');
 action.textContent='CONTINUE IN '+(mode==='VR'?'VR':'MIXED REALITY');
 action.style.cssText='font-size:16px;padding:18px 28px;background:#161616;color:white;border:2px solid #fff';
 action.onclick=async()=>{
  selectedMode=mode;watch.setMode(mode);
  const ok=await enterXR(mode);
  if(ok){
   requestedMode=null;overlay.style.display='none';
   if(replayAfterMode){replayAfterMode=false;restartExperience()}
  }
  else overlay.style.display='block';
 };
 overlay.appendChild(action);
 $('status').textContent='MODE READY · SELECT CONTINUE IN '+mode;
}
async function changeMode(){
 if(changingMode)return;
 changingMode=true;
 const destination=selectedMode==='VR'?'MR':'VR';
 requestedMode=destination;
 try{
  // Browser requires a fresh activation for a new immersive session.
  // Predictable two-step switch: exit the current session once and offer
  // ONE unambiguous Continue action. The master soundtrack keeps running.
  if(renderer.xr.isPresenting){
   await renderer.xr.getSession().end();
  }
  offerContinue(destination);
 }catch(e){
  offerContinue(destination);
 }finally{changingMode=false}
}

renderer.xr.addEventListener('sessionstart',()=>{
 $('xrButton').style.display='none';
 watch.watch.visible=false;
 if(completed){endMenu.show(true,true,selectedMode);menuPositioned=false}
});
renderer.xr.addEventListener('sessionend',()=>{
 watch.watch.visible=false;
 scene.background=new THREE.Color(0);renderer.setClearColor(0,1);
 if(completed){endMenu.show(true,false,selectedMode);menuPositioned=false}
 if(requestedMode){const next=requestedMode;requestedMode=null;offerContinue(next)}
});
$('modebar').style.display='none';
$('xrButton').style.display='none';
const clock=new THREE.Clock(),pos=new THREE.Vector3(),quat=new THREE.Quaternion(),offset=new THREE.Vector3(0,0,-1.7);
renderer.setAnimationLoop((t,frame)=>{
 const dt=Math.min(.06,clock.getDelta());
 handInput(frame);
 watch.update(frame,renderer,entered);
 if(entered)for(const ctl of [controller1,controller2]){
  if(ctl.userData.watchSelecting)watch.controllerSelect(ctl);
 }
 introBoard.visible=renderer.xr.isPresenting&&!entered&&!completed;
 endMenu.show(completed,renderer.xr.isPresenting,selectedMode);
 if(!entered&&!completed){
  const cam=renderer.xr.isPresenting?renderer.xr.getCamera():camera;
  cam.getWorldPosition(pos);cam.getWorldQuaternion(quat);
  introBoard.position.copy(pos).add(offset.clone().applyQuaternion(quat));
  introBoard.quaternion.copy(quat);
 }
 if(completed)endMenu.animate(renderer.xr.isPresenting?renderer.xr.getCamera():camera);
 if(completed&&renderer.xr.isPresenting){
  if(!menuPositioned){endMenu.update(renderer.xr.getCamera());menuPositioned=true}
  if(frame){
   const session=renderer.xr.getSession(),space=renderer.xr.getReferenceSpace();
   const right=session?.inputSources&&[...session.inputSources].find(src=>src.handedness==='right');
   if(right&&space){
    if(right.hand){
     const tip=frame.getJointPose(right.hand.get('index-finger-tip'),space);
     const base=frame.getJointPose(right.hand.get('index-finger-phalanx-distal'),space);
     if(tip&&base){
      const p=tip.transform.position,d=base.transform.position;
      endMenu.aimRay(new THREE.Vector3(p.x,p.y,p.z),
       new THREE.Vector3(p.x-d.x,p.y-d.y,p.z-d.z));
     }
    }else if(right.targetRaySpace){
     const pose=frame.getPose(right.targetRaySpace,space);
     if(pose){
      const p=pose.transform.position,o=pose.transform.orientation;
      endMenu.aimRay(new THREE.Vector3(p.x,p.y,p.z),
       new THREE.Vector3(0,0,-1).applyQuaternion(
        new THREE.Quaternion(o.x,o.y,o.z,o.w)));
     }
    }
   }
  }
 }
 const elapsed=entered?updateScore():0;
 const view=renderer.xr.isPresenting?renderer.xr.getCamera():camera;
 directionCue.update(view,foreground.focus,entered&&!completed&&!foreground.allAround);
 countdown.update(view,elapsed,entered&&!completed);
 renderer.render(scene,camera);
});
window.addEventListener('resize',()=>{
 camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
 renderer.setSize(innerWidth,innerHeight);
});
drawIntro();
$('development').textContent='SCORE V5 READY';
window.atmosAppReady=true;
