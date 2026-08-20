export interface TextSegment {
  text: string;
  linkTo?: string;
}

interface LinkCandidate {
  id: string;
  title: string;
}

/**
 * Splits body text into segments, turning any substring that matches another
 * entry's title into a link segment. Longest titles are matched first so a
 * short title that's a substring of a longer one doesn't steal the match.
 */
export function linkifyBody(body: string, candidates: LinkCandidate[]): TextSegment[] {
  const sorted = candidates
    .filter((c) => c.title.trim().length > 0)
    .sort((a, b) => b.title.length - a.title.length);

  const segments: TextSegment[] = [];
  let i = 0;

  outer: while (i < body.length) {
    for (const candidate of sorted) {
      if (body.startsWith(candidate.title, i)) {
        segments.push({ text: candidate.title, linkTo: candidate.id });
        i += candidate.title.length;
        continue outer;
      }
    }
    const last = segments[segments.length - 1];
    if (last && !last.linkTo) {
      last.text += body[i];
    } else {
      segments.push({ text: body[i] });
    }
    i++;
  }

  return segments;
}
