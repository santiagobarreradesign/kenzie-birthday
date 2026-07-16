import { promises as fs } from "fs";
import path from "path";
import { DEFAULT_MARQUEE } from "@/lib/constants/palette";
import type { CanvasLayer, Comment, SiteSettings } from "@/lib/types";

type LocalData = {
  comments: Comment[];
  layers: CanvasLayer[];
  settings: SiteSettings;
};

const DATA_PATH = path.join(process.cwd(), ".data", "store.json");

const defaultData = (): LocalData => ({
  comments: [],
  layers: [],
  settings: {
    id: "default",
    marquee_text: DEFAULT_MARQUEE,
    updated_at: new Date().toISOString(),
  },
});

/** In-memory fallback for serverless (Vercel) where the FS is ephemeral */
const globalStore = globalThis as unknown as {
  __kenzieStore?: LocalData;
};

function mem(): LocalData {
  if (!globalStore.__kenzieStore) {
    globalStore.__kenzieStore = defaultData();
  }
  return globalStore.__kenzieStore;
}

const useFs = !process.env.VERCEL;

async function ensure() {
  if (!useFs) return;
  const dir = path.dirname(DATA_PATH);
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.access(DATA_PATH);
  } catch {
    await fs.writeFile(DATA_PATH, JSON.stringify(defaultData(), null, 2));
  }
}

export async function readLocalStore(): Promise<LocalData> {
  if (!useFs) {
    return structuredClone(mem());
  }
  await ensure();
  const raw = await fs.readFile(DATA_PATH, "utf-8");
  return JSON.parse(raw) as LocalData;
}

export async function writeLocalStore(data: LocalData) {
  if (!useFs) {
    globalStore.__kenzieStore = structuredClone(data);
    return;
  }
  await ensure();
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2));
}

export async function localGetComments() {
  return (await readLocalStore()).comments;
}

export async function localAddComment(comment: Comment) {
  const data = await readLocalStore();
  data.comments.push(comment);
  await writeLocalStore(data);
  return comment;
}

export async function localGetLayers() {
  return (await readLocalStore()).layers;
}

export async function localAddLayers(layers: CanvasLayer[]) {
  const data = await readLocalStore();
  data.layers.push(...layers);
  await writeLocalStore(data);
  return layers;
}

export async function localGetSettings() {
  return (await readLocalStore()).settings;
}

export async function localUpdateSettings(marquee_text: string) {
  const data = await readLocalStore();
  data.settings = {
    ...data.settings,
    marquee_text,
    updated_at: new Date().toISOString(),
  };
  await writeLocalStore(data);
  return data.settings;
}
