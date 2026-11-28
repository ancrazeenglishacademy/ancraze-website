import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/app/componets/Navbar";
import Footer from "@/app/componets/Footer";
import { blogPosts } from "@/lib/blogPosts";

const title = "Spoken English Tips for Bengali Speakers";
const description =
  "Read simple spoken English tips for Bengali speakers from Ancraze. Practise daily, build confidence and start speaking English.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/blog" },
  openGraph: {
    title: `${title} | Ancraze`,
    description,
    url: "https://www.ancraze.com/blog",
    siteName: "Ancraze English Academy",
  },
};

export default function BlogPage() {
  return (
    <div lang="en" className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-[#2A0066]/10 selection:text-[#2A0066]">
      <Navbar />

      <section className="pt-36 sm:pt-44 pb-16 bg-gradient-to-b from-purple-50/60 via-white to-slate-50 border-b border-slate-200/70">
        <div className="max-w-[1320px] mx-auto px-5 sm:px-6 text-center">
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-[1.12] max-w-4xl mx-auto">
            Spoken English Tips for Bengali Speakers
          </h1>
          <p className="text-slate-600 text-base sm:text-lg font-medium leading-relaxed max-w-3xl mx-auto mt-6">
            Simple articles to help you practise daily and speak English with confidence.
          </p>
        </div>
      </section>

      <main className="max-w-[1320px] mx-auto px-5 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {blogPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="flex flex-col bg-white border border-slate-200/80 rounded-3xl p-7 shadow-sm hover:shadow-xl transition"
            >
              <p className="text-xs font-bold text-slate-500">
                <time dateTime={post.date}>{post.dateLabel}</time>
              </p>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight mt-3">
                {post.title}
              </h2>
              <p className="text-sm text-slate-600 font-medium leading-relaxed mt-3 flex-1">
                {post.description}
              </p>
              <span className="text-xs font-black uppercase tracking-widest text-[#2A0066] mt-6">
                Read Article &rarr;
              </span>
            </Link>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
