// Intestazione comune alle pagine di accesso (login e setup).
export function LogoAccesso() {
  return (
    <div className="flex items-center gap-2.5 mb-6">
      <svg width="34" height="34" viewBox="0 0 26 26" aria-hidden="true">
        <rect width="26" height="26" rx="6" fill="#006FBB" />
        <circle cx="13" cy="9.5" r="3.4" fill="none" stroke="#FFFFFF" strokeWidth="1.8" />
        <circle cx="13" cy="17" r="4.3" fill="none" stroke="#FFFFFF" strokeWidth="1.8" />
      </svg>
      <div>
        <div className="text-lg font-semibold tracking-tight text-enel-ink">simulOTTO</div>
        <div className="text-xs text-enel-ink/40">Enel SMB · Simulatore offerte</div>
      </div>
    </div>
  );
}
