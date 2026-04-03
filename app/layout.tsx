import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "omni-discord | Investment Intelligence",
  description:
    "AI-powered daily investment signals and summaries scraped from Discord communities.",
  keywords: ["investment", "discord", "AI", "signals", "finance", "stocks", "crypto"],
  openGraph: {
    title: "omni-discord | Investment Intelligence",
    description: "Daily AI investment summaries from Discord communities.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <nav className="nav">
          <div className="nav-inner">
            <a href="/" className="nav-brand">
              <span className="nav-logo">⌬</span>
              <span>omni-discord</span>
            </a>
            <div className="nav-links">
              <a href="/" className="nav-link">Dashboard</a>
              <a href="/history" className="nav-link">History</a>
              <a href="/channels" className="nav-link">Channels</a>
            </div>
          </div>
        </nav>
        <main className="main-content">{children}</main>
        <footer className="footer">
          <p>omni-discord · AI investment intelligence · Generated daily at 6AM PST</p>
          <p className="footer-disclaimer">
            ⚠️ This is not financial advice. All signals are AI-generated from community discussions.
          </p>
        </footer>
      </body>
    </html>
  );
}
