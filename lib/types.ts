export type LayerType = "accessory" | "stroke" | "effect";

export type LayerTransform = {
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  skewX: number;
  skewY: number;
};

export type StrokeData = {
  points: number[];
  color: string;
  strokeWidth: number;
  globalCompositeOperation?: "source-over" | "destination-out";
};

export type LayerSettings = {
  hairHue?: number;
  backgroundId?: string;
  distortSkewX?: number;
  distortSkewY?: number;
};

export type CanvasLayer = {
  id: string;
  author_name: string | null;
  layer_type: LayerType;
  asset_id: string | null;
  transform: LayerTransform;
  stroke_data: StrokeData | null;
  settings: LayerSettings | null;
  created_at: string;
  /** Local-only (not yet saved) */
  pending?: boolean;
};

export type Comment = {
  id: string;
  author_name: string;
  message: string;
  image_url: string | null;
  anchor_x: number;
  anchor_y: number;
  created_at: string;
};

export type SiteSettings = {
  id: string;
  marquee_text: string;
  updated_at: string;
};

export type ToolMode = "select" | "draw" | "erase";

export type BackgroundId = "stripes" | "grid" | "teal" | "lime" | "cream";

export type AccessoryDef = {
  id: string;
  label: string;
  src: string;
  category: "eyewear" | "jewelry" | "party" | "misc";
  defaultScale?: number;
};
