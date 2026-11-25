import { ChartBarIcon, LanguageIcon } from "@heroicons/react/20/solid";
import { useContext } from "react";
import { Link, NavLink } from "react-router";
import { LOCALE_OPTIONS, LocaleContext } from "../../providers/LocaleProvider";

export function SiteHeader() {
  const { locale, localeId, setLocaleId } = useContext(LocaleContext);

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-gray-700 bg-gray-800 px-3">
      <Link
        to="/"
        className="mr-auto rounded text-xl leading-tight font-light text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
      >
        Broadcast Box
      </Link>

      <NavLink
        to="/statistics"
        aria-label={locale.statistics.title}
        title={locale.statistics.title}
        className={({ isActive }) =>
          `inline-flex h-9 items-center gap-1 rounded-md px-2 text-sm hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-blue-400 ${isActive ? "text-white" : "text-gray-300"}`
        }
      >
        <ChartBarIcon className="size-5" aria-hidden="true" />
        <span className="hidden sm:inline">{locale.statistics.title}</span>
      </NavLink>

      <label className="flex h-9 items-center gap-1 rounded-md pl-2 text-gray-300 focus-within:outline-2 focus-within:outline-blue-400 hover:bg-gray-700">
        <LanguageIcon className="size-5" aria-hidden="true" />
        <span className="sr-only">{locale.site.language_label}</span>
        <select
          value={localeId}
          onChange={(event) => setLocaleId(event.target.value)}
          className="h-9 cursor-pointer rounded-md bg-transparent pr-1 text-sm text-gray-100 focus:outline-none"
        >
          {LOCALE_OPTIONS.map((option) => (
            <option key={option.id} value={option.id} className="bg-gray-800">
              {option.name}
            </option>
          ))}
        </select>
      </label>
    </header>
  );
}
