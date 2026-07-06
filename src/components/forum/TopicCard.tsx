import Link from "next/link";
import { MessageSquare, MapPin, Tag } from "lucide-react";
import type { ForumTopic } from "@/lib/types";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export default function TopicCard({ topic }: { topic: ForumTopic }) {
  return (
    <Link
      href={`/forum/t/${topic.slug}`}
      className="lf-card-surface group block p-5 transition hover:-translate-y-0.5"
    >
      <div className="mb-3 flex flex-wrap gap-2">
        <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-xs text-amber-300">
          Soru
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-0.5 text-xs text-violet-300">
          <Tag className="h-3 w-3" />
          {topic.category}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-0.5 text-xs text-cyan-300">
          <MapPin className="h-3 w-3" />
          {topic.city}
        </span>
      </div>

      <h2 className="lf-orbitron mb-2 text-lg font-bold text-white transition group-hover:text-cyan-300">
        {topic.title}
      </h2>

      <p className="mb-4 line-clamp-2 text-sm text-[#94a3b8]">{topic.body}</p>

      <div className="flex items-center justify-between text-xs text-[#64748b]">
        <span className="font-medium text-[#94a3b8]">
          {topic.display_author_name || "Forum üyesi"}
        </span>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            {topic.reply_count}
          </span>
          <span>{formatDate(topic.last_reply_at)}</span>
        </div>
      </div>
    </Link>
  );
}
