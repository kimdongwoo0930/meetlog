'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";

/* ── demo_meeting_short.txt 전체 파싱 (46개 발화) ───────────── */
const DEMO_SEGMENTS = [
  { id: "1", speaker: "박서준", start: 0, end: 37, content: "자, 그럼 여름 신상품 런칭 마케팅 회의 시작하겠습니다. 오늘은 지난 봄 캠페인 성과 먼저 보고, 여름 신상품 캠페인 컨셉이랑 채널별 예산 배분, 마지막으로 인플루언서 협업 방향까지 정하는 걸로 하겠습니다. 먼저 지난 캠페인 성과부터요. 김하늘님 정리해주실 수 있어요?" },
  { id: "2", speaker: "김하늘", start: 38, end: 72, content: "네, 봄 캠페인은 어 전체적으로 목표는 달성했는데요, 채널별로 편차가 좀 컸어요. 인스타그램이 ROAS 4.2로 제일 좋았고, 유튜브가 2.8, 그리고 네이버 검색광고가 3.5 정도 나왔어요. 근데 페이스북은 1.6으로 기대보다 많이 낮았어요." },
  { id: "3", speaker: "박서준", start: 73, end: 77, content: "페이스북이 왜 그렇게 낮았을까요?" },
  { id: "4", speaker: "김하늘", start: 78, end: 98, content: "음 저희 타겟이 20대 초중반인데 페이스북은 이제 그 연령대 사용자가 많이 빠졌더라고요. 광고는 노출됐는데 실제 구매 전환이 거의 안 일어났어요." },
  { id: "5", speaker: "이도현", start: 99, end: 116, content: "맞아요. 제가 데이터 봤을 때도 페이스북 유입은 체류시간도 짧고 장바구니 담기까지 가는 비율이 다른 채널의 절반도 안 됐어요." },
  { id: "6", speaker: "박서준", start: 117, end: 140, content: "그러면 이번 여름 캠페인에서는 페이스북 비중을 줄이는 방향으로 가야겠네요. 일단 그건 예산 얘기할 때 다시 보고요. 김하늘님, 봄 캠페인에서 그 외에 배운 점 있어요?" },
  { id: "7", speaker: "김하늘", start: 141, end: 169, content: "어 숏폼 콘텐츠 반응이 진짜 좋았어요. 인스타 릴스랑 유튜브 쇼츠로 만든 15초짜리 제품 영상이 일반 이미지 광고보다 클릭률이 3배 가까이 높았거든요. 그래서 이번엔 숏폼 비중을 더 늘리면 좋을 것 같아요." },
  { id: "8", speaker: "정유진", start: 170, end: 190, content: "저도 동의해요. 그리고 봄 캠페인 때 어 댓글 이벤트 했던 게 참여율이 엄청 높았잖아요. 그런 참여형 콘텐츠도 이번에 다시 활용하면 좋을 것 같아요." },
  { id: "9", speaker: "김하늘", start: 191, end: 216, content: "맞아요. 댓글로 친구 태그하면 추첨해서 제품 증정하는 이벤트였는데, 그게 자연스럽게 바이럴이 돼서 도달률이 평소의 두 배 넘게 나왔어요. 광고비 안 들이고 유기적 도달이 늘어난 거죠." },
  { id: "10", speaker: "박서준", start: 217, end: 238, content: "오 그거 효과 좋았죠. 참여형 이벤트도 이번 캠페인에 넣는 걸로 메모해두고요. 그럼 이번 여름 캠페인 컨셉 얘기로 넘어가죠. 정유진님이 컨셉 기획 맡으셨죠?" },
  { id: "11", speaker: "정유진", start: 239, end: 267, content: "네, 이번 여름 신상품이 어 쿨링 기능성 의류 라인이잖아요. 그래서 컨셉을 '한여름에도 시원하게'라는 방향으로 잡았고요. 키 메시지는 '입는 순간 에어컨'으로 정했어요. 좀 직관적이고 기억에 남는 카피로요." },
  { id: "12", speaker: "이도현", start: 268, end: 282, content: "입는 순간 에어컨 좋네요. 근데 그거 경쟁사에서 비슷한 카피 쓴 적 없나요? 확인이 필요할 것 같아요." },
  { id: "13", speaker: "정유진", start: 283, end: 303, content: "아 그 부분 법무팀에 상표 검색 요청해놨어요. 다음 주 초에 회신 온다고 했고요. 혹시 문제 있으면 '에어컨 입었다' 같은 변형 카피도 준비해뒀어요." },
  { id: "14", speaker: "박서준", start: 304, end: 309, content: "좋아요. 그럼 컨셉 비주얼은 어떻게 가요?" },
  { id: "15", speaker: "정유진", start: 310, end: 331, content: "비주얼은 어 청량한 워터 컬러랑 민트 계열로 통일하고요. 모델이 더운 야외에서 시원하게 활동하는 장면을 담을 거예요. 촬영은 다음 주 수요일에 잡혀 있어요." },
  { id: "16", speaker: "이도현", start: 332, end: 342, content: "모델 섭외는 끝났나요? 여름 캠페인이라 활동적인 이미지가 중요할 것 같은데요." },
  { id: "17", speaker: "정유진", start: 343, end: 371, content: "네, 모델은 이미 섭외 완료했어요. 평소 운동이나 아웃도어 활동 콘텐츠 많이 올리는 분이라 컨셉이랑 잘 맞아요. 그리고 촬영 때 제품 기능을 보여주는 컷이랑 일상 착용 컷 둘 다 찍어서 활용도를 높이려고요." },
  { id: "18", speaker: "박서준", start: 372, end: 410, content: "좋네요. 촬영 결과물은 캠페인 전반에 다 쓰일 테니 다양하게 찍어두는 게 맞아요. 알겠습니다. 컨셉은 '입는 순간 에어컨'으로 확정하고, 상표 이슈만 다음 주 초에 확인하는 걸로 하죠. 자 그럼 제일 중요한 채널별 예산 배분 얘기 해봅시다. 이번 캠페인 총 예산이 8천만원이죠?" },
  { id: "19", speaker: "김하늘", start: 411, end: 426, content: "네 맞아요. 8천만원이에요. 봄 캠페인 성과 기준으로 보면 인스타그램에 제일 많이 배분하는 게 맞을 것 같아요." },
  { id: "20", speaker: "박서준", start: 427, end: 453, content: "제 생각엔 인스타그램 40%, 그러니까 3200만원 정도. 유튜브는 숏폼 강화하니까 25%, 2000만원. 네이버 검색광고 20%, 1600만원. 이렇게 가면 어떨까요? 페이스북은 줄이고요." },
  { id: "21", speaker: "이도현", start: 454, end: 479, content: "페이스북은 아예 빼는 건 좀 아쉬울 수 있어요. 리타겟팅 용도로 최소한만 남기면 어떨까요? 한 5% 정도, 400만원이요. 기존 구매 고객 대상 리타겟팅은 페이스북도 효율이 괜찮거든요." },
  { id: "22", speaker: "김하늘", start: 480, end: 506, content: "어 리타겟팅은 저도 동의해요. 봄 캠페인 데이터 보면 페이스북 신규 유입은 별로였는데 리타겟팅 전환율은 나쁘지 않았거든요. 이미 한번 관심 보인 고객한테 다시 노출하는 건 효율이 좋아요." },
  { id: "23", speaker: "박서준", start: 507, end: 530, content: "아 리타겟팅이면 얘기가 다르죠. 좋아요. 그럼 페이스북 5% 남기고요. 그러면 인스타 40, 유튜브 25, 네이버 20, 페이스북 5 해서 90%네요. 남은 10%는요?" },
  { id: "24", speaker: "정유진", start: 531, end: 545, content: "남은 10%는 인플루언서 협업에 쓰면 좋겠어요. 800만원이요. 이번에 숏폼 강화하는 거랑도 잘 맞고요." },
  { id: "25", speaker: "박서준", start: 546, end: 570, content: "좋습니다. 그럼 예산은 인스타그램 3200, 유튜브 2000, 네이버 1600, 페이스북 400, 인플루언서 800으로 확정하겠습니다. 마지막으로 인플루언서 협업 방향 얘기하죠." },
  { id: "26", speaker: "정유진", start: 571, end: 602, content: "인플루언서는 어 메가 인플루언서 한 명보다 마이크로 인플루언서 여러 명으로 가는 게 좋을 것 같아요. 팔로워 1만에서 5만 정도 되는 분들이 참여율도 높고 비용 대비 효율이 좋거든요. 한 8명에서 10명 정도 섭외하려고 해요." },
  { id: "27", speaker: "이도현", start: 603, end: 619, content: "동의해요. 마이크로 인플루언서가 진정성 있는 후기 느낌이 나서 전환율도 더 좋아요. 근데 섭외 기준은 어떻게 잡을까요?" },
  { id: "28", speaker: "정유진", start: 620, end: 643, content: "어 일단 패션이나 라이프스타일 카테고리에서 활동하시는 분들 중심으로요. 그리고 평소 콘텐츠 톤이 저희 브랜드랑 맞는지 보고요. 참여율이 3% 이상인 분들로 추리려고 해요." },
  { id: "29", speaker: "김하늘", start: 644, end: 669, content: "참여율 3% 기준 좋아요. 그리고 어 가짜 팔로워 비율도 꼭 체크해야 해요. 팔로워는 많은데 실제 참여가 없는 분들이 있거든요. 인플루언서 분석 툴로 미리 걸러내면 좋을 것 같아요." },
  { id: "30", speaker: "정유진", start: 670, end: 689, content: "맞아요. 분석 툴로 팔로워 진성도 확인하고요. 그리고 과거에 경쟁사 광고를 많이 한 분들은 제외하려고요. 브랜드 이미지가 섞이면 안 되니까요." },
  { id: "31", speaker: "박서준", start: 690, end: 696, content: "좋은 기준이네요. 섭외 일정은 어떻게 되나요?" },
  { id: "32", speaker: "정유진", start: 697, end: 715, content: "이번 주 안에 후보 리스트업 하고요, 다음 주에 컨택 시작해서 그 다음 주부터 콘텐츠 제작 들어가면 캠페인 시작에 맞출 수 있어요." },
  { id: "33", speaker: "김하늘", start: 716, end: 743, content: "인플루언서 콘텐츠는 제품 받고 직접 입어본 후기 형식으로 가는 게 좋겠어요. 광고 같은 느낌보다는요. 그리고 할인 코드도 인플루언서별로 다르게 줘서 어떤 분이 성과가 좋은지 추적하면 좋을 것 같아요." },
  { id: "34", speaker: "박서준", start: 744, end: 767, content: "오 인플루언서별 할인 코드 추적 좋네요. 성과 측정도 되고요. 그럼 그렇게 진행하죠. 다음으로 SNS 콘텐츠 일정 얘기해봅시다. 김하늘님이 콘텐츠 캘린더 짜고 계시죠?" },
  { id: "35", speaker: "김하늘", start: 768, end: 795, content: "네, 캠페인 시작 2주 전부터 티저 콘텐츠 올리려고요. 어 처음 일주일은 제품을 직접 보여주지 않고 '곧 시원한 게 온다' 같은 호기심 유발 콘텐츠로 가고요. 그 다음 주에 제품 공개하는 식으로요." },
  { id: "36", speaker: "정유진", start: 796, end: 810, content: "티저 좋네요. 근데 티저 너무 길게 끌면 사람들이 지칠 수 있어요. 일주일 정도가 적당할 것 같아요." },
  { id: "37", speaker: "김하늘", start: 811, end: 840, content: "맞아요. 그래서 티저는 딱 일주일만 하고 바로 제품 공개로 넘어가려고요. 그리고 본 캠페인 기간에는 어 주 3회 정도 콘텐츠를 올릴 계획이에요. 월수금으로요. 릴스랑 쇼츠 위주로 하고 사이사이 카드뉴스 넣고요." },
  { id: "38", speaker: "이도현", start: 841, end: 852, content: "주 3회면 콘텐츠 제작 리소스는 충분한가요? 숏폼은 편집에 시간이 꽤 걸리잖아요." },
  { id: "39", speaker: "김하늘", start: 853, end: 872, content: "어 그 부분이 좀 빠듯한데요, 외주 편집자 한 명 추가로 붙이면 가능할 것 같아요. 편집 외주 비용은 콘텐츠 제작비에서 충당하면 되고요." },
  { id: "40", speaker: "박서준", start: 873, end: 904, content: "외주 편집자 추가하는 거 좋아요. 그럼 김하늘님이 콘텐츠 캘린더 최종본을 이번 주 금요일까지 공유해주시고요, 외주 편집자 섭외도 같이 진행해주세요. 마지막 안건이네요. 오프라인 팝업 이벤트 검토예요. 이건 이도현님이 제안하셨죠?" },
  { id: "41", speaker: "이도현", start: 905, end: 930, content: "네, 제가 제안한 건데요. 여름이니까 어 핫플레이스에 쿨링 체험 팝업 부스를 운영하면 어떨까 해서요. 성수동이나 한강 쪽에요. 실제로 제품을 입어보고 시원함을 체험하게 하는 거죠." },
  { id: "42", speaker: "정유진", start: 931, end: 947, content: "오프라인 체험은 확실히 전환율이 높긴 한데요, 비용이 만만치 않을 것 같아요. 부스 설치비에 인건비에 장소 대관료까지요." },
  { id: "43", speaker: "이도현", start: 948, end: 968, content: "맞아요. 그래서 제가 대략 견적을 뽑아봤는데 일주일 운영에 한 1500만원 정도 들 것 같아요. 근데 이게 이번 캠페인 예산에는 안 잡혀 있어서요." },
  { id: "44", speaker: "박서준", start: 969, end: 1002, content: "음 1500만원이면 적은 돈이 아니네요. 이번 캠페인 예산에 추가로 넣기는 어려울 것 같고요. 팝업은 좀 더 검토가 필요할 것 같아요. 이도현님이 ROI 예측이랑 상세 견적을 좀 더 정리해주시면, 다음 회의에서 별도 예산 편성할지 결정하죠." },
  { id: "45", speaker: "이도현", start: 1003, end: 1016, content: "네 알겠습니다. 그럼 제가 팝업 ROI 분석이랑 상세 견적서를 다음 주까지 정리해서 공유드릴게요." },
  { id: "46", speaker: "박서준", start: 1017, end: 1107, content: "좋습니다. 자 오늘 회의 정리하겠습니다. 여름 캠페인 컨셉은 '입는 순간 에어컨'으로 확정, 상표 이슈는 정유진님이 다음 주 초 법무팀 회신 확인. 예산은 인스타그램 3200만원, 유튜브 2000만원, 네이버 검색광고 1600만원, 페이스북 리타겟팅 400만원, 인플루언서 800만원으로 배분. 인플루언서는 마이크로 인플루언서 8에서 10명을 정유진님이 이번 주 리스트업해서 다음 주 컨택, 인플루언서별 할인 코드로 성과 추적. SNS 콘텐츠는 김하늘님이 콘텐츠 캘린더 금요일까지 공유하고 외주 편집자 섭외. 오프라인 팝업은 이도현님이 ROI 분석이랑 견적서 다음 주까지 정리해서 다음 회의에서 별도 예산 편성 여부 결정. 다들 수고하셨습니다." },
];

const SPEAKER_COLORS: Record<string, { bg: string; text: string }> = {
  "박서준": { bg: "#eff6ff", text: "#2563eb" },
  "김하늘": { bg: "#f0fdf4", text: "#16a34a" },
  "정유진": { bg: "#fdf4ff", text: "#7c3aed" },
  "이도현": { bg: "#fffbeb", text: "#d97706" },
};

function fmt(sec: number) {
  return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
}

export default function DemoSttPage() {
  const router = useRouter();
  const [segments, setSegments] = useState(DEMO_SEGMENTS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [generating, setGenerating] = useState(false);

  const handleEditStart = (seg: typeof segments[0]) => {
    setEditingId(seg.id);
    setEditContent(seg.content);
  };

  const handleEditSave = (seg: typeof segments[0]) => {
    const trimmed = editContent.trim();
    if (trimmed && trimmed !== seg.content) {
      setSegments(prev => prev.map(s => s.id === seg.id ? { ...s, content: trimmed } : s));
    }
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    setSegments(prev => prev.filter(s => s.id !== id));
  };

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => router.push("/meetings/demo-marketing-stages"), 2800);
  };

  if (generating) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f9f8f6", gap: 28 }}>
        <div style={{ position: "relative", width: 72, height: 72 }}>
          <svg viewBox="0 0 72 72" fill="none" width="72" height="72" style={{ animation: "spin 1.2s linear infinite", position: "absolute", inset: 0 }}>
            <circle cx="36" cy="36" r="30" stroke="#e8e5de" strokeWidth="5"/>
            <circle cx="36" cy="36" r="30" stroke="#2563eb" strokeWidth="5" strokeDasharray="60 130" strokeLinecap="round"/>
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
              <path d="M12 3l1.5 4.5H18l-3.5 2.5 1.5 4.5L12 12l-4 2.5 1.5-4.5L6 7.5h4.5L12 3z" stroke="#2563eb" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: "#1a1916", marginBottom: 8 }}>회의록 생성 중입니다</div>
          <div style={{ fontSize: 13, color: "#a8a49e" }}>AI가 회의 내용을 분석하고 있습니다</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#2563eb", animation: `dotpulse 1.2s ease ${i * 0.2}s infinite` }} />
          ))}
        </div>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes dotpulse { 0%,100%{opacity:0.25;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f9f8f6", display: "flex", flexDirection: "column" }}>
      {/* 헤더 */}
      <div style={{
        background: "#fff", borderBottom: "1px solid #e8e5de",
        padding: "0 32px", height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 40,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => router.push("/meetings")}
            style={{ padding: "6px 14px", fontSize: 13, borderRadius: 7, border: "1px solid #e8e5de", background: "transparent", color: "#6b6760", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}
          >
            <svg viewBox="0 0 12 12" fill="none" width="11" height="11"><path d="M7 2L3 6l4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            목록으로
          </button>
          <div style={{ width: 1, height: 18, background: "#e8e5de" }} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1916" }}>STT 검토</div>
            <div style={{ fontSize: 12, color: "#6b6760", marginTop: 1 }}>여름 신상품 런칭 마케팅 캠페인</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 13, color: "#a8a49e" }}>총 {segments.length}개 발화 · 약 18분</div>
          <button
            onClick={handleGenerate}
            style={{ padding: "8px 20px", fontSize: 13.5, fontWeight: 600, borderRadius: 8, background: "#2563eb", color: "#fff", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7 }}
          >
            <svg viewBox="0 0 14 14" fill="none" width="13" height="13"><path d="M7 1l1.5 3.5H12l-3 2 1.5 3.5L7 8 3.5 10 5 6.5 2 4.5h3.5L7 1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
            회의록 생성
          </button>
        </div>
      </div>

      {/* 안내 */}
      <div style={{ background: "#fffbeb", borderBottom: "1px solid #fde68a", padding: "10px 32px", display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#92400e" }}>
        <svg viewBox="0 0 14 14" fill="none" width="14" height="14"><circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2"/><path d="M7 6v4M7 4.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
        STT 오인식 또는 불필요한 발화를 수정·삭제한 후 <strong style={{ margin: "0 3px" }}>회의록 생성</strong>을 눌러주세요.
      </div>

      {/* 세그먼트 목록 */}
      <div style={{ flex: 1, padding: "24px 32px", maxWidth: 900, width: "100%" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {segments.map(seg => {
            const color = SPEAKER_COLORS[seg.speaker] ?? { bg: "#f5f5f5", text: "#555" };
            const isEditing = editingId === seg.id;

            return (
              <div key={seg.id} style={{
                background: "#fff", border: `1px solid ${isEditing ? "#2563eb" : "#e8e5de"}`,
                borderRadius: 10, padding: "12px 14px",
                transition: "border-color 0.15s",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <div style={{ background: color.bg, color: color.text, borderRadius: 999, padding: "2px 9px", fontSize: 12, fontWeight: 600 }}>{seg.speaker}</div>
                  <span style={{ fontSize: 11, color: "#a8a49e", fontFamily: "monospace" }}>{fmt(seg.start)} — {fmt(seg.end)}</span>
                  <div style={{ flex: 1 }} />
                  {!isEditing && (
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => handleEditStart(seg)} style={{ padding: "2px 8px", fontSize: 11.5, borderRadius: 5, border: "1px solid #e8e5de", background: "transparent", color: "#6b6760", cursor: "pointer" }}>수정</button>
                      <button onClick={() => handleDelete(seg.id)} style={{ padding: "2px 8px", fontSize: 11.5, borderRadius: 5, border: "1px solid #fecaca", background: "transparent", color: "#ef4444", cursor: "pointer" }}>삭제</button>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div>
                    <textarea value={editContent} onChange={e => setEditContent(e.target.value)} autoFocus style={{ width: "100%", minHeight: 68, padding: "8px 12px", fontSize: 13.5, lineHeight: 1.65, fontFamily: "inherit", border: "1px solid #2563eb", borderRadius: 7, outline: "none", resize: "vertical", boxSizing: "border-box", background: "#f8fbff" }} />
                    <div style={{ display: "flex", gap: 6, marginTop: 6, justifyContent: "flex-end" }}>
                      <button onClick={() => setEditingId(null)} style={{ padding: "4px 12px", fontSize: 12.5, borderRadius: 6, border: "1px solid #e8e5de", background: "transparent", color: "#6b6760", cursor: "pointer" }}>취소</button>
                      <button onClick={() => handleEditSave(seg)} style={{ padding: "4px 14px", fontSize: 12.5, borderRadius: 6, border: "none", background: "#2563eb", color: "#fff", cursor: "pointer", fontWeight: 500 }}>저장</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 13.5, color: "#1a1916", lineHeight: 1.65 }}>{seg.content}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
