import {scene,contains} from './geometry.js';
const canvas=document.querySelector('canvas'), error=document.querySelector('#error');
try {
const gl=canvas.getContext('webgl2');
if(!gl||!gl.getExtension('EXT_color_buffer_float'))throw Error('需要 WebGL2 和 EXT_color_buffer_float 支持。');
const source=await fetch('fluid.glsl?v=uniform-grid-fix-1',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('无法加载 shader');return r.text()});
function shader(type,text){const s=gl.createShader(type);gl.shaderSource(s,text);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,'#version 300 es\nvoid main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.-1.,0,1);}'));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,source));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);gl.bindVertexArray(gl.createVertexArray());
const loc=n=>gl.getUniformLocation(program,n);let w,h,velocity,dye,pressure,div,diffusionSource,curl,resources=[];
function target(){const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA16F,w,h,0,gl.RGBA,gl.HALF_FLOAT,null);for(const k of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,k,gl.NEAREST);for(const k of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,k,gl.CLAMP_TO_EDGE);const f=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,f);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t,0);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('浮点 framebuffer 不受支持');gl.clear(gl.COLOR_BUFFER_BIT);const out={t,f};resources.push(out);return out;}
const obstacleTexture=gl.createTexture();let obstacleVersion=-1;
function updateObstacles(){
 const pixels=new Uint8Array(w*h);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(scene.objects.some(o=>contains(o,(x+.5)/w,1-(y+.5)/h,w/h)))pixels[y*w+x]=255;
 gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,obstacleTexture);gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);
 gl.texImage2D(gl.TEXTURE_2D,0,gl.R8,w,h,0,gl.RED,gl.UNSIGNED_BYTE,pixels);
 for(const key of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,key,gl.NEAREST);
 for(const key of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,key,gl.CLAMP_TO_EDGE);
 gl.uniform1i(loc('obstacles'),2);obstacleVersion=scene.version;
}
const pair=()=>[target(),target()];
function reset(){for(const r of resources){gl.deleteTexture(r.t);gl.deleteFramebuffer(r.f)}resources=[];const ratio=canvas.clientWidth/canvas.clientHeight;w=Math.max(16,Math.round(number('resolution')*Math.min(ratio,1)));h=Math.max(16,Math.round(number('resolution')*Math.min(1/ratio,1)));velocity=pair();dye=pair();pressure=pair();div=target();diffusionSource=target();curl=target();updateObstacles();}
function pass(mode,out,a,b=a,display=false){gl.bindFramebuffer(gl.FRAMEBUFFER,out?.f??null);gl.viewport(0,0,display?canvas.width:w,display?canvas.height:h);gl.uniform2f(loc('size'),display?canvas.width:w,display?canvas.height:h);gl.uniform1i(loc('mode'),mode);[a,b].forEach((r,i)=>{gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,r.t);gl.uniform1i(loc(i?'b':'a'),i)});gl.drawArrays(gl.TRIANGLES,0,3);}
function swapPass(mode,p,b=p[0]){pass(mode,p[1],p[0],b);p.reverse()}
const control=id=>document.getElementById(id);
const number=id=>Number(control(id).value);
for(const input of document.querySelectorAll('input[type=range]:not(#hueLow):not(#hueHigh)'))input.oninput=()=>{control(input.id+'Value').textContent=input.value};
let pointer=null;
const pos=e=>{const r=canvas.getBoundingClientRect();return [(e.clientX-r.left)/r.width*w,(1-(e.clientY-r.top)/r.height)*h]};
canvas.onpointerdown=e=>{if(pointer)return;canvas.setPointerCapture(e.pointerId);const p=pos(e);pointer={id:e.pointerId,p,previous:p}};
canvas.onpointermove=e=>{if(pointer?.id===e.pointerId)pointer.p=pos(e)};
canvas.onpointerup=canvas.onpointercancel=canvas.onlostpointercapture=e=>{if(pointer?.id===e.pointerId)pointer=null};
control('reset').onclick=()=>{reset();pointer=null};
control('resolution').addEventListener('change',()=>{reset();pointer=null});
let previous=performance.now(),lost=false;canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;error.textContent='GPU 上下文丢失，请刷新页面。'});
function frame(now){if(lost)return;try{const cw=Math.max(1,Math.round(canvas.clientWidth*Math.min(devicePixelRatio,2))),ch=Math.max(1,Math.round(canvas.clientHeight*Math.min(devicePixelRatio,2)));if(canvas.width!==cw||canvas.height!==ch||!velocity){canvas.width=cw;canvas.height=ch;reset();pointer=null}if(obstacleVersion!==scene.version){updateObstacles();pointer=null;}const elapsed=Math.min(Math.max((now-previous)/1000,0),1/30)*number('timeScale');previous=now;
// Keep each numerical step at most 1/30 s even when playback is accelerated.
const substeps=Math.max(1,Math.ceil(elapsed/(1/30))),dt=elapsed/substeps;
for(let substep=0;substep<substeps;substep++){
gl.uniform1f(loc('dt'),dt);gl.uniform1f(loc('decay'),number('velocityDecay'));swapPass(0,velocity);
// Sample input once per simulation frame; dye amount is a rate per second.
if(pointer){const delta=pointer.p.map((v,i)=>(v-pointer.previous[i])/substeps);const steps=Math.max(1,Math.min(32,Math.ceil(Math.hypot(...delta)/Math.max(1,number('radius')*.5))));
gl.uniform1f(loc('radius'),number('radius'));
const hex=control('inkColor').value;const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
for(let i=1;i<=steps;i++){gl.uniform2f(loc('point'),...pointer.previous.map((v,k)=>v+delta[k]*(substep+i/steps)));gl.uniform2f(loc('force'),...delta.map(v=>Math.max(-180,Math.min(180,v*12))*number('strength')/steps));swapPass(1,velocity);gl.uniform3f(loc('ink'),...rgb.map(v=>v*number('amount')*dt/steps));swapPass(2,dye)}}
// Implicit velocity diffusion: (I - viscosity * dt * Laplacian) v = v0.
if(number('viscosity')>0){pass(10,diffusionSource,velocity[0]);gl.uniform1f(loc('viscosity'),number('viscosity'));for(let i=0;i<40;i++)swapPass(9,velocity,diffusionSource);}
// Add confinement before projection so its divergent component is removed.
if(number('vorticity')>0){pass(11,curl,velocity[0]);gl.uniform1f(loc('vorticity'),number('vorticity'));swapPass(12,velocity,curl);}
swapPass(6,velocity);pass(3,div,velocity[0]);for(const r of pressure){gl.bindFramebuffer(gl.FRAMEBUFFER,r.f);gl.clear(gl.COLOR_BUFFER_BIT)}for(let i=0;i<number('iterations');i++)swapPass(4,pressure,div);swapPass(5,velocity,pressure[0]);gl.uniform1f(loc('decay'),number('dyeDecay'));swapPass(0,dye,velocity[0]);
}
if(pointer)pointer.previous=[...pointer.p];
gl.uniform1f(loc('speedMax'),150);gl.uniform2f(loc('hueRange'),(240-number('hueLow'))/360,(240-number('hueHigh'))/360);const speed=document.querySelector('#mode').value==='0';pass(speed?7:8,null,speed?velocity[0]:dye[0],div,true);requestAnimationFrame(frame)}catch(e){error.textContent=e.message}}
requestAnimationFrame(frame);
}catch(e){error.textContent=e.message}
