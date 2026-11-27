import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "English Speaking Practice App and Training",
  description:
    "Get Bangla lessons, the 20 Codes Method, app practice and trainer-guided speaking courses. See what Ancraze provides and enrol today.",
  alternates: {
    canonical: "/what-we-provide",
  },
  openGraph: {
    title: "English Speaking Practice App and Training | Ancraze",
    description:
      "Get Bangla lessons, the 20 Codes Method, app practice and trainer-guided speaking courses. See what Ancraze provides and enrol today.",
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
