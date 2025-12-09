import { useEffect } from "react";
import { QueryProvider } from "./QueryProvider";
import { useAuthStore } from "@/store/auth";

function AuthBootstrapper() {
  const initAuth = useAuthStore((s) => s.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return null;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthBootstrapper />
      {children}
    </QueryProvider>
  );
}
