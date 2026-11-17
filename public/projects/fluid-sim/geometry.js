export function normalize(o){return {type:o.type||'circle',x:o.x,y:o.y,width:o.width??o.r*2,height:o.height??o.r*2,rotation:o.rotation||0};}
export function contains(o,x,y,aspect){
 const dx=(x-o.x)*aspect,dy=y-o.y,c=Math.cos(o.rotation),s=Math.sin(o.rotation);
 const u=(c*dx+s*dy)/(o.width/2),v=(-s*dx+c*dy)/(o.height/2);
 if(o.type==='circle')return u*u+v*v<=1;
 if(o.type==='triangle')return v>=-1&&v<=1&&Math.abs(u)<=(v+1)/2;
 return Math.abs(u)<=1&&Math.abs(v)<=1;
}
export function svgShape(o,width=240,height=140){
 const ns='http://www.w3.org/2000/svg',el=document.createElementNS(ns,o.type==='circle'?'ellipse':o.type==='triangle'?'polygon':'rect');
 const w=o.width*height,h=o.height*height;
 if(o.type==='circle'){el.setAttribute('rx',w/2);el.setAttribute('ry',h/2)}
 else if(o.type==='triangle')el.setAttribute('points',`0,${-h/2} ${w/2},${h/2} ${-w/2},${h/2}`);
 else for(const [k,v]of Object.entries({x:-w/2,y:-h/2,width:w,height:h}))el.setAttribute(k,v);
 el.setAttribute('transform',`translate(${o.x*width} ${o.y*height}) rotate(${o.rotation*180/Math.PI})`);return el;
}
export const scene={objects:[],version:0};
export function setScene(objects){scene.objects=objects.map(normalize);scene.version++;if(typeof window!=='undefined')window.dispatchEvent(new Event('fluid-scene-change'));}
