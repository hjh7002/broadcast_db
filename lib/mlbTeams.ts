// Korean team name (as stored in our `teams` table) -> official MLB Stats API numeric team id.
// Used only to look up live game data; not stored in the DB itself.
export const KOREAN_NAME_TO_MLB_ID: Record<string, number> = {
  "엘에이 에인절스": 108, "LA 에인절스": 108,
  "애리조나 다이아몬드백스": 109,
  "볼티모어 오리올스": 110,
  "보스턴 레드삭스": 111,
  "시카고 컵스": 112,
  "신시내티 레즈": 113,
  "클리블랜드 가디언스": 114,
  "콜로라도 로키스": 115,
  "디트로이트 타이거스": 116,
  "휴스턴 애스트로스": 117,
  "캔자스시티 로열스": 118,
  "LA 다저스": 119,
  "워싱턴 내셔널스": 120,
  "뉴욕 메츠": 121,
  "애슬레틱스": 133,
  "피츠버그 파이리츠": 134,
  "샌디에이고 파드리스": 135,
  "시애틀 매리너스": 136,
  "샌프란시스코 자이언츠": 137,
  "세인트루이스 카디널스": 138,
  "탬파베이 레이스": 139,
  "텍사스 레인저스": 140,
  "토론토 블루제이스": 141,
  "미네소타 트윈스": 142,
  "필라델피아 필리스": 143,
  "애틀랜타 브레이브스": 144,
  "시카고 화이트삭스": 145,
  "마이애미 말린스": 146,
  "뉴욕 양키스": 147,
  "밀워키 브루어스": 158,
};

export function mlbTeamIdForName(name: string): number | null {
  return KOREAN_NAME_TO_MLB_ID[name] ?? null;
}

const MLB_ID_TO_KOREAN_NAME: Record<number, string> = {};
for (const [name, id] of Object.entries(KOREAN_NAME_TO_MLB_ID)) {
  if (!MLB_ID_TO_KOREAN_NAME[id]) MLB_ID_TO_KOREAN_NAME[id] = name;
}

export function koreanNameForMlbTeamId(id: number): string {
  return MLB_ID_TO_KOREAN_NAME[id] ?? String(id);
}

export const MLB_ID_TO_SHORT: Record<number, string> = {
  108: "LAA", 109: "AZ", 110: "BAL", 111: "BOS", 112: "CHC", 113: "CIN", 114: "CLE", 115: "COL",
  116: "DET", 117: "HOU", 118: "KC", 119: "LAD", 120: "WSH", 121: "NYM", 133: "ATH", 134: "PIT",
  135: "SD", 136: "SEA", 137: "SF", 138: "STL", 139: "TB", 140: "TEX", 141: "TOR", 142: "MIN",
  143: "PHI", 144: "ATL", 145: "CWS", 146: "MIA", 147: "NYY", 158: "MIL",
};

export function shortNameForMlbTeamId(id: number): string {
  return MLB_ID_TO_SHORT[id] ?? String(id);
}

export const MLB_ID_TO_DIVISION: Record<number, string> = {
  147: "AL East", 111: "AL East", 141: "AL East", 139: "AL East", 110: "AL East",
  142: "AL Central", 114: "AL Central", 116: "AL Central", 118: "AL Central", 145: "AL Central",
  117: "AL West", 136: "AL West", 140: "AL West", 108: "AL West", 133: "AL West",
  121: "NL East", 144: "NL East", 143: "NL East", 146: "NL East", 120: "NL East",
  158: "NL Central", 112: "NL Central", 138: "NL Central", 113: "NL Central", 134: "NL Central",
  119: "NL West", 135: "NL West", 137: "NL West", 109: "NL West", 115: "NL West",
};

export function sameDivision(teamIdA: number, teamIdB: number): boolean {
  const a = MLB_ID_TO_DIVISION[teamIdA];
  const b = MLB_ID_TO_DIVISION[teamIdB];
  return Boolean(a && b && a === b);
}
