import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Why Trust Ancraze for Spoken English",
  description:
    "See the 5 pillars that make Ancraze the most effective spoken English academy for Bengali speakers. Explore our courses and start speaking.",
  alternates: {
    canonical: "/why-ancraze",
  },
  openGraph: {
    title: "Why Trust Ancraze for Spoken English | Ancraze",
    description:
      "See the 5 pillars that make Ancraze the most effective spoken English academy for Bengali speakers. Explore our courses and start speaking.",
    url: "https://www.ancraze.com/why-ancraze",
    siteName: "Ancraze English Academy",
    images: [
      {
        url: "/student-avatar.png",
        width: 1200,
        height: 630,
        alt: "Why Choose Ancraze English Academy",
      },
    ],
  },
};

export default function WhyAncrazeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
