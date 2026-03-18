import type { rooms } from "../db/schema";

export function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderMessageLi(opts: {
  nickname: string;
  body: string;
  createdAt?: Date;
  kind?: "user" | "system";
}): string {
  const kind = opts.kind ?? "user";
  if (kind === "system") {
    return `<li hx-swap-oob="beforeend:#messages" class="my-2 text-center text-xs text-tc-300">${escapeHtml(opts.body)}</li>`;
  }

  const time = (opts.createdAt ?? new Date()).toISOString();
  return `
<li hx-swap-oob="beforeend:#messages" class="group my-2 flex gap-3">
  <div class="min-w-0 flex-1">
    <div class="flex items-baseline gap-2">
      <div class="text-sm font-semibold text-tc-50">${escapeHtml(opts.nickname)}</div>
      <time class="hidden text-xs text-tc-300 group-hover:block" datetime="${time}">${time.slice(11,16)}</time>
    </div>
    <div class="whitespace-pre-wrap text-sm text-tc-100">${escapeHtml(opts.body)}</div>
  </div>
</li>`.trim();
}
