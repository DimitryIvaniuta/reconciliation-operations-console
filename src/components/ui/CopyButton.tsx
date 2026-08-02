import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "./Button";

export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={copy}
      icon={copied ? <Check size={15} /> : <Copy size={15} />}
      aria-label={`${label}: ${value}`}
    >
      {copied ? "Copied" : label}
    </Button>
  );
}
