import { CreateMemeForm } from "@/components/memes/create-meme-form";

export default function CreateMemePage() {
  return (
    <main className="flex-1 overflow-auto w-full">
      <div className="p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-lg font-semibold">Create Meme</h1>
          <p className="text-sm text-muted-foreground">
            Upload media to Cloudinary and save meme metadata in Supabase.
          </p>
        </div>
        <CreateMemeForm />
      </div>
    </main>
  );
}
