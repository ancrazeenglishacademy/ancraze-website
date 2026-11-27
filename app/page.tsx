import HomeClient from "./HomeClient";
import { getHomeCourses } from "@/lib/homeCourses";

// Rebuild the home page at most every 5 minutes.
export const revalidate = 300;

export default async function Page() {
  const courses = await getHomeCourses();
  return <HomeClient initialCourses={courses} />;
}
