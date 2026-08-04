import logoAsset from "@/assets/prince-logo.png.asset.json";

export function SiteHeader() {
  return (
    <header className="border-b border-[color:var(--olive)]/15 bg-[color:var(--cream)]">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <img
          src={logoAsset.url}
          alt="Prince Group of Companies"
          className="h-11 w-11 shrink-0 sm:h-14 sm:w-14"
        />
        <div className="min-w-0">
          <p className="font-display text-sm font-semibold leading-tight text-[color:var(--olive-deep)] sm:text-lg">
            PRINCE GROUP MARRIAGE REGISTRATION PORTAL
          </p>
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[color:var(--olive)]/80 sm:text-[11px]">
            Prince Group of Companies
          </p>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-[color:var(--olive)]/15 bg-[color:var(--cream)]">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 py-6 text-center sm:flex-row sm:justify-between sm:text-left sm:px-6">
        <div className="flex items-center gap-3">
          <img
            src={logoAsset.url}
            alt="Prince Group of Companies"
            className="h-9 w-9"
          />
          <div>
            <p className="font-display text-sm font-semibold text-[color:var(--olive-deep)]">
              PRINCE GROUP MARRIAGE REGISTRATION PORTAL
            </p>
            <p className="text-[11px] text-[color:var(--olive)]/80">
              Trusted since 2010 · 22+ branches across Kanyakumari
            </p>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} Prince Group of Companies. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
