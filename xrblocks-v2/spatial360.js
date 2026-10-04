// ATMOSPHERE: spatial score, all geometries anchored around the viewer.
// No total blackout; persistent residual light stays active during every fade.
export function createSpatial360(THREE,scene){
 const root=new THREE.Group();scene.add(root);
 const TAU=Math.PI*2;
 const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};
 const pt=(a,e,r)=>new THREE.Vector3(Math.sin(a)*r*Math.cos(e),1.6+r*Math.sin(e),-Math.cos(a)*r*Math.cos(e));
 const lineMat=()=>new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false});
 const dotMat=(o,s)=>new THREE.PointsMaterial({color:0xffffff,transparent:true,opacity:o,size:s,depthWrite:false,blending:THREE.AdditiveBlending});
 function stars(n,r0,r1){
  const g=new THREE.BufferGeometry(),arr=new Float32Array(n*3);
  for(let i=0;i<n;i++){
   const p=pt(i*2.399963,Math.asin(1-2*(i+.5)/n)*.84,r0+(r1-r0)*(.5+.5*Math.sin(i*12.9898)));
   arr.set([p.x,p.y,p.z],i*3);
  }
  g.setAttribute('position',new THREE.BufferAttribute(arr,3));
  const m=new THREE.Points(g,dotMat(.1,.027));root.add(m);return m;
 }
 // Persistent three-dimensional points and horizon across all transition gaps.
 const residue=stars(620,3.5,9.2),afterglow=stars(160,4.6,8.2);
 const horizon=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(
  Array.from({length:160},(_,i)=>pt(i*TAU/160,-.13,5.3))),lineMat());root.add(horizon);
 function path(n){
  const g=new THREE.BufferGeometry(),a=new Float32Array(n*3);
  g.setAttribute('position',new THREE.BufferAttribute(a,3).setUsage(THREE.DynamicDrawUsage));
  const o=new THREE.Line(g,lineMat());o.frustumCulled=false;root.add(o);return {o,a};
 }
 const halos=Array.from({length:8},(_,i)=>({...path(160),i}));
 const membranes=Array.from({length:8},(_,i)=>({...path(175),i}));
 const cuts=Array.from({length:12},(_,i)=>({...path(44),i}));
 const currents=Array.from({length:18},(_,i)=>({...path(92),i}));
 const groups=[];
 for(let k=0;k<10;k++){
  const arr=new Float32Array(92*3),g=new THREE.BufferGeometry();
  for(let j=0;j<92;j++){
   const q=pt(k*TAU/10+(j/92-.5)*.78,Math.sin(j*1.7+k)*.42,2.5+((j*17)%61)/61*5);
   arr.set([q.x,q.y,q.z],j*3);
  }
  g.setAttribute('position',new THREE.BufferAttribute(arr,3));
  const o=new THREE.Points(g,dotMat(0,.047));root.add(o);groups.push(o);
 }
 const matter=stars(900,1.8,7.7);
 const cues=[0,39,97,158,224,289,353,402];
 const names=['LIVING VOID','HALO FIELD','MEMBRANE','CONSTELLATION','VERTICAL EVENTS','SUSPENDED MATTER','DISSOLUTION'];
 // Temporary editable score accents, to be musically annotated against full audio.
 const events=[7,18,29,37,47,58,74,88,101,113,127,144,162,177,193,210,227,240,255,272,284,297,311,329,343,359,377,393];
 function cueWeight(i,t){return smooth((t-cues[i]+4)/8)*(1-smooth((t-cues[i+1]+4)/8));}
 let lastScene=-1;
 function render(t,audio={}){
  const amp=audio.attack||0;
  let best=0,eventIndex=0;
  events.forEach((e,i)=>{
   const d=t-e,v=Math.exp(-Math.abs(d)*(d<0?3.5:1.2));
   if(v>best){best=v;eventIndex=i}
  });
  const strike=Math.max(best,amp*.35),w=Array.from({length:7},(_,i)=>cueWeight(i,t));
  residue.material.opacity=.18+.025*Math.sin(t*.32)+.05*strike;
  afterglow.material.opacity=.055+.095*w[6];
  horizon.material.opacity=.06+.055*strike;
  const hw=.43*w[0]+w[1];
  halos.forEach(({o,a,i})=>{
   o.visible=hw>.002;if(!o.visible)return;
   for(let j=0;j<160;j++){
    const u=j/159,angle=i*TAU/8-.5+u*TAU*.86+t*.005;
    const p=pt(angle,(i-3.5)*.13+.25*Math.sin(angle*1.3+i*1.8),2.1+i*.52);
    a.set([p.x,p.y,p.z],j*3);
   }
   o.geometry.attributes.position.needsUpdate=true;
   o.material.opacity=hw*(i%3===0?.37:.14);
  });
  membranes.forEach(({o,a,i})=>{
   o.visible=w[2]>.002;if(!o.visible)return;
   for(let j=0;j<175;j++){
    const u=j/174,angle=i*TAU/8+(u-.5)*1.5;
    const p=pt(angle,(i%4-1.5)*.22+.32*Math.sin(u*TAU*1.45+i),
        2.8+(i%3)*.7+.13*Math.sin(u*19+t*.28));
    a.set([p.x,p.y,p.z],j*3);
   }
   o.geometry.attributes.position.needsUpdate=true;
   o.material.opacity=w[2]*(i%3===0?.34:.17)*(.83+.17*strike);
  });
  groups.forEach((o,i)=>{
   o.visible=w[3]>.002;
   if(o.visible){
    const sel=(Math.floor(t/6)+eventIndex)%10,d=Math.min((i-sel+10)%10,(sel-i+10)%10);
    o.material.opacity=w[3]*(d===0?.84:d===1?.24:.07);
   }
  });
  cuts.forEach(({o,a,i})=>{
   o.visible=w[4]>.002;if(!o.visible)return;
   for(let j=0;j<44;j++){
    const u=j/43,p=pt(i*TAU/12+t*.01+(u-.5)*.055,(u-.5)*1.45,2.7+(i%3)*.74);
    a.set([p.x,p.y,p.z],j*3);
   }
   o.geometry.attributes.position.needsUpdate=true;
   o.material.opacity=w[4]*(i%4===eventIndex%4?.76:.12)*(.65+.35*strike);
  });
  currents.forEach(({o,a,i})=>{
   o.visible=w[5]>.002;if(!o.visible)return;
   for(let j=0;j<92;j++){
    const u=j/91,az=i*TAU/18+u*1.6+t*.007;
    const p=pt(az,(i%5-2)*.17+.2*Math.sin(u*TAU*1.6+i),2.15+u*4.4);
    a.set([p.x,p.y,p.z],j*3);
   }
   o.geometry.attributes.position.needsUpdate=true;
   o.material.opacity=w[5]*(i%4===0?.32:.085);
  });
  matter.visible=w[5]>.002;
  if(matter.visible){matter.material.opacity=w[5]*(.09+.065*strike);matter.rotation.y=t*.008;}
  let ix=6;for(let i=0;i<7;i++)if(t>=cues[i]&&t<cues[i+1]){ix=i;break;}
  if(lastScene!==ix)lastScene=ix;
  return {index:ix,name:names[ix]};
 }
 return {root,render,cues,names};
}
