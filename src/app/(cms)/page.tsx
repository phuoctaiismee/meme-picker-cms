import { MemeList } from "@/features/memes/components/meme-list";
import { appClient } from "@/apis/client";

export default async function AllMemesPage() {
  const data = await appClient.meme.getAll();

  return (
    <main className="flex-1 overflow-auto w-full">
      <MemeList memes={data.memes} tags={data.tags} />
    </main>
  );
}
