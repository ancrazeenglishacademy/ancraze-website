import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Spoken English Course Admission",
  description:
    "Ask about fees and admission to Ancraze online spoken English classes in Bangla. Call or WhatsApp +91 93824 52699 today.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Spoken English Course Admission | Ancraze",
    description:
      "Ask about fees and admission to Ancraze online spoken English classes in Bangla. Call or WhatsApp +91 93824 52699 today.",
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
