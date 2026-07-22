/**
 * 通用日期与到期天数解析工具库
 * 解决前后端日期格式不统一 ("YYYY-MM-DD HH:mm:ss", ISO 格式, 时间戳数字) 导致 Date 解析为 NaN 的问题
 */

export function parseExpiryDate(expired_at?: string | number | null): Date | null {
  if (expired_at === undefined || expired_at === null || expired_at === "") return null;
  let date: Date;
  if (typeof expired_at === "number") {
    date = new Date(expired_at < 1e11 ? expired_at * 1000 : expired_at);
  } else if (typeof expired_at === "string") {
    let str = expired_at.trim();
    if (!str) return null;
    // 替换 "YYYY-MM-DD HH:mm:ss" 中的空格为 "T"，使其符合 ISO 8601 标准规范
    if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(str)) {
      str = str.replace(" ", "T");
    }
    date = new Date(str);
    if (isNaN(date.getTime()) && /^\d+$/.test(str)) {
      const num = Number(str);
      date = new Date(num < 1e11 ? num * 1000 : num);
    }
  } else {
    return null;
  }

  if (isNaN(date.getTime())) return null;
  return date;
}

export function parseExpiryDiffDays(expired_at?: string | number | null): number | null {
  const date = parseExpiryDate(expired_at);
  if (!date) return null;
  const now = new Date();
  return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}
