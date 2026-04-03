// ──────────────────────────────────────────────
//  styles/theme.ts
//  ألوان التطبيق والـ CSS variables
//
//  الفكرة:
//  - الـ Dark theme: خلفيات سوداء/رمادية داكنة
//    مع accent أصفر-ذهبي دافئ
//  - الـ Light theme: بيج/كريم دافئ (مش أبيض باردر)
//    مع نفس الـ accent الذهبي بس أغمق شوية
//
//  الألوان المختارة للـ Light mode:
//    --bg      #F5F0E8  بيج فاتح دافئ (خلفية الصفحة)
//    --bg2     #FFFDF7  كريم/أوف وايت (sidebar + topbar)
//    --card    #FFFDF7  كريم للكروت
//    --card2   #EDE8DC  بيج أغمق شوية للـ inner cells
//    --tx      #2C1F0E  بني داكن للنص الأساسي
//    --mu      #7A6A55  بني رمادي للنصوص الثانوية
//    --mu2     #B5A48F  بيج رمادي للـ placeholders
//    --am      #B45309  أمبر/ذهبي داكن يليق على الفاتح
// ──────────────────────────────────────────────

export const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

/* ═══════════════════════════════════════════
   DARK THEME  —  أسود / رمادي + ذهبي
   ═══════════════════════════════════════════ */
.dark-app {
  --bg:    #0d0f11;          /* خلفية الصفحة الرئيسية */
  --bg2:   #0e1114;          /* sidebar + topbar */
  --card:  #15181e;          /* الكروت */
  --card2: #1f232b;          /* الخلايا الداخلية */
  --bd:    rgba(255,255,255,.055); /* borders */
  --bd2:   rgba(255,255,255,.03);
  --tx:    #f0ede8;          /* نص أساسي (أوف وايت دافئ) */
  --mu:    #8a8680;          /* نص ثانوي */
  --mu2:   #3f3c38;          /* نص خافت جداً */
  --am:    #f9b233;          /* accent أصفر-ذهبي */
  --am-d:  rgba(249,178,51,.10);
  --am-g:  rgba(249,178,51,.22);
  --ok:    #10b981;
  --err:   #ef4444;
  --info:  #3b82f6;
}

/* ═══════════════════════════════════════════
   LIGHT THEME  —  بيج دافئ + ذهبي داكن
   ═══════════════════════════════════════════ */
.light-app {
  --bg:    #F5F0E8;          /* بيج فاتح دافئ */
  --bg2:   #FFFDF7;          /* كريم/أوف وايت */
  --card:  #FFFDF7;
  --card2: #EDE8DC;          /* بيج أغمق للخلايا */
  --bd:    rgba(44,31,14,.09);
  --bd2:   rgba(44,31,14,.05);
  --tx:    #2C1F0E;          /* بني داكن */
  --mu:    #7A6A55;          /* بني رمادي */
  --mu2:   #B5A48F;          /* بيج رمادي */
  --am:    #B45309;          /* ذهبي/برتقالي داكن */
  --am-d:  rgba(180,83,9,.09);
  --am-g:  rgba(180,83,9,.2);
  --ok:    #059669;
  --err:   #dc2626;
  --info:  #2563eb;
}

/* ═══════════════════════════════════════════
   BASE
   ═══════════════════════════════════════════ */
body {
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  background: var(--bg);
  color: var(--tx);
  transition: background .3s, color .3s;
  -webkit-font-smoothing: antialiased;
}

/* ═══════════════════════════════════════════
   LAYOUT
   ═══════════════════════════════════════════ */
.shell { display:flex; height:100vh; overflow:hidden; }

/* ─── Sidebar ─── */
.sb {
  width:240px; min-width:240px;
  background:var(--bg2);
  border-right:1px solid var(--bd);
  display:flex; flex-direction:column;
  transition:transform .3s cubic-bezier(.4,0,.2,1);
  z-index:50; flex-shrink:0;
}
@media(max-width:1023px){
  .sb { position:fixed; inset-y:0; left:0; transform:translateX(-100%); }
  .sb.open { transform:translateX(0); box-shadow:8px 0 32px rgba(0,0,0,.3); }
}
.overlay {
  position:fixed; inset:0;
  background:rgba(0,0,0,.55); backdrop-filter:blur(3px);
  z-index:40; opacity:0; pointer-events:none; transition:opacity .3s; display:none;
}
.overlay.show { opacity:1; pointer-events:auto; display:block; }

.sb-logo {
  padding:18px 20px;
  display:flex; align-items:center; gap:10px;
  border-bottom:1px solid var(--bd);
}
.logo-ic {
  width:32px; height:32px; border-radius:9px;
  background:var(--am); color:#fff;
  display:flex; align-items:center; justify-content:center;
  box-shadow:0 0 14px var(--am-g); flex-shrink:0;
}
.logo-t { font-family:'Syne',sans-serif; font-weight:800; font-size:15px; color:var(--tx); }
.logo-s { font-size:10px; color:var(--mu); margin-top:1px; letter-spacing:.04em; text-transform:uppercase; }
.sb-close {
  margin-left:auto; width:26px; height:26px; border-radius:7px;
  border:none; background:var(--bd2); color:var(--mu);
  cursor:pointer; display:none; align-items:center; justify-content:center;
}
@media(max-width:1023px){ .sb-close { display:flex; } }

.nav-wrap { flex:1; padding:14px 10px; overflow-y:auto; scrollbar-width:none; }
.nav-wrap::-webkit-scrollbar { display:none; }
.nl {
  font-size:9px; font-weight:700; color:var(--mu2);
  letter-spacing:.14em; text-transform:uppercase;
  padding:4px 8px; margin-bottom:8px;
}
.ni {
  display:flex; align-items:center; gap:10px;
  padding:9px 11px; border-radius:10px;
  font-size:13px; color:var(--mu);
  cursor:pointer; transition:all .12s;
  border:1px solid transparent; margin-bottom:2px;
  background:none; width:100%; text-align:left;
  font-family:'DM Sans',sans-serif;
}
.ni:hover { color:var(--tx); background:var(--bd); }
.ni.act {
  color:var(--am); background:var(--am-d);
  border-color:var(--am-g); font-weight:600;
}
.ni svg { flex-shrink:0; }

.sf { padding:12px 10px; border-top:1px solid var(--bd); }
.sf .ni { font-size:12px; }
.sf .ni.red { color:var(--err); }
.sf .ni.red:hover { background:rgba(239,68,68,.08); }

/* ─── Main + Topbar ─── */
.main { flex:1; display:flex; flex-direction:column; overflow:hidden; }

.tb {
  display:flex; align-items:center; justify-content:space-between;
  padding:0 24px; height:56px;
  border-bottom:1px solid var(--bd);
  background:var(--bg2); flex-shrink:0;
}
.tb-l { display:flex; align-items:center; gap:10px; }
.hb {
  width:34px; height:34px; border-radius:9px;
  border:1px solid var(--bd); background:var(--card);
  display:none; align-items:center; justify-content:center;
  cursor:pointer; color:var(--mu); transition:all .12s;
}
.hb:hover { color:var(--am); border-color:var(--am-g); }
@media(max-width:1023px){ .hb { display:flex; } }

.tb-title { font-family:'Syne',sans-serif; font-weight:700; font-size:16px; color:var(--tx); line-height:1; }
.tb-sub   { font-size:11px; color:var(--mu); margin-top:2px; }
.tb-r     { display:flex; align-items:center; gap:9px; }

.srch {
  display:flex; align-items:center; gap:7px;
  border:1px solid var(--bd); background:var(--card);
  border-radius:9px; padding:7px 13px;
}
.srch input {
  background:none; border:none; outline:none;
  font-size:12px; color:var(--tx); width:110px;
  font-family:'DM Sans',sans-serif;
}
.srch input::placeholder { color:var(--mu); }
@media(max-width:640px){ .srch { display:none; } }

.ib {
  width:34px; height:34px; border-radius:50%;
  border:1px solid var(--bd); background:var(--card);
  display:flex; align-items:center; justify-content:center;
  cursor:pointer; color:var(--mu); transition:all .12s; position:relative; flex-shrink:0;
}
.ib:hover { color:var(--am); border-color:var(--am-g); }
.ib.nb::after {
  content:'2'; position:absolute; top:-3px; right:-3px;
  background:var(--err); color:#fff; font-size:8px;
  min-width:14px; height:14px; padding:0 3px;
  border-radius:7px; display:flex; align-items:center; justify-content:center;
  border:2px solid var(--bg2); font-weight:700;
}
.uc {
  display:flex; align-items:center; gap:8px;
  border:1px solid var(--bd); background:var(--card);
  padding:3px 10px 3px 3px; border-radius:10px;
  cursor:pointer; transition:border-color .12s; flex-shrink:0;
}
.uc:hover { border-color:var(--am-g); }
.ua {
  width:28px; height:28px;
  background:linear-gradient(135deg,var(--am),#8B3E0A);
  border-radius:8px; display:flex; align-items:center; justify-content:center;
  font-family:'Syne',sans-serif; font-weight:800; font-size:11px;
  color:#fff; flex-shrink:0;
}
.un   { font-size:12px; font-weight:600; color:var(--tx); line-height:1.2; }
.uid2 { font-size:10px; color:var(--mu); }
@media(max-width:640px){ .uc-text { display:none; } }

/* ─── Dropdowns ─── */
.drop {
  position:absolute; right:0; top:calc(100% + 8px);
  background:var(--bg2); border:1px solid var(--bd);
  border-radius:14px; box-shadow:0 16px 48px rgba(0,0,0,.18);
  z-index:100; overflow:hidden;
}
.dark-app .drop { box-shadow:0 16px 48px rgba(0,0,0,.45); }
.ndrop { width:260px; }
.udrop { width:200px; }
.drop-h { padding:12px 14px; border-bottom:1px solid var(--bd); display:flex; align-items:center; justify-content:space-between; }
.drop-ht { font-size:13px; font-weight:700; color:var(--tx); }
.n-ct { font-size:9px; font-weight:700; color:var(--err); background:rgba(239,68,68,.1); border:1px solid rgba(239,68,68,.2); padding:2px 7px; border-radius:5px; }
.n-row { padding:10px 14px; border-bottom:1px solid var(--bd); display:flex; align-items:flex-start; gap:9px; cursor:pointer; transition:background .1s; }
.n-row:last-of-type { border-bottom:none; }
.n-row:hover { background:var(--bd2); }
.n-dot { width:7px; height:7px; border-radius:50%; background:var(--am); flex-shrink:0; margin-top:5px; }
.n-t  { font-size:11px; font-weight:600; color:var(--tx); margin-bottom:2px; }
.n-m  { font-size:10px; color:var(--mu); line-height:1.4; }
.n-tm { font-size:9px; color:var(--mu2); margin-top:3px; }
.drop-f { padding:8px 14px; text-align:center; cursor:pointer; font-size:11px; color:var(--am); font-weight:600; }
.u-hd { padding:12px 14px; border-bottom:1px solid var(--bd); display:flex; align-items:center; gap:10px; }
.u-av { width:36px; height:36px; background:linear-gradient(135deg,var(--am),#8B3E0A); border-radius:9px; display:flex; align-items:center; justify-content:center; font-family:'Syne',sans-serif; font-weight:800; font-size:13px; color:#fff; flex-shrink:0; }
.u-n  { font-size:12px; font-weight:700; color:var(--tx); }
.u-id { font-size:10px; color:var(--mu); }
.u-items { padding:6px; }
.u-item { display:flex; align-items:center; gap:9px; width:100%; padding:9px 10px; border-radius:9px; font-size:12px; color:var(--mu); cursor:pointer; transition:all .1s; background:none; border:none; text-align:left; font-family:'DM Sans',sans-serif; }
.u-item:hover { color:var(--tx); background:var(--bd); }
.u-item.red { color:var(--err); }
.u-item.red:hover { background:rgba(239,68,68,.08); }

/* ─── Page scroll area ─── */
.pc {
  flex:1; overflow-y:auto;
  scrollbar-width:thin; scrollbar-color:var(--bd) transparent;
}
.pc::-webkit-scrollbar { width:4px; }
.pc::-webkit-scrollbar-thumb { background:var(--bd); border-radius:4px; }

/* ═══════════════════════════════════════════
   SHARED UI COMPONENTS
   ═══════════════════════════════════════════ */

/* ─── Cards ─── */
.card {
  background:var(--card); border:1px solid var(--bd);
  border-radius:16px; transition:border-color .18s, box-shadow .18s;
}
.card:hover { border-color:var(--am-g); }
.ci { background:var(--card2); border:1px solid var(--bd2); border-radius:10px; }

/* ─── Badges ─── */
.badge {
  display:inline-flex; align-items:center; gap:4px;
  font-size:10px; font-weight:700; padding:3px 9px;
  border-radius:6px; letter-spacing:.04em; text-transform:uppercase; border:1px solid;
}
.badge-g  { background:rgba(16,185,129,.1);  color:var(--ok);   border-color:rgba(16,185,129,.2); }
.badge-r  { background:rgba(239,68,68,.1);   color:var(--err);  border-color:rgba(239,68,68,.2);  }
.badge-b  { background:rgba(59,130,246,.1);  color:var(--info); border-color:rgba(59,130,246,.2); }
.badge-a  { background:var(--am-d);          color:var(--am);   border-color:var(--am-g);         }
.badge-mu { background:var(--card2);         color:var(--mu);   border-color:var(--bd);           }

/* ─── Buttons ─── */
.btn {
  display:inline-flex; align-items:center; justify-content:center; gap:7px;
  font-size:13px; font-weight:600; padding:9px 18px; border-radius:10px;
  cursor:pointer; transition:all .15s; border:none; white-space:nowrap;
  font-family:'DM Sans',sans-serif;
}
.btn:disabled { opacity:.45; cursor:not-allowed; }
.btn-am    { background:var(--am); color:#fff; box-shadow:0 4px 14px var(--am-g); }
.btn-am:hover:not(:disabled) { filter:brightness(1.08); transform:translateY(-1px); }
.btn-ghost { background:transparent; color:var(--mu); border:1px solid var(--bd); }
.btn-ghost:hover { color:var(--tx); background:var(--card2); }
.btn-err   { background:rgba(239,68,68,.07); color:var(--err); border:1px solid rgba(239,68,68,.15); }
.btn-err:hover { background:var(--err); color:#fff; }

/* ─── Form inputs ─── */
.fi {
  width:100%; background:var(--card2); border:1px solid var(--bd);
  border-radius:10px; padding:10px 14px; font-size:13px; color:var(--tx);
  outline:none; font-family:'DM Sans',sans-serif; transition:border-color .15s;
}
.fi:focus { border-color:var(--am-g); box-shadow:0 0 0 3px var(--am-d); }
.fi::placeholder { color:var(--mu); }
.fl { font-size:10px; font-weight:700; color:var(--mu); letter-spacing:.06em; text-transform:uppercase; margin-bottom:6px; display:block; }

/* ─── Tabs ─── */
.tabs { display:flex; background:var(--card2); border:1px solid var(--bd); border-radius:12px; padding:3px; gap:2px; width:fit-content; margin-bottom:20px; }
.tab { padding:7px 16px; border-radius:9px; font-size:12px; font-weight:600; color:var(--mu); cursor:pointer; transition:all .12s; border:1px solid transparent; }
.tab.act { background:var(--card); color:var(--tx); border-color:var(--bd); box-shadow:0 1px 4px rgba(0,0,0,.08); }

/* ─── Divider ─── */
.divider { border:none; border-top:1px solid var(--bd); margin:4px 0; }
`;