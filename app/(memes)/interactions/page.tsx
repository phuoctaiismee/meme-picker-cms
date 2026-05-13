import { InteractionManagement } from "@/components/memes/interaction-management";
import { getInteractionManagementData } from "@/lib/memes/data";

export default async function InteractionsPage() {
  const data = await getInteractionManagementData();

  return (
    <main className="flex-1 overflow-auto w-full">
      <InteractionManagement initialData={data} />
    </main>
  );
}
