"use client";

import { useState, useRef } from "react";

export function ExpandingAddForm({
  action,
  label,
  namePlaceholder,
  nameInputClassName,
  className,
  children,
}: {
  action: (formData: FormData) => Promise<void>;
  label: string;
  namePlaceholder?: string;
  nameInputClassName: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleAction(formData: FormData) {
    await action(formData);
    setExpanded(false);
    formRef.current?.reset();
  }

  function handleFormBlur(e: React.FocusEvent) {
    if (!formRef.current?.contains(e.relatedTarget as Node)) {
      const nameVal = (formRef.current?.elements.namedItem("name") as HTMLInputElement)?.value;
      if (!nameVal) setExpanded(false);
    }
  }

  return (
    <form ref={formRef} action={handleAction} onBlur={handleFormBlur} className={className}>
      <h2 className="font-[family-name:var(--font-unica)] text-sm text-muted">{label}</h2>
      <input
        name="name"
        required
        placeholder={namePlaceholder ?? "Name *"}
        className={nameInputClassName}
        onFocus={() => setExpanded(true)}
      />
      {expanded && children}
    </form>
  );
}
