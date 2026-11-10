/**
 * 上传链路的连通性自检（用无效 token 故意打真实 API）
 *
 * 目的：验证请求的 URL / header / body 结构是对的，
 * 并且错误能映射成人话。拿到 401 说明请求已经正确抵达 GitHub。
 *
 * 运行：node --experimental-strip-types --no-warnings src/lib/uploads.test.mjs
 */
import { pushBinary, fetchFileSha, pushBinaryViaGitData, friendlyBinaryError, GitHubApiError } from "./github.ts";
import {
  pagesUrl,
  rawUrl,
  formatBytes,
  sanitizeFileName,
  buildUploadPath,
  buildAttachmentName,
  shortenForFileName,
  ATTACHMENT_NAME_MAX,
  checkFile,
  UPLOAD_DIR,
  MAX_ATTACHMENT_BYTES,
} from "./uploads.ts";

const FAKE_TOKEN = "ghp_thisIsNotARealToken0000000000000000";
const PATH = "uploads/meetings/__selftest__/probe.pdf";

let failed = 0;
function ok(name, cond, detail = "") {
  if (cond) {
    console.log(`  ✔ ${name}`);
  } else {
    failed++;
    console.log(`  ✘ ${name}${detail ? "\n      " + detail : ""}`);
  }
}

console.log("上传链路自检（token 故意无效）");

// 1) pushBinary 请求结构正确 → 应该收到 401 而不是 404/422/400
let status = 0;
let msg = "";
try {
  await pushBinary(PATH, Buffer.from("%PDF-1.4 fake").toString("base64"), FAKE_TOKEN, "test");
  ok("pushBinary 应当抛错", false, "居然成功了？");
} catch (err) {
  status = err instanceof GitHubApiError ? err.status : -1;
  msg = err instanceof Error ? err.message : String(err);
  ok("pushBinary 收到 401（说明 URL/header/body 结构正确）", status === 401, `实际 status=${status} msg=${msg}`);
  ok("401 被映射成人话", msg.includes("PAT"), `实际 msg=${msg}`);
}

// 2) fetchFileSha 无 token 时匿名访问公开文件 → 应返回 null 或正常 sha，不应抛错
try {
  const sha = await fetchFileSha("logo.svg");
  ok("fetchFileSha 匿名读公开文件不抛错", true, `sha=${sha}`);
} catch (err) {
  ok("fetchFileSha 匿名读公开文件不抛错", false, String(err));
}

// 3) 错误类型可被 instanceof 识别（uploads.ts 的 404 分支依赖它）
ok("GitHubApiError 可被 instanceof 识别", new GitHubApiError("x", 404) instanceof GitHubApiError);

// 4) Git Data API 兜底路径的请求结构 → 无效 token 也应得 401
try {
  await pushBinaryViaGitData(PATH, Buffer.from("%PDF-1.4 fake").toString("base64"), FAKE_TOKEN, "test");
  ok("pushBinaryViaGitData 应当抛错", false, "居然成功了？");
} catch (err) {
  const s = err instanceof GitHubApiError ? err.status : -1;
  ok("pushBinaryViaGitData 收到 401（URL/body 结构正确）", s === 401, `实际 status=${s}`);
}

// 4b) 中文文件名的 URL 必须百分号编码，否则请求会打歪
try {
  await pushBinary(
    "uploads/meetings/组会汇报.pdf",
    Buffer.from("%PDF-1.4 fake").toString("base64"),
    FAKE_TOKEN,
    "test"
  );
  ok("中文文件名应当抛错", false, "居然成功了？");
} catch (err) {
  const s = err instanceof GitHubApiError ? err.status : -1;
  // 401 = URL 合法、只是 token 不对；404 也说明请求打到了服务器
  ok("中文文件名请求打到了 GitHub（401/404）", s === 401 || s === 404, `实际 status=${s}`);
}

console.log("\n纯函数自检");

// 5) Pages 链接走 Pages（application/pdf 可内嵌），raw 链接走 raw（下载用）
ok(
  "pagesUrl 指向 github.io",
  pagesUrl("uploads/meetings/a b.pdf") === "https://Toylog123.github.io/rising-sun/uploads/meetings/a%20b.pdf",
  pagesUrl("uploads/meetings/a b.pdf")
);
ok(
  "rawUrl 指向 raw.githubusercontent 且带分支",
  rawUrl("uploads/meetings/x.pdf") ===
    "https://raw.githubusercontent.com/Toylog123/rising-sun/main/uploads/meetings/x.pdf",
  rawUrl("uploads/meetings/x.pdf")
);

// 6) 文件名清洗：保留中文，干掉路径分隔符等危险字符
ok("sanitizeFileName 保留中文", sanitizeFileName("组会汇报.pdf") === "组会汇报.pdf");
ok("sanitizeFileName 去掉斜杠", sanitizeFileName("a/b:c.pdf") === "a_b_c.pdf");
ok("sanitizeFileName 空名兜底", sanitizeFileName("   ") === "attachment.pdf");

// 7) 上传路径：日期 + 随机后缀 + 统一命名，且落在 uploads/meetings 下
const fakeFile = { name: "汇报.pdf", size: 1024, type: "application/pdf" };
const p = buildUploadPath("周雨时_AI4EDA综述.pdf", "2026-11-07");
ok("上传路径落在 uploads/meetings 下", p.startsWith(`${UPLOAD_DIR}/`), p);
ok("上传路径带日期", p.includes("2026-11-07"), p);
ok("上传路径带随机后缀（不同调用不重名）", p !== buildUploadPath("周雨时_AI4EDA综述.pdf", "2026-11-07"));
ok("上传路径保留统一命名", p.endsWith("_周雨时_AI4EDA综述.pdf"), p);

// 7b) 统一命名规范：姓名_汇报内容.pdf
ok(
  "统一命名为 姓名_汇报内容.pdf",
  buildAttachmentName("周雨时", "AI4EDA 六篇论文综述：数据集构建方法") ===
    "周雨时_AI4EDA六篇论文综述：数据集构建方法.pdf",
  buildAttachmentName("周雨时", "AI4EDA 六篇论文综述：数据集构建方法")
);
ok(
  "命名去掉标题里的空格",
  buildAttachmentName("谢俊杰", "SEU 故障分析与加固优化") === "谢俊杰_SEU故障分析与加固优化.pdf",
  buildAttachmentName("谢俊杰", "SEU 故障分析与加固优化")
);
ok(
  "汇报内容过长时整体长度受限",
  buildAttachmentName("佟亚龙", "RSECO：基于重综合的掩膜前时序 ECO 框架与实验结果分析").length <=
    "佟亚龙_".length + ATTACHMENT_NAME_MAX + ".pdf".length,
  buildAttachmentName("佟亚龙", "RSECO：基于重综合的掩膜前时序 ECO 框架与实验结果分析")
);
ok(
  "汇报内容过长时优先在分隔符处断开",
  shortenForFileName("学习驱动的宏单元布局：六篇论文的搜索、迁移与跨阶段优化", 20) ===
    "学习驱动的宏单元布局：六篇论文的搜索",
  shortenForFileName("学习驱动的宏单元布局：六篇论文的搜索、迁移与跨阶段优化", 20)
);
ok(
  "截断后不会留下悬挂的连接词",
  !/[与和的及或]$/.test(shortenForFileName("宏单元布局与布线优化", 8)),
  shortenForFileName("宏单元布局与布线优化", 8)
);
ok("空姓名有兜底", buildAttachmentName("", "某个议题") === "汇报人_某个议题.pdf");
ok("空议题有兜底", buildAttachmentName("周雨时", "") === "周雨时_组会汇报.pdf");
ok("危险字符被清掉", !/[/:*?"<>|]/.test(buildAttachmentName("周/雨时", "a:b*c?d")), buildAttachmentName("周/雨时", "a:b*c?d"));
ok("shortenForFileName 不超上限", shortenForFileName("一二三四五六七八九十", 5).length <= 5);

// 8) 校验规则
ok("非 PDF 被拒", checkFile({ name: "a.pptx", size: 10, type: "" }).ok === false);
ok("超过上限被拒", checkFile({ name: "a.pdf", size: MAX_ATTACHMENT_BYTES + 1, type: "application/pdf" }).ok === false);
ok("空文件被拒", checkFile({ name: "a.pdf", size: 0, type: "application/pdf" }).ok === false);
ok("正常 PDF 通过", checkFile(fakeFile).ok === true);

// 9) 体积格式化
ok("formatBytes KB", formatBytes(2048) === "2.0 KB");
ok("formatBytes MB", formatBytes(5 * 1024 * 1024) === "5.0 MB");
ok("formatBytes B", formatBytes(500) === "500 B");

console.log("\n错误文案翻译");

// 10) GitHub 的超大请求体错误要翻译成人话
ok(
  "Contents API 超大文件 422 被翻译",
  friendlyBinaryError(422, "Sorry, the file is too large to be processed. Consider creating/updating the file in a local clone and pushing it to GitHub.").includes("压缩 PDF"),
  friendlyBinaryError(422, "Sorry, the file is too large to be processed.")
);
ok(
  "Blobs API 超大输入 422 被翻译",
  friendlyBinaryError(422, "Sorry, your input was too large to process. Consider creating the blob in a local clone of the repository and then pushing it to GitHub.").includes("压缩 PDF")
);
ok("401 翻译成 PAT 文案", friendlyBinaryError(401, "Bad credentials").includes("PAT"));
ok("403 限速翻译成中文", friendlyBinaryError(403, "API rate limit exceeded").includes("速率"));
ok(
  "422 但不是超大问题时保留原文",
  friendlyBinaryError(422, "sha does not match") === "sha does not match"
);
// 404 不是「目录不存在」——Contents API 的 PUT 会自动建中间目录，
// 404 说明的是权限/仓库/分支不对
ok(
  "404 翻译成权限/仓库说明，而不是「目录不存在」",
  friendlyBinaryError(404, "Not Found").includes("repo scope"),
  friendlyBinaryError(404, "Not Found")
);
ok(
  "403 非限速时提示 PAT 权限不足",
  friendlyBinaryError(403, "Resource not accessible by integration").includes("权限不足"),
  friendlyBinaryError(403, "Resource not accessible by integration")
);

console.log(failed === 0 ? "\n全部通过" : `\n${failed} 项失败`);
process.exit(failed === 0 ? 0 : 1);
