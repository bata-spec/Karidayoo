import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { listEntries } from '../db';
import type { Entry } from '../types';
import GraphCanvas from '../components/GraphCanvas';

export default function GraphPage() {
  const { workId, entryId } = useParams();
  const [entries, setEntries] = useState<Entry[] | null>(null);

  useEffect(() => {
    if (!workId) return;
    listEntries(workId).then(setEntries);
  }, [workId]);

  if (entries === null) return <p className="helper-text">読み込み中...</p>;

  return (
    <div>
      {entryId && (
        <div className="row" style={{ marginBottom: 10 }}>
          <a className="btn btn-ghost" href={`#/works/${workId}/graph`}>
            ← 全体グラフに戻る
          </a>
        </div>
      )}
      <GraphCanvas entries={entries} centerEntryId={entryId} />
    </div>
  );
}
