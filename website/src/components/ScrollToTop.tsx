import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * 路由切换后重置文档滚动位置：默认回顶；若目标带锚点（如 /#members）则滚到锚点。
 *
 * 背景：本站是 BrowserRouter 的 SPA，导航栏用 <Link> 做无刷新跳转，浏览器不会
 * 像整页导航那样自动归零滚动位置，于是从长页面进入另一页时会「继承」上页的
 * 滚动位置，看起来像新页面没从顶部开始。
 *
 * 设计要点：
 * - 监听 pathname 与 hash：跨页切到 /#members 这类带锚点的链接时滚到对应元素
 *   （成员模块已整合进首页），其余情况回顶。
 * - 同页的 search 变化（任务页 ?member=xxx 筛选）不触发：pathname/hash 均未变。
 * - behavior 用 "instant" 覆盖全局的 `scroll-behavior: smooth`，避免切换时出现
 *   「滚回顶部」动画；锚点滚动同理，保证切页后直接定位。
 * - 用 useLayoutEffect 在浏览器绘制前完成，避免新页面先闪一下旧位置。
 * - 只操作 window（文档级滚动），不碰弹窗/下拉的 overflow-y-auto 内部容器。
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useLayoutEffect(() => {
    if (hash) {
      const id = decodeURIComponent(hash.replace(/^#/, ""));
      // 目标元素可能要等新页面渲染完才出现，用 rAF 等一帧再定位
      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "instant", block: "start" });
      });
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, hash]);

  return null;
}
