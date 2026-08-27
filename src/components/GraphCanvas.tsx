import { useEffect, useMemo, useRef, useState } from 'react';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Entry } from '../types';

interface GraphNode extends SimulationNodeDatum {
  id: string;
  title: string;
  category: string;
  mainImage?: string;
}

interface GraphLink extends SimulationLinkDatum<GraphNode> {
  label: string;
}

interface Props {
  entries: Entry[];
  centerEntryId?: string;
  width?: number;
  height?: number;
}

const MIN_SCALE = 0.3;
const MAX_SCALE = 4;

function categoryColor(category: string): string {
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 55%)`;
}

function clampScale(k: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, k));
}

interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

function computeFitView(bounds: Bounds, width: number, height: number) {
  const pad = 70;
  const boundsWidth = Math.max(1, bounds.maxX - bounds.minX + pad * 2);
  const boundsHeight = Math.max(1, bounds.maxY - bounds.minY + pad * 2);
  const k = clampScale(Math.min(width / boundsWidth, height / boundsHeight, 1.2));
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  return { k, x: width / 2 - centerX * k, y: height / 2 - centerY * k };
}

export default function GraphCanvas({ entries, centerEntryId, width = 640, height = 440 }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { workId } = useParams();
  const svgRef = useRef<SVGSVGElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const drag = useRef<{
    mode: 'pending' | 'pan' | 'pinch' | null;
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    startDist: number;
    startK: number;
  }>({
    mode: null,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    startDist: 0,
    startK: 1,
  });
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const [isPanning, setIsPanning] = useState(false);

  const { nodes, links, categories, bounds } = useMemo(() => {
    let visibleEntries = entries;
    if (centerEntryId) {
      const center = entries.find((e) => e.id === centerEntryId);
      if (center) {
        const neighborIds = new Set(center.relations.map((r) => r.targetId));
        entries.forEach((e) => {
          if (e.relations.some((r) => r.targetId === centerEntryId)) neighborIds.add(e.id);
        });
        neighborIds.add(centerEntryId);
        visibleEntries = entries.filter((e) => neighborIds.has(e.id));
      }
    }

    const idSet = new Set(visibleEntries.map((e) => e.id));
    const nodes: GraphNode[] = visibleEntries.map((e) => ({
      id: e.id,
      title: e.title,
      category: e.category || t('common.uncategorized'),
      mainImage: e.images.find((img) => img.isMain)?.dataUrl,
    }));

    const links: GraphLink[] = [];
    const seen = new Set<string>();
    visibleEntries.forEach((e) => {
      e.relations.forEach((r) => {
        if (!idSet.has(r.targetId)) return;
        const key = [e.id, r.targetId].sort().join('|') + '|' + r.label;
        if (seen.has(key)) return;
        seen.add(key);
        links.push({ source: e.id, target: r.targetId, label: r.label });
      });
    });

    // A fixed-size layout area gets crushed once there are more than a
    // handful of nodes — labels overlap and become unreadable. Scale the
    // simulation's working area (and the forces that fill it) with node
    // count so bigger graphs get real breathing room instead of just being
    // the same cramped layout at a different zoom level.
    const areaScale = Math.max(1, Math.sqrt(nodes.length / 10));
    const simWidth = width * areaScale;
    const simHeight = height * areaScale;

    const simulation = forceSimulation(nodes)
      .force(
        'link',
        forceLink<GraphNode, GraphLink>(links)
          .id((d) => d.id)
          .distance(140)
          .strength(0.5),
      )
      .force('charge', forceManyBody().strength(-260 * areaScale))
      .force('center', forceCenter(simWidth / 2, simHeight / 2))
      .force('collide', forceCollide(48))
      .stop();

    const tickCount = Math.min(700, 300 + nodes.length * 6);
    for (let i = 0; i < tickCount; i++) simulation.tick();

    const categories = Array.from(new Set(nodes.map((n) => n.category)));

    const xs = nodes.map((n) => n.x ?? 0);
    const ys = nodes.map((n) => n.y ?? 0);
    const bounds =
      nodes.length > 0
        ? { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) }
        : { minX: 0, maxX: 0, minY: 0, maxY: 0 };

    return { nodes, links, categories, bounds };
  }, [entries, centerEntryId, width, height, t]);

  useEffect(() => {
    if (nodes.length === 0) return;
    setView(computeFitView(bounds, width, height));
    // Re-fit whenever the node set changes; bounds is derived from nodes so
    // it's covered by including it directly rather than the whole nodes array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bounds, width, height]);

  const viewRef = useRef(view);
  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  function toSvgUnits() {
    const rect = svgRef.current?.getBoundingClientRect();
    return rect && rect.width > 0 ? width / rect.width : 1;
  }

  function zoomAt(cursorX: number, cursorY: number, nextK: number) {
    setView((v) => {
      const clamped = clampScale(nextK);
      const contentX = (cursorX - v.x) / v.k;
      const contentY = (cursorY - v.y) / v.k;
      return { k: clamped, x: cursorX - contentX * clamped, y: cursorY - contentY * clamped };
    });
  }

  const DRAG_THRESHOLD = 4;

  function handlePointerDown(e: React.PointerEvent<SVGSVGElement>) {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      // Don't capture or move anything yet — a plain tap on a node must still
      // reach that node's click handler. Only start panning once the pointer
      // actually moves past a small threshold (see handlePointerMove).
      drag.current.mode = 'pending';
      drag.current.startX = e.clientX;
      drag.current.startY = e.clientY;
      drag.current.lastX = e.clientX;
      drag.current.lastY = e.clientY;
    } else if (pointers.current.size === 2) {
      e.currentTarget.setPointerCapture(e.pointerId);
      const [a, b] = Array.from(pointers.current.values());
      drag.current.mode = 'pinch';
      drag.current.startDist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      drag.current.startK = view.k;
    }
  }

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (drag.current.mode === 'pending' && pointers.current.size === 1) {
      const moved = Math.hypot(e.clientX - drag.current.startX, e.clientY - drag.current.startY);
      if (moved < DRAG_THRESHOLD) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      drag.current.mode = 'pan';
      drag.current.lastX = e.clientX;
      drag.current.lastY = e.clientY;
      setIsPanning(true);
    }

    if (drag.current.mode === 'pan' && pointers.current.size === 1) {
      const scale = toSvgUnits();
      const dx = (e.clientX - drag.current.lastX) * scale;
      const dy = (e.clientY - drag.current.lastY) * scale;
      drag.current.lastX = e.clientX;
      drag.current.lastY = e.clientY;
      setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
    } else if (drag.current.mode === 'pinch' && pointers.current.size === 2) {
      const [a, b] = Array.from(pointers.current.values());
      const dist = Math.hypot(a.x - b.x, b.y - a.y) || 1;
      const rect = svgRef.current?.getBoundingClientRect();
      const scale = toSvgUnits();
      const midX = rect ? ((a.x + b.x) / 2 - rect.left) * scale : width / 2;
      const midY = rect ? ((a.y + b.y) / 2 - rect.top) * scale : height / 2;
      zoomAt(midX, midY, drag.current.startK * (dist / drag.current.startDist));
    }
  }

  function endPointer(e: React.PointerEvent<SVGSVGElement>) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 0) {
      drag.current.mode = null;
      setIsPanning(false);
    } else if (pointers.current.size === 1) {
      const [p] = Array.from(pointers.current.values());
      drag.current.mode = 'pan';
      drag.current.lastX = p.x;
      drag.current.lastY = p.y;
      setIsPanning(true);
    }
  }

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const scale = rect.width > 0 ? width / rect.width : 1;
      const cursorX = (e.clientX - rect.left) * scale;
      const cursorY = (e.clientY - rect.top) * scale;
      zoomAt(cursorX, cursorY, viewRef.current.k * Math.exp(-e.deltaY * 0.001));
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width]);

  function zoomButton(factor: number) {
    zoomAt(width / 2, height / 2, view.k * factor);
  }

  function resetView() {
    setView(computeFitView(bounds, width, height));
  }

  if (nodes.length === 0) {
    return <p className="empty-state">{t('graph.empty')}</p>;
  }

  return (
    <div>
      <div className="graph-wrap">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          height={height}
          style={{ touchAction: 'none', cursor: isPanning ? 'grabbing' : 'grab' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endPointer}
          onPointerCancel={endPointer}
          onPointerLeave={endPointer}
        >
          <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
            {links.map((link, i) => {
              const source = link.source as unknown as GraphNode;
              const target = link.target as unknown as GraphNode;
              const midX = ((source.x ?? 0) + (target.x ?? 0)) / 2;
              const midY = ((source.y ?? 0) + (target.y ?? 0)) / 2;
              return (
                <g key={i}>
                  <line x1={source.x} y1={source.y} x2={target.x} y2={target.y} stroke="#d8d0c2" strokeWidth={1.5} />
                  {link.label && (
                    <text x={midX} y={midY} fontSize={10} fill="#8a8175" textAnchor="middle">
                      {link.label}
                    </text>
                  )}
                </g>
              );
            })}
            {nodes.map((node) => (
              <g
                key={node.id}
                transform={`translate(${node.x ?? 0}, ${node.y ?? 0})`}
                onClick={() => navigate(`/works/${workId}/entries/${node.id}`)}
                style={{ cursor: 'pointer' }}
              >
                {node.mainImage ? (
                  <>
                    <clipPath id={`clip-${node.id}`}>
                      <circle r={18} />
                    </clipPath>
                    <image
                      href={node.mainImage}
                      x={-18}
                      y={-18}
                      width={36}
                      height={36}
                      clipPath={`url(#clip-${node.id})`}
                      preserveAspectRatio="xMidYMid slice"
                    />
                    <circle r={18} fill="none" stroke={categoryColor(node.category)} strokeWidth={2} />
                  </>
                ) : (
                  <circle r={18} fill={categoryColor(node.category)} />
                )}
                <text y={32} fontSize={11} textAnchor="middle" fill="#2b2620">
                  {node.title}
                </text>
              </g>
            ))}
          </g>
        </svg>
        <div className="graph-zoom-controls">
          <button type="button" className="btn btn-ghost" onClick={() => zoomButton(1.3)} aria-label={t('graph.zoomIn')}>
            ＋
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => zoomButton(1 / 1.3)} aria-label={t('graph.zoomOut')}>
            −
          </button>
          <button type="button" className="btn btn-ghost" onClick={resetView} aria-label={t('graph.resetView')}>
            {Math.round(view.k * 100)}%
          </button>
        </div>
      </div>
      <div className="graph-legend">
        {categories.map((c) => (
          <span key={c} className="chip">
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: categoryColor(c),
                display: 'inline-block',
              }}
            />
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}
