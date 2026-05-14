import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

async function checkDB() {
  const envPath = path.join(process.cwd(), ".env");
  const envContent = fs.readFileSync(envPath, "utf-8");
  
  const env: Record<string, string> = {};
  envContent.split("\n").forEach(line => {
    const [key, ...rest] = line.split("=");
    if (key && rest.length > 0) {
      env[key.trim()] = rest.join("=").trim().replace(/^["']|["']$/g, "");
    }
  });

  const supabaseUrl = env["NEXT_PUBLIC_SUPABASE_URL"];
  const supabaseKey = env["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"];

  const supabase = createClient(supabaseUrl!, supabaseKey!);
  
  // Đếm tổng số dòng
  const { count, error } = await supabase
    .from("interactions")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("Error counting interactions:", error);
    return;
  }

  console.log(`Total rows in 'interactions' table: ${count}`);

  // Thử lấy 1 dòng bất kỳ
  const { data } = await supabase.from("interactions").select("id, action_type").limit(1);
  console.log("First row if exists:", data);
}

checkDB();
