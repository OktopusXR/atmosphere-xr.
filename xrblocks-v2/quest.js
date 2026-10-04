import * as THREE from 'three';
import {makeClouds} from './cloud.js?build=score-v6';
import {createWatch} from './watch.js?build=score-v6';
import {createForeground} from './stage.js?build=score-v6';
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
const params={intensity:1,density:.67,scale:1,speed:.6,motion:.8,variation:.55};
const scene=new THREE.Scene();scene.background=new THREE.Color(0);
const camera=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,.02,90);
camera.position.set(0,1.6,0);
const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});
renderer.xr.enabled=true;renderer.setPixelRatio(Math.min(devicePixelRatio,1.0));renderer.setSize(innerWidth,innerHeight);
document.body.appendChild(renderer.domElement);renderer.domElement.style.position='fixed';renderer.domElement.style.inset=0;renderer.domElement.style.zIndex='0';
$('intro').style.zIndex='100';
const root=new THREE.Group();scene.add(root);

const cloudEngine=makeClouds(root);
const foreground=createForeground(root);
const board=document.createElement('canvas');board.width=1024;board.height=600;
const ctx=board.getContext('2d'),boardTex=new THREE.CanvasTexture(board);
const introBoard=new THREE.Mesh(new THREE.PlaneGeometry(1.68,.985),
 new THREE.MeshBasicMaterial({map:boardTex,transparent:true,depthWrite:false,depthTest:false}));
introBoard.renderOrder=100;scene.add(introBoard);
function drawIntro(){
 // Editorial layout inspired by the user's NODE Institute reference.
 ctx.clearRect(0,0,1024,600);
 ctx.textAlign='left';
 ctx.fillStyle='#c3c3c3';ctx.font='23px Arial';
 ctx.fillText('TECHNO POESIS',67,76);
 ctx.fillStyle='#e5e5e5';ctx.font='20px Arial';
 ctx.fillText('AN IMMERSIVE XR EXPERIENCE',67,110);
 ctx.strokeStyle='rgba(255,255,255,.2)';ctx.lineWidth=1;
 ctx.beginPath();ctx.arc(754,280,207,0,Math.PI*2);ctx.stroke();
 if(introStarted&&!introFinished){
  ctx.fillStyle='#fff';ctx.font='28px Arial';
  ctx.fillText(lines[captionIndex][0],67,255,885);
  ctx.fillStyle='#b6b6b6';ctx.font='23px Arial';
  ctx.fillText(lines[captionIndex][1],67,308,885);
 }else{
  ctx.fillStyle='#f1f1f1';ctx.font='27px Arial';
  ctx.fillText('INVISIBLE NETWORKS   /   RESONANCE',67,261);
 }
 ctx.fillStyle='#fff';ctx.font='bold 91px Arial';
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
// ENTER EXPERIENCE enters immersive VR and starts the sound together.
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
 const lowNow=spectrum(25,170),midNow=spectrum(170,2000),highNow=spectrum(2000,12000);
 rms+=(r-rms)*.25;
 // Fast rise with restrained decay exposes actual low-end rhythmic articulation.
 bass+=(lowNow-bass)*(lowNow>bass?.43:.12);
 mid+=(midNow-mid)*.24;high+=(highNow-high)*.26;
 const lowRise=lowNow-prevRawBass,midRise=midNow-prevRawMid;
 attack=Math.max(0,attack-dt*3.7);
 if((r-previousRms>.008&&r>.019)||(lowRise>.032&&lowNow>.09)||(midRise>.045&&midNow>.1))attack=1;
 prevRawBass=lowNow;prevRawMid=midNow;previousRms=r;
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
 cloudEngine.update(t,{...params,intensity:params.intensity*.38},cue,bass,mid,high,accent);
 foreground.update(t,{bass,mid,high,attack:accent},params);
 if(cue!==lastCue){lastCue=cue;$('status').textContent=foreground.active+' · '+Math.floor(t)+'s'}
}

const controller1=renderer.xr.getController(0),controller2=renderer.xr.getController(1);
scene.add(controller1,controller2);
const watch=createWatch(scene,params,()=>switchToMixedReality());
let lastAdvance=0;
function advance(){
 if(entered)return;
 const now=performance.now();if(now-lastAdvance<650)return;lastAdvance=now;
 if(!introStarted)startIntro();else if(!introFinished)finishIntro();
 else enterExperience();
}
for(const ctl of [controller1,controller2])ctl.addEventListener('selectstart',event=>{
 if(entered){
  const handed=event?.data?.handedness||event?.inputSource?.handedness;
  if(handed!=='left')watch.controllerSelect(ctl);
  return;
 }
 advance();
});
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
  if(Math.hypot(p.x-q.x,p.y-q.y,p.z-q.z)<.032)touching=true;
 }
 if(touching&&!pinched)advance();pinched=touching;
}

async function enterXR(mode='VR'){
 if(!navigator.xr){$('status').textContent='WebXR unavailable';return false}
 if(renderer.xr.isPresenting) return true;
 try{
  selectedMode=mode;drawIntro();
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
 const audio=startMusic().catch(e=>$('status').textContent='AUDIO: '+e.message);
 Promise.allSettled([xr,audio]).then(([result])=>{
  if(result.status==='fulfilled'&&result.value===false)
   $('status').textContent='VR not supported. Audio started; use Quest Browser WebXR.';
 });
}
$('enter').onclick=enterExperience;
let pendingMR=false;
function showModeFallback(){
 // WebXR sometimes requires a fresh gesture when changing session types.
 // This 2D button appears only if seamless switching was rejected.
 const overlay=$('xrButton');
 overlay.style.display='block';
 overlay.innerHTML='<button id="retryMR">CONTINUE IN MIXED REALITY</button>';
 $('retryMR').onclick=()=>{overlay.style.display='none';enterXR('MR')};
}
async function switchToMixedReality(){
 if(pendingMR)return;
 pendingMR=true;
 try{
  if(!renderer.xr.isPresenting){await enterXR('MR');return}
  await renderer.xr.getSession().end();
  const ok=await enterXR('MR');
  if(!ok)showModeFallback();
 }catch(e){
  $('status').textContent='MR SWITCH: '+e.message;
  showModeFallback();
 }finally{pendingMR=false}
}
renderer.xr.addEventListener('sessionstart',()=>{
 $('xrButton').style.display='none';
 watch.watch.visible=false;
});
renderer.xr.addEventListener('sessionend',()=>{
 watch.watch.visible=false;
 scene.background=new THREE.Color(0);renderer.setClearColor(0,1);
});
$('modebar').style.display='none';
$('xrButton').style.display='none';
const clock=new THREE.Clock(),pos=new THREE.Vector3(),quat=new THREE.Quaternion(),offset=new THREE.Vector3(0,0,-1.7);
renderer.setAnimationLoop((t,frame)=>{
 const dt=Math.min(.06,clock.getDelta());
 handInput(frame);
 watch.update(frame,renderer,entered);
 introBoard.visible=renderer.xr.isPresenting&&!entered&&!completed;
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
$('development').textContent='SCORE V5 READY';
window.atmosAppReady=true;
