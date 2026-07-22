/*
 * Core 订阅到期日期延长 1 个月
 * 拦截: POST https://test.klpjwycb.xyz:2053/check/querymaclist
 *
 * 原始响应: {"msg":"{\"com.yuding.dy\":\"2026-07-24 02:51:07\"}"}
 * 修改后:   {"msg":"{\"com.yuding.dy\":\"2026-08-24 02:51:07\"}"}
 */

export default async function (ctx) {
  if (!ctx.response || !ctx.response.body) return;

  // ctx.response.body 是字符串
  const rawBody = ctx.response.body;
  if (!rawBody) return;

  try {
    // 外层 JSON 解析
    const parsed = JSON.parse(rawBody);
    if (!parsed.msg) return;

    // 内层 JSON 解析
    const inner = JSON.parse(parsed.msg);

    let modified = false;
    const resultObj = {};

    for (const key of Object.keys(inner)) {
      const val = inner[key];
      // 匹配 YYYY-MM-DD HH:mm:ss
      const m = val.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}:\d{2}:\d{2})$/);
      if (m) {
        let year = parseInt(m[1]);
        let month = parseInt(m[2]);
        let day = parseInt(m[3]);
        const time = m[4];

        // 加 1 个月
        month++;
        if (month > 12) {
          month = 1;
          year++;
        }

        // 处理月末天数溢出（如 1月31日 → 2月28日）
        const daysInMonth = [
          31,
          (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 29 : 28,
          31, 30, 31, 30, 31, 31, 30, 31, 30, 31,
        ];
        if (day > daysInMonth[month - 1]) {
          day = daysInMonth[month - 1];
        }

        const newDate =
          year +
          '-' +
          String(month).padStart(2, '0') +
          '-' +
          String(day).padStart(2, '0') +
          ' ' +
          time;
        resultObj[key] = newDate;
        modified = true;
        console.log('[Core订阅延长] ' + key + ': ' + val + ' → ' + newDate);
      } else {
        resultObj[key] = val;
      }
    }

    if (modified) {
      parsed.msg = JSON.stringify(resultObj);
      // 修改响应体（注意是字符串，不是 ReadableStream）
      ctx.response.body = JSON.stringify(parsed);
    }
  } catch (e) {
    console.log('[Core订阅延长] 解析失败: ' + e.message);
  }
}
