import { Link } from "@tanstack/react-router";
import {
  Bell, Bot, Box, History, LayoutDashboard, Menu, PanelsTopLeft, Settings, Settings2, X,
} from "lucide-react";
import { useState } from "react";
import swirl from "@/assets/nexus-swirl.jpg";
import { Button } from "@/components/ui/button";
import { BrandMark, CopyValue } from "@/components/nexus/ui";
import { NETWORK, OWNER_ADDRESS, shortHash } from "@/lib/nexus/mock-service";

const nav = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard },
  { label: "Transactions", to: "/transactions", icon: History },
  { label: "Services", to: "/services", icon: PanelsTopLeft },
  { label: "AI Agent", to: "/agent", icon: Bot },
  { label: "Settings", to: "/settings", icon: Settings },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="space-y-1" aria-label="Main navigation">
      {nav.map(({ label, to, icon: Icon }) => (
        <Link
          key={label}
          to={to}
          onClick={onNavigate}
          activeOptions={{ exact: to === "/" }}
          className="flex h-11 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground data-[status=active]:border data-[status=active]:border-primary/25 data-[status=active]:bg-primary/12 data-[status=active]:text-foreground data-[status=active]:shadow-glow"
        >
          <Icon className="size-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

function SidebarPromo() {
  return (
    <div className="lift relative mt-auto overflow-hidden rounded-xl border border-primary/20 bg-secondary/55 p-4">
      <img
        src={swirl}
        alt=""
        loading="lazy"
        width={672}
        height={992}
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%] w-full object-cover opacity-70"
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,var(--secondary)_0%,transparent_42%,color-mix(in_oklab,var(--background)_82%,transparent)_100%)]" />
      <div className="relative">
        <div className="mb-3 flex items-center justify-between">
          <Box className="size-5 text-primary" />
          <span className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground">Protocol 01</span>
        </div>
        <p className="font-display text-lg font-semibold leading-tight">
          Empowering the next<br /><span className="text-primary">generation of AI.</span>
        </p>
        <p className="mt-[110px] text-xs leading-relaxed text-muted-foreground">
          More autonomy.<br />More possibilities.<br />More trust.
        </p>
      </div>
    </div>
  );
}

export function AppShell({
  breadcrumb,
  children,
}: { breadcrumb: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="grid-surface min-h-screen overflow-x-hidden bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-background/85 px-4 py-6 backdrop-blur-xl lg:flex">
        <div className="px-2"><BrandMark /></div>
        <div className="mt-10"><NavLinks /></div>
        <SidebarPromo />
        <p className="mt-4 px-2 text-[9px] uppercase tracking-[0.2em] text-muted-foreground/70">v0.1.0 · Hack the Future</p>
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button aria-label="Close menu" className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative flex h-full w-64 flex-col border-r border-border bg-background/95 px-4 py-6">
            <div className="flex items-center justify-between px-2">
              <BrandMark />
              <Button variant="ghost" size="icon-sm" aria-label="Close menu" onClick={() => setOpen(false)}>
                <X className="size-4" />
              </Button>
            </div>
            <div className="mt-8"><NavLinks onNavigate={() => setOpen(false)} /></div>
          </div>
        </div>
      )}

      <main className="min-h-screen lg:ml-60">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/75 px-4 backdrop-blur-xl sm:px-7">
          <div className="lg:hidden"><BrandMark compact /></div>
          <div className="hidden lg:block">
            <p className="text-xs text-muted-foreground">
              Control center <span className="mx-2 text-border">/</span>
              <span className="text-foreground">{breadcrumb}</span>
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 text-xs">
              <span className="size-2 rounded-full bg-success shadow-[0_0_12px_var(--success)]" />
              <span className="hidden sm:inline">{NETWORK}</span>
            </div>
            <Button variant="ghost" size="icon-sm" aria-label="Notifications"><Bell className="size-4" /></Button>
            <div className="hidden h-10 items-center gap-3 rounded-lg border border-border bg-secondary/60 px-2.5 sm:flex">
              <span className="grid size-6 place-items-center rounded-full bg-accent text-xs">U</span>
              <CopyValue value={OWNER_ADDRESS} display={shortHash(OWNER_ADDRESS)} label="Owner address" className="text-xs" />
            </div>
            <Button variant="ghost" size="icon-sm" className="lg:hidden" aria-label="Open menu" onClick={() => setOpen(true)}>
              <Menu className="size-4" />
            </Button>
          </div>
        </header>

        <div className="mx-auto max-w-[1540px] space-y-4 p-3 sm:p-5 lg:p-6">
          {children}

          <footer className="relative overflow-hidden rounded-xl border border-primary/20 bg-secondary/55 px-6 py-8">
            <span className="pointer-events-none absolute -right-12 -top-28 size-56 rotate-45 border border-primary/20 bg-primary/5" />
            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <BrandMark />
              <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                Built for a more open economy
              </p>
              <Button variant="outline" size="sm" className="w-fit">
                <Settings2 className="size-3" /> Explore the protocol
              </Button>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
