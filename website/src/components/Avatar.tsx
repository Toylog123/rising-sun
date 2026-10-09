import { useState } from "react";

/** 头像：填了 avatar 就显示照片，没填或加载失败则回退到姓名首字。
 *  这样即使组里暂时没人上传照片，卡片也不会因为缺图而塌陷。 */
export default function Avatar({
  name,
  src,
  size = 48,
  className = "",
}: {
  name: string;
  src?: string;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  // 中文姓名取后两字（去掉姓）更像"名字"，两字及以下直接全取
  const initials = name.length > 2 ? name.slice(-2) : name;

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#c96442]/10 font-semibold text-[#c96442] ring-1 ring-[#c96442]/20 ${className}`}
      style={{ width: size, height: size, fontSize: Math.max(11, Math.round(size * 0.34)) }}
    >
      {showImage ? (
        <img
          src={src}
          alt={name}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span aria-hidden="true">{initials}</span>
      )}
    </span>
  );
}
