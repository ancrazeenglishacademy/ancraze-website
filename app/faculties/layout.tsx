import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Faculties & Speaking Mentors | Ancraze English Academy",
  description:
    "Meet our certified speaking trainers and language coaches at Ancraze English Academy. Providing dedicated 1-on-1 speaking guidance, live corrections, and constant motivation in Bangla.",
  alternates: {
    canonical: "/faculties",
  },
  openGraph: {
    title: "Our Faculties & Mentors | Ancraze English Academy",
    description:
      "Learn from dedicated spoken English mentors. Certified trainers who guide you 1-on-1 to speak English with natural fluency.",
    url: "https://www.ancraze.com/faculties",
    siteName: "Ancraze English Academy",
    images: [
      {
        url: "/student-avatar.png",
        width: 1200,
        height: 630,
        alt: "Ancraze Speaking Mentors & Faculties",
      },
    ],
  },
};

export default function FacultiesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
