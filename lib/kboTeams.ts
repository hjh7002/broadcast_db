// Naver Sports uses each KBO team's short (often historical) 2-letter code.
// Maps those to the Korean team name convention stored in our `teams` table.
export const KBO_CODE_TO_KOREAN_NAME: Record<string, string> = {
  SK: "SSG 랜더스",
  HH: "한화 이글스",
  LT: "롯데 자이언츠",
  LG: "LG 트윈스",
  NC: "NC 다이노스",
  KT: "KT 위즈",
  OB: "두산 베어스",
  WO: "키움 히어로즈",
  SS: "삼성 라이온즈",
  HT: "KIA 타이거즈",
};

export function koreanNameForKboCode(code: string): string {
  return KBO_CODE_TO_KOREAN_NAME[code] ?? code;
}
