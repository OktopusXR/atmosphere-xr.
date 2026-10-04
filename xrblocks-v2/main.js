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
let introStarted=false,introFinished=false,started=false,mode='VR',timers=[];
let audioContext,analyser,timeBins,freqBins,audioSource,prevEnergy=0;
let bass=0,mid=0,high=0,rms=0,pulse=0,transient=0,smoothedMid=0;
let lastAudioTime=0,lastFrameSec=0,showScene=-1;
const CUES=[
 {sec:0,name:'THRESHOLD',visual:'signal'},
 {sec:39,name:'LINE',visual:'line'},
 {sec:97,name:'ARCHITECTURE',visual:'frame'},
 {sec:158,name:'BREATH',visual:'volume'},
 {sec:224,name:'ORBIT',visual:'facets'},
 {sec:289,name:'AXIS',visual:'tunnel'},
 {sec:353,name:'AFTERIMAGE',visual:'dust'},
 {sec:402,name:'END',visual:'none'}
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
 await audioContext.resume();
 await music.play();
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
function material(opacity=.0){return new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity,depthWrite:false})}
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
class Atmosphere extends xb.Script {
 init(){
  // Seven single-protagonist visual families. Intensity is sampled from MUSIC.
  this.sign=new THREE.Line(new THREE.BufferGeometry(),material(0));
  this.signArray=new Float32Array(144*3);
  this.sign.geometry.setAttribute('position',new THREE.BufferAttribute(this.signArray,3).setUsage(THREE.DynamicDrawUsage));
  this.add(this.sign);
  this.frames=new THREE.Group();this.add(this.frames);
  for(let i=0;i<3;i++){
   const w=.4+i*.33,h=.37+i*.28;
   const path=[[-w,-h,0],[w,-h,0],[w,h,0],[-w,h,0],[-w,-h,0]].map(q=>new THREE.Vector3(...q));
   const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(path),material(0));
   line.position.set(0,1.6,-(1.65+i*.55));this.frames.add(line);
  }
  this.volume=new THREE.Mesh(new THREE.IcosahedronGeometry(1.25,4),
   new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,wireframe:true,depthWrite:false}));
  this.volume.position.set(0,1.6,-2.4);this.add(this.volume);
  const faceGeo=new THREE.IcosahedronGeometry(1.25,2).toNonIndexed();
  this.faceGeo=faceGeo;
  const fc=new Float32Array(faceGeo.attributes.position.count*3);
  faceGeo.setAttribute('color',new THREE.BufferAttribute(fc,3).setUsage(THREE.DynamicDrawUsage));
  this.faces=new THREE.Mesh(faceGeo,
   new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide,transparent:true,opacity:0,depthWrite:false}));
  this.faces.position.copy(this.volume.position);this.add(this.faces);
  this.rings=[];
  for(let i=0;i<13;i++){
   const ring=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(
      Array.from({length:84},(_,j)=>{
       const a=j*2*Math.PI/84;return new THREE.Vector3(Math.cos(a),Math.sin(a),0);
      })),material(0));
   this.add(ring);this.rings.push(ring);
  }
  this.particleCount=320;
  this.particlesArr=new Float32Array(this.particleCount*3);
  const partGeo=new THREE.BufferGeometry();
  partGeo.setAttribute('position',new THREE.BufferAttribute(this.particlesArr,3).setUsage(THREE.DynamicDrawUsage));
  this.particles=new THREE.Points(partGeo,
    new THREE.PointsMaterial({color:0xffffff,size:.012,transparent:true,opacity:0,depthWrite:false}));
  this.add(this.particles);
  introPlane=new THREE.Mesh(new THREE.PlaneGeometry(1.6,.8),
      new THREE.MeshBasicMaterial({map:introTexture,transparent:true,depthWrite:false,depthTest:false}));
  introPlane.renderOrder=110;this.add(introPlane);
  this.last=0;
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
  if(!started)return;
  soundFrame(dt);
  const duration=Number.isFinite(music.duration)&&music.duration>10?music.duration:402;
  const t=music.currentTime*402/duration,cue=findCue(t);
  const cut=CUES[cue],end=CUES[cue+1].sec,phase=(t-cut.sec)/(end-cut.sec);
  if(showScene!==cue){
   showScene=cue;$('status').textContent=cut.name+' · '+Math.round(t)+' s · master audio clock';
  }
  // Short designed blackout at boundaries; never blend 3+ visual families.
  const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};
  const light=smooth(phase/.14)*(1-smooth((phase-.84)/.16));
  const accent=Math.min(1,transient*.7+bass*1.1);
  this.sign.visible=cue<=1;
  if(this.sign.visible){
   const p=this.signArray;
   for(let i=0;i<144;i++){
    const a=i/143,u=(a-.5)*2,profile=Math.sin(Math.PI*a);
    p[i*3]=u*2.1;p[i*3+1]=1.6+
       Math.sin(a*11+mid*2.5)*profile*(cue===0?.012:.035)+transient*profile*.07;
    p[i*3+2]=-2.6;
   }
   this.sign.geometry.attributes.position.needsUpdate=true;
   this.sign.material.opacity=light*(cue===0?.2:.48)*(0.52+.48*accent);
  }
  this.frames.visible=cue===2;
  if(this.frames.visible)this.frames.children.forEach((frame,i)=>{
    frame.material.opacity=light*(i===1?.65:.2)*(.35+.65*accent);
    frame.scale.setScalar(1+Math.min(.2,bass*.27));
  });
  this.volume.visible=cue===3||cue===4;
  if(this.volume.visible){
   this.volume.material.opacity=light*(cue===3?.38:.1)*(.33+.55*bass);
   // Rotation is locked to authored section time; not uncorrelated continuous noise.
   this.volume.rotation.set(Math.sin(phase*Math.PI)*.3,phase*Math.PI*(cue===3?.32:1.3),0);
   this.volume.scale.setScalar(.94+Math.min(.32,bass*.45));
  }
  this.faces.visible=cue===4;
  if(this.faces.visible){
   this.faces.rotation.copy(this.volume.rotation);this.faces.scale.copy(this.volume.scale);
   const pos=this.faceGeo.attributes.position.array,col=this.faceGeo.attributes.color.array;
   const np=this.faceGeo.attributes.position.count/3;
   for(let i=0;i<np;i++){
    const k=i*9,theta=Math.atan2(pos[k+2],pos[k]);
    // One focused moving light sweep that follows master time and the real transient.
    const delta=Math.atan2(Math.sin(theta-phase*Math.PI*2),Math.cos(theta-phase*Math.PI*2));
    const brightness=light*Math.exp(-delta*delta*5)*(.18+.72*accent);
    for(let j=0;j<9;j++)col[k+j]=brightness;
   }
   this.faceGeo.attributes.color.needsUpdate=true;
   this.faces.material.opacity=.38;
  }
  const tunnelOn=cue===5;
  this.rings.forEach((ring,i)=>{
   ring.visible=tunnelOn;
   if(!tunnelOn)return;
   const z=i/this.rings.length;
   ring.position.set(0,1.6,-(1.2+z*11));
   const rad=.4+z*2.1;ring.scale.setScalar(rad*(1+.15*bass));
   ring.material.opacity=light*(.08+transient*.3+mid*.2)*Math.sin(z*Math.PI);
  });
  this.particles.visible=cue===6;
  if(this.particles.visible){
   const p=this.particlesArr;
   for(let i=0;i<this.particleCount;i++){
    const f=i/this.particleCount,angle=i*2.39996,r=1+f*2.8;
    p[i*3]=Math.cos(angle)*r;p[i*3+1]=1.6+Math.sin(angle*.6)*r*.6;
    p[i*3+2]=-2.5+Math.sin(angle)*r;
   }
   this.particles.geometry.attributes.position.needsUpdate=true;
   this.particles.material.opacity=light*(.12+.35*accent)*(1-phase);
  }
 }
 onSelectEnd(){
  if(started)return;
  if(!introStarted)beginIntro();else if(!introFinished)finishIntro();
  else startMusic().catch(err=>$('status').textContent=err.message);
 }
}
// XR Blocks creates the ONE renderer, camera and WebXR lifecycle.
const options=new xb.Options().enableXRTransitions();
options.enableHands();
options.hands.visualization=false;
options.simulator.defaultMode=xb.SimulatorMode.CONTROLLER;
options.xrButton.showEnterSimulatorButton=true;
xb.add(new Atmosphere());
xb.init(options).then(()=>{
 function setMode(selected){
  mode=selected;paintIntro();
  if(xb.core.transition){
   if(mode==='VR')xb.core.transition.toVR({color:0x000000});
   else xb.core.transition.toAR();
  }
  const btn=xb.core.xrButton?.xrButtonElement;
  if(btn&&!xb.core.renderer.xr.isPresenting&&!btn.disabled)btn.click();
 }
 $('vr').onclick=()=>setMode('VR');
 $('mr').onclick=()=>setMode('MR');
 setMode(mode);
}).catch(e=>$('status').textContent='XR Blocks error: '+e.message);
