'use client';

import Link from "next/link";

/* ── 실제 precompute 결과 (demo_results_lora.json) ─────── */
const CHUNKS = [
  { index: 1, chars: 3498, preview: "박서준 대신 김민준: 자, 그럼 오늘 회의 시작하겠습니다. 참석자는 김민준·이서연·박지훈·최수진·정우성 다섯 명 … 아젠다는 스프린트 25 리뷰, API v2 설계, PR 리뷰 프로세스 개선 … 대시보드는 GraphQL, 인증은 httpOnly 쿠키, 페이지네이션은 커서 기반으로." },
  { index: 2, chars: 3446, preview: "… 일정은 전체 v2 완성에 5~6주, 베타는 v1 기반으로 가고 v2는 정식 릴리즈에 포함 … PR 리뷰 프로세스: 크기 500줄 제한, 리뷰 SLA 영업일 1일, Danger.js 도입 … 결제 버그 핫픽스, DB 점검 후 스테이징 배포." },
  { index: 3, chars: 3461, preview: "정우성: 배포는 Flyway 마이그레이션 스크립트로 포함 … Redis 캐싱 도입 검토 … E2E는 Playwright로 기본 셋업 … 스프린트 26 포인트 추정과 백로그 작성, 베타 출시 일정 확정." },
];

const MAP_NOTES = [
`- [스프린트 25 리뷰]
  - 작업 템플릿 UI: 완료
  - 팀 초대: 90% 완료
  - 인프라 개선: 완료

- [API v2 설계]
  - 대시보드 데이터 조회: GraphQL로 전환
  - 인증 방식: httpOnly 쿠키로 변경
  - 페이지네이션: 커서 기반으로 변경

- [할일]
  - 팀 초대 API 연동 — 이서연
  - .env.example 업데이트 — 박지훈
  - Apollo Server 추가 — 박지훈
  - Nginx 설정 수정 — 박지훈, 정우성`,

`- [할일] PR 크기 제한 500줄 — 김민준
- [할일] PR 리뷰 SLA 영업일 1일 — 최수진
- [할일] Danger.js 도입 — 정우성
- [할일] PR 템플릿 개선 — 김민준
- [할일] 결제 버그 수정 — 박지훈
- [할일] DB 점검 — 최수진
- [할일] 핫픽스 배포 — 정우성
- [할일] 결제 대행사 추가 환불 API 확인 — 박지훈
- [할일] 작업 조회 API 성능 최적화 — 박지훈
- [할일] 스테이징 배포 — 박지훈, 정우성`,

`- [할일] Redis 캐싱 도입 — 박지훈
- [할일] 온보딩 개선 — 이서연
- [할일] Playwright E2E 기본 셋업 — 최수진, 이서연
- [할일] GraphQL 설계 문서 구체화 — 박지훈
- [할일] DB 성능 개선 — 정우성
- [할일] SSL 인증서 갱신 / 부하 테스트 — 정우성
- [할일] 에러 알림 슬랙 채널 연결 — 정우성
- [할일] 스프린트 26 포인트 추정 — 각자
- [할일] 스프린트 26 QA 진행 — 최수진
- [할일] 스프린트 26 주요 백로그 작성 — 김민준
  … (이 구간은 할일 30여 건을 손실 없이 추출, 일부 중복 포함)`,
];

const FINAL = {
  summary: "TaskFlow 스프린트 25 리뷰 및 26 플래닝, API v2 설계 확정, PR 리뷰 프로세스 개선, 결제 버그 처리, DB 성능 최적화, 베타 출시 일정을 논의했다. 스프린트 25 작업 완료 상황과 26 플래닝에 대한 포인트 추정 및 각 팀원들의 할일이 정해졌다.",
  decisions: [
    "스프린트 25 작업 템플릿 UI·인프라 개선을 완료하고 팀 초대 API 연동을 진행하기로 결정",
    "API v2 설계에서 대시보드 조회를 GraphQL로 전환하고 httpOnly 쿠키 인증 방식으로 변경하기로 결정",
  ],
  todos: 18,
  questions: 0,
  nextAgenda: 3,
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

export default function DemoLoraStagesPage() {
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
          <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>TaskFlow 스프린트 회의 — AI 처리 단계</span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999, background: "#faf5ff", color: "#9333ea", border: "1px solid #e9d5ff" }}>중간 단계</span>
      </div>

      <div style={{ padding: 28, maxWidth: 880, margin: "0 auto", width: "100%" }}>

        {/* 파이프라인 요약 */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 20px", marginBottom: 28, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", fontSize: 13 }}>
          {[
            { t: "STT 전사", s: "10,504자" },
            { t: "청크 분할", s: "3,500자 기준 · 3구간" },
            { t: "MAP", s: "meetlog-7b-lora" },
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
        <StageHeader num="1" label="청크 분할" sub="긴 전사문을 문장 경계로 나눔 (3,500자 기준 · 3구간)" color="#6b7280" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 8 }}>
          {CHUNKS.map(c => (
            <div key={c.index} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ background: "#f5f5f4", borderBottom: "1px solid var(--border)", padding: "8px 14px", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "flex", justifyContent: "space-between" }}>
                <span>구간 {c.index}</span>
                <span style={{ color: "var(--text-tertiary)", fontWeight: 400 }}>{c.chars.toLocaleString()}자</span>
              </div>
              <div style={{ padding: "12px 14px", fontSize: 12, lineHeight: 1.7, color: "var(--text-tertiary)" }}>{c.preview}</div>
            </div>
          ))}
        </div>

        <Arrow />

        {/* STAGE 2: MAP */}
        <StageHeader num="2" label="MAP — 구간별 핵심 추출" sub="각 구간에서 결정·할일·논의를 손실 없이 뽑아냄 (LoRA 7B 모델, 구간당 평균 72초)" color="#2563eb" />
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 8 }}>
          {MAP_NOTES.map((note, i) => (
            <div key={i} style={{ background: "var(--surface)", border: "1px solid #dbeafe", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ background: "#eff6ff", borderBottom: "1px solid #dbeafe", padding: "8px 14px", fontSize: 12, fontWeight: 600, color: "#1d4ed8" }}>구간 {i + 1} 정리</div>
              <pre style={{ margin: 0, padding: "14px 16px", fontSize: 12.5, lineHeight: 1.75, whiteSpace: "pre-wrap", color: "var(--text-primary)", fontFamily: "inherit" }}>{note}</pre>
            </div>
          ))}
        </div>

        <Arrow />

        {/* STAGE 3: REDUCE */}
        <StageHeader num="3" label="REDUCE — 최종 회의록 생성" sub="구간 정리들을 통합·중복 제거해 구조화된 회의록으로 (14B 모델)" color="#16a34a" />
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
              <div style={{ flex: 1, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "12px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#2563eb" }}>{FINAL.nextAgenda}</div>
                <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>다음 안건</div>
              </div>
              <div style={{ flex: 1, background: "#fdf4ff", border: "1px solid #e9d5ff", borderRadius: 8, padding: "12px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#7c3aed" }}>{FINAL.questions}</div>
                <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>미결 질문</div>
              </div>
            </div>
            <Link href="/meetings/demo-lora" style={{
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
