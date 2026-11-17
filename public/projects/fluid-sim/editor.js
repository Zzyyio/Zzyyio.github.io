import {normalize,svgShape} from './geometry.js';
const ns='http://www.w3.org/2000/svg';
export function openEditor(objects,onApply){
 const draft=objects.map(normalize);let selected=-1,drag=null;
 const oldFocus=document.activeElement;
 const overlay=document.createElement('div');overlay.className='editor-overlay';
 overlay.innerHTML='<section class="obstacle-editor" role="dialog" aria-modal="true" aria-label="编辑预设"><header><h1>编辑预设</h1><div><button data-action="cancel" aria-label="放弃编辑">×</button><button data-action="apply" aria-label="应用编辑">✓</button></div></header><div class="editor-stage"><svg aria-label="障碍物布局"></svg></div><footer><div class="shape-tools" role="group" aria-label="添加形状"><button data-shape="circle" aria-label="添加圆形" title="添加圆形"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/></svg></button><button data-shape="triangle" aria-label="添加三角形" title="添加三角形"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4 21 20H3Z"/></svg></button><button data-shape="rectangle" aria-label="添加长方形" title="添加长方形"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="12" rx="1"/></svg></button></div><button class="shape-delete" data-action="delete" aria-label="删除选中形状" title="删除选中形状" disabled><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 10v7M14 10v7"/></svg></button></footer></section>';
 document.body.append(overlay);
 const siblings=[...document.body.children].filter(el=>el!==overlay),inert=siblings.map(el=>el.inert);siblings.forEach(el=>el.inert=true);
 const svg=overlay.querySelector('.editor-stage svg'),remove=overlay.querySelector('[data-action=delete]');
 const W=1000,H=1000*innerHeight/innerWidth;svg.setAttribute('viewBox',`0 0 ${W} ${H}`);svg.style.aspectRatio=`${W}/${H}`;
 function element(tag,attrs){const e=document.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,v);return e;}
 function draw(){svg.replaceChildren();draft.forEach((o,i)=>{const shape=svgShape(o,W,H);shape.dataset.index=i;shape.classList.add('editor-shape');svg.append(shape)});remove.disabled=selected<0;
  if(selected<0)return;const o=draft[selected],w=o.width*H,h=o.height*H;
  const g=element('g',{transform:`translate(${o.x*W} ${o.y*H}) rotate(${o.rotation*180/Math.PI})`});
  g.append(element('rect',{x:-w/2,y:-h/2,width:w,height:h,class:'selection-frame'}));
  g.append(element('line',{x1:0,y1:-h/2,x2:0,y2:-h/2-30,class:'selection-frame'}));
  for(const [x,y]of [[-1,-1],[1,-1],[-1,1],[1,1]]){const e=element('rect',{x:x*w/2-7,y:y*h/2-7,width:14,height:14,class:'transform-handle'});e.dataset.handle='scale';g.append(e)}
  const rotate=element('circle',{cx:0,cy:-h/2-30,r:9,class:'transform-handle'});rotate.dataset.handle='rotate';g.append(rotate);svg.append(g);
 }
 function point(e){const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(svg.getScreenCTM().inverse())}
 svg.addEventListener('pointerdown',e=>{const index=e.target.dataset.index,handle=e.target.dataset.handle;if(index!==undefined)selected=Number(index);else if(!handle){selected=-1;draw();return}const p=point(e);drag={mode:handle||'move',start:p,original:{...draft[selected]}};svg.setPointerCapture(e.pointerId);draw()});
 svg.addEventListener('pointermove',e=>{if(!drag)return;const p=point(e),o=draft[selected],a=drag.original;
  if(drag.mode==='move'){o.x=Math.max(0,Math.min(1,a.x+(p.x-drag.start.x)/W));o.y=Math.max(0,Math.min(1,a.y+(p.y-drag.start.y)/H));}
  else if(drag.mode==='rotate')o.rotation=a.rotation+Math.atan2(p.y-a.y*H,p.x-a.x*W)-Math.atan2(drag.start.y-a.y*H,drag.start.x-a.x*W);
  else{const dx=p.x-a.x*W,dy=p.y-a.y*H,c=Math.cos(a.rotation),s=Math.sin(a.rotation);o.width=Math.max(.03,Math.min(1.5,2*Math.abs(c*dx+s*dy)/H));o.height=Math.max(.03,Math.min(1.5,2*Math.abs(-s*dx+c*dy)/H));}draw();
 });
 svg.addEventListener('pointerup',()=>drag=null);svg.addEventListener('pointercancel',()=>drag=null);
 overlay.querySelectorAll('[data-shape]').forEach(button=>button.onclick=()=>{if(draft.length>=64)return;draft.push({type:button.dataset.shape,x:.5,y:.5,width:.24,height:.24,rotation:0});selected=draft.length-1;draw()});
 remove.onclick=()=>{if(selected>=0){draft.splice(selected,1);selected=-1;draw()}};
 let closing=false;
 function close(apply){if(closing)return;closing=true;if(apply)onApply(draft);overlay.classList.remove('open');setTimeout(()=>{overlay.remove();siblings.forEach((el,i)=>el.inert=inert[i]);oldFocus?.focus()},matchMedia('(prefers-reduced-motion: reduce)').matches?0:380)}
 overlay.querySelector('[data-action=cancel]').onclick=()=>close(false);overlay.querySelector('[data-action=apply]').onclick=()=>close(true);
 overlay.addEventListener('keydown',e=>{if(e.key==='Escape')close(false);if(e.key==='Tab'){const buttons=[...overlay.querySelectorAll('button:not(:disabled)')];if(e.shiftKey&&document.activeElement===buttons[0]){e.preventDefault();buttons.at(-1).focus()}else if(!e.shiftKey&&document.activeElement===buttons.at(-1)){e.preventDefault();buttons[0].focus()}}});
 draw();requestAnimationFrame(()=>{overlay.classList.add('open');overlay.querySelector('button').focus()});
}
