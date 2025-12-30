'use client';

import { Button } from "@/src/components/ui/button";
import { useToast } from "@/src/components/ui/toast";

type Props = { text: string; label?: string };

export default function CopyButton({ text, label = "Copy link" }: Props) {
  const showToast = useToast();
  return (
    <Button
      type="button"
      variant="secondary"
      onClick={() => {
        navigator.clipboard?.writeText(text);
        showToast("Copied", "success");
      }}
    >
      {label}
    </Button>
  );
}
