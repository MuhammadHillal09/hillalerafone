"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/app/lib/supabase";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [assets, setAssets] = useState<any[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);

  const [links, setLinks] = useState<any[]>([]);
  const [editingLinks, setEditingLinks] = useState<Record<string, string>>({});
  const [savingLink, setSavingLink] = useState<string | null>(null);
  const [linkErrors, setLinkErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session) fetchAssets();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchAssets();
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchAssets = async () => {
    const { data: assetData, error: assetErr } = await supabase
      .from("site_assets")
      .select("*")
      .order("updated_at", { ascending: true });
    
    if (assetData) setAssets(assetData);
    if (assetErr) console.error("Error fetching assets:", assetErr);

    const { data: linkData, error: linkErr } = await supabase
      .from("site_links")
      .select("*");
    
    if (linkData) {
      setLinks(linkData);
      const initialEdits: Record<string, string> = {};
      linkData.forEach(l => initialEdits[l.platform] = l.url);
      setEditingLinks(initialEdits);
    }
    if (linkErr) console.error("Error fetching links:", linkErr);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const validateLink = (platform: string, value: string) => {
    if (platform === 'whatsapp_number') {
      if (value.startsWith('08')) return "Gunakan awalan 62, bukan 08";
      if (!value.startsWith('62')) return "Wajib diawali dengan 62";
      if (value.length < 9) return "Nomor terlalu pendek (min 9 angka)";
      if (!/^\d+$/.test(value)) return "Hanya boleh berisi angka";
    }
    if (platform === 'instagram' || platform === 'tiktok') {
      if (value && !value.includes('https://')) return "Wajib menggunakan https://";
    }
    return null;
  };

  const handleLinkChange = (platform: string, value: string) => {
    setEditingLinks(prev => ({...prev, [platform]: value}));
    
    const error = validateLink(platform, value);
    if (error) {
      setLinkErrors(prev => ({...prev, [platform]: error}));
    } else {
      setLinkErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[platform];
        return newErrors;
      });
    }
  };

  const handleLinkSave = async (platform: string) => {
    if (linkErrors[platform]) return; // Block save if error

    try {
      setSavingLink(platform);
      const { error } = await supabase
        .from('site_links')
        .upsert({ platform, url: editingLinks[platform] }, { onConflict: 'platform' });
      if (error) throw error;
      alert(`Berhasil disimpan!`);
      fetchAssets();
    } catch(err: any) {
      alert("Gagal menyimpan: " + err.message);
    } finally {
      setSavingLink(null);
    }
  };

  const autoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>, prefix: string, isNew: boolean = false, existingKey?: string) => {
    try {
      const sectionKey = isNew ? `${prefix}_${Date.now()}` : (existingKey || prefix);
      setUploading(sectionKey);

      if (!event.target.files || event.target.files.length === 0) return;

      if (!isNew) {
        const existingAsset = assets.find(a => a.section_key === sectionKey);
        if (existingAsset && existingAsset.image_url) {
           const urlParts = existingAsset.image_url.split('/');
           const oldFileName = urlParts[urlParts.length - 1];
           if (existingAsset.image_url.includes('supabase.co')) {
             await supabase.storage.from('erafone_images').remove([oldFileName]);
           }
        }
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${sectionKey}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('erafone_images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('erafone_images')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('site_assets')
        .upsert({ 
          section_key: sectionKey, 
          image_url: publicUrlData.publicUrl,
          updated_at: new Date().toISOString()
        }, { onConflict: 'section_key' });

      if (updateError) throw updateError;

      fetchAssets();
    } catch (error: any) {
      alert('Gagal mengupload gambar: ' + error.message);
    } finally {
      setUploading(null);
    }
  };

  const handleDelete = async (sectionKey: string, imageUrl: string) => {
    if(!confirm("Yakin ingin menghapus gambar ini?")) return;
    try {
      setUploading(sectionKey);
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      
      // Hapus dari storage (ignore error if file already gone)
      await supabase.storage.from('erafone_images').remove([fileName]);
      
      // Hapus dari database dan tangkap errornya
      const { error: dbError } = await supabase.from('site_assets').delete().eq('section_key', sectionKey);
      
      if (dbError) {
        throw new Error(`DB Error: ${dbError.message}`);
      }
      
      // Paksa fetch data terbaru
      await fetchAssets();
    } catch(err: any) {
      alert("Gagal menghapus data: " + err.message);
      console.error(err);
    } finally {
      setUploading(null);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin w-8 h-8 border-4 border-erafone border-t-transparent rounded-full"></div></div>;
  
  if (!session) {
    // Should be handled by middleware, but fallback just in case
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><p className="text-gray-500">Mengarahkan ke login...</p></div>;
  }

  const profileAsset = assets.find(a => a.section_key === 'profile');
  const galleryAssets = assets.filter(a => a.section_key.startsWith('gallery_'));
  const pricelistAssets = assets.filter(a => a.section_key.startsWith('pricelist_'));

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return "Selamat pagi";
    if (hour < 15) return "Selamat siang";
    if (hour < 18) return "Selamat sore";
    return "Selamat malam";
  };
  
  // Ambil nama profil dari database, jika belum di-set gunakan default 'Admin'
  const savedProfileName = links.find(l => l.platform === 'profile_name')?.url || "Admin";

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans text-slate-800">
      {/* FLOATING NAVBAR (Glassmorphism) */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Dashboard</h1>
            <p className="text-sm text-slate-500 font-medium mt-0.5">{getGreeting()}, {savedProfileName}!</p>
          </div>
          <div className="flex gap-3">
            <a href="/" className="text-sm text-erafone hover:text-erafone-hover font-semibold px-4 py-2 bg-red-50 hover:bg-red-100 rounded-xl transition-colors flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              <span className="hidden sm:inline">Halaman Utama</span>
            </a>
            <button onClick={handleLogout} className="text-sm text-slate-600 hover:text-slate-900 font-semibold px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto mt-8 px-4 flex flex-col gap-10">
        
        {/* PENGATURAN TEKS & KONTAK */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <h2 className="text-lg font-bold text-slate-900">Pengaturan Teks & Kontak</h2>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 grid gap-8">
            
            {/* Profile Name */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">Nama Profil (Tampil di bawah Foto & Label Chat WA)</label>
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <input 
                  type="text" 
                  value={editingLinks['profile_name'] || ""}
                  onChange={(e) => handleLinkChange('profile_name', e.target.value)}
                  placeholder="Misal: Alhilal / Pak Hilal / Alhilal Erafone"
                  className="flex-1 w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-erafone focus:ring-1 focus:ring-erafone bg-slate-50 focus:bg-white transition-colors"
                />
                <button 
                  onClick={() => handleLinkSave('profile_name')}
                  disabled={savingLink === 'profile_name'}
                  className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 sm:w-28 text-center"
                >
                  {savingLink === 'profile_name' ? "..." : "Simpan"}
                </button>
              </div>
            </div>

            <div className="h-px bg-slate-100 w-full" />

            {/* Description */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">Deskripsi Website (di bawah foto profil)</label>
              <div className="flex flex-col sm:flex-row gap-3 items-start">
                <textarea 
                  value={editingLinks['description'] || ""}
                  onChange={(e) => { handleLinkChange('description', e.target.value); autoResize(e); }}
                  placeholder="Melayani cicilan 0% tanpa DP..."
                  rows={2}
                  className="flex-1 w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-erafone focus:ring-1 focus:ring-erafone resize-none bg-slate-50 focus:bg-white transition-colors overflow-hidden"
                />
                <button 
                  onClick={() => handleLinkSave('description')}
                  disabled={savingLink === 'description'}
                  className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 sm:w-28 text-center h-17"
                >
                  {savingLink === 'description' ? "..." : "Simpan"}
                </button>
              </div>
            </div>

            <div className="h-px bg-slate-100 w-full" />

            {/* WhatsApp */}
            <div className="flex flex-col gap-4">
              <label className="text-sm font-semibold text-slate-700">WhatsApp Admin</label>
              
              {/* WA Number */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <span className="sm:w-36 text-sm font-medium text-slate-500">Nomor HP</span>
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    value={editingLinks['whatsapp_number'] || ""}
                    onChange={(e) => handleLinkChange('whatsapp_number', e.target.value)}
                    placeholder="6285234530003"
                    className={`w-full px-4 py-2 text-sm border rounded-xl focus:outline-none focus:ring-1 bg-slate-50 focus:bg-white transition-colors ${linkErrors['whatsapp_number'] ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:border-erafone focus:ring-erafone'}`}
                  />
                  {linkErrors['whatsapp_number'] && <p className="absolute -bottom-5 left-1 text-[11px] text-red-500 font-medium">{linkErrors['whatsapp_number']}</p>}
                </div>
                <button 
                  onClick={() => handleLinkSave('whatsapp_number')}
                  disabled={savingLink === 'whatsapp_number' || !!linkErrors['whatsapp_number']}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 sm:w-28 text-center mt-4 sm:mt-0"
                >
                  {savingLink === 'whatsapp_number' ? "..." : "Simpan"}
                </button>
              </div>

              {/* WA Text */}
              <div className="flex flex-col sm:flex-row sm:items-start gap-3 mt-2 sm:mt-0">
                <span className="sm:w-36 text-sm font-medium text-slate-500 pt-3">Teks Template</span>
                <textarea 
                  value={editingLinks['whatsapp_text'] || ""}
                  onChange={(e) => { handleLinkChange('whatsapp_text', e.target.value); autoResize(e); }}
                  placeholder="Halo Kak Alhilal..."
                  rows={2}
                  className="flex-1 px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-erafone focus:ring-1 focus:ring-erafone resize-none bg-slate-50 focus:bg-white transition-colors overflow-hidden min-h-11.5"
                />
                <button 
                  onClick={() => handleLinkSave('whatsapp_text')}
                  disabled={savingLink === 'whatsapp_text'}
                  className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 sm:w-28 text-center h-17"
                >
                  {savingLink === 'whatsapp_text' ? "..." : "Simpan"}
                </button>
              </div>
            </div>

            <div className="h-px bg-slate-100 w-full" />

            {/* IG & TikTok */}
            {['instagram', 'tiktok'].map(platform => (
              <div key={platform} className="flex flex-col sm:flex-row sm:items-center gap-3">
                <label className="sm:w-36 text-sm font-semibold text-slate-700 capitalize">Link {platform}</label>
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    value={editingLinks[platform] || ""}
                    onChange={(e) => handleLinkChange(platform, e.target.value)}
                    placeholder={`https://${platform}.com/...`}
                    className={`w-full px-4 py-2 text-sm border rounded-xl focus:outline-none focus:ring-1 bg-slate-50 focus:bg-white transition-colors ${linkErrors[platform] ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:border-erafone focus:ring-erafone'}`}
                  />
                  {linkErrors[platform] && <p className="absolute -bottom-5 left-1 text-[11px] text-red-500 font-medium">{linkErrors[platform]}</p>}
                </div>
                <button 
                  onClick={() => handleLinkSave(platform)}
                  disabled={savingLink === platform || !!linkErrors[platform]}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 sm:w-28 text-center mt-4 sm:mt-0"
                >
                  {savingLink === platform ? "..." : "Simpan"}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* PENGATURAN TAMPILAN */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 2-5.5 3.5 12.5 7-7 4.5-10-6.5L12 2Z"/><path d="m22 9.5-3 1.5"/><path d="M2 9.5 5 11"/><path d="m12 22-5.5-3.5 12.5-7"/></svg>
            </div>
            <h2 className="text-lg font-bold text-slate-900">Pengaturan Tampilan</h2>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 grid gap-6 md:grid-cols-3">
            
            {/* Warna Nama Profil */}
            <div className="flex flex-col gap-3">
              <label className="text-sm font-semibold text-slate-700">Warna Nama Profil Utama</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="profile_color" value="red" checked={(editingLinks['profile_color'] || 'red') === 'red'} onChange={(e) => handleLinkChange('profile_color', e.target.value)} className="w-4 h-4 text-erafone focus:ring-erafone" />
                  <span className="text-sm font-medium text-slate-700">Merah</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="profile_color" value="black" checked={editingLinks['profile_color'] === 'black'} onChange={(e) => handleLinkChange('profile_color', e.target.value)} className="w-4 h-4 text-erafone focus:ring-erafone" />
                  <span className="text-sm font-medium text-slate-700">Hitam</span>
                </label>
              </div>
              <button onClick={() => handleLinkSave('profile_color')} disabled={savingLink === 'profile_color'} className="mt-2 w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors">
                {savingLink === 'profile_color' ? "Menyimpan..." : "Simpan Warna"}
              </button>
            </div>

            {/* Tampilkan Border */}
            <div className="flex flex-col gap-3">
              <label className="text-sm font-semibold text-slate-700">Tampilkan Border Foto & Card</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="show_border" value="true" checked={(editingLinks['show_border'] || 'true') === 'true'} onChange={(e) => handleLinkChange('show_border', e.target.value)} className="w-4 h-4 text-erafone focus:ring-erafone" />
                  <span className="text-sm font-medium text-slate-700">Ya</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="show_border" value="false" checked={editingLinks['show_border'] === 'false'} onChange={(e) => handleLinkChange('show_border', e.target.value)} className="w-4 h-4 text-erafone focus:ring-erafone" />
                  <span className="text-sm font-medium text-slate-700">Tidak</span>
                </label>
              </div>
              <button onClick={() => handleLinkSave('show_border')} disabled={savingLink === 'show_border'} className="mt-2 w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors">
                {savingLink === 'show_border' ? "Menyimpan..." : "Simpan Border"}
              </button>
            </div>

            {/* Warna Border */}
            <div className="flex flex-col gap-3">
              <label className="text-sm font-semibold text-slate-700">Warna Border (Jika Ditampilkan)</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="border_color" value="gray" checked={(editingLinks['border_color'] || 'gray') === 'gray'} onChange={(e) => handleLinkChange('border_color', e.target.value)} className="w-4 h-4 text-erafone focus:ring-erafone" />
                  <span className="text-sm font-medium text-slate-700">Abu-abu</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="border_color" value="red" checked={editingLinks['border_color'] === 'red'} onChange={(e) => handleLinkChange('border_color', e.target.value)} className="w-4 h-4 text-erafone focus:ring-erafone" />
                  <span className="text-sm font-medium text-slate-700">Merah</span>
                </label>
              </div>
              <button onClick={() => handleLinkSave('border_color')} disabled={savingLink === 'border_color'} className="mt-2 w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors">
                {savingLink === 'border_color' ? "Menyimpan..." : "Simpan Warna Border"}
              </button>
            </div>

          </div>
        </section>

        {/* GAMBAR SECTION */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
            </div>
            <h2 className="text-lg font-bold text-slate-900">Manajemen Visual</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* PROFILE */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Foto Profil Utama</h3>
              <div className="relative w-full aspect-square bg-slate-100 rounded-xl mb-4 overflow-hidden flex items-center justify-center border border-slate-200">
                {profileAsset ? <img src={profileAsset.image_url} alt="Profile" className="object-cover w-full h-full" /> : <span className="text-slate-400 text-sm">Belum ada foto</span>}
              </div>
              <input type="file" accept="image/*" onChange={(e) => handleUpload(e, 'profile')} disabled={uploading === 'profile'} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer disabled:opacity-50" />
            </div>

            {/* PRICELIST */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:col-span-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-700">Price List / Banner Promo</h3>
                  <p className="text-[11px] text-slate-500">Tampil urut ke bawah, optimal rasio 9:16.</p>
                </div>
                <label className="cursor-pointer bg-erafone text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-red-700 transition-colors shadow-sm text-center">
                  + Tambah Price List
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUpload(e, 'pricelist', true)} />
                </label>
              </div>
              
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
                {pricelistAssets.map(asset => (
                  <div key={asset.section_key} className="bg-slate-50 p-3 rounded-xl border border-slate-200 relative group flex flex-col">
                    <div className="relative w-full flex-1 min-h-25 bg-slate-200 rounded-lg mb-3 overflow-hidden">
                      <img src={asset.image_url} className="object-cover w-full h-full absolute inset-0" alt="Pricelist" />
                    </div>
                    <div className="flex justify-between items-center gap-2 mt-auto">
                      <input type="file" accept="image/*" id={`file-${asset.section_key}`} className="hidden" onChange={(e) => handleUpload(e, 'pricelist', false, asset.section_key)} />
                      <label htmlFor={`file-${asset.section_key}`} className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-slate-50 shadow-sm w-full text-center">Ganti</label>
                      <button onClick={() => handleDelete(asset.section_key, asset.image_url)} className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-3 py-1.5 rounded-lg hover:bg-red-100 w-full text-center">Hapus</button>
                    </div>
                    {uploading === asset.section_key && <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center rounded-xl"><span className="text-sm font-semibold text-slate-600 animate-pulse">Loading...</span></div>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* GALERI */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-700">Galeri Toko</h3>
                <p className="text-[11px] text-slate-500">Tampil acak gaya Pinterest Masonry.</p>
              </div>
              <label className="cursor-pointer bg-erafone text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-red-700 transition-colors shadow-sm text-center">
                + Tambah Foto Galeri
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUpload(e, 'gallery', true)} />
              </label>
            </div>
            
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
              {galleryAssets.map(asset => (
                <div key={asset.section_key} className="bg-slate-50 p-3 rounded-xl border border-slate-200 relative group flex flex-col">
                  <div className="relative w-full aspect-3/4 bg-slate-200 rounded-lg mb-3 overflow-hidden">
                    <img src={asset.image_url} className="object-cover w-full h-full absolute inset-0" alt="Gallery" />
                  </div>
                  <div className="flex justify-between items-center gap-2 mt-auto">
                    <input type="file" accept="image/*" id={`file-${asset.section_key}`} className="hidden" onChange={(e) => handleUpload(e, 'gallery', false, asset.section_key)} />
                    <label htmlFor={`file-${asset.section_key}`} className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-slate-50 shadow-sm w-full text-center">Ganti</label>
                    <button onClick={() => handleDelete(asset.section_key, asset.image_url)} className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-2 py-1.5 rounded-lg hover:bg-red-100 w-full text-center">Hapus</button>
                  </div>
                  {uploading === asset.section_key && <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center rounded-xl"><span className="text-sm font-semibold text-slate-600 animate-pulse">Loading...</span></div>}
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
