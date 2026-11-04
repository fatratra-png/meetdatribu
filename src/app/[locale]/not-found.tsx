import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

// Page 404, affichée dans la langue courante.
export default function NotFound() {
  const t = useTranslations("notFound");
  return (
    <section className="site-grid min-h-svh content-center pt-28">
      <p className="mono col-span-4 text-ink-soft md:col-span-12">404</p>
      <h1 className="col-span-4 mt-4 text-[length:var(--t-heading)] leading-none md:col-span-8">
        {t("title")}
      </h1>
      <Link href="/" className="dock-cta col-span-4 mt-8 w-max md:col-span-3">
        {t("back")}
      </Link>
    </section>
  );
}
