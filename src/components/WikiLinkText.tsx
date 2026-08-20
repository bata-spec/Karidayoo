import { useNavigate, useParams } from 'react-router-dom';
import { linkifyBody } from '../utils/wikilink';

interface Props {
  body: string;
  candidates: { id: string; title: string }[];
}

export default function WikiLinkText({ body, candidates }: Props) {
  const navigate = useNavigate();
  const { workId } = useParams();
  const segments = linkifyBody(body, candidates);

  if (!body) {
    return <p className="helper-text">本文はまだありません。</p>;
  }

  return (
    <p className="body-text">
      {segments.map((segment, index) =>
        segment.linkTo ? (
          <button
            key={index}
            type="button"
            className="wiki-link"
            onClick={() => navigate(`/works/${workId}/entries/${segment.linkTo}`)}
          >
            {segment.text}
          </button>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </p>
  );
}
