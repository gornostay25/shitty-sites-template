/**
 * Placeholder photo generator for the Bar of Legends visual prototype.
 * Run: bun scripts/generate-placeholders.ts
 * Resumable: skips files that already exist. Concurrency: 3 workers, 3 retries per image.
 */
import ZAI from "z-ai-web-dev-sdk";
import fs from "fs";
import path from "path";

const OUT = path.resolve(process.cwd(), "public/placeholders");

const STYLE = ", photorealistic, high quality, detailed, no text, no watermark";

const SPECS: Array<[file: string, prompt: string, size: string]> = [
  ["hero.png", "Cinematic wide interior of a premium esports bar at night, dark graphite walls, warm amber neon sign glow, craft beer taps on a wooden bar counter, gaming PCs with subtle amber and teal accent lighting in the background, moody premium atmosphere", "1344x768"],
  ["beer-pour.png", "Close-up of golden craft beer being poured into a tall glass on a dark wooden bar counter, thick foam head, warm amber backlight, dark background", "1024x1024"],
  ["beer-two.png", "Two glasses of craft beer, one golden lager and one hazy pale ale, on a dark bar counter, warm amber bokeh lights in the background", "1024x1024"],
  ["cocktail.png", "Premium amber whiskey cocktail in a crystal glass with a large ice cube and orange peel on a dark bar counter, warm rim lighting", "1024x1024"],
  ["cocktail-two.png", "Vibrant yellow sour cocktail in a coupe glass with a lemon twist, dark bar background with warm amber neon glow", "1024x1024"],
  ["spritz.png", "Aperol spritz in a large wine glass with an orange slice and ice on a dark bar counter, warm sunset tones, moody bokeh", "1024x1024"],
  ["wine.png", "Glass of Hungarian red wine on a dark wooden bar counter, warm amber accent light, dark moody background", "1024x1024"],
  ["lemonade.png", "Tall glass of homemade raspberry lemonade with fresh mint, ice and berries on a dark bar counter, warm moody lighting", "1024x1024"],
  ["coffee.png", "Iced cold brew coffee in a tall glass with orange zest and large ice cubes, dark moody bar background, warm accent light", "1024x1024"],
  ["cola.png", "Glass of cola with ice cubes and a straw on a dark bar counter, warm amber backlight, moody premium bar", "1024x1024"],
  ["softdrinks.png", "Assorted soft drink bottles and cans with glasses of ice on a dark bar counter, warm amber moody lighting", "1024x1024"],
  ["fries.png", "Loaded french fries topped with melted cheese sauce, crispy bacon and jalapeno in a dark metal basket on a dark bar table, warm amber lighting", "1024x1024"],
  ["wings.png", "Crispy buffalo chicken wings in a dark bowl with blue cheese dip, dark wooden table, moody warm bar lighting", "1024x1024"],
  ["nachos.png", "Bar nachos with melted cheese, salsa and sour cream served in a dark skillet, dark moody bar background, warm light", "1024x1024"],
  ["rings.png", "Crispy golden onion rings stacked on a dark plate with a dipping sauce, dark moody bar lighting, warm amber accents", "1024x1024"],
  ["pretzel.png", "Bavarian lye pretzel with beer cheese dip on a dark wooden board, warm amber bar lighting, moody", "1024x1024"],
  ["platter.png", "Large sharing platter with chicken wings, fries, onion rings and nachos on a dark wooden board in a bar, warm amber lighting", "1024x1024"],
  ["pc-setup.png", "Row of high-end gaming PCs with dual monitors on dark desks, subtle warm amber and soft teal accent lighting, dark esports bar interior, cinematic", "1344x768"],
  ["ps5.png", "Cozy lounge corner with a large TV, game console and controllers on a couch, dark room with warm amber ambient lighting, premium esports bar", "1344x768"],
  ["boardgames.png", "Group of friends playing a board game at a dark wooden table with beer glasses, warm amber pub lighting, moody cinematic", "1024x1024"],
  ["crowd.png", "Friends toasting glasses of craft beer at a dark premium bar, warm amber neon glow, joyful social atmosphere, cinematic", "1344x768"],
  ["quiz.png", "Pub quiz night, teams writing answers on paper at dark wooden tables, quiz master with a microphone in the background, warm amber pub lighting", "1344x768"],
  ["foosball.png", "Foosball table with wooden player figures in a dark moody game room, warm amber spotlight", "1024x1024"],
  ["darts.png", "Dartboard mounted on a dark wall with darts, warm amber spotlight, dark premium bar game corner", "1024x1024"],
  ["party.png", "Birthday celebration group with a sparkler and cocktails at a private table in a dark premium bar, warm amber festive lighting, cinematic", "1344x768"],
  ["tournament.png", "Crowd watching an esports final on a big screen in a dark bar, silhouettes holding drinks, warm amber and subtle teal screen glow, cinematic", "1344x768"],
];

let done = 0;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function generateOne(zai: Awaited<ReturnType<typeof ZAI.create>>, file: string, prompt: string, size: string) {
  const out = path.join(OUT, file);
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const res = await zai.images.generations.create({ prompt: prompt + STYLE, size });
      const b64 = res?.data?.[0]?.base64;
      if (!b64) throw new Error("empty response");
      fs.writeFileSync(out, Buffer.from(b64, "base64"));
      done++;
      console.log(`OK ${file} (${done}/${SPECS.length})`);
      await sleep(2000); // gentle pacing to avoid 429s
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isRateLimit = msg.includes("429") || msg.toLowerCase().includes("too many");
      console.error(`FAIL ${file} attempt ${attempt}: ${msg}`);
      if (attempt < 5) await sleep(isRateLimit ? 15000 : 3000);
    }
  }
  return false;
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const zai = await ZAI.create();
  const queue = SPECS.filter(([file]) => !fs.existsSync(path.join(OUT, file)));
  console.log(`Pending: ${queue.length} of ${SPECS.length}`);
  let idx = 0;
  const worker = async () => {
    while (idx < queue.length) {
      const [file, prompt, size] = queue[idx++];
      try {
        await generateOne(zai, file, prompt, size);
      } catch (err) {
        console.error(`WORKER_ERROR ${file}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  };
  await Promise.all([worker(), worker()]);
  const missing = SPECS.map(([f]) => f).filter((f) => !fs.existsSync(path.join(OUT, f)));
  console.log(missing.length === 0 ? "ALL_DONE" : `MISSING: ${missing.join(", ")}`);
}

process.on("uncaughtException", (e) => console.error(`UNCAUGHT ${e.message}`));
process.on("unhandledRejection", (e) => console.error(`UNHANDLED ${e}`));

main().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
