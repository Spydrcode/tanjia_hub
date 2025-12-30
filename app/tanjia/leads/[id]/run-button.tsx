'use client';

import { useFormStatus } from "react-dom";

type Props = {
  label: string;
  variant?: "solid" | "ghost";
};

export default function RunButton({ label, variant = "solid" }: Props) {
  const { pending } = useFormStatus();
  const base =
    variant === "solid"
      ? "bg-neutral-900 text-white hover:bg-neutral-800"
      : "border border-neutral-300 text-neutral-800 hover:border-neutral-400 hover:bg-white";

  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition ${base}`}
      disabled={pending}
    >
      {pending ? "Running..." : label}
    </button>
  );
}
