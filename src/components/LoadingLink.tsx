"use client";

import { useState } from "react";
import Link from "next/link";
import { Spinner } from "@/components/Spinner";

export function LoadingLink({
  href,
  children,
  className,
  scroll,
  "aria-label": ariaLabel,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  scroll?: boolean;
  "aria-label"?: string;
}) {
  const [loading, setLoading] = useState(false);
  return (
    <Link
      href={href}
      scroll={scroll}
      className={className}
      aria-label={ariaLabel}
      onClick={() => setLoading(true)}
    >
      {loading ? <Spinner inline /> : children}
    </Link>
  );
}
