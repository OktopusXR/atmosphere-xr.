import * as THREE from 'three';
import * as xb from 'xrblocks';

// ATMOSPHERE XR Blocks V2 — MUSIC MASTER CLOCK.
// Soundtrack is the single timeline. Cues are explicitly provisional until the
// complete master has been annotated against its real musical phrases.
const $ = id => document.getElementById(id);
const music = new Audio('../atmosphereADM_binaural.mp3');
music.preload='auto';
const narration = new Audio('../atmosphere-intro.ogg');
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
 {sec:0,name:'AMBIENT PRESENCE'},
 {sec:39,name:'HALO FIELD'},
 {sec:97,name:'MEMBRANE ARCHITECTURE'},
 {sec:158,name:'CONSTELLATIONS'},
 {sec:224,name:'LIGHT CUTS'},
 {sec:289,name:'ATMOSPHERIC MATTER'},
 {sec:353,name:'DISSOLUTION'},
 {sec:402,name:'END'}
];
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
 const duration=Number.isFinite(narration.duration)&&narration.duration>6?narration.duration:12.6;
 for(const [i,at] of [[1,.32],[2,.66]])timers.push(setTimeout(()=>{if(!introFinished)caption(i)},duration*at*1000));
 timers.push(setTimeout(finishIntro,Math.max(10.2,duration+1.1)*1000));
 narration.play().catch(()=>{$('status').textContent='Voice playback unavailable; subtitles remain visible'});
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
const fieldMat=new THREE.PointsMaterial({color:0xffffff,size:.042,transparent:true,opacity:.27,depthWrite:false});
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

let canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;
const cx=canvas.getContext('2d'),introTexture=new THREE.CanvasTexture(canvas);
let introPlane;
function paintIntro(){
 cx.clearRect(0,0,1024,512);
 cx.fillStyle=mode==='VR'?'rgba(0,0,0,.94)':'rgba(0,0,0,.72)';
 cx.fillRect(0,0,1024,512);
 cx.fillStyle='#fff';cx.textAlign='center';
 cx.font='23px Arial';cx.fillText('TECHNO POESIS',512,58);
 cx.font='59px Arial';cx.fillText('ATMOSPHERE',512,141);
 if(introStarted&&!introFinished){
  const l=phrases.find(p=>p[0]===$('en').textContent)||phrases[0];
  cx.font='29px Arial';cx.fillText(l[0],512,226);
  cx.font='22px Arial';cx.fillText(l[1],512,270);
 }else if(!introFinished){
  cx.font='22px Arial';cx.fillText('Invisible networks connect all forms of life.',512,235);
 }
 cx.fillStyle='#bbb';cx.font='20px Arial';cx.fillText('Ricardo P. Tapia Fernández · Oktopus Art Studio',512,328);
 cx.font='19px Arial';cx.fillText('@oktopus.art',512,360);
 cx.fillStyle='#fff';cx.font='27px Arial';
 cx.fillText(introFinished?'PINCH / TRIGGER · ENTER EXPERIENCE':introStarted?'PINCH / TRIGGER · SKIP':'PINCH / TRIGGER · START',512,430);
 introTexture.needsUpdate=true;
}
paintIntro();
let lastCue=-1;
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
 soundFrame(dt);
 const duration=Number.isFinite(music.duration)&&music.duration>10?music.duration:soundtrackDuration;
 const t=music.currentTime*soundtrackDuration/duration;
 let cue=0;
 for(let i=cues.length-2;i>=0;i--)if(t>=cues[i].sec){cue=i;break}
 const phase=(t-cues[cue].sec)/(cues[cue+1].sec-cues[cue].sec);
 let event=EVENT_SCORE[0];for(const e of EVENT_SCORE)if(e.t<=t)event=e;else break;
 const since=Math.max(0,t-event.t),burst=Math.exp(-since*2.4);
 const modulation=Math.min(1,bass*2+attack*.5);
 // Permanent low-level spatial presence. No complete blackouts at cue boundaries.
 fieldMat.opacity=.26+.04*Math.sin(t*.28)+.08*Math.min(1,rms*4);
 constantField.rotation.y=t*.0016;
 const haloWeight=Math.max(cue===0?.28:cue===6?.28:.125,weight(cue,1,phase));
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

class Atmosphere extends xb.Script {
 init(){
  this.add(root);
  introPlane=new THREE.Mesh(new THREE.PlaneGeometry(1.6,.8),
   new THREE.MeshBasicMaterial({map:introTexture,transparent:true,depthWrite:false,depthTest:false}));
  introPlane.renderOrder=110;this.add(introPlane);this.last=0;
 }

 update(){
  let now=performance.now()/1000,dt=Math.min(.06,Math.max(0,now-this.last));this.last=now;
  // The native XR simulator and Quest headset always see the original intro.
  if(introPlane){
   introPlane.visible=!started;
   const cam=xb.core.camera,pt=new THREE.Vector3(),qt=new THREE.Quaternion();
   cam.getWorldPosition(pt);cam.getWorldQuaternion(qt);
   introPlane.position.copy(pt).add(new THREE.Vector3(0,0,-1.4).applyQuaternion(qt));
   introPlane.quaternion.copy(qt);
  }
  const cv=$('voice'),vtx=cv.getContext('2d');
  if(introStarted&&!introFinished){
   vtx.clearRect(0,0,640,64);
   vtx.fillStyle='#eee';for(let i=0;i<66;i++){
    const x=10+i*9.5,phase=narration.currentTime*10;
    const h=(.5+.5*Math.sin(i*.6+phase))*13*Math.sin(i/65*Math.PI);
    vtx.fillRect(x,32-h,2,2*h);
   }
  }
  if(started)updateScore(dt);
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
