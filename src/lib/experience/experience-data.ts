export type ExperienceEntry = {
  id: string;
  role: string;
  organization: string;
  start: string;
  end: string | "present";
  description: string;
  tags?: readonly string[];
};

export const experience: readonly ExperienceEntry[] = [
  {
    id: "everything-you-need-swe-intern",
    role: "Software Developer, Internship",
    organization: "Everything You Need",
    start: "2024-01",
    end: "2025-01",
    description:
      "Shipped Flutter features into a live production app — theming, responsive layout fixes, and Stripe-based HR/payroll functionality — plus REST integrations against Firebase Firestore, working an Agile sprint workflow through BitBucket and Asana.",
    tags: ["Flutter", "Firebase", "Stripe", "Agile", "BitBucket"],
  },
  {
    id: "vusu-digital-media",
    role: "Digital Media & Marketing Officer (Volunteer)",
    organization: "VUSU & VU Computer Science Society",
    start: "2024-07",
    end: "2024-12",
    description:
      "Led a beginner-friendly app development workshop and designed posters, videos, and promotional material for university campaigns and events, balancing the work alongside full-time study and a concurrent internship.",
    tags: ["Workshops", "Design", "Content"],
  },
] as const;
