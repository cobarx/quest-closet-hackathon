import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import VirtualFittingRoom from "../features/fitting-room";
import { useStore } from "../store/StoreContext";
import { useI18n } from "../i18n";

export default function FittingRoomPage() {
  const [params] = useSearchParams();
  const { addToCart } = useStore();
  const { t } = useI18n();
  const checkout = (items) => {
    const lines = items.map((p) => ({ product_id: p.id, size: p.sizing?.sizes?.length === 1 ? p.sizing.sizes[0] : "" }));
    addToCart(lines).catch(() => toast.error(t("product.addFailed")));
  };
  return <VirtualFittingRoom onCheckout={checkout} initialItemId={params.get("item")} initialLook={params.get("look")} />;
}
