import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useStore } from "../store/StoreContext";
import { money } from "../store/catalog";

export const PaymentSuccess = () => {
  const { api, reloadCart } = useStore();
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [status, setStatus] = useState(null);

  useEffect(() => {
    let tries = 0;
    let t;
    const check = async () => {
      try {
        const s = await api("get", `/payments/status/${sessionId}`);
        setStatus(s);
        if (s.payment_status === "paid") return reloadCart();
        if (s.status === "expired") return;
      } catch {
        setStatus({ payment_status: "error" });
        return;
      }
      if (++tries < 10) t = setTimeout(check, 2000);
      else setStatus((s) => ({ ...s, payment_status: "timeout" }));
    };
    if (sessionId) check();
    return () => clearTimeout(t);
  }, [api, sessionId, reloadCart]);

  const paid = status?.payment_status === "paid";
  const failed = ["error", "timeout", "expired"].includes(status?.payment_status);
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center" data-testid="payment-success-page">
      <h1 className="text-4xl font-extrabold uppercase" data-testid="payment-status-title">
        {paid ? "Order confirmed" : failed ? "We couldn't confirm your payment" : "Confirming payment…"}
      </h1>
      {paid && <p className="mt-3 text-sm uppercase" data-testid="payment-total">Total paid {money(status.amount_total)}{status.tax ? ` (incl. ${money(status.tax)} tax)` : ""}</p>}
      {failed && <p className="mt-3 text-sm text-[#555555]">If you were charged, it will show in your orders shortly.</p>}
      <div className="mt-8 flex justify-center gap-3">
        <Link to="/orders" className="fr-btn-primary" data-testid="payment-orders-link">My orders</Link>
        <Link to="/shop/all" className="fr-btn-ghost">Keep shopping</Link>
      </div>
    </div>
  );
};

export const PaymentCancel = () => (
  <div className="mx-auto max-w-xl px-4 py-20 text-center" data-testid="payment-cancel-page">
    <h1 className="text-4xl font-extrabold uppercase">Checkout cancelled</h1>
    <p className="mt-3 text-sm uppercase text-[#555555]">Nothing was charged. Your bag is still saved.</p>
    <Link to="/shop/all" className="fr-btn-primary mt-8">Back to shop</Link>
  </div>
);

export const OrdersPage = () => {
  const { api } = useStore();
  const [orders, setOrders] = useState(null);
  useEffect(() => { api("get", "/orders").then(setOrders).catch(() => setOrders([])); }, [api]);
  return (
    <div className="px-4 py-8 sm:px-8" data-testid="orders-page">
      <h1 className="text-4xl font-extrabold uppercase sm:text-5xl">My orders</h1>
      {orders && !orders.length && <p className="py-16 text-sm uppercase text-[#555555]" data-testid="orders-empty">No orders yet.</p>}
      <div className="mt-6 flex flex-col gap-4">
        {(orders || []).map((o) => (
          <article key={o.session_id} className="border border-black p-5" data-testid={`order-${o.session_id}`}>
            <div className="flex flex-wrap justify-between gap-2 text-xs font-bold uppercase">
              <span>{new Date(o.created_at).toLocaleDateString()}</span>
              <span>{money(o.amount_total ?? o.amount)}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              {o.items.map((i) => (
                <div key={`${i.product_id}-${i.size}`} className="flex items-center gap-2">
                  {i.image && <img src={i.image} alt={i.name} className="h-14 w-12 object-cover" />}
                  <span className="text-xs uppercase">{i.name}{i.size ? ` · ${i.size}` : ""} × {i.qty}</span>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
