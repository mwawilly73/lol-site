// components/HeroRotator.tsx
"use client";

import Image from "next/image";
import { PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from "react";

type Props = {
  images: string[];
  intervalMs?: number;
  className?: string;
};

export default function HeroRotator({
  images,
  intervalMs = 5000,
  className = "",
  children,
}: PropsWithChildren<Props>) {
  const safeImages = useMemo(
    () => images.filter((u) => typeof u === "string" && u.length > 0),
    [images]
  );

  const [idx, setIdx] = useState(0);
  const [allowRotate, setAllowRotate] = useState(false);
  const timerRef = useRef<number | null>(null);
  const firstLoadedRef = useRef(false);

  const ROTATE_START_DELAY_MS = Math.max(intervalMs + 2000, 6000);

  const scheduleIdle = useCallback((cb: () => void, timeout = 2600) => {
    const w = window as unknown as {
      requestIdleCallback?: (fn: () => void, o?: { timeout: number }) => number;
    };
    if (typeof w.requestIdleCallback === "function") {
      w.requestIdleCallback(cb, { timeout });
    } else {
      window.setTimeout(cb, timeout);
    }
  }, []);

  useEffect(() => {
    if (!allowRotate || safeImages.length <= 1) return;
    timerRef.current = window.setInterval(() => {
      setIdx((i) => (i + 1) % safeImages.length);
    }, intervalMs) as unknown as number;
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [allowRotate, safeImages, intervalMs]);

  useEffect(() => {
    if (!allowRotate || safeImages.length <= 1) return;
    const next = safeImages[(idx + 1) % safeImages.length];

    type ImgWithFetchPriority = HTMLImageElement & { fetchPriority?: "high" | "low" | "auto" };

    scheduleIdle(() => {
      const pre = new window.Image() as ImgWithFetchPriority;
      pre.decoding = "async";
      pre.referrerPolicy = "no-referrer";
      pre.fetchPriority = "low";
      pre.src = next;
    }, 1200);
  }, [allowRotate, idx, safeImages, scheduleIdle]);

  const onFirstLoaded = useCallback(() => {
    if (firstLoadedRef.current) return;
    firstLoadedRef.current = true;
    window.setTimeout(() => setAllowRotate(true), ROTATE_START_DELAY_MS);
  }, [ROTATE_START_DELAY_MS]);

  if (safeImages.length === 0) {
    return (
      <div className={`relative rounded-2xl ring-1 ring-white/10 bg-white/5 ${className}`}>
        <div className="px-4 py-10 text-center">
          <h1 className="text-2xl font-bold">LoL Quiz</h1>
          <p className="text-white/80 mt-1">Bienvenue !</p>
          {children}
        </div>
      </div>
    );
  }

  const current = safeImages[idx];

  const SIZES =
    "(min-width: 1280px) 1152px, (min-width: 640px) calc(100vw - 2rem), calc(100vw - 1.5rem)";

  const isDev = process.env.NODE_ENV !== "production";
  const priority = isDev ? true : idx === 0;
  const loading: "eager" | "lazy" | undefined = priority ? undefined : idx === 0 ? "eager" : "lazy";

  return (
    <section
      className={`relative overflow-hidden rounded-2xl ring-1 ring-white/10 ${className}`}
      aria-label="Mise en avant"
    >
      <div className="relative h-[42vh] min-h-[260px] sm:h-[52vh]">
        <Image
          src={current}
          alt=""
          fill
          sizes={SIZES}
          quality={80}
          priority={priority}
          {...(loading ? { loading } : {})}   // ⬅️ on n’envoie pas loading si priority=true
          className="object-cover object-center"
          onLoad={idx === 0 ? onFirstLoaded : undefined}
        />

        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-black/45" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>

        <div className="absolute inset-0 flex items-center justify-center px-4">
          <div className="text-center">{children}</div>
        </div>
      </div>
    </section>
  );
}
