import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#f6f3ec",
        }}
      >
        <div style={{ display: "flex", fontSize: 132, fontWeight: 700, fontFamily: "sans-serif" }}>
          <span style={{ color: "#d97757" }}>FY</span>
          <span style={{ color: "#301a13" }}>Stay</span>
        </div>
        <div
          style={{
            marginTop: 24,
            display: "flex",
            fontSize: 34,
            fontFamily: "sans-serif",
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          <span style={{ color: "#d97757" }}>Your stay,&nbsp;</span>
          <span style={{ color: "#301a13" }}>your way</span>
        </div>
      </div>
    ),
    size,
  );
}
