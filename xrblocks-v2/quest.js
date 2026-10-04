import * as THREE from 'three';
import {makeClouds} from './cloud.js?build=score-v5';
import {createForeground} from './stage.js?build=score-v5';
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
const foreground=createForeground(root);
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
 narration.onerror=speechBackup;
 const play=narration.play();
 if(play?.catch)play.catch(speechBackup);
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
 cloudEngine.update(t,{...params,intensity:params.intensity*.36},cue,bass,mid,high,accent);
 foreground.update(t,{bass,mid,high,attack:accent});
 if(cue!==lastCue){lastCue=cue;$('status').textContent=foreground.active+' · '+Math.floor(t)+'s'}
}

const controller1=renderer.xr.getController(0),controller2=renderer.xr.getController(1);
scene.add(controller1,controller2);
const wristCanvas=document.createElement('canvas');wristCanvas.width=1024;wristCanvas.height=650;
const wc=wristCanvas.getContext('2d'),wristTexture=new THREE.CanvasTexture(wristCanvas);
const wristMat=new THREE.MeshBasicMaterial({map:wristTexture,transparent:true,depthWrite:false,depthTest:false,side:THREE.DoubleSide});
const wristPanel=new THREE.Mesh(new THREE.PlaneGeometry(.56,.355),wristMat);
wristPanel.visible=false;wristPanel.renderOrder=130;scene.add(wristPanel);
const controlRows=[
 {key:'intensity',min:.25,max:2,title:'BRIGHTNESS'},
 {key:'density',min:.22,max:1,title:'DENSITY'},
 {key:'scale',min:.4,max:2.4,title:'SCALE'},
 {key:'motion',min:.08,max:2,title:'MOVEMENT'},
 {key:'speed',min:.05,max:2,title:'SPEED'}
];
function paintWrist(){
 wc.clearRect(0,0,1024,650);
 // Matte floating typographic panel on hand only, not micelial decoration.
 wc.fillStyle='rgba(4,4,4,.77)';wc.fillRect(0,0,1024,650);
 wc.strokeStyle='rgba(230,230,230,.28)';wc.strokeRect(15,15,994,620);
 wc.fillStyle='#fff';wc.textAlign='left';wc.font='32px Arial';wc.fillText('ATMOSPHERE / PARAMETERS',54,75);
 controlRows.forEach((r,i)=>{
  const y=141+i*86,f=(params[r.key]-r.min)/(r.max-r.min);
  wc.font='24px Arial';wc.fillStyle='#ddd';wc.fillText(r.title,54,y);
  wc.fillStyle='#444';wc.fillRect(420,y-18,450,5);
  wc.fillStyle='#eee';wc.fillRect(420,y-18,450*Math.max(0,Math.min(1,f)),5);
  wc.beginPath();wc.arc(420+450*f,y-16,13,0,Math.PI*2);wc.fill();
 });
 wc.fillStyle='#ddd';wc.font='27px Arial';
 wc.fillText('SWITCH TO MIXED REALITY',54,615);
 wristTexture.needsUpdate=true;
}
paintWrist();
function applyWrist(point){
 if(!wristPanel.visible)return false;
 wristPanel.updateMatrixWorld(true);
 const p=wristPanel.worldToLocal(point.clone());
 if(Math.abs(p.z)>.17||Math.abs(p.x)>.28||Math.abs(p.y)>.1775)return false;
 const x=(p.x/.56+.5)*1024,y=(.5-p.y/.355)*650;
 if(y>555){
  switchToMixedReality();
  return true;
 }
 const i=Math.round((y-141)/86);
 if(i<0||i>=controlRows.length||Math.abs(y-(141+i*86))>34)return false;
 const c=controlRows[i],fraction=Math.max(0,Math.min(1,(x-420)/450));
 params[c.key]=c.min+(c.max-c.min)*fraction;
 paintWrist();return true;
}
const raycaster=new THREE.Raycaster(),hitDir=new THREE.Vector3();
function selectWristController(controller){
 if(!wristPanel.visible)return false;
 controller.getWorldDirection(hitDir);hitDir.negate();
 raycaster.set(controller.getWorldPosition(new THREE.Vector3()),hitDir);
 const intersect=raycaster.intersectObject(wristPanel,false)[0];
 return intersect?applyWrist(intersect.point):false;
}
let lastAdvance=0;
function advance(){
 if(entered)return;
 const now=performance.now();if(now-lastAdvance<650)return;lastAdvance=now;
 if(!introStarted)startIntro();else if(!introFinished)finishIntro();
 else enterExperience();
}
for(const ctl of [controller1,controller2])ctl.addEventListener('selectstart',()=>{
 if(entered){selectWristController(ctl);return}
 advance();
});
let pinched=false;
let handPoint=new THREE.Vector3(),handOrientation=new THREE.Quaternion(),menuInputHeld=false;
const LOOK=new THREE.Vector3(),UP=new THREE.Vector3(0,1,0);
function handInput(frame){
 if(!renderer.xr.isPresenting||!frame)return;
 const session=renderer.xr.getSession(),space=renderer.xr.getReferenceSpace();
 if(!space)return;
 let touching=false,rightTip=null,leftWrist=null;
 for(const src of session.inputSources){
  if(!src.hand)continue;
  const wrist=frame.getJointPose(src.hand.get('wrist'),space);
  const thumb=frame.getJointPose(src.hand.get('thumb-tip'),space);
  const finger=frame.getJointPose(src.hand.get('index-finger-tip'),space);
  if(!thumb||!finger)continue;
  const p=thumb.transform.position,q=finger.transform.position;
  const pinch=Math.hypot(p.x-q.x,p.y-q.y,p.z-q.z)<.032;
  if(src.handedness==='left'&&wrist)leftWrist=wrist;
  if(src.handedness==='right'){rightTip=new THREE.Vector3(q.x,q.y,q.z);touching=pinch}
  if(!entered&&pinch)touching=true;
 }
 if(entered){
  if(leftWrist){
   const p=leftWrist.transform.position;
   wristPanel.position.set(p.x+.09,p.y+.18,p.z-.08);
   const cam=renderer.xr.getCamera();
   cam.getWorldPosition(LOOK);
   wristPanel.lookAt(LOOK);
   wristPanel.visible=true;
  }else{
   // Controller-only or hands hidden: a small wrist-like panel beside left controller.
   const left=session.inputSources.find(src=>src.handedness==='left');
   if(left&&left.gripSpace){
    const pose=frame.getPose(left.gripSpace,space);
    if(pose){
     const p=pose.transform.position;
     wristPanel.position.set(p.x+.05,p.y+.16,p.z-.06);
     wristPanel.lookAt(renderer.xr.getCamera().getWorldPosition(LOOK));
     wristPanel.visible=true;
    }
   }
  }
  if(touching&&!menuInputHeld&&rightTip)applyWrist(rightTip);
  menuInputHeld=touching;
 }else{
  wristPanel.visible=false;
  if(touching&&!pinched)advance();
  pinched=touching;
 }
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
 wristPanel.visible=false;
});
renderer.xr.addEventListener('sessionend',()=>{
 wristPanel.visible=false;
 scene.background=new THREE.Color(0);renderer.setClearColor(0,1);
});
$('modebar').style.display='none';
$('xrButton').style.display='none';
const clock=new THREE.Clock(),pos=new THREE.Vector3(),quat=new THREE.Quaternion(),offset=new THREE.Vector3(0,0,-1.7);
renderer.setAnimationLoop((t,frame)=>{
 const dt=Math.min(.06,clock.getDelta());
 handInput(frame);
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
