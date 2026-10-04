import * as THREE from 'three';
// ATMOSPHERE V6 - GPU-conscious score. One dominant family at a time.
// 402s composed itinerary, never a 48/90-second looping scene.
const TAU=Math.PI*2;
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};
const scenes=[
 {end:26,type:'PORTAL',variant:0,title:'RESONANCE'},
 {end:57,type:'CLOUD',variant:0,title:'FORMATION'},
 {end:89,type:'HERO',variant:0,title:'ANATOMY OF LIGHT'},
 {end:114,type:'CLOUD',variant:1,title:'DISPERSION'},
 {end:143,type:'HERO',variant:1,title:'TRANSMISSION'},
 {end:172,type:'HERO',variant:1,title:'FIELDS'},
 {end:199,type:'CLOUD',variant:2,title:'DIFFUSION'},
 {end:226,type:'HERO',variant:2,title:'ENTANGLEMENT'},
 {end:258,type:'CLOUD',variant:2,title:'ORBIT'},
 {end:287,type:'CLOUD',variant:3,title:'PRESENCE'},
 {end:314,type:'HERO',variant:3,title:'MORPHOGENESIS'},
 {end:348,type:'HERO',variant:3,title:'SYMMETRY'},
 {end:374,type:'HERO',variant:4,title:'AFTERIMAGE'},
 {end:402,type:'CLOUD',variant:4,title:'DISSOLUTION'}
];
export function createForeground(root){
 const portals=new THREE.Group();root.add(portals);
 const rings=[];
 // Reduced from 33 torus meshes to 15, fewer triangles per ring.
 for(let k=0;k<1;k++){
  const sector=new THREE.Group();sector.rotation.y=-k*TAU/3;portals.add(sector);
  for(let i=0;i<11;i++){
   const mesh=new THREE.Mesh(new THREE.TorusGeometry(.68-i*.024,.009,4,56),
    new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false}));
   mesh.position.set(0,1.6,-1.9-i*.42);sector.add(mesh);rings.push({mesh,sector,k,i});
  }
 }
 const center=new THREE.Group();center.position.set(0,1.6,-3.3);root.add(center);
 // Dense point sculpture, bounded count, static buffers, inexpensive analytic turbulence.
 const n=3600,pos=new Float32Array(n*3),color=new Float32Array(n*3);
 for(let i=0;i<n;i++){
  const a=i*2.39996323,z=1-2*(i+.5)/n,r=Math.sqrt(1-z*z)*(1+.21*Math.sin(i*4.17));
  pos[i*3]=Math.cos(a)*r;pos[i*3+1]=Math.sin(a)*r;pos[i*3+2]=z*r*.9;
  const lum=.55+.45*Math.abs(Math.sin(i*2.9));color[i*3]=color[i*3+1]=color[i*3+2]=lum;
 }
 const cloudGeo=new THREE.BufferGeometry();
 cloudGeo.setAttribute('position',new THREE.BufferAttribute(pos,3));
 cloudGeo.setAttribute('color',new THREE.BufferAttribute(color,3));
 const dot=document.createElement('canvas');dot.width=32;dot.height=32;
 const g=dot.getContext('2d'),grad=g.createRadialGradient(16,16,0,16,16,14);
 grad.addColorStop(0,'rgba(255,255,255,1)');grad.addColorStop(.25,'rgba(255,255,255,.8)');grad.addColorStop(1,'rgba(255,255,255,0)');
 g.fillStyle=grad;g.fillRect(0,0,32,32);
 const dotTex=new THREE.CanvasTexture(dot);
 const cloudMat=new THREE.PointsMaterial({vertexColors:true,color:0xffffff,size:.017,map:dotTex,alphaTest:.17,transparent:true,opacity:0,depthWrite:false});
 const cloud=new THREE.Points(cloudGeo,cloudMat);cloud.frustumCulled=false;center.add(cloud);
 // Sculptural polygonal body from reference: faceted translucent solid, soft blobs,
 // and a single particulate veil, not a wireframe/fractal tree.
 const body=new THREE.Group();body.position.set(0,1.6,-3.15);root.add(body);
 const polyGeo=new THREE.IcosahedronGeometry(1.02,1);
 const a=polyGeo.attributes.position;
 for(let i=0;i<a.count;i++){
  const x=a.getX(i),y=a.getY(i),z=a.getZ(i);
  const distortion=1+.12*Math.sin(x*6+y*3+z*4);
  a.setXYZ(i,x*1.12*distortion,y*.98*distortion,z*.84*distortion);
 }
 a.needsUpdate=true;polyGeo.computeVertexNormals();
 const poly=new THREE.Mesh(polyGeo,new THREE.MeshPhongMaterial({
  color:0xf1f1f1,specular:0xffffff,shininess:27,flatShading:true,
  transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide
 }));
 body.add(poly);
 const pale=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false});
 const blobs=[];
 for(let i=0;i<2;i++){
  const m=new THREE.Mesh(new THREE.SphereGeometry(.36,12,9),pale.clone());
  m.scale.set(1.15+i*.15,.76,1.23+i*.18);
  m.position.set(i===0?.77:1.38,i===0?-.71:-1.25,i===0?.22:.36);
  body.add(m);blobs.push(m);
 }
 const vn=1450,vp=new Float32Array(vn*3);
 for(let i=0;i<vn;i++){
  const v=(i+.5)/vn,z=1-2*v,theta=i*2.39996323;
  const r=Math.sqrt(1-z*z)*(1.27+.45*Math.sin(i*.319));
  vp[i*3]=Math.cos(theta)*r;
  vp[i*3+1]=Math.sin(theta)*r;
  vp[i*3+2]=z*r;
 }
 const vg=new THREE.BufferGeometry();
 vg.setAttribute('position',new THREE.BufferAttribute(vp,3));
 const veil=new THREE.Points(vg,new THREE.PointsMaterial({color:0xffffff,size:.015,map:dotTex,alphaTest:.17,transparent:true,opacity:0,depthWrite:false}));
 body.add(veil);
 const light=new THREE.DirectionalLight(0xffffff,1.65);light.position.set(-3,5,4);root.add(light);
 const ambient=new THREE.AmbientLight(0xffffff,.35);root.add(ambient);
 // Editorial floating typography, based on reference hierarchy but adapted to artwork.
 const canvas=document.createElement('canvas');canvas.width=768;canvas.height=256;
 const ctx=canvas.getContext('2d'),tex=new THREE.CanvasTexture(canvas);
 const label=new THREE.Mesh(new THREE.PlaneGeometry(1.95,.65),
  new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,depthTest:false}));
 label.position.set(-.66,1.66,-2.5);label.renderOrder=55;root.add(label);
 let previous=-1,active='RESONANCE';
 function drawTitle(title,actIndex){
  ctx.clearRect(0,0,768,256);ctx.textAlign='left';
  ctx.fillStyle='#ffffff';ctx.font='bold 30px Arial';ctx.fillText('ATMOSPHERE / TECHNO POESIS',20,29);
  ctx.font='bold 67px Arial';ctx.fillStyle='#ffffff';
  ctx.fillText(title,20,121,740);
  ctx.font='bold 29px Arial';ctx.fillStyle='#eeeeee';
  ctx.fillText(String(actIndex+1).padStart(2,'0')+' / 14',22,173);
  tex.needsUpdate=true;
 }
 // Artist-authored deterministic animation. No analyser, FFT or instantaneous
 // sound amplitude ever drives the transform. Playback time is the ONLY clock.
 // Section boundaries are provisional artistic cues pending final track annotation.
 const fades=3.8;
 const impulseTimes=[
  4.5,11,18,24,31,40,48,54,64,72,82,94,102,110,
  119,128,137,146,156,166,177,186,194,206,216,222,
  234,243,253,262,274,284,296,306,314,326,336,
  346,359,368,379,389,399
 ];
 const gentleAccent=t=>{
  // Slow smooth raised-cosine envelopes, not raw transients.
  let v=0;
  for(const beat of impulseTimes){
   const delta=Math.abs(t-beat);
   if(delta<1.8)v=Math.max(v,(1+Math.cos(delta*Math.PI/1.8))*.5);
  }
  return v;
 };
 function update(t,_unused,controls={}){
  const time=Math.max(0,Math.min(401.999,Number.isFinite(t)?t:0));
  let index=scenes.findIndex(v=>time<v.end);
  if(index<0)index=scenes.length-1;
  const current=scenes[index],start=index?scenes[index-1].end:0;
  const intensity=controls.intensity??1,scale=controls.scale??1;
  const variation=controls.variation??.55,motion=controls.motion??.8,speed=controls.speed??.6;
  const vScale=.65+.45*variation;
  const clock=time*(.4+.45*speed);
  const phase=time-start,dur=current.end-start;
  const accent=gentleAccent(time);
  const drift=Math.sin(clock*.33+current.variant*.9);
  const slowPulse=.5+.5*Math.cos(clock*.9+current.variant*.21);
  const fadeIn=smooth(phase/fades),fadeOut=1-smooth((phase-(dur-fades))/fades);
  const currentWeight=fadeIn*fadeOut;
  const prev=scenes[index-1],next=scenes[index+1];
  // Adjacent scenes overlap for 3.8 seconds: no hard scene switch.
  const inWeight=prev?(1-fadeIn):0,outWeight=next?(1-fadeOut):0;
  const contributions=[{scene:current,w:currentWeight}];
  if(prev)contributions.push({scene:prev,w:inWeight});
  if(next)contributions.push({scene:next,w:outWeight});
  const typeWeight=type=>contributions.filter(v=>v.scene.type===type).reduce((a,v)=>a+v.w,0);
  const winner=contributions.reduce((a,b)=>b.w>a.w?b:a);
  const weightSum=Math.max(.0001,contributions.reduce((sum,c)=>sum+c.w,0));
  const currentVariant=contributions.reduce((sum,c)=>sum+c.scene.variant*c.w,0)/weightSum;
  const portalsWeight=typeWeight('PORTAL'),cloudWeight=typeWeight('CLOUD'),heroWeight=typeWeight('HERO');
  active=winner.scene.title;
  if(index!==previous){previous=index;drawTitle(current.title,index)}
  label.material.opacity=.80*currentWeight;
  label.position.x=-.68+.04*Math.sin(clock*.13);
  label.position.z=-2.55;
  rings.forEach(({mesh,sector,k,i})=>{
   mesh.visible=portalsWeight>.001;
   if(!mesh.visible)return;
   sector.rotation.y=-k*TAU/3+currentVariant*.17+
     Math.sin(clock*.13+k*.09)*.08;
   mesh.position.z=-1.95-i*.40-.085*Math.sin(clock*.14);
   mesh.scale.setScalar(scale*(.98+.085*slowPulse+.07*accent*vScale));
   mesh.material.opacity=portalsWeight*intensity*(.42+.19*slowPulse+.16*accent);
   mesh.rotation.z=.055*Math.sin(clock*.18+i*.3);
  });
  center.visible=cloudWeight>.001;
  if(center.visible){
   cloudMat.opacity=cloudWeight*intensity*(.32+.18*slowPulse+.13*accent);
   center.rotation.set(.13*Math.sin(clock*.19),time*.095,.065*Math.sin(clock*.27));
   center.position.set(.32*Math.sin(clock*.2+currentVariant),1.6+.17*Math.cos(clock*.2),-3.15);
   const expansion=scale*(.9+.14*Math.sin(clock*.42)+.08*accent*vScale);
   cloud.scale.set(expansion,expansion*(1.07+.14*Math.sin(currentVariant*1.13)),expansion);
  }
  body.visible=heroWeight>.001;
  if(body.visible){
   body.position.set(.29*Math.sin(clock*.18+currentVariant),1.6+.08*Math.sin(clock*.28),-3.15);
   body.rotation.set(time*.055*speed,time*.086*speed+currentVariant*.3,.085*Math.sin(clock*.15));
   const expansion=scale*(.94+.07*Math.sin(clock*.35)+.055*accent);
   body.scale.set(expansion,expansion*(1.05+.1*Math.sin(currentVariant*1.2)),expansion);
   poly.material.opacity=heroWeight*intensity*(.36+.10*slowPulse);
   veil.material.opacity=heroWeight*(.30+.16*slowPulse+.06*accent);
   veil.rotation.y=-time*.064*speed;
   blobs.forEach((blob,j)=>{
    blob.material.opacity=heroWeight*.43*(j===0?1:.84);
    blob.position.y=(j===0?-.71:-1.25)+.12*Math.sin(clock*(.25+.13*motion)+j);
    blob.scale.x=1.03+.22*variation+.045*Math.cos(clock*.41+j);
   });
  }
 }
 return {update,get active(){return active},scenes};
}
// Preserve existing import name for both XR runtimes.
export const createStage=createForeground;
