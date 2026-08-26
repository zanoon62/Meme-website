import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Cairo, Playfair_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { StoreProvider } from "@/components/providers/store-provider";
import { SiteShell } from "@/components/layout/site-shell";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // Prevents auto-zooming on inputs in iOS and maintains rigid mobile app-like layout
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0c" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "MEME — Premium Streetwear & Tailored Essentials · Egypt",
    template: "%s — MEME Egypt",
  },
  description:
    "MEME is Egypt's premium fashion house — top brands, one store. Discover Zara, H&M, Lacoste, Adidas, Hugo Boss & more, plus our atelier-tailored essentials. Fast shipping across Egypt, Cash on Delivery available.",
  keywords: [
    "MEME",
    "Egypt fashion",
    "Cairo clothing",
    "premium streetwear Egypt",
    "Zara Egypt",
    "H&M Egypt",
    "Lacoste Egypt",
    "Adidas Egypt",
    "Hugo Boss Egypt",
    "suited by meme",
    "cash on delivery Egypt",
    "EGP fashion",
  ],
  authors: [{ name: "MEME" }],
  metadataBase: new URL("https://meme-eg.store"),
  alternates: { canonical: "/" },
  openGraph: {
    title: "MEME — Premium Streetwear & Tailored Essentials · Egypt",
    description:
      "Top brands, one store. Zara, H&M, Lacoste, Adidas & more — shipped fast across Egypt. Cash on Delivery available.",
    siteName: "MEME",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "MEME — Premium Streetwear & Tailored Essentials · Egypt",
    description:
      "Top brands, one store. Shipped fast across Egypt. Cash on Delivery available.",
  },
  icons: {
    icon: [
      { url: "/logo.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: ["/logo.svg"],
    apple: [{ url: "/logo.svg" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${plusJakarta.variable} ${cairo.variable} ${playfair.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans antialiased bg-background text-foreground min-h-screen flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange={false}
        >
          <StoreProvider>
            <SiteShell>{children}</SiteShell>
            <Toaster />
            <SonnerToaster position="bottom-right" richColors />
          </StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
