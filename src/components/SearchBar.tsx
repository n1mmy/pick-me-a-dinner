"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function SearchBar({ placeholder, defaultValue }: { placeholder: string; defaultValue: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<number>(0);
  const didSearchRef = useRef(false);

  useEffect(() => {
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
    window.scrollTo(0, scrollRef.current);
  }, [searchParams]);

  return (
    <div className="flex items-center gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="flex-1 border border-muted/40 rounded px-3 py-1.5 text-sm bg-surface text-fg placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-teal"
      />
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
