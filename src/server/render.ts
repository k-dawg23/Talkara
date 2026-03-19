import type { rooms } from "../db/schema";

export function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDate(date: Date): string {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isYesterday = new Date(now.setDate(now.getDate() - 1)).toDateString() === date.toDateString();
  
  if (isToday) return "Today";
  if (isYesterday) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function renderMessageLi(opts: {
  nickname: string;
  body: string;
  createdAt?: Date;
  kind?: "user" | "system";
}): string {
  const kind = opts.kind ?? "user";
  const createdAt = opts.createdAt ?? new Date();
  const time = createdAt.toISOString();
  const timeStr = createdAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  const dateStr = formatDate(createdAt);
  
  if (kind === "system") {
    return `<li hx-swap-oob="beforeend:#messages" class="my-2 text-center text-xs text-tc-300">${escapeHtml(opts.body)} <span class="text-tc-400">${dateStr} ${timeStr}</span></li>`;
  }

  return `
<li hx-swap-oob="beforeend:#messages" class="group my-2 flex gap-3">
  <div class="min-w-0 flex-1">
    <div class="flex items-baseline gap-2">
      <div class="text-sm font-semibold text-tc-50">${escapeHtml(opts.nickname)}</div>
      <time class="text-xs text-tc-300" datetime="${time}">${dateStr} ${timeStr}</time>
    </div>
    <div class="whitespace-pre-wrap text-sm text-tc-100">${escapeHtml(opts.body)}</div>
  </div>
</li>`.trim();
}
