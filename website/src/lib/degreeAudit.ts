import type { Achievement, PaperAchievement, PatentAchievement } from "@/store/achievements";
import { venueByKey, PROGRAM_RULES, CONVERSION, type AchievementLevel, type AwardRule, type Venue } from "@/data/degreeAwards";
import type { DegreeLevel, ProgramId } from "@/store/tasks";

// 学位成果认定：把一名学生的成果按他所在学科 / 学位层次的规则，判成
//   「基本要求」+「公开评审某通道」是否达成。
//
// 判定分两层：
//   1. 逐篇定等级（resolveLevel）：一类目录命中最优先；否则按学科规则从 CCF / CCF T1 / 中科院分区推导；
//   2. 逐条比对规则（evaluateRule）：把达标论文折算成等效篇数，再和条款门槛比。

/** 排序：数字越小越高 */
const RANK: Record<AchievementLevel, number> = {
  一类目录: 0,
  "A-1": 1,
  "A-2": 2,
  "A-3": 3,
  "A-4": 4,
  "B-1": 5,
  "B-2": 6,
  "B-3": 7,
  基本目录: 8,
  非目录: 9,
};

export function rankOf(level: AchievementLevel): number {
  return RANK[level];
}

/** 一名学生的成果档案 */
export interface Candidate {
  /** 学生姓名 */
  name: string;
  program: ProgramId;
  degree: DegreeLevel;
}

export interface PaperVerdict {
  paper: PaperAchievement;
  level: AchievementLevel;
  /** 折算后的等效篇数 */
  weight: number;
  /** 本人的身份是否被这条学科规则认可为「本人主笔」 */
  credited: boolean;
  reasons: string[];
}

export interface RuleResult {
  rule: AwardRule;
  satisfied: boolean;
  /** 已达成部分（用于不满时的提示） */
  progress: string;
}

export interface AuditResult {
  candidate: Candidate;
  papers: PaperVerdict[];
  basic: RuleResult[];
  /** 基本要求是否已达成（basic 里任一条满足即可，一般为「或」关系） */
  basicReady: boolean;
  /** 按公开评审分组的结果 */
  publicGroups: { group: string; results: RuleResult[]; ready: boolean }[];
  publicReady: boolean;
  /** 所有可自动判定的规则都达成时才算「可毕业」 */
  ready: boolean;
  /** 待人工确认的事项 */
  manual: string[];
}

/** 某学科把一份目录条目的属性映射成等级 */
function levelFromVenue(program: ProgramId, v: Venue, paper: PaperAchievement): AchievementLevel {
  if (v.tier1) return "一类目录";
  const cas = paper.cas ? Number(paper.cas[0]) : v.cas;
  const casTop = v.casTop || cas === 1;
  if (program === "计算机科学与技术") {
    // A-1：CCF A 且中科院 1 区 Top；A-2：中科院 1 区；B-1：CCF B 以上或 CCF T1；B-2：中科院 2 区
    if (v.ccf === "A" && casTop) return "A-1";
    if (cas === 1) return "A-2";
    if (v.ccf === "A" || v.ccf === "B" || v.tj === "T1" || v.nudtJournal) return "B-1";
    if (cas === 2) return "B-2";
    if (v.ccf === "C" || v.tj === "T2") return "基本目录";
    return "非目录";
  }
  if (program === "集成电路科学与工程") {
    // A-1：CCF A；A-2：中科院 1 区；A-3：电子学会一类（本系统暂无名单，靠手工指定）；A-4：NSREC
    if (v.ccf === "A") return "A-1";
    if (cas === 1) return "A-2";
    if (v.abbr === "NSREC") return "A-4";
    if (v.ccf === "B" || v.tj === "T1" || v.nudtJournal) return "B-1";
    if (v.tj === "T2") return "B-2";
    if (cas === 2) return "B-3";
    if (v.ccf === "C" || v.tj === "T3") return "基本目录";
    return "非目录";
  }
  // 电子信息：只区分 A 类（论文）与一般成果
  if (v.ccf === "A" || v.ccf === "B" || cas !== undefined) return "A-1";
  if (v.tj === "T1" || v.tj === "T2" || v.ccf === "C") return "基本目录";
  return "非目录";
}

/** 逐篇定等级 + 折算 */
export function auditPapers(candidate: Candidate, papers: PaperAchievement[]): PaperVerdict[] {
  const out: PaperVerdict[] = [];
  let coAuthorUsed = false;
  for (const p of papers) {
    const reasons: string[] = [];
    let level: AchievementLevel;
    const v = p.venueKey ? venueByKey.get(p.venueKey) : undefined;
    if (p.level && p.level !== "目录外") {
      level = p.level as AchievementLevel;
      reasons.push(`手动指定等级 ${p.level}`);
    } else if (v) {
      level = levelFromVenue(candidate.program, v, p);
      reasons.push(`按 ${candidate.program} 目录判定为 ${level}`);
    } else {
      level = "非目录";
      reasons.push(p.venueKey ? "目录条目已失效，按目录外处理" : "未从目录中选择刊会名");
    }

    // 身份资格：一作 / 共同一作 / 导师一作本人二作 才算本人成果
    const role = p.authorRole;
    const credited = role === "一作" || role === "共同一作" || role === "导师一作本人二作";
    if (!credited) {
      reasons.push(role === "通讯" ? "本人为通讯作者" : "本人非第一 / 第二作者");
    }

    // 折算
    let weight = 1;
    if (p.bestPaper) {
      weight *= CONVERSION.bestPaperFactor;
      reasons.push(`CCF A/B 会议最佳论文 ×${CONVERSION.bestPaperFactor}`);
    }
    if (p.largeConference) {
      weight *= CONVERSION.largeConferenceFactor;
      reasons.push(`当年录用 ≥${CONVERSION.largeConferenceThreshold} 篇的会议 ×${CONVERSION.largeConferenceFactor}`);
    }
    if (role === "共同一作" && CONVERSION.coFirstOnlyOnce) {
      if (coAuthorUsed && p.coAuthor) {
        weight = Math.min(weight, 0.5);
        reasons.push("共同一作超出「仅限一篇」后按半篇计");
      }
    }
    if (p.coAuthor && CONVERSION.coAuthorOnlyOnce) {
      if (coAuthorUsed) {
        weight = Math.min(weight, 0.5);
        reasons.push("共同作者成果已被他人使用，按半篇计");
      }
      coAuthorUsed = true;
    }
    out.push({ paper: p, level, weight, credited, reasons });
  }
  return out;
}

/** 统计落在某档次的等效篇数 */
function countTier(verdicts: PaperVerdict[], tiers: AchievementLevel[]): number {
  let sum = 0;
  for (const v of verdicts) {
    if (v.credited && tiers.includes(v.level)) sum += v.weight;
  }
  return Math.round(sum * 100) / 100;
}

export function evaluateRule(rule: AwardRule, audited: PaperVerdict[], patents: PatentAchievement[]): RuleResult {
  const need = rule.count ?? 1;
  switch (rule.metric) {
    case "tier1Paper":
    case "tierPaper":
    case "tierPapersMixed": {
      const tiers = rule.tier ? tiersOfRule(rule) : (["一类目录"] as AchievementLevel[]);
      const have = countTier(audited, tiers);
      return {
        rule,
        satisfied: have >= need,
        progress: `${have} / ${need} 篇`,
      };
    }
    case "tierPaperPlusPrize": {
      const tiers = rule.tier ? tiersOfRule(rule) : ([] as AchievementLevel[]);
      const have = countTier(audited, tiers);
      return { rule, satisfied: have >= need, progress: `${have} / ${need} 篇 + 专著 / 奖项（人工确认）` };
    }
    case "anyPaper": {
      const have = audited.filter((v) => v.credited && v.level !== "非目录").reduce((s, v) => s + v.weight, 0);
      const rounded = Math.round(have * 100) / 100;
      return { rule, satisfied: rounded >= need, progress: `${rounded} / ${need} 篇` };
    }
    case "patentAuthorized": {
      const have = patents.filter((p) => p.status === "授权").length;
      return { rule, satisfied: have >= need, progress: `${have} / ${need} 项` };
    }
    case "monograph":
      return { rule, satisfied: false, progress: "需人工确认（系统暂未录入专著）" };
    case "majorProject":
      return { rule, satisfied: false, progress: "需人工确认" };
    default:
      return { rule, satisfied: false, progress: "—" };
  }
}

function tiersOfRule(rule: AwardRule): AchievementLevel[] {
  if (rule.metric === "tier1Paper") return ["一类目录"];
  return RULE_TIERS[rule.tier ?? ""] ?? [];
}

/** 档次 id → 计入的等级（与 data/degreeAwards.ts 的 TierSpec 对应） */
const RULE_TIERS: Record<string, AchievementLevel[]> = {
  tier1: ["一类目录"],
  A: ["一类目录", "A-1", "A-2", "A-3", "A-4"],
  A1: ["A-1"],
  A2: ["A-2"],
  A3: ["A-3"],
  A4: ["A-4"],
  B: ["B-1", "B-2", "B-3"],
  B1: ["B-1"],
  B2: ["B-2"],
  B3: ["B-3"],
  base: ["基本目录"],
  /** 硕士公开评阅①：CCF 推荐目录 / CCF T1·T2 / 学报 —— 目录内任何一档都算 */
  listed: ["一类目录", "A-1", "A-2", "A-3", "A-4", "B-1", "B-2", "B-3", "基本目录"],
};

/** 全量审计 */
export function auditCandidate(
  candidate: Candidate,
  achievements: Achievement[],
  opts: { includeEarly?: boolean } = {},
): AuditResult {
  const mine = achievements.filter((a) => a.owner === candidate.name && a.graduate !== false);
  const papers = auditPapers(candidate, mine.filter((a): a is PaperAchievement => a.category === "论文"));
  const patents = mine.filter((a): a is PatentAchievement => a.category === "专利");

  const rules = PROGRAM_RULES[candidate.program].rules;
  const applicable = opts.includeEarly && candidate.degree === "博士" ? rules.博士提前 : rules[candidate.degree];
  const basicRules = applicable.filter((r) => r.kind === "basic");
  const publicRules = applicable.filter((r) => r.kind === "public");

  const basic = basicRules.map((r) => evaluateRule(r, papers, patents));
  const groups = new Map<string, RuleResult[]>();
  for (const r of publicRules) {
    const list = groups.get(r.group) ?? [];
    list.push(evaluateRule(r, papers, patents));
    groups.set(r.group, list);
  }
  const publicGroups = [...groups.entries()].map(([group, results]) => ({
    group,
    results,
    ready: results.some((r) => r.satisfied),
  }));

  const basicReady = basic.length === 0 || basic.some((r) => r.satisfied);
  const publicReady = publicGroups.length === 0 || publicGroups.some((g) => g.ready);
  const manual: string[] = [];
  if (basicReady && !publicReady) manual.push("公开评审通道均未满足，或需按「重大项目应用」等人工通道认定");

  return {
    candidate,
    papers,
    basic,
    basicReady,
    publicGroups,
    publicReady,
    ready: basicReady && publicReady,
    manual,
  };
}