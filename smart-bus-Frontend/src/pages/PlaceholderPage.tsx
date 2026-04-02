// ──────────────────────────────────────────────
//  pages/PlaceholderPage.tsx
//
//  شغله إيه؟
//  بيتعرض لما الصفحة لسه مابتبنتش
//  (BookTrip, TrackBus)
// ──────────────────────────────────────────────
import { Ic } from "../icons";

export default function PlaceholderPage({ label }: { label: string }) {
  return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14,minHeight:400,textAlign:"center",padding:40 }}>
      <div style={{ width:60,height:60,borderRadius:14,border:"2px dashed var(--bd)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--mu2)" }}>
        <Ic.Grid />
      </div>
      <div style={{ fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:20,color:"var(--mu2)" }}>{label}</div>
      <div style={{ fontSize:13,color:"var(--mu2)" }}>This page is coming soon</div>
    </div>
  );
}