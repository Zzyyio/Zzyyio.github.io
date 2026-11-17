// Use the physical short edge so phone detection survives rotation and keyboards.
const touchDevice = matchMedia('(any-pointer: coarse)');
const portrait = matchMedia('(orientation: portrait)');
const prompt = document.getElementById('orientationPrompt');
const panels = [
  { panel: document.getElementById('panel'), button: document.getElementById('toggle') },
  { panel: document.getElementById('scenePanel'), button: document.getElementById('sceneToggle') }
];
let wasPhone = false;

function updateMobileLayout() {
  const phone = touchDevice.matches && Math.min(screen.width, screen.height) <= 600;
  document.documentElement.classList.toggle('phone-layout', phone);
  if (phone && !wasPhone) {
    for (const item of panels) {
      if (!item.panel.classList.contains('closed')) item.button.click();
    }
  }
  wasPhone = phone;
  // Screen orientation remains stable when the on-screen keyboard opens.
  const isPortrait = screen.orientation?.type
    ? screen.orientation.type.startsWith('portrait')
    : portrait.matches;
  prompt.hidden = !phone || !isPortrait;
}

for (const item of panels) {
  item.button.addEventListener('click', () => {
    if (!wasPhone || item.panel.classList.contains('closed')) return;
    for (const other of panels) {
      if (other !== item && !other.panel.classList.contains('closed')) other.button.click();
    }
  });
}
touchDevice.addEventListener('change', updateMobileLayout);
portrait.addEventListener('change', updateMobileLayout);
screen.orientation?.addEventListener('change', updateMobileLayout);
window.addEventListener('resize', updateMobileLayout);
updateMobileLayout();
