import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Online Spoken English Courses in Bangla",
  description:
    "Compare Ancraze spoken English courses in Bangla: self-study or daily practice with a personal trainer. Choose your course and enrol on WhatsApp.",
  alternates: {
    canonical: "/courses",
  },
  openGraph: {
    title: "Online Spoken English Courses in Bangla | Ancraze",
    description:
      "Compare Ancraze spoken English courses in Bangla: self-study or daily practice with a personal trainer. Choose your course and enrol on WhatsApp.",
    url: "https://www.ancraze.com/courses",
    siteName: "Ancraze English Academy",
    images: [
      {
        url: "/student-avatar.png",
        width: 1200,
        height: 630,
        alt: "Ancraze Spoken English Courses",
      },
    ],
  },
};

export default function CoursesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
