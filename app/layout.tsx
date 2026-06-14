import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import CartDrawer from "@/components/CartDrawer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://tabbyeggs.co.ke"),
  title: {
    default: "Tabby Premium Eggs | Grade AA Farm-Fresh Eggs in Nanyuki, Kenya",
    template: "%s | Tabby Premium Eggs",
  },
  description: "Direct-sourced, premium Grade AA eggs from Tabby Premium Eggs in Nanyuki, Kenya. Enjoy golden yolks, clean presentation, and reliable delivery for households, cafes, and business kitchens.",
  keywords: "Tabby Premium Eggs, Grade AA Eggs, Nanyuki Eggs, Kenya Fresh Eggs, Chicken Farm Nanyuki, Egg Tray Delivery Kenya, Buy Eggs Online Nanyuki",
  applicationName: "Tabby Premium Eggs",
  authors: [{ name: "Tabby Premium Eggs" }],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Tabby Premium Eggs | Grade AA Fresh Eggs",
    description: "Enjoy pasture-raised Grade AA farm-fresh eggs sourced directly from Nanyuki, Kenya. Secure your order today.",
    type: "website",
    locale: "en_KE",
    siteName: "Tabby Premium Eggs",
    url: "https://tabbyeggs.co.ke",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tabby Premium Eggs | Grade AA Fresh Eggs",
    description: "Pasture-raised Grade AA farm-fresh eggs sourced directly from Nanyuki, Kenya. Reserve your trays today.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Tabby Premium Eggs",
  description:
    "Premium Grade AA farm-fresh eggs direct from Nanyuki, Kenya. Reliable supply for households, cafes, hotels, and retail kitchens.",
  image: "https://tabbyeggs.co.ke/logo.png",
  telephone: "+254722237593",
  email: "orders@tabbyeggs.co.ke",
  priceRange: "KES",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Nanyuki",
    addressCountry: "KE",
  },
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    opens: "08:00",
    closes: "19:00",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    reviewCount: "1200",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <CartProvider>
          <CartDrawer />
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
