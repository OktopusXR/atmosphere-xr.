import * as THREE from 'three';
// ATMOSPHERE XR V10 — 14 distinct spatial compositions, with one tunnel ever.
// No duplicate hero sculpture and no live FFT. All animation follows track time.
const PI=Math.PI, TAU=2*PI;
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
const chapters=[
 {end:26,title:'RESONANCE',kind:'tunnel'},
 {end:57,title:'FORMATION',kind:'condensation'},
 {end:89,title:'ANATOMY OF LIGHT',kind:'facets'},
 {end:114,title:'DISPERSION',kind:'vortex'},
 {end:143,title:'TRANSMISSION',kind:'woven'},
 {end:172,title:'FIELDS',kind:'fold'},
 {end:199,title:'DIFFUSION',kind:'strata'},
 {end:226,title:'ENTANGLEMENT',kind:'cell'},
 {end:258,title:'ORBIT',kind:'orbitdust'},
 {end:287,title:'PRESENCE',kind:'wave'},
 {end:314,title:'MORPHOGENESIS',kind:'crystal'},
 {end:348,title:'SYMMETRY',kind:'axis'},
 {end:374,title:'AFTERIMAGE',kind:'shards'},
 {end:402,title:'DISSOLUTION',kind:'residue'}
];
function fract(x){return x-Math.floor(x)}
function rnd(i,seed){return fract(Math.sin(i*127.1+seed*311.7)*43758.5453123)}
function dotTexture(){
 const c=document.createElement('canvas');c.width=c.height=64;
 const g=c.getContext('2d'),grad=g.createRadialGradient(32,32,0,32,32,31);
 grad.addColorStop(0,'#ffffff');grad.addColorStop(.25,'rgba(255,255,255,.95)');
 grad.addColorStop(.7,'rgba(255,255,255,.55)');grad.addColorStop(1,'rgba(255,255,255,0)');
 g.fillStyle=grad;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);
}
const texture=dotTexture();
function pMaterial(size=.024){return new THREE.PointsMaterial({
 color:0xffffff,size,map:texture,transparent:true,opacity:0,depthWrite:false,
 alphaTest:.08,sizeAttenuation:true
})}
function lineMaterial(){return new THREE.LineBasicMaterial({
 color:0xffffff,transparent:true,opacity:0,depthWrite:false
})}
function makePoints(group,count,fun,size=.026){
 const xyz=new Float32Array(count*3);
 for(let i=0;i<count;i++){const p=fun(i,count);xyz[i*3]=p[0];xyz[i*3+1]=p[1];xyz[i*3+2]=p[2]}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(xyz,3));
 const obj=new THREE.Points(geo,pMaterial(size));obj.frustumCulled=false;group.add(obj);return obj;
}
function line(group,vertices){
 const obj=new THREE.Line(new THREE.BufferGeometry().setFromPoints(vertices),lineMaterial());
 obj.frustumCulled=false;group.add(obj);return obj;
}
function makeChapter(root,kind,index){
 const g=new THREE.Group();g.position.set(0,1.6,-3.35);
 root.add(g);const objects=[],fx={};
 function add(object){objects.push(object);return object}
 if(kind==='tunnel'){
  g.position.z=0;
  for(let j=0;j<11;j++){
   const ring=new THREE.Mesh(new THREE.TorusGeometry(.68-j*.016,.008,4,72),
    new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false}));
   ring.position.z=-2.05-j*.37;g.add(ring);add(ring);
  }
 }else if(kind==='condensation'){
  add(makePoints(g,2400,(i,n)=>{
   const a=i*2.399963,z=1-2*(i+.5)/n,r=Math.sqrt(1-z*z)*(.82+.33*rnd(i,1));
   return [Math.cos(a)*r,Math.sin(a)*r,z*r*.9]
  },.033));
 }else if(kind==='facets'){
  const geo=new THREE.IcosahedronGeometry(1.1,1);
  const mesh=new THREE.Mesh(geo,new THREE.MeshPhongMaterial({
   color:0xe9e9e9,flatShading:true,transparent:true,opacity:0,depthWrite:false,
   side:THREE.DoubleSide
  }));g.add(mesh);add(mesh);
  add(makePoints(g,700,(i,n)=>{
   const a=i*2.399963,z=1-2*(i+.5)/n,r=Math.sqrt(1-z*z)*1.43;
   return [Math.cos(a)*r,Math.sin(a)*r,z*1.3]
  },.02));
 }else if(kind==='vortex'){
  add(makePoints(g,2900,(i,n)=>{
   const v=i/n,a=v*TAU*12,rad=.13+1.7*Math.sqrt(v);
   return [Math.cos(a)*rad,(v-.5)*2.7,Math.sin(a)*rad]
  },.027));
 }else if(kind==='woven'){
  for(let j=0;j<24;j++){
   const pts=[];for(let i=0;i<65;i++){
    const u=i/64,a=(u-.5)*2.5;
    pts.push(new THREE.Vector3(Math.sin(a)*1.7,((j/23)-.5)*2.45+
      .13*Math.sin(a*4+j*.3),Math.cos(a)*.6));
   }add(line(g,pts));
  }
 }else if(kind==='fold'){
  const geo=new THREE.TorusKnotGeometry(.76,.3,120,7,2,5);
  const mesh=new THREE.Mesh(geo,new THREE.MeshPhongMaterial({
   color:0xf4f4f4,transparent:true,opacity:0,depthWrite:false,flatShading:true,
   side:THREE.DoubleSide
  }));g.add(mesh);add(mesh);
 }else if(kind==='strata'){
  add(makePoints(g,2500,(i,n)=>{
   const layer=i%7,a=i*2.399963,r=.4+(layer/6)*1.55;
   return [r*Math.cos(a),Math.sin(a*.3)*.11+(layer-3)*.27,r*Math.sin(a)]
  },.027));
 }else if(kind==='cell'){
  // Non-repeating cellular connections, independent 3D cellular structure.
  const points=[];
  for(let i=0;i<115;i++){
   const a=i*2.399963,z=1-2*(i+.5)/115,r=Math.sqrt(1-z*z);
   points.push(new THREE.Vector3(Math.cos(a)*r*1.3,Math.sin(a)*r*1.25,z*1.35))
  }
  for(let i=0;i<points.length;i+=3){
   add(line(g,[points[i],points[(i+13)%points.length],
     points[(i+39)%points.length]]));
  }
 }else if(kind==='orbitdust'){
  add(makePoints(g,2400,(i,n)=>{
   const v=i/n,a=i*2.399963,rad=1.2+.38*Math.sin(i*.19);
   return [rad*Math.cos(a),.9*Math.sin(a*.31)+.25*Math.cos(v*TAU*9),
     .55*Math.sin(a)-1.2*(v-.5)]
  },.03));
 }else if(kind==='wave'){
  add(makePoints(g,2600,(i,n)=>{
   const x=(i%65)/64*3.65-1.825,z=Math.floor(i/65)/39*2.3-1.15;
   return [x,.66*Math.sin(x*2.9+z*3.4),z]
  },.031));
 }else if(kind==='crystal'){
  for(let i=0;i<21;i++){
   const a=i*2.399963,rad=.52+1.03*rnd(i,4);
   const b=new THREE.Vector3(Math.cos(a)*rad,-1.1,Math.sin(a)*rad);
   add(line(g,[b,new THREE.Vector3(Math.cos(a)*rad*.72,
    .5+1.1*rnd(i,7),Math.sin(a)*rad*.72)]));
  }
  const geo=new THREE.DodecahedronGeometry(.8,0);
  const mesh=new THREE.Mesh(geo,new THREE.MeshPhongMaterial({
   color:0xffffff,flatShading:true,transparent:true,opacity:0,depthWrite:false,
   side:THREE.DoubleSide
  }));g.add(mesh);add(mesh);
 }else if(kind==='axis'){
  for(let i=0;i<14;i++){
   const a=i*TAU/14,rad=.45+(i%3)*.38;
   add(line(g,[new THREE.Vector3(rad*Math.cos(a),-1.55,rad*Math.sin(a)),
    new THREE.Vector3(rad*.5*Math.cos(a),1.55,rad*.5*Math.sin(a))]));
  }
 }else if(kind==='shards'){
  for(let i=0;i<33;i++){
   const a=i*2.399963,z=1-2*(i+.5)/33,rad=Math.sqrt(1-z*z);
   const m=new THREE.Mesh(new THREE.TetrahedronGeometry(.12+.26*rnd(i,8),0),
    new THREE.MeshPhongMaterial({color:0xffffff,transparent:true,opacity:0,
     flatShading:true,depthWrite:false}));
   m.position.set(rad*Math.cos(a)*1.2,rad*Math.sin(a)*1.15,z*1.2);
   g.add(m);add(m);
  }
 }else if(kind==='residue'){
  add(makePoints(g,1500,(i,n)=>{
   const v=i/n,a=i*2.399963,r=.5+2.1*v;
   return [Math.cos(a)*r,(v-.5)*2.3,Math.sin(a)*r]
  },.026));
 }
 for(const item of objects)item.visible=false;
 return {group:g,objects,kind,index};
}
export function createForeground(root){
 const chapters3d=chapters.map((c,i)=>makeChapter(root,c.kind,i));
 const light=new THREE.DirectionalLight(0xffffff,1.9);light.position.set(-3,4,4);root.add(light);
 root.add(new THREE.AmbientLight(0xffffff,.47));
 // High-resolution, fully legible editorial caption. No micro typography in headset.
 const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=384;
 const ctx=canvas.getContext('2d'),tex=new THREE.CanvasTexture(canvas);
 const titlePlane=new THREE.Mesh(new THREE.PlaneGeometry(2.6,.65),
   new THREE.MeshBasicMaterial({map:tex,transparent:true,opacity:0,depthTest:false,depthWrite:false}));
 titlePlane.position.set(-.35,2.05,-2.55);titlePlane.renderOrder=60;root.add(titlePlane);
 let previous=-1,active='';
 function drawCaption(title,index){
  ctx.clearRect(0,0,1536,384);
  ctx.fillStyle='#ffffff';ctx.textAlign='left';
  ctx.font='bold 47px Arial';ctx.fillText('ATMOSPHERE    /    TECHNO POESIS',25,78);
  ctx.font='bold 108px Arial';ctx.fillText(title,25,215,1480);
  ctx.font='bold 46px Arial';ctx.fillStyle='#ffffff';
  ctx.fillText(String(index+1).padStart(2,'0')+'     /     14',26,302);
  tex.needsUpdate=true;
 }
 function update(t,_score,controls={}){
  const time=Math.max(0,Math.min(401.999,Number.isFinite(t)?t:0));
  let index=chapters.findIndex(c=>time<c.end);if(index<0)index=chapters.length-1;
  const intensity=controls.intensity??1,scale=controls.scale??1;
  const variation=controls.variation??.55,motion=controls.motion??.8,speed=controls.speed??.6;
  const start=index===0?0:chapters[index-1].end,end=chapters[index].end;
  const phrase=time-start,span=end-start;
  const fade=3.5;
  // One unique geometry per chapter; overlap only the preceding and next geometry.
  const own=smooth(phrase/fade)*(1-smooth((phrase-(span-fade))/fade));
  const incoming=1-smooth(phrase/fade),outgoing=smooth((phrase-(span-fade))/fade);
  if(index!==previous){previous=index;drawCaption(chapters[index].title,index)}
  titlePlane.material.opacity=.74*own;active=chapters[index].title;
  for(let i=0;i<chapters3d.length;i++){
   const {group,objects,kind}=chapters3d[i];
   const weight=i===index?own:i===index-1?incoming:i===index+1?outgoing:0;
   const visible=weight>.002;
   group.visible=visible;
   if(!visible)continue;
   const local=time-(i===0?0:chapters[i-1].end);
   const drift=time*(.08+.07*speed);
   // Slow independent authored animation curves — never instantaneous FFT.
   group.position.x=.22*Math.sin(drift*.31+i*.7);
   group.position.y=1.6+.12*Math.sin(drift*.48+i*.6);
   group.position.z=kind==='tunnel'?0:-3.25;
   group.rotation.set(kind==='tunnel'?0:.07*Math.sin(drift*.27+i),
    kind==='tunnel'?.03*Math.sin(drift*.19):drift*.35+i*.18,
    kind==='tunnel'?0:.065*Math.sin(drift*.4+i));
   const breath=1+.055*Math.sin(drift*.9+i*.4)+.025*Math.cos(drift*.51+i);
   const size=scale*breath*(1+.13*variation*(i%3)/3);
   group.scale.setScalar(size);
   for(let j=0;j<objects.length;j++){
    const o=objects[j];o.visible=true;
    const glow=.67+.13*Math.sin(drift*.48+j*.17)+.07*Math.cos(drift*.8+i);
    o.material.opacity=weight*intensity*glow;
    if(kind==='tunnel'){
     const z=-2.15-j*.34;
     // A one-time optical depth migration, authored and eased over 26s.
     o.position.z=z+.2*smooth(Math.max(0,Math.min(1,local/26)));
     o.scale.setScalar(1+.055*Math.sin(drift*.3+j*.55));
    }
   }
  }
 }
 return {update,chapters,get active(){return active}};
}
export const createStage=createForeground;
