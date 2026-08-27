import { NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { anthropic, CHAT_MODEL } from "@/lib/anthropic/client";
import { customTools } from "@/lib/anthropic/tools";
import { executeTool } from "@/lib/anthropic/executeTool";
import { getChatHistory, appendChatMessages } from "@/lib/data";

const SYSTEM_PROMPT = `당신은 스포츠 중계자가 관리하는 MLB, NBA, KBO(및 앞으로 추가될 종목)의 팀/선수 데이터베이스를 관리하는 도우미입니다.

행동 원칙:
1. 팀이나 선수를 수정/조회하기 전에는 항상 search_team 또는 search_player로 먼저 찾아서 정확한 id를 확인하세요. 검색 결과가 여러 개거나 모호하면 사용자에게 확인을 요청하세요.
2. "OO선수 홈런 44개로 업데이트해줘"처럼 단일 수치를 바꾸는 요청은 update_player_stat을 사용하세요 (다른 스탯을 건드리지 않습니다).
3. 이 데이터베이스의 핵심 가치는 실시간 스탯이 아니라 의미 있는 기록을 큐레이션하는 것입니다. add_player_content를 다음 기준으로 분류해서 저장하세요:
   - category='episode': 유년시절/학창시절/데뷔 전후의 특별한 에피소드, 가족·친구·본인 이야기 등 신변잡기적 스토리
   - category='background': 출신 학교, 드래프트 정보, 신체조건, 커리어 기록 등 선수 배경 정보
   - category='stat_record': 특정 기록(예: 54홈런 59도루)이 갖는 역사적 의미나 비교
4. 선수의 기록이 어떤 의미가 있는지 묻거나, 특정 선수의 에피소드/배경을 찾아달라고 하면 먼저 web_search로 조사한 뒤 답변을 요약하고, add_player_content로 출처(source_urls)와 함께 저장하세요. 조사 없이 지어내지 마세요.
5. 새 종목을 추가해달라는 명시적인 요청이 있을 때만 add_sport를 사용하세요.
6. 사용자가 로스터 표(예: "등번호 이름 포지션 생년월일 신장 투타유형 출신학교 드래프트정보"가 한 줄에 한 명씩 있는 여러 줄 텍스트)를 그대로 붙여넣으면, 각 줄을 파싱해서 선수별로 처리하세요. 이미 존재하는 선수일 가능성이 높으므로 이름(및 가능하면 팀)으로 search_player를 먼저 호출해 기존 player_id를 찾고, upsert_player를 player_id와 함께 호출해 bio에 birthdate/height_weight/throws_bats/school/draft_info 등을 병합하세요. 검색되지 않는 새 선수만 신규 생성하세요. 여러 명을 한 번에 처리할 때는 가능한 한 각 단계(검색들, 그 다음 저장들)를 한 턴에 병렬로 요청하세요.
7. 모든 응답은 한국어로, 무엇을 확인/저장했는지 짧고 명확하게 알려주세요. 여러 명을 처리했다면 몇 명을 처리했는지 요약하세요.`;

const WRITE_TOOLS = new Set([
  "update_player_stat",
  "upsert_player",
  "upsert_team",
  "add_sport",
  "add_player_content",
]);

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function GET() {
  const history = await getChatHistory();
  return NextResponse.json({
    messages: history.map((m) => ({ role: m.role, content: m.content })),
  });
}

export async function POST(request: Request) {
  let body: { messages?: ChatMessage[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const incoming = body.messages ?? [];
  if (incoming.length === 0) {
    return NextResponse.json({ error: "messages must be a non-empty array" }, { status: 400 });
  }
  const lastUserMessage = [...incoming].reverse().find((m) => m.role === "user")?.content ?? "";

  const messages: Anthropic.MessageParam[] = incoming.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const tools: Anthropic.Messages.ToolUnion[] = [
    ...customTools,
    { type: "web_search_20260209", name: "web_search", max_uses: 5 },
  ];

  let changed = false;
  let finalText = "";
  // web_search's built-in dynamic filtering runs via a server-side code
  // execution container; once one is assigned, it must be passed back on
  // every subsequent request in this turn or the API rejects the follow-up.
  let containerId: string | undefined;

  try {
    for (let iteration = 0; iteration < 20; iteration++) {
      const response = await anthropic.messages.create({
        model: CHAT_MODEL,
        max_tokens: 12000,
        system: SYSTEM_PROMPT,
        thinking: { type: "adaptive" },
        output_config: { effort: "medium" },
        tools,
        messages,
        ...(containerId ? { container: containerId } : {}),
      });

      if (response.container) containerId = response.container.id;

      if (response.stop_reason === "pause_turn") {
        // Server-side tool (web_search) hit its internal iteration limit — resume.
        messages.push({ role: "assistant", content: response.content });
        continue;
      }

      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
      );

      if (toolUseBlocks.length === 0) {
        finalText = response.content
          .filter((b): b is Anthropic.TextBlock => b.type === "text")
          .map((b) => b.text)
          .join("\n");
        break;
      }

      messages.push({ role: "assistant", content: response.content });

      const results = await Promise.all(
        toolUseBlocks.map((block) => executeTool(block.name, block.input, { userMessage: lastUserMessage })),
      );
      const toolResults: Anthropic.ToolResultBlockParam[] = toolUseBlocks.map((block, i) => {
        const { output, isError } = results[i];
        if (!isError && WRITE_TOOLS.has(block.name)) changed = true;
        return {
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify(output),
          is_error: isError,
        };
      });
      messages.push({ role: "user", content: toolResults });
    }
  } catch (err) {
    console.error("Chat route error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `챗봇 호출 중 오류가 발생했어요: ${message}` },
      { status: 500 },
    );
  }

  const reply = finalText || "(응답을 생성하지 못했어요)";
  await appendChatMessages([
    { role: "user", content: lastUserMessage },
    { role: "assistant", content: reply },
  ]);

  return NextResponse.json({ reply, changed });
}
