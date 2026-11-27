import type {Metadata} from "next";
import "./globals.css";
export const metadata:Metadata={title:"KCJ CONTROL Empresarial",description:"Gestión operacional y SSOMA de KCJ PERÚ S.A.C.",manifest:"/manifest.webmanifest",icons:{icon:[{url:"/favicon.ico"},{url:"/assets/kcj-icon-192.png",type:"image/png",sizes:"192x192"}],apple:"/assets/kcj-icon-192.png"}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es"><body>{children}</body></html>}
