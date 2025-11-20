"use client";

import { HTMLAttributes } from "react";
import Marquee from "@/components/ui/marquee";
import { useTheme } from "next-themes";

const logos = [
  {
    name: "Sage",
    src: "/logos/sage.svg.png",
    height: "h-8",
    needsInvert: false,
  },
  {
    name: "QuickBooks",
    src: "/logos/Intuit_QuickBooks_logo.png",
    height: "h-10",
    needsInvert: true,
  },
  {
    name: "Xero",
    src: "/logos/xero.png",
    height: "h-8",
    needsInvert: false,
  },
  {
    name: "Cegid",
    src: "/logos/cegid.svg.png",
    height: "h-10",
    needsInvert: false,
  },
  {
    name: "Excel",
    src: "/logos/excel.svg.png",
    height: "h-10",
    needsInvert: false,
  },
];

function AccountingToolsCloud(props: HTMLAttributes<HTMLDivElement>) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <div {...props}>
      <p className="text-center text-sm text-muted-foreground font-medium mb-8">
        Trusted by leading accounting professionals and compatible with all major accounting software
      </p>
      <div className="relative">
        <div className="z-10 absolute left-0 inset-y-0 w-[10%] bg-gradient-to-r from-background to-transparent" />
        <div className="z-10 absolute right-0 inset-y-0 w-[10%] bg-gradient-to-l from-background to-transparent" />
        <Marquee pauseOnHover className="[--duration:30s]">
          {logos.map((logo) => (
            <div key={logo.name} className="h-12 flex items-center mx-8 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
              <img
                src={logo.src}
                alt={logo.name}
                className={`${logo.height} object-contain`}
                style={logo.needsInvert && isDark ? { filter: 'invert(1)' } : undefined}
              />
            </div>
          ))}
        </Marquee>
      </div>
    </div>
  );
}

export default AccountingToolsCloud;
