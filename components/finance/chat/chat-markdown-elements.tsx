import type { Components, ExtraProps } from "react-markdown";

/** react-markdown hands each element its syntax-tree `node`; it must not reach the DOM. */
function withoutNode<P extends ExtraProps>(props: P): Omit<P, "node"> {
  const rest = { ...props };
  delete rest.node;
  return rest;
}

/**
 * Element styles for the assistant's Markdown, sized for the narrow chat bubble.
 * Headings stay small and start at h3 (the panel title is the h2): in a reply they work as section labels.
 */
export const chatMarkdownElements: Components = {
  p: (props) => <p {...withoutNode(props)} className="leading-relaxed" />,
  h1: (props) => <h3 {...withoutNode(props)} className="text-[0.95rem] font-semibold text-content-strong" />,
  h2: (props) => <h3 {...withoutNode(props)} className="text-[0.95rem] font-semibold text-content-strong" />,
  h3: (props) => <h4 {...withoutNode(props)} className="font-semibold text-content-strong" />,
  h4: (props) => <h4 {...withoutNode(props)} className="font-semibold text-content-strong" />,
  strong: (props) => <strong {...withoutNode(props)} className="font-semibold text-content-strong" />,
  em: (props) => <em {...withoutNode(props)} className="italic" />,
  del: (props) => <del {...withoutNode(props)} className="text-content-muted" />,
  ul: (props) => <ul {...withoutNode(props)} className="list-disc space-y-1 pl-5 marker:text-content-muted" />,
  ol: (props) => <ol {...withoutNode(props)} className="list-decimal space-y-1 pl-5 marker:text-content-muted" />,
  li: (props) => <li {...withoutNode(props)} className="pl-0.5 leading-relaxed [&>ol]:mt-1 [&>ul]:mt-1" />,
  a: (props) => <a {...withoutNode(props)} className="font-medium text-brand underline underline-offset-2" target="_blank" rel="noopener noreferrer" />,
  blockquote: (props) => <blockquote {...withoutNode(props)} className="border-l-2 border-border pl-3 text-content" />,
  hr: (props) => <hr {...withoutNode(props)} className="border-border" />,
  code: (props) => <code {...withoutNode(props)} className="rounded bg-card px-1 py-0.5 font-mono text-[0.8em]" />,
  pre: (props) => <pre {...withoutNode(props)} className="overflow-x-auto rounded-lg bg-card p-2.5 text-xs [&>code]:bg-transparent [&>code]:p-0" />,
  table: (props) => (
    <div className="max-w-full overflow-x-auto rounded-lg border border-border bg-card">
      <table {...withoutNode(props)} className="w-full border-collapse text-xs" />
    </div>
  ),
  th: (props) => <th {...withoutNode(props)} className="border-b border-border px-2.5 py-1.5 text-left font-semibold text-content-strong" />,
  td: (props) => <td {...withoutNode(props)} className="border-b border-border px-2.5 py-1.5 align-top [tr:last-child>&]:border-b-0" />,
};
