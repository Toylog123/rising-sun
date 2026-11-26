import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * 路由切换后把文档滚动位置重置到顶部。
 *
 * 背景：本站是 BrowserRouter 的 SPA，导航栏用 <Link> 做无刷新跳转，浏览器不会
 * 像整页导航那样自动归零滚动位置，于是从长页面进入另一页时会「继承」上页的
 * 滚动位置，看起来像新页面没从顶部开始。
 *
 * 设计要点：
 * - 只监听 pathname，不监听 search/hash：页面内用 useSearchParams 做筛选
 *   （如任务页 ?member=xxx）或组件内部状态的变化不应触发回顶。
 * - behavior 用 "instant" 覆盖全局的 `scroll-behavior: smooth`，避免切换时
 *   出现一段「滚回顶部」的动画，同时不影响页面内点击锚点等正常平滑滚动。
 * - 用 useLayoutEffect 在浏览器绘制前完成重置，避免新页面先闪一下旧位置。
 * - 只操作 window（文档级滚动），不碰弹窗/下拉的 overflow-y-auto 内部容器。
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
