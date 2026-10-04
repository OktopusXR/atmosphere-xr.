import * as THREE from 'three';
// Three-event immersive study. Foreground only; background point cloud remains 360°.
const TAU=Math.PI*2;
const mat=()=>new THREE.MeshBasicMaterial({
 color:0xffffff,transparent:true,opacity:0,depthWrite:false,
 blending:THREE.AdditiveBlending,side:THREE.DoubleSide
});
function smooth(x){x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)}
function envelope(t,start,end){
 return smooth((t-start)/1.5)*(1-smooth((t-(end-2))/2));
}
export function createForeground(root){
 // A / THREE SYMMETRIC PORTALS: 0°, +120°, -120° around the listener.
 const portals=[];
 for(let k=0;k<3;k++){
  const az=k*TAU/3,group=new THREE.Group();
  group.rotation.y=-az;root.add(group);
  const rings=[];
  for(let i=0;i<11;i++){
   const radius=.47+i*.062;
   const mesh=new THREE.Mesh(new THREE.TorusGeometry(radius,.008,4,112),mat());
   mesh.position.set(0,1.6,-2.35-i*.27);
   group.add(mesh);rings.push(mesh);
  }
  portals.push({group,rings,az});
 }
 // B / FRONT HIGH DENSITY POINT CLOUD: evolving GPU 3D coherent noise.
 const n=12000,positions=new Float32Array(n*3),seeds=new Float32Array(n);
 for(let i=0;i<n;i++){
  const a=i*2.39996323,z=1-2*(i+.5)/n,rad=Math.sqrt(1-z*z);
  const radius=1.1+.3*Math.sin(i*3.13);
  positions[3*i]=Math.cos(a)*rad*radius;
  positions[3*i+1]=Math.sin(a)*rad*radius;
  positions[3*i+2]=z*radius*.88;
  seeds[i]=i/n;
 }
 const noiseVert=`
 uniform float uTime,uBass,uMid,uHigh,uAttack,uDilation;
 attribute float aSeed;varying float vLight;
 float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
 float noise3(vec3 p){
  vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
  mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z)*2.-1.;
 }
 void main(){
  vec3 p=position;
  float n=noise3(p*1.55+vec3(uTime*.13,uTime*.17,.4));
  float n2=noise3(p*.92+vec3(0.,-uTime*.11,uTime*.09));
  p+=normalize(p+vec3(.001))*(n*(.42+uMid*1.3)+uBass*.83+uAttack*.32);
  p.xyz+=vec3(n2,n,n2-n)*(.16+uMid*.3);
  p*=uDilation;
  vec4 v=modelViewMatrix*vec4(p,1.);
  gl_Position=projectionMatrix*v;
  gl_PointSize=min(8.,max(1.2,(.75+uHigh*1.4+uAttack*.5)*22./max(1.,-v.z)));
  vLight=.28+.42*abs(n)+uAttack*.3;
 }`;
 const noiseFrag=`
 uniform float uOpacity;varying float vLight;
 void main(){
  float r=length(gl_PointCoord-.5);
  float a=(1.-smoothstep(.18,.49,r))*.84+exp(-r*r*48.)*.16;
  gl_FragColor=vec4(vec3(1.),a*vLight*uOpacity);
 }`;
 const ng=new THREE.BufferGeometry();
 ng.setAttribute('position',new THREE.BufferAttribute(positions,3));
 ng.setAttribute('aSeed',new THREE.BufferAttribute(seeds,1));
 const nu={uTime:{value:0},uBass:{value:0},uMid:{value:0},uHigh:{value:0},
  uAttack:{value:0},uDilation:{value:1},uOpacity:{value:0}};
 const cloud=new THREE.Points(ng,new THREE.ShaderMaterial({
  uniforms:nu,vertexShader:noiseVert,fragmentShader:noiseFrag,
  blending:THREE.AdditiveBlending,transparent:true,depthWrite:false
 }));
 cloud.frustumCulled=false;cloud.position.set(0,1.6,-3.3);root.add(cloud);
 // C / THREE-DIMENSIONAL RECURSIVE VECTOR FRACTAL.
 const vertices=[];
 function branch(a,dir,length,depth,seed){
  const b=a.clone().addScaledVector(dir,length);
  vertices.push(a.x,a.y,a.z,b.x,b.y,b.z);
  if(depth===0)return;
  const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),dir);
  for(let i=0;i<3;i++){
   const az=i*TAU/3+depth*.29+seed*.17;
   const tilt=.39+.17*Math.sin(seed+i*3.8);
   const next=new THREE.Vector3(Math.cos(az)*Math.sin(tilt),Math.cos(tilt),
    Math.sin(az)*Math.sin(tilt)).applyQuaternion(q).normalize();
   branch(b,next,length*.68,depth-1,seed+i*1.51);
  }
 }
 branch(new THREE.Vector3(0,-1.4,0),new THREE.Vector3(0,1,0),.56,5,.7);
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
 const fractal=new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({
  color:0xffffff,transparent:true,opacity:0,depthWrite:false,
  blending:THREE.AdditiveBlending
 }));
 fractal.frustumCulled=false;fractal.position.set(0,1.6,-3.3);root.add(fractal);
 const score=[{start:0,end:16,type:'PORTALS'},
  {start:16,end:32,type:'NOISE SCULPTURE'},
  {start:32,end:48,type:'VECTOR FRACTAL'}];
 let active='PORTALS';
 return {
  get active(){return active},score,
  update(t,audio){
   const local=t%48,phase=local<16?0:local<32?1:2;
   const act=score[phase],w=envelope(local,act.start,act.end);
   const pulse=Math.min(1,audio.attack*.85+audio.bass*1.3);
   active=act.type;
   const ringAlpha=phase===0?w:0;
   portals.forEach((portal,k)=>{
    portal.group.rotation.y=-portal.az+.07*Math.sin(t*.32);
    portal.rings.forEach((ring,j)=>{
     const beat=.5+.5*Math.cos(j*.7-t*(.8+audio.bass*1.6));
     ring.material.opacity=ringAlpha*(.14+.24*beat+.52*pulse)*(k===0?1:.77);
     ring.scale.setScalar(1+.12*audio.bass+audio.attack*.14+
       .055*Math.sin(t*.48-j*.65));
     ring.position.z=-2.12-j*.31+.16*Math.sin(t*.41-j*.45);
     ring.rotation.z=.09*Math.sin(t*.21+j*.3);
     ring.visible=ringAlpha>.003;
    });
   });
   const cloudAlpha=phase===1?w:0;
   nu.uTime.value=t;nu.uBass.value=audio.bass;nu.uMid.value=audio.mid;
   nu.uHigh.value=audio.high;nu.uAttack.value=audio.attack;
   nu.uOpacity.value=cloudAlpha*1.5;
   nu.uDilation.value=1+audio.bass*.7+audio.attack*.18+
     .13*Math.sin(t*.57);
   cloud.rotation.y=t*.22+audio.mid*.7;
   cloud.rotation.x=.23*Math.sin(t*.17);
   cloud.position.z=-3.25+audio.bass*.4+.24*Math.sin(t*.2);
   cloud.visible=cloudAlpha>.003;
   const fAlpha=phase===2?w:0;
   fractal.visible=fAlpha>.003;
   fractal.material.opacity=fAlpha*(.32+.4*pulse+.16*audio.high);
   fractal.rotation.set(t*.13,t*.3,t*.08);
   fractal.scale.setScalar(.82+audio.bass*.52+.08*Math.sin(t*.33));
   fractal.position.z=-3.25+.45*Math.sin(t*.2)+audio.attack*.4;
  }
 };
}
