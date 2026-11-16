import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "What We Provide | Comprehensive Spoken English Learning System",
  description:
    "Explore the complete features of the Ancraze English learning ecosystem: 24/7 mobile app access, 1-on-1 personal speaking mentors, 20 Codes Method, 300 essential verbs, and weekly live revision sessions.",
  alternates: {
    canonical: "/what-we-provide",
  },
  openGraph: {
    title: "What We Provide | Ancraze English Academy",
    description:
      "A complete learning environment for Bangla speakers: personal speaking trainers, interactive app drills, structured vocabulary, and live public speaking classes.",
    url: "https://www.ancraze.com/what-we-provide",
    siteName: "Ancraze English Academy",
    images: [
      {
        url: "/student-avatar.png",
        width: 1200,
        height: 630,
        alt: "What We Provide at Ancraze English Academy",
      },
    ],
  },
};

export default function WhatWeProvideLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
