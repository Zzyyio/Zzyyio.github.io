// Panel visibility, display-mode controls, and hue selection.
const panel=document.getElementById('panel'),toggle=document.getElementById('toggle'),corner=document.getElementById('corner');
const modeSelect=document.getElementById('mode'),brushSettings=document.getElementById('brushSettings');
function updateBrushVisibility(){
 const visible=modeSelect.value==='1';
 document.getElementById('hueSettings').hidden=visible;
 if(!visible&&brushSettings.contains(document.activeElement))document.querySelector('[data-mode="0"]').focus();
 brushSettings.classList.toggle('visible',visible);
 brushSettings.inert=!visible;
 brushSettings.setAttribute('aria-hidden',String(!visible));
}
const modeButtons=[...document.querySelectorAll('[data-mode]')];
function selectMode(button){
 modeSelect.value=button.dataset.mode;
 for(const item of modeButtons)item.setAttribute('aria-pressed',String(item===button));
 updateBrushVisibility();
}
for(const button of modeButtons){
 button.addEventListener('click',()=>selectMode(button));
 button.addEventListener('keydown',event=>{
  if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;
  event.preventDefault();
  const next=modeButtons[1-modeButtons.indexOf(button)];next.focus();selectMode(next);
 });
}
updateBrushVisibility();
const hueLow=document.getElementById('hueLow'),hueHigh=document.getElementById('hueHigh');
function updateHue(event){
 if(Number(hueLow.value)>Number(hueHigh.value)){
  if(event?.target===hueLow)hueLow.value=hueHigh.value;else hueHigh.value=hueLow.value;
 }
 const lo=Number(hueLow.value),hi=Number(hueHigh.value);
 document.getElementById('hueSelection').style.left=(lo/3.6)+'%';
 document.getElementById('hueSelection').style.right=(100-hi/3.6)+'%';
 document.getElementById('lowSwatch').style.background=`hsl(${240-lo} 100% 50%)`;
 document.getElementById('highSwatch').style.background=`hsl(${240-hi} 100% 50%)`;
}
hueLow.addEventListener('input',updateHue);hueHigh.addEventListener('input',updateHue);updateHue();
let hideTimer;
function reveal(){clearTimeout(hideTimer);if(panel.classList.contains('closed'))toggle.classList.add('revealed')}
function hideLater(){clearTimeout(hideTimer);hideTimer=setTimeout(()=>toggle.classList.remove('revealed'),650)}
corner.addEventListener('pointerenter',reveal);
corner.addEventListener('pointerdown',reveal);
corner.addEventListener('pointerleave',hideLater);
toggle.addEventListener('pointerenter',reveal);
toggle.addEventListener('pointerleave',hideLater);
toggle.addEventListener('blur',hideLater);
toggle.addEventListener('click',()=>{
 const closed=panel.classList.toggle('closed');
 clearTimeout(hideTimer);panel.inert=closed;
 toggle.classList.toggle('collapsed',closed);toggle.classList.remove('revealed');corner.classList.toggle('active',closed);
 toggle.setAttribute('aria-expanded',String(!closed));toggle.setAttribute('aria-label',closed?'展开参数面板':'收起参数面板');toggle.title=closed?'展开参数面板':'收起参数面板';toggle.textContent=closed?'›':'‹';
});

// One floating tooltip outside the scrolling panel avoids clipping.
const parameterHelp = {
 viscosity: '越大，速度差异越快被抹平，细小涡流越少。单位是格²/秒。',
 velocityDecay: '越大，流动停得越快。设为 0 可关闭额外的速度衰减。',
 vorticity: '增强卷曲和小涡流，让流动更丰富。设为 0 关闭。',
 timeScale: '调整模拟快慢：1 为正常速度，低于 1 慢放，高于 1 加速。',
 iterations: '越高，流体越接近不可压缩，但计算量也更大。',
 resolution: '越高，细节越丰富，GPU 开销越大。更改会清空当前流体。',
 dyeDecay: '越大，颜料淡去越快。设为 0 关闭额外消散。',
 radius: '控制画笔影响范围。越大，每次注入覆盖的区域越宽。',
 strength: '控制拖动推动流体的力度。设为 0 时只注入颜料。',
 amount: '控制按住画笔时每秒注入的颜料量。越大，颜色越浓、越亮。',
 inkColor: '选择新注入颜料的颜色，不会改变已有颜料或速度场配色。',
 hueLow: '选择速度色阶低端的颜色，只改变显示，不影响流体运动。',
 hueHigh: '选择速度色阶高端的颜色，中间速度按所选色相范围渐变。'
};
const helpTooltip=document.createElement('div');
helpTooltip.className='parameter-tooltip';helpTooltip.id='parameterTooltip';
helpTooltip.setAttribute('role','tooltip');helpTooltip.setAttribute('aria-hidden','true');
document.body.append(helpTooltip);
let helpOwner=null, helpShowTimer, helpHideTimer;
function hideHelp(){
 clearTimeout(helpShowTimer);clearTimeout(helpHideTimer);
 if(helpOwner)helpOwner.removeAttribute('aria-describedby');
 helpOwner=null;helpTooltip.classList.remove('visible');helpTooltip.setAttribute('aria-hidden','true');
}
function positionHelp(){
 if(!helpOwner)return;
 const r=helpOwner.getBoundingClientRect(),t=helpTooltip.getBoundingClientRect();
 let left=r.right+10;
 if(left+t.width>innerWidth-10)left=r.left-t.width-10;
 helpTooltip.style.left=Math.max(10,Math.min(left,innerWidth-t.width-10))+'px';
 helpTooltip.style.top=Math.max(10,Math.min(r.top+(r.height-t.height)/2,innerHeight-t.height-10))+'px';
}
for(const [id,text] of Object.entries(parameterHelp)){
 const input=document.getElementById(id);
 if(!input)continue;
 const label=document.querySelector(`label[for="${id}"]`);
 const button=document.createElement('button');button.type='button';button.className='info-button';
 button.textContent='i';button.setAttribute('aria-label',(label?.textContent||input.getAttribute('aria-label'))+'说明');
 if(label){
  const heading=document.createElement('div');heading.className='parameter-heading';
  label.before(heading);heading.append(label,button);
 }else document.getElementById(id==='hueLow'?'lowSwatch':'highSwatch').parentElement.append(button);
 function showHelp(){hideHelp();helpOwner=button;helpTooltip.textContent=text;helpTooltip.classList.add('visible');helpTooltip.setAttribute('aria-hidden','false');button.setAttribute('aria-describedby',helpTooltip.id);positionHelp()}
 function scheduleShow(){
  clearTimeout(helpShowTimer);clearTimeout(helpHideTimer);
  if(helpOwner===button)return;
  if(helpOwner)hideHelp();
  helpShowTimer=setTimeout(showHelp,350);
 }
 function scheduleHide(){
  clearTimeout(helpShowTimer);clearTimeout(helpHideTimer);
  helpHideTimer=setTimeout(hideHelp,200);
 }
 button.addEventListener('pointerenter',scheduleShow);
 button.addEventListener('pointerleave',scheduleHide);
 button.addEventListener('focus',scheduleShow);
 button.addEventListener('blur',scheduleHide);
 button.addEventListener('click',showHelp);
}
document.addEventListener('keydown',event=>{if(event.key==='Escape')hideHelp()});
document.addEventListener('pointerdown',event=>{if(!event.target.closest('.info-button'))hideHelp()});
panel.addEventListener('scroll',hideHelp);window.addEventListener('resize',hideHelp);
