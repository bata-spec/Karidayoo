import { useMemo } from 'react';
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

function categoryColor(category: string): string {
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 55%)`;
}

export default function GraphCanvas({ entries, centerEntryId, width = 640, height = 440 }: Props) {
  const navigate = useNavigate();
  const { workId } = useParams();

  const { nodes, links, categories } = useMemo(() => {
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
      category: e.category || '未分類',
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

    const simulation = forceSimulation(nodes)
      .force(
        'link',
        forceLink<GraphNode, GraphLink>(links)
          .id((d) => d.id)
          .distance(110)
          .strength(0.6),
      )
      .force('charge', forceManyBody().strength(-220))
      .force('center', forceCenter(width / 2, height / 2))
      .force('collide', forceCollide(34))
      .stop();

    for (let i = 0; i < 300; i++) simulation.tick();

    const categories = Array.from(new Set(nodes.map((n) => n.category)));

    return { nodes, links, categories };
  }, [entries, centerEntryId, width, height]);

  if (nodes.length === 0) {
    return <p className="empty-state">表示できる関連がまだありません。エントリの編集画面から関連を追加してください。</p>;
  }

  return (
    <div>
      <div className="graph-wrap">
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height}>
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
        </svg>
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
