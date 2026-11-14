/**
 * 全量刊会目录：CCF 第七版 644 条 + 电子学会分级 + 中科院分区。
 *
 * 数据来源见 venueCatalog.ts 里的 VENUE_SOURCES。
 * 「verified」= 有官方来源逐条核实过；其余为承接既有条目的领域归类与等级判定。
 *
 * 本文件由 scripts 生成后手工维护，顺序：一类目录 → 器件/可靠性 → 中文刊 → CCF 全量 → 会议。
 */

import type { FieldTag, VenueKind, VenueRow } from "./venueCatalog";
import { CSEE_BY_ISSN, CSEE_ENTRIES } from "./cseeFull";

/** CCF 领域 → 本站研究方向标签 */
const DOMAIN_FIELDS: Record<string, FieldTag[]> = {
  "体系结构/并行与分布/存储": ["体系结构"],
  "计算机网络": ["综合/交叉"],
  "网络与信息安全": ["综合/交叉"],
  "软件工程/系统软件/语言": ["EDA/物理设计", "综合/交叉"],
  "数据库/数据挖掘/内容检索": ["综合/交叉"],
  "计算机科学理论": ["综合/交叉"],
  "图形学与多媒体": ["综合/交叉"],
  "人工智能": ["AI for EDA"],
  "人机交互与普适计算": ["综合/交叉"],
  "交叉/综合/新兴": ["综合/交叉"],
};

/** CCF 领域 → 一句话说明（用于新增条目） */
const DOMAIN_NOTES: Record<string, string> = {
  "体系结构/并行与分布/存储": "体系结构/并行/存储方向，与体系结构、加速器、存储层次相关。",
  "计算机网络": "计算机网络方向，与片上网络、互连相关时可投。",
  "网络与信息安全": "网络与信息安全方向，与硬件安全、侧信道相关时可投。",
  "软件工程/系统软件/语言": "软件工程与系统软件方向，EDA 工具实现、编译器后端可归入。",
  "数据库/数据挖掘/内容检索": "数据管理与挖掘方向，与 EDA 中的机器学习、数据驱动优化沾边时可投。",
  "计算机科学理论": "计算机科学理论方向，形式化方法、算法与复杂度相关。",
  "图形学与多媒体": "图形学与多媒体方向，版图可视化、布局算法几何建模可归入。",
  "人工智能": "人工智能方向，AI for EDA、数据驱动算法的主要出口。",
  "人机交互与普适计算": "人机交互与普适计算方向，与芯片/EDA 主线关联较弱。",
  "交叉/综合/新兴": "交叉/综合/新兴方向，跨学科成果的兜底去处。",
};

/**
 * 中科院分区覆盖表（2025 年 3 月升级版，LetPub 逐刊页核对）。
 * 格式：简称 → [分区, 是否 Top, 影响因子]
 * 只收期刊；会议无分区。
 */
export const CAS_TABLE: Record<string, [string, boolean, number]> = {
  // 一类目录 13 本
  Nature: ["1区", true, 50.5],
  Science: ["1区", true, 44.7],
  Cell: ["1区", true, 45.5],
  "Nat. Mater.": ["1区", true, 37.2],
  "Nat. Electron.": ["1区", true, 33.7],
  "Nat. Phys.": ["1区", true, 17.6],
  "Nat. Nanotechnol.": ["1区", true, 38.1],
  "Nat. Photonics": ["1区", true, 32.3],
  "Nat. Commun.": ["1区", false, 14.7],
  "Sci. Adv.": ["1区", false, 11.7],
  "Nat. Comput. Sci.": ["1区", false, 12.0],
  "Nat. Mach. Intell.": ["1区", false, 18.8],
  "Sci. Robot.": ["1区", false, 26.1],
  // Nature 子刊
  "npj Comput. Mater.": ["1区", true, 9.4],
  "Sci. Rep.": ["3区", false, 3.9],
  // 器件 / 固态电路
  "JSSC": ["1区", true, 5.6],
  "TCAS-I": ["2区", true, 5.6],
  "TCAS-II": ["2区", true, 4.6],
  "TED": ["3区", false, 3.6],
  "EDL": ["2区", false, 4.6],
  "SSC-L": ["3区", false, 2.0],
  "TPEL": ["1区", true, 7.1],
  "JEDS": ["3区", false, 2.3],
  "SST": ["3区", false, 2.3],
  // 可靠性 / 辐射
  "TNS": ["2区", false, 2.4],
  "TDMR": ["3区", false, 2.7],
  "TSM": ["3区", false, 2.5],
  "TR": ["2区", false, 4.0],
  // EDA / 体系结构
  "TCAD": ["3区", false, 3.6],
  "TVLSI": ["2区", false, 3.2],
  "TODAES": ["4区", false, 2.8],
  "TC": ["2区", false, 4.9],
  "TPDS": ["2区", true, 5.9],
  "TRETS": ["3区", false, 3.0],
  "TECS": ["3区", false, 3.6],
  "JETC": ["3区", false, 2.3],
  "JETTA": ["4区", false, 1.2],
  "TACO": ["3区", false, 1.8],
  "CAL": ["", false, 1.6],
  "Integration": ["3区", false, 2.6],
  "JSA": ["2区", false, 3.7],
  "FMSD": ["4区", false, 0.9],
  "CAD": ["2区", false, 3.7],
  "Proc. IEEE": ["1区", true, 30.9],
  "SCIS": ["2区", false, 5.0],
  "JCST": ["3区", false, 1.7],
  "FCS": ["3区", false, 2.7],
  "FITEE": ["3区", false, 2.4],
  "TCSVT": ["1区", false, 10.8],
  "Microelectron. J.": ["3区", false, 2.2],
  "AICSP": ["4区", false, 1.6],
  "IET CDT": ["4区", false, 1.5],
  "AEÜ": ["4区", false, 2.5],
  "EL": ["4区", false, 1.0],
  "IEEE Access": ["4区", false, 4.2],
  "D&T": ["4区", false, 2.0],
  "NSR": ["1区", true, 18.1],
  "半导体学报": ["3区", false, 5.1],
};

/** 中国电子学会分级（2026 版 T1/T2/T3），只列核实过的 */
export const CSEE_TABLE: Record<string, string> = {
  电子学报: "T1",
  通信学报: "T1",
  计算机学报: "T1",
  JSSC: "T1",
  "TCAS-I": "T1",
  TED: "T1",
  TPEL: "T1",
  "Nat. Electron.": "T1",
  "Nat. Photonics": "T1",
  "Nat. Mach. Intell.": "T1",
  SCIS: "T1",
  电子与信息学报: "T2",
  半导体学报: "T2",
  "中国科学:信息": "T2",
  "SSC-L": "T2",
  "TCAS-II": "T2",
  TNS: "T2",
  TDMR: "T2",
  TSM: "T2",
  TODAES: "T2",
  AEÜ: "T2",
  微电子学: "T3",
  固体电子学研究与进展: "T3",
};


/** 中国电子学会分级：优先按 ISSN 匹配官方全量表，其次按简称表，最后按官全名 */
export function cseeOf(abbr: string, name?: string, issn?: string): string | undefined {
  if (issn) {
    const hit = CSEE_BY_ISSN.get(issn);
    if (hit) return hit.level;
  }
  const byAbbr = CSEE_TABLE[abbr];
  if (byAbbr) return byAbbr;
  if (!name) return undefined;
  const exact = CSEE_BY_NAME.get(name.toLowerCase());
  return exact;
}

export const CSEE_BY_NAME: Map<string, string> = new Map(
  CSEE_ENTRIES.map((e) => [e.name.toLowerCase(), e.level])
);

/** 学院原文点名条目（集成电路学科单列的 NSREC 等） */
export const NAMED_IN_DOC = new Set<string>(["NSREC"]);

/** 学院原文「一类目录」13 本 */
export const TIER1_ABBRS = new Set<string>([
  "Nature",
  "Science",
  "Cell",
  "Nat. Mater.",
  "Nat. Electron.",
  "Nat. Phys.",
  "Nat. Nanotechnol.",
  "Nat. Photonics",
  "Nat. Commun.",
  "Sci. Adv.",
  "Nat. Comput. Sci.",
  "Nat. Mach. Intell.",
  "Sci. Robot.",
]);

/** 需要标注「本院方向最相关」的条目 */
export const CORE_ABBRS = new Set<string>([
  "DAC", "ICCAD", "DATE", "ASP-DAC", "ISPD", "GLSVLSI", "ICCD", "ISQED",
  "FPGA", "FPL", "FCCM", "FPT", "CODES+ISSS", "CASES", "ISLPED", "NOCS", "ASAP",
  "ITC", "ETS", "ATS", "VTS", "ITC-Asia", "IOLTS", "DFTS", "NSREC",
  "TCAD", "TVLSI", "TODAES", "TRETS", "TECS", "JETC", "JETTA", "Integration",
  "TACO", "CAL", "TC", "TPDS", "FMSD", "CAD", "JSA",
  "JSSC", "SSC-L", "TCAS-I", "TCAS-II", "TED", "EDL", "JEDS", "SST",
  "TNS", "TDMR", "TSM", "TR", "TPEL",
  "ISSCC", "VLSI Symp.", "ESSCIRC", "A-SSCC", "CICC", "IEDM", "IRPS",
]);

/** 中文刊与国内主办刊（中科院分区/CCF 目录都不适用） */
export const CN_ABBRS = new Set<string>([
  "电子学报", "中国科学:信息", "电子与信息学报", "通信学报", "计算机学报",
  "软件学报", "计算机研究与发展", "自动化学报", "半导体学报", "国防科技大学学报",
  "微电子学", "固体电子学研究与进展", "集成电路与嵌入式系统",
]);

export interface CatalogInput {
  ccfIndex: Map<string, { abbr: string; name: string; publisher: string; ccf: "A" | "B" | "C"; domain: string; kind: VenueKind }>;
  baseRows: VenueRow[];
}

export interface BuiltCatalog {
  rows: VenueRow[];
  /** 统计：官方核实过的条数 */
  verified: number;
  /** 按 CCF 领域新增的条数 */
  fromCcf: number;
  /** 手工补充、不在 CCF 目录的条数 */
  manual: number;
}

/** 把 CCF 全量、手工条目、分区表合并成一张统一目录 */
export function buildCatalog(input: CatalogInput): BuiltCatalog {
  const { ccfIndex, baseRows } = input;
  const byAbbr = new Map<string, VenueRow>();

  for (const r of baseRows) {
    const ccfHit = ccfIndex.get(r.abbr.toUpperCase());
    const cas = CAS_TABLE[r.abbr];
    const row: VenueRow = {
      ...r,
      ccf: r.ccf ?? (ccfHit ? ccfHit.ccf : ""),
      ccfDomain: r.ccfDomain ?? ccfHit?.domain,
      ccfKind: r.kind,
      cas: r.cas !== undefined ? r.cas : cas ? cas[0] : undefined,
      casTop: r.casTop !== undefined ? r.casTop : cas ? cas[1] : undefined,
      impact: r.impact ?? cas?.[2],
      csee: r.csee ?? cseeOf(r.abbr, r.name, r.issn),
      tier1: r.tier1 || TIER1_ABBRS.has(r.abbr),
      namedInDoc: r.namedInDoc || NAMED_IN_DOC.has(r.abbr),
      source: "verified",
    };
    byAbbr.set(row.abbr, row);
  }

  let fromCcf = 0;
  for (const hit of ccfIndex.values()) {
    if (byAbbr.has(hit.abbr)) continue;
    const cas = CAS_TABLE[hit.abbr];
    const fields = DOMAIN_FIELDS[hit.domain] ?? ["综合/交叉"];
    const note =
      (CORE_ABBRS.has(hit.abbr) ? "★本院方向对口。" : "") +
      (DOMAIN_NOTES[hit.domain] ?? "CCF 目录条目。");
    byAbbr.set(hit.abbr, {
      abbr: hit.abbr,
      name: hit.name,
      kind: hit.kind,
      fields: cas ? fields : hit.kind === "会议" ? fields : fields,
      ccf: hit.ccf,
      ccfDomain: hit.domain,
      ccfKind: hit.kind,
      cas: cas ? cas[0] : undefined,
      casTop: cas ? cas[1] : undefined,
      impact: cas ? cas[2] : undefined,
      csee: cseeOf(hit.abbr, hit.name),
      tier1: TIER1_ABBRS.has(hit.abbr),
      namedInDoc: NAMED_IN_DOC.has(hit.abbr),
      note,
      source: "ccf",
    });
    fromCcf += 1;
  }

  const rows = [...byAbbr.values()].sort((a, b) => {
    const t1 = (b.tier1 ? 1 : 0) - (a.tier1 ? 1 : 0);
    if (t1 !== 0) return t1;
    const core = (CORE_ABBRS.has(b.abbr) ? 1 : 0) - (CORE_ABBRS.has(a.abbr) ? 1 : 0);
    if (core !== 0) return core;
    const lv = "ABC".indexOf(a.ccf ?? "") - "ABC".indexOf(b.ccf ?? "");
    if (lv !== 0) return lv;
    return a.abbr.localeCompare(b.abbr);
  });

  const verified = baseRows.length;
  return { rows, verified, fromCcf, manual: verified };
}