
import type { Trip, Notif, AppUser } from "../types";

export const TRIPS: Trip[] = [
  { id:"1", date:"Tomorrow, Sun Feb 23", from:"Aqaleem",     to:"Stadium", pickup:"Al-Rawda Square", bus:"BUS-12", departure:"7:30 AM", returnTime:"3:30 PM", status:"upcoming",  tripId:"#9820" },
  { id:"2", date:"Mon, Feb 24",          from:"Main Campus", to:"Stadium", pickup:"City Center",     bus:"BUS-08", departure:"7:45 AM", returnTime:"3:30 PM", status:"upcoming",  tripId:"#9821" },
  { id:"3", date:"Tue, Feb 25",          from:"Aqaleem",     to:"Stadium", pickup:"Al-Rawda Square", bus:"BUS-12", departure:"7:30 AM", returnTime:"3:30 PM", status:"upcoming",  tripId:"#9822" },
  { id:"4", date:"Thu, Feb 20",          from:"Aqaleem",     to:"Stadium", pickup:"Al-Rawda Square", bus:"BUS-12", departure:"7:30 AM", returnTime:"3:30 PM", status:"completed", tripId:"#9818" },
  { id:"5", date:"Wed, Feb 19",          from:"Main Campus", to:"Stadium", pickup:"City Center",     bus:"BUS-08", departure:"7:45 AM", returnTime:"3:30 PM", status:"completed", tripId:"#9817" },
  { id:"6", date:"Wed, Feb 19",          from:"Aqaleem",     to:"Stadium", pickup:"Al-Rawda Square", bus:"BUS-08", departure:"7:30 AM", returnTime:"3:30 PM", status:"missed",    tripId:"#9815" },
  { id:"7", date:"Tue, Feb 18",          from:"Aqaleem",     to:"Stadium", pickup:"City Center",     bus:"BUS-12", departure:"7:30 AM", returnTime:"3:30 PM", status:"missed",    tripId:"#9814" },
];

export const NOTIFS: Notif[] = [
  { id:"1", title:"Registration Window Reminder", message:"Don't forget to register for tomorrow's bus. Window closes at 2:00 PM.", time:"Feb 7, 2026 · 11:00 AM", target:"All Students", readCount:892 },
  { id:"2", title:"Route Change Notice",          message:"Aqaleem route will use an alternative road due to construction. Please arrive early.", time:"Feb 6, 2026 · 4:00 PM", target:"Aqaleem Route", readCount:234 },
  { id:"3", title:"Return Trip Update",           message:"Evening return trip moved from 7:00 PM to 7:15 PM for today only.", time:"Feb 5, 2026 · 2:30 PM", target:"Evening Return", readCount:156 },
  { id:"4", title:"New Driver Assigned",          message:"Khaled Saeed has been assigned to the Seil route.", time:"Feb 4, 2026 · 9:00 AM", target:"All Drivers", readCount:6 },
];

export const USERS: AppUser[] = [
  { id:"U-001", name:"Sara Ahmed",    initials:"S", avatarColor:"bg-teal-500",   email:"sara@uni.edu",   phone:"+962 79 123 4567", role:"Student", status:"Active",   joined:"Jan 15, 2026" },
  { id:"U-002", name:"Ahmad Hassan",  initials:"A", avatarColor:"bg-amber-500",  email:"ahmad@uni.edu",  phone:"+962 79 234 5678", role:"Driver",  status:"Active",   joined:"Dec 3, 2025"  },
  { id:"U-003", name:"Lina Khalil",   initials:"L", avatarColor:"bg-emerald-500",email:"lina@uni.edu",   phone:"+962 79 345 6789", role:"Student", status:"Active",   joined:"Jan 20, 2026" },
  { id:"U-004", name:"Omar Saeed",    initials:"O", avatarColor:"bg-blue-500",   email:"omar@uni.edu",   phone:"+962 79 456 7890", role:"Driver",  status:"Active",   joined:"Nov 28, 2025" },
  { id:"U-005", name:"Rima Nasser",   initials:"R", avatarColor:"bg-purple-500", email:"rima@uni.edu",   phone:"+962 79 567 8901", role:"Student", status:"Inactive", joined:"Feb 1, 2026"  },
  { id:"U-006", name:"Khaled Saeed",  initials:"K", avatarColor:"bg-red-500",    email:"khaled@uni.edu", phone:"+962 79 678 9012", role:"Driver",  status:"Active",   joined:"Oct 10, 2025" },
  { id:"U-007", name:"Dania Haddad",  initials:"D", avatarColor:"bg-pink-500",   email:"dania@uni.edu",  phone:"+962 79 789 0123", role:"Student", status:"Active",   joined:"Jan 5, 2026"  },
  { id:"U-008", name:"Fares Mahmoud", initials:"F", avatarColor:"bg-yellow-500", email:"fares@uni.edu",  phone:"+962 79 890 1234", role:"Driver",  status:"Inactive", joined:"Sep 15, 2025" },
];


export const ROUTES = [
  { name:"Aqaleem Route",    stops:["Al-Rawda Square","City Center","University Gate A","Stadium"], bus:"BUS-12", driver:"Ahmed Hassan", time:"7:30 AM" },
  { name:"Main Campus",      stops:["City Center","New District","University Gate B","Stadium"],    bus:"BUS-08", driver:"Omar Saeed",   time:"7:45 AM" },
  { name:"Seil Route",       stops:["Seil Station","Market District","University Gate C","Stadium"],bus:"BUS-15", driver:"Khaled Saeed", time:"8:00 AM" },
];

// ─── FAQs (Support) ───────────────────────────
export const FAQS = [
  { q:"How do I register for a trip?",    a:'Go to "Book Trip", select route & time, and confirm.' },
  { q:"Can I cancel my registration?",    a:'Yes, up to 2 hours before departure via "My Trips".' },
  { q:"What are the return trip options?",a:"Hourly from 1:00 PM to 6:00 PM — book your return separately." },
  { q:"What if I miss my bus?",           a:"Your slot is marked no-show. Wait for the next bus for a walk-in seat." },
  { q:"How do I change my pickup point?", a:"Update in Account Settings, or change it per-trip during booking." },
];

export const TICKETS = [
  { id:"TKT-041", subject:"Bus didn't arrive on Feb 18",      date:"Feb 18, 2026", status:"resolved" as const },
  { id:"TKT-039", subject:"Unable to cancel my Monday booking",date:"Feb 15, 2026", status:"open"     as const },
  { id:"TKT-033", subject:"Wrong pickup point shown",          date:"Feb 10, 2026", status:"resolved" as const },
];


export const REPORT_BARS = [
  { day:"Mon", val:320, heightPct:60 },
  { day:"Tue", val:345, heightPct:65 },
  { day:"Wed", val:298, heightPct:55 },
  { day:"Thu", val:367, heightPct:80, accent:true },
  { day:"Fri", val:142, heightPct:25 },
  { day:"Sat", val:342, heightPct:64 },
  { day:"Sun", val:310, heightPct:58 },
];

export const REPORT_OCCUPANCY = [
  { day:"Mon", pct:82 }, { day:"Tue", pct:86 }, { day:"Wed", pct:79 },
  { day:"Thu", pct:91 }, { day:"Fri", pct:67 }, { day:"Sat", pct:88 }, { day:"Sun", pct:84 },
];