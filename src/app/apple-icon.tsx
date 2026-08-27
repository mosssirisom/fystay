import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
        }}
      >
        <span
          style={{
            fontSize: 92,
            fontWeight: 700,
            fontFamily: "sans-serif",
            display: "flex",
          }}
        >
          <span style={{ color: "#14b8a6" }}>fy</span>
        </span>
      </div>
    ),
    size,
  );
}
