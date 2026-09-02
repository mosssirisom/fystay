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
          background: "#ffffff",
        }}
      >
        <div style={{ display: "flex", fontSize: 132, fontWeight: 700, fontFamily: "sans-serif" }}>
          <span style={{ color: "#14b8a6" }}>FY</span>
          <span style={{ color: "#142a3d" }}>Stay</span>
        </div>
        <div style={{ marginTop: 24, display: "flex", fontSize: 34, fontFamily: "sans-serif" }}>
          <span style={{ color: "#14b8a6" }}>Your stay.&nbsp;</span>
          <span style={{ color: "#142a3d" }}>Your way.</span>
        </div>
      </div>
    ),
    size,
  );
}
