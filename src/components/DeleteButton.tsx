"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

function DeleteSubmit({
  className,
  armedClassName,
  children,
  armed,
  confirmLabel,
}: {
  className?: string;
  armedClassName?: string;
  children: React.ReactNode;
  armed: boolean;
  confirmLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-pressed={armed}
      className={armed ? armedClassName ?? className : className}
    >
      {armed ? confirmLabel ?? "Confirm?" : children}
    </button>
  );
}

export function DeleteButton({
  action,
  className,
  armedClassName,
  children,
  confirmLabel = "Tap to confirm",
  resetMs = 4000,
}: {
  action: () => Promise<{ error: string } | undefined>;
  className?: string;
  armedClassName?: string;
  children: React.ReactNode;
  /** Label shown when the button is armed for confirmation. */
  confirmLabel?: string;
  /** Auto-revert delay in ms if user doesn't confirm. */
  resetMs?: number;
}) {
  const [armed, setArmed] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction] = useActionState(
    async () => (await action()) ?? null,
    null
  );

  // Arm on first click; only submit on the confirmation click.
  const handleClickCapture = (e: React.MouseEvent<HTMLFormElement>) => {
    if (!armed) {
      e.preventDefault();
      e.stopPropagation();
      setArmed(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setArmed(false), resetMs);
    }
  };

  // Cancel armed state if user taps outside.
  useEffect(() => {
    if (!armed) return;
    const onDocClick = (e: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(e.target as Node)) {
        setArmed(false);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [armed]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <form ref={formRef} action={formAction} onClickCapture={handleClickCapture}>
      {state?.error && <p className="text-xs text-pink mb-1">{state.error}</p>}
      <DeleteSubmit
        className={className}
        armedClassName={armedClassName}
        armed={armed}
        confirmLabel={confirmLabel}
      >
        {children}
      </DeleteSubmit>
    </form>
  );
}
