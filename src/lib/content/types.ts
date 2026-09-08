import type { IconType } from "react-icons";

// keep the evidence beside the claim so future copy has something to check.
export type ProofItem = {
  text: string;
  source: string;
};

export type ProjectLink = {
  kind: "live" | "source" | "case-study";
  url: string;
};

export type CaseStudy = {
  slug: string;
  title: string;
  blurb: string;
  stack: readonly string[];
  thumbnail: string;
  collection: "flagship" | "more-builds";
  status: "SHIPPED" | "CAPSTONE" | "EXPERIMENT" | "PREVIOUS PORTFOLIO" | null;
  problem: ProofItem | null;
  role: ProofItem | null;
  built: readonly ProofItem[];
  evidence: readonly ProofItem[];
  outcome: ProofItem | null;
  links: readonly ProjectLink[];
  // null means i still need the owner's facts, not a made-up success story.
  ownerInputs: readonly (
    | "problem"
    | "role"
    | "technical-decision"
    | "outcome"
    | "source-url"
    | "status"
    | "cover"
    | "public-demo"
  )[];
};

export type SkillGroupId =
  "interface" | "systems" | "data-ai" | "tools-delivery";

export type SkillGroup = { id: SkillGroupId; label: string };

export type Skill = {
  id: string;
  name: string;
  icon: IconType;
  color: string;
  ring: 1 | 2;
  order: number;
  group: SkillGroupId;
  proof: ProofItem | null;
  ownerInputs: readonly "proof"[];
};
