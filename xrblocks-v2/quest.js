import * as THREE from 'three';
const $=id=>document.getElementById(id),vrMode=new URLSearchParams(location.search).get('mode')==='mr'?'MR':'VR';
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
 {sec:0,name:'AMBIENT PRESENCE'},
 {sec:39,name:'HALO FIELD'},
 {sec:97,name:'MEMBRANE ARCHITECTURE'},
 {sec:158,name:'CONSTELLATIONS'},
 {sec:224,name:'LIGHT CUTS'},
 {sec:289,name:'ATMOSPHERIC MATTER'},
 {sec:353,name:'DISSOLUTION'},
 {sec:402,name:'END'}
];
const scene=new THREE.Scene();scene.background=new THREE.Color(0);
const camera=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,.02,90);
camera.position.set(0,1.6,0);
const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});
renderer.xr.enabled=true;renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);
document.body.appendChild(renderer.domElement);renderer.domElement.style.position='fixed';renderer.domElement.style.inset=0;renderer.domElement.style.zIndex='0';
$('intro').style.zIndex='100';
const root=new THREE.Group();scene.add(root);

const TAU=Math.PI*2,CENTER_Y=1.6;
function lineMat(opacity=0){return new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending})}
function polar(r,a,y){return new THREE.Vector3(Math.sin(a)*r,CENTER_Y+y,-Math.cos(a)*r)}
function smooth(x){x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)}
function weight(cue,desired,phase){
 if(cue===desired)return .18+.82*smooth(phase/.12)*(1-smooth((phase-.90)/.16));
 if(cue===desired+1)return (1-smooth(phase/.15))*.3;
 if(cue===desired-1)return smooth((phase-.83)/.17)*.3;
 return 0;
}
// Constant faint far field: never a blackout, including dissolves.
const fieldCount=450,fieldPositions=new Float32Array(fieldCount*3);
for(let i=0;i<fieldCount;i++){
 const f=(i+.5)/fieldCount,a=i*2.3999632297,r=4.4+2.1*(.5+.5*Math.sin(i*7.19));
 fieldPositions[i*3]=r*Math.cos(a);
 fieldPositions[i*3+1]=CENTER_Y+(f*2-1)*5.6;
 fieldPositions[i*3+2]=r*Math.sin(a);
}
const fieldGeo=new THREE.BufferGeometry();
fieldGeo.setAttribute('position',new THREE.BufferAttribute(fieldPositions,3));
const fieldMat=new THREE.PointsMaterial({color:0xffffff,size:.032,transparent:true,opacity:.19,depthWrite:false});
const constantField=new THREE.Points(fieldGeo,fieldMat);
constantField.frustumCulled=false;root.add(constantField);
// 360° open halo bands, with azimuths beyond the viewer's field of view.
const halos=[];
for(let i=0;i<10;i++){
 const radius=2.6+(i%5)*.73,a=i*2.399963,span=.62+(i%3)*.22,points=[];
 for(let j=0;j<=110;j++){
  const f=j/110,angle=a+(f-.5)*span*2.2;
  points.push(polar(radius,angle,1.3*Math.sin(a*1.2)+.35*Math.sin(f*TAU+i)));
 }
 const arc=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),lineMat());
 arc.frustumCulled=false;root.add(arc);halos.push(arc);
}
// Suspended 3D membranes: open, gently deforming curved, vertical woven filaments.
const membranes=[];
for(let i=0;i<4;i++){
 const strands=[],start=i*TAU/4+.5;
 for(let j=0;j<22;j++){
  const path=[],radius=3.0+i*.28,a=start+(j/21-.5)*1.28;
  for(let k=0;k<=34;k++){
   const f=k/34,y=(f-.5)*3.7;
   path.push(polar(radius+.15*Math.sin(k*.21+j*.55),a+.11*Math.sin(f*5+j*.26),y));
  }
  const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(path),lineMat());
  line.frustumCulled=false;root.add(line);strands.push(line);
 }
 membranes.push(strands);
}
// Distributed nodes and regional links, not a frontal starfield.
const constellations=[];
for(let region=0;region<8;region++){
 const pts=[],links=[],sector=region*TAU/8+.2;
 for(let i=0;i<38;i++){
  const a=sector+Math.sin(i*13.17)*.32;
  const p=polar(2.5+(i%9)*.32,a,-1.7+(i%13)*.29);
  pts.push(p);
  if(i>0&&i%3===0)links.push(pts[i-1],p);
 }
 const points=new THREE.Points(new THREE.BufferGeometry().setFromPoints(pts),
  new THREE.PointsMaterial({color:0xffffff,size:.047,transparent:true,opacity:0,depthWrite:false}));
 const connectors=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(links),lineMat());
 root.add(points,connectors);constellations.push({points,connectors});
}
// Sparse vertical/diagonal interventions in seven different zones.
const cuts=[];
for(let i=0;i<7;i++){
 const a=(i*.897+2.15)%TAU,r=2.8+(i%3)*1.04,h=2.4+i*.21;
 const p=polar(r,a,-h),q=polar(r,a,h);
 q.x+=Math.sin(a+.6)*.65;q.z-=Math.cos(a+.6)*.65;
 const beam=new THREE.Line(new THREE.BufferGeometry().setFromPoints([p,q]),lineMat());
 beam.frustumCulled=false;root.add(beam);cuts.push(beam);
}
// Suspended matter through 360° near, middle and far layers.
const matterCount=1100,matterPositions=new Float32Array(matterCount*3);
for(let i=0;i<matterCount;i++){
 const a=i*2.399963,r=1.65+4.6*((i*67%1103)/1103);
 matterPositions[i*3]=r*Math.cos(a);
 matterPositions[i*3+1]=CENTER_Y+2.5*Math.sin(i*8.11);
 matterPositions[i*3+2]=r*Math.sin(a);
}
const matterGeo=new THREE.BufferGeometry();
matterGeo.setAttribute('position',new THREE.BufferAttribute(matterPositions,3).setUsage(THREE.DynamicDrawUsage));
const matterMat=new THREE.PointsMaterial({color:0xffffff,size:.022,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending});
const matter=new THREE.Points(matterGeo,matterMat);
matter.frustumCulled=false;root.add(matter);
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

const EVENT_SCORE=[
 {t:0,sector:5},{t:9,sector:2},{t:22,sector:7},
 {t:39,sector:4},{t:54,sector:1},{t:69,sector:6},{t:84,sector:3},
 {t:97,sector:0},{t:119,sector:4},{t:142,sector:2},
 {t:158,sector:5},{t:175,sector:1},{t:190,sector:6},{t:210,sector:3},
 {t:224,sector:7},{t:241,sector:2},{t:263,sector:5},{t:276,sector:1},
 {t:289,sector:4},{t:314,sector:0},{t:335,sector:7},
 {t:353,sector:3},{t:372,sector:6},{t:391,sector:1}
];
// Provisional music marks pending exact track annotation: time is ALWAYS music.currentTime.
function updateScore(dt){
 analyze(dt);
 const duration=Number.isFinite(music.duration)&&music.duration>10?music.duration:soundtrackDuration;
 const t=music.currentTime*soundtrackDuration/duration;
 let cue=0;
 for(let i=cues.length-2;i>=0;i--)if(t>=cues[i].sec){cue=i;break}
 const phase=(t-cues[cue].sec)/(cues[cue+1].sec-cues[cue].sec);
 let event=EVENT_SCORE[0];for(const e of EVENT_SCORE)if(e.t<=t)event=e;else break;
 const since=Math.max(0,t-event.t),burst=Math.exp(-since*2.4);
 const modulation=Math.min(1,bass*2+attack*.5);
 // Permanent low-level spatial presence. No complete blackouts at cue boundaries.
 fieldMat.opacity=.19+.035*Math.sin(t*.28)+.07*Math.min(1,rms*4);
 constantField.rotation.y=t*.0016;
 const haloWeight=Math.max(cue===0?.18:cue===6?.18:.075,weight(cue,1,phase));
 const membraneWeight=weight(cue,2,phase);
 const nodeWeight=weight(cue,3,phase);
 const cutWeight=weight(cue,4,phase);
 const matterWeight=Math.max(cue===6?.21:0,weight(cue,5,phase));
 if(cue!==lastCue){lastCue=cue;$('status').textContent=cues[cue].name+' · '+Math.floor(t)+'s · 360°'}
 halos.forEach((arc,i)=>{
  const sector=(i*3+5)%8,match=sector===event.sector?1:0;
  arc.material.opacity=Math.min(.83,.025+haloWeight*(.18+.16*Math.sin(t*.04+i)**2+
      match*burst*.55+modulation*.12));
  arc.rotation.y=Math.sin(t*.014+i)*.045;
 });
 membranes.forEach((strands,i)=>strands.forEach((strand,j)=>{
  strand.visible=membraneWeight>.001;
  strand.material.opacity=membraneWeight*(.012+.035*Math.sin(j*.5+i+t*.13)**2+
     (i===event.sector%4?burst*.08:0))*(.65+.35*modulation);
  strand.rotation.y=Math.sin(t*.04+i*.9)*.022;
 }));
 constellations.forEach((c,i)=>{
  const focus=i===event.sector?1:.16;
  c.points.visible=c.connectors.visible=nodeWeight>.001;
  c.points.material.opacity=nodeWeight*(.13+focus*(.5+.35*burst));
  c.connectors.material.opacity=c.points.material.opacity*.19;
 });
 cuts.forEach((beam,i)=>{
  const hit=i===event.sector%7?1:.025;
  const sweeping=Math.exp(-Math.pow(phase*6-i,2)*.36);
  beam.visible=cutWeight>.001;
  beam.material.opacity=cutWeight*(.04+hit*(.42*burst+.29*sweeping));
 });
 matter.visible=matterWeight>.001;
 matterMat.opacity=matterWeight*(.12+.23*Math.min(1,high*2))*
  (cue===6?Math.max(.3,1-phase):1);
 if(matter.visible){
  for(let i=0;i<matterCount;i++){
   const a=i*2.399963+t*.004*(1+(i%4)*.2),r=1.65+4.6*((i*67%1103)/1103);
   matterPositions[i*3]=r*Math.cos(a);
   matterPositions[i*3+1]=CENTER_Y+2.5*Math.sin(i*8.11+t*.013);
   matterPositions[i*3+2]=r*Math.sin(a);
  }
  matterGeo.attributes.position.needsUpdate=true;
 }
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
