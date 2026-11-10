/**
 * mergeMeetings 的自检脚本（不依赖测试框架，直接 node 跑）
 *
 * 覆盖的是多人共用组会 JSON 时最容易出事的地方：
 *  - A 上传附件后还没推送成功，B 在另一台电脑提交了记录 → 不能互相覆盖
 *  - 同一个记录两边都改过 → 按 updatedAt 取新的那条
 *
 * 运行：node src/lib/merge.test.mjs
 */
import { mergeMeetings, mergeSeedAndStored } from "./merge.ts";

let failed = 0;
function check(name, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    console.log(`  ✔ ${name}`);
  } else {
    failed++;
    console.log(`  ✘ ${name}\n      期望: ${e}\n      实际: ${a}`);
  }
}

const m = (id, over = {}) => ({
  id,
  date: "2026-11-01",
  speaker: "张三",
  topic: "题目",
  ...over,
});

console.log("mergeMeetings 自检");

// 1. 远端有、本地无 → 采用远端
check(
  "远端独有的记录被保留",
  mergeMeetings([], [m("r1")]).map((x) => x.id),
  ["r1"]
);

// 2. 本地有、远端无 → 保留本地（本地还没推送成功的改动不能丢）
check(
  "本地独有的记录被保留",
  mergeMeetings([m("l1")], []).map((x) => x.id),
  ["l1"]
);

// 3. 两边都有、远端没有时间戳 → 以远端为准（老数据兼容）
check(
  "远端无时间戳时以远端为准",
  mergeMeetings([m("x", { topic: "本地" })], [m("x", { topic: "远端" })]).map(
    (x) => x.topic
  ),
  ["远端"]
);

// 4. 两边都有、本地没有时间戳 → 保留本地
check(
  "本地无时间戳时保留本地",
  mergeMeetings([m("x", { topic: "本地" })], [m("x", { topic: "远端", updatedAt: "2026-11-02T00:00:00.000Z" })]).map(
    (x) => x.topic
  ),
  ["本地"]
);

// 5. 两边都有时间戳 → 取更新的那条
check(
  "按 updatedAt 取新的那条",
  mergeMeetings(
    [m("x", { topic: "本地", updatedAt: "2026-11-03T00:00:00.000Z" })],
    [m("x", { topic: "远端", updatedAt: "2026-11-02T00:00:00.000Z" })]
  ).map((x) => x.topic),
  ["本地"]
);

// 6. 附件随记录整体择新，不会出现「记录是新的、附件却是旧的」
const withAttach = mergeMeetings(
  [m("x", { updatedAt: "2026-11-03T00:00:00.000Z", attachments: [{ name: "新.pdf", path: "uploads/meetings/new.pdf", size: 1, uploadedAt: "x" }] })],
  [m("x", { updatedAt: "2026-11-02T00:00:00.000Z", attachments: [{ name: "旧.pdf", path: "uploads/meetings/old.pdf", size: 1, uploadedAt: "x" }] })]
);
check(
  "附件随记录一起择新",
  withAttach[0].attachments.map((a) => a.name),
  ["新.pdf"]
);

// 7. 结果按日期倒序
check(
  "结果按日期倒序",
  mergeMeetings(
    [m("a", { date: "2026-01-01" }), m("b", { date: "2026-05-01" })],
    [m("c", { date: "2026-03-01" })]
  ).map((x) => x.date),
  ["2026-05-01", "2026-03-01", "2026-01-01"]
);

// 8. 双方各自新增的记录都在（最常见的协作场景）
const both = mergeMeetings([m("mine")], [m("theirs")]);
check(
  "双方各自新增的记录都保留",
  both.map((x) => x.id).sort(),
  ["mine", "theirs"]
);

console.log("\nmergeSeedAndStored 自检（浏览器缓存 vs 仓库种子）");

// 9. 缓存是空数组（最早部署时 meetings.json 还是空的）→ 种子必须全部进来
check(
  "空缓存不会盖掉种子记录",
  mergeSeedAndStored([], [m("s1"), m("s2")]).map((x) => x.id),
  ["s1", "s2"]
);

// 10. 缓存里有种子没有的记录 → 保留（用户本地新建、还没推送的）
check(
  "本地独有的记录被保留",
  mergeSeedAndStored([m("mine")], [m("s1")]).map((x) => x.id).sort(),
  ["mine", "s1"]
);

// 11. 两边都有、种子没有时间戳（老数据）→ 以种子为准
check(
  "种子无时间戳时以种子为准",
  mergeSeedAndStored(
    [m("x", { topic: "缓存" })],
    [m("x", { topic: "种子" })]
  ).map((x) => x.topic),
  ["种子"]
);

// 12. 两边都有时间戳 → 取更新的那条
check(
  "按 updatedAt 取新的那条",
  mergeSeedAndStored(
    [m("x", { topic: "缓存", updatedAt: "2026-11-03T00:00:00.000Z" })],
    [m("x", { topic: "种子", updatedAt: "2026-11-02T00:00:00.000Z" })]
  ).map((x) => x.topic),
  ["缓存"]
);

// 13. 种子更新 → 缓存旧版本被顶掉
check(
  "种子较新时用种子",
  mergeSeedAndStored(
    [m("x", { topic: "缓存", updatedAt: "2026-11-02T00:00:00.000Z" })],
    [m("x", { topic: "种子", updatedAt: "2026-11-03T00:00:00.000Z" })]
  ).map((x) => x.topic),
  ["种子"]
);

// 14. 结果按日期倒序
check(
  "结果按日期倒序",
  mergeSeedAndStored(
    [m("a", { date: "2026-01-01" })],
    [m("b", { date: "2026-05-01" }), m("c", { date: "2026-03-01" })]
  ).map((x) => x.date),
  ["2026-05-01", "2026-03-01", "2026-01-01"]
);

console.log(failed === 0 ? "\n全部通过" : `\n${failed} 项失败`);
process.exit(failed === 0 ? 0 : 1);