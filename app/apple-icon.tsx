import { ImageResponse } from "next/og";

// iOS does not support SVG touch icons, so the apple-touch-icon is generated
// as a PNG from the same Proscene mark used by the SVG icons.
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
          background: "#28231f",
          color: "#fbf8f3",
          fontSize: 128,
          fontWeight: 600,
          fontStyle: "italic",
        }}
      >
        P
      </div>
    ),
    size,
  );
}
