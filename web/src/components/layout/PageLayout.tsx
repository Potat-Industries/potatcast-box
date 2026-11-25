import { Outlet } from "react-router";
import { SiteHeader } from "./SiteHeader";
import { MAIN_CONTENT_ID, SkipLink } from "./SkipLink";

const FOOTER_LINKS = [
  { label: "GitHub", href: "https://github.com/Glimesh/broadcast-box" },
  { label: "Pion", href: "https://pion.ly" },
  { label: "Glimesh", href: "https://glimesh.tv" },
];

/** The shell for every page except the player, which manages the full viewport itself. */
export default function PageLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <SiteHeader />

      <main id={MAIN_CONTENT_ID} className="flex flex-1 flex-col">
        <Outlet />
      </main>

      <footer className="px-2 py-6">
        <ul className="flex items-center justify-center gap-4 text-sm text-gray-300">
          {FOOTER_LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="rounded hover:underline">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </footer>
    </div>
  );
}
