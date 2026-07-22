import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, ListTodo } from "lucide-react";
import { useTaskStore } from "@/store/tasks";
import TaskCard from "@/components/TaskCard";

export default function Tasks() {
  const allTasks = useTaskStore((s) => s.tasks);
  const tasks = allTasks.filter((t) => !t.archived);
  const seedMembers = useTaskStore((s) => s.members);
  const [params] = useSearchParams();
  const initialMember = params.get("member") || "全部";
  const [member, setMember] = useState(initialMember);
  const [q, setQ] = useState("");

  const groups = useMemo(() => {
    const names = Array.from(
      new Set([...seedMembers, ...tasks.map((t) => t.assignee)])
    );
    return names.sort((a, b) =>
      a === "共同任务" ? 1 : b === "共同任务" ? -1 : 0
    );
  }, [tasks, seedMembers]);

  const chips = ["全部", ...groups];

  const match = (title: string, assignee: string) =>
    q.trim() === "" ||
    title.toLowerCase().includes(q.toLowerCase()) ||
    assignee.includes(q);

  const visibleMembers = member === "全部" ? groups : [member];

  const totalShown = tasks.filter(
    (t) => (member === "全部" || t.assignee === member) && match(t.title, t.assignee)
  ).length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#c96442] text-white">
            <ListTodo size={16} />
          </div>
          <h1 className="font-serif text-3xl font-bold text-[#1a1a1a]">任务看板</h1>
        </div>
        <p className="text-[#6b6560] ml-11">按成员查看任务及每期组会进展</p>
      </div>

      <div className="relative mb-4">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9a9590]" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索任务标题或负责人..."
          className="w-full rounded-xl border border-[#e8e4db] bg-white py-2.5 pl-10 pr-4 text-sm text-[#1a1a1a] placeholder-[#9a9590] outline-none transition-all focus:border-[#c96442]/40 focus:ring-2 focus:ring-[#c96442]/10 shadow-sm"
        />
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {chips.map((c) => (
          <button
            key={c}
            onClick={() => setMember(c)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              member === c
                ? "bg-[#c96442] text-white shadow-sm"
                : "bg-white border border-[#e8e4db] text-[#6b6560] hover:border-[#c96442]/30 hover:text-[#1a1a1a]"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {totalShown === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#6b6560]">
          <Search size={40} className="mb-4 opacity-20" />
          <p className="text-base">没有匹配的任务</p>
        </div>
      ) : (
        <div className="space-y-10">
          {visibleMembers.map((name) => {
            const list = tasks.filter(
              (t) => t.assignee === name && match(t.title, t.assignee)
            );
            if (list.length === 0) return null;
            return (
              <div key={name}>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="font-serif text-xl font-bold text-[#1a1a1a]">{name}</h2>
                  <span className="rounded-full bg-[#f0ece4] px-2 py-0.5 text-xs text-[#6b6560]">
                    {list.length} 项
                  </span>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {list.map((t) => (
                    <TaskCard key={t.id} task={t} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
