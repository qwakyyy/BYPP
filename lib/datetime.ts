/** 동아리가 전부 한국에 있다고 가정하고 KST로 고정한다 (다른 시간대 지원 안 함). */
const KST_OFFSET = "+09:00";

/** datetime-local input 값("YYYY-MM-DDTHH:mm")을 KST 기준 timestamptz 문자열로 변환 */
export function kstLocalToIso(datetimeLocal: string): string {
  return `${datetimeLocal}:00${KST_OFFSET}`;
}

export function formatKst(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "numeric",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** timestamptz(UTC) -> datetime-local input의 기본값("YYYY-MM-DDTHH:mm", KST 기준) */
export function isoToKstLocalInput(iso: string): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(fmt.formatToParts(new Date(iso)).map((p) => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}
