interface OfflineNoticeProps {
  isOnline: boolean;
}

export function OfflineNotice({ isOnline }: OfflineNoticeProps) {
  if (isOnline) return null;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 bg-black/70 backdrop-blur-md border border-gold/20 text-cream/75 font-sans text-[10px] tracking-[0.25em] uppercase">
      Modo sin conexión activo · usando contenido descargado
    </div>
  );
}
