"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function SearchBar({ placeholder }: { placeholder: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(() => searchParams.get("q") ?? "");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<number>(0);
  const didSearchRef = useRef(false);
  const isMountedRef = useRef(false);

  const isLoading = value !== (searchParams.get("q") ?? "");

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      scrollRef.current = window.scrollY;
      didSearchRef.current = true;
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set("q", value);
      } else {
        params.delete("q");
      }
      params.delete("page");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!didSearchRef.current) return;
    didSearchRef.current = false;
    window.scrollTo(0, scrollRef.current);
  }, [searchParams]);

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full border border-muted/40 rounded px-3 py-1.5 text-sm bg-surface text-fg placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-teal"
        />
        {isLoading && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-teal/30 border-t-teal rounded-full animate-spin" />
        )}
      </div>
      {value && (
        <button
          type="button"
          onClick={() => setValue("")}
          className="text-xs text-muted hover:text-pink transition-colors cursor-pointer"
        >
          Clear
        </button>
      )}
    </div>
  );
}
