// 把 ccfFull 的 CCF_INDEX 接到 venueCatalog 的 VENUES 上，产出一张合并后的完整目录。

import { CCF_INDEX } from "./ccfFull";
import { buildCatalog } from "./venueFull";

export * from "./venueCatalog";
export { CCF_DOMAINS } from "./ccfFull";
export { CAS_TABLE, CSEE_TABLE, cseeOf, CORE_ABBRS, CN_ABBRS, TIER1_ABBRS } from "./venueFull";
export { CSEE_ENTRIES, CSEE_STATS } from "./cseeFull";

import { VENUES as BASE_VENUES } from "./venueCatalog";

const built = buildCatalog({ ccfIndex: CCF_INDEX, baseRows: BASE_VENUES });

/** 全量目录（一类目录 → 本院核心 → CCF 等级 → 简称） */
export const ALL_VENUES = built.rows;

export const CATALOG_STATS = {
  total: built.rows.length,
  journals: built.rows.filter((v) => v.kind === "期刊").length,
  conferences: built.rows.filter((v) => v.kind === "会议").length,
  fromCcf: built.fromCcf,
  verified: built.verified,
  ccfA: built.rows.filter((v) => v.ccf === "A").length,
  ccfB: built.rows.filter((v) => v.ccf === "B").length,
  ccfC: built.rows.filter((v) => v.ccf === "C").length,
  cas: built.rows.filter((v) => v.cas).length,
  csee: built.rows.filter((v) => v.csee).length,
};