/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Image as ImageIcon,
  Moon,
  Sun,
  Plus,
  Trash2,
  RotateCcw,
  Save,
  Sparkles,
  Search,
  Undo2,
  Redo2,
  Focus,
  Maximize,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
  ZoomIn,
  ZoomOut,
  Layers3,
  ChevronRight,
  Link2,
  Move,
  MousePointerSquareDashed,
  Star,
  Heart,
  Check,
  X,
  Circle,
  Square,
  Triangle,
  Zap,
  Brain,
  Lightbulb,
} from "lucide-react";

// Standard HTML/Tailwind replacements
const Button = ({ children, className, variant, size, ...props }: any) => {
  const base = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";
  const variants: any = {
    default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
    outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
    secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
    ghost: "hover:bg-accent hover:text-accent-foreground",
  };
  const sizes: any = {
    default: "h-9 px-4 py-2",
    icon: "h-9 w-9",
  };
  return <button className={`${base} ${variants[variant || 'default']} ${sizes[size || 'default']} ${className}`} {...props}>{children}</button>;
};

const Card = ({ children, className }: any) => <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}>{children}</div>;
const CardContent = ({ children, className }: any) => <div className={`p-4 ${className}`}>{children}</div>;
const CardHeader = ({ children, className }: any) => <div className={`p-4 pb-3 ${className}`}>{children}</div>;
const CardTitle = ({ children, className }: any) => <h3 className={`text-sm font-semibold ${className}`}>{children}</h3>;
const Input = ({ className, ...props }: any) => <input className={`flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props} />;
const Switch = ({ checked, onCheckedChange, className }: any) => <button className={`peer inline-flex h-[20px] w-[36px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 ${checked ? 'bg-primary' : 'bg-input'} ${className}`} onClick={() => onCheckedChange(!checked)}><span className={`pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`}></span></button>;
const Badge = ({ children, variant, className }: any) => <div className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variant === 'secondary' ? 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80' : 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80'} ${className}`}>{children}</div>;
const Slider = ({ value, min, max, step, onValueChange, className }: any) => <input type="range" min={min} max={max} step={step} value={value[0]} onChange={(e) => onValueChange([Number(e.target.value)])} className={`w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 ${className}`} />;

const STORAGE_KEY = "mind-map-bot-v4";
const GRID_SIZE = 16;
const MIN_NODE_WIDTH = 140;
const MIN_NODE_HEIGHT = 56;
const DEFAULT_PADDING_X = 18;
const DEFAULT_PADDING_Y = 12;
const DEFAULT_FONT_SIZE = 14;
const branchColors = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#14b8a6",
  "#0ea5e9",
  "#8b5cf6",
];

const ICON_LIBRARY: Record<string, any> = {
  Star,
  Heart,
  Check,
  X,
  Circle,
  Square,
  Triangle,
  Zap,
  Brain,
  Lightbulb,
};

const snap = (value: number, step = GRID_SIZE) => Math.round(value / step) * step;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const getNodeWidth = (node: any, isRoot = false) => node.width || (isRoot ? 220 : 170);
const getNodePaddingX = (node: any) => node.paddingX ?? DEFAULT_PADDING_X;
const getNodePaddingY = (node: any) => node.paddingY ?? DEFAULT_PADDING_Y;
const getNodeFontSize = (node: any) => node.fontSize || DEFAULT_FONT_SIZE;
const getNodeMinHeight = (node: any, isRoot = false) => Math.max(MIN_NODE_HEIGHT, node.minHeight || (isRoot ? 68 : 56));

function estimateTextHeight(text: string, width: number, fontSize = DEFAULT_FONT_SIZE, paddingX = DEFAULT_PADDING_X, paddingY = DEFAULT_PADDING_Y) {
  const usableWidth = Math.max(60, width - paddingX * 2);
  const avgCharWidth = fontSize * 0.58;
  const words = String(text || "").split(/\s+/).filter(Boolean);
  if (!words.length) return paddingY * 2 + fontSize * 1.4;

  let lines = 1;
  let current = 0;

  for (const word of words) {
    const wordWidth = Math.max(avgCharWidth * 2, word.length * avgCharWidth);
    if (wordWidth > usableWidth) {
      const chunks = Math.ceil(wordWidth / usableWidth);
      if (current > 0) lines += 1;
      lines += chunks - 1;
      current = wordWidth % usableWidth;
      continue;
    }
    if (current + wordWidth > usableWidth) {
      lines += 1;
      current = wordWidth + avgCharWidth;
    } else {
      current += wordWidth + avgCharWidth;
    }
  }

  const lineHeight = fontSize * 1.35;
  return Math.ceil(lines * lineHeight + paddingY * 2);
}

const getInitialMap = () => ({
  id: crypto.randomUUID(),
  text: "Central Idea",
  x: 520,
  y: 280,
  color: "#4f46e5",
  width: 220,
  paddingX: 22,
  paddingY: 14,
  fontSize: 15,
  minHeight: 68,
  collapsed: false,
  children: [],
  links: [],
});

function clone(obj: any) {
  return JSON.parse(JSON.stringify(obj));
}

function findNode(nodeId: string, currentNode: any): any {
  if (!currentNode) return null;
  if (currentNode.id === nodeId) return currentNode;
  for (const child of currentNode.children || []) {
    const found = findNode(nodeId, child);
    if (found) return found;
  }
  return null;
}

function findParentNode(nodeId: string, currentNode: any, parent: any = null): any {
  if (!currentNode) return null;
  if (currentNode.id === nodeId) return parent;
  for (const child of currentNode.children || []) {
    const found = findParentNode(nodeId, child, currentNode);
    if (found) return found;
  }
  return null;
}

function walkNodes(node: any, callback: (node: any, parent: any, depth: number) => void, parent: any = null, depth = 0) {
  callback(node, parent, depth);
  if (node.collapsed) return;
  for (const child of node.children || []) walkNodes(child, callback, node, depth + 1);
}

function walkAllNodes(node: any, callback: (node: any, parent: any, depth: number) => void, parent: any = null, depth = 0) {
  callback(node, parent, depth);
  for (const child of node.children || []) walkAllNodes(child, callback, node, depth + 1);
}

function getAllNodes(root: any, includeCollapsed = false) {
  const items: any[] = [];
  const walker = includeCollapsed ? walkAllNodes : walkNodes;
  walker(root, (node, parent, depth) => items.push({ node, parent, depth }));
  return items;
}

function getNodeRect(node: any, isRoot = false) {
  const width = getNodeWidth(node, isRoot);
  const height = Math.max(
    getNodeMinHeight(node, isRoot),
    estimateTextHeight(node.text, width, getNodeFontSize(node), getNodePaddingX(node), getNodePaddingY(node))
  );
  return { width, height };
}

function getNodeBounds(root: any) {
  const all = getAllNodes(root).map(({ node, parent }) => {
    const { width, height } = getNodeRect(node, !parent);
    return {
      left: node.x,
      top: node.y,
      right: node.x + width,
      bottom: node.y + height,
    };
  });

  if (!all.length) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  return {
    minX: Math.min(...all.map((n) => n.left)),
    minY: Math.min(...all.map((n) => n.top)),
    maxX: Math.max(...all.map((n) => n.right)),
    maxY: Math.max(...all.map((n) => n.bottom)),
  };
}

function normalizeTree(root: any) {
  const draft = clone(root);
  if (!Array.isArray(draft.links)) draft.links = [];
  walkAllNodes(draft, (node, parent) => {
    const isRoot = !parent;
    node.width = getNodeWidth(node, isRoot);
    node.paddingX = getNodePaddingX(node);
    node.paddingY = getNodePaddingY(node);
    node.fontSize = getNodeFontSize(node);
    node.minHeight = getNodeMinHeight(node, isRoot);
    node.collapsed = Boolean(node.collapsed);
  });
  return draft;
}

function centeredLayout(root: any, width = 1200, height = 700) {
  const map = normalizeTree(root);
  const rootRect = getNodeRect(map, true);
  map.x = width / 2 - rootRect.width / 2;
  map.y = height / 2 - rootRect.height / 2;

  const layoutChildren = (node: any, parentIsRoot = false) => {
    if (node.collapsed) return;
    const count = node.children.length;
    const parentRect = getNodeRect(node, parentIsRoot);
    const spread = 110;
    node.children.forEach((child: any, index: number) => {
      child.x = node.x + parentRect.width + 80;
      child.y = node.y + (index - (count - 1) / 2) * spread;
      layoutChildren(child, false);
    });
  };

  layoutChildren(map, true);
  return map;
}

function isPointInRect(point: any, rect: any) {
  return point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;
}

function downloadSvgAsImage(svgEl: any, nodesRoot: any, format = "png", isDark = false) {
  const bounds = getNodeBounds(nodesRoot);
  const padding = 120;
  const width = Math.max(900, bounds.maxX - bounds.minX + padding * 2);
  const height = Math.max(600, bounds.maxY - bounds.minY + padding * 2);
  const cloneSvg = svgEl.cloneNode(true);
  cloneSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  cloneSvg.setAttribute("width", width);
  cloneSvg.setAttribute("height", height);
  cloneSvg.setAttribute("viewBox", `${bounds.minX - padding} ${bounds.minY - padding} ${width} ${height}`);

  const serializer = new XMLSerializer();
  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${bounds.minX - padding} ${bounds.minY - padding} ${width} ${height}">
      <rect width="100%" height="100%" fill="${isDark ? "#020617" : "#f8fafc"}" />
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="8" stdDeviation="8" flood-opacity="0.12" />
        </filter>
      </defs>
      ${serializer.serializeToString(cloneSvg).replace(/^<svg[^>]*>|<\/svg>$/g, "")}
    </svg>`;

  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const img = new window.Image();

  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = width * 2;
    canvas.height = height * 2;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(2, 2);
    ctx.drawImage(img, 0, 0, width, height);
    const link = document.createElement("a");
    link.download = `mind-map-${Date.now()}.${format === "jpeg" ? "jpg" : format}`;
    link.href = canvas.toDataURL(`image/${format}`, format === "jpeg" ? 0.92 : 1);
    link.click();
    URL.revokeObjectURL(url);
  };

  img.src = url;
}

function MindMapNode({
  node,
  parent,
  selectedIds,
  editingId,
  setEditingId,
  onSelect,
  onUpdateText,
  onUpdateColor,
  onUpdateIcon,
  onAdd,
  onDelete,
  onPointerDown,
  onResize,
  onToggleCollapse,
  onStartLink,
  isLinkSource,
  viewportScale,
  zoomResponsive,
}: any) {
  const isRoot = !parent;
  const isSelected = selectedIds.has(node.id);
  const multiSelected = selectedIds.size > 1 && isSelected;
  const [draft, setDraft] = useState(node.text);
  const resizingRef = useRef<any>(null);

  const width = getNodeWidth(node, isRoot);
  const height = Math.max(
    getNodeMinHeight(node, isRoot),
    estimateTextHeight(node.text, width, getNodeFontSize(node), getNodePaddingX(node), getNodePaddingY(node))
  );
  const visualScale = zoomResponsive ? Math.max(0.92, Math.min(1.18, 1 / viewportScale)) : 1;

  useEffect(() => setDraft(node.text), [node.text]);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      const resizing = resizingRef.current as { anchorId: string, startW: number, startH: number, groupIds: string[] } | null;
      if (!resizing) return;
      const dx = (e.clientX - (resizingRef.current as any).startX) / viewportScale;
      const dy = (e.clientY - (resizingRef.current as any).startY) / viewportScale;
      onResize(
        resizing.anchorId,
        {
          width: Math.max(MIN_NODE_WIDTH, snap(resizing.startW + dx)),
          minHeight: Math.max(MIN_NODE_HEIGHT, snap(resizing.startH + dy)),
        },
        resizing.groupIds
      );
    };

    const up = () => {
      resizingRef.current = null;
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, [onResize, viewportScale]);

  const startResize = (e: React.MouseEvent) => {
    e.stopPropagation();
    resizingRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startW: width,
      startH: node.minHeight || height,
      anchorId: node.id,
      groupIds: multiSelected ? Array.from(selectedIds) : [node.id],
    };
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="absolute"
      style={{ left: node.x, top: node.y }}
    >
      <div
        className={[
          "group relative flex items-center justify-center rounded-2xl border bg-white/95 text-center shadow-lg backdrop-blur transition dark:bg-slate-900/95 dark:text-slate-100 dark:border-slate-700",
          isRoot ? "border-0 bg-gradient-to-br from-indigo-600 to-violet-600 text-white" : "",
          isSelected ? "ring-4 ring-indigo-200" : "",
          multiSelected ? "ring-4 ring-emerald-200" : "",
          isLinkSource ? "ring-4 ring-amber-200" : "",
        ].join(" ")}
        style={{
          borderColor: !isRoot ? node.color : undefined,
          width,
          minHeight: height,
          paddingLeft: getNodePaddingX(node),
          paddingRight: getNodePaddingX(node),
          paddingTop: getNodePaddingY(node),
          paddingBottom: getNodePaddingY(node),
          transform: `scale(${visualScale})`,
          transformOrigin: "center center",
        }}
        onMouseDown={(e) => onPointerDown(e, node.id)}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(node.id, e.metaKey || e.ctrlKey);
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          setEditingId(node.id);
        }}
      >
        {editingId === node.id ? (
          <div className="flex flex-col gap-2">
            <textarea
              autoFocus
              value={draft}
              rows={1}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => {
                onUpdateText(node.id, draft.trim() || "New Idea");
                setEditingId(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setDraft(node.text);
                  setEditingId(null);
                }
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  onUpdateText(node.id, draft.trim() || "New Idea");
                  setEditingId(null);
                }
              }}
              className="w-full resize-none overflow-hidden bg-transparent text-center font-medium outline-none"
              style={{ fontSize: getNodeFontSize(node), lineHeight: 1.35 }}
            />
            <div className="flex flex-wrap justify-center gap-1">
              <button
                className="rounded p-1 hover:bg-slate-200 dark:hover:bg-slate-700"
                onClick={() => onUpdateIcon(node.id, null)}
              >
                <X className="h-4 w-4" />
              </button>
              {Object.entries(ICON_LIBRARY).map(([name, Icon]) => (
                <button
                  key={name}
                  className={`rounded p-1 hover:bg-slate-200 dark:hover:bg-slate-700 ${node.icon === name ? "bg-slate-200 dark:bg-slate-700" : ""}`}
                  onClick={() => onUpdateIcon(node.id, name)}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <span
            className="flex items-center break-words whitespace-normal leading-tight"
            style={{
              maxWidth: width - getNodePaddingX(node) * 2,
              fontSize: getNodeFontSize(node),
              fontWeight: 600,
            }}
          >
            {node.icon && ICON_LIBRARY[node.icon] && (
              <span className="mr-1.5">
                {React.createElement(ICON_LIBRARY[node.icon], { className: "h-4 w-4" })}
              </span>
            )}
            {node.text}
          </span>
        )}

        <div className="absolute -right-3 top-1/2 flex -translate-y-1/2 gap-2 opacity-0 transition group-hover:opacity-100">
          <button
            className="flex h-8 w-8 items-center justify-center rounded-full border bg-white shadow dark:border-slate-700 dark:bg-slate-800"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onAdd(node.id);
            }}
            title="Add child"
          >
            <Plus className="h-4 w-4" style={{ color: node.color }} />
          </button>
        </div>

        {(node.children?.length ?? 0) > 0 && (
          <button
            className="absolute -left-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border bg-white shadow dark:border-slate-700 dark:bg-slate-800"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse(node.id);
            }}
            title={node.collapsed ? "Expand branch" : "Collapse branch"}
          >
            <ChevronRight className={`h-4 w-4 transition-transform ${node.collapsed ? "rotate-0" : "rotate-90"}`} />
          </button>
        )}

        <button
          className="absolute -bottom-2 left-1/2 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full border bg-white opacity-0 shadow transition group-hover:opacity-100 dark:border-slate-700 dark:bg-slate-800"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onStartLink(node.id);
          }}
          title="Start relationship link"
        >
          <Link2 className="h-3.5 w-3.5 text-amber-500" />
        </button>

        {!isRoot && (
          <button
            className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full border border-red-200 bg-white text-red-500 opacity-0 shadow transition group-hover:opacity-100 dark:border-red-900 dark:bg-slate-800"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node.id);
            }}
            title="Delete node"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}

        {isSelected && (
          <div
            onMouseDown={startResize}
            className="absolute bottom-1 right-1 h-3.5 w-3.5 cursor-se-resize rounded-sm bg-indigo-400 opacity-90"
            title={multiSelected ? "Resize selected nodes" : "Resize node"}
          />
        )}
        {isSelected && (
          <input
            type="color"
            value={node.color}
            onChange={(e) => onUpdateColor(node.id, e.target.value)}
            className="absolute -top-6 left-0 h-6 w-6 cursor-pointer border-0 bg-transparent p-0"
            title="Change color"
          />
        )}
      </div>

      {isSelected && (
        <div
          className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 rounded-full bg-slate-900 px-2 py-1 text-[10px] text-white shadow"
          style={{ transform: `translateX(-50%) scale(${Math.max(0.9, 1 / viewportScale)})` }}
        >
          {multiSelected ? "Group resize enabled" : "Double-click to edit"}
        </div>
      )}
    </motion.div>
  );
}

export default function MindMapWebApp() {
  const [mindMap, setMindMap] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? normalizeTree(JSON.parse(saved)) : getInitialMap();
    } catch {
      return getInitialMap();
    }
  });
  const [selectedIds, setSelectedIds] = useState(new Set<string>());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [future, setFuture] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isDark, setIsDark] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [zoomResponsive, setZoomResponsive] = useState(true);
  const [selectionMode, setSelectionMode] = useState(true);
  const [viewport, setViewport] = useState({ x: 0, y: 0, scale: 1 });
  const [selectionBox, setSelectionBox] = useState<any>(null);
  const [linkDraft, setLinkDraft] = useState<any>(null);
  const draggingRef = useRef<any>(null);
  const panningRef = useRef<any>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mindMap));
  }, [mindMap]);

  const pushHistory = useCallback((snapshot: any) => {
    setHistory((prev) => [...prev.slice(-29), clone(snapshot)]);
    setFuture([]);
  }, []);

  const updateMap = useCallback(
    (updater: any) => {
      setMindMap((current) => {
        pushHistory(current);
        const next = typeof updater === "function" ? updater(clone(current)) : updater;
        return normalizeTree(next);
      });
    },
    [pushHistory]
  );

  const addNode = useCallback(
    (parentId: string) => {
      updateMap((draft: any) => {
        const parent = findNode(parentId, draft);
        if (!parent) return draft;
        const siblingIndex = parent.children.length;
        const parentRect = getNodeRect(parent, parentId === draft.id);
        parent.children.push({
          id: crypto.randomUUID(),
          text: "New Idea",
          x: snap(parent.x + parentRect.width + 80),
          y: snap(parent.y + siblingIndex * 96 - Math.max(0, siblingIndex - 1) * 10),
          color: branchColors[siblingIndex % branchColors.length],
          width: 170,
          paddingX: DEFAULT_PADDING_X,
          paddingY: DEFAULT_PADDING_Y,
          fontSize: DEFAULT_FONT_SIZE,
          minHeight: 56,
          collapsed: false,
          children: [],
        });
        return draft;
      });
    },
    [updateMap]
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      if (nodeId === mindMap.id) return;
      updateMap((draft: any) => {
        const parent = findParentNode(nodeId, draft);
        if (!parent) return draft;
        parent.children = parent.children.filter((child: any) => child.id !== nodeId);
        draft.links = (draft.links || []).filter((link: any) => link.from !== nodeId && link.to !== nodeId);
        return draft;
      });
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(nodeId);
        return next;
      });
    },
    [mindMap.id, updateMap]
  );

  const deleteSelected = useCallback(() => {
    Array.from(selectedIds).forEach((id) => {
      if (id !== mindMap.id) deleteNode(id);
    });
  }, [selectedIds, deleteNode, mindMap.id]);

  const updateNodeText = useCallback(
    (nodeId: string, text: string) => {
      updateMap((draft: any) => {
        const node = findNode(nodeId, draft);
        if (node) node.text = text;
        return draft;
      });
    },
    [updateMap]
  );

  const updateNodeColor = useCallback(
    (nodeId: string, color: string) => {
      updateMap((draft: any) => {
        const node = findNode(nodeId, draft);
        if (node) node.color = color;
        return draft;
      });
    },
    [updateMap]
  );

  const updateNodeIcon = useCallback(
    (nodeId: string, icon: string | null) => {
      updateMap((draft: any) => {
        const node = findNode(nodeId, draft);
        if (node) node.icon = icon;
        return draft;
      });
    },
    [updateMap]
  );

  const resizeNodes = useCallback(
    (anchorId: string, size: any, groupIds: string[] = [anchorId]) => {
      updateMap((draft: any) => {
        groupIds.forEach((id) => {
          const node = findNode(id, draft);
          if (!node) return;
          node.width = Math.max(MIN_NODE_WIDTH, snap(size.width));
          node.minHeight = Math.max(MIN_NODE_HEIGHT, snap(size.minHeight));
        });
        return draft;
      });
    },
    [updateMap]
  );

  const updateSelectedStyle = useCallback(
    (changes: any) => {
      if (!selectedIds.size) return;
      updateMap((draft: any) => {
        Array.from(selectedIds).forEach((id) => {
          const node = findNode(id as string, draft);
          if (!node) return;
          Object.assign(node, changes);
        });
        return draft;
      });
    },
    [selectedIds, updateMap]
  );

  const toggleCollapse = useCallback(
    (nodeId: string) => {
      updateMap((draft: any) => {
        const node = findNode(nodeId, draft);
        if (node) node.collapsed = !node.collapsed;
        return draft;
      });
    },
    [updateMap]
  );

  const startLink = useCallback((nodeId: string) => {
    setLinkDraft((current: any) => (current?.from === nodeId ? null : { from: nodeId }));
  }, []);

  const completeLink = useCallback(
    (targetId: string) => {
      if (!linkDraft?.from || linkDraft.from === targetId) {
        setLinkDraft(null);
        return;
      }
      updateMap((draft: any) => {
        const exists = (draft.links || []).some(
          (link: any) =>
            (link.from === linkDraft.from && link.to === targetId) ||
            (link.from === targetId && link.to === linkDraft.from)
        );
        if (!exists) {
          draft.links.push({ id: crypto.randomUUID(), from: linkDraft.from, to: targetId });
        }
        return draft;
      });
      setLinkDraft(null);
    },
    [linkDraft, updateMap]
  );

  const removeLastLink = useCallback(() => {
    updateMap((draft: any) => {
      draft.links = (draft.links || []).slice(0, -1);
      return draft;
    });
  }, [updateMap]);

  const resetMap = () => {
    pushHistory(mindMap);
    setMindMap(getInitialMap());
    setFuture([]);
    setSelectedIds(new Set());
    setLinkDraft(null);
  };

  const autoLayout = () => {
    pushHistory(mindMap);
    setMindMap(centeredLayout(mindMap, 1200, 700));
  };

  const undo = useCallback(() => {
    setHistory((prev) => {
      if (!prev.length) return prev;
      const nextHistory = [...prev];
      const last = nextHistory.pop();
      setFuture((f) => [clone(mindMap), ...f].slice(0, 30));
      setMindMap(normalizeTree(last));
      return nextHistory;
    });
  }, [mindMap]);

  const redo = useCallback(() => {
    setFuture((prev) => {
      if (!prev.length) return prev;
      const [next, ...rest] = prev;
      setHistory((h) => [...h.slice(-29), clone(mindMap)]);
      setMindMap(normalizeTree(next));
      return rest;
    });
  }, [mindMap]);

  const nodesFlat = useMemo(() => getAllNodes(mindMap), [mindMap]);
  const nodeLookup = useMemo(() => Object.fromEntries(nodesFlat.map(({ node, parent }) => [node.id, { node, parent }])), [nodesFlat]);

  const fitToScreen = useCallback(() => {
    const bounds = getNodeBounds(mindMap);
    const board = boardRef.current;
    if (!board) return;
    const width = board.clientWidth;
    const height = board.clientHeight;
    const contentWidth = Math.max(1, bounds.maxX - bounds.minX + 200);
    const contentHeight = Math.max(1, bounds.maxY - bounds.minY + 160);
    const scale = Math.min(1.1, width / contentWidth, height / contentHeight);
    setViewport({
      scale,
      x: width / 2 - ((bounds.minX + bounds.maxX) / 2) * scale,
      y: height / 2 - ((bounds.minY + bounds.maxY) / 2) * scale,
    });
  }, [mindMap]);

  useEffect(() => {
    const t = setTimeout(() => fitToScreen(), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (draggingRef.current) {
        const { groupIds, base, offsets } = draggingRef.current;
        setMindMap((current) => {
          const draft = clone(current);
          const nextBaseX = snap((e.clientX - base.offsetX - viewport.x) / viewport.scale);
          const nextBaseY = snap((e.clientY - base.offsetY - viewport.y) / viewport.scale);
          groupIds.forEach((id: string) => {
            const node = findNode(id, draft);
            const offset = offsets[id as keyof typeof offsets];
            if (node && offset) {
              node.x = snap(nextBaseX + offset.dx);
              node.y = snap(nextBaseY + offset.dy);
            }
          });
          return draft;
        });
      }

      if (panningRef.current) {
        const dx = e.clientX - panningRef.current.startX;
        const dy = e.clientY - panningRef.current.startY;
        setViewport((v) => ({ ...v, x: panningRef.current.originX + dx, y: panningRef.current.originY + dy }));
      }

      if (selectionBox) {
        const rect = boardRef.current?.getBoundingClientRect();
        if (!rect) return;
        setSelectionBox((current: any) =>
          current
            ? {
                ...current,
                currentX: e.clientX - rect.left,
                currentY: e.clientY - rect.top,
              }
            : null
        );
      }
    };

    const onUp = () => {
      draggingRef.current = null;
      panningRef.current = null;
      if (selectionBox) {
        const x = Math.min(selectionBox.startX, selectionBox.currentX);
        const y = Math.min(selectionBox.startY, selectionBox.currentY);
        const width = Math.abs(selectionBox.currentX - selectionBox.startX);
        const height = Math.abs(selectionBox.currentY - selectionBox.startY);
        const worldRect = {
          x: (x - viewport.x) / viewport.scale,
          y: (y - viewport.y) / viewport.scale,
          width: width / viewport.scale,
          height: height / viewport.scale,
        };
        const nextSelected = nodesFlat
          .filter(({ node, parent }) => {
            const rect = getNodeRect(node, !parent);
            return isPointInRect({ x: node.x + rect.width / 2, y: node.y + rect.height / 2 }, worldRect);
          })
          .map(({ node }) => node.id);
        setSelectedIds(new Set(nextSelected));
        setSelectionBox(null);
      }
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [viewport, selectionBox, nodesFlat]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if (meta && (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
      if (meta && e.key.toLowerCase() === "s") {
        e.preventDefault();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mindMap));
      }
      if (meta && e.key.toLowerCase() === "a") {
        e.preventDefault();
        setSelectedIds(new Set(nodesFlat.map(({ node }) => node.id)));
      }
      if (selectedIds.size && e.key === "Delete") deleteSelected();
      if (selectedIds.size === 1 && e.key === "Tab") {
        e.preventDefault();
        addNode(Array.from(selectedIds)[0]);
      }
      if (selectedIds.size === 1 && e.key.toLowerCase() === " ") {
        e.preventDefault();
        toggleCollapse(Array.from(selectedIds)[0]);
      }
      if (meta && e.key === "=") {
        e.preventDefault();
        setViewport((v) => ({ ...v, scale: Math.min(2, Number((v.scale + 0.1).toFixed(2))) }));
      }
      if (meta && e.key === "-") {
        e.preventDefault();
        setViewport((v) => ({ ...v, scale: Math.max(0.4, Number((v.scale - 0.1).toFixed(2))) }));
      }
      if (e.key === "Escape") {
        setLinkDraft(null);
        setSelectionBox(null);
      }
      if (meta && e.key.toLowerCase() === "l" && selectedIds.size === 1) {
        e.preventDefault();
        startLink(Array.from(selectedIds)[0]);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedIds, undo, redo, addNode, deleteSelected, mindMap, nodesFlat, toggleCollapse, startLink]);

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
      e.preventDefault();
      const rect = board.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const zoomFactor = e.deltaY > 0 ? 0.92 : 1.08;
      setViewport((v) => {
        const nextScale = clamp(Number((v.scale * zoomFactor).toFixed(3)), 0.35, 2.5);
        const worldX = (mouseX - v.x) / v.scale;
        const worldY = (mouseY - v.y) / v.scale;
        return {
          scale: nextScale,
          x: mouseX - worldX * nextScale,
          y: mouseY - worldY * nextScale,
        };
      });
    };
    board.addEventListener("wheel", onWheel, { passive: false });
    return () => board.removeEventListener("wheel", onWheel);
  }, []);

  const startDrag = (e: React.MouseEvent, nodeId: string) => {
    if (e.target instanceof Element && (e.target.closest("button") || e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT")) return;
    if (linkDraft?.from) {
      completeLink(nodeId);
      return;
    }
    const useGroup = (selectedIds.has(nodeId) ? Array.from(selectedIds) : [nodeId]) as string[];
    if (!selectedIds.has(nodeId)) {
      setSelectedIds(new Set([nodeId]));
    }
    pushHistory(mindMap);
    const anchor = findNode(nodeId, mindMap);
    const offsets: any = {};
    useGroup.forEach((id) => {
      const node = findNode(id, mindMap);
      if (node && anchor) offsets[id] = { dx: node.x - anchor.x, dy: node.y - anchor.y };
    });
    draggingRef.current = {
      groupIds: useGroup,
      offsets,
      base: {
        offsetX: e.clientX - (anchor?.x ?? 0) * viewport.scale - viewport.x,
        offsetY: e.clientY - (anchor?.y ?? 0) * viewport.scale - viewport.y,
      },
    };
  };

  const filteredIds = useMemo(() => {
    if (!search.trim()) return new Set(nodesFlat.map(({ node }) => node.id));
    const q = search.toLowerCase();
    return new Set(nodesFlat.filter(({ node }) => node.text.toLowerCase().includes(q)).map(({ node }) => node.id));
  }, [nodesFlat, search]);

  const selectedNodes = useMemo(() => nodesFlat.filter(({ node }) => selectedIds.has(node.id)).map(({ node }) => node), [nodesFlat, selectedIds]);

  const selectionSummary = useMemo(() => {
    const first = selectedNodes[0];
    if (!first) return null;
    return {
      paddingX: getNodePaddingX(first),
      paddingY: getNodePaddingY(first),
      fontSize: getNodeFontSize(first),
      width: getNodeWidth(first),
      minHeight: first.minHeight || getNodeMinHeight(first),
    };
  }, [selectedNodes]);

  const lines = useMemo(() => {
    const items: any[] = [];
    walkNodes(mindMap, (node, parent) => {
      if (!parent) return;
      const parentRect = getNodeRect(parent, parent.id === mindMap.id);
      const childRect = getNodeRect(node, false);
      const x1 = parent.x + parentRect.width;
      const y1 = parent.y + parentRect.height / 2;
      const x2 = node.x;
      const y2 = node.y + childRect.height / 2;
      const c = Math.abs(x2 - x1) * 0.55;
      items.push({
        id: `${parent.id}-${node.id}`,
        color: node.color,
        d: `M ${x1} ${y1} C ${x1 + c} ${y1}, ${x2 - c} ${y2}, ${x2} ${y2}`,
      });
    });
    return items;
  }, [mindMap]);

  const relationshipLines = useMemo(() => {
    return (mindMap.links || [])
      .map((link: any) => {
        const fromEntry = nodeLookup[link.from];
        const toEntry = nodeLookup[link.to];
        if (!fromEntry || !toEntry) return null;
        const fromRect = getNodeRect(fromEntry.node, !fromEntry.parent);
        const toRect = getNodeRect(toEntry.node, !toEntry.parent);
        const x1 = fromEntry.node.x + fromRect.width / 2;
        const y1 = fromEntry.node.y + fromRect.height / 2;
        const x2 = toEntry.node.x + toRect.width / 2;
        const y2 = toEntry.node.y + toRect.height / 2;
        const c = Math.max(60, Math.abs(x2 - x1) * 0.35);
        return {
          id: link.id,
          d: `M ${x1} ${y1} C ${x1 + c} ${y1 - c / 2}, ${x2 - c} ${y2 - c / 2}, ${x2} ${y2}`,
        };
      })
      .filter(Boolean);
  }, [mindMap, nodeLookup]);

  const zoomIn = () => setViewport((v) => ({ ...v, scale: Math.min(2.5, Number((v.scale + 0.1).toFixed(2))) }));
  const zoomOut = () => setViewport((v) => ({ ...v, scale: Math.max(0.35, Number((v.scale - 0.1).toFixed(2))) }));

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target instanceof Element && (e.target !== boardRef.current && e.target.closest("button"))) return;
    if (e.shiftKey || selectionMode) {
      const rect = boardRef.current?.getBoundingClientRect();
      if (!rect) return;
      setSelectionBox({
        startX: e.clientX - rect.left,
        startY: e.clientY - rect.top,
        currentX: e.clientX - rect.left,
        currentY: e.clientY - rect.top,
      });
      return;
    }
    panningRef.current = { startX: e.clientX, startY: e.clientY, originX: viewport.x, originY: viewport.y };
    setSelectedIds(new Set());
  };

  const selectionRect = selectionBox
    ? {
        left: Math.min(selectionBox.startX, selectionBox.currentX),
        top: Math.min(selectionBox.startY, selectionBox.currentY),
        width: Math.abs(selectionBox.currentX - selectionBox.startX),
        height: Math.abs(selectionBox.currentY - selectionBox.startY),
      }
    : null;

  return (
    <div className={isDark ? "dark min-h-screen bg-slate-950" : "min-h-screen bg-slate-50"}>
      <div className="flex h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-50">
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="z-20 w-[340px] overflow-y-auto border-r border-slate-200 bg-white/85 p-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80"
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-indigo-500" />
                    <h1 className="text-lg font-bold">Mind Map Studio</h1>
                  </div>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    MindMeister-style canvas with collapse, linking, zoom, pan, and marquee select.
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                  <PanelLeftClose className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <Card className="rounded-2xl border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Workspace</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search nodes" className="pl-9" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" onClick={undo} disabled={!history.length} className="justify-start rounded-xl">
                        <Undo2 className="mr-2 h-4 w-4" />Undo
                      </Button>
                      <Button variant="outline" onClick={redo} disabled={!future.length} className="justify-start rounded-xl">
                        <Redo2 className="mr-2 h-4 w-4" />Redo
                      </Button>
                      <Button variant="outline" onClick={fitToScreen} className="justify-start rounded-xl">
                        <Focus className="mr-2 h-4 w-4" />Fit view
                      </Button>
                      <Button variant="outline" onClick={autoLayout} className="justify-start rounded-xl">
                        <Maximize className="mr-2 h-4 w-4" />Auto layout
                      </Button>
                      <Button variant="outline" onClick={resetMap} className="justify-start rounded-xl">
                        <RotateCcw className="mr-2 h-4 w-4" />Reset
                      </Button>
                      <Button variant="outline" onClick={() => localStorage.setItem(STORAGE_KEY, JSON.stringify(mindMap))} className="justify-start rounded-xl">
                        <Save className="mr-2 h-4 w-4" />Save
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Selection</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Layers3 className="h-4 w-4" />Selected nodes
                      </div>
                      <Badge variant="secondary">{selectedIds.size}</Badge>
                    </div>

                    {selectionSummary ? (
                      <div className="space-y-4">
                        <div>
                          <div className="mb-2 flex items-center justify-between text-sm"><span>Horizontal padding</span><span>{selectionSummary.paddingX}px</span></div>
                          <Slider value={[selectionSummary.paddingX]} min={8} max={40} step={2} onValueChange={([value]) => updateSelectedStyle({ paddingX: value })} />
                        </div>
                        <div>
                          <div className="mb-2 flex items-center justify-between text-sm"><span>Vertical padding</span><span>{selectionSummary.paddingY}px</span></div>
                          <Slider value={[selectionSummary.paddingY]} min={8} max={32} step={2} onValueChange={([value]) => updateSelectedStyle({ paddingY: value })} />
                        </div>
                        <div>
                          <div className="mb-2 flex items-center justify-between text-sm"><span>Font size</span><span>{selectionSummary.fontSize}px</span></div>
                          <Slider value={[selectionSummary.fontSize]} min={12} max={22} step={1} onValueChange={([value]) => updateSelectedStyle({ fontSize: value })} />
                        </div>
                        <div>
                          <div className="mb-2 flex items-center justify-between text-sm"><span>Base width</span><span>{selectionSummary.width}px</span></div>
                          <Slider value={[selectionSummary.width]} min={140} max={360} step={GRID_SIZE} onValueChange={([value]) => updateSelectedStyle({ width: value })} />
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 dark:text-slate-400">Select one or more nodes to adjust spacing and text layout.</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Canvas Tools</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                      <div className="flex items-center gap-2 text-sm font-medium"><MousePointerSquareDashed className="h-4 w-4" />Marquee select mode</div>
                      <Switch checked={selectionMode} onCheckedChange={setSelectionMode} />
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                      <div className="flex items-center gap-2 text-sm font-medium"><Move className="h-4 w-4" />Pan with drag when off</div>
                      <Badge variant="secondary">{selectionMode ? "Select" : "Pan"}</Badge>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                      <div className="flex items-center gap-2 text-sm font-medium"><Link2 className="h-4 w-4" />Relationship links</div>
                      <Badge variant="secondary">{(mindMap.links || []).length}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" className="justify-start rounded-xl" onClick={() => selectedIds.size === 1 && toggleCollapse(Array.from(selectedIds)[0])} disabled={selectedIds.size !== 1}>
                        <ChevronRight className="mr-2 h-4 w-4" />Toggle
                      </Button>
                      <Button variant="outline" className="justify-start rounded-xl" onClick={removeLastLink} disabled={!(mindMap.links || []).length}>
                        <Link2 className="mr-2 h-4 w-4" />Undo link
                      </Button>
                    </div>
                    {linkDraft?.from && <Badge variant="secondary">Select another node to finish linking</Badge>}
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">View & Export</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <Button className="rounded-xl" onClick={() => downloadSvgAsImage(svgRef.current, mindMap, "png", isDark)}>
                        <Download className="mr-2 h-4 w-4" />PNG
                      </Button>
                      <Button variant="secondary" className="rounded-xl" onClick={() => downloadSvgAsImage(svgRef.current, mindMap, "jpeg", isDark)}>
                        <ImageIcon className="mr-2 h-4 w-4" />JPG
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" onClick={zoomOut} className="justify-start rounded-xl"><ZoomOut className="mr-2 h-4 w-4" />Zoom out</Button>
                      <Button variant="outline" onClick={zoomIn} className="justify-start rounded-xl"><ZoomIn className="mr-2 h-4 w-4" />Zoom in</Button>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                      <div className="flex items-center gap-2">{isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}<span className="text-sm font-medium">Dark mode</span></div>
                      <Switch checked={isDark} onCheckedChange={setIsDark} />
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                      <span className="text-sm font-medium">Zoom-aware node scaling</span>
                      <Switch checked={zoomResponsive} onCheckedChange={setZoomResponsive} />
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                      <span className="text-sm font-medium">Quick guide</span>
                      <Switch checked={showGuide} onCheckedChange={setShowGuide} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">Collapse branches</Badge>
                      <Badge variant="secondary">Free links</Badge>
                      <Badge variant="secondary">Wheel zoom</Badge>
                      <Badge variant="secondary">Marquee select</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        <main className="relative flex-1 overflow-hidden">
          {!sidebarOpen && (
            <Button variant="secondary" size="icon" className="absolute left-4 top-4 z-20 rounded-full shadow" onClick={() => setSidebarOpen(true)}>
              <PanelLeftOpen className="h-4 w-4" />
            </Button>
          )}

          <div
            ref={boardRef}
            className="relative h-full w-full overflow-hidden bg-[radial-gradient(circle_at_center,rgba(148,163,184,0.18)_1px,transparent_1px)] [background-size:22px_22px] dark:bg-[radial-gradient(circle_at_center,rgba(148,163,184,0.15)_1px,transparent_1px)]"
            onMouseDown={handleCanvasMouseDown}
            onDoubleClick={() => setSelectedIds(new Set())}
          >
            <div className="absolute inset-0 origin-top-left" style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})` }}>
              <svg ref={svgRef} className="absolute inset-0 h-full w-full overflow-visible">
                <rect x="-10000" y="-10000" width="20000" height="20000" fill={isDark ? "#020617" : "transparent"} />
                <defs>
                  <filter id="glow"><feDropShadow dx="0" dy="8" stdDeviation="8" floodOpacity="0.12" /></filter>
                  <marker id="linkArrow" markerWidth="8" markerHeight="8" refX="5" refY="3" orient="auto" markerUnits="strokeWidth">
                    <path d="M0,0 L0,6 L6,3 z" fill="#f59e0b" />
                  </marker>
                </defs>
                {lines.map((line: any) => (
                  <path key={line.id} d={line.d} fill="none" stroke={line.color} strokeWidth="3" strokeLinecap="round" opacity="0.9" />
                ))}
                {relationshipLines.map((line: any) => (
                  <path key={line.id} d={line.d} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="8 6" markerEnd="url(#linkArrow)" opacity="0.95" />
                ))}
              </svg>

              <AnimatePresence>
                {nodesFlat.map(({ node, parent }) => {
                  const visible = filteredIds.has(node.id) || !search.trim();
                  if (!visible) return null;
                  return (
                    <MindMapNode
                      key={node.id}
                      node={node}
                      parent={parent}
                      selectedIds={selectedIds}
                      editingId={editingId}
                      setEditingId={setEditingId}
                      onSelect={(id: string, additive: boolean) => {
                        if (linkDraft?.from && linkDraft.from !== id) {
                          completeLink(id);
                          return;
                        }
                        setSelectedIds((prev) => {
                          if (!additive) return new Set([id]);
                          const next = new Set(prev);
                          if (next.has(id)) next.delete(id);
                          else next.add(id);
                          return next;
                        });
                      }}
                      onUpdateText={updateNodeText}
                      onUpdateColor={updateNodeColor}
                      onUpdateIcon={updateNodeIcon}
                      onAdd={addNode}
                      onDelete={deleteNode}
                      onPointerDown={startDrag}
                      onResize={resizeNodes}
                      onToggleCollapse={toggleCollapse}
                      onStartLink={startLink}
                      isLinkSource={linkDraft?.from === node.id}
                      viewportScale={viewport.scale}
                      zoomResponsive={zoomResponsive}
                    />
                  );
                })}
              </AnimatePresence>
            </div>

            {selectionRect && (
              <div
                className="pointer-events-none absolute z-30 border border-indigo-400 bg-indigo-400/10"
                style={{ left: selectionRect.left, top: selectionRect.top, width: selectionRect.width, height: selectionRect.height }}
              />
            )}

            {showGuide && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-5 right-5 z-20 max-w-sm rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-xl backdrop-blur transition-colors dark:border-slate-800 dark:bg-slate-900/85"
              >
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="font-semibold">Quick Guide</h2>
                  <Button variant="ghost" size="sm" onClick={() => setShowGuide(false)}>
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                </div>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <li>• Hover a node and use the arrow button to collapse or expand a branch.</li>
                  <li>• Use the chain icon, then click another node to create relationship links.</li>
                  <li>• Scroll to zoom toward your cursor. Turn off marquee mode to drag-pan the canvas.</li>
                  <li>• Drag on empty space to box-select nodes, then move or resize them as a group.</li>
                </ul>
              </motion.div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
