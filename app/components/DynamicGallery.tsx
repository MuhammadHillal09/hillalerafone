"use client";

import { useState } from "react";
import ImageCarousel from "./ImageCarousel";

interface DynamicGalleryProps {
  images: { id: string; url: string }[];
  isPricelist?: boolean;
  cardBorderClass?: string;
}

export default function DynamicGallery({ images, isPricelist = false, cardBorderClass = "border-0 shadow-sm" }: DynamicGalleryProps) {
  const [carouselOpen, setCarouselOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Generate stable random aspect ratios based on string ID
  const aspectRatios = ["aspect-[3/4]", "aspect-square", "aspect-[4/3]"];
  
  const getAspectRatio = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash += id.charCodeAt(i);
    return aspectRatios[hash % aspectRatios.length];
  };

  const openCarousel = (index: number) => {
    setCurrentIndex(index);
    setCarouselOpen(true);
  };

  const imageUrls = images.map(img => img.url);

  if (images.length === 0) return <p className="text-sm text-gray-400">Belum ada gambar.</p>;

  if (isPricelist) {
    return (
      <>
        <div className="flex flex-col gap-4">
          {images.map((img, i) => (
            <div 
              key={img.id} 
              className={`era-card rounded-2xl overflow-hidden cursor-pointer group ${cardBorderClass}`}
              onClick={() => openCarousel(i)}
            >
              <div className="relative w-full flex bg-gray-50">
                <img
                  src={img.url}
                  alt="Price list"
                  className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                  <div className="w-12 h-12 bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-90 group-hover:scale-100">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"></path><path d="M9 21H3v-6"></path><path d="M21 3l-7 7"></path><path d="M3 21l7-7"></path></svg>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <ImageCarousel 
          images={imageUrls} 
          isOpen={carouselOpen} 
          onClose={() => setCarouselOpen(false)} 
          initialIndex={currentIndex} 
        />
      </>
    );
  }

  // Masonry layout for gallery
  const gridClass = images.length === 1 
    ? "flex flex-col w-full" 
    : "columns-2 sm:columns-3 gap-3 space-y-3";

  return (
    <>
      <div className={gridClass}>
        {images.map((img, i) => (
          <div 
            key={img.id} 
            className="break-inside-avoid"
          >
            <div 
              className={`relative w-full rounded-2xl overflow-hidden cursor-pointer group bg-gray-50 ${getAspectRatio(img.id)} ${cardBorderClass} hover:border-erafone-200 transition-colors`}
              onClick={() => openCarousel(i)}
            >
              <img 
                src={img.url} 
                alt="Galeri Toko" 
                className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105" 
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                <div className="w-10 h-10 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-90 group-hover:scale-100">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"></path><path d="M9 21H3v-6"></path><path d="M21 3l-7 7"></path><path d="M3 21l7-7"></path></svg>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <ImageCarousel 
        images={imageUrls} 
        isOpen={carouselOpen} 
        onClose={() => setCarouselOpen(false)} 
        initialIndex={currentIndex} 
      />
    </>
  );
}
