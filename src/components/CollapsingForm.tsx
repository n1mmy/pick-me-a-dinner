"use client";

import { useRef } from "react";

export function CollapsingForm({
  action,
  className,
  children,
}: {
  action: (formData: FormData) => Promise<void>;
  className?: string;
  children: React.ReactNode;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  async function handleAction(formData: FormData) {
    await action(formData);
    const details = formRef.current?.closest("details");
    if (details) details.open = false;
  }

  return (
    <form ref={formRef} action={handleAction} className={className}>
      {children}
    </form>
  );
}
