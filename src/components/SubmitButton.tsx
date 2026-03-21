"use client";

import { useFormStatus } from "react-dom";
import { Spinner } from "@/components/Spinner";

export function SubmitButton({
  children,
  className,
  disabled,
}: {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending || disabled} className={className}>
      {pending ? <Spinner /> : children}
    </button>
  );
}
