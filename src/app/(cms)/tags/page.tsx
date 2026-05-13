import { TagManagement } from "@/features/tags/components/tag-management";
import { appClient } from "@/apis/client";

export default async function TagsPage() {
  const data = await appClient.tag.getAll();

  return (
    <main className="flex-1 overflow-auto w-full">
      <TagManagement initialData={data} />
    </main>
  );
}
