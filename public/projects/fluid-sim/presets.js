import {normalize,svgShape,setScene} from './geometry.js';
import {openEditor} from './editor.js';
// Scene presets are UI data only; obstacle editing and collision are future work.
const storageKey='fluid.scene-presets.v1';
const initial={id:'two-circles',name:'双圆',objects:[{x:.25,y:.5,r:.12},{x:.75,y:.5,r:.12}]};
let presets=[initial],selected=initial.id;
try {
 const saved=JSON.parse(localStorage.getItem(storageKey));
 if(saved&&Array.isArray(saved.presets)&&saved.presets.length){
  const valid=saved.presets.every(p=>typeof p.id==='string'&&typeof p.name==='string'&&Array.isArray(p.objects)&&p.objects.every(o=>[o.x,o.y].every(Number.isFinite)&&((Number.isFinite(o.r)&&o.r>0)||(Number.isFinite(o.width)&&Number.isFinite(o.height)&&o.width>0&&o.height>0&&Number.isFinite(o.rotation)&&["circle","triangle","rectangle"].includes(o.type)))));
  if(valid&&new Set(saved.presets.map(p=>p.id)).size===saved.presets.length){presets=saved.presets;selected=presets.some(p=>p.id===saved.selected)?saved.selected:presets[0].id;}
 }
}catch{/* An unavailable store must not block the scene editor. */}
presets=presets.map(p=>({...p,objects:p.objects.map(normalize)}));
const panel=document.getElementById('scenePanel'),list=document.getElementById('presetList'),nameInput=document.getElementById('presetName'),status=document.getElementById('presetStatus');
function save(){try{localStorage.setItem(storageKey,JSON.stringify({schemaVersion:2,presets,selected}));status.textContent=''}catch{status.textContent='无法本地保存，预设仅保留在本次页面中。'}}
function render(){
 setScene(presets.find(p=>p.id===selected).objects);
 list.replaceChildren();
 for(const preset of presets){
  const wrapper=document.createElement('div');wrapper.className='preset-item';
  const card=document.createElement('button');card.type='button';card.className='preset-card';card.dataset.id=preset.id;card.setAttribute('aria-pressed',String(preset.id===selected));
  const title=document.createElement('span');title.className='preset-title';title.textContent=preset.name;card.append(title);
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 240 140');svg.setAttribute('aria-hidden','true');
  for(const object of preset.objects)svg.append(svgShape(object));
  card.append(svg);
  if(!preset.objects.length){const empty=document.createElement('span');empty.className='preset-empty';empty.textContent='空场景';card.append(empty)}
  card.addEventListener('click',()=>{selected=preset.id;save();render();list.querySelector(`[data-id="${CSS.escape(selected)}"]`).focus()});
  const remove=document.createElement('button');remove.type='button';remove.className='preset-delete';
  remove.disabled=presets.length===1;wrapper.classList.toggle('delete-disabled',remove.disabled);
  remove.setAttribute('aria-label',`删除预设：${preset.name}`);
  remove.title=remove.disabled?'至少保留一个预设':'删除预设';
  remove.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 10v7M14 10v7"/></svg>';
  remove.addEventListener('click',event=>{
   event.stopPropagation();if(presets.length<=1)return;
   const scroll=list.scrollTop,index=presets.findIndex(item=>item.id===preset.id);
   presets.splice(index,1);
   if(selected===preset.id)selected=presets[Math.min(index,presets.length-1)].id;
   save();render();list.scrollTop=scroll;
   list.querySelector(`[data-id="${CSS.escape(selected)}"]`).focus({preventScroll:true});
  });
  wrapper.append(card,remove);list.append(wrapper);
 }
 const add=document.createElement('button');add.type='button';add.className='preset-card preset-add';add.setAttribute('aria-label','新建预设');
 const arrow=document.createElement('span');arrow.textContent='↗';arrow.setAttribute('aria-hidden','true');const label=document.createElement('span');label.textContent='新建预设';add.append(arrow,label);
 add.addEventListener('click',()=>{let i=1;while(presets.some(p=>p.name===`未命名预设 ${i}`))i++;const preset={id:crypto.randomUUID(),name:`未命名预设 ${i}`,objects:[]};presets.push(preset);selected=preset.id;save();render();list.lastElementChild.previousElementSibling.scrollIntoView({block:'nearest'});nameInput.focus();nameInput.select()});list.append(add);
 nameInput.value=presets.find(p=>p.id===selected).name;
}
nameInput.addEventListener('input',()=>{
 const preset=presets.find(p=>p.id===selected);preset.name=nameInput.value.trim()||'未命名预设';
 const card=[...list.querySelectorAll('[data-id]')].find(c=>c.dataset.id===selected);card.querySelector('.preset-title').textContent=preset.name;card.parentElement.querySelector('.preset-delete').setAttribute('aria-label',`删除预设：${preset.name}`);save();
});
nameInput.addEventListener('blur',()=>nameInput.value=presets.find(p=>p.id===selected).name);
render();
const toggle=document.getElementById('sceneToggle'),corner=document.getElementById('sceneCorner');let timer;
function setClosed(closed){panel.classList.toggle('closed',closed);panel.inert=closed;toggle.classList.toggle('collapsed',closed);toggle.classList.remove('revealed');corner.classList.toggle('active',closed);toggle.textContent=closed?'‹':'›';toggle.setAttribute('aria-expanded',String(!closed));toggle.setAttribute('aria-label',closed?'展开场景面板':'收起场景面板')}
toggle.addEventListener('click',()=>{clearTimeout(timer);setClosed(!panel.classList.contains('closed'))});
function reveal(){clearTimeout(timer);if(panel.classList.contains('closed'))toggle.classList.add('revealed')}
function hide(){clearTimeout(timer);timer=setTimeout(()=>toggle.classList.remove('revealed'),650)}
for(const el of [toggle,corner]){el.addEventListener('pointerenter',reveal);el.addEventListener('pointerleave',hide)}corner.addEventListener('pointerdown',reveal);toggle.addEventListener('blur',hide);
setClosed(matchMedia('(max-width:700px)').matches);

document.getElementById('editPreset').onclick=()=>{const preset=presets.find(p=>p.id===selected);openEditor(preset.objects,objects=>{preset.objects=objects;save();render()})};
