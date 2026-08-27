import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: 7,
          border: "1.5px solid #e5e5e7",
        }}
      >
        <span
          style={{
            fontSize: 18,
            fontWeight: 700,
            fontFamily: "sans-serif",
            display: "flex",
          }}
        >
          <span style={{ color: "#14b8a6" }}>FY</span>
        </span>
      </div>
    ),
    size,
  );
}
