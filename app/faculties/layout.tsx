import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Spoken English Trainers and Mentors",
  description:
    "Meet Ancraze spoken English mentors offering 1-on-1 speaking practice, live corrections and guidance in Bangla. Ask about our courses today.",
  alternates: {
    canonical: "/faculties",
  },
  openGraph: {
    title: "Spoken English Trainers and Mentors | Ancraze",
    description:
      "Meet Ancraze spoken English mentors offering 1-on-1 speaking practice, live corrections and guidance in Bangla. Ask about our courses today.",
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
