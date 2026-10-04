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
 {end:143,type:'PORTAL',variant:1,title:'TRANSMISSION'},
 {end:172,type:'HERO',variant:1,title:'FIELDS'},
 {end:199,type:'CLOUD',variant:2,title:'DIFFUSION'},
 {end:226,type:'HERO',variant:2,title:'ENTANGLEMENT'},
 {end:258,type:'PORTAL',variant:2,title:'ORBIT'},
 {end:287,type:'CLOUD',variant:3,title:'PRESENCE'},
 {end:314,type:'HERO',variant:3,title:'MORPHOGENESIS'},
 {end:348,type:'PORTAL',variant:3,title:'SYMMETRY'},
 {end:374,type:'HERO',variant:4,title:'AFTERIMAGE'},
 {end:402,type:'CLOUD',variant:4,title:'DISSOLUTION'}
];
export function createForeground(root){
 const portals=new THREE.Group();root.add(portals);
 const rings=[];
 // Reduced from 33 torus meshes to 15, fewer triangles per ring.
 for(let k=0;k<3;k++){
  const sector=new THREE.Group();sector.rotation.y=-k*TAU/3;portals.add(sector);
  for(let i=0;i<5;i++){
   const mesh=new THREE.Mesh(new THREE.TorusGeometry(.52+i*.11,.011,3,48),
    new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false}));
   mesh.position.set(0,1.6,-2.5-i*.51);sector.add(mesh);rings.push({mesh,sector,k,i});
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
 const cloudMat=new THREE.PointsMaterial({vertexColors:true,color:0xffffff,size:.032,transparent:true,opacity:0,depthWrite:false});
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
 const veil=new THREE.Points(vg,new THREE.PointsMaterial({color:0xffffff,size:.024,transparent:true,opacity:0,depthWrite:false}));
 body.add(veil);
 const light=new THREE.DirectionalLight(0xffffff,1.65);light.position.set(-3,5,4);root.add(light);
 const ambient=new THREE.AmbientLight(0xffffff,.35);root.add(ambient);
 // Editorial floating typography, based on reference hierarchy but adapted to artwork.
 const canvas=document.createElement('canvas');canvas.width=768;canvas.height=256;
 const ctx=canvas.getContext('2d'),tex=new THREE.CanvasTexture(canvas);
 const label=new THREE.Mesh(new THREE.PlaneGeometry(1.95,.65),
  new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,depthTest:false}));
 label.position.set(-1.32,.46,-2.55);label.renderOrder=5;root.add(label);
 let previous=-1,active='RESONANCE';
 function drawTitle(title,actIndex){
  ctx.clearRect(0,0,768,256);ctx.textAlign='left';
  ctx.fillStyle='#eee';ctx.font='19px Arial';ctx.fillText('ATMOSPHERE / TECHNO POESIS',20,29);
  ctx.font='bold 67px Arial';ctx.fillStyle='#ffffff';
  ctx.fillText(title,20,121,740);
  ctx.font='18px Arial';ctx.fillStyle='#aaaaaa';
  ctx.fillText(String(actIndex+1).padStart(2,'0')+' / 14',22,173);
  tex.needsUpdate=true;
 }
 function update(t,audio,controls={}){
  const dt=Number.isFinite(t)?Math.max(0,Math.min(401.999,t)):0;
  let index=scenes.findIndex(v=>dt<v.end);
  if(index<0)index=scenes.length-1;
  const current=scenes[index],start=index?scenes[index-1].end:0;
  const progress=(dt-start)/(current.end-start);
  const visible=smooth(progress/.095)*(1-smooth((progress-.91)/.09));
  const bass=audio.bass||0,mid=audio.mid||0,high=audio.high||0,attack=audio.attack||0;
  const intensity=controls.intensity??1,variation=controls.variation??.55;
  const scale=controls.scale??1,motion=controls.motion??1,speed=controls.speed??1;
  active=current.title;
  if(index!==previous){previous=index;drawTitle(current.title,index)}
  const hero=current.type==='HERO',portal=current.type==='PORTAL',dense=current.type==='CLOUD';
  label.material.opacity=Math.min(.62,visible*.38);
  label.position.x=(current.variant%2?-.9:-1.32);
  label.position.z=-2.4-.1*current.variant;
  rings.forEach(({mesh,sector,k,i})=>{
   mesh.visible=portal;
   if(!portal)return;
   sector.rotation.y=-k*TAU/3+current.variant*.22+
    .10*Math.sin(t*.11*speed+current.variant);
   mesh.position.z=-2.3-i*(.47+.045*current.variant);
   mesh.scale.setScalar(scale*(1+.09*bass+.13*attack+.04*Math.sin(t*.65+i*.9)));
   mesh.material.opacity=visible*intensity*(.23+.45*attack+.26*bass)*(k===0?1:.7);
  });
  center.visible=dense;
  if(dense){
   cloudMat.opacity=visible*intensity*(.35+.33*attack+.28*bass);
   center.rotation.set(.18*Math.sin(t*.17),t*(.12+.1*speed)*(current.variant%2?1:-1),0);
   center.position.set(Math.sin(current.variant*1.37)*.48,1.6+(current.variant%2)*.25,
     -2.85-current.variant*.32+.2*bass);
   const expansion=scale*(.9+.28*bass+.19*attack+.12*Math.sin(t*.34));
   cloud.scale.set(expansion,expansion*(current.variant%2?1.4:.9),expansion);
   // Finite analytic warp, using transform rather than per-point CPU loops.
  }
  body.visible=hero;
  if(hero){
   body.position.set(Math.sin(current.variant*.83)*.44,1.6,-3.05-current.variant*.2+.3*attack);
   body.rotation.set(t*.08*speed,t*.11*speed+current.variant*.47,.09*Math.sin(t*.2));
   const expansion=scale*(.86+.13*bass+.09*attack);
   body.scale.set(expansion,expansion*(current.variant%2?1.22:.94),expansion);
   poly.material.opacity=visible*intensity*(.25+.16*high+.13*bass);
   veil.material.opacity=visible*(.28+.45*attack+.1*high);
   veil.rotation.y=-t*.09*speed;
   blobs.forEach((blob,j)=>{
    blob.material.opacity=visible*.52*(j===0?1:.85);
    blob.position.y=(j===0?-.71:-1.25)+.11*Math.sin(t*(.25+.14*motion)+j);
    blob.scale.x=1.05+.28*variation+.16*bass;
   });
  }
 }
 return {update,get active(){return active},scenes};
}
// Preserve existing import name for both XR runtimes.
export const createStage=createForeground;
