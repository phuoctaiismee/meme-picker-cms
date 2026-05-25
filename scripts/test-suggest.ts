import { meme } from "../src/apis/client/meme";
import * as fs from "fs";
import * as path from "path";

// Simple custom .env parser to load env variables for standalone execution
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    content.split("\n").forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || "";
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

async function test() {
  console.log("=== Testing Meme Suggestion API ===");
  const query = "con meo tuc gian";
  console.log(`Query text: "${query}"`);
  
  const startTime = Date.now();
  try {
    const results = await meme.suggest(query, 3);
    const duration = Date.now() - startTime;
    
    console.log(`\nSuggestion completed in ${duration} ms.`);
    console.log(`Found ${results.length} suggestions:`);
    
    results.forEach((m, idx) => {
      console.log(`\n[Suggestion #${idx + 1}]`);
      console.log(`- ID: ${m.id}`);
      console.log(`- Title: ${m.title}`);
      console.log(`- OCR Content: ${m.ocr_content}`);
      console.log(`- Media Key: ${m.media_key}`);
      console.log(`- Tags: ${m.tags.map(t => t.name).join(", ")}`);
    });
  } catch (err) {
    console.error("Test failed with error:", err);
  }
}

test().catch(console.error);
