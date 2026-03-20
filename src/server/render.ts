export function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeHtmlAttr(s: string): string {
  return escapeHtml(s).replaceAll("\n", "&#10;");
}

/** Renders plain text with @everyone and @tokens wrapped as mention spans (HTML-safe). */
export function renderBodyWithMentions(body: string): string {
  let out = "";
  let i = 0;
  while (i < body.length) {
    if (body[i] !== "@") {
      const nextAt = body.indexOf("@", i);
      const sliceEnd = nextAt === -1 ? body.length : nextAt;
      out += escapeHtml(body.slice(i, sliceEnd));
      i = sliceEnd;
      continue;
    }
    const rest = body.slice(i);
    if (rest.toLowerCase().startsWith("@everyone")) {
      const afterLen = "@everyone".length;
      const after = rest[afterLen];
      if (after === undefined || /[\s.,!?;:]/.test(after)) {
        out += `<span class="mention">@everyone</span>`;
        i += afterLen;
        continue;
      }
    }
    const m = /^@([^\s@]+)/.exec(rest);
    if (m) {
      const full = m[0];
      out += `<span class="mention">${escapeHtml(full)}</span>`;
      i += full.length;
      continue;
    }
    out += escapeHtml("@");
    i += 1;
  }
  return out;
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
    return `<li hx-swap-oob="beforeend:#messages" class="message-system my-2 text-center text-xs text-tc-300">${escapeHtml(opts.body)} <span class="text-tc-400">${dateStr} ${timeStr}</span></li>`;
  }

  const authorAttr = escapeHtmlAttr(opts.nickname);
  return `
<li hx-swap-oob="beforeend:#messages" class="message-user group my-2 flex gap-3" data-author="${authorAttr}">
  <div class="min-w-0 flex-1">
    <div class="flex items-baseline gap-2">
      <div class="text-sm font-semibold text-tc-50">${escapeHtml(opts.nickname)}</div>
      <time class="text-xs text-tc-300" datetime="${time}">${dateStr} ${timeStr}</time>
    </div>
    <div class="msg-body whitespace-pre-wrap text-sm text-tc-100">${renderBodyWithMentions(opts.body)}</div>
  </div>
</li>`.trim();
}
