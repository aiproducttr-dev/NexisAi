import { Suspense } from "react";
import AuthForm from "@/components/auth/AuthForm";

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-[#94a3b8]">
          Yükleniyor...
        </div>
      }
    >
      <AuthForm />
    </Suspense>
  );
}
