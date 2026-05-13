import { MemeScreen } from "@/features/memes";

export const metadata = {
  title: "Meme Library | Meme Picker CMS",
  description: "Manage and filter your full meme collection.",
};

export default function MemesPage() {
  return (
    <main className="flex-1 overflow-auto w-full p-6">
      <div className="max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <MemeScreen />
      </div>
    </main>
  );
}
