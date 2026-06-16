"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SecretAdminTrigger({ children }: { children: React.ReactNode }) {
  const [clicks, setClicks] = useState(0);
  const router = useRouter();

  const handleClick = () => {
    const newClicks = clicks + 1;
    setClicks(newClicks);
    
    // Redirect on 5th click
    if (newClicks >= 5) {
      router.push("/era-login");
    }
    
    // Reset clicks after 3 seconds of inactivity
    setTimeout(() => {
      setClicks((prev) => (prev > 0 ? 0 : prev));
    }, 3000);
  };

  return (
    <span onClick={handleClick} className="cursor-default select-none block">
      {children}
    </span>
  );
}
