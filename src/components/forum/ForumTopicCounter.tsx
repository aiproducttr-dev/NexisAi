import { createClient } from "@/lib/supabase/server";
import { MessageSquare, MessagesSquare } from "lucide-react";

function formatCount(n: number): string {
  return new Intl.NumberFormat("tr-TR").format(n);
}

export default async function ForumTopicCounter() {
  const supabase = await createClient();

  const { count: topicCount } = await supabase
    .from("forum_topics")
    .select("*", { count: "exact", head: true })
    .eq("topic_type", "question");

  const { count: replyCount } = await supabase
    .from("forum_replies")
    .select("*", { count: "exact", head: true });

  const topics = topicCount ?? 0;
  const replies = replyCount ?? 0;

  return (
    <div className="lf-animate-in lf-animate-in-2 mt-6 flex flex-wrap gap-3">
      <div className="lf-card-surface flex min-w-[140px] flex-1 items-center gap-3 px-4 py-3 sm:max-w-[220px]">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-500/20 bg-cyan-500/10">
          <MessagesSquare className="h-5 w-5 text-cyan-400" />
        </div>
        <div>
          <p className="lf-orbitron text-2xl font-bold text-white">
            {formatCount(topics)}
          </p>
          <p className="text-xs text-[#94a3b8]">Açılan konu</p>
        </div>
      </div>

      <div className="lf-card-surface flex min-w-[140px] flex-1 items-center gap-3 px-4 py-3 sm:max-w-[220px]">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-violet-500/20 bg-violet-500/10">
          <MessageSquare className="h-5 w-5 text-violet-400" />
        </div>
        <div>
          <p className="lf-orbitron text-2xl font-bold text-white">
            {formatCount(replies)}
          </p>
          <p className="text-xs text-[#94a3b8]">Toplam cevap</p>
        </div>
      </div>
    </div>
  );
}
