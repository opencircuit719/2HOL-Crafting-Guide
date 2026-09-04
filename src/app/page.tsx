import { getAllObjects, getCategories } from "@/lib/data";
import HomepageClient from "./HomepageClient";

export default async function HomePage() {
  const objects = await getAllObjects();
  const categories = await getCategories();

  return <HomepageClient objects={objects} categories={categories} />;
}
