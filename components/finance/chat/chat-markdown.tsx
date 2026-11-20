import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { chatMarkdownElements } from "@/components/finance/chat/chat-markdown-elements";
import type { ChatMarkdownProps } from "@/lib/interfaces/components/chat";

/**
 * Models answer in Markdown (GFM: lists, bold, tables). react-markdown builds React elements instead of HTML strings,
 * so raw HTML in a reply is never rendered and unsafe link protocols are dropped. Images are not shown: a reply has no
 * reason to load remote content.
 */
export function ChatMarkdown({ text }: ChatMarkdownProps) {
  return (
    <div className="min-w-0 space-y-2 break-words">
      <Markdown remarkPlugins={[remarkGfm]} components={chatMarkdownElements} disallowedElements={["img"]}>
        {text}
      </Markdown>
    </div>
  );
}
