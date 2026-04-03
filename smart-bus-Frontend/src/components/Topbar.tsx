// components/Topbar.tsx — الـ header العلوي مع search + theme + bell + user
import { useState } from "react";
import type { Page, Theme } from "../types";
import { Ic } from "../icons";
import { NOTIFS } from "../data";

const META: Record<Page,{title:string;sub:string}> = {
  dashboard:{title:"Dashboard",sub:"Welcome back, Sara"},
  bookTrip:{title:"Book Trip",sub:"Reserve your seat for tomorrow"},
  myTrips:{title:"My Trips",sub:"Manage your weekly transportation"},
  routeDetails:{title:"Route Details",sub:"View routes and schedules"},
  trackBus:{title:"Track Bus",sub:"Live bus location and ETA"},
  attendance:{title:"Attendance",sub:"Your trip history and stats"},
  notifications:{title:"Notifications",sub:"Alerts and updates"},
  routeChat:{title:"Route Chat",sub:"Chat with your route group"},
  support:{title:"Support",sub:"Help center & tickets"},
  settings:{title:"My Profile",sub:"Manage your personal information"},
};

export default function Topbar({page,theme,setTheme,onMenu}:{page:Page;theme:Theme;setTheme:(t:Theme)=>void;onMenu:()=>void}){
  const [nd,setNd]=useState(false);
  const [ud,setUd]=useState(false);
  const {title,sub}=META[page];
  return(
    <header className="tb" onClick={()=>{setNd(false);setUd(false);}}>
      <div className="tb-l">
        <button className="hb" onClick={e=>{e.stopPropagation();onMenu();}}><Ic.Hamburger/></button>
        <div><div className="tb-title">{title}</div><div className="tb-sub">{sub}</div></div>
      </div>
      <div className="tb-r" onClick={e=>e.stopPropagation()}>
        <div className="srch"><Ic.Search/><input placeholder="Search..."/></div>
        <button className="ib" onClick={()=>setTheme(theme==="dark"?"light":"dark")}>{theme==="dark"?<Ic.Sun/>:<Ic.Moon/>}</button>
        <div style={{position:"relative"}}>
          <button className="ib nb" onClick={()=>{setNd(v=>!v);setUd(false);}}><Ic.Bell/></button>
          {nd&&<div className="drop ndrop"><div className="drop-h"><span className="drop-ht">Notifications</span><span className="n-ct">2 NEW</span></div>{NOTIFS.slice(0,2).map(n=><div key={n.id} className="n-row"><span className="n-dot"/><div><div className="n-t">{n.title}</div><div className="n-m">{n.message}</div><div className="n-tm">{n.time}</div></div></div>)}<div className="drop-f">View all →</div></div>}
        </div>
        <div style={{position:"relative"}}>
          <div className="uc" onClick={()=>{setUd(v=>!v);setNd(false);}}>
            <div className="ua">S</div><div className="uc-text"><div className="un">Sara Ahmed</div><div className="uid2">STU-001</div></div><Ic.ChevDown/>
          </div>
          {ud&&<div className="drop udrop"><div className="u-hd"><div className="u-av">S</div><div><div className="u-n">Sara Ahmed</div><div className="u-id">STU-001</div></div></div><div className="u-items"><button className="u-item"><Ic.User/> My Profile</button><hr className="divider"/><button className="u-item red"><Ic.Logout/> Logout</button></div></div>}
        </div>
      </div>
    </header>
  );
}