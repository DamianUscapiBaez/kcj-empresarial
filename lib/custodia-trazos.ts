/** Valida geometría básica en cliente: no prueba la identidad del firmante. */
export function firmaConTrazoSuficiente(strokes:ReadonlyArray<ReadonlyArray<{x:number;y:number}>>):boolean{
 const all=strokes.flat();
 if(all.length<8||strokes.length===0)return false;
 if(all.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<0||p.x>1||p.y<0||p.y>1))return false;
 const xs=all.map(p=>p.x),ys=all.map(p=>p.y);
 return Math.max(...xs)-Math.min(...xs)>=0.09 || Math.max(...ys)-Math.min(...ys)>=0.09;
}
