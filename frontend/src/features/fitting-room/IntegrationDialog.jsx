import { Code2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";

const SNIPPET = `import VirtualFittingRoom from "./features/fitting-room";

<VirtualFittingRoom
  apiBase={process.env.REACT_APP_BACKEND_URL}
  onCheckout={(items) => cart.addMany(items)}
/>

// Backend (FastAPI):
import fitting_room
app.include_router(fitting_room.router)   # /api/fitting-room/*
await fitting_room.init(db)               # uses the shared "products" collection`;

export const IntegrationDialog = () => (
  <Dialog>
    <DialogTrigger asChild>
      <button className="fr-btn-ghost h-9 px-3 text-xs" data-testid="integration-helper-button"><Code2 className="h-3.5 w-3.5" /> Embed</button>
    </DialogTrigger>
    <DialogContent className="max-w-xl border-[#8f8f8f] bg-[#ffffff] text-[#000000]" data-testid="integration-dialog">
      <DialogHeader><DialogTitle className="font-display text-xl">Plug into the marketplace</DialogTitle></DialogHeader>
      <p className="text-sm text-[#555555]">This fitting room is a self-contained module. Drop the component into any page and mount the router on the main backend. Products live in the shared <code className="text-[#000000]">products</code> collection.</p>
      <pre className="overflow-x-auto rounded-none border border-[#8f8f8f] bg-[#ffffff] p-4 font-mono text-xs leading-relaxed text-[#000000]">{SNIPPET}</pre>
    </DialogContent>
  </Dialog>
);
