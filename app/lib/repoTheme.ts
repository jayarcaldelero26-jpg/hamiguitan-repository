// app/lib/repoTheme.ts
export type PageTheme = "dark" | "light";

export function repoTheme(pageTheme: PageTheme) {
  const dark = pageTheme === "dark";

  return {
    dark,

    page: dark
      ? "min-h-full bg-[linear-gradient(180deg,#051F20_0%,#0B2B26_38%,#163832_100%)] text-[#DAF1DE]"
      : "min-h-full bg-[linear-gradient(135deg,#DAF1DE_0%,#d7e8dd_35%,#cfe1d7_65%,#e5efea_100%)] text-[#163832]",

    shell: dark
      ? "bg-white/[0.03] border border-white/8 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl rounded-[28px]"
      : "bg-white/42 border border-white/45 shadow-[0_18px_45px_rgba(22,56,50,0.10)] backdrop-blur-xl rounded-[28px]",

    card: dark
      ? "bg-[linear-gradient(180deg,rgba(35,83,71,0.58),rgba(11,43,38,0.82))] border border-white/8 shadow-[0_16px_40px_rgba(0,0,0,0.22)] backdrop-blur-xl rounded-[26px]"
      : "bg-white/55 border border-white/50 shadow-[0_14px_34px_rgba(22,56,50,0.10)] backdrop-blur-xl rounded-[26px]",

    cardSoft: dark
      ? "bg-white/[0.04] border border-white/8 rounded-[22px]"
      : "bg-white/50 border border-white/45 rounded-[22px]",

    tableWrap: dark
      ? "border border-white/8 bg-[#0B2B26]/70 rounded-[24px] overflow-hidden"
      : "border border-white/50 bg-white/45 rounded-[24px] overflow-hidden",

    tableHead: dark
      ? "bg-[#051F20]/70 border-b border-white/8 text-[#8EB69B]"
      : "bg-white/45 border-b border-white/50 text-[#235347]",

    rowHover: dark ? "hover:bg-white/[0.035]" : "hover:bg-white/40",

    textMain: dark ? "text-[#DAF1DE]" : "text-[#163832]",
    textMuted: dark ? "text-[#DAF1DE]/68" : "text-[#235347]/82",
    textSoft: dark ? "text-[#8EB69B]/78" : "text-[#235347]/62",

    pill: dark
      ? "bg-[#235347]/70 text-[#DAF1DE] border border-white/8"
      : "bg-white/55 text-[#235347] border border-white/50",

    pillGreen: dark
      ? "bg-[#163832] text-[#DAF1DE] border border-[#8EB69B]/18"
      : "bg-[#e5f1ea] text-[#235347] border border-[#8EB69B]/45",

    pillBlue: dark
      ? "bg-[#0B2B26] text-[#DAF1DE] border border-white/8"
      : "bg-[#eef5f1] text-[#235347] border border-white/50",

    pillAmber: dark
      ? "bg-[#235347] text-[#DAF1DE] border border-white/8"
      : "bg-[#edf5ef] text-[#235347] border border-white/50",

    input: dark
      ? "w-full pl-11 pr-4 py-3.5 rounded-[20px] border border-white/10 bg-white/[0.04] text-[#DAF1DE] placeholder:text-[#8EB69B]/65 outline-none focus:ring-4 focus:ring-[#8EB69B]/10 focus:border-[#8EB69B]/25"
      : "w-full pl-11 pr-4 py-3.5 rounded-[20px] border border-white/55 bg-white/55 text-[#163832] placeholder:text-[#235347]/55 outline-none focus:ring-4 focus:ring-[#8EB69B]/18 focus:border-[#8EB69B]/55",

    buttonPrimary: dark
      ? "border border-[#8EB69B]/80 bg-[linear-gradient(135deg,#8EB69B_0%,#DAF1DE_100%)] text-[#051F20] shadow-[0_10px_24px_rgba(142,182,155,0.22),inset_0_1px_0_rgba(255,255,255,0.24)] hover:brightness-[1.02]"
      : "border border-[#235347]/90 bg-[linear-gradient(135deg,#235347_0%,#3f7a68_100%)] text-white shadow-[0_10px_24px_rgba(35,83,71,0.16),inset_0_1px_0_rgba(255,255,255,0.16)] hover:brightness-[1.02]",

    buttonSecondary: dark
      ? "bg-white/[0.04] text-[#DAF1DE] hover:bg-white/[0.07] border border-white/10"
      : "bg-white/55 text-[#163832] hover:bg-white/75 border border-white/55",

    buttonDanger: "bg-slate-800 text-white hover:bg-slate-700 border border-slate-700",

    iconBox: dark
      ? "h-12 w-12 rounded-[18px] grid place-items-center bg-[#235347]/75 border border-white/8 text-[#DAF1DE]"
      : "h-12 w-12 rounded-[18px] grid place-items-center bg-white/60 border border-white/55 text-[#235347]",

    modal: dark
      ? "bg-[#0B2B26] border border-white/10"
      : "bg-[#f7fbf8] border border-white/60",
  };
}
