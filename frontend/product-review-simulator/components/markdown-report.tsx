"use client"

import React from "react"

interface MarkdownReportProps {
  text: string
  className?: string
}

function renderInline(raw: string): React.ReactNode[] {
  const parts = raw.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return (
        <strong key={i} className="font-semibold text-gray-800 dark:text-gray-100">
          {part.slice(2, -2)}
        </strong>
      )
    if (part.startsWith("*") && part.endsWith("*"))
      return (
        <em key={i} className="italic text-gray-700 dark:text-gray-200">
          {part.slice(1, -1)}
        </em>
      )
    return part
  })
}

export function MarkdownReport({ text, className = "" }: MarkdownReportProps) {
  if (!text) return null

  const lines = text.split("\n")
  const elements: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i].trim()

    // H1
    if (line.startsWith("# ") && !line.startsWith("## ")) {
      elements.push(
        <div key={i} className="flex items-center gap-2 mt-6 mb-3 first:mt-0">
          <div className="h-px flex-1 bg-gradient-to-r from-purple-400/40 to-transparent" />
          <h1 className="text-xs font-bold uppercase tracking-widest text-purple-700 dark:text-purple-300 whitespace-nowrap">
            {line.replace(/^#\s+/, "")}
          </h1>
          <div className="h-px flex-1 bg-gradient-to-l from-purple-400/40 to-transparent" />
        </div>
      )

    // H2
    } else if (line.startsWith("## ") && !line.startsWith("### ")) {
      elements.push(
        <div key={i} className="flex items-center gap-2 mt-5 mb-2 first:mt-0">
          <div className="h-px flex-1 bg-gradient-to-r from-indigo-400/30 to-transparent" />
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 whitespace-nowrap px-1">
            {line.replace(/^##\s+/, "")}
          </h2>
          <div className="h-px flex-1 bg-gradient-to-l from-indigo-400/30 to-transparent" />
        </div>
      )

    // H3
    } else if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="text-xs font-bold text-gray-700 dark:text-gray-200 mt-3 mb-1.5 flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex-shrink-0" />
          {line.replace(/^###\s+/, "")}
        </h3>
      )

    // H4
    } else if (line.startsWith("#### ")) {
      elements.push(
        <h4 key={i} className="text-xs font-semibold text-gray-600 dark:text-gray-300 mt-2 mb-1 flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-400/60 flex-shrink-0" />
          {line.replace(/^####\s+/, "")}
        </h4>
      )

    // Bullet list — collect consecutive items
    } else if (/^[-*+]\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[-*+]\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*+]\s+/, ""))
        i++
      }
      elements.push(
        <ul key={`ul-${i}`} className="space-y-1.5 my-1.5 pl-1">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              <span className="text-purple-400 dark:text-purple-500 mt-0.5 flex-shrink-0 text-sm leading-none">›</span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      )
      continue

    // Numbered list — collect consecutive items
    } else if (/^\d+\.\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ""))
        i++
      }
      elements.push(
        <ol key={`ol-${i}`} className="space-y-1.5 my-1.5 pl-1">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              <span className="text-purple-500 dark:text-purple-400 font-bold flex-shrink-0 w-4 text-right">{idx + 1}.</span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      )
      continue

    // Horizontal rule
    } else if (/^---+$/.test(line)) {
      elements.push(<hr key={i} className="border-purple-100 dark:border-gray-800 my-3" />)

    // Blockquote
    } else if (line.startsWith("> ")) {
      elements.push(
        <blockquote key={i} className="border-l-2 border-purple-400/50 pl-3 my-1.5 text-xs italic text-gray-500 dark:text-gray-400">
          {renderInline(line.replace(/^>\s+/, ""))}
        </blockquote>
      )

    // Empty line — skip (margins handle spacing)
    } else if (line === "") {
      // intentionally empty

    // Regular paragraph
    } else {
      elements.push(
        <p key={i} className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
          {renderInline(line)}
        </p>
      )
    }

    i++
  }

  return <div className={`space-y-0.5 ${className}`}>{elements}</div>
}
