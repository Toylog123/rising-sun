/**
 * 刊会数据：保留在 degreeRequirements 里的旧结构（GuideRow / GuideGroup / VenueGuide 等）
 * 现在只用于「学院原文条款」与「官方目录全量条目」两块，具体刊会清单已迁移到
 * data/venueCatalog.ts，由按研究方向组织的页面渲染。
 *
 * 这里导出的是给选刊手册页面用的组合视图：把 venueCatalog 的条目换算成
 * 「学科 × 档位」的判定结果，供页面按专业分栏展示。
 */

import type { ProgramId } from "@/store/tasks";
import { venueGuides } from "./degreeRequirements";
import { ALL_VENUES } from "./venueIndex";
import type { VenueRow, FieldTag } from "./venueCatalog";

/** 某条目在某学科能算到的最高档位；"" = 不进入该学科的目录 */
export type GradeId = "一类目录" | "A-1" | "A-2" | "A-3" | "A-4" | "B-1" | "B-2" | "B-3" | "基本目录" | "";

export const GRADE_ORDER: GradeId[] = [
  "一类目录",
  "A-1",
  "A-2",
  "A-3",
  "A-4",
  "B-1",
  "B-2",
  "B-3",
  "基本目录",
];

export function gradeRank(g: GradeId): number {
  const i = GRADE_ORDER.indexOf(g);
  return i < 0 ? GRADE_ORDER.length : i;
}

const CAS_NUM: Record<string, number> = { "1区": 1, "2区": 2, "3区": 3, "4区": 4 };
function casOf(v: VenueRow): number | undefined {
  return v.cas ? CAS_NUM[v.cas] : undefined;
}

/**
 * 计算机科学与技术 / 软件工程（0812 / 0835）的档位判定。
 *
 * 依据学院原文：
 *   A-1 = CCF A 类 **且** 中科院 1 区 Top（两者同时满足）
 *   A-2 = 中科院 1 区
 *   B-1 = CCF A 或 B 类；CCF 高质量科技期刊 T1；《国防科技大学学报》
 *   B-2 = 中科院 2 区
 *   B-3 = 无（计算机学科原文没有 B-3）
 */

/** 有中科院分区说明是 SCI 收录；有 ISSN 说明是正式期刊 —— 二者都属于「基本目录」范围 */
function basicFallback(v: VenueRow): GradeId {
  if (v.cas) return "基本目录";
  if (v.kind === "期刊" && v.issn && /^\d{4}-\d{3}[0-9Xx]$/.test(v.issn)) return "基本目录";
  // 中文刊没有 ISSN 也有国内统一刊号（CN），属于国内正式期刊，同样落在「基本目录」范围
  if (v.kind === "期刊" && v.cnNo) return "基本目录";
  return "";
}

export function gradeCs(v: VenueRow): GradeId {
  if (v.tier1) return "一类目录";
  const cas = casOf(v);
  if (v.ccf === "A" && v.casTop && cas === 1) return "A-1";
  if (cas === 1) return "A-2";
  if (v.ccf === "A" || v.ccf === "B") return "B-1";
  if (v.ccfTj === "T1") return "B-1";
  if (cas === 2) return "B-2";
  if (v.ccf === "C") return "基本目录";
  if (v.ccfTj === "T2" || v.ccfTj === "T3") return "基本目录";
  if (v.kind === "会议" && ICE_CONF_FALLBACK.has(v.abbr)) return "基本目录";
  return basicFallback(v);
}

/**
 * 集成电路科学与工程（1401）的档位判定。
 *
 * 依据学院原文：二类 A 比计算机多 A-3（中国电子学会一类）与 A-4（IEEE NSREC）；
 * 二类 B 多 B-2（电子学会二类 / 电子通信高质量目录 T1）、B-3（中科院 2 区）。
 */
export function gradeIce(v: VenueRow): GradeId {
  if (v.tier1) return "一类目录";
  if (v.namedInDoc && /NSREC/.test(v.abbr)) return "A-4";
  const cas = casOf(v);
  if (v.ccf === "A") return "A-1";
  if (cas === 1) return "A-2";
  if (v.csee === "T1") return "A-3";
  if (v.ccf === "B") return "B-1";
  if (v.ccfTj === "T1") return "B-1";
  if (v.csee === "T2") return "B-2";
  if (v.ccfTj === "T2") return "B-2";
  if (cas === 2) return "B-3";
  if (v.ccf === "C") return "基本目录";
  if (v.csee === "T3" || v.ccfTj === "T3") return "基本目录";
  if (v.kind === "会议" && ICE_CONF_FALLBACK.has(v.abbr)) return "基本目录";
  return basicFallback(v);
}


/**
 * 会议兜底：集成电路学科的二类目录同时认「电子学会分级」与 CCF，
 * 但 ISSCC / IEDM / ESSCIRC / CICC / A-SSCC 这类芯片领域顶会两边都不收。
 * 学院原文另列了 NSREC；其余按「集成电路学科公认的会议层级」兜底为基本目录，
 * 并在 note 里标注入库依据，避免被误判成「不在目录内」。
 */
const ICE_CONF_FALLBACK = new Set([
  "ISSCC", "IEDM", "ESSCIRC", "A-SSCC", "CICC", "VLSI Symp.", "VLSI Symposium",
  "VLSI-DAT", "IRPS", "ESREF", "ICECS", "LASCAS", "ASICON", "ICSICT", "PRIME",
  "ISQED", "IOLTS", "DFTS", "DFT", "DSD", "MWSCAS", "NEWCAS", "RADECS", "SAMOS", "SBCCI", "SOCC", "VLSID", "HOST",
]);

/**
 * 电子信息（牵头单位电子科学学院）的档位判定。
 *
 * 学院总要求只把成果分成 A 类（论文）/ B 类（专著）/ C 类（授权发明专利）等类型，
 * 没有细化到 A-1/A-2 子档，各学院附件目录未随总要求下发。
 * 所以这里按「论文层级」简化映射，并在页面上明确标注是推断口径。
 */
export function gradeDz(v: VenueRow): GradeId {
  if (v.tier1) return "一类目录";
  const cas = casOf(v);
  if (v.ccf === "A") return "A-1";
  if (cas === 1) return "A-2";
  if (v.ccf === "B" || v.ccfTj === "T1" || v.csee === "T1") return "B-1";
  if (cas === 2) return "B-2";
  if (v.ccf === "C" || v.ccfTj) return "基本目录";
  if (v.kind === "会议" && ICE_CONF_FALLBACK.has(v.abbr)) return "基本目录";
  return basicFallback(v);
}

export function graderFor(program: ProgramId): (v: VenueRow) => GradeId {
  if (program === "计算机科学与技术") return gradeCs;
  if (program === "集成电路科学与工程") return gradeIce;
  return gradeDz;
}

export interface GradedVenue extends VenueRow {
  grade: GradeId;
}

/** 某学科下、某方向标签的条目（带档位），按档位 → CCF → 名称排序 */
export function gradedVenues(program: ProgramId, field?: FieldTag | "全部"): GradedVenue[] {
  const grader = graderFor(program);
  const rows = ALL_VENUES.filter((v) => !field || field === "全部" || v.fields.includes(field))
    .map((v) => ({ ...v, grade: grader(v) }))
    .filter((v) => v.grade !== "");
  const ccfRank = (g?: "A" | "B" | "C" | "") => (g === "A" ? 0 : g === "B" ? 1 : g === "C" ? 2 : 3);
  return rows.sort(
    (a, b) =>
      gradeRank(a.grade) - gradeRank(b.grade) ||
      ccfRank(a.ccf) - ccfRank(b.ccf) ||
      a.abbr.localeCompare(b.abbr, "zh")
  );
}

/** 每个方向标签下有多少条（用于筛选胶囊上的计数） */
export function fieldCounts(program: ProgramId): { field: FieldTag | "全部"; count: number }[] {
  const all = gradedVenues(program, "全部");
  const out: { field: FieldTag | "全部"; count: number }[] = [{ field: "全部", count: all.length }];
  const tags = new Set<FieldTag>();
  for (const v of all) for (const f of v.fields) tags.add(f);
  for (const t of tags) {
    out.push({ field: t, count: all.filter((v) => v.fields.includes(t)).length });
  }
  return out;
}


/** 全部条目（含未进入目录的），供检索用 */
export function allGradedVenues(program: ProgramId, field?: FieldTag | "全部"): GradedVenue[] {
  const grader = graderFor(program);
  return ALL_VENUES.filter((v) => !field || field === "全部" || v.fields.includes(field)).map((v) => ({
    ...v,
    grade: grader(v),
  }));
}

// ---------------------------------------------------------------- 学科元信息

export interface ProgramMeta {
  id: string;
  program: ProgramId;
  code: string;
  name: string;
  unit: string;
  tagline: string;
}

export const PROGRAMS: ProgramMeta[] = [
  {
    id: "ice",
    program: "集成电路科学与工程",
    code: "1401",
    name: "集成电路科学与工程",
    unit: "计算机学院",
    tagline: "二类目录分 A-1~A-4 / B-1~B-3 六档，比计算机多出电子学会分级与 NSREC 两条口径。",
  },
  {
    id: "cs",
    program: "计算机科学与技术",
    code: "0812 / 0835",
    name: "计算机科学与技术、软件工程",
    unit: "计算机学院",
    tagline: "二类目录分 A-1/A-2、B-1/B-2 四档，A-1 要求 CCF A 与中科院 1 区 Top 同时满足。",
  },
  {
    id: "dz",
    program: "电子信息",
    code: "专业学位/学科大类",
    name: "电子信息",
    unit: "电子科学学院（牵头）",
    tagline: "总要求只分成果类型（论文/专著/专利/奖励等），未下发细化目录；本页档位为推断口径。",
  },
];

/** 原文条款（页面上只展示条款文字，不再展示整套原文视图） */
export function requirementRows(program: ProgramId) {
  const g = venueGuides.find((x) => x.name.startsWith(program.slice(0, 2)));
  return g?.requirements ?? [];
}