import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

import { createClient } from '@supabase/supabase-js';

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

export async function generateMetadata(): Promise<Metadata> {
  let profileImageUrl = "";
  try {
    const { data: asset } = await supabaseServer
      .from("site_assets")
      .select("image_url")
      .eq("section_key", "profile")
      .single();
    if (asset?.image_url) {
      profileImageUrl = asset.image_url;
    }
  } catch (error) {
    console.error("Failed to fetch profile image for metadata", error);
  }

  // Gunakan URL default jika gagal fetch, kalau tidak pakai gambar yang ada di database
  const finalImageUrl = profileImageUrl || "https://qfchzmurgiigltdiakdj.supabase.co/storage/v1/object/public/erafone_images/default-profile.png";

  return {
    title: "Alhilal — Erafone Center Point Medan | Cicilan 0% Tanpa DP",
    description:
      "Website Resmi Alhilal, Sales Erafone Center Point Medan. Melayani cicilan 0% tanpa DP, tukar tambah HP, Indodana, Kredivo, Home Credit, Spaylater. Cukup bawa KTP!",
    keywords: [
      "Erafone",
      "Alhilal",
      "Center Point Medan",
      "cicilan HP",
      "cicilan 0%",
      "tanpa DP",
      "Kredivo",
      "Indodana",
      "Home Credit",
      "tukar tambah HP",
    ],
    icons: {
      icon: finalImageUrl,
      apple: finalImageUrl,
    },
    openGraph: {
      title: "Alhilal — Erafone Center Point Medan",
      description: "Website Resmi Alhilal. Cicilan 0% tanpa DP. Cukup bawa KTP, langsung dibantu pengajuan!",
      type: "website",
      url: "https://alhilal-erafone.com", // Ganti dengan domain asli jika ada
      siteName: "Alhilal Erafone",
      images: [
        {
          url: finalImageUrl,
          width: 800,
          height: 800,
          alt: "Foto Alhilal Erafone",
        },
      ],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${playfair.variable} ${inter.variable} antialiased`}>
      <body className="min-h-screen bg-white">{children}</body>
    </html>
  );
}
