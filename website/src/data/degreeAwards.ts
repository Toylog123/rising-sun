import { venueGuides, TIER1_JOURNALS, type GuideRow } from "./degreeRequirements";
import { ccfCategories, ccfTjJournals } from "./ccfCatalog";
import type { ProgramId } from "@/store/tasks";

// 学位成果的「认定规则」数据层
//
// 这里只放**事实与口径**：
//   1. 成果目录条目（venueKey → 名称 / 类型 / CCF 类 / CCF T1 / 中科院分区 / 一类目录归属）；
//   2. 一份「学科 × 学位层次 × 认定门槛」的规则清单（基本要求 / 公开评阅通道）；
//   3. 折算规则的参数。
//
// 判定逻辑在 lib/degreeAudit.ts；学院原文条款在 data/degreeRequirements.ts 的 requirements 里，
// 两边靠 requirementId 关联。

const LEVEL_ORDER = [
  "一类目录",
  "A-1",
  "A-2",
  "A-3",
  "A-4",
  "B-1",
  "B-2",
  "B-3",
  "基本目录",
  "非目录",
] as const;

export type AchievementLevel = (typeof LEVEL_ORDER)[number];

/** 可手动指定的等级（不含「一类目录 / 非目录」） */
export const MANUAL_LEVELS = ["A-1", "A-2", "A-3", "A-4", "B-1", "B-2", "B-3", "基本目录"] as const;

const LEVEL_RANK = new Map<string, number>(LEVEL_ORDER.map((l, i) => [l, i]));

/** 等级排序：数字越小越高；未知等级排在最后 */
export function levelRank(level: string | undefined): number {
  if (!level) return LEVEL_ORDER.length;
  return LEVEL_RANK.get(level) ?? LEVEL_ORDER.length;
}

export function isLevel(v: string | undefined): v is AchievementLevel {
  return !!v && LEVEL_RANK.has(v);
}

/** 展示用的等级标签 */
export function levelLabel(level: AchievementLevel): string {
  return level === "非目录" ? "目录外" : level;
}

// ---------------------------------------------------------------- 作者位次

/** 本人在这篇论文里的位次（成果录入时选，导师身份不参与学生本人的「一作」判定） */
export type AuthorRole = "一作" | "共同一作" | "导师一作本人二作" | "通讯" | "其它";

export const AUTHOR_ROLE_OPTIONS: AuthorRole[] = ["一作", "共同一作", "导师一作本人二作", "通讯", "其它"];

/** 各学科的「基本要求」认不认「导师一作本人二作」 */
const BENEFIT_SECOND_AUTHOR: Record<ProgramId, boolean> = {
  集成电路科学与工程: true,
  计算机科学与技术: true,
  电子信息: true,
};

// ---------------------------------------------------------------- 成果目录条目

export interface Venue {
  key: string;
  abbr: string;
  name: string;
  kind: "期刊" | "会议";
  ccf?: "A" | "B" | "C";
  field?: string;
  tj?: "T1" | "T2" | "T3";
  cas?: number;
  casTop?: boolean;
  tier1?: boolean;
  /** 学院《国防科技大学学报》单独列名 */
  nudtJournal?: boolean;
}

const venues = new Map<string, Venue>();
const order: Venue[] = [];

function keyOf(kind: "期刊" | "会议", abbr: string, name: string): string {
  return `${kind === "期刊" ? "j" : "c"}:${abbr && abbr !== "—" ? abbr : name}`;
}

function upsert(init: Venue) {
  const existing = venues.get(init.key);
  if (existing) {
    existing.ccf ??= init.ccf;
    existing.field ??= init.field;
    existing.tj ??= init.tj;
    existing.cas ??= init.cas;
    existing.casTop ||= init.casTop;
    existing.tier1 ||= init.tier1;
    existing.nudtJournal ||= init.nudtJournal;
    return existing;
  }
  venues.set(init.key, init);
  order.push(init);
  return init;
}

// 中科院大类分区：只落本组汇报过 / 手册里明确查过的刊物，其余留空 → 录入时要求手填复核
const CAS_BY_ABBR: Record<string, number> = {
  Nature: 1,
  Science: 1,
  Cell: 1,
  "Nature Materials": 1,
  "Nature Electronics": 1,
  "Nature Physics": 1,
  "Nature Nanotechnology": 1,
  "Nature Photonics": 1,
  "Nature Communications": 1,
  "Science Advances": 1,
  "Nature Computational Science": 1,
  "Nature Machine Intelligence": 1,
  "Science Robotics": 1,
  JSSC: 1,
  TPEL: 1,
  TCAD: 2,
  TVLSI: 2,
  TED: 2,
  "TCAS-I": 2,
  TC: 2,
  TPDS: 2,
  TACO: 3,
  TNS: 3,
  TDMR: 3,
  TECS: 3,
  TODAES: 3,
};

// 一类目录 13 本（原文附件）
for (const j of TIER1_JOURNALS) {
  upsert({
    key: keyOf("期刊", j.en, j.en),
    abbr: j.en,
    name: j.en,
    kind: "期刊",
    cas: CAS_BY_ABBR[j.en],
    tier1: true,
  });
}

// CCF 推荐国际会议期刊目录全量（644 条）
for (const cat of ccfCategories) {
  for (const rank of ["A", "B", "C"] as const) {
    for (const e of cat.journals[rank]) {
      upsert({
        key: keyOf("期刊", e.abbr, e.name),
        abbr: e.abbr,
        name: e.name,
        kind: "期刊",
        ccf: rank,
        field: cat.cn,
        cas: CAS_BY_ABBR[e.abbr],
      });
    }
    for (const e of cat.conferences[rank]) {
      upsert({
        key: keyOf("会议", e.abbr, e.name),
        abbr: e.abbr,
        name: e.name,
        kind: "会议",
        ccf: rank,
        field: cat.cn,
      });
    }
  }
}

// CCF《计算领域高质量科技期刊分级目录》2025（T1 19 / T2 22 / T3 27）
for (const j of ccfTjJournals) {
  upsert({
    key: keyOf("期刊", j.en, j.cn),
    abbr: j.en || j.cn,
    name: `${j.cn}（${j.en}）`,
    kind: "期刊",
    tj: j.tier,
  });
}

// 手册清单里额外出现的条目（NSREC、中国科学：信息科学、微电子学等）
for (const guide of venueGuides) {
  const rows: GuideRow[] = [
    ...guide.lists.flatMap((g) => g.rows),
    ...guide.recommendations.flatMap((t) => t.items),
    ...(guide.official.ccfRank ?? []).flatMap((g) => g.rows),
  ];
  for (const r of rows) {
    const casText = r.cas ?? "";
    const cas = casText.startsWith("1 区") ? 1 : casText.startsWith("2 区") ? 2 : casText.startsWith("3 区") ? 3 : casText.startsWith("4 区") ? 4 : undefined;
    upsert({
      key: keyOf(r.kind, r.abbr, r.name),
      abbr: r.abbr,
      name: r.name,
      kind: r.kind,
      cas,
      casTop: casText.includes("Top"),
      nudtJournal: r.name.includes("国防科技大学学报"),
    });
  }
}

/** 全部可选目录条目（选刊下拉用） */
export const venueList: Venue[] = order;
export const venueByKey = venues;

// ---------------------------------------------------------------- 规则

/** 某档次的判据 */
export interface TierSpec {
  id: string;
  label: string;
  /** 计入该档的等级 */
  levels: AchievementLevel[];
  /** 是否要求「CCF A 且中科院 1 区 Top 同时满足」（计算机 A-1） */
  requireCcfAAndCasTop?: boolean;
  /** 是否只认期刊（中科院分区门槛） */
  journalOnly?: boolean;
  /** 免疫折算（基本要求按实际篇数计） */
  noConversion?: boolean;
}

export type MetricId =
  | "tier1Paper" // 一类目录 N 篇
  | "tierPaper" // 某档 N 篇
  | "tierPapersMixed" // 某档 N 篇且其中 ≥ M 篇为某子档
  | "tierPaperPlusPrize" // 某档 N 篇 + 专著 / 省部级奖
  | "anyPaper" // 目录内论文 N 篇（基本要求）
  | "patentAuthorized" // 授权发明专利（前 2）
  | "monograph" // 专著（前 3）
  | "majorProject"; // 重大项目应用（人工认定）

export interface AwardRule {
  id: string;
  kind: "basic" | "public";
  /** 分组：basic = 基本要求；A / B 是公开评阅的档；other = 人工认定 */
  group: "basic" | "A" | "B" | "other";
  title: string;
  /** 对应学院原文条款 id（data/degreeRequirements.ts 的 requirements[].degree 派生） */
  requirementId: string;
  metric: MetricId;
  tier?: string;
  tier2?: string;
  count?: number;
  atLeast?: number;
  desc: string;
}

export interface ProgramRules {
  program: ProgramId;
  tiers: TierSpec[];
  rules: {
    博士: AwardRule[];
    博士提前: AwardRule[];
    硕士: AwardRule[];
  };
}

/** 折算与限制规则（学院「其他说明」） */
export const CONVERSION = {
  /** CCF A/B 类会议最佳论文按 1.5 篇折算 */
  bestPaperFactor: 1.5,
  /** CCF A/B 类会议当年录用 ≥ 500 篇按 0.7 篇折算 */
  largeConferenceFactor: 0.7,
  largeConferenceThreshold: 500,
  /** 共同一作原则上仅限一篇（超出部分按普通二作及以下处理） */
  coFirstOnlyOnce: true,
  /** 共同作者成果仅限一人使用（重复使用会被标出） */
  coAuthorOnlyOnce: true,
};

const CS_TIERS: TierSpec[] = [
  { id: "tier1", label: "一类目录", levels: ["一类目录"] },
  { id: "A1", label: "A-1（CCF A 且中科院 1 区 Top）", levels: ["A-1"], requireCcfAAndCasTop: true },
  { id: "A", label: "二类(A)（A-1 / A-2）", levels: ["A-1", "A-2"] },
  { id: "A2", label: "A-2（中科院 1 区）", levels: ["A-2"], journalOnly: true },
  { id: "B", label: "二类(B)（B-1 / B-2）", levels: ["B-1", "B-2"] },
  { id: "B1", label: "B-1（CCF B 以上 / CCF T1）", levels: ["B-1"] },
  { id: "B2", label: "B-2（中科院 2 区）", levels: ["B-2"], journalOnly: true },
  { id: "base", label: "基本目录", levels: ["基本目录"], noConversion: true },
];

const CS_RULES: ProgramRules = {
  program: "计算机科学与技术",
  tiers: CS_TIERS,
  rules: {
    博士: [
      {
        id: "cs-phd-basic-papers",
        kind: "basic",
        group: "basic",
        title: "目录内论文 ≥ 2 篇（本人一作，国防科大第一单位）",
        requirementId: "cs-博士",
        metric: "anyPaper",
        count: 2,
        desc: "本人一作、以国防科技大学为第一单位；折算后的等效篇数需 ≥ 2。",
      },
      {
        id: "cs-phd-pub-tier1",
        kind: "public",
        group: "A",
        title: "通道① 一类目录 1 篇",
        requirementId: "cs-博士",
        metric: "tier1Paper",
        count: 1,
        desc: "一类目录 13 本顶刊任一（一作或通讯，含共同作者）。",
      },
      {
        id: "cs-phd-pub-a2",
        kind: "public",
        group: "A",
        title: "通道② 二类(A) 2 篇，其中 ≥ 1 篇 A-1",
        requirementId: "cs-博士",
        metric: "tierPapersMixed",
        tier: "A",
        tier2: "A1",
        count: 2,
        atLeast: 1,
        desc: "A 档（A-1 或 A-2）累计两篇，且至少一篇 A-1。",
      },
      {
        id: "cs-phd-pub-a1-pre",
        kind: "public",
        group: "A",
        title: "通道③ A-1 单篇 + 预审「优秀」+ 分委会推荐",
        requirementId: "cs-博士",
        metric: "tierPaper",
        tier: "A1",
        count: 1,
        desc: "论文条件只看 A-1 单篇；预审与推荐由学院掌握。",
      },
      {
        id: "cs-phd-pub-b4",
        kind: "public",
        group: "B",
        title: "通道④ 二类(B) 4 篇，其中 ≥ 2 篇 B-1",
        requirementId: "cs-博士",
        metric: "tierPapersMixed",
        tier: "B",
        tier2: "B1",
        count: 4,
        atLeast: 2,
        desc: "B 档（B-1 或 B-2）累计四篇，且至少两篇 B-1。",
      },
      {
        id: "cs-phd-pub-b1-prize",
        kind: "public",
        group: "B",
        title: "通道⑤ B-1 两篇 + 专著（前 2）/ 省部级奖（前 3）",
        requirementId: "cs-博士",
        metric: "tierPaperPlusPrize",
        tier: "B1",
        count: 2,
        desc: "论文两篇 B-1 之外还需专著或奖项。",
      },
      {
        id: "cs-phd-pub-project",
        kind: "public",
        group: "other",
        title: "通道⑥ 重大项目应用 + 公示无异议 + 推荐",
        requirementId: "cs-博士",
        metric: "majorProject",
        desc: "由导师与预审专家组认定，成果表里不体现。",
      },
    ],
    博士提前: [
      {
        id: "cs-phd-early",
        kind: "basic",
        group: "basic",
        title: "一类目录 1 篇及以上（同时满足学位基本要求）",
        requirementId: "cs-博士（提前）",
        metric: "tier1Paper",
        count: 1,
        desc: "提前申请在此基础上仍需满足基本要求。",
      },
    ],
    硕士: [
      {
        id: "cs-ms-basic-paper",
        kind: "basic",
        group: "basic",
        title: "目录内论文 ≥ 1 篇（本人一作或二作含导师一作）",
        requirementId: "cs-硕士",
        metric: "anyPaper",
        count: 1,
        desc: "正式出版期刊或会议论文集全文发表（含在线发表）或录用，国防科大为第一单位。",
      },
      {
        id: "cs-ms-basic-patent",
        kind: "basic",
        group: "basic",
        title: "或：授权发明专利 1 项（前 2）",
        requirementId: "cs-硕士",
        metric: "patentAuthorized",
        count: 1,
        desc: "国防科大为第一完成单位，本人排名前 2。",
      },
      {
        id: "cs-ms-basic-book",
        kind: "basic",
        group: "basic",
        title: "或：专著 1 部（前 3）",
        requirementId: "cs-硕士",
        metric: "monograph",
        count: 1,
        desc: "国防科大为第一完成单位，本人排名前 3。",
      },
      {
        id: "cs-ms-pub-listed",
        kind: "public",
        group: "A",
        title: "公开评阅① CCF 目录 / CCF T1·T2 / 国防科技大学学报 1 篇",
        requirementId: "cs-硕士",
        metric: "tierPaper",
        tier: "listed",
        count: 1,
        desc: "CCF 推荐目录（A/B/C 类均可）、CCF 高质量科技期刊 T1/T2、《国防科技大学学报》任一，一作或二作。",
      },
      {
        id: "cs-ms-pub-cas3",
        kind: "public",
        group: "B",
        title: "公开评阅② 中科院大类 3 区及以上 1 篇",
        requirementId: "cs-硕士",
        metric: "tierPaper",
        tier: "B2",
        count: 1,
        desc: "中科院大类分区 ≤ 3 区。",
      },
    ],
  },
};

const ICE_TIERS: TierSpec[] = [
  { id: "tier1", label: "一类目录", levels: ["一类目录"] },
  { id: "A", label: "二类(A)（A-1 ~ A-4）", levels: ["A-1", "A-2", "A-3", "A-4"] },
  { id: "A1", label: "A-1（CCF A 类）", levels: ["A-1"] },
  { id: "A2", label: "A-2（中科院 1 区）", levels: ["A-2"], journalOnly: true },
  { id: "A3", label: "A-3（电子学会一类）", levels: ["A-3"] },
  { id: "A4", label: "A-4（NSREC）", levels: ["A-4"] },
  { id: "B", label: "二类(B)（B-1 ~ B-3）", levels: ["B-1", "B-2", "B-3"] },
  { id: "B1", label: "B-1（CCF B 以上 / CCF T1）", levels: ["B-1"] },
  { id: "B2", label: "B-2（电子学会二类 / 电子技术通信 T1）", levels: ["B-2"] },
  { id: "B3", label: "B-3（中科院 2 区）", levels: ["B-3"], journalOnly: true },
  { id: "base", label: "基本目录", levels: ["基本目录"], noConversion: true },
];

const ICE_RULES: ProgramRules = {
  program: "集成电路科学与工程",
  tiers: ICE_TIERS,
  rules: {
    博士: [
      {
        id: "ice-phd-basic-papers",
        kind: "basic",
        group: "basic",
        title: "目录内论文 ≥ 2 篇（本人一作，国防科大第一单位）",
        requirementId: "ice-博士",
        metric: "anyPaper",
        count: 2,
        desc: "本人一作、以国防科技大学为第一单位；折算后的等效篇数需 ≥ 2。",
      },
      {
        id: "ice-phd-pub-tier1",
        kind: "public",
        group: "A",
        title: "通道① 一类目录 1 篇",
        requirementId: "ice-博士",
        metric: "tier1Paper",
        count: 1,
        desc: "一类目录 13 本顶刊任一（一作或通信，含共同作者）。",
      },
      {
        id: "ice-phd-pub-a2",
        kind: "public",
        group: "A",
        title: "通道② 二类(A) 2 篇",
        requirementId: "ice-博士",
        metric: "tierPaper",
        tier: "A",
        count: 2,
        desc: "A 档（A-1 ~ A-4 任一）累计两篇，不要求某一条单独达标。",
      },
      {
        id: "ice-phd-pub-a1-pre",
        kind: "public",
        group: "A",
        title: "通道③ A-1 单篇 + 预审「优秀」+ 分委会推荐",
        requirementId: "ice-博士",
        metric: "tierPaper",
        tier: "A1",
        count: 1,
        desc: "论文条件只看 A-1 单篇。",
      },
      {
        id: "ice-phd-pub-b4",
        kind: "public",
        group: "B",
        title: "通道④ 二类(B) 4 篇",
        requirementId: "ice-博士",
        metric: "tierPaper",
        tier: "B",
        count: 4,
        desc: "B 档（B-1 ~ B-3 任一）累计四篇。",
      },
      {
        id: "ice-phd-pub-b3-prize",
        kind: "public",
        group: "B",
        title: "通道⑤ 二类(B) 3 篇 + 专著（前 2）/ 省部级奖（前 3）",
        requirementId: "ice-博士",
        metric: "tierPaperPlusPrize",
        tier: "B",
        count: 3,
        desc: "论文三篇之外还需专著或奖项。",
      },
      {
        id: "ice-phd-pub-project",
        kind: "public",
        group: "other",
        title: "通道⑥ 重大项目应用 + 联合导师组联名推荐",
        requirementId: "ice-博士",
        metric: "majorProject",
        desc: "由导师组认定，成果表里不体现。",
      },
    ],
    博士提前: [
      {
        id: "ice-phd-early",
        kind: "basic",
        group: "basic",
        title: "一类目录 1 篇及以上（同时满足学位基本要求）",
        requirementId: "ice-博士（提前）",
        metric: "tier1Paper",
        count: 1,
        desc: "原文此条引用了计算机学科目录名称，实际执行以学院解释为准。",
      },
    ],
    硕士: [
      {
        id: "ice-ms-basic-paper",
        kind: "basic",
        group: "basic",
        title: "目录内论文 ≥ 1 篇（本人一作或二作含导师一作）",
        requirementId: "ice-硕士",
        metric: "anyPaper",
        count: 1,
        desc: "正式出版期刊或会议论文集全文发表（含在线发表）或录用，国防科大为第一单位。",
      },
      {
        id: "ice-ms-basic-patent",
        kind: "basic",
        group: "basic",
        title: "或：授权发明专利 1 项（前 2）",
        requirementId: "ice-硕士",
        metric: "patentAuthorized",
        count: 1,
        desc: "国防科大为第一完成单位，本人排名前 2。",
      },
      {
        id: "ice-ms-basic-book",
        kind: "basic",
        group: "basic",
        title: "或：专著 1 部（前 3）",
        requirementId: "ice-硕士",
        metric: "monograph",
        count: 1,
        desc: "国防科大为第一完成单位，本人排名前 3。",
      },
      {
        id: "ice-ms-pub-listed",
        kind: "public",
        group: "A",
        title: "公开评阅① CCF 目录 / CCF T1·T2 / 电子技术通信 T1·T2 / 国防科技大学学报 1 篇",
        requirementId: "ice-硕士",
        metric: "tierPaper",
        tier: "listed",
        count: 1,
        desc: "CCF 推荐目录内刊物、CCF 高质量科技期刊 T1/T2、中国电子学会「电子技术、通信技术」分级目录 T1/T2、《国防科技大学学报》任一。",
      },
      {
        id: "ice-ms-pub-cas3",
        kind: "public",
        group: "B",
        title: "公开评阅② 中科院大类 3 区及以上 1 篇",
        requirementId: "ice-硕士",
        metric: "tierPaper",
        tier: "B2",
        count: 1,
        desc: "中科院大类分区 ≤ 3 区。",
      },
    ],
  },
};

const DZ_TIERS: TierSpec[] = [
  { id: "tier1", label: "一类目录", levels: ["一类目录"] },
  { id: "A", label: "A 类成果（论文）", levels: ["一类目录", "A-1", "A-2", "A-3", "A-4", "B-1", "B-2", "B-3", "基本目录"] },
  { id: "base", label: "基本目录", levels: ["基本目录"] },
];

const DZ_RULES: ProgramRules = {
  program: "电子信息",
  tiers: DZ_TIERS,
  rules: {
    博士: [
      {
        id: "dz-phd-basic-count",
        kind: "basic",
        group: "basic",
        title: "紧密相关成果 ≥ 2 项（工程新技术类须含 A 类 1 项）",
        requirementId: "dz-博士",
        metric: "anyPaper",
        count: 2,
        desc: "成果类型 A~G 任取 ≥ 2 项；工程新技术研究类学位论文必须含 A 类（论文）1 项。本系统目前只统计论文 A 类。",
      },
    ],
    博士提前: [
      {
        id: "dz-phd-early",
        kind: "basic",
        group: "basic",
        title: "达到专业学院提前申请要求（参考：一类目录 1 篇）",
        requirementId: "dz-博士（提前）",
        metric: "tier1Paper",
        count: 1,
        desc: "各专业学院自定，此处按一类目录 1 篇作参考门槛，需人工确认。",
      },
    ],
    硕士: [
      {
        id: "dz-ms-basic",
        kind: "basic",
        group: "basic",
        title: "成果类型 A~F 中至少 1 项",
        requirementId: "dz-硕士",
        metric: "anyPaper",
        count: 1,
        desc: "论文（A）、专著（B）、专利（C）、奖励（D）、标准（E）、鉴定（F）任一计 1 项；本系统目前只统计论文与专利。",
      },
    ],
  },
};

export const PROGRAM_RULES: Record<ProgramId, ProgramRules> = {
  计算机科学与技术: CS_RULES,
  集成电路科学与工程: ICE_RULES,
  电子信息: DZ_RULES,
};

export function rulesFor(program: ProgramId, degree: "硕士" | "博士"): AwardRule[] {
  return PROGRAM_RULES[program].rules[degree];
}

export function tierOf(program: ProgramId, id: string): TierSpec | undefined {
  return PROGRAM_RULES[program].tiers.find((t) => t.id === id);
}

/** 某成果在学科下有没有「论文一作且目录内」的资格条件 */
export function acceptsSecondAuthor(program: ProgramId): boolean {
  return BENEFIT_SECOND_AUTHOR[program];
}