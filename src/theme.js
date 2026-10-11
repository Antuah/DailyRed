const KEY='daily-red-theme';
export function setupTheme(onChange=()=>{}){
 const button=document.getElementById('theme-button'),label=document.getElementById('theme-label'),icon=document.getElementById('theme-icon');
 const media=matchMedia('(prefers-color-scheme: dark)');let explicit=false;
 try{explicit=['light','dark'].includes(localStorage.getItem(KEY));}catch{}
 function apply(dark){
  document.documentElement.dataset.theme=dark?'dark':'light';
  button.setAttribute('aria-pressed',String(dark));button.setAttribute('aria-label',dark?'Activar modo claro':'Activar modo oscuro');
  label.textContent=dark?'Modo claro':'Modo oscuro';
  icon.innerHTML=dark?'<circle cx="12" cy="12" r="3.5"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>':'<path d="M20.2 15.4A8.5 8.5 0 0 1 8.6 3.8a8.5 8.5 0 1 0 11.6 11.6Z"/>';
  document.querySelector('meta[name="theme-color"]').setAttribute('content',dark?'#151d23':'#f6f4ed');
  onChange(dark);
 }
 apply(document.documentElement.dataset.theme==='dark');
 button.addEventListener('click',()=>{const dark=document.documentElement.dataset.theme!=='dark';explicit=true;try{localStorage.setItem(KEY,dark?'dark':'light');}catch{}apply(dark);});
 media.addEventListener('change',event=>{if(!explicit)apply(event.matches);});
}
