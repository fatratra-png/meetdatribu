import Image from "next/image";
import { PARTNERS } from "@/content/hei";

/**
 * Bandeau infini des partenaires : la liste est dupliquée et défile en boucle
 * (animation CSS). Pause au survol ; en mouvement réduit, les logos
 * s'affichent simplement en grille.
 */
export default function PartnersMarquee({ label }: { label: string }) {
  const row = (hidden: boolean) => (
    <ul className="marquee-row" aria-hidden={hidden || undefined}>
      {PARTNERS.map((p) => (
        <li key={p.name}>
          <Image src={p.logo} alt={hidden ? "" : p.name} width={160} height={80} sizes="160px" />
        </li>
      ))}
    </ul>
  );
  return (
    <div className="marquee" role="region" aria-label={label}>
      <div className="marquee-track">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
