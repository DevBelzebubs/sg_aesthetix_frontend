"use client";

import { useTheme } from "@/contexts/theme-context";

type Props = {
  brandName: string;
};

export function FooterLogo({ brandName }: Props) {
  const { theme } = useTheme();

  return (
    <img
      src={
        theme === "dark"
          ? "https://res.cloudinary.com/dp1vgjhsq/image/upload/v1780970216/ChatGPT_Image_4_jun_2026_18_53_34_qwlk6n.png"
          : "https://res.cloudinary.com/dp1vgjhsq/image/upload/v1779981307/LOGOTIPO_tsrnvl.png"
      }
      alt={brandName}
      className="h-[80px] w-auto scale-150"
    />
  );
}
