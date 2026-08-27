export interface CategoryNode {
  segment: string;
  path: string[];
  directCount: number;
  totalCount: number;
  children: CategoryNode[];
}

export function buildCategoryTree(counts: [string, number][]): CategoryNode[] {
  const root: CategoryNode[] = [];

  for (const [raw, count] of counts) {
    const segments = raw
      .split('/')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    const path = segments.length > 0 ? segments : [raw];

    let level = root;
    let acc: string[] = [];
    path.forEach((segment, i) => {
      acc = [...acc, segment];
      let node = level.find((n) => n.segment === segment);
      if (!node) {
        node = { segment, path: acc, directCount: 0, totalCount: 0, children: [] };
        level.push(node);
      }
      node.totalCount += count;
      if (i === path.length - 1) node.directCount += count;
      level = node.children;
    });
  }

  function sortTree(nodes: CategoryNode[]) {
    nodes.sort((a, b) => b.totalCount - a.totalCount || a.segment.localeCompare(b.segment));
    nodes.forEach((n) => sortTree(n.children));
  }
  sortTree(root);

  return root;
}

export function findCategoryNode(tree: CategoryNode[], path: string[]): CategoryNode | undefined {
  let nodes = tree;
  let node: CategoryNode | undefined;
  for (const segment of path) {
    node = nodes.find((n) => n.segment === segment);
    if (!node) return undefined;
    nodes = node.children;
  }
  return node;
}
