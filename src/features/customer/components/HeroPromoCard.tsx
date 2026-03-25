import { Coffee } from "lucide-react";

type HeroPromoCardProps = {
  promoText: string;
  subtitle?: string;
};

export default function HeroPromoCard({
  promoText,
  subtitle,
}: HeroPromoCardProps) {
  return (
    <section className="rounded-3xl bg-[#D31319] text-white p-6 sm:p-8 overflow-hidden relative">
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-[2px]" />
      <div className="absolute -left-12 -bottom-14 h-48 w-48 rounded-full bg-white/10 blur-[2px]" />

      <div className="relative">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold">
          <Coffee className="h-4 w-4 shrink-0 opacity-95" aria-hidden />
          <span>Warcoop Deal</span>
        </div>

        <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold leading-tight">
          {promoText}
        </h1>

        {subtitle ? (
          <p className="mt-2 text-white/90 text-sm sm:text-base">
            {subtitle}
          </p>
        ) : null}
      </div>
    </section>
  );
}

