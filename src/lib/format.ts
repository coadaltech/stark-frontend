const pad = (n: number) => String(n).padStart(2, "0");

/** "2020-09-22" → "22-09-2020" */
export function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
}

/** "2020-09-22T10:44:18" → "2020-09-22 10:44:18" */
export function formatDateTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** "2020-09-22T23:57:18" → "22-09-2020 11:57 PM" */
export function formatDateTime12(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const hours = d.getHours() % 12 || 12;
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(hours)}:${pad(d.getMinutes())} ${d.getHours() < 12 ? "AM" : "PM"}`;
}
