import * as THREE from 'three';
// Spatial volumetric noise on GPU. No rings, geometric tunnels, frames or old visual families.
const TAU=Math.PI*2;
const vert=`
uniform float uTime,uBass,uMid,uHigh,uImpact,uScale,uSpeed,uMotion;
uniform float uFocus,uDensity;
attribute float aSeed;attribute float aSize;
varying float vLight;varying float vSeed;
float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
float noise3(vec3 p){
 vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
            mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z)*2.-1.;
}
void main(){
 vec3 p=position;float speed=uTime*(.045+uSpeed*.18);
 float n=noise3(p*.52+vec3(speed,aSeed*2.1,0.));
 float n2=sin(p.y*2.+speed+aSeed*6.283)*.5;
 vec3 q=normalize(p+vec3(.001));
 float pulse=uBass*2.8+uImpact*.78;
 p+=q*(n*(.5+uMotion*.72)+pulse*(.4+uScale*.66));
 p.x+=n2*(.2+uMid*.65);
 p.y+=sin(p.x*.7+speed)*(.11+uMotion*.21);
 p.z+=n*(.22+uMid*.38);
 float fog=.5+.5*sin(p.x*1.1+p.y*.6+speed*.3);
 float mask=smoothstep(.22,.68-uDensity*.1,fog)*step(uDensity*.45,aSeed);
 vec4 view=modelViewMatrix*vec4(p,1.);
 gl_Position=projectionMatrix*view;
 gl_PointSize=min(6.,max(1.1,aSize*(.9+uHigh*1.4+uImpact*.8)*uScale*15./max(1.,-view.z)));
 float gaze=dot(normalize(-p.xz),normalize(vec2(sin(uFocus),-cos(uFocus))));
 vSeed=mask;vLight=(.13+.32*abs(n)+.28*uImpact+.16*uHigh)*(.73+.27*gaze);
}`;
const frag=`
uniform float uAlpha;varying float vLight;varying float vSeed;
void main(){
 vec2 p=gl_PointCoord-.5;float d=length(p);
 float disk=1.-smoothstep(.1,.49,d);
 float core=exp(-d*d*32.);
 float brightness=(disk*.24+core*.76)*vLight*uAlpha*vSeed;
 gl_FragColor=vec4(vec3(1.),brightness);
}`;
export function makeClouds(root){
 const presets=[
  {count:1800,radius:4.7,spread:2.8,sector:0},
  {count:1600,radius:3.6,spread:2.0,sector:1},
  {count:1200,radius:6.3,spread:3.0,sector:2},
  {count:950,radius:5.5,spread:3.2,sector:3}
 ];
 const clouds=presets.map((preset,k)=>{
  const n=preset.count,p=new Float32Array(n*3),seeds=new Float32Array(n),sizes=new Float32Array(n);
  // Angular clustering deliberately creates drifting patches, never a uniform wallpaper.
  for(let i=0;i<n;i++){
   const v=(i+.5)/n,phi=i*2.3999632,twist=Math.sin(i*.071+k)*.49;
   const radius=preset.radius+(Math.sin(i*13.317+k*5.7)*preset.spread*.5);
   let az=phi*.38+twist+k*TAU/4;
   const polar= Math.acos(1-2*v)+.2*Math.sin(i*.23);
   p[i*3]=Math.sin(polar)*Math.cos(az)*radius;
   p[i*3+1]=Math.cos(polar)*radius;
   p[i*3+2]=Math.sin(polar)*Math.sin(az)*radius;
   seeds[i]=((i*1237)%n)/n;sizes[i]=.7+1.4*(.5+.5*Math.sin(i*11.3));
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(p,3));
  geometry.setAttribute('aSeed',new THREE.BufferAttribute(seeds,1));
  geometry.setAttribute('aSize',new THREE.BufferAttribute(sizes,1));
  const uniforms={uTime:{value:0},uBass:{value:0},uMid:{value:0},uHigh:{value:0},
   uImpact:{value:0},uScale:{value:1},uSpeed:{value:.5},uMotion:{value:.5},
   uAlpha:{value:k===0?.45:0},uDensity:{value:.12},uFocus:{value:k*1.57}};
  const material=new THREE.ShaderMaterial({
   uniforms,vertexShader:vert,fragmentShader:frag,transparent:true,
   depthWrite:false,blending:THREE.AdditiveBlending
  });
  const points=new THREE.Points(geometry,material);
  points.frustumCulled=false;points.position.y=1.6;
  root.add(points);
  return {points,uniforms};
 });
 return {
  clouds,
  update(t,params,cue,bass,mid,high,impact){
   const envelopes=[
    [.31,.55,.22,.28], [.56,.67,.14,.28],
    [.35,.9,.31,.23], [.53,.73,.6,.31],
    [.34,.58,.76,.43], [.69,.85,.82,.6],
    [.23,.28,.37,.24]
   ];
   const weights=envelopes[Math.min(6,cue)];
   for(let i=0;i<clouds.length;i++){
    const {points,uniforms:u}=clouds[i];
    u.uTime.value=t;
    u.uBass.value=bass;u.uMid.value=mid;u.uHigh.value=high;u.uImpact.value=impact;
    u.uScale.value=params.scale;
    u.uSpeed.value=params.speed;
    u.uMotion.value=params.motion;
    // A residual cloud is always visible, including pauses and ending.
    u.uAlpha.value=Math.max(i===0?.085:.018,weights[i]*params.intensity*.38*(.75+impact*.25));
    u.uDensity.value=Math.max(0,1-params.density);
    u.uFocus.value=t*.013+i*1.57;
    points.rotation.y=t*(.0012+.001*params.speed)*(i%2?-1:1);
   }
  }
 };
}
