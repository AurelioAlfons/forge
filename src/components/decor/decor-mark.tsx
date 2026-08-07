import type { DecorTone } from "@/lib/decor/tone";
import { decorInk } from "@/lib/decor/tone";

export type DecorMarkVariant = "pair" | "triad" | "orbit" | "stack" | "quad";

type DecorMarkProps = {
  variant: DecorMarkVariant;
  tone: DecorTone;
  /** Accent dot color. Defaults to the page's gold. */
  accent?: string;

  /** Size of the whole mark. Defaults to arrow-sized 1.8em. */
  size?: string | number;

  className?: string;
};

const VIEWBOX = 24;

export function DecorMark({
  variant,
  tone,
  accent = "#dfa812",
  size = "1.8em",
  className,
}: DecorMarkProps) {
  const ink = decorInk(tone);

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
      className={className}
      style={{
        display: "block",
        flexShrink: 0,
      }}
    >
      {/* ===== PAIR ===== */}
      {variant === "pair" && (
        <>
          <circle cx={8} cy={9} r={4} fill={ink} />
          <circle cx={15.5} cy={15} r={4} fill={accent} />
        </>
      )}

      {/* ===== TRIAD ===== */}
      {variant === "triad" && (
        <>
          <circle cx={7} cy={7} r={3.5} fill={ink} />

          <circle
            cx={17}
            cy={7}
            r={3.5}
            fill="none"
            stroke={ink}
            strokeWidth={1.5}
          />

          <circle cx={12} cy={17} r={3.5} fill={accent} />
        </>
      )}

      {/* ===== ORBIT ===== */}
      {variant === "orbit" && (
        <>
          <circle
            cx={12}
            cy={12}
            r={8}
            fill="none"
            stroke={ink}
            strokeWidth={1.4}
            opacity={0.55}
          />

          <circle cx={12} cy={4} r={3} fill={accent} />
        </>
      )}

      {/* ===== STACK ===== */}
      {variant === "stack" && (
        <>
          <circle
            cx={9}
            cy={9}
            r={6}
            fill="none"
            stroke={ink}
            strokeWidth={1.5}
          />

          <circle
            cx={15}
            cy={15}
            r={6}
            fill="none"
            stroke={ink}
            strokeWidth={1.5}
            opacity={0.5}
          />
        </>
      )}

      {/* ===== QUAD ===== */}
      {variant === "quad" && (
        <>
          <circle cx={7} cy={7} r={3} fill={ink} />

          <circle
            cx={17}
            cy={7}
            r={3}
            fill="none"
            stroke={ink}
            strokeWidth={1.4}
          />

          <circle
            cx={7}
            cy={17}
            r={3}
            fill="none"
            stroke={ink}
            strokeWidth={1.4}
          />

          <circle cx={17} cy={17} r={3} fill={accent} />
        </>
      )}
    </svg>
  );
}
