"use client";

import { useEffect, useState } from "react";
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
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Reset whenever the URL changes — same-page navigations (like tag filters)
  // don't unmount the component, so without this the spinner would hang.
  useEffect(() => {
    setLoading(false);
  }, [pathname, searchParams]);

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
