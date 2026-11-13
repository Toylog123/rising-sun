import assert from "node:assert/strict";
import { auditCandidate, auditPapers } from "@/lib/degreeAudit";

const ICE = { name: "测试学生", program: "集成电路科学与工程", degree: "硕士" };

function paper(p) {
  return {
    id: p.title,
    category: "论文",
    year: "2025",
    authors: ["测试学生"],
    owner: "测试学生",
    graduate: true,
    title: p.title,
    venue: p.venueKey ?? "TBD",
    ...p,
  };
}

// 1. 目录内 A 类期刊 → A-1
{
  const v = auditPapers(ICE, [paper({ title: "p1", venueKey: "c:DAC", authorRole: "一作" })]);
  assert.equal(v.length, 1);
  assert.equal(v[0].level, "A-1", "DAC 是 CCF A，集成电路判 A-1");
  assert.equal(v[0].credited, true);
  assert.equal(v[0].weight, 1);
}

// 2. 共同一作 + 共同署名 → 第二篇折半
{
  const v = auditPapers(ICE, [
    paper({ title: "a", venueKey: "c:ICCAD", authorRole: "共同一作", coAuthor: true }),
    paper({ title: "b", venueKey: "c:ICCAD", authorRole: "共同一作", coAuthor: true }),
  ]);
  assert.equal(v[0].weight, 1, "第一篇共同一作按整篇计");
  assert.ok(v[1].weight < 1, "第二篇共同作者成果要折减");
}

// 3. 最佳论文 ×1.5、大会议 ×0.7
{
  const [v] = auditPapers(ICE, [paper({ title: "c", venueKey: "c:DAC", bestPaper: true })]);
  assert.ok(Math.abs(v.weight - 1.5) < 1e-9);
  const [w] = auditPapers(ICE, [paper({ title: "d", venueKey: "c:DAC", largeConference: true })]);
  assert.ok(Math.abs(w.weight - 0.7) < 1e-9);
}

// 4. 通讯作者不计入本人成果
{
  const [v] = auditPapers(ICE, [paper({ title: "e", venueKey: "c:DAC", authorRole: "通讯" })]);
  assert.equal(v.credited, false);
}

// 5. 不在目录里 → 非目录
{
  const [v] = auditPapers(ICE, [paper({ title: "f" })]);
  assert.equal(v.level, "非目录");
}

// 6. 硕士：一篇 A-1 即满足基本要求与公开评审
{
  const list = [paper({ title: "g", venueKey: "j:TCAD", authorRole: "一作" })];
  const r = auditCandidate(ICE, list);
  assert.equal(r.basicReady, true, "目录内论文一篇满足硕士基本要求");
  assert.equal(r.publicReady, true, "A-1 命中公开评审通道①");
  assert.equal(r.ready, true);
}

// 7. 硕士：没有成果 → 都不满足
{
  const r = auditCandidate(ICE, []);
  assert.equal(r.basicReady, false);
  assert.equal(r.publicReady, false);
  assert.equal(r.ready, false);
}

// 8. 别人名下的成果不参与本人判定
{
  const other = { ...paper({ title: "h", venueKey: "j:TCAD", authorRole: "一作" }), owner: "别人" };
  const r = auditCandidate(ICE, [other]);
  assert.equal(r.basicReady, false);
}

// 9. 博士：基本要求需 ≥2 篇
{
  const phd = { ...ICE, degree: "博士" };
  const one = auditCandidate(phd, [paper({ title: "i", venueKey: "j:TCAD", authorRole: "一作" })]);
  assert.equal(one.basicReady, false);
  const two = auditCandidate(phd, [
    paper({ title: "j", venueKey: "j:TCAD", authorRole: "一作" }),
    paper({ title: "k", venueKey: "j:TVLSI", authorRole: "一作" }),
  ]);
  assert.equal(two.basicReady, true);
}

console.log("degreeAudit: all passed");