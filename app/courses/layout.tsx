import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Spoken English Courses in Bangla",
  description:
    "Explore our structured spoken English courses taught in Bangla. Featuring the 20 Codes Method, 1-on-1 personal speaking trainer sessions, 24/7 app access, and live interactive classes.",
  alternates: {
    canonical: "/courses",
  },
  openGraph: {
    title: "Our Spoken English Courses in Bangla | Ancraze English Academy",
    description:
      "Explore our structured spoken English courses taught in Bangla. Featuring the 20 Codes Method, 1-on-1 personal speaking trainer sessions, 24/7 app access, and live interactive classes.",
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
