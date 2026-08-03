import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-border mt-3xl border-t">
      <div className="container-page gap-2xs py-l text-step--1 text-muted flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} {site.name}
        </p>
        <p>Built with Next.js</p>
      </div>
    </footer>
  );
}
