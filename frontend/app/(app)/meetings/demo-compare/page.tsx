'use client';

import Link from "next/link";

/* ── 정적 데모 데이터 ─────────────────────────────────────────── */
const BASE_NOTES = [
`- [할일] 팀 초대 API 환경변수 업데이트 — 박지훈
- [할일] 인증 방식 변경 작업 — 박지훈, 정우성
- [할일] 페이지네이션 방식 변경 작업 — 박지훈`,

`- [질문] 인덱스 추가할 때 운영 DB에 락 걸리지 않는지

- [할일] PR 리뷰 프로세스 개선 — 김민준
  - PR 크기 제한 (500줄 이하 권장)
  - 리뷰 SLA (영업일 1일 이내)
  - Danger.js 도입 및 자동화
  - PR 템플릿 개선

- [할일] 결제 버그 처리 — 박지훈, 최수진, 정우성
  - 수정 일정: 목요일까지
  - DB 점검 쿼리 작성
  - 금요일 QA / 저녁 핫픽스 배포

- [할일] DB 성능 최적화 — 박지훈, 정우성
  - N+1 문제 해결 (Fetch Join)
  - project_id / status 컬럼 인덱스 추가
  - 오늘 오후 스테이징 배포`,

`- [결정] API v2는 베타 이후 정식 릴리즈에 포함
  - 대시보드는 GraphQL로
  - 인증은 httpOnly 쿠키로
  - 페이지네이션은 커서 기반으로
  - PR 크기 500줄 이하 가이드라인 도입
  - 리뷰 SLA 영업일 1일, Danger.js 도입 검토
- [할일] 결제 버그 목요일 수정 완료 — 박지훈
- [할일] DB 성능 개선 스테이징 검증 후 운영 반영
- [할일] Redis 캐싱은 스프린트 26 — 정우성
- [할일] 온보딩 개선 이번 주 완료 — 이서연
- [할일] 베타 오픈 다음 주 목요일`,
];

const LORA_NOTES = [
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
- [할일] 스테이징 배포 — 정우성
- [할일] 인프라 설정 — 정우성
- [할일] Playwright E2E 기본 셋업 — 최수진, 이서연
- [할일] GraphQL 설계 문서 구체화 — 박지훈
- [할일] E2E 테스트 자동화 설정 — 최수진
- [할일] DB 성능 개선 — 정우성
- [할일] SSL 인증서 갱신 — 정우성
- [할일] 부하 테스트 — 정우성
- [할일] API v2 작업 시작 — 박지훈`,
];

const BASE_FM = {
  summary: "TaskFlow 스프린트 25 리뷰 및 26 플래닝을 진행하고 API v2 설계를 확정했다. PR 리뷰 프로세스 개선, 결제 모듈 버그 처리, DB 성능 최적화 방안 등을 논의했으며 베타 출시 일정도 확정되었다.",
  decisions: ["API v2는 베타 이후 정식 릴리즈에 포함", "대시보드는 GraphQL로 설계", "인증은 httpOnly 쿠키 방식으로", "페이지네이션은 커서 기반으로 변경", "PR 크기 500줄 이하 가이드라인 도입", "리뷰 SLA 영업일 1일로 설정"],
  todos: [{ text: "팀 초대 API 환경변수 업데이트하기", member: "박지훈" }, { text: "PR 리뷰 프로세스 개선하기", member: "김민준" }, { text: "결제 버그 처리하기", member: "박지훈, 최수진, 정우성" }, { text: "DB 성능 최적화 작업하기", member: "박지훈, 정우성" }, { text: "Redis 캐싱 구현하기", member: "정우성" }, { text: "온보딩 개선 완료하기", member: "이서연" }, { text: "Playwright E2E 기본 셋업하기", member: "최수진, 이서연" }, { text: "GraphQL 설계 문서 구체화하기", member: "박지훈" }],
  questions: ["인덱스 추가할 때 운영 DB에 락 걸리지 않는지 확인 필요"],
  next_agenda: ["API v2 설계 구체화", "결제 버그 처리 완료 후 재검토", "베타 출시 일정 확정", "스프린트 26 백로그 확정"],
};

const LORA_FM = {
  summary: "TaskFlow 스프린트 25 리뷰 및 26 플래닝, API v2 설계 확정, PR 리뷰 프로세스 개선, 결제 버그 처리, DB 성능 최적화, 베타 출시 일정을 논의했다. 스프린트 25 작업 완료 상황과 26 플래닝에 대한 포인트 추정 및 각 팀원들의 할 일이 정해졌다.",
  decisions: ["스프린트 25 작업 템플릿 UI, 인프라 개선을 완료하고 팀 초대 API 연동을 진행하기로 결정", "API v2 설계에서 대시보드 GraphQL 전환 및 httpOnly 쿠키 인증 방식으로 변경하기로 결정"],
  todos: [{ text: "팀 초대 API 연동 완료하기", member: "이서연" }, { text: ".env.example 업데이트 하기", member: "박지훈" }, { text: "Apollo Server 추가하기", member: "박지훈" }, { text: "PR 크기 제한 500줄 적용하기", member: "김민준" }, { text: "Danger.js 도입하기", member: "정우성" }, { text: "결제 버그 수정하기", member: "박지훈" }, { text: "DB 성능 최적화 작업 수행하기", member: "정우성" }, { text: "Redis 캐싱 도입하기", member: "박지훈" }, { text: "온보딩 개선하기", member: "이서연" }, { text: "Playwright E2E 기본 셋업 하기", member: "최수진, 이서연" }, { text: "GraphQL 설계 문서 구체화하기", member: "박지훈" }, { text: "스프린트 26 QA 진행하기", member: "최수진" }],
  questions: [],
  next_agenda: ["API v2 설계 구체화", "결제 버그 처리 완료 후 재검토", "베타 출시 일정 확정"],
};

function Badge({ label, color }: { label: string; color: "blue" | "green" }) {
  const s = color === "blue"
    ? { bg: "#eff6ff", text: "#1d4ed8", border: "#dbeafe" }
    : { bg: "#f0fdf4", text: "#15803d", border: "#dcfce7" };
  return (
    <span style={{ display: "inline-block", padding: "3px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: s.bg, color: s.text, border: `1px solid ${s.border}` }}>
      {label}
    </span>
  );
}

function MinutesCol({ data, color }: { data: typeof BASE_FM; color: "blue" | "green" }) {
  const accent = color === "blue" ? "#2563eb" : "#16a34a";
  const lightBg = color === "blue" ? "#eff6ff" : "#f0fdf4";
  const border  = color === "blue" ? "#dbeafe" : "#dcfce7";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: accent, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>요약</div>
        <p style={{ fontSize: 13, lineHeight: 1.75, color: "var(--text-primary)", margin: 0 }}>{data.summary}</p>
      </div>
      <div>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: accent, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
          결정사항 <span style={{ fontWeight: 400, color: "var(--text-tertiary)" }}>({data.decisions.length})</span>
        </div>
        {data.decisions.map((d, i) => (
          <div key={i} style={{ display: "flex", gap: 8, padding: "5px 0", borderBottom: "1px solid var(--border)", fontSize: 12.5 }}>
            <span style={{ color: "var(--text-tertiary)", flexShrink: 0 }}>•</span>
            <span>{d}</span>
          </div>
        ))}
      </div>
      <div>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: accent, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
          할 일 <span style={{ fontWeight: 400, color: "var(--text-tertiary)" }}>({data.todos.length})</span>
        </div>
        {data.todos.map((t, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6, padding: "5px 0", borderBottom: "1px solid var(--border)", fontSize: 12.5 }}>
            <div style={{ display: "flex", gap: 6 }}>
              <span style={{ color: "var(--text-tertiary)", flexShrink: 0 }}>▸</span>
              <span>{t.text}</span>
            </div>
            <span style={{ background: lightBg, color: accent, border: `1px solid ${border}`, borderRadius: 999, padding: "1px 7px", fontSize: 11, fontWeight: 600, flexShrink: 0 }}>{t.member}</span>
          </div>
        ))}
      </div>
      {data.questions.length > 0 && (
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: accent, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>미결 질문</div>
          {data.questions.map((q, i) => (
            <div key={i} style={{ display: "flex", gap: 6, padding: "5px 0", fontSize: 12.5 }}>
              <span style={{ color: "var(--text-tertiary)" }}>?</span><span>{q}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DemoComparePage() {
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
          <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>LoRA 파인튜닝 전/후 비교</span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999, background: "#faf5ff", color: "#9333ea", border: "1px solid #e9d5ff" }}>AI 연구</span>
      </div>

      <div style={{ padding: 28, maxWidth: 1280, margin: "0 auto", width: "100%" }}>

        {/* 파이프라인 */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 20px", marginBottom: 24, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {["STT 전사", "청크 분할 (3구간)", "MAP (구간별 핵심 추출)", "REDUCE (최종 회의록)"].map((s, i, a) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>{s}</span>
              {i < a.length - 1 && <span style={{ color: "var(--text-tertiary)" }}>→</span>}
            </div>
          ))}
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <Badge label="Before LoRA · qwen2.5:7b" color="blue" />
            <Badge label="After LoRA · meetlog-7b" color="green" />
          </div>
        </div>

        {/* MAP 중간 결과 */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16, paddingBottom: 8, borderBottom: "2px solid var(--border)" }}>
            📋 MAP 단계 — 구간별 핵심 정리
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {[0, 1, 2].map(i => (
              <div key={i}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-tertiary)", marginBottom: 8 }}>구간 {i + 1} / 3</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {[
                    { note: BASE_NOTES[i], color: "blue" as const, label: "Before LoRA — qwen2.5:7b" },
                    { note: LORA_NOTES[i], color: "green" as const, label: "After LoRA — meetlog-7b" },
                  ].map(({ note, color, label }) => {
                    const hBg = color === "blue" ? "#eff6ff" : "#f0fdf4";
                    const hColor = color === "blue" ? "#1d4ed8" : "#15803d";
                    const hBorder = color === "blue" ? "#dbeafe" : "#dcfce7";
                    return (
                      <div key={color} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
                        <div style={{ background: hBg, color: hColor, borderBottom: `1px solid ${hBorder}`, padding: "8px 14px", fontSize: 11.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }}>{label}</div>
                        <pre style={{ margin: 0, padding: "14px 16px", fontSize: 12.5, lineHeight: 1.8, whiteSpace: "pre-wrap", color: "var(--text-primary)", fontFamily: "inherit" }}>{note}</pre>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 최종 회의록 비교 */}
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16, paddingBottom: 8, borderBottom: "2px solid var(--border)" }}>
            📄 최종 회의록 — REDUCE 결과
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: "var(--surface)", border: "1px solid #dbeafe", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ background: "#eff6ff", borderBottom: "1px solid #dbeafe", padding: "12px 20px" }}><Badge label="Before LoRA — qwen2.5:7b" color="blue" /></div>
              <div style={{ padding: 20 }}><MinutesCol data={BASE_FM} color="blue" /></div>
            </div>
            <div style={{ background: "var(--surface)", border: "1px solid #dcfce7", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ background: "#f0fdf4", borderBottom: "1px solid #dcfce7", padding: "12px 20px" }}><Badge label="After LoRA — meetlog-7b" color="green" /></div>
              <div style={{ padding: 20 }}><MinutesCol data={LORA_FM} color="green" /></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
