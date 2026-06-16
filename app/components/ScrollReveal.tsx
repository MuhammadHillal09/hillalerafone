"use client";

import { useEffect, useRef, ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number; // 1 to 10 (mapped to d1-d10 classes)
}

export default function ScrollReveal({ children, className = "", delay = 0 }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Add animation classes when visible
            entry.target.classList.add("animate-reveal");
            entry.target.classList.remove("opacity-0", "translate-y-8");
            observer.unobserve(entry.target); // Only animate once
          }
        });
      },
      {
        rootMargin: "0px 0px -50px 0px", // Trigger slightly before it enters viewport
        threshold: 0.1, // Trigger when 10% is visible
      }
    );

    const el = ref.current;
    if (el) {
      observer.observe(el);
    }

    return () => {
      if (el) {
        observer.unobserve(el);
      }
    };
  }, []);

  const delayClass = delay > 0 ? `d${delay}` : "";

  return (
    <div
      ref={ref}
      className={`opacity-0 translate-y-8 transition-opacity duration-1000 ${delayClass} ${className}`}
    >
      {children}
    </div>
  );
}
