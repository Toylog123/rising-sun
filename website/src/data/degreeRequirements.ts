// 学位授予与评阅要求（国防科技大学计算机学院）
// 涉及两个学科：0812 计算机科学与技术 / 0835 软件工程；1401 集成电路科学与工程
// 文本依据学院公布的《学位授予工作参考资料》原文整理，编号与措辞保持一致。

export interface CatalogEntry {
  /** 条目编号，如 A-1 */
  code: string;
  /** 条目内容 */
  text: string;
  /** 补充说明（原文分列的「推荐理由」等） */
  extra?: string;
}

export interface JournalRow {
  /** 序号 */
  idx: number;
  /** 期刊名 */
  name: string;
  /** 刊号 ISSN */
  issn: string;
  /** 检索收录情况 */
  indexing: string;
  /** 推荐理由 */
  reason: string;
  /** 与原文不一致时的提示（原文笔误等） */
  note?: string;
}

export interface ReviewChannel {
  /** 通道序号 */
  no: string;
  /** 条件描述 */
  text: string;
}

export interface GuideRow {
  /** 名称 */
  name: string;
  /** 简称 */
  abbr: string;
  /** 数据库 */
  db?: string;
  /** 影响因子（约） */
  if?: string;
  /** 中科院分区 */
  cas?: string;
  /** 投稿难度 */
  difficulty: string;
  /** 备注 */
  note: string;
}

export interface GuideGroup {
  /** 分组标题 */
  title: string;
  /** 该组条目 */
  rows: GuideRow[];
}

export interface GuideTier {
  /** 梯队名，如「第一梯队」 */
  tier: string;
  /** 该梯队定位说明 */
  purpose: string;
  /** 条目 */
  items: GuideRow[];
}

export interface VenueGuide {
  /** 说明：本手册为二次整理的辅助参考，非学院原文 */
  disclaimer: string;
  /** 生成/整理日期 */
  updatedAt: string;
  /** 毕业要求速览表 */
  quickView: {
    degree: string;
    basic: string;
    publicReview: string;
  }[];
  /** 一类目录补充检索信息 */
  tier1Extra: GuideRow[];
  /** 二类(A) A-1 展开 */
  tierA1: GuideGroup[];
  /** 二类(B) B-1 展开 */
  tierB1: GuideGroup[];
  /** 基本目录与中文期刊路径 */
  basicCatalog: {
    text: string;
    domestic: GuideRow[];
  };
  /** 结合研究方向的推荐清单 */
  recommendations: GuideTier[];
  /** 关键说明与口径提示 */
  caveats: string[];
}

export interface Discipline {
  id: string;
  /** 学科代码 */
  code: string;
  /** 学科名称 */
  name: string;
  /** 牵头制定单位 */
  unit: string;
  /** 适用对象 */
  audience: string;
  doctoral: {
    basic: string;
    publicReview: ReviewChannel[];
    earlyApply: string;
    /** 原文疑似笔误提示 */
    earlyApplyNote?: string;
  };
  master: {
    basic: string[];
    publicReview: ReviewChannel[];
  };
  notes: string[];
  catalog: {
    tier1: JournalRow[];
    tierA: CatalogEntry[];
    tierB: CatalogEntry[];
    basicCatalog: string[];
    remarks: string[];
  };
}

const TIER1: JournalRow[] = [
  { idx: 1, name: "Nature", issn: "0028-0836", indexing: "SCI", reason: "国际公认综合类 TOP 期刊" },
  { idx: 2, name: "Science", issn: "0036-8075", indexing: "SCI", reason: "国际公认综合类 TOP 期刊" },
  { idx: 3, name: "Cell", issn: "0092-8674", indexing: "SCI", reason: "国际公认综合类 TOP 期刊" },
  { idx: 4, name: "Nature Materials", issn: "1476-1122", indexing: "SCI", reason: "国际公认综合类 TOP 期刊" },
  { idx: 5, name: "Nature Electronics", issn: "2520-1131", indexing: "SCI", reason: "国际公认综合类 TOP 期刊" },
  { idx: 6, name: "Nature Physics", issn: "1745-2473", indexing: "SCI", reason: "国际公认综合类 TOP 期刊" },
  { idx: 7, name: "Nature Nanotechnology", issn: "1748-3387", indexing: "SCI", reason: "国际公认综合类 TOP 期刊" },
  { idx: 8, name: "Nature Photonics", issn: "1749-4885", indexing: "SCI", reason: "国际公认综合类 TOP 期刊" },
  { idx: 9, name: "Science Robotics", issn: "2470-9476", indexing: "SCI", reason: "国际公认综合类 TOP 期刊" },
  { idx: 10, name: "Nature Communications", issn: "2041-1723", indexing: "SCI", reason: "国际公认综合类 TOP 期刊" },
  { idx: 11, name: "Science Advances", issn: "2375-2548", indexing: "SCI", reason: "国际公认综合类 TOP 期刊" },
  {
    idx: 12,
    name: "Nature Computational Science",
    issn: "2662-8457",
    indexing: "SCI",
    reason: "国际公认计算机科学类 TOP 期刊",
    note: "原文写作「Nature Computional Science」，刊名拼写已更正",
  },
  {
    idx: 13,
    name: "Nature Machine Intelligence",
    issn: "8588-5839",
    indexing: "SCI",
    reason: "国际公认人工智能类 TOP 期刊",
    note: "原文刊号印为 8588-5839，与该刊实际 ISSN 2522-5839 不符，此处保留原文并提示",
  },
];

const TIER_A_CS: CatalogEntry[] = [
  {
    code: "A-1",
    text: "CCF《中国计算机学会推荐国际学术会议和期刊目录》推荐 A 类会议或期刊，中科院期刊分区表大类分区 1 区 Top 期刊",
  },
  { code: "A-2", text: "中科院期刊分区表大类分区 1 区期刊" },
];

const TIER_B_CS: CatalogEntry[] = [
  {
    code: "B-1",
    text: "CCF《中国计算机学会推荐国际学术会议和期刊目录》推荐 B 类以上（含）会议或期刊、CCF《计算领域高质量科技期刊分级目录》T1 类期刊",
  },
  { code: "B-2", text: "中科院期刊分区表大类分区 2 区以上（含）期刊" },
];

const TIER_A_ICE: CatalogEntry[] = [
  { code: "A-1", text: "CCF《中国计算机学会推荐国际学术会议和期刊目录》推荐 A 类会议或期刊" },
  { code: "A-2", text: "中科院期刊分区表大类分区 1 区期刊" },
  { code: "A-3", text: "中国电子学会推荐的一类（含）以上期刊或会议" },
  {
    code: "A-4",
    text: "IEEE Nuclear & Space Radiation Effects Conference（NSREC）/ IEEE、EI",
    extra: "核与空间辐射效应会议，辐射效应领域顶会",
  },
];

const TIER_B_ICE: CatalogEntry[] = [
  {
    code: "B-1",
    text: "CCF《中国计算机学会推荐国际学术会议和期刊目录》推荐 B 类以上（含）会议或期刊、CCF《计算领域高质量科技期刊分级目录》T1 类期刊",
  },
  {
    code: "B-2",
    text: "中国电子学会推荐的二类（含）以上期刊或会议、《电子技术、通信技术领域高质量科技期刊分级目录》T1 类期刊",
  },
  { code: "B-3", text: "中科院期刊分区表大类分区 2 区以上（含）期刊" },
];

const COMMON_REMARKS = [
  "学术论文须与学位论文或实践成果紧密相关。",
  "刊物被列入中科院《国际期刊预警名单》期间，发表的学术论文不能作为紧密相关成果。",
  "有关学术机构推荐/分级目录以及各类检索数据库，根据官方发布情况动态调整。",
];

export const venueGuide: VenueGuide = {
  disclaimer:
    "本手册为依据学院《学位授予工作参考资料》与公开检索（CCF 目录、中国电子学会分级目录、中科院分区、JCR 影响因子）二次整理的辅助参考，非学院原文。正式申请时请以官方最新目录为准。",
  updatedAt: "2026-11-13",
  quickView: [
    {
      degree: "博士",
      basic:
        "本人一作、以国防科大为第一单位，在「紧密相关成果目录」发表论文 ≥2 篇（双盲评阅）",
      publicReview:
        "满足基本要求外，再符合下列之一：一类目录 1 篇；二类(A) 2 篇；二类(A) A-1 条 1 篇（需预审优秀 + 分委会推荐）；二类(B) 4 篇；二类(B) 3 篇 + 专著/省部级奖；重大项目应用 + 导师组联名推荐",
    },
    {
      degree: "硕士",
      basic:
        "至少 1 篇本人一作或二作（导师一作）、以国防科大为第一单位，正式期刊/会议全文发表或录用；或授权发明专利 1 项（排名前 2）/ 专著 1 部（排名前 3）",
      publicReview:
        "满足基本要求外，再符合下列之一：CCF 目录 / CCF T1、T2 / 电子学会 T1、T2 / 《国防科技大学学报》1 篇；或中科院大类 3 区及以上 1 篇",
    },
  ],
  tier1Extra: [
    { name: "Nature", abbr: "—", db: "SCI", if: "~50", cas: "1区 Top", difficulty: "极难", note: "综合顶刊，纯集成电路论文极少见" },
    { name: "Science", abbr: "—", db: "SCI", if: "~44", cas: "1区 Top", difficulty: "极难", note: "同上" },
    { name: "Nature Materials", abbr: "—", db: "SCI", if: "~41", cas: "1区 Top", difficulty: "极难", note: "器件 / 材料方向" },
    { name: "Nature Electronics", abbr: "—", db: "SCI", if: "~33", cas: "1区 Top", difficulty: "极难", note: "电子器件 / 电路领域最对口顶刊" },
    { name: "Nature Physics", abbr: "—", db: "SCI", if: "~19", cas: "1区 Top", difficulty: "极难", note: "偏物理" },
    { name: "Nature Nanotechnology", abbr: "—", db: "SCI", if: "~38", cas: "1区 Top", difficulty: "极难", note: "纳米器件" },
    { name: "Nature Photonics", abbr: "—", db: "SCI", if: "~35", cas: "1区 Top", difficulty: "极难", note: "光子 / 光电子" },
    { name: "Science Robotics", abbr: "—", db: "SCI", if: "~25", cas: "1区 Top", difficulty: "极难", note: "机器人" },
    { name: "Nature Communications", abbr: "—", db: "SCI", if: "~14", cas: "1区 Top", difficulty: "难", note: "综合 OA，工程类相对可投" },
    { name: "Science Advances", abbr: "—", db: "SCI", if: "~13", cas: "1区 Top", difficulty: "难", note: "综合 OA" },
    { name: "Cell", abbr: "—", db: "SCI", if: "~45", cas: "1区 Top", difficulty: "极难", note: "生物医学，与集成电路几乎无关" },
    { name: "Nature Computational Science", abbr: "—", db: "SCI", if: "~11", cas: "1区 Top", difficulty: "难", note: "计算科学，EDA 算法可尝试" },
    {
      name: "Nature Machine Intelligence",
      abbr: "—",
      db: "SCI",
      if: "~29.8",
      cas: "1区 Top",
      difficulty: "极难",
      note: "AI×硬件方向对口（LLM for EDA）",
    },
  ],
  tierA1: [
    {
      title: "A-1：CCF 推荐 A 类会议或期刊（体系结构方向最对口）",
      rows: [
        { name: "IEEE Trans. on Computer-Aided Design of Integrated Circuits and Systems", abbr: "TCAD", db: "SCI/EI", difficulty: "难", note: "EDA 顶刊，ECO / 物理设计最对口" },
        { name: "IEEE Transactions on Computers", abbr: "TC", db: "SCI/EI", difficulty: "难", note: "计算机体系结构" },
        { name: "ACM Trans. on Computer Systems / Storage", abbr: "TOCS/TOS", db: "SCI/EI", difficulty: "难", note: "系统 / 存储" },
        { name: "Int'l Symposium on Computer Architecture", abbr: "ISCA", db: "EI", difficulty: "极难", note: "体系结构顶会" },
        { name: "Int'l Symposium on Microarchitecture", abbr: "MICRO", db: "EI", difficulty: "极难", note: "微架构顶会" },
        { name: "High-Performance Computer Architecture", abbr: "HPCA", db: "EI", difficulty: "极难", note: "高性能架构" },
        { name: "Architectural Support for Programming Languages & OS", abbr: "ASPLOS", db: "EI", difficulty: "极难", note: "软硬件协同" },
        { name: "Design Automation Conference", abbr: "DAC", db: "EI", difficulty: "难", note: "EDA 顶会，最对口" },
      ],
    },
    {
      title: "A-2：中科院大类 1 区期刊（集成电路相关典型代表）",
      rows: [
        { name: "IEEE Journal of Solid-State Circuits", abbr: "JSSC", db: "SCI/EI", if: "≈5.6", cas: "1区 Top", difficulty: "极难", note: "集成电路流片设计领域公认 No.1，但要求有实测芯片，门槛高" },
        { name: "IEEE Trans. on Circuits and Systems I", abbr: "TCAS-I", db: "SCI/EI", cas: "1区", difficulty: "难", note: "电路与系统" },
        { name: "IEEE Trans. on Electron Devices", abbr: "TED", db: "SCI/EI", cas: "1区", difficulty: "难", note: "器件方向" },
        { name: "IEEE Trans. on Power Electronics", abbr: "TPEL", db: "SCI/EI", cas: "1区", difficulty: "难", note: "功率电子方向" },
      ],
    },
    {
      title: "A-3：中国电子学会推荐的一类（含）以上期刊 / 会议",
      rows: [
        { name: "电子学会分级目录 T1 类（48 种）中与集成电路相关的部分", abbr: "—", difficulty: "难", note: "含 IEEE JSSC、IEEE TCAS-I、IEEE Electron Device Letters、Nature Electronics、Nature Photonics、IEEE TED 等" },
      ],
    },
    {
      title: "A-4：IEEE NSREC（核与空间辐射效应会议）",
      rows: [
        { name: "IEEE Nuclear & Space Radiation Effects Conference", abbr: "NSREC", db: "IEEE/EI", difficulty: "难", note: "辐射效应领域顶会，仅适用于抗辐照集成电路方向，与常规 EDA / FPGA 方向关联较弱" },
      ],
    },
  ],
  tierB1: [
    {
      title: "B-1：CCF B 类会议 / 期刊（体系结构、EDA 方向，投稿主力）",
      rows: [
        { name: "Int'l Conference on Computer-Aided Design", abbr: "ICCAD", db: "EI", difficulty: "难", note: "EDA 核心会议，ECO / 时序最对口" },
        { name: "Design, Automation & Test in Europe", abbr: "DATE", db: "EI", difficulty: "难", note: "EDA 综合会议" },
        { name: "ACM/SIGDA Int'l Symposium on FPGA", abbr: "FPGA", db: "EI", difficulty: "中", note: "FPGA 方向顶会，最对口" },
        { name: "Int'l Conference on Computer Design", abbr: "ICCD", db: "EI", difficulty: "中", note: "计算机设计" },
        { name: "Int'l Test Conference", abbr: "ITC", db: "EI", difficulty: "中", note: "测试" },
        { name: "IEEE Trans. on VLSI Systems", abbr: "TVLSI", db: "SCI/EI", difficulty: "中", note: "VLSI 设计" },
        { name: "ACM Trans. on Design Automation of Electronic Systems", abbr: "TODAES", db: "SCI/EI", difficulty: "中", note: "EDA 期刊" },
        { name: "ACM Trans. on Embedded Computing Systems", abbr: "TECS", db: "SCI/EI", difficulty: "中", note: "嵌入式" },
        { name: "ACM Trans. on Reconfigurable Technology & Systems", abbr: "TRETS", db: "SCI/EI", difficulty: "较易", note: "可重构计算" },
      ],
    },
    {
      title: "CCF C 类会议（集成电路方向，性价比高）",
      rows: [
        { name: "Int'l Conference on Field-Programmable Logic and Applications", abbr: "FPL", difficulty: "中", note: "FPGA 应用" },
        { name: "IEEE Symposium on Field-Programmable Custom Computing Machines", abbr: "FCCM", difficulty: "中", note: "FPGA 定制计算" },
        { name: "Asia & South Pacific Design Automation Conference", abbr: "ASP-DAC", difficulty: "中", note: "亚太 EDA" },
        { name: "Great Lakes Symposium on VLSI", abbr: "GLSVLSI", difficulty: "较易", note: "VLSI" },
      ],
    },
  ],
  basicCatalog: {
    text: "基本目录要求相对宽松：CSCD 来源期刊（不含扩展版）、SCI 源刊、或已被 EI 检索的论文均可。这是硕士最基础的达标路径，也是博士「凑够 2 篇」的兜底。",
    domestic: [
      { name: "电子学报", abbr: "—", db: "CSCD/EI", difficulty: "中", note: "CCF 中文 A + 电子学会 T1 + EI/CSCD，质量与认可度兼顾的国产顶刊，一作即可达标" },
      { name: "中国科学：信息科学", abbr: "—", db: "CSCD/EI", difficulty: "中", note: "国产顶刊" },
      { name: "通信学报", abbr: "—", db: "CSCD/EI", difficulty: "中", note: "成本低、周期可控" },
      { name: "电子与信息学报", abbr: "—", db: "CSCD/EI", difficulty: "中", note: "成本低、周期可控" },
      { name: "半导体学报 (Journal of Semiconductors)", abbr: "—", db: "CSCD/EI", difficulty: "中", note: "器件 / 工艺方向" },
      { name: "微电子学", abbr: "—", db: "CSCD", difficulty: "较易", note: "T3" },
    ],
  },
  recommendations: [
    {
      tier: "第一梯队：冲刺 A 类 / 对应博士公开评阅",
      purpose: "命中即高价值，对应「二类(A)」通道",
      items: [
        { name: "DAC / ICCAD", abbr: "DAC / ICCAD", db: "CCF-A / CCF-B", difficulty: "难", note: "RSECO / FAECO 的时序 ECO 是 EDA 核心议题，DAC / ICCAD 是主战场" },
        { name: "FPGA 会议", abbr: "FPGA", db: "CCF-B", difficulty: "中", note: "PACE 的 FPGA 架构创新直接对口" },
        { name: "TCAD", abbr: "TCAD", db: "CCF-A 期刊", difficulty: "难", note: "ECO 框架、物理设计自动化最权威期刊" },
        { name: "Nature Machine Intelligence", abbr: "NMI", db: "1区 Top", difficulty: "极难", note: "PreCex 的 LLM 辅助调试若做成方法学突破可冲刺" },
      ],
    },
    {
      tier: "第二梯队：主力投稿（难度适中，性价比最高）",
      purpose: "积累产出、稳定命中「基本目录」及以上",
      items: [
        { name: "DATE", abbr: "DATE", db: "CCF-B", difficulty: "难", note: "EDA 综合，接受面广，各环节都可投" },
        { name: "ICCD / ASP-DAC / GLSVLSI", abbr: "—", db: "CCF-B/C", difficulty: "中", note: "EDA / 架构，录用率相对友好" },
        { name: "TVLSI / TODAES / TRETS", abbr: "—", db: "CCF-B 期刊", difficulty: "中", note: "VLSI / EDA / 可重构，期刊可积累，周期可控" },
        { name: "FPL / FCCM", abbr: "—", db: "CCF-C", difficulty: "中", note: "FPGA 方向确定性高" },
      ],
    },
    {
      tier: "第三梯队：保底 / 快速达标（硕士友好）",
      purpose: "最短路径满足硕士基本要求",
      items: [
        { name: "电子学报 / 中国科学：信息科学", abbr: "—", db: "CSCD+EI+电子学会T1", difficulty: "中", note: "国产顶刊，一作即可达标" },
        { name: "IEEE Access / MDPI Electronics 等", abbr: "—", db: "SCI/EI", difficulty: "易", note: "兜底，但注意国际期刊预警名单风险" },
      ],
    },
  ],
  caveats: [
    "目录是「引用式」而非「枚举式」。一类目录列了 13 本具体期刊，但二类(A)/(B)/基本目录都是引用 CCF、中科院分区、电子学会分级等外部目录；外部目录会动态调整（CCF 已更新至第七版，2026-01 发布），申请学位时以当年版本为准。",
    "折算规则需注意：CCF A/B 类会议最佳论文（该届 ≤3 篇）按 1.5 篇算；A/B 类会议当年录用 >500 篇按 0.7 篇算（最佳论文不适用此标准）；共同第一作者原则上仅限用一篇；同一共同作者成果仅限一人申请使用。",
    "影响因子为近年公布值，仅作相对参考，具体以中科院《期刊引用报告》最新版为准。投稿前务必核对目标期刊是否在预警名单内（预警期发表不能作紧密相关成果）。",
    "关于「IEEE JSSC」：它是集成电路设计领域 No.1 期刊（IF≈5.6，中科院 1 区 Top，电子学会 T1、中科院 1 区均覆盖，但 CCF 体系未列入），但必须流片实测，适合有芯片 tape-out 条件的方向，EDA 算法类论文不匹配。",
  ],
};

export const disciplines: Discipline[] = [
  {
    id: "cs",
    code: "0812 / 0835",
    name: "计算机科学与技术、软件工程",
    unit: "计算机学院",
    audience: "博士、硕士",
    doctoral: {
      basic:
        "本人作为第一作者、以国防科技大学为第一单位，在计算机科学与技术、软件工程学科紧密相关成果范围目录（见附件）上发表与学位论文紧密相关的学术论文 2 篇及以上。评阅方式采取双盲评阅。",
      publicReview: [
        {
          no: "1",
          text: "本人作为第一作者或者通信作者（均含共同作者）、以国防科技大学为第一完成单位，在计算机科学与技术、软件工程学科紧密相关成果范围目录（一类目录）发表论文 1 篇（含）以上；",
        },
        {
          no: "2",
          text: "以第一作者在「二类（A）目录」A-1 条目的期刊或会议发表 1 篇学术论文，若该论文对学院相关学科建设有突出贡献，且博士论文预审评价为 A、结论为「优秀」，经系所业务主官或学院本方向学位评定分委员会委员推荐，并在学位申请人申请学位前一季度提请学位评定分委员会审议，经审议通过后，可以申请公开评阅；",
        },
        {
          no: "3",
          text: "以第一作者在「二类（A）目录」中的期刊或会议中发表学术论文 2 篇，其中有不少于 1 篇为发表在目录中 A-1 条目的期刊或会议；",
        },
        {
          no: "4",
          text: "以第一作者在「二类（B）目录」的期刊或会议中发表学术论文 4 篇，其中有不少于 2 篇为发表在目录中 B-1 条目的期刊或会议；",
        },
        {
          no: "5",
          text: "以第一作者在「二类（B）目录」B-1 条目中的期刊或会议中发表学术论文 2 篇，且满足以下条件之一：（1）正式出版学术专著 1 部（含）以上（本人排名前 2）；（2）获省部级教学科研成果奖 1 项（含）以上（本人排名前 3）。",
        },
        {
          no: "6",
          text: "与本人学位论文紧密相关的研究成果在国家、军队（省部级）重大项目（任务）中得到应用，做出重要贡献。在该学位论文成果及学位论文经学院和相关项目单位公示（不少于七天）无异议后，经学生申请、导师推荐、学位论文预审专家组推荐，可在申请学位前一季度提请学位评定分委员会审议，经审议后确定评阅方式。",
        },
      ],
      earlyApply:
        "本人作为第一作者（含共同作者）、以国防科技大学为第一单位，在计算机科学与技术、软件工程学科紧密相关成果范围目录（一类目录）发表论文 1 篇（含）以上。",
    },
    master: {
      basic: [
        "学位申请人至少提供 1 篇本人作为第一作者或第二作者（导师或协助导师为第一作者）、以国防科技大学为第一单位，在正式出版的学术期刊或会议论文集上全文发表（含网络在线发表）或录用的学术论文；",
        "或以国防科技大学为第一完成单位，且满足以下条件之一：① 已获授权发明专利 1 个（含）以上（本人排名前 2）；② 正式出版学术专著 1 部（含）以上（本人排名前 3）。",
      ],
      publicReview: [
        {
          no: "1",
          text: "本人作为第一作者或第二作者（导师或协助导师为第一作者，含共同作者）、以国防科技大学为第一单位，在 CCF《中国计算机学会推荐国际学术会议和期刊目录》，或 CCF《计算领域高质量科技期刊分级目录》T1、T2 类期刊，或《国防科技大学学报》，或 The IEEE International Conference on Joint Cloud Computing 发表学术论文 1 篇。",
        },
        {
          no: "2",
          text: "本人作为第一作者或第二作者（导师或协助导师为第一作者，含共同作者）、以国防科技大学为第一单位，在中科院期刊分区表大类分区 3 区及以上期刊发表学术论文 1 篇。",
        },
      ],
    },
    notes: [
      "博士学位申请（含申请学位和申请公开评阅）中，所使用的紧密相关成果均须符合申请学位时基本目录中对于文章发表状态和检索状态的要求；",
      "博士、硕士学位申请中，紧密相关成果认定以申请学位时相关目录版本为准；",
      "博士、硕士学位申请中，共同作者的文章仅限一名学位申请人申请国防科技大学学位使用，并需获得其他所有共同作者同意；以共同第一作者身份发表的学术论文原则上仅限使用一篇；",
      "紧密相关成果发表在 CCF 推荐的国际 A、B 类会议，且获得会议最佳论文奖励（该届会议最佳论文不超过 3 篇）；或获评 CCF 推荐 A 类期刊、中科院一区 TOP 期刊封面文章、亮点文章的，按 1.5 篇折算；",
      "紧密相关成果若发表在 CCF 推荐的国际 A、B 类会议中，该会议当年录用篇数超过 500 篇（含），按 0.7 篇折算，会议最佳论文不适用此标准；",
      "文中所涉及的协助导师须列入学位论文封面。",
    ],
    catalog: {
      tier1: TIER1,
      tierA: TIER_A_CS,
      tierB: TIER_B_CS,
      basicCatalog: [
        "中国科学引文数据库（CSCD）来源期刊（不含扩展版），SCI 源刊，或者已被 EI 检索的学术论文。",
      ],
      remarks: COMMON_REMARKS,
    },
  },
  {
    id: "ice",
    code: "1401",
    name: "集成电路科学与工程",
    unit: "计算机学院",
    audience: "博士、硕士",
    doctoral: {
      basic:
        "本人作为第一作者、以国防科技大学为第一单位，在集成电路科学与工程学科紧密相关成果范围目录（见附件）上发表与学位论文紧密相关的学术论文 2 篇及以上。评阅方式采取双盲评阅。",
      publicReview: [
        {
          no: "1",
          text: "本人作为第一作者或者通信作者（均含共同作者）、以国防科技大学为第一完成单位，在集成电路科学与工程学科紧密相关成果范围目录（一类目录）发表论文 1 篇（含）以上；",
        },
        {
          no: "2",
          text: "以第一作者在「二类（A）目录」中的期刊或会议中发表学术论文 2 篇；",
        },
        {
          no: "3",
          text: "以第一作者在「二类（A）目录」A-1 条目的期刊或会议发表 1 篇学术论文，若该论文对学院相关学科建设有突出贡献，且博士论文预审评价为 A、结论为「优秀」，经系所业务主官或学院本方向学位评定分委员会委员推荐，并在学位申请人申请学位前一季度提请学位评定分委员会审议，审议通过后，可以申请公开评阅；",
        },
        {
          no: "4",
          text: "以第一作者在「二类（B）目录」中的期刊或会议中发表学术论文 4 篇；",
        },
        {
          no: "5",
          text: "以第一作者在「二类（B）目录」中的期刊或会议中发表学术论文 3 篇，且满足以下条件之一：（1）正式出版学术专著 1 部（含）以上（本人排名前 2）；（2）获省部级教学科研成果奖 1 项（含）以上（本人排名前 3）。",
        },
        {
          no: "6",
          text: "与本人学位论文紧密相关的研究成果在国家、军队（省部级）重大项目（任务）中得到应用，做出重要贡献，并获本学科联合导师组联名推荐公开评阅。",
        },
      ],
      earlyApply:
        "本人作为第一作者（含共同作者）、以国防科技大学为第一单位，在计算机科学与技术、软件工程学科紧密相关成果范围目录（一类目录）发表论文 1 篇（含）以上。",
      earlyApplyNote:
        "此条为原文照录：其中引用的目录名称是「计算机科学与技术、软件工程」学科的目录，与本页集成电路学科目录不一致，实际执行请以学院解释为准。",
    },
    master: {
      basic: [
        "学位申请人至少提供 1 篇本人作为第一作者或第二作者（导师或协助导师为第一作者）、以国防科技大学为第一单位，在正式出版的学术期刊或会议论文集上全文发表（含网络在线发表）或录用的学术论文；",
        "或以国防科技大学为第一完成单位，且满足以下条件之一：① 已获授权发明专利 1 个（含）以上（本人排名前 2）；② 正式出版学术专著 1 部（含）以上（本人排名前 3）。",
      ],
      publicReview: [
        {
          no: "1",
          text: "本人作为第一作者或第二作者（导师或协助导师为第一作者，含共同作者）、以国防科技大学为第一单位，在 CCF《中国计算机学会推荐国际学术会议和期刊目录》，或 CCF《计算领域高质量科技期刊分级目录》T1、T2 类期刊，或中国电子学会《电子技术、通信技术领域高质量科技期刊分级目录》T1、T2 类期刊，或《国防科技大学学报》发表学术论文 1 篇。",
        },
        {
          no: "2",
          text: "本人作为第一作者或第二作者（导师或协助导师为第一作者，含共同作者）、以国防科技大学为第一单位，在中科院期刊分区表大类分区 3 区及以上期刊发表学术论文 1 篇。",
        },
      ],
    },
    notes: [
      "博士学位申请（含申请学位和申请公开评阅）中，所使用的紧密相关成果均须符合申请学位时基本目录中对于文章发表状态和检索状态的要求；",
      "博士、硕士学位申请中，紧密相关成果认定以申请学位时相关目录版本为准；",
      "博士、硕士学位申请中，共同作者的文章仅限一名学位申请人申请国防科技大学学位使用，并需获得其他所有共同作者同意；以共同第一作者身份发表的学术论文原则上仅限使用一篇；",
      "紧密相关成果发表在 CCF 推荐的国际 A、B 类会议，且获得会议最佳论文奖励（该届会议最佳论文不超过 3 篇）；或获评 CCF 推荐 A 类期刊、中科院一区 TOP 期刊封面文章、亮点文章的，按 1.5 篇折算；",
      "紧密相关成果若发表在 CCF 推荐的国际 A、B 类会议中，该会议当年录用篇数超过 500 篇（含），按 0.7 篇折算，会议最佳论文不适用此标准；",
      "文中所涉及的协助导师须列入学位论文封面。",
    ],
    catalog: {
      tier1: TIER1,
      tierA: TIER_A_ICE,
      tierB: TIER_B_ICE,
      basicCatalog: [
        "中国科学引文数据库（CSCD）来源期刊（不含扩展版），SCI 源刊，或者已被 EI 检索的学术论文。",
      ],
      remarks: COMMON_REMARKS,
    },
  },
];

export default disciplines;
