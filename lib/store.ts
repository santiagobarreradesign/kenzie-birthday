"use client";

import { create } from "zustand";
import { v4 as uuid } from "uuid";
import { getAccessory } from "@/lib/constants/palette";
import type {
  BackgroundId,
  CanvasLayer,
  Comment,
  LayerTransform,
  StrokeData,
  ToolMode,
} from "@/lib/types";

const defaultTransform = (x = 200, y = 200): LayerTransform => ({
  x,
  y,
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
  skewX: 0,
  skewY: 0,
});

type EditorState = {
  layers: CanvasLayer[];
  selectedId: string | null;
  toolMode: ToolMode;
  brushColor: string;
  brushSize: number;
  backgroundId: BackgroundId;
  hairHue: number;
  distortSkewX: number;
  distortSkewY: number;
  authorName: string;
  comments: Comment[];
  marqueeText: string;
  isSaving: boolean;
  mobilePanel: "purse" | "tools" | "love" | null;

  setLayers: (layers: CanvasLayer[]) => void;
  addRemoteLayer: (layer: CanvasLayer) => void;
  setComments: (comments: Comment[]) => void;
  addComment: (comment: Comment) => void;
  setMarqueeText: (text: string) => void;
  setAuthorName: (name: string) => void;
  setToolMode: (mode: ToolMode) => void;
  setBrushColor: (color: string) => void;
  setBrushSize: (size: number) => void;
  setBackgroundId: (id: BackgroundId) => void;
  setHairHue: (hue: number) => void;
  setDistort: (skewX: number, skewY: number) => void;
  setSelectedId: (id: string | null) => void;
  setMobilePanel: (panel: "purse" | "tools" | "love" | null) => void;
  setIsSaving: (v: boolean) => void;

  addAccessory: (assetId: string, stageW?: number, stageH?: number) => string;
  updateLayerTransform: (id: string, transform: Partial<LayerTransform>) => void;
  addStroke: (stroke: StrokeData) => string;
  removeSelected: () => void;
  getPendingLayers: () => CanvasLayer[];
  markLayersSaved: (ids: string[], serverLayers?: CanvasLayer[]) => void;
};

export const useEditorStore = create<EditorState>((set, get) => ({
  layers: [],
  selectedId: null,
  toolMode: "select",
  brushColor: "#1a1a1a",
  brushSize: 4,
  backgroundId: "stripes",
  hairHue: 0,
  distortSkewX: 0,
  distortSkewY: 0,
  authorName: "",
  comments: [],
  marqueeText: "★ happy birthday kenzie ★ we love you ★ make a wish ★",
  isSaving: false,
  mobilePanel: null,

  setLayers: (layers) => set({ layers }),
  addRemoteLayer: (layer) =>
    set((s) => {
      if (s.layers.some((l) => l.id === layer.id)) return s;
      return { layers: [...s.layers, layer] };
    }),
  setComments: (comments) => set({ comments }),
  addComment: (comment) =>
    set((s) => {
      if (s.comments.some((c) => c.id === comment.id)) return s;
      return { comments: [...s.comments, comment] };
    }),
  setMarqueeText: (marqueeText) => set({ marqueeText }),
  setAuthorName: (authorName) => set({ authorName }),
  setToolMode: (toolMode) => set({ toolMode, selectedId: null }),
  setBrushColor: (brushColor) => set({ brushColor }),
  setBrushSize: (brushSize) => set({ brushSize }),
  setBackgroundId: (backgroundId) => set({ backgroundId }),
  setHairHue: (hairHue) => set({ hairHue }),
  setDistort: (distortSkewX, distortSkewY) =>
    set({ distortSkewX, distortSkewY }),
  setSelectedId: (selectedId) => set({ selectedId }),
  setMobilePanel: (mobilePanel) => set({ mobilePanel }),
  setIsSaving: (isSaving) => set({ isSaving }),

  addAccessory: (assetId, stageW = 480, stageH = 560) => {
    const def = getAccessory(assetId);
    const scale = def?.defaultScale ?? 0.7;
    const id = uuid();
    const layer: CanvasLayer = {
      id,
      author_name: get().authorName || "friend",
      layer_type: "accessory",
      asset_id: assetId,
      transform: {
        ...defaultTransform(stageW / 2 - 40, stageH / 2 - 40),
        scaleX: scale,
        scaleY: scale,
        rotation: (Math.random() - 0.5) * 16,
      },
      stroke_data: null,
      settings: null,
      created_at: new Date().toISOString(),
      pending: true,
    };
    set((s) => ({
      layers: [...s.layers, layer],
      selectedId: id,
      toolMode: "select",
    }));
    return id;
  },

  updateLayerTransform: (id, transform) =>
    set((s) => ({
      layers: s.layers.map((l) =>
        l.id === id
          ? { ...l, transform: { ...l.transform, ...transform }, pending: true }
          : l
      ),
    })),

  addStroke: (stroke) => {
    const id = uuid();
    const layer: CanvasLayer = {
      id,
      author_name: get().authorName || "friend",
      layer_type: "stroke",
      asset_id: null,
      transform: defaultTransform(0, 0),
      stroke_data: stroke,
      settings: null,
      created_at: new Date().toISOString(),
      pending: true,
    };
    set((s) => ({ layers: [...s.layers, layer] }));
    return id;
  },

  removeSelected: () => {
    const { selectedId } = get();
    if (!selectedId) return;
    set((s) => ({
      layers: s.layers.filter((l) => l.id !== selectedId),
      selectedId: null,
    }));
  },

  getPendingLayers: () => get().layers.filter((l) => l.pending),

  markLayersSaved: (ids, serverLayers) =>
    set((s) => {
      if (serverLayers) {
        const remoteIds = new Set(serverLayers.map((l) => l.id));
        const keptLocal = s.layers.filter(
          (l) => !l.pending && !remoteIds.has(l.id)
        );
        return { layers: [...keptLocal, ...serverLayers] };
      }
      return {
        layers: s.layers.map((l) =>
          ids.includes(l.id) ? { ...l, pending: false } : l
        ),
      };
    }),
}));
