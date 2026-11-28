import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import Navbar from "@/app/componets/Navbar";
import Footer from "@/app/componets/Footer";
import { blogPosts } from "@/lib/blogPosts";
import {
  headline,
  intro,
  sections,
  tipsHeading,
  tipsIntro,
  tips,
  finalWords,
  callToAction,
  signOff,
} from "@/lib/dailySentences";

const post = blogPosts.find((p) => p.slug === "daily-use-english-sentences-bengali-meaning")!;
const url = `https://www.ancraze.com/blog/${post.slug}`;
const WHATSAPP_URL = `https://wa.me/919382452699?text=${encodeURIComponent(
  "Hello Ancraze Team! I am interested in enrolling in your Spoken English Course. Please guide me."
)}`;

export const metadata: Metadata = {
  title: post.title,
  description: post.description,
  alternates: { canonical: `/blog/${post.slug}` },
  openGraph: {
    type: "article",
    title: `${post.title} | Ancraze`,
    description: post.description,
    url,
    siteName: "Ancraze English Academy",
    publishedTime: post.date,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  headline: post.title,
  description: post.description,
  datePublished: post.date,
  inLanguage: "en",
  mainEntityOfPage: url,
  author: { "@type": "Organization", name: post.author, url: "https://www.ancraze.com" },
  publisher: { "@type": "Organization", name: post.author, url: "https://www.ancraze.com" },
};

export default function ArticlePage() {
  return (
    <div lang="en" className="min-h-screen bg-white text-slate-900 font-sans selection:bg-[#2A0066]/10 selection:text-[#2A0066]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />

      <article>
        <header className="pt-36 sm:pt-44 pb-12 bg-gradient-to-b from-purple-50/60 via-white to-white border-b border-slate-200/70">
          <div className="max-w-3xl mx-auto px-5 sm:px-6 text-center">
            <Link href="/blog" className="text-xs font-black uppercase tracking-widest text-[#2A0066] hover:underline">
              &larr; Blog
            </Link>
            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-[1.15] mt-5">
              {headline}
            </h1>
            <p className="text-sm font-bold text-slate-500 mt-6">
              By {post.author} · <time dateTime={post.date}>{post.dateLabel}</time>
            </p>
          </div>
        </header>

        <div className="max-w-3xl mx-auto px-5 sm:px-6 py-12 space-y-5 text-base sm:text-lg text-slate-700 leading-relaxed">
          {intro.map((text) => (
            <p key={text}>{text}</p>
          ))}

          {sections.map((section, i) => (
            <section key={section.heading} className="space-y-5">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight pt-6">{section.heading}</h2>
              <ol start={i * 10 + 1} className="list-decimal pl-9 sm:pl-10 divide-y divide-slate-200 border-y border-slate-200 marker:font-bold marker:text-[#2A0066]">
                {section.sentences.map(([english, bengali]) => (
                  <li key={english} className="py-3 pl-1">
                    <span className="block font-bold text-slate-900">{english}</span>
                    <span lang="bn" className="block">{bengali}</span>
                  </li>
                ))}
              </ol>
            </section>
          ))}

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight pt-6">{tipsHeading}</h2>
          {tipsIntro.map((text) => (
            <p key={text}>{text}</p>
          ))}
          {tips.map((tip) => (
            <section key={tip.heading} className="space-y-2">
              <h3 className="text-xl font-black text-slate-900">{tip.heading}</h3>
              {tip.text.map((text) => (
                <p key={text}>{text}</p>
              ))}
            </section>
          ))}

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight pt-6">Final Words</h2>
          {finalWords.map((text) => (
            <p key={text}>{text}</p>
          ))}

          <div className="mt-10 rounded-3xl bg-slate-50 border border-slate-200 p-8 text-center">
            <p className="font-bold text-slate-900">{callToAction}</p>
            <p className="font-black text-[#2A0066] mt-3">{signOff}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
              <Link href="/courses" className="px-8 py-4 bg-[#2A0066] hover:bg-[#3D0099] text-white rounded-2xl font-black text-xs uppercase tracking-widest transition">
                View Courses
              </Link>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="px-8 py-4 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-2xl font-bold text-xs uppercase tracking-wider transition">
                Connect on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </article>

      <Footer />
    </div>
  );
}
