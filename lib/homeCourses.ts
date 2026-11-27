import { adminDb } from "@/lib/firebaseAdmin";

// Public course details for the home page, read on the server.
// Only the fields shown on the cards are returned.
export async function getHomeCourses() {
  if (!adminDb) return [];
  try {
    const snapshot = await (adminDb as any)
      .collection("courses")
      .orderBy("createdAt", "desc")
      .get();

    return snapshot.docs
      .map((doc: any) => ({ id: doc.id as string, data: doc.data() }))
      .filter(({ data }: any) => data.showOnHomePage !== false)
      .map(({ id, data: c }: any) => ({
        id,
        name: String(c.title || c.name || "Spoken English Course"),
        duration: String(c.duration || ""),
        validity: String(c.validity || ""),
        liveSessions: String(c.liveSessions || ""),
        tagline: String(c.tagline || ""),
        overview: String(c.description || c.overview || ""),
        badge: c.badge ? String(c.badge) : undefined,
        features: (Array.isArray(c.features)
          ? c.features
          : typeof c.features === "string" && c.features.trim()
          ? c.features.split("\n").map((f: string) => f.trim()).filter(Boolean)
          : Array.isArray(c.lessons)
          ? c.lessons.map((l: any) => (typeof l === "string" ? l : l.title || "Interactive lesson"))
          : []
        ).map(String),
        whoShouldJoin: String(c.whoShouldJoin || ""),
        experience: Array.isArray(c.experience)
          ? c.experience.map((e: any) => ({ title: String(e?.title || ""), desc: String(e?.desc || "") }))
          : [],
      }));
  } catch (err) {
    // The browser still loads the courses if this fails.
    console.error("Failed to load home courses on the server:", err);
    return [];
  }
}
