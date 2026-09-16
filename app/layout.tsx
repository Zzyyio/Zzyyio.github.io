import type { Metadata } from "next";
import { PortfolioFrame } from "@/components/portfolio-frame";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "LIN — 设计与摄影",
    template: "%s — LIN",
  },
  description: "独立设计师与摄影师的个人作品集，包含简介、摄影作品与项目。",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <PortfolioFrame>{children}</PortfolioFrame>
      </body>
    </html>
  );
}
