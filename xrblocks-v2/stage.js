import * as THREE from 'three';
// ATMOSPHERE XR V10 — 14 distinct spatial compositions, with one tunnel ever.
// No duplicate hero sculpture and no live FFT. All animation follows track time.
const PI=Math.PI, TAU=2*PI;
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
const descriptions=[
 'Resonancia: vibraciones que atraviesan el espacio.',
 'Formacion: la materia comienza a organizarse.',
 'Anatomia de luz: estructuras emergen de la radiacion.',
 'Dispersion: fragmentos se expanden en el espacio.',
 'Transmision: conexiones transportan energia.',
 'Campos: fuerzas invisibles deforman el entorno.',
 'Difusion: la materia se propaga y transforma.',
 'Entrelazamiento: redes de relaciones simultaneas.',
 'Orbita: trayectorias y ciclos en movimiento.',
 'Presencia: ondas que revelan la percepcion.',
 'Morfogenesis: crecimiento y transformacion organica.',
 'Simetria: correspondencias sin principio ni final.',
 'Persistencia: huellas que permanecen en el tiempo.',
 'Disolucion: la forma retorna al espacio.'
];
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
  // True interior-scale passage: wide rings encircle the viewer's body.
  // Each ring crosses the headset ONCE, rather than looping or teleporting.
  for(let j=0;j<21;j++){
   const radius=1.58+.13*Math.sin(j*.42);
   const ring=new THREE.Mesh(new THREE.TorusGeometry(radius,.0095,4,88),
    new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,
     depthWrite:false,side:THREE.DoubleSide}));
   ring.position.z=-1.65-j*.43;
   g.add(ring);add(ring);
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
  const geo=new THREE.SphereGeometry(1.08,28,18);
  const v=geo.attributes.position;
  for(let k=0;k<v.count;k++){
   const x=v.getX(k),y=v.getY(k),z=v.getZ(k);
   const fold=.72+.27*Math.sin(y*3.8+x*2.1)+.16*Math.cos(z*4.2);
   v.setXYZ(k,x*(1+.2*Math.sin(z*3.1))*fold,y*1.18,z*.7*fold);
  }
  geo.computeVertexNormals();
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
  // MORPHOGENESIS: an implicit 3D surface. Smooth-min metaballs truly
  // become ONE continuous volume, then separate and rejoin.
  // Rendered as one box (not 4 overlaid transparent spheres). Quest-safe:
  // bounded raymarch, no CPU geometry rebuilding, deterministic 402s score.
  const vertex=`
   varying vec3 vEntry;
   varying vec3 vEye;
   void main(){
    vEntry=position;
    vec3 delta=cameraPosition-modelMatrix[3].xyz;
    vEye=vec3(
      dot(delta,modelMatrix[0].xyz)/dot(modelMatrix[0].xyz,modelMatrix[0].xyz),
      dot(delta,modelMatrix[1].xyz)/dot(modelMatrix[1].xyz,modelMatrix[1].xyz),
      dot(delta,modelMatrix[2].xyz)/dot(modelMatrix[2].xyz,modelMatrix[2].xyz));
    gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
   }
  `;
  const fragment=`
   precision highp float;
   uniform float uTime;
   uniform float uAlpha;
   uniform float uVariation;
   varying vec3 vEntry,vEye;
   float smoothUnion(float a,float b,float k){
    float h=max(k-abs(a-b),0.0)/k;
    return min(a,b)-h*h*k*.25;
   }
   mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
   float field(vec3 p){
    float t=uTime;
    // Slow separation, aggregation and re-formation with authored easing.
    float part=pow(.5+.5*sin(t*.27-.7),2.0);
    float dist=.15+part*(.92+.26*uVariation);
    float fusion=.53-.35*part;
    p.xz=rot(t*.18)*p.xz;
    p.yz=rot(t*.105)*p.yz;
    vec3 a=vec3(-dist, .15*sin(t*.33),0.);
    vec3 b=vec3( dist,-.10*sin(t*.24),0.);
    vec3 c=vec3(.12*sin(t*.18),dist*.67,.28*cos(t*.27));
    vec3 d=vec3(.19*cos(t*.26),-dist*.67,-.3*sin(t*.2));
    float v=length(p-a)-.53;
    v=smoothUnion(v,length(p-b)-.54,fusion);
    v=smoothUnion(v,length(p-c)-.43,fusion);
    v=smoothUnion(v,length(p-d)-.40,fusion);
    return v+.045*sin(p.y*5.+t*.47)*sin(p.x*4.+t*.29);
   }
   vec3 normalAt(vec3 p){
    vec2 e=vec2(.017,0.);
    return normalize(vec3(
     field(p+e.xyy)-field(p-e.xyy),
     field(p+e.yxy)-field(p-e.yxy),
     field(p+e.yyx)-field(p-e.yyx)
    ));
   }
   void main(){
    vec3 dir=normalize(vEntry-vEye);
    vec3 p=vEntry+dir*.018;
    bool hit=false;
    for(int i=0;i<32;i++){
     float d=field(p);
     if(d<.018){hit=true;break;}
     p+=dir*clamp(d*.8,.022,.18);
     if(any(greaterThan(abs(p),vec3(1.62))))break;
    }
    if(!hit)discard;
    vec3 n=normalAt(p);
    float diffuse=.48+.48*max(dot(n,normalize(vec3(-.4,.7,1.))),0.);
    float rim=pow(1.-abs(dot(n,-dir)),2.);
    float shade=min(1.,diffuse+.25*rim);
    gl_FragColor=vec4(vec3(shade),uAlpha*(.74+.2*rim));
   }
  `;
  const mat=new THREE.ShaderMaterial({
   vertexShader:vertex,fragmentShader:fragment,
   uniforms:{uTime:{value:0},uAlpha:{value:0},uVariation:{value:.55}},
   transparent:true,depthWrite:false,side:THREE.FrontSide
  });
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(3.24,3.24,3.24),mat);
  mesh.frustumCulled=false;g.add(mesh);add(mesh);
 }else if(kind==='axis'){
  // SYMMETRY is a whole-environment 360° field, centred on the observer.
  // Every trace is a mathematically CLOSED periodic curve. LineLoop
  // joins its last vertex to its first: no visible start/end caps.
  // Paired, mirrored bands preserve the chapter's symmetry concept.
  const bands=12,segments=240;
  for(let i=0;i<bands;i++){
   const layer=i%6,mirror=i<6?1:-1;
   const phase=layer*TAU/6,rad=3.7+.29*layer;
   const verts=[];
   for(let j=0;j<segments;j++){
    const u=TAU*j/segments;
    const radial=rad+.38*Math.sin(4*u+phase);
    const angular=u+phase*.22;
    const x=radial*Math.cos(angular);
    const z=radial*Math.sin(angular);
    const y=mirror*(1.5*Math.sin(2*u+phase)+.58*Math.sin(4*u-phase));
    verts.push(new THREE.Vector3(x,y,z));
   }
   const geo=new THREE.BufferGeometry().setFromPoints(verts);
   const trace=new THREE.LineLoop(geo,lineMaterial());
   trace.frustumCulled=false;g.add(trace);add(trace);
  }
  // Additional seamless vertical arcs carry the traces overhead and below.
  for(let i=0;i<8;i++){
   const verts=[],az=i*TAU/8,rad=4.25+(i%2)*.55;
   for(let j=0;j<240;j++){
    const u=TAU*j/240;
    const x=rad*Math.cos(u)*Math.cos(az)-.5*Math.sin(3*u)*Math.sin(az);
    const z=rad*Math.cos(u)*Math.sin(az)+.5*Math.sin(3*u)*Math.cos(az);
    const y=2.85*Math.sin(u);
    verts.push(new THREE.Vector3(x,y,z));
   }
   const geo=new THREE.BufferGeometry().setFromPoints(verts);
   const trace=new THREE.LineLoop(geo,lineMaterial());
   trace.frustumCulled=false;g.add(trace);add(trace);
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
 // Floating chapter concept only: no repeated work title or micro-label.
 const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=320;
 const ctx=canvas.getContext('2d'),tex=new THREE.CanvasTexture(canvas);
 const titlePlane=new THREE.Mesh(new THREE.PlaneGeometry(2.8,.59),
  new THREE.MeshBasicMaterial({map:tex,transparent:true,opacity:0,depthTest:false,depthWrite:false,side:THREE.DoubleSide}));
 titlePlane.renderOrder=60;root.add(titlePlane);
 let previous=-1,active='';
 const descriptionCanvas=document.createElement('canvas');descriptionCanvas.width=1536;descriptionCanvas.height=128;
 const descriptionCtx=descriptionCanvas.getContext('2d'),descriptionTex=new THREE.CanvasTexture(descriptionCanvas);
 const descriptionPlane=new THREE.Mesh(new THREE.PlaneGeometry(2.15,.18),new THREE.MeshBasicMaterial({map:descriptionTex,transparent:true,opacity:0,depthTest:false,depthWrite:false,side:THREE.DoubleSide}));
 descriptionPlane.renderOrder=65;root.add(descriptionPlane);
 function drawDescription(i){descriptionCtx.clearRect(0,0,1536,128);descriptionCtx.fillStyle='#ddd';descriptionCtx.textAlign='center';descriptionCtx.font='36px Arial';descriptionCtx.fillText(descriptions[i],768,73,1490);descriptionTex.needsUpdate=true;}

 const focus=new THREE.Vector3(0,1.6,-3);
 function drawCaption(title){
  ctx.clearRect(0,0,1536,320);
  ctx.fillStyle='#ffffff';ctx.textAlign='center';
  ctx.font='bold 132px Arial';
  ctx.fillText(title,768,183,1470);
  tex.needsUpdate=true;
 }
 // Deliberately distributes visual attention to left/right, up/down,
 // and behind. Angles are WORLD azimuth relative to initial forward (-Z).
 // Every chapter has a DIFFERENT spatial composition and unique destination.
 const positions=[
  [0,1.6,0],          // one-time tunnel: geometry already recedes along -Z
  [1.06,1.75,3.3],    // right
  [-.94,2.62,3.5],    // above left
  [2.15,1.05,3.3],    // rear right
  [-1.98,2.42,3.15],  // upper left
  [2.81,1.82,3.4],    // almost behind
  [-.35,.68,3.1],     // below front
  [3.15,2.15,3.25],   // fully behind
  [-2.45,2.78,3.35],  // above behind-left
  [1.8,1.23,3.5],     // right
  [-1.53,2.15,5.8],   // metaballs safely beyond near-camera viewing volume
  [.68,.77,3.05],     // below right
  [3.72,1.75,3.45],   // behind-left
  [-.8,1.88,3.2]      // left front
 ];
 const fade=3.6;
 // Absolute-time fade for each UNIQUE chapter; crucially it never
 // wraps or replays a previous chapter when the chapter index changes.
 function chapterWeight(t,i){
  const start=i===0?0:chapters[i-1].end,end=chapters[i].end;
  const incoming=i===0?1:smooth((t-start+fade)/(fade*2));
  const outgoing=i===chapters.length-1?1:1-smooth((t-end+fade)/(fade*2));
  return Math.max(0,incoming*outgoing);
 }
 const events=[
  4.5,11,18,24,31,40,48,54,64,72,82,94,102,110,119,128,
  137,146,156,166,177,186,194,206,216,222,234,243,253,262,
  274,284,296,306,314,326,336,346,359,368,379,389,399
 ];
 function accentAt(t){
  let v=0;
  for(const event of events){
   const d=Math.abs(t-event);
   if(d<2.1)v=Math.max(v,(1+Math.cos(d*Math.PI/2.1))*.5);
  }
  return v;
 }
 function update(t,_score,controls={},camera=null){
  const time=Math.max(0,Math.min(401.999,Number.isFinite(t)?t:0));
  let index=chapters.findIndex(c=>time<c.end);
  if(index<0)index=chapters.length-1;
  if(index!==previous){previous=index;drawCaption(chapters[index].title);drawDescription(index)}
  active=chapters[index].title;
  const intensity=controls.intensity??1,scale=controls.scale??1;
  const variation=controls.variation??.55,motion=controls.motion??.8,speed=controls.speed??.6;
  const note=accentAt(time);
  for(let i=0;i<chapters3d.length;i++){
   const {group,objects,kind}=chapters3d[i],weight=chapterWeight(time,i);
   group.visible=weight>.003;
   if(!group.visible)continue;
   const start=i===0?0:chapters[i-1].end;
   const local=time-start;
   const slow=local*(.28+.23*speed);
   const [angle,height,radius]=positions[i];
   const span=chapters[i].end-start;
   const u=smooth(local/span);
   const travel=(i===0?0:.2+.12*(i%3))*Math.sin(u*Math.PI*.75);
   const azimuth=angle+travel*(i%2===0?1:-1);
   const x=Math.sin(azimuth)*radius,z=-Math.cos(azimuth)*radius;
   const movement=.13+.13*motion;
   // Smooth musical phrasing: translation in tangent / vertical directions.
   // Crucially NO bass-driven forward-back Z jumps and no frame FFT input.
   const sway=movement*Math.sin(slow*.42+i*.7);
   if(kind==='tunnel'||kind==='axis')group.position.set(0,1.6,0);
   else group.position.set(x+Math.cos(azimuth)*sway,
    height+.12*Math.sin(slow*.54+i*.41)+.06*note,
    z+Math.sin(azimuth)*sway);
   group.rotation.set(kind==='tunnel'?0:.11*Math.sin(slow*.26+i),
    kind==='tunnel'?.025*Math.sin(slow*.32):time*(.045+.025*speed)+i*.29,
    kind==='tunnel'?0:.06*Math.sin(slow*.39+i));
   const breathe=1+.065*Math.sin(slow*.78+i*.67)+.038*note;
   group.scale.setScalar((kind==='tunnel'||kind==='axis')?1:(kind==='crystal'?.52:1)*scale*breathe*(1+.12*variation*((i%4)/4)));
   for(let j=0;j<objects.length;j++){
    const o=objects[j];o.visible=true;
    const opacity=Math.min(1,weight*intensity*
      (.67+.14*Math.sin(slow*.63+j*.19)+.08*note));
    if(kind==='crystal'){
     o.material.uniforms.uTime.value=local;
     o.material.uniforms.uAlpha.value=opacity;
     o.material.uniforms.uVariation.value=variation;
    }else o.material.opacity=opacity;
    if(kind==='tunnel'){
     // Once, during the opening only, a continuous optical-depth movement.
     // Viewer stays physically still while the complete tunnel flows
     // past their head and behind them, creating actual 360 traversal.
     const passage=12.25*smooth(local/26);
     o.position.z=-1.65-j*.43+passage;
     o.scale.setScalar(1+.026*Math.sin(slow*.6+j*.31)+.02*note);
     // Fade each ring in/out close to clipping and far behind the viewer.
     const distance=Math.abs(o.position.z);
     const visibility=smooth((10-distance)/2);
     o.material.opacity=Math.min(1,weight*intensity*
       (.42+.13*Math.sin(slow*.34+j*.27)+.1*note))*
       visibility;
    }
   }
  }
  // The single floating concept caption follows the active chapter into
  // the spatial sector; readable regardless of where user turns their head.
  const chapter=chapters3d[index].group;
  // Point to the actual current composition in world space, not a
  // generic scene-direction guess. Metaballs remain at a safe distance.
  focus.copy(chapter.position);
  if(index===0)focus.set(0,1.6,-3.4);
  if(index===11)focus.set(0,1.6,-4); // 360° field: no single directional focus
  titlePlane.position.set(chapter.position.x,
   Math.min(3.25,Math.max(1.12,chapter.position.y+1.27)),
   chapter.position.z+(index===0?-3.3:0));
  titlePlane.lookAt(0,1.6,0);
  const start=index===0?0:chapters[index-1].end;
  const end=chapters[index].end;
  // Head-relative caption: below the visual center, never attached to artwork.
  // Camera-relative caption, below the central viewing area.
  if(camera){
   const eye=new THREE.Vector3(),orientation=new THREE.Quaternion();
   camera.getWorldPosition(eye);camera.getWorldQuaternion(orientation);
   descriptionPlane.position.copy(eye).add(new THREE.Vector3(0,-.37,-1.7).applyQuaternion(orientation));
   descriptionPlane.quaternion.copy(orientation);
  }
  descriptionPlane.material.opacity=.62*smooth((time-start)/2)*(1-smooth((time-(end-2))/2));
  titlePlane.material.opacity=.94*
   smooth((time-start)/2.0)*(1-smooth((time-(end-2.0))/2.0));
 }
 return {update,chapters,get active(){return active},get focus(){return focus},get allAround(){return previous===11}};
}
export const createStage=createForeground;
