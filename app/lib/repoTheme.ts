// app/lib/repoTheme.ts
export type PageTheme = "dark" | "light";

export function repoTheme(pageTheme: PageTheme) {
  const dark = pageTheme === "dark";

  return {
    dark,

    page: "min-h-full app-theme-page",

    shell: "app-solid-surface rounded-[26px]",

    sectionShell: "app-solid-surface rounded-[26px]",

    panel: "app-solid-surface rounded-[22px]",

    panelSoft: "app-soft-surface rounded-[22px]",

    sidebar: "app-protected-sidebar",

    mobileBar: "app-protected-sidebar-bar",

    card: "app-solid-surface rounded-[26px]",

    cardSoft: "app-soft-surface rounded-[22px]",

    tableWrap: "app-solid-surface rounded-[24px] overflow-hidden shadow-none",

    tableHead: "bg-[var(--app-table-head-bg)] text-[var(--ui-text-soft)]",

    rowHover: "hover:bg-[var(--app-row-hover)]",

    textMain: "text-[var(--ui-text-main)]",
    textMuted: "app-muted-text",
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

    input:
      "app-form-control app-input-surface w-full pl-11 pr-4 py-3.5 rounded-[20px] outline-none",

    buttonPrimary: dark
      ? "app-clickable app-glass-button app-protected-action-button app-sidebar-btn app-sidebar-btn-primary border border-[var(--ui-border-strong)] bg-[linear-gradient(135deg,rgba(57,92,122,0.96)_0%,rgba(47,78,102,0.92)_100%)] text-[var(--ui-text-main)] shadow-[0_12px_26px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.12)]"
      : "app-clickable app-glass-button app-protected-action-button app-sidebar-btn app-sidebar-btn-primary border border-[rgba(84,117,150,0.18)] bg-[linear-gradient(180deg,rgba(81,118,153,0.98),rgba(57,92,122,1))] text-white shadow-[0_12px_24px_rgba(57,92,122,0.16),inset_0_1px_0_rgba(255,255,255,0.2)]",

    buttonSecondary: dark
      ? "app-clickable app-glass-button app-protected-action-button app-sidebar-btn app-sidebar-btn-secondary bg-white/[0.05] text-[var(--ui-text-main)] hover:bg-white/[0.08] border border-[var(--ui-border)] shadow-[0_10px_22px_rgba(0,0,0,0.16),inset_0_1px_0_rgba(255,255,255,0.06)]"
      : 'app-clickable app-glass-button app-protected-action-button app-sidebar-btn app-sidebar-btn-secondary border border-[rgba(148,163,184,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,248,252,0.98))] text-[#243647] hover:bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(238,244,250,1))] shadow-[0_10px_20px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.92)]',

    buttonDanger:
      dark
        ? "app-clickable app-glass-button app-protected-action-button app-sidebar-btn app-sidebar-btn-danger border border-[rgba(181,110,110,0.35)] bg-[linear-gradient(135deg,rgba(74,49,49,0.9)_0%,rgba(54,38,38,0.88)_100%)] text-[var(--ui-text-main)] shadow-[0_12px_26px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.08)] hover:border-[rgba(199,130,130,0.46)]"
        : "app-clickable app-glass-button app-protected-action-button app-sidebar-btn app-sidebar-btn-danger border border-[rgba(220,38,38,0.14)] bg-[linear-gradient(180deg,rgba(255,250,250,0.98),rgba(255,242,242,0.98))] text-[#A12C2C] shadow-[0_10px_20px_rgba(127,29,29,0.08),inset_0_1px_0_rgba(255,255,255,0.96)] hover:border-[rgba(220,38,38,0.2)]",

    iconBox: dark
      ? "h-12 w-12 rounded-[18px] grid place-items-center bg-[#2C3A45]/80 border border-[var(--ui-border)] text-[var(--ui-text-main)]"
      : "h-12 w-12 rounded-[18px] grid place-items-center bg-white border border-[var(--ui-border-strong)] text-[var(--ui-text-main)]",

    modal: "app-dialog-surface rounded-[28px]",
  };
}
