import { InteractionManagement } from "@/features/interactions/components/interaction-management";
import { appClient } from "@/apis/client";

export default async function InteractionsPage() {
  const data = await appClient.interaction.getAll();

  return (
    <main className="flex-1 overflow-auto w-full">
      <InteractionManagement initialData={data} />
    </main>
  );
}
