import { MemeList } from "@/components/memes/meme-list";
import { getMemeListData } from "@/lib/memes/data";

export default async function AllMemesPage() {
  const data = await getMemeListData();

  return (
    <main className="flex-1 overflow-auto w-full">
      <MemeList memes={data.memes} tags={data.tags} />
    </main>
  );
}
