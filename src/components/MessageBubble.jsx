import { useState, useEffect, useRef } from 'react';
import './MessageBubble.css';
import MoodWidget from './MoodWidget';
import TypingIndicator from './TypingIndicator';
import { Sparkles, User, Copy, Check } from 'lucide-react';

// ─── Typewriter speed ─────────────────────────────────────────────────────────
const TYPEWRITER_SPEED = 10;

// ─── Minimal Markdown Parser ──────────────────────────────────────────────────
// Parses markdown text into React elements with support for:
// code blocks, tables, headings, bold, italic, inline code, bullet lists, numbered lists

function CodeBlock({ lang, code }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="md-code-block">
      <div className="md-code-header">
        <span className="md-code-lang">{lang || 'code'}</span>
        <button className="md-copy-btn" onClick={handleCopy} title="Copy code">
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="md-code-pre"><code>{code}</code></pre>
    </div>
  );
}

function MarkdownTable({ tableText }) {
  const rows = tableText.trim().split('\n').map(r => r.trim());
  if (rows.length < 2) return <p>{tableText}</p>;

  const parseRow = (row) =>
    row.replace(/^\||\|$/g, '').split('|').map(cell => cell.trim());

  const headerCells = parseRow(rows[0]);
  // rows[1] is the separator (--|--|--)
  const bodyRows = rows.slice(2).map(parseRow);

  return (
    <div className="md-table-wrapper">
      <table className="md-table">
        <thead>
          <tr>{headerCells.map((h, i) => <th key={i}>{renderInline(h)}</th>)}</tr>
        </thead>
        <tbody>
          {bodyRows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => <td key={j}>{renderInline(cell)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Inline markdown: **bold**, *italic*, `code`
function renderInline(text) {
  const parts = [];
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const m = match[0];
    if (m.startsWith('`')) {
      parts.push(<code key={key++} className="md-inline-code">{m.slice(1, -1)}</code>);
    } else if (m.startsWith('**')) {
      parts.push(<strong key={key++}>{m.slice(2, -2)}</strong>);
    } else if (m.startsWith('*')) {
      parts.push(<em key={key++}>{m.slice(1, -1)}</em>);
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length > 0 ? parts : text;
}

// Check if a block of lines looks like a markdown table
function isTableBlock(lines) {
  if (lines.length < 2) return false;
  const sepLine = lines[1];
  return /^\|?[\s\-:|]+(\|[\s\-:|]+)+\|?$/.test(sepLine);
}

// Parse full markdown into React elements
function parseMarkdown(text) {
  const elements = [];
  let key = 0;

  // Split into blocks (double newline = new paragraph)
  const rawBlocks = text.split(/\n{2,}/);

  for (const block of rawBlocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    // ── Fenced code block ─────────────────────────────────────
    if (trimmed.startsWith('```')) {
      const lines = trimmed.split('\n');
      const firstLine = lines[0];
      const lang = firstLine.slice(3).trim();
      const codeLines = lines.slice(1);
      // remove closing ```
      if (codeLines[codeLines.length - 1]?.trim() === '```') codeLines.pop();
      elements.push(<CodeBlock key={key++} lang={lang} code={codeLines.join('\n')} />);
      continue;
    }

    // ── Table (lines with pipe characters) ────────────────────
    const lines = trimmed.split('\n');
    if (lines.length >= 2 && lines[0].includes('|') && isTableBlock(lines)) {
      elements.push(<MarkdownTable key={key++} tableText={trimmed} />);
      continue;
    }

    // ── Heading ───────────────────────────────────────────────
    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const content = renderInline(headingMatch[2]);
      const Tag = `h${level + 2}`; // h3, h4, h5
      elements.push(<Tag key={key++} className={`md-heading md-h${level}`}>{content}</Tag>);
      continue;
    }

    // ── Bullet list ───────────────────────────────────────────
    const isBullet = lines.every(l => /^[-*•]\s/.test(l.trim()) || l.trim() === '');
    if (isBullet) {
      elements.push(
        <ul key={key++} className="md-ul">
          {lines.filter(l => l.trim()).map((l, i) => (
            <li key={i}>{renderInline(l.replace(/^[-*•]\s/, ''))}</li>
          ))}
        </ul>
      );
      continue;
    }

    // ── Numbered list ─────────────────────────────────────────
    const isNumbered = lines.every(l => /^\d+\.\s/.test(l.trim()) || l.trim() === '');
    if (isNumbered) {
      elements.push(
        <ol key={key++} className="md-ol">
          {lines.filter(l => l.trim()).map((l, i) => (
            <li key={i}>{renderInline(l.replace(/^\d+\.\s/, ''))}</li>
          ))}
        </ol>
      );
      continue;
    }

    // ── Paragraph (may contain inline code blocks inside) ─────
    // Handle mixed content with inline ``` blocks
    if (trimmed.includes('```')) {
      const parts = trimmed.split(/(```[\s\S]*?```)/g);
      const subEls = parts.map((part, i) => {
        if (part.startsWith('```')) {
          const inner = part.slice(3);
          const endIdx = inner.indexOf('```');
          const code = endIdx >= 0 ? inner.slice(0, endIdx).trim() : inner;
          return <CodeBlock key={i} lang="" code={code} />;
        }
        return part ? <p key={i} className="md-p">{renderInline(part)}</p> : null;
      });
      elements.push(<div key={key++}>{subEls}</div>);
      continue;
    }

    // ── Handle line-by-line mixed bullet + text in same block ─
    const hasMixedLines = lines.some(l => /^[-*•]\s/.test(l.trim()))
      && lines.some(l => !/^[-*•]\s/.test(l.trim()) && l.trim());

    if (hasMixedLines) {
      const subItems = [];
      let subKey = 0;
      for (const line of lines) {
        const t = line.trim();
        if (!t) continue;
        if (/^[-*•]\s/.test(t)) {
          subItems.push(<li key={subKey++}>{renderInline(t.replace(/^[-*•]\s/, ''))}</li>);
        } else {
          subItems.push(<p key={subKey++} className="md-p">{renderInline(t)}</p>);
        }
      }
      elements.push(<div key={key++} className="md-mixed">{subItems}</div>);
      continue;
    }

    // ── Default paragraph ─────────────────────────────────────
    elements.push(
      <p key={key++} className="md-p">
        {renderInline(trimmed.replace(/\n/g, '\n'))}
      </p>
    );
  }

  return elements;
}

// ─── Typewriter wrapper that renders parsed markdown progressively ────────────
function TypewriterMarkdown({ text }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    indexRef.current = 0;
    setDisplayed('');
    setDone(false);

    const interval = setInterval(() => {
      indexRef.current += 2; // advance 2 chars at a time for speed
      const slice = text.slice(0, indexRef.current);
      setDisplayed(slice);
      if (indexRef.current >= text.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, TYPEWRITER_SPEED);

    return () => clearInterval(interval);
  }, [text]);

  return (
    <div className="md-body typewriter-active">
      {parseMarkdown(displayed)}
      {!done && <span className="typewriter-cursor">▋</span>}
    </div>
  );
}

// ─── Static markdown renderer ─────────────────────────────────────────────────
function MarkdownBody({ text }) {
  return <div className="md-body">{parseMarkdown(text)}</div>;
}

// ─── Main MessageBubble ───────────────────────────────────────────────────────
export default function MessageBubble({ message, animate }) {
  const isBot = message.sender === 'bot';

  const renderContent = () => {
    if (message.isTyping) return <TypingIndicator />;
    if (message.type === 'mood') return <MoodWidget onSelect={(mood) => console.log(mood)} />;
    if (isBot && animate) return <TypewriterMarkdown text={message.text} />;
    if (isBot) return <MarkdownBody text={message.text} />;
    return <p className="user-text">{message.text}</p>;
  };

  return (
    <div className={`message-wrapper ${isBot ? 'bot-wrapper' : 'user-wrapper'}`}>
      {isBot && (
        <div className="avatar bot-avatar-small">
          <Sparkles size={16} />
        </div>
      )}

      <div className={`message-content ${isBot ? 'bot' : 'user'}`}>
        {renderContent()}

        {message.suggestedReplies && (
          <div className="suggested-replies">
            {message.suggestedReplies.map((reply, i) => (
              <button key={i} className="reply-chip">{reply}</button>
            ))}
          </div>
        )}

        {!message.isTyping && (
          <span className="timestamp">{message.timestamp}</span>
        )}
      </div>

      {!isBot && (
        <div className="avatar user-avatar-small">
          <User size={16} />
        </div>
      )}
    </div>
  );
}
