import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClerkProvider } from "@clerk/react";
import { ClerkAuthBridge, GuestAuthProvider } from "./AppAuth";

const appearance = {
  variables: {
    colorPrimary: "#000000", colorPrimaryForeground: "#ffffff", colorBackground: "#ffffff",
    colorForeground: "#000000", colorBorder: "#000000", borderRadius: "0px", fontFamily: "Archivo, Arial, sans-serif",
  },
};

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Starts Clerk from the backend's runtime config, so deploy's live keys need no rebuild.
// Must render inside <BrowserRouter> (see step 3) so Clerk navigates without reloading.
export default function ClerkAuthProvider({ children }) {
  const navigate = useNavigate();
  const [config, setConfig] = useState(null);
  const [guest, setGuest] = useState(false);

  // Retries while the backend restarts; falls back to guest mode when Clerk is not configured.
  useEffect(() => {
    let cancelled = false;
    const load = async (attempt = 0) => {
      try {
        const cfg = await (await fetch(`${BACKEND_URL}/api/clerk/config`)).json();
        if (cancelled) return;
        // Sign-in keys not set up: run the store in guest mode instead of a blank page.
        return cfg.enabled ? setConfig(cfg) : setGuest(true);
      } catch {}
      if (cancelled) return;
      if (attempt >= 20) return setGuest(true);
      setTimeout(() => load(attempt + 1), 1500);
    };
    load();
    return () => { cancelled = true; };
  }, []);

  if (guest) return <GuestAuthProvider>{children}</GuestAuthProvider>;
  if (!config) return null;
  return (
    <ClerkProvider
      publishableKey={config.publishable_key}
      proxyUrl={config.proxy_url || undefined}
      appearance={appearance}
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
      afterSignOutUrl="/"
    >
      <ClerkAuthBridge>{children}</ClerkAuthBridge>
    </ClerkProvider>
  );
}
