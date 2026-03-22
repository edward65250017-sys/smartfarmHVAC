import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmartFarm HVAC Designer | 스마트팜 공조 설계 툴",
  description: "온실 및 수직농장 냉난방·제습 용량 정밀 산출 엔지니어링 도구",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-slate-50 antialiased">
        {children}
      </body>
    </html>
  );
}
