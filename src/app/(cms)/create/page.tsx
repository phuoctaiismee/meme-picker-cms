import { CreateMemeForm } from "@/features/memes/components/create-meme-form";

export default function CreateMemePage() {
  return (
    <main className="flex-1 overflow-auto w-full">
      <div className="p-4 md:p-6">
        <CreateMemeForm />
      </div>
    </main>
  );
}
