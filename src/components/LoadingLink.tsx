"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentUrl = `${pathname}?${searchParams.toString()}`;

  // Reset whenever the URL changes — same-page navigations (like tag filters)
  // don't unmount the component, so without this the spinner would hang.
  // Derived-state pattern: compare during render instead of in an effect.
  const [lastUrl, setLastUrl] = useState(currentUrl);
  const [loading, setLoading] = useState(false);
  if (currentUrl !== lastUrl) {
    setLastUrl(currentUrl);
    setLoading(false);
  }

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
