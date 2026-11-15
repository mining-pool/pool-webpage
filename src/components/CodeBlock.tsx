import { Typography } from "antd";

type Token = { text: string; kind?: string };

// Minimal JSON highlighter: values are real API data, not decoration.
function tokenize(line: string): Token[] {
  const tokens: Token[] = [];
  const pattern =
    /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)/gi;
  let last = 0;
  for (const match of line.matchAll(pattern)) {
    const at = match.index ?? 0;
    if (at > last) tokens.push({ text: line.slice(last, at) });
    if (match[1])
      tokens.push(
        { text: match[1], kind: match[2] ? "key" : "string" },
        ...(match[2] ? [{ text: match[2] }] : []),
      );
    else if (match[3]) tokens.push({ text: match[3], kind: "keyword" });
    else tokens.push({ text: match[4], kind: "number" });
    last = at + match[0].length;
  }
  if (last < line.length) tokens.push({ text: line.slice(last) });
  return tokens;
}

export function CodeBlock({
  value,
  filename,
  comment,
}: {
  value: unknown;
  filename: string;
  comment?: string;
}) {
  const source = JSON.stringify(value, null, 2);
  const lines = [...(comment ? [`// ${comment}`] : []), ...source.split("\n")];
  return (
    <figure className="code-block">
      <figcaption>
        <span>{filename}</span>
        <Typography.Text copyable={{ text: source }} className="code-copy" />
      </figcaption>
      <pre aria-label={filename}>
        {lines.map((line, i) => (
          <div key={i} className="code-line">
            <span className="line-number" aria-hidden="true">
              {i + 1}
            </span>
            <code>
              {line.startsWith("//") ? (
                <span className="tok-comment">{line}</span>
              ) : (
                tokenize(line).map((token, j) => (
                  <span
                    key={j}
                    className={token.kind ? `tok-${token.kind}` : undefined}
                  >
                    {token.text}
                  </span>
                ))
              )}
            </code>
          </div>
        ))}
      </pre>
    </figure>
  );
}
