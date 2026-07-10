"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import BrandLogo from "@/components/layout/BrandLogo";

export default function AdminPanelLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin-panel/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Giriş başarısız");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Giriş başarısız");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-88px)] max-w-md items-center px-4 py-10">
      <div className="lf-card-border w-full rounded-[20px] p-[2px]">
        <div className="lf-panel p-8 sm:p-10">
          <div className="mb-6 text-center">
            <div className="mb-4 flex justify-center">
              <BrandLogo href="" size="2xl" centered />
            </div>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10">
              <Lock className="h-5 w-5 text-amber-400" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">
              Yönetici Paneli
            </p>
            <h1 className="lf-orbitron mt-2 text-2xl font-bold text-white">
              Admin Girişi
            </h1>
            <p className="mt-2 text-sm text-[#94a3b8]">
              Devam etmek için yönetici şifresini girin.
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm text-[#94a3b8]">
                Şifre
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="lf-input"
                placeholder="Yönetici şifresi"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="lf-btn-primary relative flex w-full min-h-[48px] items-center justify-center gap-2 overflow-hidden rounded-xl py-3.5 font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-60"
            >
              {loading && <Loader2 className="relative z-10 h-4 w-4 animate-spin" />}
              <span className="relative z-10">Giriş Yap</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
