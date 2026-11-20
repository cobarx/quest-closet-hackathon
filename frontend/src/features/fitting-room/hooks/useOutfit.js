import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { applyOps } from "../api";

const EMPTY = { equipped: {}, bench: {} };
const idsOf = (items) => Object.values(items).map((i) => i.id);

export const useOutfit = () => {
  const [state, setState] = useState(EMPTY);
  const ref = useRef(EMPTY);

  const commit = useCallback((next) => {
    ref.current = next;
    setState(next);
  }, []);

  const apply = useCallback((ops, byId) => commit(applyOps(ref.current, ops, byId)), [commit]);

  const toggle = useCallback((item) => {
    const isOn = ref.current.equipped[item.category]?.id === item.id;
    apply({ [isOn ? "unequip" : "equip"]: [item.id] }, { [item.id]: item });
    toast(isOn ? `Took off ${item.name} (kept in your selection)` : `Put on ${item.name}`);
  }, [apply]);

  const remove = useCallback((item) => {
    apply({ remove: [item.id] }, { [item.id]: item });
    toast(`Removed ${item.name} from your selection`);
  }, [apply]);

  const wearOnly = useCallback((items, byId) => {
    const off = applyOps(ref.current, { unequip: idsOf(ref.current.equipped) }, byId);
    commit(applyOps(off, { equip: idsOf(items) }, byId));
  }, [commit]);

  const clear = useCallback(() => commit(EMPTY), [commit]);

  return { ...state, ref, apply, toggle, remove, wearOnly, clear };
};
