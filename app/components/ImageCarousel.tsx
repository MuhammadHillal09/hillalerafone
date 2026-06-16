"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import useEmblaCarousel from "embla-carousel-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

interface ImageCarouselProps {
  images: string[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function ImageCarousel({ images, initialIndex, isOpen, onClose }: ImageCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ startIndex: initialIndex, loop: true });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (emblaApi && isOpen) {
      emblaApi.scrollTo(initialIndex, true);
    }
  }, [emblaApi, initialIndex, isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden"; // Prevent scrolling behind
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-999 flex items-center justify-center bg-black/95 backdrop-blur-sm animate-fade">
      {/* Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>

      {/* Embla Carousel */}
      <div className="overflow-hidden w-full h-full flex items-center" ref={emblaRef}>
        <div className="flex w-full h-full touch-pan-y">
          {images.map((src, i) => (
            <div className="relative flex-[0_0_100%] min-w-0 flex items-center justify-center p-4" key={i}>
              <TransformWrapper
                initialScale={1}
                minScale={1}
                maxScale={10}
                wheel={{ step: 0.2 }}
                doubleClick={{ disabled: true }}
              >
                <TransformComponent>
                  <img 
                    src={src} 
                    alt={`Image ${i + 1}`} 
                    className="max-w-full max-h-[90vh] object-contain drop-shadow-2xl select-none" 
                  />
                </TransformComponent>
              </TransformWrapper>
            </div>
          ))}
        </div>
      </div>

      {/* Controls (Arrows for Desktop) */}
      <button 
        onClick={() => emblaApi?.scrollPrev()}
        className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 rounded-full items-center justify-center text-white hover:bg-white/20 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
      </button>
      <button 
        onClick={() => emblaApi?.scrollNext()}
        className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 rounded-full items-center justify-center text-white hover:bg-white/20 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </button>
    </div>,
    document.body
  );
}
