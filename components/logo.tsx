"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import Image from "next/image";

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export function Logo({ className = "h-6 w-auto", width = 120, height = 24 }: LogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Avoid hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <div className={className} />;
  }

  const logoSrc = resolvedTheme === "dark" ? "/logo light.png" : "/logo.png";

  return (
    <img
      src={logoSrc}
      alt="BS Convert"
      className={className}
    />
  );
}
