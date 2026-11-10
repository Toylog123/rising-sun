/**
 * 组会记录的合并规则
 *
 * 单独拆出来（不依赖 zustand / 任何 store），方便直接用 node 跑自检：
 *   node --experimental-strip-types src/lib/merge.test.mjs
 *
 * 为什么需要合并而不是覆盖：组会 JSON 是多人共用的，朴素的「拉取即覆盖」
 * 会把别人刚提交的记录冲掉，也会把本机刚传好附件、还没推送成功的改动弄丢。
 */

/** 合并所需的最小结构（store 里的 Meeting 满足这个形状） */
export interface MergeableMeeting {
  id: string;
  date: string;
  updatedAt?: string;
}

/**
 * 合并本地与远端的组会记录。
 *
 *  - 只在远端有 → 采用远端
 *  - 只在本地有 → 保留本地（等下次推送）
 *  - 两边都有 → 取 updatedAt 更新的一条；缺失时间戳时以远端为准
 * 附件随记录整体择新，避免出现「记录是新的、附件却是旧的」这种撕裂状态。
 */
export function mergeMeetings<T extends MergeableMeeting>(
  local: T[],
  remote: T[]
): T[] {
  const localMap = new Map(local.map((m) => [m.id, m]));
  const remoteMap = new Map(remote.map((m) => [m.id, m]));
  const merged: T[] = [];

  for (const [id, r] of remoteMap) {
    const l = localMap.get(id);
    if (!l) {
      merged.push(r);
      continue;
    }
    const lt = l.updatedAt ?? "";
    const rt = r.updatedAt ?? "";
    // 远端没有时间戳（老数据）时，以远端为准
    if (!rt) {
      merged.push(r);
      continue;
    }
    // 本地没有时间戳（本地刚建，还没来得及打戳）时，保留本地
    if (!lt) {
      merged.push(l);
      continue;
    }
    merged.push(lt > rt ? l : r);
  }

  // 本地独有的记录一律保留
  for (const [id, l] of localMap) {
    if (!remoteMap.has(id)) merged.push(l);
  }

  return merged.sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * 把「浏览器缓存里的记录」与「仓库里最新的种子记录」并起来。
 *
 * 为什么要这一步：最早部署时 meetings.json 还是空数组，老用户浏览器里
 * localStorage 的 `rising-sun-meetings-v1` 存下了 `meetings: []`。
 * zustand 的 persist 会用这份缓存覆盖掉新的种子数据，组会页就一片空白
 * （用户反馈「组会里面没有看到组会记录」）。种子是仓库里的权威副本，
 * 应当始终并进来；本地独有的记录（用户自己新建、还没推送的）保留。
 *
 * 与 mergeMeetings 的区别：这里两边都有时比较 updatedAt，种子没时间戳
 * （老数据）视作更旧；mergeMeetings 是「远端没时间戳时以远端为准」。
 */
export function mergeSeedAndStored<T extends MergeableMeeting>(
  stored: T[],
  seed: T[]
): T[] {
  const byId = new Map<string, T>();
  for (const m of seed) byId.set(m.id, m);
  for (const m of stored) {
    const seeded = byId.get(m.id);
    if (!seeded) {
      // 本地独有：保留（等下次推送）
      byId.set(m.id, m);
      continue;
    }
    const st = m.updatedAt ?? "";
    const xt = seeded.updatedAt ?? "";
    byId.set(m.id, st > xt ? m : seeded);
  }
  return Array.from(byId.values()).sort((a, b) => b.date.localeCompare(a.date));
}
