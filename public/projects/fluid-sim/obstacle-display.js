import {scene,svgShape} from './geometry.js';
// Browser vector rasterization supplies screen-resolution antialiasing.
// This layer never participates in the simulation or captures pointer input.
const layer=document.createElementNS('http://www.w3.org/2000/svg','svg');
layer.id='obstacleDisplay';layer.setAttribute('aria-hidden','true');
const canvas=document.querySelector('canvas');canvas.after(layer);
function render(){
 const {width,height}=canvas.getBoundingClientRect();
 if(!width||!height)return;
 layer.setAttribute('viewBox',`0 0 ${width} ${height}`);
 layer.replaceChildren(...scene.objects.map(object=>svgShape(object,width,height)));
}
new ResizeObserver(render).observe(canvas);
window.addEventListener('fluid-scene-change',render);
render();
