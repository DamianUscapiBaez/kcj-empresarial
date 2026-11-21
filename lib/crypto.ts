import {scryptSync, randomBytes, timingSafeEqual, createHash} from "node:crypto";
export function passwordHash(password:string):string {const salt=randomBytes(16).toString("hex");return `scrypt:${salt}:${scryptSync(password,salt,64).toString("hex")}`;}
export function passwordMatches(candidate:string,stored:string):boolean {
 const parts=stored.split(":");if(parts.length!==3||parts[0]!=="scrypt")return false;
 const received=Buffer.from(parts[2],"hex");if(received.length!==64)return false;
 return timingSafeEqual(received,scryptSync(candidate,parts[1],64));
}
export function token():string {return randomBytes(32).toString("base64url");}
export function tokenHash(value:string):string {return createHash("sha256").update(value).digest("hex");}
