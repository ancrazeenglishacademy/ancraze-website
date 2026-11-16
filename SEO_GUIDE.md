# Ancraze English Academy - SEO Architecture & Routes Guide 🚀

> **Target Audience:** SEO Specialists, Marketing Team & Webmasters  
> **Production Domain:** `https://www.ancraze.com`  
> **Framework:** Next.js 16 (App Router) with Server-Side Rendering (SSR) & Dynamic Metadata  
> **Primary Niche:** Spoken English Courses Taught in Bangla (Bengali Medium)  
> **Last Updated:** November 2026  

---

## 1. Core SEO Infrastructure Endpoints

| Resource | Live Production URL | Source Code File | Purpose |
| :--- | :--- | :--- | :--- |
| **Robots Directive** | `https://www.ancraze.com/robots.txt` | [`app/robots.ts`](file:///p:/ancraze-fixus/app/robots.ts) | Controls crawler access & points to sitemap |
| **XML Sitemap** | `https://www.ancraze.com/sitemap.xml` | [`app/sitemap.ts`](file:///p:/ancraze-fixus/app/sitemap.ts) | Index of all public pages, priorities & frequencies |
| **Web App Manifest** | `https://www.ancraze.com/manifest.webmanifest` | [`app/manifest.ts`](file:///p:/ancraze-fixus/app/manifest.ts) | PWA & mobile browser brand appearance |
| **Google Verification File** | `https://www.ancraze.com/googlea4aabef345f51e31.html` | [`public/googlea4aabef345f51e31.html`](file:///p:/ancraze-fixus/public/googlea4aabef345f51e31.html) | Google Search Console site ownership verification |

---

## 2. Robots.txt Crawler Rules

The `robots.txt` configuration dynamically permits search engines to crawl public marketing pages while strictly barring access to internal administrative, student, and trainer management portals:

```txt
User-agent: *
Allow: /
Allow: /about
Allow: /courses
Allow: /why-ancraze
Allow: /what-we-provide
Allow: /faculties
Allow: /contact
Allow: /privacy
Allow: /login
Allow: /register

# Disallowed Private Admin, Trainer & API Routes
Disallow: /superadmin/
Disallow: /dashboard/
Disallow: /trainer/
Disallow: /student/
Disallow: /api/
Disallow: /blocked/

Sitemap: https://www.ancraze.com/sitemap.xml
```

---

## 3. Complete Public Sitemap Routes & SEO Priorities

Every navigation item in the header now maps to a dedicated, indexable route with custom canonical URLs:

| Page Route | Priority | Change Frequency | Target Keywords / Search Intent |
| :--- | :---: | :---: | :--- |
| **`/` (Home)** | `1.0` | Daily | `spoken english course in bangla`, `best spoken english in bengali`, `20 codes method` |
| **`/about`** | `0.9` | Weekly | `about ancraze english academy`, `learn english in mother tongue`, `bangla english academy` |
| **`/courses`** | `0.9` | Weekly | `30 day spoken english course bangla`, `60 day english course`, `english speaking course fees` |
| **`/why-ancraze`** | `0.8` | Weekly | `why ancraze`, `english grammar without memorization`, `personal english trainer bangla` |
| **`/what-we-provide`**| `0.8` | Weekly | `english speaking app bangla`, `1 on 1 english trainer calls`, `300 english verbs with bangla` |
| **`/faculties`** | `0.8` | Weekly | `ancraze faculties`, `spoken english mentors kolkata`, `english trainers bengali` |
| **`/contact`** | `0.8` | Weekly | `ancraze office kolkata`, `ancraze admissions whatsapp`, `spoken english academy contact number` |
| **`/privacy`** | `0.5` | Monthly | `ancraze privacy policy`, `app data privacy terms` |
| **`/login`** | `0.4` | Monthly | `ancraze student login`, `ancraze portal login` |
| **`/register`** | `0.4` | Monthly | `ancraze student registration` |

---

## 4. Route-by-Route Metadata & Content Reference

### 4.1. Home (`/`)
- **Title Tag:** `Ancraze English Academy | Best Spoken English Course in Bangla`
- **Meta Description:** *Master spoken English in Bangla with Ancraze. Learn sentence formation effortlessly through our 20 Codes Method, 1-on-1 personal speaking trainers, 24/7 app access, and daily practice.*
- **Canonical URL:** `https://www.ancraze.com`
- **Social Image:** `https://www.ancraze.com/student-avatar.png` (1200x630)
- **Primary Content:** Hero headline ("Speak English with our 20 Codes"), 5 Pillars, Course Preview, Learning Journey, FAQs, App Download CTA.

### 4.2. About Us (`/about`)
- **Title Tag:** `About Us | Ancraze English Academy`
- **Meta Description:** *Discover the mission and story behind Ancraze Online Spoken English Academy. Learn how our 20 Codes Method and personal speaking trainers help Bengali speakers speak English confidently without memorizing grammar.*
- **Canonical URL:** `https://www.ancraze.com/about`
- **Key Focus:** Breaking the fear of English for Bengali speakers, why traditional grammar schools fail, step-by-step fluency roadmap.

### 4.3. Our Courses (`/courses`)
- **Title Tag:** `Spoken English Courses in Bangla | 30-Day & 60-Day Programmes`
- **Meta Description:** *Explore our structured spoken English courses taught in Bangla. Featuring the 20 Codes Method, 1-on-1 personal speaking trainer sessions, 24/7 app access, and live interactive classes.*
- **Canonical URL:** `https://www.ancraze.com/courses`
- **Key Focus:** 30-Day Foundational Course, 60-Day Comprehensive Course, Self-Study Plan, plan comparison table, dynamic syllabus modals, transparent feature checklist.

### 4.4. Why Ancraze (`/why-ancraze`)
- **Title Tag:** `Why Choose Ancraze | Spoken English in Bangla with 20 Codes`
- **Meta Description:** *Discover why Ancraze is the #1 choice for Bengali speakers to master Spoken English. Explore our 20 Codes Method, daily 1-on-1 personal speaking trainers, and 24/7 mobile learning app.*
- **Canonical URL:** `https://www.ancraze.com/why-ancraze`
- **Key Focus:** Deep dive into the 5 Pillars, *Traditional Grammar Classes vs. Ancraze 20 Codes Method* comparison table.

### 4.5. What We Provide (`/what-we-provide`)
- **Title Tag:** `What We Provide | Comprehensive Spoken English Learning System`
- **Meta Description:** *Explore the complete features of the Ancraze English learning ecosystem: 24/7 mobile app access, 1-on-1 personal speaking mentors, 20 Codes Method, 300 essential verbs, and weekly live revision sessions.*
- **Canonical URL:** `https://www.ancraze.com/what-we-provide`
- **Key Focus:** Feature breakdown of the 6 components, direct links to Google Play Store and Apple App Store.

### 4.6. Faculties & Mentors (`/faculties`)
- **Title Tag:** `Faculties & Speaking Mentors | Ancraze English Academy`
- **Meta Description:** *Meet our certified speaking trainers and language coaches at Ancraze English Academy. Providing dedicated 1-on-1 speaking guidance, live corrections, and constant motivation in Bangla.*
- **Canonical URL:** `https://www.ancraze.com/faculties`
- **Key Focus:** Active speaking trainers, bios, specializations, years of experience, and 1-click WhatsApp mentor enquiry.

### 4.7. Contact Us & Admissions (`/contact`)
- **Title Tag:** `Contact Us & Admissions Office | Ancraze English Academy`
- **Meta Description:** *Get in touch with Ancraze Admissions Office. Enroll in our spoken English courses taught in Bangla language with our 20 Codes Method and personal speaking trainers. Call or WhatsApp +91 93824 52699.*
- **Canonical URL:** `https://www.ancraze.com/contact`
- **Key Focus:** Quick enquiry form, WhatsApp Business link (`+91 93824 52699`), email (`Ancrazeenglishacademy@gmail.com`), physical office address in Kolkata.

---

## 5. Schema.org Structured Data (JSON-LD)

Google automatically extracts rich snippets using the structured JSON-LD embedded in [`app/layout.tsx`](file:///p:/ancraze-fixus/app/layout.tsx):

### 1. `EducationalOrganization` Schema
- **Name:** Ancraze English Academy
- **URL:** `https://www.ancraze.com`
- **Logo:** `https://www.ancraze.com/logo.png`
- **Contact:** Telephone: `+91 93824 52699`, Email: `Ancrazeenglishacademy@gmail.com`
- **Physical Address:** `Abedin Arcade, Tiljala Rd, 3D, Gobra, Kolkata, West Bengal 700046, India`
- **Official Social Profiles (`sameAs`):**
  - Instagram: `https://www.instagram.com/ancrazeenglish`
  - Facebook: `https://www.facebook.com/share/19tbcqR6iw/`
  - YouTube: `https://www.youtube.com/@AncrazeEnglishAcademy`
  - Google Play: `https://play.google.com/store/apps/details?id=app.ancraze.com`
  - Apple App Store: `https://apps.apple.com/in/app/ancraze/id6773675253`

### 2. `Course` Schema
Structured markup for the courses:
- `30-Day Foundational Spoken English Course in Bangla`
- `60-Day Foundational Spoken English Course in Bangla`
- Declared language of instruction: `["bn", "en"]`

### 3. `FAQPage` Schema
Enables interactive accordion question/answer snippets directly on Google SERP results for high search visibility.

---

## 6. Google Search Console & Webmaster Setup Instructions

### Verification
Ownership has been configured through two independent mechanisms:
1. **HTML File:** Located at `public/googlea4aabef345f51e31.html`.
2. **HTML Meta Tag:** Injected into `<head>` across all pages:
   ```html
   <meta name="google-site-verification" content="googlea4aabef345f51e31" />
   ```

### Immediate Steps for the SEO Team:
1. Open **Google Search Console** (`https://search.google.com/search-console`).
2. Add Property: `https://www.ancraze.com`.
3. Click **Verify** (The verification will succeed instantly).
4. Navigate to **Sitemaps** in the left sidebar.
5. Enter: `https://www.ancraze.com/sitemap.xml` and click **Submit**.
6. Repeat for **Bing Webmaster Tools** (`https://www.bing.com/webmasters`) by importing the verified Google Search Console property.

---

## 7. Recommended Target Keyword Clusters

| Priority Tier | Keyword Cluster (English & Transliterated Bangla) | Recommended Landing Page |
| :---: | :--- | :--- |
| **Tier 1 (High Intent)** | `spoken english course in bangla`, `learn spoken english in bengali`, `best spoken english course in bangla language` | `/` and `/courses` |
| **Tier 1 (Brand/Method)**| `ancraze english academy`, `20 codes method spoken english`, `ancraze spoken english` | `/` and `/why-ancraze` |
| **Tier 2 (Location-Based)**| `spoken english classes in kolkata`, `online spoken english west bengal`, `spoken english course bangladesh` | `/contact` and `/courses` |
| **Tier 2 (Features)** | `1 on 1 personal trainer spoken english`, `english speaking app in bangla`, `30 day english speaking course` | `/what-we-provide` |
| **Tier 3 (Long-Tail)** | `grammar chara spoken english`, `how to speak english fluently from bengali`, `bangla to english daily practice` | `/about` and `/why-ancraze` |
