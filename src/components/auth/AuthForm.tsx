"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight, Loader2 } from "lucide-react";
import AppNav from "@/components/layout/AppNav";

export default function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const initialMode = searchParams.get("mode") === "register" ? "register" : "login";

  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (mode === "register") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          await supabase.from("profiles").upsert({
            id: data.user.id,
            full_name: fullName,
            email,
          });

          if (!data.session) {
            const res = await fetch("/api/auth/confirm", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: data.user.id }),
            });

            if (res.ok) {
              const { error: loginError } = await supabase.auth.signInWithPassword({
                email,
                password,
              });
              if (loginError) throw loginError;
            }
          }
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }

      router.push(redirect);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Giriş yapılırken bir hata oluştu"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <AppNav
        backLink={{ href: "/", label: "Ana Sayfa" }}
        right={
          <Link
            href="/"
            className="text-sm text-[#94a3b8] transition hover:text-cyan-400"
          >
            Tanıtım
          </Link>
        }
      />

      <div className="mx-auto flex min-h-[calc(100vh-88px)] max-w-md items-center px-4 py-10 sm:px-6">
        <div className="lf-animate-in lf-animate-in-2 w-full">
          <div className="lf-card-border rounded-[20px] p-[2px]">
            <div className="lf-panel p-8 sm:p-10">
              <div className="mb-6 text-center">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
                  {mode === "register" ? "Kayıt" : "Giriş"}
                </p>
                <h1 className="lf-orbitron mt-2 text-2xl font-bold text-white">
                  {mode === "register" ? "Hesap Oluşturun" : "Hoş Geldiniz"}
                </h1>
                <p className="mt-2 text-sm text-[#94a3b8]">
                  {mode === "register"
                    ? "Kampanyanızı başlatmak için birkaç bilgi yeterli."
                    : "Hesabınıza giriş yapın ve kampanyalarınızı yönetin."}
                </p>
              </div>

              {error && (
                <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "register" && (
                  <div>
                    <label className="mb-1.5 block text-sm text-[#94a3b8]">
                      Ad Soyad
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="lf-input"
                      placeholder="Adınız Soyadınız"
                    />
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-sm text-[#94a3b8]">
                    E-posta
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="lf-input"
                    placeholder="ornek@email.com"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm text-[#94a3b8]">
                    Şifre
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="lf-input"
                    placeholder="En az 6 karakter"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="lf-btn-primary relative flex w-full min-h-[48px] items-center justify-center gap-2 overflow-hidden rounded-xl py-3.5 font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {loading && <Loader2 className="relative z-10 h-4 w-4 animate-spin" />}
                  <span className="relative z-10">
                    {mode === "register" ? "Kayıt Ol" : "Giriş Yap"}
                  </span>
                  {!loading && <ArrowRight className="relative z-10 h-4 w-4" />}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-[#94a3b8]">
                {mode === "register" ? (
                  <>
                    Zaten hesabınız var mı?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("login")}
                      className="font-semibold text-cyan-400 hover:underline"
                    >
                      Giriş Yap
                    </button>
                  </>
                ) : (
                  <>
                    Hesabınız yok mu?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("register")}
                      className="font-semibold text-cyan-400 hover:underline"
                    >
                      Kayıt Ol
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
