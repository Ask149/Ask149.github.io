export interface PolaroidProps {
  slug: string;
  title: string;
  country: string;
  airportCode?: string;
  yearMonth: string;
  image: { src: string; alt: string };
  caption?: string;
}

function jitter(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) | 0;
  return ((h % 400) / 100) - 2;
}

export function Polaroid({ slug, title, country, airportCode, yearMonth, image, caption }: PolaroidProps) {
  const rotate = jitter(slug);
  return (
    <figure
      style={{ transform: `rotate(${rotate}deg)` }}
      className="bg-[color:var(--polaroid-bg)] shadow-[var(--polaroid-shadow)] p-3 pb-6 w-56 select-none"
    >
      {image.src ? (
        <img src={image.src} alt={image.alt} className="w-full h-48 object-cover" />
      ) : (
        <div className="w-full h-48 grid place-items-center bg-[color:var(--rule)] font-mono text-2xl text-[color:var(--fg-muted)]">
          {airportCode ?? title.slice(0, 3).toUpperCase()}
        </div>
      )}
      <figcaption className="mt-3 font-display text-base text-[color:var(--fg)]">
        {title}, {country}
        <div className="font-mono text-xs text-[color:var(--fg-muted)] mt-1">
          {yearMonth}{airportCode ? ` · ${airportCode}` : ""}
        </div>
        {caption && <p className="font-body text-sm mt-2 text-[color:var(--fg-muted)]">{caption}</p>}
      </figcaption>
    </figure>
  );
}
