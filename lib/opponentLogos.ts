type OpponentLogoRule = {
  aliases: string[];
  src: string;
};

// Keep the most specific aliases first: "메이슨바이퍼스" must win before "바이퍼즈".
const OPPONENT_LOGO_RULES: OpponentLogoRule[] = [
  { aliases: ["메이슨바이퍼스", "조지메이슨"], src: "/opponents/mason-vipers.png" },
  { aliases: ["team송도", "송도"], src: "/opponents/team-songdo.png" },
  { aliases: ["육군사관학교", "육사"], src: "/opponents/yuksa.png" },
  { aliases: ["teamipa", "ipa"], src: "/opponents/team-ipa.png" },
  { aliases: ["team곤지암", "곤지암", "팀업"], src: "/opponents/teamup-gonjiam.png" },
  { aliases: ["인하대jade", "jade"], src: "/opponents/inha-jade.png" },
  { aliases: ["매지션즈"], src: "/opponents/magicians.png" },
  { aliases: ["바이퍼즈"], src: "/opponents/vipers-2023.png" },
  { aliases: ["에이포스"], src: "/opponents/aforce.png" },
  { aliases: ["국민대윈드밀스", "윈드밀스"], src: "/opponents/kmu-windmills.png" },
  { aliases: ["충북대타우르스", "타우르스"], src: "/opponents/chungbuk-taurus.png" },
  { aliases: ["team선학", "선학"], src: "/opponents/team-seonhak.png" },
  { aliases: ["team시흥", "시흥"], src: "/opponents/team-siheung.png" },
  { aliases: ["서원대흑마", "흑마"], src: "/opponents/seowon-heukma.png" },
  { aliases: ["청주대나인파이터스", "나인파이터스"], src: "/opponents/cheongju-ninefighters.png" },
  { aliases: ["skippers"], src: "/opponents/skippers.png" },
  { aliases: ["thunderbolt", "썬더볼트"], src: "/opponents/thunderbolt.png" },
  { aliases: ["다이아몬드에이스"], src: "/opponents/diamond-ace.png" },
  { aliases: ["한국공학대위너스", "위너스"], src: "/opponents/tukorea-winners.png" },
];

export function normalizeOpponentName(name: string): string {
  return name.replace(/\s+/g, "").toLocaleLowerCase();
}

export function getOpponentLogo(opponent: string): string | undefined {
  const normalizedOpponent = normalizeOpponentName(opponent);
  return OPPONENT_LOGO_RULES.find((rule) =>
    rule.aliases.some((alias) => normalizedOpponent.includes(normalizeOpponentName(alias)))
  )?.src;
}

export function getTeamInitials(name: string): string {
  const normalized = name.replace(/\s+/g, "").toLocaleUpperCase();
  return normalized.slice(0, 2) || "?";
}
