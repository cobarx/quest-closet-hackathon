import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAppAuth as useAuth } from "../components/auth/AppAuth";

export const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const Ctx = createContext(null);

const guestId = () => {
  let id = localStorage.getItem("guest_id");
  if (!id) { id = crypto.randomUUID(); localStorage.setItem("guest_id", id); }
  return id;
};

const useApi = () => {
  const { getToken, isSignedIn } = useAuth();
  return useCallback(async (method, path, data) => {
    const headers = { "X-Guest-Id": guestId() };
    if (isSignedIn) headers.Authorization = `Bearer ${await getToken()}`;
    return (await axios({ method, url: `${API}${path}`, data, headers })).data;
  }, [getToken, isSignedIn]);
};

export const StoreProvider = ({ children }) => {
  const api = useApi();
  const { isLoaded, isSignedIn } = useAuth();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => { axios.get(`${API}/fitting-room/products`).then((r) => setProducts(r.data)).catch(() => {}); }, []);
  useEffect(() => {
    if (!isLoaded) return;
    (async () => {
      if (isSignedIn) await api("post", "/guest/merge").catch(() => {});
      api("get", "/cart").then((r) => setCart(r.items)).catch(() => {});
    })();
  }, [isLoaded, isSignedIn, api]);

  const byId = useMemo(() => Object.fromEntries(products.map((p) => [p.id, p])), [products]);

  const addToCart = useCallback(async (items) => {
    const r = await api("post", "/cart/add", { items });
    setCart(r.items);
    setCartOpen(true);
  }, [api]);

  const updateCart = useCallback(async (items) => setCart((await api("put", "/cart", { items })).items), [api]);

  const reloadCart = useCallback(() => api("get", "/cart").then((r) => setCart(r.items)).catch(() => {}), [api]);
  const value = { api, products, byId, cart, reloadCart, addToCart, updateCart, cartOpen, setCartOpen };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useStore = () => useContext(Ctx);
