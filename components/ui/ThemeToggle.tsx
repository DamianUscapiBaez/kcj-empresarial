"use client";
import {useEffect,useState} from "react";
type Theme="system"|"light"|"dark";
export function ThemeToggle({scope="device"}:{scope?:string}){
 const key=`kcj-theme:${scope}`;
 const [theme,setTheme]=useState<Theme>("system");
 useEffect(()=>{try{const t=localStorage.getItem(key);setTheme(t==="light"||t==="dark"?t:"system");}catch{}},[key]);
 useEffect(()=>{document.documentElement.dataset.theme=theme;},[theme]);
 function change(t:Theme){setTheme(t);try{localStorage.setItem(key,t);}catch{}}
 return <label className="inline-flex shrink-0 items-center gap-1 text-xs"><span className="sr-only">Apariencia</span><select aria-label="Apariencia: claro, oscuro o automático" className="kcj-theme-select rounded-lg border px-2 py-2" value={theme} onChange={e=>change(e.target.value as Theme)}><option value="system">◐ Auto</option><option value="light">☀ Claro</option><option value="dark">☾ Oscuro</option></select></label>;
}
