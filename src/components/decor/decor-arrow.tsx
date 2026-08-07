import type { DecorTone } from "@/lib/decor/tone";
import { decorInk } from "@/lib/decor/tone";

type DecorArrowProps = {
  tone: DecorTone;
  className?: string;
};

// sits inline before a heading, same idiom as the reference's minimal "→".
export function DecorArrow({ tone, className }: DecorArrowProps) {
  return (
    <span
      aria-hidden="true"
      className={`font-mono text-[0.8em] ${className ?? ""}`}
      style={{ color: decorInk(tone) }}
    >
      →
    </span>
  );
}
