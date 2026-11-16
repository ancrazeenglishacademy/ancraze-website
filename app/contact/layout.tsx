import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us & Admissions Office",
  description:
    "Get in touch with Ancraze Admissions Office. Enroll in our spoken English courses taught in Bangla language with our 20 Codes Method and personal speaking trainers. Call or WhatsApp +91 93824 52699.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact Ancraze English Academy | Admissions Office",
    description:
      "Have questions about admissions, trial sessions, or our 20 Codes Method taught in Bangla? Reach out to our admissions team directly.",
    url: "https://www.ancraze.com/contact",
    siteName: "Ancraze English Academy",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "Ancraze English Academy Logo",
      },
    ],
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
