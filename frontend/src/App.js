import "@/App.css";
import "./features/fitting-room/fitting-room.css";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Show, SignIn, SignUp } from "@clerk/react";
import { Toaster } from "./components/ui/sonner";
import ClerkAuthProvider from "./components/auth/ClerkAuthProvider";
import { StoreProvider } from "./store/StoreContext";
import { StoreFooter, StoreHeader } from "./store/StoreHeader";
import { CartDrawer } from "./store/CartDrawer";
import HomePage from "./pages/HomePage";
import ShopPage from "./pages/ShopPage";
import ProductPage from "./pages/ProductPage";
import FittingRoomPage from "./pages/FittingRoomPage";
import EventsPage from "./pages/EventsPage";
import { OrdersPage, PaymentCancel, PaymentSuccess } from "./pages/Commerce";

const RequireSignIn = () => (
  <>
    <Show when="signed-in"><Outlet /></Show>
    <Show when="signed-out"><Navigate to="/sign-in" replace /></Show>
  </>
);

const AuthPage = ({ children }) => <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">{children}</div>;

const Layout = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return (
    <div className="fr-root min-h-screen">
      <StoreHeader />
      <main><Outlet /></main>
      <StoreFooter />
      <CartDrawer />
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <ClerkAuthProvider>
          <StoreProvider>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/shop" element={<Navigate to="/shop/all" replace />} />
                <Route path="/shop/:slug" element={<ShopPage />} />
                <Route path="/product/:id" element={<ProductPage />} />
                <Route path="/fitting-room" element={<FittingRoomPage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/sign-in/*" element={<AuthPage><SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" withSignUp /></AuthPage>} />
                <Route path="/sign-up/*" element={<AuthPage><SignUp routing="path" path="/sign-up" signInUrl="/sign-in" /></AuthPage>} />
                <Route element={<RequireSignIn />}>
                  <Route path="/orders" element={<OrdersPage />} />
                  <Route path="/payment/success" element={<PaymentSuccess />} />
                </Route>
                <Route path="/payment/cancel" element={<PaymentCancel />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </StoreProvider>
        </ClerkAuthProvider>
      </BrowserRouter>
      <Toaster theme="light" position="bottom-center" />
    </div>
  );
}

export default App;
