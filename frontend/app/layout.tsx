import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  weight: ["400"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-instrument-serif",
});

export const metadata: Metadata = {
  title: "MeetLog — AI 회의록 플랫폼",
  description: "실시간 음성 회의를 녹음하고, AI가 요약·결정사항·할 일을 자동으로 구조화합니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={instrumentSerif.variable} data-scroll-behavior="smooth">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.css"
        />
      </head>
      <body style={{ fontFamily: "'Pretendard Variable', Pretendard, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
