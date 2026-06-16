import Image from "next/image";
import ScrollReveal from "./components/ScrollReveal";
import SecretAdminTrigger from "./components/SecretAdminTrigger";
import DynamicGallery from "./components/DynamicGallery";
import { supabase } from "@/app/lib/supabase";

export const dynamic = "force-dynamic";

export default async function Home() {
  // Algoritma Retry (Maksimal 3x percobaan jika terjadi timeout/gagal jaringan)
  const fetchWithRetry = async <T,>(
    fetcher: () => Promise<{ data: T | null; error: any }>,
    retries = 3,
    delayMs = 1500
  ): Promise<{ data: T | null; error: any }> => {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetcher();
        if (!res.error) return res;
        console.warn(`[SUPABASE FETCH] Gagal (percobaan ${i + 1}/${retries}):`, res.error);
        if (i < retries - 1) await new Promise(r => setTimeout(r, delayMs));
      } catch (err) {
        console.warn(`[SUPABASE NETWORK] Error jaringan (percobaan ${i + 1}/${retries}):`, err);
        if (i < retries - 1) await new Promise(r => setTimeout(r, delayMs));
      }
    }
    return { data: null, error: 'Max retries reached' };
  };

  // Jalankan pengambilan data secara paralel (bersamaan) agar lebih cepat loadingnya
  const [assetsRes, linksRes] = await Promise.all([
    fetchWithRetry(async () => await supabase.from("site_assets").select("*")),
    fetchWithRetry(async () => await supabase.from("site_links").select("*"))
  ]);

  const assets = assetsRes.data;
  const linkData = linksRes.data;

  const getImg = (key: string, fallback: string) => {
    const asset = assets?.find((a) => a.section_key === key);
    return asset?.image_url || fallback;
  };

  const getLink = (platform: string, fallback: string) => {
    const link = linkData?.find((l) => l.platform === platform);
    return link?.url || fallback;
  };

  const waNumber = getLink("whatsapp_number", "6285234530003");
  const profileName = getLink("profile_name", "Alhilal");
  const waText = getLink("whatsapp_text", `Halo Kak ${profileName}, saya mau tanya soal HP`);
  const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(waText)}`;
  const siteDesc = getLink("description", "Melayani cicilan 0% tanpa DP, tukar tambah, dan pengiriman ke rumah. Langsung dibantu dari toko!");

  const profileColor = getLink("profile_color", "red");
  const showBorder = getLink("show_border", "true") === "true";
  const borderColor = getLink("border_color", "gray");

  const titleColorClass = profileColor === "black" ? "text-slate-900" : "text-erafone";
  const cardBorderClass = showBorder 
    ? (borderColor === "red" ? "!border-2 !border-erafone" : "!border !border-gray-200") 
    : "!border-0 !shadow-none";
    
  const profileRingClass = showBorder 
    ? (borderColor === "red" ? "profile-ring" : "profile-ring-gray") 
    : "rounded-full";

  // Group Dynamic Pricelist Images
  const pricelistImages = assets?.filter(a => a.section_key.startsWith("pricelist_") && !a.image_url.startsWith("/")).sort((a, b) => a.updated_at.localeCompare(b.updated_at)).map(a => ({ id: a.section_key, url: a.image_url })) || [];
  const oldPricelist = assets?.find(a => a.section_key === "pricelist" && !a.image_url.startsWith("/"));
  if (oldPricelist && !pricelistImages.find(p => p.id === "pricelist")) {
    pricelistImages.unshift({ id: "pricelist", url: oldPricelist.image_url });
  }

  // Group Dynamic Gallery Images
  const galleryImages = assets?.filter(a => a.section_key.startsWith("gallery_") && !a.image_url.startsWith("/")).sort((a, b) => a.updated_at.localeCompare(b.updated_at)).map(a => ({ id: a.section_key, url: a.image_url })) || [];
  const oldGalleries = assets?.filter(a => ["gallery_1", "gallery_2", "gallery_3", "gallery_4"].includes(a.section_key) && !a.image_url.startsWith("/"));
  oldGalleries?.forEach(og => {
    if (!galleryImages.find(g => g.id === og.section_key)) {
      galleryImages.push({ id: og.section_key, url: og.image_url });
    }
  });

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-lg mx-auto px-5 py-8 flex flex-col gap-8">
        {/* ══════════════════════════════
            HERO: Profile
           ══════════════════════════════ */}
        <section id="hero" className="flex flex-col items-center">
          <ScrollReveal delay={1}>
            <div className={profileRingClass}>
              <div className={`relative w-40 h-40 sm:w-40 sm:h-40 rounded-full overflow-hidden bg-gray-100 ${cardBorderClass}`}>
                {getImg("profile", "") ? (
                  <img
                    src={getImg("profile", "")}
                    alt={`Foto profil ${profileName} — Sales Erafone Center Point Medan`}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                )}
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={2}>
            <h1 className={`font-serif text-4xl sm:text-5xl font-bold mt-5 tracking-tight ${titleColorClass}`}>
              {profileName}
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={3}>
            <div className="flex items-center gap-3 mt-2">
              <span className="w-8 h-px bg-erafone-200" />
              <span className="font-sans text-[0.7rem] font-semibold tracking-[0.2em] uppercase text-gray-400">
                Erafone Gadget Advisor
              </span>
              <span className="w-8 h-px bg-erafone-200" />
            </div>
          </ScrollReveal>

          <ScrollReveal delay={4}>
            <p className="text-center text-gray-500 text-[0.95rem] leading-relaxed mt-4 max-w-xs whitespace-pre-line">
              {siteDesc}
            </p>
          </ScrollReveal>

          {/* Social Links */}
          <ScrollReveal delay={5}>
            <div className="flex items-center gap-3 mt-4">
              <a href={getLink("instagram", "https://instagram.com/")} target="_blank" rel="noopener noreferrer" aria-label={`Instagram ${profileName}`} id="instagram-link" className="cursor-pointer w-10 h-10 rounded-xl border border-gray-100 flex items-center justify-center text-gray-400 hover:text-erafone hover:border-erafone-200 transition-all duration-200 hover:-translate-y-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
              </a>
              <a href={getLink("tiktok", "https://tiktok.com/")} target="_blank" rel="noopener noreferrer" aria-label={`TikTok ${profileName}`} id="tiktok-link" className="cursor-pointer w-10 h-10 rounded-xl border border-gray-100 flex items-center justify-center text-gray-400 hover:text-erafone hover:border-erafone-200 transition-all duration-200 hover:-translate-y-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.71a8.2 8.2 0 0 0 4.76 1.52V6.79a4.84 4.84 0 0 1-1-.1z"/></svg>
              </a>
            </div>
          </ScrollReveal>
        </section>

        {/* ══════════════════════════════
            WHATSAPP CTA
           ══════════════════════════════ */}
        <section id="cta-wa">
          <ScrollReveal delay={6}>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              id="whatsapp-button"
              className="cursor-pointer wa-btn group flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-wa text-white font-sans font-semibold text-base sm:text-lg tracking-wide hover:bg-wa-hover transition-all duration-300 active:scale-[0.98]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="transition-transform duration-300 group-hover:scale-110"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
              Chat WhatsApp
            </a>
          </ScrollReveal>
        </section>

        <div className="red-line" />

        {/* ══════════════════════════════
            CICILAN 0% TANPA DP
           ══════════════════════════════ */}
        <section id="cicilan-highlight">
          <ScrollReveal delay={1}>
            <div className={`era-card era-accent rounded-2xl p-5 sm:p-6 text-center ${cardBorderClass}`}>
              <div className="inline-flex items-center gap-2 bg-erafone-50 text-erafone font-bold text-sm px-4 py-1.5 rounded-full mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                PROMO SPESIAL
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-erafone">
                Cicilan 0%
              </h2>
              <p className="text-2xl font-bold text-gray-800 mt-1">Tanpa DP</p>
              <p className="text-gray-400 text-sm mt-2">Usia 19 – 65 tahun</p>
            </div>
          </ScrollReveal>
        </section>

        {/* ══════════════════════════════
            PRICE LIST BANNER
           ══════════════════════════════ */}
        {pricelistImages.length > 0 && (
          <section id="pricelist">
            <ScrollReveal delay={2}>
              <div className="sec-label mb-3">Price List</div>
              <DynamicGallery images={pricelistImages} isPricelist={true} cardBorderClass={cardBorderClass} />
            </ScrollReveal>
          </section>
        )}

        {/* ══════════════════════════════
            GALERI TOKO
           ══════════════════════════════ */}
        {galleryImages.length > 0 && (
          <section id="galeri">
            <ScrollReveal delay={3}>
              <div className="sec-label mb-3">Galeri Toko</div>
              <DynamicGallery images={galleryImages} isPricelist={false} cardBorderClass={cardBorderClass} />
            </ScrollReveal>
          </section>
        )}

        <div className="red-line" />

        {/* ══════════════════════════════
            LOKASI TOKO
           ══════════════════════════════ */}
        <section id="lokasi">
          <ScrollReveal delay={1}>
            <div className="sec-label mb-3">Lokasi Toko</div>
            <div className={`era-card rounded-2xl p-5 sm:p-6 ${cardBorderClass}`}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-erafone-50 flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-erafone"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <div>
                  <p className="font-serif text-lg font-semibold text-gray-900">Erafone Center Point Medan</p>
                  <p className="text-sm text-gray-500 mt-1">Lantai LG (lantai dasar), depan Coffee Crown</p>
                </div>
              </div>

              <div className="flex items-start gap-4 mt-4">
                <div className="w-10 h-10 rounded-xl bg-erafone-50 flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-erafone"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <div>
                  <p className="font-sans text-sm font-semibold text-gray-900">Jam Operasional</p>
                  <p className="text-sm text-gray-500 mt-0.5">11.00 siang – 21.00 malam</p>
                  <p className="text-xs text-gray-400 mt-1">Mau datang? Janjian dulu supaya bisa dibantu langsung!</p>
                </div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={2}>
            {/* Google Maps Embed */}
            <div className={`mt-4 rounded-2xl overflow-hidden era-card group ${cardBorderClass}`} style={{ height: "260px" }}>
              <div className="w-full h-full relative">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3981.9816843006774!2d98.6810665!3d3.5916749!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x30312d4395555543%3A0x94b1558aa3d33d68!2sErafone%20Center%20Point%20Medan!5e0!3m2!1sid!2sid!4v1781594005115!5m2!1sid!2sid"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Lokasi Erafone Center Point Medan"
                ></iframe>
              </div>
            </div>
            <a
              href="https://maps.app.goo.gl/wsNcR3ivUyxHVAMg9"
              target="_blank"
              rel="noopener noreferrer"
              id="maps-link"
              className="cursor-pointer flex items-center justify-center gap-2 w-full mt-3 py-3 rounded-xl border border-erafone-200 text-erafone font-medium text-sm hover:bg-erafone-50 transition-colors duration-200 active:scale-[0.98]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>
              Buka di Google Maps
            </a>
          </ScrollReveal>
        </section>

        <div className="red-line" />

        {/* ══════════════════════════════
            SYARAT PENGAJUAN CICILAN
           ══════════════════════════════ */}
        <section id="cicilan-syarat">
          <ScrollReveal delay={1}>
            <div className="sec-label mb-3">Syarat Pengajuan Cicilan</div>
          </ScrollReveal>

          <div className="flex flex-col gap-4">
            {/* Card 1: KTP Fisik */}
            <ScrollReveal delay={2}>
              <div className="era-card rounded-2xl p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-erafone-50 flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-erafone"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 7h10"/><path d="M7 12h10"/><path d="M7 17h6"/></svg>
                </div>
                <div>
                  <h3 className="font-sans text-sm font-bold text-gray-900">1. Bawa KTP Fisik ke Toko</h3>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                    Cukup bawa KTP asli langsung ke toko. Nanti dibantu cek limit. Sekalian dibantu simulasi cicilan juga!
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Card 2: Usia */}
            <ScrollReveal delay={3}>
              <div className="era-card rounded-2xl p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <div>
                  <h3 className="font-sans text-sm font-bold text-gray-900">2. Usia 19 – 65 Tahun</h3>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                    Pastikan usia kamu memenuhi syarat untuk mengajukan cicilan dari partner pembiayaan.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Card 3: Partners */}
            <ScrollReveal delay={4}>
              <div className="era-card rounded-2xl p-4">
                <h3 className="font-sans text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  Pilihan Pembiayaan
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "indodana", src: "/assets/indodana.png", alt: "Indodana", imgClass: "scale-[2.6]" },
                    { id: "kredivo", src: "/assets/kredivo.png", alt: "Kredivo", imgClass: "scale-[1.1]" },
                    { id: "homecredit", src: "/assets/homecredit.png", alt: "Home Credit", imgClass: "scale-[1.4]" },
                    { id: "spaylater", src: "/assets/spaylater.webp", alt: "SPayLater", imgClass: "scale-[1.4]" },
                  ].map((p) => (
                    <div key={p.id} className="flex items-center justify-center p-3 rounded-xl border border-gray-100 bg-white hover:border-erafone-200 hover:shadow-sm transition-all duration-200">
                      <div className="relative w-full h-8">
                        <Image
                          src={p.src}
                          alt={p.alt}
                          fill
                          className={`object-contain ${p.imgClass || ""}`}
                          sizes="(max-width: 512px) 25vw, 128px"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            {/* Card 4: Tips */}
            <ScrollReveal delay={5}>
              <div className="era-card rounded-2xl p-4 bg-blue-50/50 border-blue-100 flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                <p className="text-xs text-blue-800 leading-relaxed">
                  <strong>Tips Penting:</strong> Disarankan langsung datang ke toko untuk pengecekan. Jangan cek limit sendiri dari rumah agar proses pengajuan bisa dibantu tim sales kami hingga ACC.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ══════════════════════════════
            LAYANAN
           ══════════════════════════════ */}
        <section id="layanan">
          <ScrollReveal delay={1}>
            <div className="sec-label mb-3">Layanan Spesial</div>
          </ScrollReveal>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Tukar Tambah", icon: "M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" },
              { label: "Cicilan 0%", icon: "M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" },
            ].map((svc, i) => (
              <ScrollReveal delay={i + 2} key={i}>
                <div className="era-card flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl cursor-default hover:-translate-y-1 transition-all duration-300 h-full">
                  <div className="w-10 h-10 rounded-xl bg-erafone-50 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-erafone"><path d={svc.icon} /></svg>
                  </div>
                  <span className="text-xs font-medium text-gray-600 text-center leading-tight">{svc.label}</span>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>

        <div className="red-line" />

        {/* ══════════════════════════════
            BOTTOM CTA
           ══════════════════════════════ */}
        <section id="cta-bottom">
          <ScrollReveal delay={1}>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              id="whatsapp-button-bottom"
              className="cursor-pointer wa-btn group flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-wa text-white font-sans font-semibold text-base tracking-wide hover:bg-wa-hover transition-all duration-300 active:scale-[0.98]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="transition-transform duration-300 group-hover:scale-110"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
              Hubungi Sekarang
            </a>
          </ScrollReveal>
        </section>

        {/* ── Footer (Secret Admin Link - 5 Clicks) ── */}
        <ScrollReveal delay={2}>
          <footer className="text-center pt-4 pb-6">
            <SecretAdminTrigger>
              <p className="font-serif text-sm text-gray-600">
                &copy; 2026 {profileName}
              </p>
            </SecretAdminTrigger>
            <p className="text-[0.6rem] text-gray-600 mt-1 tracking-wider uppercase">Erafone Center Point Medan</p>
          </footer>
        </ScrollReveal>
      </main>
    </div>
  );
}
