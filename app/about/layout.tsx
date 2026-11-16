import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | Ancraze English Academy",
  description:
    "Discover the mission and story behind Ancraze Online Spoken English Academy. Learn how our 20 Codes Method and personal speaking trainers help Bengali speakers speak English confidently without memorizing grammar.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About Ancraze English Academy | A Different Approach to Learning English",
    description:
      "We don't just teach English. We help you speak it. Discover our 20 Codes Method taught in Bangla with dedicated 1-on-1 speaking mentors.",
    url: "https://www.ancraze.com/about",
    siteName: "Ancraze English Academy",
    images: [
      {
        url: "/student-avatar.png",
        width: 1200,
        height: 630,
        alt: "About Ancraze English Academy",
      },
    ],
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
