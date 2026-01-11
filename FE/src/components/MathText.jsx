import React from "react";
import { InlineMath, BlockMath } from "react-katex";

function splitByMath(text) {
  const s = String(text || "");
  const regex = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;
  return s.split(regex).filter(Boolean);
}

export default function MathText({ text }) {
  const parts = splitByMath(text);

  return (
    <>
      {parts.map((p, idx) => {
        if (p.startsWith("$$") && p.endsWith("$$")) {
          const latex = p.slice(2, -2).trim();
          return <BlockMath key={idx}>{latex}</BlockMath>;
        }
        if (p.startsWith("$") && p.endsWith("$")) {
          const latex = p.slice(1, -1).trim();
          return <InlineMath key={idx}>{latex}</InlineMath>;
        }
        return (
          <span key={idx} className="whitespace-pre-wrap">
            {p}
          </span>
        );
      })}
    </>
  );
}
