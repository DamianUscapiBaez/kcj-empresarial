import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=(name:string)=>readFileSync(name,"utf8");
function lum(hex:string){
 const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
 const lin=rgb.map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4);
 return lin[0]*.2126+lin[1]*.7152+lin[2]*.0722;
}
function contrast(a:string,b:string){
 const x=lum(a),y=lum(b);
 return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
test("Menú lateral claro muestra texto legible con contraste mínimo 4.5:1",()=>{
 assert.ok(contrast("#33404A","#EAF0F3")>=4.5);
 assert.ok(contrast("#596774","#EAF0F3")>=4.5);
 const layout=read("app/dashboard/layout.tsx");
 assert.match(layout,/bg-kcj-sidebar text-kcj-charcoal/);
 assert.doesNotMatch(layout,/bg-kcj-sidebar text-white/);
});
test("Selección activa no tiene marco negro y usa rojo suave corporativo",()=>{
 const n=read("components/ui/NavigationLink.tsx");
 assert.match(n,/bg-kcj-redSoft/);
 assert.match(n,/border-\[#E6C7CE\]/);
 assert.doesNotMatch(n,/ring-black|border-black/);
 assert.ok(contrast("#822334","#F7E9EC")>=4.5);
});
test("Texto de botones principales es legible",()=>{
 assert.ok(contrast("#FFFFFF","#A6263A")>=4.5);
 assert.match(read("app/globals.css"),/bg-kcj-red/);
});
test("Paleta gris rojo sin alterar esquema ni acciones",()=>{
 const c=read("tailwind.config.ts");
 for(const v of ["#A6263A","#EAF0F3","#F3F5F7","#DAE1E7"])assert.ok(c.includes(v));
 assert.match(read("app/login/page.tsx"),/form action=\{login\}/);
 assert.match(read("components/ui/fields.tsx"),/form action=\{action\}/);
});
