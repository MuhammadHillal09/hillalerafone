"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/app/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Load saved credentials on mount
    const savedEmail = localStorage.getItem("era_saved_email");
    const savedPassword = localStorage.getItem("era_saved_password");
    if (savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else {
      if (rememberMe) {
        localStorage.setItem("era_saved_email", email);
        localStorage.setItem("era_saved_password", password);
      } else {
        localStorage.removeItem("era_saved_email");
        localStorage.removeItem("era_saved_password");
      }
      
      router.push("/era-admin-x90");
      router.refresh(); 
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-sm w-full">
        <h1 className="text-2xl font-bold text-center text-erafone mb-6">Portal Admin</h1>
        {errorMsg && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">{errorMsg}</div>}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="text-sm text-gray-600 font-medium mb-1 block">Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-erafone focus:ring-1 focus:ring-erafone" 
              required 
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 font-medium mb-1 block">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-erafone focus:ring-1 focus:ring-erafone" 
              required 
            />
          </div>
          
          <div className="flex items-center gap-2 mt-1">
            <input 
              type="checkbox" 
              id="remember" 
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-erafone rounded border-gray-300 focus:ring-erafone cursor-pointer"
            />
            <label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer select-none">
              Ingat Saya
            </label>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="mt-2 w-full bg-erafone text-white py-2.5 rounded-xl font-medium hover:bg-erafone-hover transition-colors disabled:opacity-50"
          >
            {loading ? "Loading..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}
