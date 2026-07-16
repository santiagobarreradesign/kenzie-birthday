"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Line,
  Transformer,
  Group,
  Rect,
} from "react-konva";
import type Konva from "konva";
import { BACKGROUNDS, KENZIE_BASE, getAccessory } from "@/lib/constants/palette";
import { useImage } from "@/lib/hooks/useImage";
import { useEditorStore } from "@/lib/store";

const STAGE_W = 480;
const STAGE_H = 560;

function AccessoryNode({
  id,
  assetId,
  isSelected,
  onSelect,
  draggable,
}: {
  id: string;
  assetId: string;
  isSelected: boolean;
  onSelect: () => void;
  draggable: boolean;
}) {
  const def = getAccessory(assetId);
  const [image] = useImage(def?.src);
  const transform = useEditorStore(
    (s) => s.layers.find((l) => l.id === id)?.transform
  );
  const updateLayerTransform = useEditorStore((s) => s.updateLayerTransform);
  const shapeRef = useRef<Konva.Image>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && shapeRef.current && trRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, image]);

  if (!transform || !image) return null;

  return (
    <>
      <KonvaImage
        ref={shapeRef}
        image={image}
        x={transform.x}
        y={transform.y}
        rotation={transform.rotation}
        scaleX={transform.scaleX}
        scaleY={transform.scaleY}
        skewX={transform.skewX}
        skewY={transform.skewY}
        draggable={draggable}
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          updateLayerTransform(id, {
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={() => {
          const node = shapeRef.current;
          if (!node) return;
          updateLayerTransform(id, {
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
            scaleX: node.scaleX(),
            scaleY: node.scaleY(),
            skewX: node.skewX(),
            skewY: node.skewY(),
          });
        }}
        shadowColor="#1a1a1a"
        shadowBlur={0}
        shadowOffset={{ x: 2, y: 2 }}
        shadowOpacity={0.25}
      />
      {isSelected && draggable && (
        <Transformer
          ref={trRef}
          rotateEnabled
          enabledAnchors={[
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right",
          ]}
          borderStroke="#FFF100"
          anchorStroke="#1a1a1a"
          anchorFill="#E1ED3C"
          anchorSize={8}
        />
      )}
    </>
  );
}

export default function KenzieCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: STAGE_W, h: STAGE_H, scale: 1 });
  const [kenzieImg] = useImage(KENZIE_BASE);
  const isDrawing = useRef(false);
  const currentLine = useRef<number[]>([]);

  const layers = useEditorStore((s) => s.layers);
  const selectedId = useEditorStore((s) => s.selectedId);
  const toolMode = useEditorStore((s) => s.toolMode);
  const brushColor = useEditorStore((s) => s.brushColor);
  const brushSize = useEditorStore((s) => s.brushSize);
  const backgroundId = useEditorStore((s) => s.backgroundId);
  const hairHue = useEditorStore((s) => s.hairHue);
  const distortSkewX = useEditorStore((s) => s.distortSkewX);
  const distortSkewY = useEditorStore((s) => s.distortSkewY);
  const setSelectedId = useEditorStore((s) => s.setSelectedId);
  const addStroke = useEditorStore((s) => s.addStroke);

  const bg = BACKGROUNDS.find((b) => b.id === backgroundId) || BACKGROUNDS[0];
  const canSelect = toolMode === "select";

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const resize = () => {
      const maxW = Math.min(el.clientWidth, STAGE_W);
      const scale = maxW / STAGE_W;
      setSize({ w: STAGE_W * scale, h: STAGE_H * scale, scale });
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const getPointer = useCallback((stage: Konva.Stage) => {
    const pos = stage.getPointerPosition();
    if (!pos) return null;
    return {
      x: pos.x / size.scale,
      y: pos.y / size.scale,
    };
  }, [size.scale]);

  const onMouseDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (toolMode === "select") {
      if (e.target === e.target.getStage()) {
        setSelectedId(null);
      }
      return;
    }

    const stage = e.target.getStage();
    if (!stage) return;
    const pos = getPointer(stage);
    if (!pos) return;

    isDrawing.current = true;
    currentLine.current = [pos.x, pos.y];
  };

  const onMouseMove = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!isDrawing.current || toolMode === "select") return;
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = getPointer(stage);
    if (!pos) return;
    currentLine.current = currentLine.current.concat([pos.x, pos.y]);
    // Force re-render via a temporary approach: store draft in state
    setDraftPoints([...currentLine.current]);
  };

  const [draftPoints, setDraftPoints] = useState<number[]>([]);

  const onMouseUp = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    if (currentLine.current.length >= 4) {
      addStroke({
        points: currentLine.current,
        color: brushColor,
        strokeWidth: brushSize,
        globalCompositeOperation:
          toolMode === "erase" ? "destination-out" : "source-over",
      });
    }
    currentLine.current = [];
    setDraftPoints([]);
  };

  const accessories = layers.filter((l) => l.layer_type === "accessory");
  const strokes = layers.filter((l) => l.layer_type === "stroke");

  // Apply latest scene effect from saved layers
  useEffect(() => {
    const effects = layers.filter(
      (l) => l.layer_type === "effect" && l.settings
    );
    if (effects.length === 0) return;
    const latest = effects[effects.length - 1];
    const s = latest.settings!;
    const store = useEditorStore.getState();
    if (s.backgroundId && s.backgroundId !== store.backgroundId) {
      store.setBackgroundId(s.backgroundId as typeof store.backgroundId);
    }
    if (typeof s.hairHue === "number" && s.hairHue !== store.hairHue) {
      store.setHairHue(s.hairHue);
    }
    if (
      typeof s.distortSkewX === "number" &&
      typeof s.distortSkewY === "number"
    ) {
      if (
        s.distortSkewX !== store.distortSkewX ||
        s.distortSkewY !== store.distortSkewY
      ) {
        store.setDistort(s.distortSkewX, s.distortSkewY);
      }
    }
  }, [layers]);

  return (
    <div
      ref={containerRef}
      className="relative mx-auto w-full max-w-[480px] select-none"
    >
      <div
        className="overflow-hidden rounded-sm border-[3px] border-ink shadow-[6px_6px_0_#1a1a1a]"
        style={{
          width: size.w,
          height: size.h,
          background: bg.css,
          backgroundSize:
            backgroundId === "grid" ? "24px 24px, 24px 24px, auto" : undefined,
        }}
      >
        <Stage
          width={size.w}
          height={size.h}
          scaleX={size.scale}
          scaleY={size.scale}
          onMouseDown={onMouseDown}
          onMousemove={onMouseMove}
          onMouseup={onMouseUp}
          onTouchStart={onMouseDown}
          onTouchMove={onMouseMove}
          onTouchEnd={onMouseUp}
          style={{
            cursor:
              toolMode === "draw"
                ? "crosshair"
                : toolMode === "erase"
                  ? "cell"
                  : "default",
          }}
        >
          <Layer>
            {/* Cream sticker border behind Kenzie */}
            {kenzieImg && (
              <Group
                x={STAGE_W / 2}
                y={STAGE_H / 2 + 10}
                offsetX={STAGE_W / 2}
                offsetY={STAGE_H / 2}
                skewX={distortSkewX}
                skewY={distortSkewY}
              >
                <Rect
                  x={STAGE_W / 2 - 155}
                  y={40}
                  width={310}
                  height={460}
                  fill="#F4EBD4"
                  cornerRadius={8}
                  shadowColor="#1a1a1a"
                  shadowBlur={0}
                  shadowOffset={{ x: 4, y: 4 }}
                  shadowOpacity={0.35}
                />
                <KonvaImage
                  image={kenzieImg}
                  x={STAGE_W / 2 - 145}
                  y={50}
                  width={290}
                  height={440}
                  filters={
                    hairHue !== 0
                      ? [
                          // Konva filters applied via cache below
                        ]
                      : undefined
                  }
                />
                {/* Hair tint overlay */}
                {hairHue !== 0 && (
                  <Rect
                    x={STAGE_W / 2 - 145}
                    y={50}
                    width={290}
                    height={180}
                    fill={`hsl(${hairHue}, 65%, 45%)`}
                    opacity={0.28}
                    globalCompositeOperation="color"
                    listening={false}
                  />
                )}
              </Group>
            )}

            {strokes.map((s) =>
              s.stroke_data ? (
                <Line
                  key={s.id}
                  points={s.stroke_data.points}
                  stroke={s.stroke_data.color}
                  strokeWidth={s.stroke_data.strokeWidth}
                  tension={0.4}
                  lineCap="round"
                  lineJoin="round"
                  globalCompositeOperation={
                    s.stroke_data.globalCompositeOperation || "source-over"
                  }
                  listening={false}
                />
              ) : null
            )}

            {draftPoints.length > 0 && (
              <Line
                points={draftPoints}
                stroke={toolMode === "erase" ? "#ffffff" : brushColor}
                strokeWidth={brushSize}
                tension={0.4}
                lineCap="round"
                lineJoin="round"
                opacity={toolMode === "erase" ? 0.5 : 1}
                listening={false}
              />
            )}

            {accessories.map((a) =>
              a.asset_id ? (
                <AccessoryNode
                  key={a.id}
                  id={a.id}
                  assetId={a.asset_id}
                  isSelected={selectedId === a.id}
                  onSelect={() => canSelect && setSelectedId(a.id)}
                  draggable={canSelect}
                />
              ) : null
            )}
          </Layer>
        </Stage>
      </div>
      <p
        className="mt-2 text-center text-sm text-ink/60"
        style={{ fontFamily: "var(--font-script)" }}
      >
        drag stickers · doodle · make it yours
      </p>
    </div>
  );
}
