import { useEffect, useState } from "react";
import {
  X, Plus, Pencil, AlertCircle, Calendar, FileText, Link2, Users,
  GraduationCap, BookOpen, Lightbulb, Trophy, UserCheck, Sparkles,
} from "lucide-react";
import {
  useAchievementStore, type Achievement, type AchievementCategory,
  JCR_OPTIONS, CAS_OPTIONS, PATENT_STATUS, AWARD_LEVELS, AUTHOR_ROLE_OPTIONS,
  type JcrZone, type CasZone, type PatentStatus, type AuthorRole,
} from "@/store/achievements";
import { confirmDialog } from "@/store/ui";
import { useTaskStore } from "@/store/tasks";
import { venueList, PROGRAM_RULES, type AchievementLevel, levelLabel } from "@/data/degreeAwards";
import VenuePicker from "@/components/VenuePicker";
import { useConfirmClose } from "@/hooks/useConfirmClose";

interface AchievementEditorProps {
  open: boolean;
  initial?: Achievement | null;
  onClose: () => void;
}

const CATEGORIES: { key: AchievementCategory; label: string; icon: typeof Trophy }[] = [
  { key: "论文", label: "论文", icon: BookOpen },
  { key: "专利", label: "专利", icon: Lightbulb },
  { key: "比赛", label: "比赛获奖", icon: Trophy },
];

const MANUAL_LEVEL_OPTIONS: AchievementLevel[] = ["A-1", "A-2", "A-3", "A-4", "B-1", "B-2", "B-3", "基本目录"];

export default function AchievementEditor({ open, initial, onClose }: AchievementEditorProps) {
  const addAchievement = useAchievementStore((s) => s.addAchievement);
  const updateAchievement = useAchievementStore((s) => s.updateAchievement);
  const removeAchievement = useAchievementStore((s) => s.removeAchievement);
  const members = useTaskStore((s) => s.members);

  const isEdit = Boolean(initial);

  const [category, setCategory] = useState<AchievementCategory>("论文");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [authorsText, setAuthorsText] = useState("");
  const [note, setNote] = useState("");
  const [link, setLink] = useState("");

  // 归属与毕业匹配
  const [owner, setOwner] = useState("");
  const [graduate, setGraduate] = useState(true);

  // 论文字段
  const [paperTitle, setPaperTitle] = useState("");
  const [paperVenue, setPaperVenue] = useState("");
  const [paperVenueKind, setPaperVenueKind] = useState<"期刊" | "会议">("期刊");
  const [paperVenueKey, setPaperVenueKey] = useState("");
  const [paperJcr, setPaperJcr] = useState<JcrZone | "">("");
  const [paperCas, setPaperCas] = useState<CasZone | "">("");
  const [paperCorrText, setPaperCorrText] = useState("");
  const [authorRole, setAuthorRole] = useState<AuthorRole | "">("一作");
  const [coAuthor, setCoAuthor] = useState(false);
  const [bestPaper, setBestPaper] = useState(false);
  const [largeConference, setLargeConference] = useState(false);
  const [paperLevel, setPaperLevel] = useState<AchievementLevel | "">("");

  // 专利字段
  const [patentName, setPatentName] = useState("");
  const [patentNo, setPatentNo] = useState("");
  const [patentStatus, setPatentStatus] = useState<PatentStatus | "">("");

  // 比赛字段
  const [compName, setCompName] = useState("");
  const [compAward, setCompAward] = useState("");
  const [compAdvisorsText, setCompAdvisorsText] = useState("");

  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setCategory(initial.category);
      setYear(initial.year);
      setAuthorsText(initial.authors.join("、"));
      setNote(initial.note ?? "");
      setLink(initial.link ?? "");
      setOwner(initial.owner ?? "");
      setGraduate(initial.graduate !== false);
      if (initial.category === "论文") {
        setPaperTitle(initial.title);
        setPaperVenue(initial.venue);
        setPaperVenueKey(initial.venueKey ?? "");
        setPaperVenueKind(initial.venueKind ?? "期刊");
        setPaperJcr(initial.jcr ?? "");
        setPaperCas(initial.cas ?? "");
        setPaperCorrText(initial.correspondingAuthors?.join("、") ?? "");
        setAuthorRole(initial.authorRole ?? "一作");
        setCoAuthor(Boolean(initial.coAuthor));
        setBestPaper(Boolean(initial.bestPaper));
        setLargeConference(Boolean(initial.largeConference));
        setPaperLevel((initial.level ?? "") as AchievementLevel | "");
      } else if (initial.category === "专利") {
        setPatentName(initial.name);
        setPatentNo(initial.patentNo ?? "");
        setPatentStatus(initial.status ?? "");
      } else {
        setCompName(initial.competition);
        setCompAward(initial.award);
        setCompAdvisorsText(initial.advisors?.join("、") ?? "");
      }
    } else {
      setCategory("论文");
      setYear(new Date().getFullYear().toString());
      setAuthorsText("");
      setNote("");
      setLink("");
      setOwner("");
      setGraduate(true);
      setPaperTitle("");
      setPaperVenue("");
      setPaperVenueKey("");
      setPaperVenueKind("期刊");
      setPaperJcr("");
      setPaperCas("");
      setPaperCorrText("");
      setAuthorRole("一作");
      setCoAuthor(false);
      setBestPaper(false);
      setLargeConference(false);
      setPaperLevel("");
      setPatentName("");
      setPatentNo("");
      setPatentStatus("");
      setCompName("");
      setCompAward("");
      setCompAdvisorsText("");
    }
    setError("");
  }, [open, initial]);

  // 有没有填过东西：有内容时点遮罩/按 ESC 不会直接关掉
  const dirty =
    Boolean(
      owner ||
        authorsText.trim() ||
        paperTitle.trim() ||
        paperVenue.trim() ||
        patentName.trim() ||
        compName.trim() ||
        note.trim() ||
        link.trim()
    ) || category !== "论文";

  const { requestClose, onBackdropMouseDown } = useConfirmClose({
    open,
    dirty,
    onClose,
    message: "新增/编辑的内容还没保存，关闭后需要重新填写。",
  });

  // 选中目录条目后自动带出全称
  useEffect(() => {
    if (!paperVenueKey) return;
    const v = venueList.find((x) => x.key === paperVenueKey);
    if (v) {
      setPaperVenue(v.name);
      setPaperVenueKind(v.kind);
    }
  }, [paperVenueKey]);

  if (!open) return null;

  // 当前归属学生的学科，用于提示这套目录会按哪套规则判定
  const ownerStudent = members.find((m) => m.name === owner && m.role !== "teacher");
  const programHint = ownerStudent?.program ? PROGRAM_RULES[ownerStudent.program] : undefined;

  const submit = () => {
    if (!year) {
      setError("请填写年份");
      return;
    }
    const authors = authorsText.split(/[、,，\s]+/).map((s) => s.trim()).filter(Boolean);
    if (authors.length === 0) {
      setError("请至少填写一位作者/发明人/获奖成员");
      return;
    }
    if (!owner.trim()) {
      setError("请选择成果归属人（学生的成果要归属到人才能统计毕业要求）");
      return;
    }

    const base = {
      year,
      authors,
      owner: owner.trim(),
      graduate,
      note: note.trim() || undefined,
      link: link.trim() || undefined,
    };

    let data: Omit<Achievement, "id">;
    if (category === "论文") {
      if (!paperTitle.trim()) return setError("请填写论文标题");
      if (!paperVenue.trim()) return setError("请填写会议/期刊名");
      data = {
        ...base,
        category: "论文",
        title: paperTitle.trim(),
        venue: paperVenue.trim(),
        venueKey: paperVenueKey || undefined,
        venueKind: paperVenueKind,
        venueName: paperVenue.trim(),
        jcr: (paperJcr || undefined) as JcrZone | undefined,
        cas: (paperCas || undefined) as CasZone | undefined,
        correspondingAuthors: paperCorrText.split(/[、,，\s]+/).map((s) => s.trim()).filter(Boolean),
        authorRole: (authorRole || undefined) as AuthorRole | undefined,
        coAuthor,
        bestPaper,
        largeConference,
        level: paperLevel || undefined,
      } as Omit<Achievement, "id">;
    } else if (category === "专利") {
      if (!patentName.trim()) return setError("请填写专利名称");
      data = {
        ...base,
        category: "专利",
        name: patentName.trim(),
        patentNo: patentNo.trim() || undefined,
        status: (patentStatus || undefined) as PatentStatus | undefined,
      } as Omit<Achievement, "id">;
    } else {
      if (!compName.trim()) return setError("请填写比赛名");
      if (!compAward.trim()) return setError("请填写奖项（如：一等奖）");
      data = {
        ...base,
        category: "比赛",
        competition: compName.trim(),
        award: compAward.trim(),
        advisors: compAdvisorsText.split(/[、,，\s]+/).map((s) => s.trim()).filter(Boolean),
      } as Omit<Achievement, "id">;
    }

    if (isEdit && initial) {
      updateAchievement(initial.id, data);
    } else {
      addAchievement(data);
    }
    onClose();
  };

  const handleDelete = async () => {
    if (!initial) return;
    const ok = await confirmDialog({
      title: `删除该${initial.category}？`,
      description: `${initial.year} · ${initial.authors.join("、")}`,
      confirmText: "删除",
      cancelText: "取消",
      tone: "danger",
    });
    if (!ok) return;
    removeAchievement(initial.id);
    onClose();
  };

  const field =
    "w-full rounded-xl border border-[#e8e4db] bg-white px-3.5 py-2.5 text-sm text-[#1a1a1a] placeholder-[#9a9590] outline-none transition-all focus:border-[#c96442]/40 focus:ring-2 focus:ring-[#c96442]/10";
  const label = "block text-sm font-medium text-[#1a1a1a] mb-1.5";
  const hint = "mt-1.5 text-xs text-[#9a9590]";
  const check = "inline-flex items-center gap-1.5 text-sm text-[#6b6560]";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onMouseDown={onBackdropMouseDown}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl bg-white border border-[#e8e4db] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0ece4]">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-[#c96442] text-white">
              {isEdit ? <Pencil size={14} /> : <Plus size={14} />}
            </div>
            <h2 className="font-serif text-lg font-bold text-[#1a1a1a]">
              {isEdit ? "编辑成果" : "新增成果"}
            </h2>
          </div>
          <button onClick={requestClose} className="text-[#9a9590] hover:text-[#1a1a1a]">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* 类别 */}
          <div>
            <label className={label}>类别</label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((c) => {
                const Icon = c.icon;
                const active = category === c.key;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setCategory(c.key)}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                      active
                        ? "bg-[#c96442] text-white border-[#c96442]"
                        : "bg-white text-[#6b6560] border-[#e8e4db] hover:border-[#c96442]/40"
                    }`}
                  >
                    <Icon size={15} />
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 归属人 */}
          <div className="rounded-xl border border-[#f0ece4] bg-[#faf9f5] p-3.5 space-y-3">
            <div>
              <label className={label}>
                <span className="inline-flex items-center gap-1.5">
                  <UserCheck size={14} className="text-[#c96442]" />
                  成果归属人
                </span>
              </label>
              <select value={owner} onChange={(e) => setOwner(e.target.value)} className={field}>
                <option value="">选择成员</option>
                {members
                  .filter((m) => m.status !== "已毕业")
                  .map((m) => (
                    <option key={m.name} value={m.name}>
                      {m.name}
                      {m.role === "teacher" ? "（老师）" : ""}
                    </option>
                  ))}
              </select>
              {programHint && (
                <p className={hint}>
                  将按 {ownerStudent?.program} · {ownerStudent?.degree ?? "未填学位"} 的毕业要求判定
                </p>
              )}
            </div>
            <label className="flex items-center gap-2 text-sm text-[#6b6560]">
              <input
                type="checkbox"
                checked={graduate}
                onChange={(e) => setGraduate(e.target.checked)}
                className="h-4 w-4 rounded border-[#e8e4db] text-[#c96442]"
              />
              计入本人毕业要求统计
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label}>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar size={14} className="text-[#c96442]" />
                  年份
                </span>
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2025"
                min="2000"
                max="2100"
                className={field}
              />
            </div>
            <div>
              <label className={label}>
                <span className="inline-flex items-center gap-1.5">
                  <Users size={14} className="text-[#c96442]" />
                  {category === "专利" ? "发明人" : category === "比赛" ? "获奖成员" : "作者"}
                  （用 、 分隔）
                </span>
              </label>
              <input
                value={authorsText}
                onChange={(e) => setAuthorsText(e.target.value)}
                placeholder="例如：佟亚龙、刘畅"
                className={field}
              />
            </div>
          </div>

          {/* 论文字段 */}
          {category === "论文" && (
            <>
              <div>
                <label className={label}>论文标题</label>
                <input
                  value={paperTitle}
                  onChange={(e) => setPaperTitle(e.target.value)}
                  placeholder="例如：ECO 智能求解综述"
                  className={field}
                  autoFocus={!isEdit}
                />
              </div>

              <div>
                <label className={label}>
                  <span className="inline-flex items-center gap-1.5">
                    <FileText size={14} className="text-[#c96442]" />
                    刊物类型
                  </span>
                </label>
                <div className="flex gap-2">
                  {(["期刊", "会议"] as const).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => {
                        setPaperVenueKind(k);
                        setPaperVenueKey("");
                      }}
                      className={`rounded-xl border px-3 py-2 text-sm transition-all ${
                        paperVenueKind === k
                          ? "bg-[#c96442] text-white border-[#c96442]"
                          : "bg-white text-[#6b6560] border-[#e8e4db] hover:border-[#c96442]/40"
                      }`}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={label}>
                  <span className="inline-flex items-center gap-1.5">
                    <Sparkles size={14} className="text-[#c96442]" />
                    从成果目录选择（决定等级判定）
                  </span>
                </label>
                <VenuePicker
                  kind={paperVenueKind}
                  value={paperVenueKey}
                  onChange={(key, v) => {
                    setPaperVenueKey(key);
                    if (key) setPaperVenue(v.name);
                  }}
                  className={field}
                />
                <p className={hint}>
                  选目录条目后，系统按 CCF / 中科院分区 / CCF 高质量科技期刊 / 一类目录自动判定等级。
                </p>
              </div>

              <div>
                <label className={label}>
                  <span className="inline-flex items-center gap-1.5">
                    <FileText size={14} className="text-[#c96442]" />
                    会议 / 期刊全称（不在目录内时手填）
                  </span>
                </label>
                <input
                  value={paperVenue}
                  onChange={(e) => setPaperVenue(e.target.value)}
                  placeholder="例如：DAC 2025 / 中国科学：信息科学"
                  className={field}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={label}>本人位次</label>
                  <select
                    value={authorRole}
                    onChange={(e) => setAuthorRole(e.target.value as AuthorRole | "")}
                    className={field}
                  >
                    <option value="">未填</option>
                    {AUTHOR_ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={label}>等级兜底（目录外时手填）</label>
                  <select
                    value={paperLevel}
                    onChange={(e) => setPaperLevel(e.target.value as AchievementLevel | "")}
                    className={field}
                    disabled={Boolean(paperVenueKey)}
                  >
                    <option value="">自动判定</option>
                    {MANUAL_LEVEL_OPTIONS.map((l) => (
                      <option key={l} value={l}>
                        {levelLabel(l)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-x-5 gap-y-2">
                <label className={check}>
                  <input
                    type="checkbox"
                    checked={coAuthor}
                    onChange={(e) => setCoAuthor(e.target.checked)}
                    className="h-4 w-4 rounded border-[#e8e4db] text-[#c96442]"
                  />
                  与他人共同署名（仅限一人使用）
                </label>
                <label className={check}>
                  <input
                    type="checkbox"
                    checked={bestPaper}
                    onChange={(e) => setBestPaper(e.target.checked)}
                    className="h-4 w-4 rounded border-[#e8e4db] text-[#c96442]"
                  />
                  CCF A/B 会议最佳论文（×1.5）
                </label>
                <label className={check}>
                  <input
                    type="checkbox"
                    checked={largeConference}
                    onChange={(e) => setLargeConference(e.target.checked)}
                    className="h-4 w-4 rounded border-[#e8e4db] text-[#c96442]"
                  />
                  当年录用 ≥500 篇的会议（×0.7）
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={label}>JCR 分区</label>
                  <select
                    value={paperJcr}
                    onChange={(e) => setPaperJcr(e.target.value as JcrZone | "")}
                    className={field}
                  >
                    <option value="">未填</option>
                    {JCR_OPTIONS.map((q) => (
                      <option key={q} value={q}>
                        {q}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={label}>中科院分区</label>
                  <select
                    value={paperCas}
                    onChange={(e) => setPaperCas(e.target.value as CasZone | "")}
                    className={field}
                  >
                    <option value="">未填</option>
                    {CAS_OPTIONS.map((q) => (
                      <option key={q} value={q}>
                        {q}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className={label}>通讯作者（可选，用 、 分隔）</label>
                <input
                  value={paperCorrText}
                  onChange={(e) => setPaperCorrText(e.target.value)}
                  placeholder="例如：刘畅"
                  className={field}
                />
              </div>
            </>
          )}

          {/* 专利字段 */}
          {category === "专利" && (
            <>
              <div>
                <label className={label}>专利名称</label>
                <input
                  value={patentName}
                  onChange={(e) => setPatentName(e.target.value)}
                  placeholder="例如：一种基于强化学习的 ECO 求解方法"
                  className={field}
                  autoFocus={!isEdit}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={label}>专利号（可选）</label>
                  <input
                    value={patentNo}
                    onChange={(e) => setPatentNo(e.target.value)}
                    placeholder="CN2025xxxxxx"
                    className={field}
                  />
                </div>
                <div>
                  <label className={label}>状态</label>
                  <select
                    value={patentStatus}
                    onChange={(e) => setPatentStatus(e.target.value as PatentStatus | "")}
                    className={field}
                  >
                    <option value="">未填</option>
                    {PATENT_STATUS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          {/* 比赛字段 */}
          {category === "比赛" && (
            <>
              <div>
                <label className={label}>比赛名</label>
                <input
                  value={compName}
                  onChange={(e) => setCompName(e.target.value)}
                  placeholder="例如：2025 EDA 精英挑战赛"
                  className={field}
                  autoFocus={!isEdit}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={label}>奖项</label>
                  <input
                    value={compAward}
                    onChange={(e) => setCompAward(e.target.value)}
                    placeholder="例如：一等奖（从下拉选或自定义）"
                    className={field}
                    list="award-levels"
                  />
                  <datalist id="award-levels">
                    {AWARD_LEVELS.map((a) => (
                      <option key={a} value={a} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className={label}>
                    <span className="inline-flex items-center gap-1.5">
                      <GraduationCap size={14} className="text-[#c96442]" />
                      指导老师
                    </span>
                  </label>
                  <input
                    value={compAdvisorsText}
                    onChange={(e) => setCompAdvisorsText(e.target.value)}
                    placeholder="例如：刘畅（用 、 分隔）"
                    className={field}
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className={label}>
              <span className="inline-flex items-center gap-1.5">
                <Link2 size={14} className="text-[#c96442]" />
                链接（可选）
              </span>
            </label>
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://doi.org/..."
              className={field}
            />
          </div>

          <div>
            <label className={label}>备注（可选）</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="例如：最佳论文奖 / 导师一作"
              className={field}
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <div className="flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[#f0ece4] bg-[#faf9f5] flex items-center gap-2">
          {isEdit && (
            <button
              onClick={handleDelete}
              className="rounded-xl px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              删除
            </button>
          )}
          <button
            onClick={requestClose}
            className="rounded-xl px-4 py-2 text-sm text-[#6b6560] hover:bg-[#f0ece4] transition-colors"
          >
            取消
          </button>
          <button
            onClick={submit}
            className="ml-auto rounded-xl bg-[#c96442] px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#b5573a]"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}