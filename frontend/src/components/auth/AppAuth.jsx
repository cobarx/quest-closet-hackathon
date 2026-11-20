import { createContext, useContext } from "react";
import { Link } from "react-router-dom";
import { Show, SignIn, SignUp, UserButton, useAuth } from "@clerk/react";
import { useI18n } from "../../i18n";

// One auth interface for the whole app. In "clerk" mode it mirrors Clerk; in "guest"
// mode (sign-in keys not set up) everyone shops as a guest via the X-Guest-Id header.
const GUEST_STATE = { mode: "guest", isLoaded: true, isSignedIn: false, getToken: async () => null };
const AuthCtx = createContext(GUEST_STATE);

export const useAppAuth = () => useContext(AuthCtx);

export const GuestAuthProvider = ({ children }) => <AuthCtx.Provider value={GUEST_STATE}>{children}</AuthCtx.Provider>;

// Must render inside <ClerkProvider>.
export const ClerkAuthBridge = ({ children }) => {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  return <AuthCtx.Provider value={{ mode: "clerk", isLoaded, isSignedIn: !!isSignedIn, getToken }}>{children}</AuthCtx.Provider>;
};

// Like Clerk's <Show>; guest mode counts as "signed-out" unless guestShows overrides it.
export const AuthShow = ({ when, guestShows, children }) => {
  const { mode } = useAppAuth();
  if (mode === "clerk") return <Show when={when}>{children}</Show>;
  const visible = guestShows ?? when === "signed-out";
  return visible ? children : null;
};

export const AppUserButton = () => (useAppAuth().mode === "clerk" ? <UserButton /> : null);

const SignInUnavailable = () => {
  const { t } = useI18n();
  return (
  <div className="max-w-md border border-black p-8 text-center" data-testid="sign-in-unavailable">
    <h1 className="text-2xl font-extrabold uppercase">{t("auth.soonTitle")}</h1>
    <p className="mt-3 text-sm text-[#555555]">{t("auth.soonBody")}</p>
    <Link to="/" className="mt-6 inline-block bg-black px-6 py-3 text-sm font-bold uppercase text-white" data-testid="sign-in-unavailable-home">{t("pay.keepShopping")}</Link>
  </div>
  );
};

export const AppSignIn = (props) => (useAppAuth().mode === "clerk" ? <SignIn {...props} /> : <SignInUnavailable />);
export const AppSignUp = (props) => (useAppAuth().mode === "clerk" ? <SignUp {...props} /> : <SignInUnavailable />);
