import { TagManagement } from "@/components/memes/tag-management";
import { getTagManagementData } from "@/lib/memes/data";

export default async function TagsPage() {
  const data = await getTagManagementData();

  return (
    <main className="flex-1 overflow-auto w-full">
      <TagManagement initialData={data} />
    </main>
  );
}
