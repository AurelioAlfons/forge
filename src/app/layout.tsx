import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GATE_FRAME_PATH } from "@/lib/pc-sequence/config";
import { site } from "@/lib/site";
import "@/styles/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Portfolio | Aurelio Alfons",
    template: "%s | Aurelio Alfons",
  },
  description: site.description,
  openGraph: {
    title: `${site.name} — ${site.role}`,
    description: site.description,
    url: site.url,
    siteName: site.name,
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // one value now => the page is pinned dark, so browser chrome matches it
  // regardless of what the OS asks for
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* the one frame the intro waits on — start it during html parse
            instead of after hydration */}
        <link
          rel="preload"
          as="image"
          href={GATE_FRAME_PATH}
          fetchPriority="high"
        />
      </head>
      <body className="min-h-full">
        {/* keep the shell ready for the nav and the rest of the page later */}
        <div className="relative z-10 flex min-h-full flex-col">{children}</div>
      </body>
    </html>
  );
}
