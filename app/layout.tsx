import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import ScrollToTop from "./componets/ScrollToTop";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.ancraze.com";

export const viewport: Viewport = {
  themeColor: "#2A0066",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Ancraze English Academy | Best Spoken English Course in Bangla",
    template: "%s | Ancraze English Academy",
  },
  description:
    "Master spoken English in Bangla with Ancraze. Learn sentence formation effortlessly through our 20 Codes Method, 1-on-1 personal speaking trainers, 24/7 app access, and daily practice.",
  applicationName: "Ancraze English Academy",
  keywords: [
    "spoken english course in bangla",
    "learn spoken english in bengali",
    "best spoken english course in bangla language",
    "ancraze english academy",
    "20 codes method",
    "spoken english bangla",
    "english speaking practice",
    "personal english trainer",
    "bangla to english speaking",
    "spoken english kolkata",
    "online english speaking class bangla",
    "learn english in bangla app",
  ],
  authors: [{ name: "Ancraze English Academy", url: SITE_URL }],
  creator: "Ancraze English Academy",
  publisher: "Ancraze English Academy",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/favicon.ico",
    apple: "/icon.png",
  },
  openGraph: {
    type: "website",
    locale: "bn_IN",
    alternateLocale: ["en_US", "bn_BD"],
    url: SITE_URL,
    siteName: "Ancraze English Academy",
    title: "Ancraze English Academy | Best Spoken English Course in Bangla",
    description:
      "Stop memorising. Start speaking. Master practical English in Bangla with our 20 Codes Method and 1-on-1 personal speaking trainers.",
    images: [
      {
        url: "/student-avatar.png",
        width: 1200,
        height: 630,
        alt: "Ancraze English Academy - Speak English with Our 20 Codes",
      },
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "Ancraze Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ancraze English Academy | Speak English in Bangla",
    description:
      "Best Spoken English Course in Bangla Language with 20 Codes Method and personal speaking trainers.",
    images: ["/student-avatar.png"],
  },
  verification: {
    google: "googlea4aabef345f51e31",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "education",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "EducationalOrganization",
        "@id": `${SITE_URL}/#organization`,
        name: "Ancraze English Academy",
        url: SITE_URL,
        logo: `${SITE_URL}/logo.png`,
        image: `${SITE_URL}/student-avatar.png`,
        description:
          "Best Spoken English Course in Bangla Language using our 20 Codes Method, personal speaking trainers, and structured daily practice.",
        telephone: "+91 93824 52699",
        email: "Ancrazeenglishacademy@gmail.com",
        address: {
          "@type": "PostalAddress",
          streetAddress: "Abedin Arcade, Tiljala Rd, 3D, Gobra",
          addressLocality: "Kolkata",
          addressRegion: "West Bengal",
          postalCode: "700046",
          addressCountry: "IN",
        },
        sameAs: [
          "https://www.instagram.com/ancrazeenglish",
          "https://www.facebook.com/share/19tbcqR6iw/",
          "https://www.youtube.com/@AncrazeEnglishAcademy",
          "https://play.google.com/store/apps/details?id=app.ancraze.com",
          "https://apps.apple.com/in/app/ancraze/id6773675253",
        ],
      },
      {
        "@type": "Course",
        "@id": `${SITE_URL}/#course-30day`,
        name: "30-Day Foundational Spoken English Course in Bangla",
        description:
          "A structured 30-day programme designed to help you understand sentence formation and develop practical English-speaking skills through our 20 Codes Method taught in Bangla.",
        provider: {
          "@type": "EducationalOrganization",
          name: "Ancraze English Academy",
          url: SITE_URL,
        },
        inLanguage: ["bn", "en"],
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "Online",
          courseWorkload: "PT30D",
        },
      },
      {
        "@type": "Course",
        "@id": `${SITE_URL}/#course-60day`,
        name: "60-Day Foundational Spoken English Course in Bangla",
        description:
          "An extended learning programme that gives you more time to practise, revise and strengthen your English-speaking skills with double the live sessions, taught in Bangla.",
        provider: {
          "@type": "EducationalOrganization",
          name: "Ancraze English Academy",
          url: SITE_URL,
        },
        inLanguage: ["bn", "en"],
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "Online",
          courseWorkload: "PT60D",
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/#faq`,
        mainEntity: [
          {
            "@type": "Question",
            name: "What is Ancraze?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Ancraze is an online spoken English academy that helps Bengali-speaking learners develop practical English-speaking skills through lessons taught in Bangla, our 20 Codes Method, dedicated personal trainers, and structured daily practice.",
            },
          },
          {
            "@type": "Question",
            name: "Is the course taught in Bangla language?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes! All video lessons, grammar concepts, and explanations are taught in simple Bangla language so that you can understand sentence formation clearly and start speaking English naturally without confusion or fear.",
            },
          },
          {
            "@type": "Question",
            name: "What are the 20 Codes?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "The 20 Codes Method is our structured learning methodology designed to help learners understand sentence formation and develop their speaking skills systematically without memorising complex grammar rules.",
            },
          },
          {
            "@type": "Question",
            name: "Which course should I choose?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "You can choose the 30-day course, 60-day course, or Self-Study Course depending on your current level, target goals, and whether you want personal 1-on-1 speaking trainer sessions.",
            },
          },
          {
            "@type": "Question",
            name: "Do I get a personal speaking trainer?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes! Personal trainer speaking practice is included in the 30-day and 60-day foundational courses, with flexible 10, 20 and 30-minute daily practice options.",
            },
          },
        ],
      },
    ],
  };

  return (
    <html lang="bn" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ScrollToTop />
        {children}
      </body>
    </html>
  );
}
