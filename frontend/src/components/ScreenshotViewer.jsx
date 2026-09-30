import { X, ZoomIn } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

export default function ScreenshotViewer({ open, onClose, src, title, subtitle, footer }) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[80] bg-black/85 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          data-testid="screenshot-viewer"
          className="fixed inset-0 z-[90] flex flex-col focus:outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          <div className="flex items-center gap-3 px-4 py-3 bg-[#0B132B]/90 text-white shrink-0">
            <ZoomIn className="w-4 h-4 text-sky-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <DialogPrimitive.Title className="text-sm font-bold truncate">{title}</DialogPrimitive.Title>
              <DialogPrimitive.Description className="text-[11px] text-slate-300 truncate">{subtitle || "Captura de pantalla"}</DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close
              data-testid="screenshot-viewer-close"
              aria-label="Cerrar"
              className="flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 px-3 py-2 text-xs font-bold active:scale-95 transition"
            >
              <X className="w-4 h-4" strokeWidth={3} /> Cerrar
            </DialogPrimitive.Close>
          </div>
          <div className="flex-1 min-h-0 flex items-center justify-center p-3 overflow-auto" onClick={onClose}>
            {src && <img data-testid="screenshot-viewer-image" src={src} alt="Captura de pantalla" className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()} />}
          </div>
          {footer && <div className="shrink-0 p-3 bg-[#0B132B]/90 space-y-2">{footer}</div>}
          <button
            data-testid="screenshot-viewer-close-bottom"
            onClick={onClose}
            className="shrink-0 m-3 mt-0 rounded-xl bg-white text-slate-900 text-sm font-bold py-3 active:scale-95 transition"
          >
            Cerrar
          </button>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
