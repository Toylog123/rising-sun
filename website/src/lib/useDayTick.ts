import { useEffect, useState } from "react";

/** 距离下一个本地零点后 1 秒还有多少毫秒 */
function msUntilNextDay(now: Date): number {
  const next = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0,
    0,
    1
  );
  return Math.max(1000, next.getTime() - now.getTime());
}

/**
 * 返回一个随自然日滚动而更新的时间戳。
 *
 * 「N 天前」是按自然日算的，一天之内数值不会变，所以没必要每秒轮询——
 * 在零点后 1 秒精确唤醒一次就够了。标签页被挂起或机器休眠导致定时器迟到也没关系：
 * 醒来时 setNow(new Date()) 拿到的是真实时间，天数自然就被纠正了。
 */
export function useDayTick(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      timer = setTimeout(() => {
        setNow(new Date());
        schedule();
      }, msUntilNextDay(new Date()));
    };
    schedule();
    return () => clearTimeout(timer);
  }, []);

  return now;
}