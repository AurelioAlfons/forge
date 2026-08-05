import type { CSSProperties } from "react";
import { inkFor, type BlockOffset } from "@/lib/skills/config";
import type { Skill } from "@/lib/skills/skills-data";

// flat-top so the offset columns actually tile. pointy-top left gaps.
// clip-path eats borders and shadows, so the rim is its own layer under the
// face and the glow is a drop-shadow, which follows the clipped shape.
const HEX_CLIP =
  "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)";

// cells keep true zero-gap pitch, the tile just draws smaller inside its own
// cell. that way the gap comes out even on every edge.
const TILE_SCALE = 0.92;
const TILE_W = (2 * TILE_SCALE).toFixed(4);
const TILE_H = (Math.sqrt(3) * TILE_SCALE).toFixed(4);

type SkillHexagonProps = {
  skill: Skill;
  offset: BlockOffset;
};

export function SkillHexagon({ skill, offset }: SkillHexagonProps) {
  const { icon: Icon, color, name, id } = skill;
  const ink = inkFor(color);

  // fan radius and gap in px, cell offsets in hex units, so a resize can't
  // drag either block back over the fan.
  const position: CSSProperties = {
    left: `calc(50% + var(--skill-fan-r, 0px) * ${offset.side} + var(--skill-gap, 0px) * ${offset.side} + var(--skill-hex-s, 0px) * ${(offset.x * offset.side).toFixed(6)})`,
    top: `calc(50% + var(--skill-hex-s, 0px) * ${offset.y.toFixed(6)})`,
  };

  return (
    <li className="absolute -translate-x-1/2 -translate-y-1/2" style={position}>
      {/* the one element gsap touches. opacity and scale only */}
      <div data-skill-hex={id} style={{ opacity: 0, transform: "scale(0.6)" }}>
        {/* hover gets its own element, otherwise its transform fights the
            scale gsap is scrubbing on the parent */}
        <div
          className="skill-hex-tile"
          style={
            {
              "--hex-color": color,
              width: `calc(var(--skill-hex-s, 0px) * ${TILE_W})`,
              height: `calc(var(--skill-hex-s, 0px) * ${TILE_H})`,
            } as CSSProperties
          }
        >
          {/* rim lit upper-left, falling to shadow lower-right. that one
              gradient is what sells the bevel */}
          <div
            className="relative h-full w-full"
            style={{
              clipPath: HEX_CLIP,
              background: `linear-gradient(155deg, color-mix(in srgb, ${color} 35%, #ffffff) 0%, ${color} 45%, color-mix(in srgb, ${color} 55%, #000000) 100%)`,
            }}
          >
            {/* face is the brand colour barely touched. mixing it into
                near-black is what ate all the saturation before */}
            <div
              className="absolute"
              style={{
                clipPath: HEX_CLIP,
                inset: "calc(var(--skill-hex-s, 0px) * 0.07)",
                background: `linear-gradient(155deg, color-mix(in srgb, ${color} 82%, #ffffff) 0%, ${color} 48%, color-mix(in srgb, ${color} 80%, #000000) 100%)`,
              }}
            >
              {/* gloss across the top, cut off hard at the midline so it reads
                  as a lit curve and not a wash */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(155deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.16) 32%, rgba(255,255,255,0) 50%)",
                }}
              />

              {/* no label, the logo is the point. names still go out through
                  the sr-only list in skills-overlay */}
              <div className="absolute inset-0 grid place-items-center">
                <Icon
                  aria-hidden="true"
                  style={{
                    color: ink,
                    width: "calc(var(--skill-hex-s, 0px) * 0.62)",
                    height: "calc(var(--skill-hex-s, 0px) * 0.62)",
                    filter:
                      ink === "#ffffff"
                        ? "drop-shadow(0 1px 2px rgba(0,0,0,0.45))"
                        : "drop-shadow(0 1px 2px rgba(255,255,255,0.25))",
                  }}
                />
                <span className="sr-only">{name}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}
