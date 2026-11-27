import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Our Online Spoken English Academy",
  description:
    "Meet Ancraze, an online spoken English academy for Bengali speakers. Learn through Bangla with our 20 Codes Method. Explore our courses and enrol today.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About Our Online Spoken English Academy | Ancraze",
    description:
      "Meet Ancraze, an online spoken English academy for Bengali speakers. Learn through Bangla with our 20 Codes Method. Explore our courses and enrol today.",
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
