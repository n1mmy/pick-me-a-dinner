"use client";

import { useState } from "react";
import Link from "next/link";
import { Spinner } from "@/components/Spinner";

export function LoadingLink({
  href,
  children,
  className,
  scroll,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  scroll?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  return (
    <Link href={href} scroll={scroll} className={className} onClick={() => setLoading(true)}>
      {loading ? <Spinner inline /> : children}
    </Link>
  );
}
