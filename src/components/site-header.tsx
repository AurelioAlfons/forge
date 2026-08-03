import Link from "next/link";
import { site } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="border-border bg-bg/80 sticky top-0 z-40 border-b backdrop-blur-md">
      <div className="container-page gap-m py-xs flex items-center justify-between">
        <Link href="/" className="text-step-0 font-semibold tracking-tight">
          {site.name}
        </Link>
        <nav aria-label="Main">
          <ul className="gap-s text-step--1 flex items-center">
            {site.nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-muted hover:text-fg transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
