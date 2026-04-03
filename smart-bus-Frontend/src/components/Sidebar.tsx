// components/Sidebar.tsx — الـ sidebar الجانبي مع mobile support
import type { Page } from "../types";
import { Ic } from "../icons";

interface Props { page:Page; setPage:(p:Page)=>void; open:boolean; setOpen:(v:boolean)=>void; }

const NAV = [
  {id:"dashboard",label:"Dashboard",icon:<Ic.Grid/>},{id:"bookTrip",label:"Book Trip",icon:<Ic.Calendar/>},
  {id:"myTrips",label:"My Trips",icon:<Ic.Route/>},{id:"routeDetails",label:"Route Details",icon:<Ic.Map/>},
  {id:"trackBus",label:"Track Bus",icon:<Ic.Target/>},{id:"attendance",label:"Attendance",icon:<Ic.Chart/>},
  {id:"notifications",label:"Notifications",icon:<Ic.Bell/>},{id:"routeChat",label:"Route Chat",icon:<Ic.Chat/>},
] as const;

export default function Sidebar({page,setPage,open,setOpen}:Props){
  const go=(p:Page)=>{setPage(p);setOpen(false);};
  return(<>
    <div className={`overlay${open?" show":""}`} onClick={()=>setOpen(false)}/>
    <aside className={`sb${open?" open":""}`}>
      <div className="sb-logo">
        <div className="logo-ic"><Ic.Bus/></div>
        <div><div className="logo-t">SmartBus</div><div className="logo-s">Student Portal</div></div>
        <button className="sb-close" onClick={()=>setOpen(false)}><Ic.Close/></button>
      </div>
      <div className="nav-wrap">
        <div className="nl">Main</div>
        {NAV.map(n=><button key={n.id} className={`ni${page===n.id?" act":""}`} onClick={()=>go(n.id as Page)}>{n.icon} {n.label}</button>)}
      </div>
      <div className="sf">
        <button className={`ni${page==="support"?" act":""}`} onClick={()=>go("support")}><Ic.Help/> Support</button>
        <button className={`ni${page==="settings"?" act":""}`} onClick={()=>go("settings")}><Ic.Gear/> Settings</button>
        <button className="ni red"><Ic.Logout/> Logout</button>
      </div>
    </aside>
  </>);
}