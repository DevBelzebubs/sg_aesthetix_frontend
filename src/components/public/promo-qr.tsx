"use client";

import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";

type PromoQRProps = {
  slug: string;
  size?: number;
};

export function PromoQR({ slug, size = 200 }: PromoQRProps) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(`${window.location.origin}/${slug}/promocion`);
  }, [slug]);

  if (!url) {
    return (
      <div
        style={{ width: size, height: size }}
        className="animate-pulse bg-neutral-200"
      />
    );
  }

  return (
    <div className="inline-flex flex-col items-center gap-3">
      <div className="border border-black/10 bg-white p-3">
        <QRCodeSVG value={url} size={size - 24} />
      </div>
      <p className="text-[9px] font-semibold uppercase tracking-widest text-neutral-400">
        Escanea para recibir una recompensa
      </p>
    </div>
  );
}
