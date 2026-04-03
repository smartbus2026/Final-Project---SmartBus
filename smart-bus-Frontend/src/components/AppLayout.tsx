// ──────────────────────────────────────────────
//  components/AppLayout.tsx
//
//  شغله إيه؟
//  - الـ wrapper الرئيسي اللي بيجمع Sidebar + Topbar
//  - بيحقن الـ CSS global (ألوان + layout + components)
//  - بيمسك state الـ sidebar (مفتوح/مقفول على موبايل)
//  - الـ children = محتوى الصفحة اللي بيتغير
// ──────────────────────────────────────────────
import { useState } from "react";
import type { Page, Theme } from "../types";
import { GLOBAL_CSS } from "../styles/theme";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

interface Props {
  page: Page;
  setPage: (p: Page) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  children: React.ReactNode;
}

export default function AppLayout({ page, setPage, theme, setTheme, children }: Props) {
  const [sbOpen, setSbOpen] = useState(false);

  return (
    <>
      {/* CSS global مرة واحدة على مستوى التطبيق كله */}
      <style>{GLOBAL_CSS}</style>

      {/* الـ class dark-app أو light-app بيغيّر كل الـ CSS variables */}
      <div className={theme === "dark" ? "dark-app" : "light-app"}>
        <div className="shell">
          <Sidebar page={page} setPage={setPage} open={sbOpen} setOpen={setSbOpen} />
          <div className="main">
            <Topbar page={page} theme={theme} setTheme={setTheme} onMenu={() => setSbOpen(true)} />
            {/* الـ .pc هو الـ scroll container بتاع المحتوى */}
            <div className="pc">
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}