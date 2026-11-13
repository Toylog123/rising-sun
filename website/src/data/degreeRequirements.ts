import { ccfTjJournals } from "./ccfCatalog";

// 学位成果选刊手册（国防科技大学计算机学院相关学科）
//
// 三份手册：
//   1. cs   — 0812 计算机科学与技术 / 0835 软件工程（学院原文：一类 / 二类(A) / 二类(B) / 基本目录）
//   2. ice  — 1401 集成电路科学与工程（学院原文同上，二类目录多出电子学会分级与 NSREC）
//   3. dz   — 电子信息（学科大类总要求，各学院自定目录；本手册按通用口径给出等级映射）
//
// 数据来源与口径：
//   - 等级依据：学院《学位授予工作参考资料》原文的目录条目（CCF / 中科院分区 / 电子学会分级）
//   - 期刊 ISSN 与刊名：Crossref journals API 逐条核对（2026-11-13）
//   - 影响因子：JCR 近年公布值的近似量级，仅作相对参考
//   - 中科院分区按大类分区书写
//   - 电子信息类的等级映射为本手册的判断，非学院原文

export interface GuideRow {
  /** 期刊 / 会议全称 */
  name: string;
  /** 常用简称 */
  abbr: string;
  /** 类型：期刊 / 会议 */
  kind: "期刊" | "会议";
  /** 检索数据库 */
  db?: string;
  /** 影响因子（约） */
  impact?: string;
  /** 中科院大类分区 */
  cas?: string;
  /** 等级归属（手册判断） */
  level?: string;
  /** 投稿难度 */
  difficulty: string;
  /** 备注 */
  note: string;
}

export interface GuideGroup {
  /** 分组标题 */
  title: string;
  /** 该组定位说明 */
  desc?: string;
  /** 该组条目 */
  rows: GuideRow[];
}

export interface GuideTier {
  /** 梯队名 */
  tier: string;
  /** 该梯队定位 */
  purpose: string;
  /** 条目 */
  items: GuideRow[];
}

export interface RequirementRow {
  /** 学位 */
  degree: string;
  /** 基本要求 */
  basic: string;
  /** 公开评阅 */
  publicReview?: string;
  /** 补充说明 */
  note?: string;
}

export interface VenueGuide {
  /** 学科 id */
  id: string;
  /** 学科代码 */
  code: string;
  /** 学科名称 */
  name: string;
  /** 牵头制定单位 */
  unit: string;
  /** 卡片上的一句话定位 */
  tagline: string;
  /** 免责声明 */
  disclaimer: string;
  /** 整理日期 */
  updatedAt: string;
  /** 毕业要求速览 */
  requirements: RequirementRow[];
  /** 目录分级说明：原文条目如何映射到具体刊物 */
  levelMap: GuideGroup[];
  /** 期刊与会议清单（按等级分组） */
  lists: GuideGroup[];
  /** 本组研究方向对应的投稿梯队 */
  recommendations: GuideTier[];
  /** 口径提示 */
  caveats: string[];
  /** 官方目录（原文全量条目，非本组筛选项） */
  official: OfficialDirectory;
}

const DISCLAIMER =
  "本手册依据学院《学位授予工作参考资料》的目录条目，结合公开检索（CCF 推荐目录、中国电子学会分级目录、中科院分区、JCR 影响因子）整理，供选题投稿参考，非学院原文。成果认定一律以申请学位时学院执行的目录版本为准。";

const UPDATED_AT = "2026-11-13";

// 计算机学科与集成电路学科共用的 CCF 类刊物（EDA / 体系结构主战场）
const CCF_A: GuideRow[] = [
  {
    name: "ACM/IEEE Design Automation Conference",
    abbr: "DAC",
    kind: "会议",
    db: "CCF A",
    level: "A-1",
    difficulty: "难",
    note: "EDA 领域最具影响力的旗舰会议，本组布局、ECO、时序方向的主要目标。CCF A 类会议。",
  },
  {
    name: "IEEE/ACM International Conference on Computer-Aided Design",
    abbr: "ICCAD",
    kind: "会议",
    db: "CCF B",
    level: "B-1",
    difficulty: "难",
    note: "EDA 方法论主战场，物理设计、布局布线、逻辑综合方向的经典投稿点。**CCF 官方目录中 ICCAD 为 B 类会议**（此前误标为 CCF A），计算机学科的 A-1 需要 CCF A 类 + 中科院 1 区 Top，因此 ICCAD 只能算 B-1。",
  },
  {
    name: "IEEE Transactions on Computer-Aided Design of Integrated Circuits and Systems",
    abbr: "TCAD",
    kind: "期刊",
    db: "SCI",
    impact: "~2.7",
    cas: "2 区",
    level: "A-1",
    difficulty: "较难",
    note: "EDA 顶刊。注意：中科院大类分区通常在 2 区，按学院规则它更多走 B-1（CCF A 期刊）而不是 A-1（要求 1 区 Top）。",
  },
  {
    name: "ACM International Conference on Architectural Support for Programming Languages and Operating Systems",
    abbr: "ASPLOS",
    kind: "会议",
    db: "CCF A",
    level: "A-1",
    difficulty: "很难",
    note: "体系结构四大顶会之一（ASPLOS/ISCA/MICRO/HPCA），相关但离 EDA 较远。",
  },
  {
    name: "ACM/IEEE International Symposium on Computer Architecture",
    abbr: "ISCA",
    kind: "会议",
    db: "CCF A",
    level: "A-1",
    difficulty: "很难",
    note: "体系结构顶会，适合加速器 / 存算一体方向。",
  },
  {
    name: "IEEE/ACM International Symposium on Microarchitecture",
    abbr: "MICRO",
    kind: "会议",
    db: "CCF A",
    level: "A-1",
    difficulty: "很难",
    note: "体系结构顶会，偏微架构实现。",
  },
  {
    name: "IEEE International Symposium on High-Performance Computer Architecture",
    abbr: "HPCA",
    kind: "会议",
    db: "CCF A",
    level: "A-1",
    difficulty: "很难",
    note: "体系结构顶会，偏性能与体系结构创新。",
  },
];

const ARCH_B: GuideRow[] = [
  {
    name: "IEEE Transactions on Computers",
    abbr: "TC",
    kind: "期刊",
    db: "SCI",
    impact: "~3.7",
    cas: "2 区",
    level: "B-1",
    difficulty: "较难",
    note: "计算机体系结构老牌刊，CCF A 类期刊、中科院 2 区，属 B 档。",
  },
  {
    name: "IEEE Transactions on Very Large Scale Integration (VLSI) Systems",
    abbr: "TVLSI",
    kind: "期刊",
    db: "SCI",
    impact: "~3.0",
    cas: "2 区",
    level: "B-1",
    difficulty: "较难",
    note: "集成电路与系统方向常投期刊，CCF B 类。EDA 算法类论文可投。",
  },
  {
    name: "ACM Transactions on Design Automation of Electronic Systems",
    abbr: "TODAES",
    kind: "期刊",
    db: "SCI",
    impact: "~2.0",
    cas: "3 区",
    level: "B-1",
    difficulty: "中等",
    note: "EDA 专业期刊，CCF B 类；中科院分区偏低，按规则属 B-1（CCF 类）而不是 B-2（中科院 2 区）。",
  },
  {
    name: "ACM Transactions on Architecture and Code Optimization",
    abbr: "TACO",
    kind: "期刊",
    db: "SCI",
    impact: "~1.8",
    cas: "3 区",
    level: "B-1",
    difficulty: "中等",
    note: "体系结构与编译器优化方向，CCF B 类期刊。",
  },
  {
    name: "IEEE Transactions on Circuits and Systems I: Regular Papers",
    abbr: "TCAS-I",
    kind: "期刊",
    db: "SCI",
    impact: "~5.2",
    cas: "2 区",
    level: "B-1",
    difficulty: "较难",
    note: "模拟/数字电路通用期刊，CCF B 类；做电路与系统设计时常用。",
  },
  {
    name: "Asia and South Pacific Design Automation Conference",
    abbr: "ASP-DAC",
    kind: "会议",
    db: "CCF C",
    level: "B-1",
    difficulty: "中等",
    note: "EDA 区域性重要会议，CCF C 类但行业认可度高，可作为博士 B-1 成果的稳妥选择。",
  },
  {
    name: "ACM International Symposium on Field-Programmable Gate Arrays",
    abbr: "FPGA",
    kind: "会议",
    db: "CCF B",
    level: "B-1",
    difficulty: "难",
    note: "FPGA 领域顶会，CCF B 类；做 FPGA 加速、可重构计算方向的首选。",
  },
  {
    name: "IEEE International Conference on Field Programmable Logic and Applications",
    abbr: "FPL",
    kind: "会议",
    db: "CCF C",
    level: "B-1",
    difficulty: "中等",
    note: "FPGA 主要会议之一，CCF C 类但为该子领域广泛认可；按学院规则 CCF C 不在 B-1，需按中科院或电子学会口径确认，稳妥起见视为 B-2 候选。",
  },
  {
    name: "IEEE International Conference on Field Programmable Custom Computing Machines",
    abbr: "FCCM",
    kind: "会议",
    db: "CCF C",
    level: "B-2",
    difficulty: "中等",
    note: "FPGA 定制计算方向，CCF C 类，一般落在 B-2（视学院目录认定）。",
  },
  {
    name: "International Conference on Computer Design",
    abbr: "ICCD",
    kind: "会议",
    db: "CCF B",
    level: "B-1",
    difficulty: "中等",
    note: "计算机设计与 VLSI 方向，CCF B 类会议。",
  },
  {
    name: "ACM Great Lakes Symposium on VLSI",
    abbr: "GLSVLSI",
    kind: "会议",
    db: "CCF C",
    level: "B-2",
    difficulty: "较易",
    note: "VLSI 方向快节奏会议，CCF C 类，适合阶段性成果发表。",
  },
  {
    name: "IEEE International Test Conference",
    abbr: "ITC",
    kind: "会议",
    db: "CCF B",
    level: "B-1",
    difficulty: "中等",
    note: "测试与可靠性方向，CCF B 类；SEU / 故障诊断方向的对口会议。",
  },
];

const ICECE_JOURNALS: GuideRow[] = [
  {
    name: "IEEE Journal of Solid-State Circuits",
    abbr: "JSSC",
    kind: "期刊",
    db: "SCI",
    impact: "~5.6",
    cas: "1 区 Top",
    level: "A-2",
    difficulty: "很难",
    note: "集成电路设计 No.1 期刊。**必须流片实测**，EDA 算法类论文不匹配；适合有 tape-out 条件的方向。",
  },
  {
    name: "IEEE Transactions on Electron Devices",
    abbr: "TED",
    kind: "期刊",
    db: "SCI",
    impact: "~3.2",
    cas: "2 区",
    level: "B-3",
    difficulty: "较难",
    note: "器件物理与建模方向，中科院 2 区，属 B 档。",
  },
  {
    name: "IEEE Transactions on Power Electronics",
    abbr: "TPEL",
    kind: "期刊",
    db: "SCI",
    impact: "~6.7",
    cas: "1 区 Top",
    level: "A-2",
    difficulty: "难",
    note: "电力电子方向，中科院 1 区 Top，属 A 档；与数字 EDA 关联较弱。",
  },
  {
    name: "IEEE Transactions on Nuclear Science",
    abbr: "TNS",
    kind: "期刊",
    db: "SCI",
    impact: "~1.8",
    cas: "3 区",
    level: "B-3",
    difficulty: "中等",
    note: "核与空间辐射效应方向期刊，与 NSREC 会议配套；SEU / 单粒子效应研究的主要发表渠道。",
  },
  {
    name: "IEEE Transactions on Device and Materials Reliability",
    abbr: "TDMR",
    kind: "期刊",
    db: "SCI",
    impact: "~2.3",
    cas: "3 区",
    level: "B-3",
    difficulty: "中等",
    note: "器件与材料可靠性，SEU 机理与加固方向可用。",
  },
];

const DZ_JOURNALS: GuideRow[] = [
  {
    name: "IEEE Transactions on Very Large Scale Integration (VLSI) Systems",
    abbr: "TVLSI",
    kind: "期刊",
    db: "SCI",
    impact: "~3.0",
    cas: "2 区",
    level: "A 类（判断）",
    difficulty: "较难",
    note: "集成电路与系统方向核心期刊：CCF B 类 + 中科院 2 区。在电子信息的「专业学院目录」口径下大概率属 A 类，具体以学科目录为准。",
  },
  {
    name: "IEEE Transactions on Computer-Aided Design of Integrated Circuits and Systems",
    abbr: "TCAD",
    kind: "期刊",
    db: "SCI",
    impact: "~2.7",
    cas: "2 区",
    level: "A 类（判断）",
    difficulty: "较难",
    note: "EDA 顶刊，CCF A 类期刊 + 中科院 2 区，是电子信息技术方向最对口的 A 类候选。",
  },
  {
    name: "IEEE Transactions on Nuclear Science",
    abbr: "TNS",
    kind: "期刊",
    db: "SCI",
    impact: "~1.8",
    cas: "3 区",
    level: "A 类（判断）",
    difficulty: "中等",
    note: "辐射效应领域的主流期刊，与 NSREC 会议配套；在本方向属学科列名期刊。",
  },
  {
    name: "IEEE Transactions on Circuits and Systems I: Regular Papers",
    abbr: "TCAS-I",
    kind: "期刊",
    db: "SCI",
    impact: "~5.2",
    cas: "2 区",
    level: "A 类（判断）",
    difficulty: "较难",
    note: "电路与系统方向通用期刊，CCF B 类 + 中科院 2 区。",
  },
  {
    name: "IEEE Transactions on Electron Devices",
    abbr: "TED",
    kind: "期刊",
    db: "SCI",
    impact: "~3.2",
    cas: "2 区",
    level: "A 类（判断）",
    difficulty: "较难",
    note: "器件方向主流期刊，中科院 2 区。",
  },
  {
    name: "IEEE Journal of Solid-State Circuits",
    abbr: "JSSC",
    kind: "期刊",
    db: "SCI",
    impact: "~5.6",
    cas: "1 区 Top",
    level: "A 类（判断）",
    difficulty: "很难",
    note: "集成电路设计 No.1，需流片实测；覆盖面窄，本组多数方向不匹配。",
  },
  {
    name: "IEEE Transactions on Power Electronics",
    abbr: "TPEL",
    kind: "期刊",
    db: "SCI",
    impact: "~6.7",
    cas: "1 区 Top",
    level: "A 类（判断）",
    difficulty: "难",
    note: "电力电子方向，与数字设计关联弱。",
  },
];


/** 官方目录条目（一类目录 / CCF T1-T3） */
export interface OfficialJournal {
  /** 序号 */
  index: number;
  /** 中文名称 */
  cn: string;
  /** 英文名称 */
  en: string;
  /** 收录 / 检索 */
  indexDb?: string;
  /** 备注 */
  note?: string;
}

export interface OfficialDirectory {
  /** 一类目录（紧密相关成果范围目录一类，13 本顶刊） */
  tier1?: { title: string; desc: string; rows: OfficialJournal[] }[];
  /** CCF《计算领域高质量科技期刊分级目录》(2025) T1/T2/T3 全量 */
  ccfTj?: { title: string; desc: string; rows: OfficialJournal[] }[];
  /** CCF《推荐国际学术会议和期刊目录》全量（按学科领域分组，仅列 A/B 类） */
  ccfRank?: { title: string; desc: string; rows: GuideRow[] }[];
}

/** 一类目录：Nature / Science / Cell 系 13 本（原文附件，ISSN 已于 2026-11-13 经 Crossref 核对） */
export const TIER1_JOURNALS: OfficialJournal[] = [
  { index: 1, cn: "Nature", en: "Nature", indexDb: "SCI", note: "ISSN 0028-0836" },
  { index: 2, cn: "Science", en: "Science", indexDb: "SCI", note: "ISSN 0036-8075" },
  { index: 3, cn: "Cell", en: "Cell", indexDb: "SCI", note: "ISSN 0092-8674" },
  { index: 4, cn: "Nature Materials", en: "Nature Materials", indexDb: "SCI", note: "ISSN 1476-1122" },
  { index: 5, cn: "Nature Electronics", en: "Nature Electronics", indexDb: "SCI", note: "ISSN 2520-1131" },
  { index: 6, cn: "Nature Physics", en: "Nature Physics", indexDb: "SCI", note: "ISSN 1745-2473" },
  { index: 7, cn: "Nature Nanotechnology", en: "Nature Nanotechnology", indexDb: "SCI", note: "ISSN 1748-3387" },
  { index: 8, cn: "Nature Photonics", en: "Nature Photonics", indexDb: "SCI", note: "ISSN 1749-4885" },
  { index: 9, cn: "Nature Communications", en: "Nature Communications", indexDb: "SCI/EI", note: "ISSN 2041-1723" },
  { index: 10, cn: "Science Advances", en: "Science Advances", indexDb: "SCI", note: "ISSN 2375-2548" },
  { index: 11, cn: "Nature Computational Science", en: "Nature Computational Science", indexDb: "SCI", note: "ISSN 2662-8457；原文误拼为 Nature Computional Science" },
  { index: 12, cn: "Nature Machine Intelligence", en: "Nature Machine Intelligence", indexDb: "SCI", note: "ISSN 2522-5839；原文印作 8588-5839，经 Crossref 核对为笔误" },
  { index: 13, cn: "Science Robotics", en: "Science Robotics", indexDb: "SCI", note: "ISSN 2470-9476" },
];

export const venueGuides: VenueGuide[] = [
  {
    id: "cs",
    code: "0812 / 0835",
    name: "计算机科学与技术、软件工程",
    unit: "计算机学院",
    tagline: "本组主干方向（AI4EDA、布局、ECO）的对口学科",
    disclaimer: DISCLAIMER,
    updatedAt: UPDATED_AT,
    requirements: [
      {
        degree: "博士",
        basic:
          "本人一作、以国防科技大学为第一单位，在紧密相关成果范围目录发表论文 ≥ 2 篇。评阅方式为双盲评阅。",
        publicReview:
          "满足基本要求后，全部成果符合下列之一：① 一类目录 1 篇（一作或通信，含共同作者）；② 二类(A) 2 篇，其中 ≥1 篇为 A-1；③ 二类(A) A-1 单篇 + 预审 A「优秀」+ 分委会推荐；④ 二类(B) 4 篇，其中 ≥2 篇为 B-1；⑤ 二类(B) B-1 两篇 + 专著（前 2）/ 省部级奖（前 3）；⑥ 重大项目应用 + 公示无异议 + 导师与预审专家组推荐。",
      },
      {
        degree: "博士（提前）",
        basic:
          "满足基本要求的基础上，本人一作（含共同作者）、以国防科大为第一单位，在一类目录发表 1 篇及以上。",
        publicReview: "提前申请学位以此为唯一门槛，仍需满足基本要求。",
      },
      {
        degree: "硕士",
        basic:
          "至少 1 篇本人一作或二作（导师 / 协助导师一作）、以国防科大为第一单位，在正式出版期刊或会议论文集全文发表（含在线发表）或录用；或以国防科大为第一完成单位 + 授权发明专利 1 项（前 2）/ 专著 1 部（前 3）。",
        publicReview:
          "满足基本要求后，全部成果符合下列之一：① CCF 推荐目录 / CCF 高质量科技期刊 T1、T2 / 《国防科技大学学报》/ IEEE JointCloud 1 篇（一作或二作）；② 中科院大类 3 区及以上 1 篇。",
      },
    ],
    levelMap: [
      {
        title: "二类（A）目录",
        desc: "A-1 与 A-2 是并列满足条件，A-1 更难但对硕士的「1 篇公开评阅」更直接。",
        rows: [
          {
            name: "A-1",
            abbr: "CCF A 类",
            kind: "会议",
            level: "同时满足",
            difficulty: "很难",
            note: "CCF 推荐 A 类会议或期刊，且中科院大类 1 区 Top 期刊。两者同时满足才算 A-1；单独是 CCF A 会议但期刊分区不达标的，按 B-1 计。",
          },
          {
            name: "A-2",
            abbr: "中科院 1 区",
            kind: "期刊",
            level: "并列满足",
            difficulty: "难",
            note: "中科院期刊分区表大类分区 1 区期刊，不要求是否为 CCF A 类。",
          },
        ],
      },
      {
        title: "二类（B）目录",
        desc: "B-1 覆盖 CCF 类目录，是多数人的主战场；B-2 是纯中科院分区门槛。",
        rows: [
          {
            name: "B-1",
            abbr: "CCF B 以上",
            kind: "期刊",
            level: "并列满足",
            difficulty: "较难",
            note: "CCF 推荐 B 类以上（含）会议或期刊，或 CCF《计算领域高质量科技期刊分级目录》T1 类期刊。",
          },
          {
            name: "B-2",
            abbr: "中科院 2 区",
            kind: "期刊",
            level: "并列满足",
            difficulty: "中等",
            note: "中科院期刊分区表大类分区 2 区以上（含）期刊。",
          },
        ],
      },
    ],
    lists: [
      {
        title: "A-1 / A 档：CCF A 类会议与期刊",
        desc: "本组最现实的 A-1 目标只有 DAC（CCF A 会议）；ICCAD 按 CCF 官方目录是 B 类会议。注意期刊侧的 TCAD 虽为 CCF A 期刊，但中科院分区多在 2 区，不满足 A-1 的「1 区 Top」要求。",
        rows: CCF_A,
      },
      {
        title: "B-1 / B 档：CCF B 类与 CCF C 类中认可度高的会议期刊",
        desc: "博士按 B 档路径（4 篇 B 中 ≥2 篇 B-1）时，TVLSI、TODAES、ICCD、ASP-DAC 是主力；硕士的「CCF 目录 1 篇」仅要求 CCF 推荐目录，C 类同样可用。",
        rows: ARCH_B,
      },
      {
        title: "基本目录：CSCD / SCI / EI",
        desc: "仅用于满足「基本要求」的 2 篇论文门槛，不能用于公开评阅。",
        rows: [
          {
            name: "中国科学引文数据库（CSCD）来源期刊",
            abbr: "CSCD",
            kind: "期刊",
            db: "CSCD",
            level: "基本目录",
            difficulty: "中等",
            note: "不含扩展版。中文核心期刊里被 CSCD 收录的那一批。",
          },
          {
            name: "SCI 源刊",
            abbr: "SCI",
            kind: "期刊",
            db: "SCI",
            level: "基本目录",
            difficulty: "较难",
            note: "只要在 SCI 收录范围内即可满足基本要求，不区分分区。",
          },
          {
            name: "EI 检索论文",
            abbr: "EI",
            kind: "会议",
            db: "EI",
            level: "基本目录",
            difficulty: "中等",
            note: "EI 检索的会议或期刊论文均可计入基本要求。",
          },
          {
            name: "计算机研究与发展",
            abbr: "CRAD",
            kind: "期刊",
            db: "CSCD/EI",
            level: "基本目录",
            difficulty: "中等",
            note: "中文顶级计算机期刊，CSCD + EI 收录，国内认可度高。",
          },
          {
            name: "电子学报",
            abbr: "—",
            kind: "期刊",
            db: "CSCD/EI",
            level: "基本目录",
            difficulty: "中等",
            note: "中文电子信息领域权威期刊，CSCD + EI 收录；EDA / 集成电路方向可直接投。",
          },
          {
            name: "软件学报",
            abbr: "—",
            kind: "期刊",
            db: "CSCD/EI",
            level: "基本目录",
            difficulty: "中等",
            note: "软件工程方向中文顶刊；0835 软件工程学科对口。",
          },
          {
            name: "计算机学报",
            abbr: "—",
            kind: "期刊",
            db: "CSCD/EI",
            level: "基本目录",
            difficulty: "中等",
            note: "中文计算机领域最高水平期刊之一。",
          },
          {
            name: "中国科学：信息科学",
            abbr: "—",
            kind: "期刊",
            db: "CSCD/EI",
            level: "基本目录",
            difficulty: "较难",
            note: "中文旗舰期刊，CSCD + EI，可用于基本要求。",
          },
        ],
      },
    ],
    recommendations: [
      {
        tier: "第一梯队（冲刺 A 档）",
        purpose: "EDA 方向最对口、又够得上 A-1 的目标",
        items: [
          CCF_A[0],
          CCF_A[1],
          {
            name: "Nature Computational Science",
            abbr: "Nat. Comput. Sci.",
            kind: "期刊",
            db: "SCI",
            impact: "~11",
            cas: "1 区 Top",
            level: "一类目录 / A-2",
            difficulty: "难",
            note: "一类目录内期刊，同时满足 A-2（中科院 1 区）；EDA 算法类选题可尝试，需有强实验支撑。",
          },
          {
            name: "Nature Machine Intelligence",
            abbr: "Nat. Mach. Intell.",
            kind: "期刊",
            db: "SCI",
            impact: "~29.8",
            cas: "1 区 Top",
            level: "一类目录 / A-2",
            difficulty: "极难",
            note: "一类目录内期刊（ISSN 2522-5839）；AI for EDA 方向对口，但录用门槛极高。",
          },
        ],
      },
      {
        tier: "第二梯队（B-1 主力）",
        purpose: "博士走 B 档路径时的高性价比选择",
        items: [
          ARCH_B[1],
          ARCH_B[2],
          ARCH_B[0],
          ARCH_B[5],
          ARCH_B[6],
        ],
      },
      {
        tier: "第三梯队（B-2 / 基本目录）",
        purpose: "满足基本要求、或补齐 B-2 门槛",
        items: [
          ARCH_B[8],
          ARCH_B[9],
          ARCH_B[10],
          ARCH_B[11],
        ],
      },
    ],
    caveats: [
      "A-1 需要「CCF A 类」与「中科院 1 区 Top」同时满足。DAC 是 CCF A 类会议，按学院规则可直接算 A-1；TCAD 是 CCF A 期刊但中科院多为 2 区，按 B-1 计更稳妥；ICCAD 在 CCF 官方目录中为 B 类会议，同样按 B-1 计。",
      "折算规则：CCF A/B 类会议最佳论文（该届 ≤3 篇）按 1.5 篇；A/B 类会议当年录用 >500 篇按 0.7 篇（最佳论文不适用）；共同一作原则上仅用一篇。",
      "共同作者成果仅限一名学位申请人使用，且需其他共同作者同意；协助导师须列入学位论文封面。",
      "预警名单：论文发表期间刊物被列入中科院《国际期刊预警名单》的，不能作为紧密相关成果；投稿前务必核对最新版名单。",
      "本手册的「难度」为经验判断，「影响因子」为 JCR 近年近似值，均仅供选题参考，不作认定依据。",
    ],
    official: {
      tier1: [{
        title: "一类目录（紧密相关成果范围目录 一类，13 本）",
        desc: "学院原文附件列出的 13 本顶刊。博士公开评阅第 ① 条与「提前申请学位」都要求在一类目录发表 1 篇。ISSN 已逐条核对。",
        rows: TIER1_JOURNALS,
      }],
      ccfTj: [{
        title: "CCF《计算领域高质量科技期刊分级目录》(2025)",
        desc: "CCF 官方全量：T1 类 19 本、T2 类 22 本、T3 类 27 本，按拼音 / 英文名称排序。原文中「CCF 高质量科技期刊 T1、T2」即引用此目录。",
        rows: ccfTjJournals.map((j) => ({ index: j.index, cn: j.cn, en: j.en, indexDb: j.lang + " · " + j.cnNo + " · " + j.tier, note: j.host })),
      }],
      ccfRank: [{
        title: "CCF 推荐目录 A 类（与本质方向直接相关）",
        desc: "CCF《推荐国际学术会议和期刊目录》全量共 644 条（A/B/C × 期刊/会议 × 10 个领域），页面体积考虑，此处只列与本组方向相关的 A/B 两类；完整目录可在 CCF 官网按领域查阅。",
        rows: [...CCF_A, ...ARCH_B.filter((r) => r.kind === "期刊").slice(0, 4), ...ARCH_B.filter((r) => r.kind === "会议")],
      }],
    },
  },

  {
    id: "ice",
    code: "1401",
    name: "集成电路科学与工程",
    unit: "计算机学院",
    tagline: "面向 FPGA、电路与系统、可靠性加固的学科口径",
    disclaimer: DISCLAIMER,
    updatedAt: UPDATED_AT,
    requirements: [
      {
        degree: "博士",
        basic:
          "本人一作、以国防科大第一单位，在本学科紧密相关成果范围目录发表论文 ≥ 2 篇。评阅方式为双盲评阅。",
        publicReview:
          "满足基本要求后，全部成果符合下列之一：① 一类目录 1 篇（一作或通信，含共同作者）；② 二类(A) 2 篇；③ 二类(A) A-1 单篇 + 预审 A「优秀」+ 分委会推荐；④ 二类(B) 4 篇；⑤ 二类(B) 3 篇 + 专著（前 2）/ 省部级奖（前 3）；⑥ 重大项目应用 + 联合导师组联名推荐。",
      },
      {
        degree: "博士（提前）",
        basic:
          "满足基本要求的基础上，本人一作（含共同作者）、以国防科大为第一单位，在目录（一类目录）发表 1 篇及以上。",
        note: "原文此条写的是「计算机科学与技术、软件工程学科紧密相关成果范围目录（一类目录）」，与本学科目录不一致，实际执行请以学院解释为准。",
      },
      {
        degree: "硕士",
        basic:
          "至少 1 篇本人一作或二作（导师 / 协助导师一作）、以国防科大为第一单位，在正式出版期刊或会议论文集全文发表（含在线发表）或录用；或以国防科大为第一完成单位 + 授权发明专利 1 项（前 2）/ 专著 1 部（前 3）。",
        publicReview:
          "满足基本要求后，全部成果符合下列之一：① CCF 推荐目录 / CCF 高质量科技期刊 T1、T2 / 中国电子学会《电子技术、通信技术领域高质量科技期刊分级目录》T1、T2 / 《国防科技大学学报》1 篇；② 中科院大类 3 区及以上 1 篇。",
      },
    ],
    levelMap: [
      {
        title: "二类（A）目录：四条并列路径",
        desc: "集成电路比计算机多出 A-3（电子学会一类）和 A-4（NSREC）两条专属口径。",
        rows: [
          {
            name: "A-1",
            abbr: "CCF A 类",
            kind: "会议",
            level: "并列满足",
            difficulty: "很难",
            note: "CCF《推荐国际学术会议和期刊目录》A 类会议或期刊。注意本学科此条**不要求**中科院 1 区 Top。",
          },
          {
            name: "A-2",
            abbr: "中科院 1 区",
            kind: "期刊",
            level: "并列满足",
            difficulty: "难",
            note: "中科院期刊分区表大类分区 1 区期刊。",
          },
          {
            name: "A-3",
            abbr: "电子学会一类",
            kind: "期刊",
            db: "电子学会",
            level: "并列满足",
            difficulty: "难",
            note: "中国电子学会推荐的一类（含）以上期刊或会议。",
          },
          {
            name: "A-4",
            abbr: "NSREC",
            kind: "会议",
            db: "IEEE/EI",
            level: "并列满足",
            difficulty: "较难",
            note: "IEEE Nuclear & Space Radiation Effects Conference，核与空间辐射效应领域顶会。**本组 SEU 方向的关键入口**。",
          },
        ],
      },
      {
        title: "二类（B）目录：三条并列路径",
        desc: "B-1 覆盖 CCF 与 CCF T1；B-2 覆盖电子学会与电子通信 T1；B-3 是纯中科院分区门槛。",
        rows: [
          {
            name: "B-1",
            abbr: "CCF B 以上",
            kind: "期刊",
            level: "并列满足",
            difficulty: "较难",
            note: "CCF 推荐 B 类以上（含）会议或期刊、CCF《计算领域高质量科技期刊分级目录》T1 类期刊。",
          },
          {
            name: "B-2",
            abbr: "电子学会二类",
            kind: "期刊",
            db: "电子学会",
            level: "并列满足",
            difficulty: "中等",
            note: "中国电子学会推荐的二类（含）以上期刊或会议、《电子技术、通信技术领域高质量科技期刊分级目录》T1 类期刊。",
          },
          {
            name: "B-3",
            abbr: "中科院 2 区",
            kind: "期刊",
            level: "并列满足",
            difficulty: "中等",
            note: "中科院期刊分区表大类分区 2 区以上（含）期刊。",
          },
        ],
      },
    ],
    lists: [
      {
        title: "A 档：CCF A 类 + 电子学会一类 + NSREC",
        desc: "本学科 A-1 只需 CCF A 类，不要求中科院 1 区 Top，因此 DAC 直接可用；ICCAD 为 CCF B 类会议，属 B-1；NSREC 是本方向独有的 A-4 通道。",
        rows: [
          ...CCF_A,
          {
            name: "IEEE Nuclear & Space Radiation Effects Conference",
            abbr: "NSREC",
            kind: "会议",
            db: "IEEE/EI",
            level: "A-4",
            difficulty: "较难",
            note: "辐射效应领域顶会，每年 7 月举办；SEU / 单粒子效应加固方向的必投会议，A-4 专属通道。",
          },
        ],
      },
      {
        title: "A-2 / B-3：中科院 1 区与 2 区期刊",
        desc: "按中科院分区即可计入，不需 CCF 类身份。JSSC 需流片，多数算法方向不匹配。",
        rows: [...ICECE_JOURNALS, ...ARCH_B.filter((r) => r.kind === "期刊")],
      },
      {
        title: "B-2：电子学会推荐与电子通信 T1",
        desc: "集成电路学科的专属低门槛通道，中文期刊与国内会议多落在这里。",
        rows: [
          {
            name: "电子学报",
            abbr: "—",
            kind: "期刊",
            db: "CSCD/EI",
            level: "B-2",
            difficulty: "中等",
            note: "中国电子学会主办的中文权威期刊，通常落在电子学会二类或电子通信 T1 内。",
          },
          {
            name: "半导体学报（Journal of Semiconductors）",
            abbr: "JOS",
            kind: "期刊",
            db: "SCI",
            level: "B-2",
            difficulty: "中等",
            note: "半导体器件与工艺方向中文期刊，英文版被 SCI 收录。",
          },
          {
            name: "微电子学",
            abbr: "—",
            kind: "期刊",
            db: "CSCD",
            level: "B-2",
            difficulty: "较易",
            note: "中文核心期刊，成本低、周期可控。",
          },
          {
            name: "中国科学：信息科学",
            abbr: "—",
            kind: "期刊",
            db: "CSCD/EI",
            level: "B-2",
            difficulty: "较难",
            note: "中文旗舰期刊，CSCD + EI 收录。",
          },
        ],
      },
      {
        title: "基本目录：CSCD / SCI / EI",
        desc: "仅用于满足「基本要求」的 2 篇论文门槛。",
        rows: [
          {
            name: "中国科学引文数据库（CSCD）来源期刊",
            abbr: "CSCD",
            kind: "期刊",
            db: "CSCD",
            level: "基本目录",
            difficulty: "中等",
            note: "不含扩展版。",
          },
          {
            name: "SCI 源刊",
            abbr: "SCI",
            kind: "期刊",
            db: "SCI",
            level: "基本目录",
            difficulty: "较难",
            note: "只要在 SCI 收录范围内即可满足基本要求，不区分分区。",
          },
          {
            name: "EI 检索论文",
            abbr: "EI",
            kind: "会议",
            db: "EI",
            level: "基本目录",
            difficulty: "中等",
            note: "EI 检索的会议或期刊论文均可计入基本要求。",
          },
        ],
      },
    ],
    recommendations: [
      {
        tier: "第一梯队（冲 A 档）",
        purpose: "本组方向最容易摸到 A 档的三条路",
        items: [
          CCF_A[0],
          CCF_A[1],
          {
            name: "IEEE Nuclear & Space Radiation Effects Conference",
            abbr: "NSREC",
            kind: "会议",
            db: "IEEE/EI",
            level: "A-4",
            difficulty: "较难",
            note: "A-4 专属通道，SEU 方向最对口；博士 B 档走到 A 档的捷径。",
          },
        ],
      },
      {
        tier: "第二梯队（A-2 / B-1 主力）",
        purpose: "按中科院 1 区或 CCF B 类稳定产出",
        items: [
          ICECE_JOURNALS[0],
          ARCH_B[1],
          ARCH_B[2],
          ARCH_B[3],
          ARCH_B[0],
        ],
      },
      {
        tier: "第三梯队（B-2 / B-3）",
        purpose: "中文期刊与 2 区期刊，成本低、周期可控",
        items: [
          ICECE_JOURNALS[1],
          ICECE_JOURNALS[2],
          ICECE_JOURNALS[3],
          ICECE_JOURNALS[4],
          ARCH_B[9],
        ],
      },
    ],
    caveats: [
      "本学科 A-1 只要求「CCF 推荐 A 类会议或期刊」，**不要求**中科院 1 区 Top，比计算机学科的 A-1 门槛低，DAC / ICCAD 可直接算 A-1。",
      "A-4（NSREC）是本学科独有的通道，辐射效应方向的最优解；配套期刊是 IEEE Transactions on Nuclear Science。",
      "博士公开评阅第 5 条是「二类(B) 3 篇 + 专著 / 省部级奖」，比计算机学科的「B-1 两篇 + 专著奖」更宽，但要求 B 档总数 3 篇。",
      "提前申请学位条款照录了「计算机科学与技术、软件工程学科」目录名称，与本学科不一致，以学院解释为准。",
      "折算规则、共同作者限制、预警名单与计算机学科相同，见页面上方通用说明。",
    ],
    official: {
      tier1: [{
        title: "一类目录（紧密相关成果范围目录 一类，13 本）",
        desc: "与计算机学科基本相同的一类目录 13 本顶刊，博士公开评阅第 ① 条要求在此发表 1 篇。",
        rows: TIER1_JOURNALS,
      }],
      ccfTj: [{
        title: "CCF《计算领域高质量科技期刊分级目录》(2025)",
        desc: "CCF 官方全量：T1 类 19 本、T2 类 22 本、T3 类 27 本，按拼音 / 英文名称排序。原文中「CCF 高质量科技期刊 T1、T2」即引用此目录。",
        rows: ccfTjJournals.map((j) => ({ index: j.index, cn: j.cn, en: j.en, indexDb: j.lang + " · " + j.cnNo + " · " + j.tier, note: j.host })),
      }],
      ccfRank: [{
        title: "C 类及以上会议（含 ASP-DAC / FPL / ICCD，本学科 B-1 起算）",
        desc: "本学科 A-1 只需 CCF A 类（DAC、TCAD）；B-1 需 CCF B 类以上，ICCAD、FPGA、DATE、ICCD、ITC、TVLSI、TODAES 均可计入。",
        rows: [...CCF_A, ...ARCH_B.filter((r) => r.kind === "会议")],
      }],
    },
  },

  {
    id: "dz",
    code: "电子信息",
    name: "电子信息",
    unit: "电子科学学院",
    tagline: "学科大类总要求，成果目录由各专业学院自定",
    disclaimer: DISCLAIMER,
    updatedAt: UPDATED_AT,
    requirements: [
      {
        degree: "博士",
        basic:
          "基于学位论文（实践成果）工作，申请时须取得紧密相关成果 ≥ 2 项，其中工程新技术研究类学位论文须包含 A 类成果 ≥ 1 项。成果类型 A~G 见下方说明。",
        publicReview:
          "智能科学学院、系统工程学院分委会的学位论文（实践成果）一律双盲评阅；其他学院的分委会一般双盲，达到相应学院规定的一级学科公开评阅要求的，可申请公开评阅。",
      },
      {
        degree: "博士（提前）",
        basic: "达到专业学院规定的相关一级学科博士学位论文提前申请学位要求的，可提前申请学位。",
        publicReview: "提前申请以专业学院规定为准。",
      },
      {
        degree: "硕士",
        basic:
          "基于学位论文（实践成果）工作，申请时须取得下列成果类型中至少 1 项（A~F 见下方说明）。",
        publicReview:
          "系统工程学院、气象海洋学院分委会一律双盲评阅；前沿交叉学科学院、智能科学学院、电子对抗学院分委会为「公开 + 双盲」评阅；其他学院分委会为公开评阅。",
      },
    ],
    levelMap: [
      {
        title: "博士：成果类型 A~G（取 2 项以上，且工程新技术类须含 A 类 1 项）",
        desc: "注意这里的「A 类」指成果类型 A（论文），不是期刊等级。",
        rows: [
          {
            name: "A. 学术论文",
            abbr: "—",
            kind: "期刊",
            level: "A 类成果",
            difficulty: "—",
            note: "本人一作、以国防科大第一单位，在专业学院规定的相关一级学科紧密相关成果范围目录指定刊物上发表（含网络在线发表）。工程新技术研究类学位论文必须含此项。",
          },
          {
            name: "B. 学术专著",
            abbr: "—",
            kind: "期刊",
            level: "计 1 项",
            difficulty: "—",
            note: "作为主要作者（排名前三）出版。",
          },
          {
            name: "C. 授权发明专利",
            abbr: "—",
            kind: "期刊",
            level: "计 1 项",
            difficulty: "—",
            note: "从事国防关键性技术研究，本人为第一发明人或第二发明人（导师为第一发明人），以国防科大为第一单位。",
          },
          {
            name: "D. 科技奖励",
            abbr: "—",
            kind: "期刊",
            level: "计 1 项",
            difficulty: "—",
            note: "作为完成人获国家级、军队（省部）级或国家一级学会科技奖励。",
          },
          {
            name: "E. 国际 / 国家 / 行业标准",
            abbr: "—",
            kind: "期刊",
            level: "计 1 项",
            difficulty: "—",
            note: "作为主要完成人（排名前三），需业务主管部门出具证明。",
          },
          {
            name: "F. 成果鉴定 / 应用证明",
            abbr: "—",
            kind: "期刊",
            level: "计 1 项",
            difficulty: "—",
            note: "作为主要完成人（排名前三），通过鉴定或取得师级（含）以上业务主管部门出具的应用证明。",
          },
          {
            name: "G. 咨询报告",
            abbr: "—",
            kind: "期刊",
            level: "计 1 项",
            difficulty: "—",
            note: "撰写电子信息领域咨询报告，获国务院部委或军委机关部门（含）以上首长批准或肯定批示，或被国家、军队重大工程项目采用。",
          },
        ],
      },
      {
        title: "硕士：成果类型 A~F（取 1 项即可）",
        desc: "硕士的论文要求比博士宽：公开出版的学术刊物（含学术会议）即可，不限定在成果目录内。",
        rows: [
          {
            name: "A. 学术论文",
            abbr: "—",
            kind: "期刊",
            level: "计 1 项",
            difficulty: "—",
            note: "本人一作或二作（导师一作），在公开出版的学术刊物（含学术会议）上发表（含网络在线发表）。",
          },
          {
            name: "B. 授权发明专利",
            abbr: "—",
            kind: "期刊",
            level: "计 1 项",
            difficulty: "—",
            note: "从事国防关键性技术研究，本人第一发明人或第二发明人（导师为第一发明人）。",
          },
          {
            name: "C. 科技奖励",
            abbr: "—",
            kind: "期刊",
            level: "计 1 项",
            difficulty: "—",
            note: "作为完成人获国家级、军队（省部）级或国家一级学会科技奖励。",
          },
          {
            name: "D. 标准",
            abbr: "—",
            kind: "期刊",
            level: "计 1 项",
            difficulty: "—",
            note: "作为主要完成人（排名前五）形成国际、国家或行业标准。",
          },
          {
            name: "E. 成果鉴定 / 应用证明",
            abbr: "—",
            kind: "期刊",
            level: "计 1 项",
            difficulty: "—",
            note: "作为主要完成人（排名前五）完成科技成果鉴定或取得师级（含）以上应用证明。",
          },
          {
            name: "F. 咨询报告",
            abbr: "—",
            kind: "期刊",
            level: "计 1 项",
            difficulty: "—",
            note: "撰写电子信息领域咨询报告，获军级机关部门（含）以上首长批准或肯定批示，或被国家、军队重大工程项目采用。",
          },
        ],
      },
    ],
    lists: [
      {
        title: "A 类成果候选：本方向对口的期刊",
        desc: "**重要**：电子信息大类的附件（各学院一级学科紧密相关成果范围目录）未公开在总要求里，下列等级为本手册依据刊物的 CCF / 中科院分区 / 学科影响力做出的判断，**不是学院原文**。投稿前必须以你所在专业学院公布的目录为准。",
        rows: DZ_JOURNALS,
      },
      {
        title: "本方向对口的会议",
        desc: "电子信息大类博士要求「期刊」投稿，但硕士的论文成果含学术会议；会议也是积累 A 类成果的主要途径。",
        rows: [
          CCF_A[0],
          CCF_A[1],
          {
            name: "IEEE Nuclear & Space Radiation Effects Conference",
            abbr: "NSREC",
            kind: "会议",
            db: "IEEE/EI",
            level: "对口",
            difficulty: "较难",
            note: "辐射效应方向顶会，SEU 加固方向的最优会议。",
          },
          ARCH_B[7],
          ARCH_B[11],
          {
            name: "Asia and South Pacific Design Automation Conference",
            abbr: "ASP-DAC",
            kind: "会议",
            db: "CCF C",
            level: "对口",
            difficulty: "中等",
            note: "EDA 区域性重要会议，适合阶段性成果。",
          },
        ],
      },
      {
        title: "补充成果通道（非论文）",
        desc: "电子的博士要求是「成果类型 A~G 取 2 项」，不一定全靠论文。",
        rows: [
          {
            name: "授权发明专利",
            abbr: "专利",
            kind: "期刊",
            level: "C 类成果",
            difficulty: "中等",
            note: "第一发明人，或第二发明人（导师为第一发明人）；以国防科大为第一单位。周期通常 2~3 年，需提前布局。",
          },
          {
            name: "科技进步奖 / 学会科技奖",
            abbr: "奖励",
            kind: "期刊",
            level: "D 类成果",
            difficulty: "难",
            note: "作为完成人获国家级、军队（省部）级或国家一级学会科技奖励，需团队项目支撑。",
          },
          {
            name: "成果鉴定 / 应用证明",
            abbr: "鉴定",
            kind: "期刊",
            level: "E/F 类成果",
            difficulty: "中等",
            note: "师级（含）以上业务主管部门出具，或项目单位应用证明；有工程背景的课题更易取得。",
          },
        ],
      },
    ],
    recommendations: [
      {
        tier: "第一梯队（本组方向最顺手）",
        purpose: "EDA / 加固方向的 A 类成果候选",
        items: [DZ_JOURNALS[1], DZ_JOURNALS[0], DZ_JOURNALS[2]],
      },
      {
        tier: "第二梯队（体系结构与电路）",
        purpose: "体系结构、电路与系统方向的对口刊会",
        items: [CCF_A[0], CCF_A[1], DZ_JOURNALS[3], DZ_JOURNALS[4]],
      },
      {
        tier: "第三梯队（补充通道）",
        purpose: "专利、鉴定、应用证明等非论文成果",
        items: [],
      },
    ],
    caveats: [
      "**电子信息大类的附件（各一级学科紧密相关成果范围目录）未在总要求中公开**，本手册的 A 类判断为依据刊物地位的推断，不是学院原文。请以你所在专业学院（电子科学学院、前沿交叉学科学院、智能科学学院、电子对抗学院、系统工程学院、气象海洋学院）公布的目录为准。",
      "博士的「A 类成果至少 1 项」指的是成果类型 A（学术论文），不是期刊等级。工程新技术研究类学位论文必须含论文成果。",
      "博士评阅方式取决于挂靠的学位评定分委员会：智能科学学院、系统工程学院一律双盲。",
      "硕士的论文要求宽松（公开出版的学术刊物含会议），但硕士评阅方式在部分学院是「公开 + 双盲」。",
      "以上成果均须将国防科技大学列为完成单位。",
    ],
    official: {
      tier1: [{
        title: "一类目录（紧密相关成果范围目录 一类，13 本）",
        desc: "电子信息大类总要求未公开附件；此处列出一类目录 13 本顶刊，作为最高等级成果的参照。",
        rows: TIER1_JOURNALS,
      }],
      ccfTj: [{
        title: "CCF《计算领域高质量科技期刊分级目录》(2025)",
        desc: "CCF 官方全量：T1 类 19 本、T2 类 22 本、T3 类 27 本，按拼音 / 英文名称排序。原文中「CCF 高质量科技期刊 T1、T2」即引用此目录。",
        rows: ccfTjJournals.map((j) => ({ index: j.index, cn: j.cn, en: j.en, indexDb: j.lang + " · " + j.cnNo + " · " + j.tier, note: j.host })),
      }],
      ccfRank: [{
        title: "CCF 推荐目录（A / B 类）",
        desc: "本方向相关的 CCF A / B 类会议期刊，可按学院目录的 A/B 等级映射。",
        rows: [...CCF_A, ...ARCH_B, ...ICECE_JOURNALS],
      }],
    },
  },
];

/** 兼容旧引用 */
export const venueGuide = venueGuides[1];