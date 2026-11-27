import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Why Choose Our 20 Codes Method",
  description:
    "Discover why Ancraze is the #1 choice for Bengali speakers to master Spoken English. Explore our 20 Codes Method, daily 1-on-1 personal speaking trainers, and 24/7 mobile learning app.",
  alternates: {
    canonical: "/why-ancraze",
  },
  openGraph: {
    title: "Why Choose Ancraze English Academy | The Ancraze Difference",
    description:
      "Stop memorising complicated grammar rules. Learn practical English sentence construction in Bangla with our 20 Codes Method and personal speaking trainers.",
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
