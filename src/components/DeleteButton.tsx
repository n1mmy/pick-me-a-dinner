"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

function DeleteSubmit({
  className,
  children,
  confirmMessage,
}: {
  className?: string;
  children: React.ReactNode;
  confirmMessage?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={className}
      onClick={(e) => {
        if (confirmMessage && !window.confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
    >
      {children}
    </button>
  );
}

export function DeleteButton({
  action,
  className,
  children,
  confirmMessage,
}: {
  action: () => Promise<{ error: string } | undefined>;
  className?: string;
  children: React.ReactNode;
  confirmMessage?: string;
}) {
  const [state, formAction] = useActionState(
    async () => (await action()) ?? null,
    null
  );

  return (
    <form action={formAction}>
      {state?.error && <p className="text-xs text-pink mb-1">{state.error}</p>}
      <DeleteSubmit className={className} confirmMessage={confirmMessage}>{children}</DeleteSubmit>
    </form>
  );
}
