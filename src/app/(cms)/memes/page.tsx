import { MemeScreen } from "@/features/memes";

export const metadata = {
  title: "Meme Library | Meme Picker CMS",
  description: "Manage and filter your full meme collection.",
};

export default function MemesPage() {
  return (
    <main className="flex-1 overflow-auto w-full p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meme Library</h1>
          <p className="text-muted-foreground mt-1">Manage and filter your full meme collection.</p>
        </div>
        
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <MemeScreen />
        </div>
      </div>
    </main>
  );
}
