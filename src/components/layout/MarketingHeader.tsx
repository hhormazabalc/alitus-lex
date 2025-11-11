export default function MarketingHeader() {
  const formattedDate = new Date().toLocaleDateString('es-BO', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });

  return (
    <header className="relative z-30 px-4 pt-6 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-3 rounded-3xl border border-white/15 bg-white/10 px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-[0_18px_60px_rgba(9,25,60,0.45)] backdrop-blur-2xl">
            <span className="text-white/95">LEX ALTIUS</span>
            <span className="rounded-2xl bg-cyan-500/15 px-3 py-1 text-[10px] font-semibold tracking-[0.22em] text-cyan-100">
              Suite Legal
            </span>
          </div>
          <div className="hidden items-center gap-5 text-[12px] text-white/65 sm:flex">
            <span className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/6 px-3 py-1.5 text-white/75 backdrop-blur-xl">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.65)]" />
              Operación en línea
            </span>
            <a
              href="https://www.altiusignite.com"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-cyan-200"
            >
              www.altiusignite.com
            </a>
            <a
              href="mailto:soporte@altiusignite.com"
              className="rounded-2xl border border-white/10 bg-white/5 px-3 py-1.5 text-white/70 transition hover:border-cyan-400/60 hover:text-cyan-100"
            >
              soporte@altiusignite.com
            </a>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-3xl border border-white/12 bg-white/7 px-6 py-4 text-xs text-white/70 shadow-[0_24px_85px_-40px_rgba(8,21,60,0.65)] backdrop-blur-[32px]">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/80">Panel Plataforma</span>
            <span className="hidden sm:inline-flex items-center gap-3 text-white/55">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
              Experiencia diseñada por Altius Ignite
            </span>
          </div>
          <div className="flex items-center gap-4 text-white/55">
            <span className="hidden sm:inline text-[11px] uppercase tracking-[0.22em]">Versión 1.0.0</span>
            <span className="hidden sm:inline h-5 w-px bg-white/10" aria-hidden />
            <span className="text-[11px] uppercase tracking-[0.24em] text-white/60">{formattedDate}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
