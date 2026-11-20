import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "ExpertsEarn — paid online surveys and research rewards in Rwanda";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "76px", color: "#f3eee4", background: "linear-gradient(135deg, #090a0f 0%, #17151b 58%, #302516 100%)", fontFamily: "Arial, sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 58, height: 58, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", background: "#c6a873", color: "#111116", fontSize: 30, fontWeight: 800 }}>E</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 34, fontWeight: 800 }}>ExpertsEarn</div>
            <div style={{ marginTop: 5, color: "#c6a873", fontSize: 16, letterSpacing: 4 }}>BY EXPERTSTEAM</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ color: "#c6a873", fontSize: 22, letterSpacing: 5 }}>PAID ONLINE SURVEYS IN RWANDA</div>
          <div style={{ marginTop: 22, fontSize: 66, lineHeight: 1.08, fontWeight: 700 }}>Your insight has value.</div>
          <div style={{ marginTop: 24, color: "#c8c1b6", fontSize: 27 }}>Share your opinions. Track approved rewards in RWF.</div>
        </div>
        <div style={{ color: "#9b948a", fontSize: 18 }}>expertsearn.mywire.org</div>
      </div>
    ),
    { ...size }
  );
}
