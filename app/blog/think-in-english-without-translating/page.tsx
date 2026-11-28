import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import Navbar from "@/app/componets/Navbar";
import Footer from "@/app/componets/Footer";
import { blogPosts } from "@/lib/blogPosts";

const post = blogPosts.find((p) => p.slug === "think-in-english-without-translating")!;
const url = `https://www.ancraze.com/blog/${post.slug}`;
const headline =
  "How to Stop Translating Bengali into English in Your Mind and Start Thinking Directly in English";
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

function H2({ children }: { children: ReactNode }) {
  return <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight pt-6">{children}</h2>;
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc pl-6 space-y-1.5 marker:text-[#2A0066]">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function Quote({ children, lang }: { children: ReactNode; lang?: string }) {
  return (
    <p lang={lang} className="border-l-4 border-[#2A0066] bg-purple-50/60 rounded-r-xl px-5 py-3 font-bold text-slate-900">
      {children}
    </p>
  );
}

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
          <p>Have you ever tried to speak English but found yourself translating every Bengali sentence into English first? You know what you want to say, but you cannot find the right English words quickly. By the time you complete the translation, the conversation may have already moved on.</p>
          <p>If this happens to you, don&apos;t worry. You are not alone. Many Bengali speakers face this problem while learning English.</p>
          <p>The good news is that you can overcome it with regular practice. The secret is simple: <strong>Stop translating. Start thinking in English!</strong></p>
          <p>Let&apos;s learn how.</p>

          <H2>1. Understand Why You Translate</H2>
          <p>When you learn English, your brain naturally uses Bengali because it is your first language or the language you are most comfortable with.</p>
          <p>For example, when you want to say:</p>
          <Quote lang="bn">“আমি বাজারে যাচ্ছি।”</Quote>
          <p>First, you think in Bengali. Then you translate it into English: “I am going to the market.”</p>
          <p>This process takes extra time. It makes your speaking slow and sometimes creates confusion.</p>
          <p>To speak English fluently, you need to train your brain to understand and express ideas directly in English.</p>

          <H2>2. Start with Simple English Thoughts</H2>
          <p>Don&apos;t try to think about complicated things in English. Start with small and simple sentences.</p>
          <p>For example:</p>
          <List items={["I am hungry.", "I am thirsty.", "I feel sleepy.", "It is raining.", "I need some water.", "Where is my phone?", "I have to go outside.", "What should I do now?"]} />
          <p>Whenever you have a simple thought, try to express it directly in English.</p>
          <p>Remember, you don&apos;t need advanced vocabulary to think in English.</p>

          <H2>3. Talk to Yourself in English</H2>
          <p>One of the easiest ways to develop English thinking is to talk to yourself.</p>
          <p>You don&apos;t always need a speaking partner. You can practise English alone.</p>
          <p>For example, when you wake up in the morning, think:</p>
          <List items={["I have just woken up.", "I need to brush my teeth.", "I should take a shower.", "What should I have for breakfast?", "I have a lot of work to do today."]} />
          <p>You can also describe what you are doing throughout the day.</p>
          <p>This simple habit will help your brain become more comfortable with English.</p>

          <H2>4. Describe Everything Around You</H2>
          <p>Look around and try to describe the things you see in English.</p>
          <p>For example:</p>
          <List items={["This is my mobile phone.", "The fan is running.", "My mother is cooking.", "There are three people in the room.", "A man is riding a bicycle.", "The children are playing outside."]} />
          <p>Don&apos;t worry about making mistakes. Your goal is to connect things directly with English words instead of translating their names from Bengali.</p>

          <H2>5. Learn Words in Groups, Not Separately</H2>
          <p>Learning individual English words is useful, but learning words in meaningful groups is even better.</p>
          <p>For example, instead of learning only the word “decision”, learn these expressions:</p>
          <List items={["Make a decision.", "Take a decision.", "Change your decision.", "Make the right decision."]} />
          <p>Similarly, learn useful everyday expressions:</p>
          <List items={["By the way", "As far as I know", "I don't think so.", "It depends on you.", "Let me think.", "I have no idea.", "What do you mean?"]} />
          <p>When you learn complete expressions, you can use them naturally without translating every word.</p>

          <H2>6. Stop Being Afraid of Making Mistakes</H2>
          <p>Many learners cannot think directly in English because they are afraid of making grammatical mistakes.</p>
          <p>They try to prepare perfect sentences in their minds before speaking.</p>
          <p>This habit makes them slow and less confident.</p>
          <p>Remember, fluency does not mean speaking perfect English. It means expressing your thoughts clearly and naturally.</p>
          <p>Start with simple sentences. Even if your English is not perfect, keep practising.</p>
          <p>Don&apos;t wait to speak perfect English. Speak English to become better!</p>

          <H2>7. Listen to English Every Day</H2>
          <p>Listening plays an important role in developing the ability to think in English.</p>
          <p>Listen to simple English conversations, short stories, podcasts and videos.</p>
          <p>At first, you may understand only a few sentences. That&apos;s completely fine.</p>
          <p>Try to understand the meaning directly instead of translating every sentence into Bengali.</p>
          <p>You can also repeat the sentences you hear. This will help you develop natural sentence patterns and improve your pronunciation.</p>

          <H2>8. Practise Thinking in English for 10 Minutes Every Day</H2>
          <p>Make a small daily challenge for yourself.</p>
          <p>Spend at least 10 minutes thinking only in English.</p>
          <p>You can think about:</p>
          <List items={["What did I do today?", "What am I going to do tomorrow?", "What happened yesterday?", "What makes me happy?", "What are my future plans?", "What would I do if I had more money?"]} />
          <p>Try to answer these questions in your mind without using Bengali.</p>
          <p>With regular practice, you will gradually find it easier to think in English.</p>

          <H2>9. Follow the English-First Rule</H2>
          <p>From today, make one simple promise to yourself:</p>
          <p>Whenever you want to express something, try to find the English words first.</p>
          <p>For example, instead of thinking:</p>
          <Quote lang="bn">“আমার খুব খিদে পেয়েছে।”</Quote>
          <p>Try to think directly:</p>
          <Quote>“I am very hungry.”</Quote>
          <p>Instead of:</p>
          <Quote lang="bn">“আমি জানি না সে কোথায় থাকে।”</Quote>
          <p>Think:</p>
          <Quote>“I don&apos;t know where he lives.”</Quote>
          <p className="text-sm text-slate-500">The Bengali word <span lang="bn">“সে”</span> can mean “he” or “she”, so use “where she lives” when talking about a woman or girl.</p>
          <p>The more you practise this habit, the less you will depend on Bengali translation.</p>

          <H2>A Simple 10-Minute Daily Practice Plan</H2>
          <p>You can follow this routine every day:</p>
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-sm sm:text-base">
              <thead className="bg-[#2A0066] text-white">
                <tr>
                  <th scope="col" className="px-5 py-3 whitespace-nowrap">Time</th>
                  <th scope="col" className="px-5 py-3">Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {[
                  ["2 minutes", "Think about your morning routine in English"],
                  ["2 minutes", "Describe the things around you"],
                  ["3 minutes", "Talk to yourself about your day"],
                  ["3 minutes", "Think about a topic and express your opinions"],
                ].map(([time, activity]) => (
                  <tr key={activity}>
                    <td className="px-5 py-3 font-bold whitespace-nowrap">{time}</td>
                    <td className="px-5 py-3">{activity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>Just 10 minutes of daily practice can help you gradually develop the habit of thinking in English.</p>

          <H2>Final Thoughts</H2>
          <p>Learning to think in English is not something that happens overnight. It requires patience, practice and consistency.</p>
          <p>You don&apos;t need to stop speaking Bengali. You simply need to train your brain to use English directly when you want to communicate in English.</p>
          <p>Start small. Think about simple things. Talk to yourself. Listen to English. Practise every day.</p>
          <p>One day, you will realise that you are speaking English without translating every sentence in your mind.</p>
          <Quote>Remember: Don&apos;t translate Bengali into English. Train your mind to think in English!</Quote>

          <div className="mt-10 rounded-3xl bg-slate-50 border border-slate-200 p-8 text-center">
            <p className="font-bold text-slate-900">Want to improve your English-speaking skills? Join Ancraze English Academy and start your journey towards confident English communication.</p>
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
