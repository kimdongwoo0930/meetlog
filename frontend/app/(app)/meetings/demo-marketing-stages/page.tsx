'use client';

import Link from "next/link";

/* ── 실제 precompute 결과 (demo_results_marketing.json) ─────── */
const CHUNKS = [
  { index: 1, chars: 3472, preview: "박서준: 자, 그럼 여름 신상품 런칭 마케팅 회의 시작하겠습니다. … 봄 캠페인 성과, 컨셉 확정, 채널별 예산 배분까지 … 페이스북 5% 남기고요. 그러면 인스타 40, 유튜브 25, 네이버 20, 페이스북 5 해서 90%네요. 남은 10%는요?" },
  { index: 2, chars: 1184, preview: "정유진: 남은 10%는 인플루언서 협업에 쓰면 좋겠어요. … 인플루언서별 할인 코드 추적 … SNS 콘텐츠 일정 … 오프라인 팝업 검토 … 자 오늘 회의 정리하겠습니다." },
];

const MAP_NOTES = [
`[결정]
- 컨셉: '입는 순간 에어컨'
- 예산 배분: 인스타그램 40% (3200만원), 유튜브 25% (2000만원),
  네이버 검색광고 20% (1600만원), 페이스북 5% (400만원),
  인플루언서 협업 10% (800만원)
- 인플루언서: 메가 인플루언서 대신 마이크로 인플루언서 8~10명 섭외
- 페이스북: 리타겟팅 용도로 최소한만 사용 (5%)
- SNS 콘텐츠 일정: 캠페인 시작 2주 전부터 티저 콘텐츠,
  제품 공개는 바로 다음 주
- 인플루언서별 할인 코드 제공하여 성과 추적`,

`[결정]
- 여름 캠페인 컨셉은 '입는 순간 에어컨'으로 확정
- 상표 이슈는 정유진님이 다음 주 초 법무팀 회신 확인

[할일]
- 인플루언서 8~10명 리스트업하고 다음 주 컨택 — 정유진
- SNS 콘텐츠 제작 리소스 확인, 외주 편집자 추가 — 김하늘
- 콘텐츠 캘린더 최종본 이번 주 금요일까지 공유 — 김하늘
- 오프라인 팝업 ROI 분석과 견적서 다음 주까지 정리 — 이도현`,
];

const FINAL = {
  summary: "여름 신상품 쿨링 기능성 의류 라인의 런칭 마케팅 캠페인 컨셉과 채널별 예산 배분을 확정했다. 봄 캠페인 성과 분석을 바탕으로 인스타그램을 중심으로 총 8천만원을 배분하고, 마이크로 인플루언서 협업과 SNS 콘텐츠 일정을 정했으며 오프라인 팝업 이벤트는 추가 검토하기로 했다.",
  decisions: [
    "여름 캠페인 컨셉을 '입는 순간 에어컨'으로 확정",
    "총 예산 8천만원 배분 — 인스타그램 3,200만원 / 유튜브 2,000만원 / 네이버 1,600만원 / 페이스북 400만원 / 인플루언서 800만원",
    "페이스북은 기존 고객 리타겟팅 용도로만 운영",
    "인플루언서는 마이크로 인플루언서 8~10명, 할인 코드로 성과 추적",
    "SNS 콘텐츠는 티저 1주 후 제품 공개, 본 캠페인 주 3회 발행",
  ],
  todos: 5,
  questions: 1,
};

function StageHeader({ num, label, sub, color }: { num: string; label: string; sub: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
      <div style={{ width: 36, height: 36, borderRadius: 9, background: color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, flexShrink: 0 }}>{num}</div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>{label}</div>
        <div style={{ fontSize: 12.5, color: "var(--text-tertiary)" }}>{sub}</div>
      </div>
    </div>
  );
}

function Arrow() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
      <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
        <path d="M12 4v16M6 14l6 6 6-6" stroke="#a8a49e" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

export default function DemoMarketingStagesPage() {
  return (
    <>
      <div style={{
        background: "var(--surface)", borderBottom: "1px solid var(--border)",
        padding: "0 28px", height: 52,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 40,
      }}>
        <div style={{ fontSize: 13, color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: 6 }}>
          <Link href="/meetings" style={{ color: "var(--text-tertiary)", textDecoration: "none" }}>회의 목록</Link>
          <span>›</span>
          <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>여름 마케팅 회의 — AI 처리 단계</span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999, background: "#faf5ff", color: "#9333ea", border: "1px solid #e9d5ff" }}>중간 단계</span>
      </div>

      <div style={{ padding: 28, maxWidth: 880, margin: "0 auto", width: "100%" }}>

        {/* 파이프라인 요약 */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 20px", marginBottom: 28, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", fontSize: 13 }}>
          {[
            { t: "STT 전사", s: "4,702자" },
            { t: "청크 분할", s: "3,500자 기준 · 2구간" },
            { t: "MAP", s: "qwen2.5:7b" },
            { t: "REDUCE", s: "qwen2.5:14b" },
          ].map((step, i, a) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{step.t}</div>
                <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{step.s}</div>
              </div>
              {i < a.length - 1 && <span style={{ color: "var(--text-tertiary)", margin: "0 4px" }}>→</span>}
            </div>
          ))}
        </div>

        {/* STAGE 1: 청크 분할 */}
        <StageHeader num="1" label="청크 분할" sub="긴 전사문을 문장 경계로 나눔 (3,500자 기준)" color="#6b7280" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 8 }}>
          {CHUNKS.map(c => (
            <div key={c.index} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ background: "#f5f5f4", borderBottom: "1px solid var(--border)", padding: "8px 14px", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "flex", justifyContent: "space-between" }}>
                <span>구간 {c.index}</span>
                <span style={{ color: "var(--text-tertiary)", fontWeight: 400 }}>{c.chars.toLocaleString()}자</span>
              </div>
              <div style={{ padding: "12px 14px", fontSize: 12.5, lineHeight: 1.7, color: "var(--text-tertiary)" }}>{c.preview}</div>
            </div>
          ))}
        </div>

        <Arrow />

        {/* STAGE 2: MAP */}
        <StageHeader num="2" label="MAP — 구간별 핵심 추출" sub="각 구간에서 결정·할일·논의를 손실 없이 뽑아냄 (7B 모델)" color="#2563eb" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 8 }}>
          {MAP_NOTES.map((note, i) => (
            <div key={i} style={{ background: "var(--surface)", border: "1px solid #dbeafe", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ background: "#eff6ff", borderBottom: "1px solid #dbeafe", padding: "8px 14px", fontSize: 12, fontWeight: 600, color: "#1d4ed8" }}>구간 {i + 1} 정리</div>
              <pre style={{ margin: 0, padding: "14px 16px", fontSize: 12.5, lineHeight: 1.75, whiteSpace: "pre-wrap", color: "var(--text-primary)", fontFamily: "inherit" }}>{note}</pre>
            </div>
          ))}
        </div>

        <Arrow />

        {/* STAGE 3: REDUCE */}
        <StageHeader num="3" label="REDUCE — 최종 회의록 생성" sub="구간 정리들을 통합해 구조화된 회의록으로 (14B 모델)" color="#16a34a" />
        <div style={{ background: "var(--surface)", border: "1px solid #dcfce7", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ background: "#f0fdf4", borderBottom: "1px solid #dcfce7", padding: "12px 20px", fontSize: 13, fontWeight: 600, color: "#15803d" }}>최종 구조화 회의록 (JSON)</div>
          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>요약</div>
              <p style={{ fontSize: 13.5, lineHeight: 1.75, margin: 0, color: "var(--text-primary)" }}>{FINAL.summary}</p>
            </div>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                결정사항 <span style={{ fontWeight: 400, color: "var(--text-tertiary)" }}>({FINAL.decisions.length})</span>
              </div>
              {FINAL.decisions.map((d, i) => (
                <div key={i} style={{ display: "flex", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                  <span style={{ color: "#16a34a", flexShrink: 0 }}>✓</span>
                  <span style={{ lineHeight: 1.55 }}>{d}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "12px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#d97706" }}>{FINAL.todos}</div>
                <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>할 일</div>
              </div>
              <div style={{ flex: 1, background: "#fdf4ff", border: "1px solid #e9d5ff", borderRadius: 8, padding: "12px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#7c3aed" }}>{FINAL.questions}</div>
                <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>미결 질문</div>
              </div>
            </div>
            <Link href="/meetings/demo-marketing" style={{
              display: "block", textAlign: "center", padding: "11px", borderRadius: 8,
              background: "var(--text-primary)", color: "#fff", textDecoration: "none",
              fontSize: 13.5, fontWeight: 500,
            }}>완성된 회의록 전체 보기 →</Link>
          </div>
        </div>
      </div>
    </>
  );
}
