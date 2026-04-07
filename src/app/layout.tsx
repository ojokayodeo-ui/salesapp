import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Revenue OS — All-in-One Sales System",
    template: "%s | Revenue OS",
  },
  description: "Capture leads, track deals, automate follow-ups, and close more sales.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
