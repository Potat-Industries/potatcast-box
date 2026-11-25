import { useContext } from "react";
import { LocaleContext } from "../../providers/LocaleProvider";

export const MAIN_CONTENT_ID = "main-content";

export function SkipLink() {
  const { locale } = useContext(LocaleContext);

  return (
    <a
      href={`#${MAIN_CONTENT_ID}`}
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-black"
    >
      {locale.site.skip_to_content}
    </a>
  );
}
