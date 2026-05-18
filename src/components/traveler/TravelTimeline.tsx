import { useState, useEffect } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "../ui/carousel";
import { Polaroid, type PolaroidProps } from "./Polaroid";
import { YearMarker } from "./YearMarker";

type Place = PolaroidProps & { yearMonth: string };

export interface TravelTimelineProps {
  places: Place[];
}

// NOTE: embla-carousel-wheel-gestures ships an ESM file with no `"type": "module"`
// in its package.json, which crashes Node during Astro SSR. We dynamically import
// the plugin client-side only so SSR/prerender never touches it.
export function TravelTimeline({ places }: TravelTimelineProps) {
  const [api, setApi] = useState<CarouselApi | undefined>(undefined);
  const [plugins, setPlugins] = useState<any[]>([]);
  const [activeYear, setActiveYear] = useState<number>(() =>
    places[0] ? Number(places[0].yearMonth.slice(0, 4)) : new Date().getFullYear()
  );

  useEffect(() => {
    let cancelled = false;
    import("embla-carousel-wheel-gestures").then((mod) => {
      if (cancelled) return;
      const WheelGesturesPlugin = (mod as any).default ?? (mod as any).WheelGesturesPlugin ?? mod;
      setPlugins([WheelGesturesPlugin()]);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!api) return;
    const handler = () => {
      const idx = api.selectedScrollSnap();
      const p = places[idx];
      if (p) setActiveYear(Number(p.yearMonth.slice(0, 4)));
    };
    api.on("select", handler);
    handler();
    return () => { api.off("select", handler); };
  }, [api, places]);

  const countThisYear = places.filter((p) => p.yearMonth.startsWith(String(activeYear))).length;

  return (
    <div className="relative" data-embla-no-js>
      <YearMarker year={activeYear} count={countThisYear} />
      <Carousel
        opts={{ align: "start", dragFree: true, loop: false }}
        plugins={plugins}
        setApi={setApi}
        className="mt-4"
      >
        <CarouselContent className="-ml-4">
          {places.map((p) => (
            <CarouselItem key={p.slug} className="pl-4 basis-auto">
              <Polaroid {...p} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}
