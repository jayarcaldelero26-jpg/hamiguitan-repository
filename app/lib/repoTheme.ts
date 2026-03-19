// app/lib/repoTheme.ts
export type PageTheme = "dark" | "light";

export function repoTheme(pageTheme: PageTheme) {
  const dark = pageTheme === "dark";

  return {
    dark,

    page: dark
      ? "min-h-full [background:var(--ui-page-bg)] text-[var(--ui-text-main)]"
      : "min-h-full [background:var(--ui-page-bg)] text-[var(--ui-text-main)]",

    shell: dark
      ? "[background:var(--ui-shell-bg)] border border-[color:var(--ui-shell-border)] shadow-[var(--ui-shell-shadow)] backdrop-blur-sm md:backdrop-blur-xl rounded-[28px]"
      : "[background:var(--ui-shell-bg)] border border-[color:var(--ui-shell-border)] shadow-[var(--ui-shell-shadow)] backdrop-blur-sm md:backdrop-blur-xl rounded-[28px]",

    sectionShell: dark
      ? "rounded-[28px] border border-[color:var(--ui-shell-border)] [background:var(--ui-section-shell-bg)] shadow-[var(--ui-section-shell-shadow)]"
      : "rounded-[28px] border border-[color:var(--ui-shell-border)] [background:var(--ui-section-shell-bg)] shadow-[var(--ui-section-shell-shadow)]",

    panel: dark
      ? "rounded-[20px] border border-[color:var(--ui-panel-border)] [background:var(--ui-panel-bg)] shadow-[var(--ui-panel-shadow)]"
      : "rounded-[20px] border border-[color:var(--ui-panel-border)] [background:var(--ui-panel-bg)] shadow-[var(--ui-panel-shadow)]",

    panelSoft: dark
      ? "rounded-[18px] border border-[color:var(--ui-panel-border)] [background:var(--ui-panel-soft-bg)]"
      : "rounded-[18px] border border-[color:var(--ui-panel-border)] [background:var(--ui-panel-soft-bg)]",

    sidebar: dark
      ? "border-[color:var(--ui-shell-border)] [background:var(--ui-sidebar-bg)] shadow-[var(--ui-sidebar-shadow)]"
      : "border-[color:var(--ui-shell-border)] [background:var(--ui-sidebar-bg)] shadow-[var(--ui-sidebar-shadow)]",

    mobileBar: dark
      ? "border-[color:var(--ui-shell-border)] bg-[color:var(--ui-mobile-bar-bg)]"
      : "border-[color:var(--ui-shell-border)] bg-[color:var(--ui-mobile-bar-bg)]",

    card: dark
      ? "bg-[linear-gradient(180deg,rgba(31,42,51,0.92),rgba(24,31,39,0.96))] border border-[var(--ui-border)] shadow-[0_14px_34px_rgba(0,0,0,0.22)] md:shadow-[0_18px_44px_rgba(0,0,0,0.3)] backdrop-blur-sm md:backdrop-blur-xl rounded-[26px]"
      : "bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(245,247,250,0.98))] border border-[var(--ui-border-strong)] shadow-[0_14px_32px_rgba(15,23,42,0.07)] md:shadow-[0_18px_42px_rgba(15,23,42,0.11)] backdrop-blur-sm md:backdrop-blur-xl rounded-[26px]",

    cardSoft: dark
      ? "bg-white/[0.04] border border-[var(--ui-border)] rounded-[22px]"
      : "bg-[#F8FAFC] border border-[var(--ui-border-strong)] rounded-[22px]",

    tableWrap: dark
      ? "[background:var(--ui-table-surface-bg)] rounded-[24px] overflow-hidden shadow-none"
      : "[background:var(--ui-table-surface-bg)] rounded-[24px] overflow-hidden shadow-none",

    tableHead: dark
      ? "bg-white/[0.035] text-[var(--ui-accent-soft)]"
      : "bg-slate-50/88 text-[var(--ui-text-soft)]",

    rowHover: dark ? "hover:bg-white/[0.035]" : "hover:bg-slate-50/90",

    textMain: "text-[var(--ui-text-main)]",
    textMuted: dark ? "text-[color:rgba(230,237,243,0.72)]" : "text-[color:rgba(75,85,99,0.82)]",
    textSoft: dark ? "text-[color:rgba(151,166,168,0.88)]" : "text-[color:rgba(75,85,99,0.68)]",

    pill: dark
      ? "bg-[#2C3A45]/78 text-[var(--ui-text-main)] border border-[var(--ui-border)]"
      : "bg-white text-[var(--ui-text-main)] border border-[var(--ui-border-strong)]",

    pillGreen: dark
      ? "bg-[#2D3B31] text-[var(--ui-text-main)] border border-[#868C65]/26"
      : "bg-[#F4F4EE] text-[#4B4F41] border border-[#A5A58D]/42",

    pillBlue: dark
      ? "bg-[#243648] text-[var(--ui-text-main)] border border-[var(--ui-border)]"
      : "bg-[#EEF3F8] text-[#395C7A] border border-[#395C7A]/18",

    pillAmber: dark
      ? "bg-[#3A3D2F] text-[var(--ui-text-main)] border border-[#868C65]/24"
      : "bg-[#F5F4ED] text-[#6B705C] border border-[#A5A58D]/34",

    input: dark
      ? "w-full pl-11 pr-4 py-3.5 rounded-[20px] border border-[var(--ui-border)] bg-white/[0.04] text-[var(--ui-text-main)] placeholder:text-[color:rgba(151,166,168,0.75)] outline-none focus:ring-4 focus:ring-[#395C7A]/18 focus:border-[#395C7A]/45"
      : "w-full pl-11 pr-4 py-3.5 rounded-[20px] border border-[var(--ui-border-strong)] bg-white text-[var(--ui-text-main)] placeholder:text-[color:rgba(75,85,99,0.58)] outline-none focus:ring-4 focus:ring-[#395C7A]/12 focus:border-[#395C7A]/45",

    buttonPrimary: dark
      ? "app-glass-button app-protected-action-button border border-[var(--ui-border-strong)] bg-[linear-gradient(135deg,rgba(57,92,122,0.96)_0%,rgba(47,78,102,0.92)_100%)] text-[var(--ui-text-main)] shadow-[0_12px_26px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.12)]"
      : "app-glass-button app-protected-action-button border border-[rgba(57,92,122,0.24)] bg-[linear-gradient(135deg,rgba(57,92,122,0.98)_0%,rgba(47,78,102,0.94)_100%)] text-[var(--ui-text-main)] shadow-[0_14px_28px_rgba(57,92,122,0.18),inset_0_1px_0_rgba(255,255,255,0.2)]",

    buttonSecondary: dark
      ? "app-glass-button app-protected-action-button bg-white/[0.05] text-[var(--ui-text-main)] hover:bg-white/[0.08] border border-[var(--ui-border)] shadow-[0_10px_22px_rgba(0,0,0,0.16),inset_0_1px_0_rgba(255,255,255,0.06)]"
      : "app-glass-button app-protected-action-button border border-[rgba(148,163,184,0.24)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,250,252,0.98))] text-[var(--ui-text-main)] hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(241,245,249,0.98))] shadow-[0_12px_24px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.9)]",

    buttonDanger:
      dark
        ? "app-glass-button app-protected-action-button border border-[rgba(181,110,110,0.35)] bg-[linear-gradient(135deg,rgba(74,49,49,0.9)_0%,rgba(54,38,38,0.88)_100%)] text-[var(--ui-text-main)] shadow-[0_12px_26px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.08)] hover:border-[rgba(199,130,130,0.46)]"
        : "app-glass-button app-protected-action-button border border-[rgba(220,38,38,0.18)] bg-[linear-gradient(180deg,rgba(255,245,245,0.96),rgba(254,242,242,0.98))] text-[#991B1B] shadow-[0_12px_24px_rgba(127,29,29,0.08),inset_0_1px_0_rgba(255,255,255,0.96)] hover:border-[rgba(220,38,38,0.24)]",

    iconBox: dark
      ? "h-12 w-12 rounded-[18px] grid place-items-center bg-[#2C3A45]/80 border border-[var(--ui-border)] text-[var(--ui-text-main)]"
      : "h-12 w-12 rounded-[18px] grid place-items-center bg-white border border-[var(--ui-border-strong)] text-[var(--ui-text-main)]",

    modal: dark
      ? "bg-[#1F2A33] border border-[var(--ui-border)]"
      : "bg-white border border-[var(--ui-border-strong)]",
  };
}
