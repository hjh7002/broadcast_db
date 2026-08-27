export type CoachEntry = { role: string; name: string; since: number | null };
export type InjuredPlayer = {
  name: string;
  position: string;
  injury: string;
  injuryKo: string;
  ilDate: string | null;
  ilType: string;
};

const IL_TYPE_LABELS: Record<string, string> = { D7: "7IL", D10: "10IL", D15: "15IL", D60: "60IL" };

const SIDE_KO: Record<string, string> = { left: "좌측", right: "우측", bilateral: "양쪽" };
const BODY_PART_KO: Record<string, string> = {
  lat: "광배근", hamstring: "햄스트링", elbow: "팔꿈치", shoulder: "어깨", oblique: "복사근",
  glute: "둔근", groin: "서혜부", knee: "무릎", ankle: "발목", wrist: "손목", forearm: "전완근",
  back: "허리", neck: "목", calf: "종아리", hip: "고관절", quad: "대퇴사두근", quadriceps: "대퇴사두근",
  thumb: "엄지손가락", finger: "손가락", rib: "갈비뼈", hand: "손", foot: "발", achilles: "아킬레스건",
  bicep: "이두근", biceps: "이두근", tricep: "삼두근", triceps: "삼두근", patella: "슬개골",
  hamstrings: "햄스트링", intercostal: "늑간근", adductor: "내전근", flexor: "굴곡근", ucl: "팔꿈치 인대(UCL)",
};
const CONDITION_KO: Record<string, string> = {
  strain: "부상(스트레인)", sprain: "염좌", inflammation: "염증", impingement: "충돌증후군",
  tightness: "긴장", soreness: "통증", fracture: "골절", tear: "파열", contusion: "타박상",
  surgery: "수술", concussion: "뇌진탕", tendinitis: "건염", bursitis: "점액낭염",
};

// MLB injured-list notes are fairly formulaic ("Left lat strain.", "Tommy John surgery.")
// so a word-substitution dictionary covers the common cases; anything it can't confidently
// map through falls back to just echoing the English note as the "translation."
function translateInjury(note: string): string {
  const cleaned = note.trim().replace(/\.$/, "");
  if (!cleaned) return "";
  if (/tommy john/i.test(cleaned)) return "토미 존 수술";

  const words = cleaned.split(/\s+/);
  const last = words[words.length - 1]?.toLowerCase();
  const condition = CONDITION_KO[last];
  if (!condition) return cleaned;

  const rest = words.slice(0, -1);
  let side = "";
  let bodyWords = rest;
  if (rest.length > 0 && SIDE_KO[rest[0].toLowerCase()]) {
    side = SIDE_KO[rest[0].toLowerCase()];
    bodyWords = rest.slice(1);
  }
  const bodyKey = bodyWords.join(" ").toLowerCase();
  const body = BODY_PART_KO[bodyKey] ?? BODY_PART_KO[bodyWords[bodyWords.length - 1]?.toLowerCase()];
  if (bodyWords.length > 0 && !body) return cleaned;

  return `${side}${body ?? ""} ${condition}`.trim();
}

const COACH_JOB_LABELS: Record<string, string> = {
  MNGR: "감독",
  COAB: "벤치코치",
  COAP: "투수코치",
  COAT: "타격코치",
  COA1: "1루 베이스 코치",
  COA3: "3루 베이스 코치",
};
const COACH_ORDER = ["MNGR", "COAB", "COAP", "COAT", "COA1", "COA3"];

async function mlbGet(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  return res.json();
}

async function coachHoldsJobInSeason(teamMlbId: number, jobId: string, personId: number, season: number): Promise<boolean> {
  try {
    const data = await mlbGet(`https://statsapi.mlb.com/api/v1/teams/${teamMlbId}/roster?rosterType=coach&season=${season}`);
    const roster: { jobId: string; person: { id: number } }[] = data.roster || [];
    return roster.some((r) => r.jobId === jobId && r.person.id === personId);
  } catch {
    return false;
  }
}

// Binary-searches for the earliest season this person has continuously held this exact
// coaching job on this team (the roster-by-season endpoint is a point-in-time snapshot,
// there's no direct "tenure" field) — assumes no gaps/rehires, which covers the normal case.
async function findTenureStartYear(teamMlbId: number, jobId: string, personId: number, currentYear: number): Promise<number | null> {
  const floor = currentYear - 15;
  if (!(await coachHoldsJobInSeason(teamMlbId, jobId, personId, currentYear))) return null;
  let lo = floor;
  let hi = currentYear;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (await coachHoldsJobInSeason(teamMlbId, jobId, personId, mid)) {
      hi = mid;
    } else {
      lo = mid + 1;
    }
  }
  return lo;
}

export async function getCoachingStaff(teamMlbId: number): Promise<CoachEntry[]> {
  try {
    const currentYear = new Date().getFullYear();
    const data = await mlbGet(`https://statsapi.mlb.com/api/v1/teams/${teamMlbId}/roster?rosterType=coach`);
    const roster: { jobId: string; person: { id: number; fullName: string } }[] = data.roster || [];
    const byJobId = new Map(roster.map((r) => [r.jobId, r]));
    const staff = COACH_ORDER.filter((id) => byJobId.has(id)).map((id) => byJobId.get(id)!);

    const sinceYears = await Promise.all(
      staff.map((c) => findTenureStartYear(teamMlbId, c.jobId, c.person.id, currentYear)),
    );

    return staff.map((c, i) => ({
      role: COACH_JOB_LABELS[c.jobId],
      name: c.person.fullName,
      since: sinceYears[i],
    }));
  } catch {
    return [];
  }
}

export async function getInjuredList(teamMlbId: number): Promise<InjuredPlayer[]> {
  try {
    const rosterData = await mlbGet(`https://statsapi.mlb.com/api/v1/teams/${teamMlbId}/roster?rosterType=40Man`);
    type RosterEntry = {
      person: { id: number; fullName: string };
      position?: { abbreviation?: string };
      note?: string;
      status?: { code?: string };
    };
    const ilEntries = ((rosterData.roster || []) as RosterEntry[]).filter((r) =>
      ["D7", "D10", "D15", "D60"].includes(r.status?.code ?? ""),
    );
    if (ilEntries.length === 0) return [];

    // Injury descriptions come straight off the roster entry's `note`; the IL *date*
    // isn't in the roster payload though, so it's cross-referenced from the team's
    // transaction log (the "placed ... on the ... injured list" entry for that player).
    const today = new Date().toISOString().slice(0, 10);
    const start = new Date();
    start.setMonth(start.getMonth() - 8);
    const startStr = start.toISOString().slice(0, 10);
    const txData = await mlbGet(
      `https://statsapi.mlb.com/api/v1/transactions?teamId=${teamMlbId}&startDate=${startStr}&endDate=${today}`,
    );
    type Transaction = { person?: { id: number }; description?: string; date: string; effectiveDate?: string };
    const transactions: Transaction[] = txData.transactions || [];

    return ilEntries.map((r) => {
      const placements = transactions
        .filter((t) => t.person?.id === r.person.id && /injured list/i.test(t.description || ""))
        .sort((a, b) => (a.date < b.date ? 1 : -1));
      const latest = placements[0];
      return {
        name: r.person.fullName,
        position: r.position?.abbreviation ?? "",
        injury: r.note || "",
        injuryKo: r.note ? translateInjury(r.note) : "",
        ilDate: latest?.effectiveDate ?? latest?.date ?? null,
        ilType: IL_TYPE_LABELS[r.status?.code ?? ""] ?? (r.status?.code ?? ""),
      };
    });
  } catch {
    return [];
  }
}
