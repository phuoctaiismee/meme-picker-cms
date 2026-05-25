import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Simple custom .env parser to avoid requiring external 'dotenv' dependency
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    content.split("\n").forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || "";
        // Remove surrounding quotes if present
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.substring(1, value.length - 1);
        }
        process.env[key] = value.trim();
      }
    });
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Use Service Role Key if available to bypass RLS, fallback to publishable key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const gteApiUrl = process.env.GTE_API_URL || "http://localhost:7860";

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: Missing NEXT_PUBLIC_SUPABASE_URL or Supabase Key in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface TagRow {
  id: number;
  name: string;
}

async function getGTEEmbedding(text: string): Promise<number[]> {
  const res = await fetch(`${gteApiUrl}/api/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texts: [text] }),
  });

  if (!res.ok) {
    throw new Error(`GTE model server returned status ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as { embeddings: number[][] };
  return data.embeddings[0];
}

async function migrate() {
  console.log("=== Starting Tag Re-Embedding Migration ===");
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log(`GTE Model Server: ${gteApiUrl}`);
  console.log(`Using Key: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? "Service Role Key" : "Publishable Key"}`);

  // 1. Fetch all tags
  console.log("\nFetching tags from database...");
  const { data: tags, error: fetchError } = await supabase
    .from("tags")
    .select("id, name");

  if (fetchError) {
    console.error("Failed to fetch tags:", fetchError);
    process.exit(1);
  }

  const tagRows = tags as unknown as TagRow[];
  console.log(`Found ${tagRows.length} tags to process.`);

  let successCount = 0;
  let failCount = 0;

  // 2. Loop and re-embed
  for (let i = 0; i < tagRows.length; i++) {
    const tag = tagRows[i];
    const indexStr = `[${i + 1}/${tagRows.length}]`;

    if (!tag.name) {
      console.log(`${indexStr} Tag ID ${tag.id} has no name. Skipping.`);
      continue;
    }

    try {
      console.log(`${indexStr} Generating GTE embedding for Tag ${tag.id} ("${tag.name}") ...`);
      const embedding = await getGTEEmbedding(tag.name);

      // Update database
      const { error: updateError } = await supabase
        .from("tags")
        .update({ embedding })
        .eq("id", tag.id);

      if (updateError) {
        console.error(`- Failed to update Supabase for Tag ${tag.id}:`, updateError.message);
        failCount++;
      } else {
        console.log(`- Successfully updated embedding! (Length: ${embedding.length})`);
        successCount++;
      }
    } catch (err) {
      console.error(`- Error processing Tag ${tag.id}:`, err instanceof Error ? err.message : err);
      failCount++;
    }
  }

  console.log("\n=== Tag Migration Completed ===");
  console.log(`Successfully migrated: ${successCount}`);
  console.log(`Failed: ${failCount}`);
}

migrate().catch(err => {
  console.error("Migration crashed:", err);
});
