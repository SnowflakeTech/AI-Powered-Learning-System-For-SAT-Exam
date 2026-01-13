import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

function hasLatexDelimiters(s) {
  const t = String(s || "");
  return t.includes("$") || t.includes("\\(") || t.includes("\\[");
}

function autoWrapMath(text) {
  let s = String(text || "");

  if (hasLatexDelimiters(s)) return s;

  // Wrap common math patterns into $...$
  // - fractions like 3/4, -3/4
  // - powers like x^2, 10^3
  // - functions like f(x), g(x)
  // - equations with =, +, -, *, parentheses
  // This is heuristic but works well for SAT/HSA practice content.
  s = s.replace(
    /(^|[\s:;,.(])(-?\d+\s*\/\s*\d+)(?=[$\s:;,.)!?]|$)/g,
    (m, p1, expr) => `${p1}$${expr.replace(/\s+/g, "")}$`
  );

  s = s.replace(
    /(^|[\s:;,.(])([a-zA-Z]\w*\s*\(\s*[a-zA-Z0-9,+\-*/\s]*\s*\))(?!\w)/g,
    (m, p1, expr) => `${p1}$${expr.replace(/\s+/g, "")}$`
  );

  s = s.replace(
    /(^|[\s:;,.(])([a-zA-Z0-9]+)\s*\^\s*([a-zA-Z0-9]+)(?=[$\s:;,.)!?]|$)/g,
    (m, p1, a, b) => `${p1}$${a}^${b}$`
  );

  s = s.replace(
    /([a-zA-Z0-9)\]]\s*)([=+\-*/])(\s*[a-zA-Z0-9(\[])/g,
    (m) => `$${m.replace(/\s+/g, "")}$`
  );

  return s;
}

export default function MathContent({ content }) {
  const text = useMemo(() => autoWrapMath(content), [content]);

  if (!text) return null;

  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
      }}
    >
      {text}
    </ReactMarkdown>
  );
}
