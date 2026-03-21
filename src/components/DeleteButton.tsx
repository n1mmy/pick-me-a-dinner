"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

function DeleteSubmit({ className, children }: { className?: string; children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {children}
    </button>
  );
}

export function DeleteButton({
  action,
  className,
  children,
}: {
  action: () => Promise<{ error: string } | undefined>;
  className?: string;
  children: React.ReactNode;
}) {
  const [state, formAction] = useActionState(
    async (_prev: { error: string } | null) => (await action()) ?? null,
    null
  );

  return (
    <form action={formAction}>
      {state?.error && <p className="text-xs text-pink mb-1">{state.error}</p>}
      <DeleteSubmit className={className}>{children}</DeleteSubmit>
    </form>
  );
}
