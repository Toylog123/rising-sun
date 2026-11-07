# 组会汇报材料

这个目录存放每次组会汇报的 PDF（PPT 导出）。

- 文件由网站前端通过 GitHub Contents API 直接上传，无需手动放文件。
- 文件名格式：`YYYY-MM-DD_<随机后缀>_<原始文件名>.pdf`，随机后缀避免同名互相覆盖。
- 每条组会记录在 `website/src/data/meetings.json` 里保存附件的元数据
  （文件名、路径、大小、blob sha、上传时间）。
- 在线预览走 GitHub Pages 直链（本目录位于站点根下），
  下载走 raw 直链。
- 删除组会记录时，网站会顺带删除这里对应的 PDF 文件。

本目录下的文件会随 GitHub Pages 一起发布，等同于公开可访问，请勿放置敏感材料。
