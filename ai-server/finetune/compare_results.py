#!/usr/bin/env python3
"""
LoRA 전/후 결과를 비교해 HTML 보고서를 생성한다.

Usage:
    cd ai-server
    python finetune/compare_results.py          # demo_results_base.json vs demo_results_lora.json
    python finetune/compare_results.py --open   # 생성 후 브라우저 열기

결과: finetune/data/comparison_report.html
"""
import argparse
import json
import webbrowser
from pathlib import Path

DATA_DIR = Path(__file__).parent / "data"
BASE_FILE = DATA_DIR / "demo_results_base.json"
LORA_FILE = DATA_DIR / "demo_results_lora.json"
OUT_FILE  = DATA_DIR / "comparison_report.html"


# ── HTML 템플릿 ───────────────────────────────────────────────────────────────

HTML_HEAD = """<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<title>MeetLog LoRA 전/후 비교</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Pretendard', 'Apple SD Gothic Neo', sans-serif;
         background: #f9f8f6; color: #1a1916; font-size: 14px; line-height: 1.6; }
  .header { background: #1a1916; color: #f9f8f6; padding: 32px 40px; }
  .header h1 { font-size: 26px; font-weight: 700; letter-spacing: -0.5px; }
  .header p  { color: #a8a49e; margin-top: 6px; font-size: 13px; }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 999px;
           font-size: 12px; font-weight: 600; }
  .badge-base { background: #dbeafe; color: #1d4ed8; }
  .badge-lora { background: #dcfce7; color: #15803d; }
  .container { max-width: 1280px; margin: 0 auto; padding: 32px 40px; }
  .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px; }
  .meta-card { background: #fff; border: 1px solid #e8e5de; border-radius: 12px; padding: 20px; }
  .meta-card h3 { font-size: 13px; color: #6b6760; margin-bottom: 12px; text-transform: uppercase;
                  letter-spacing: 0.5px; }
  .meta-row { display: flex; justify-content: space-between; padding: 4px 0;
              border-bottom: 1px solid #f0ede8; font-size: 13px; }
  .meta-row:last-child { border-bottom: none; }
  .meta-label { color: #6b6760; }
  .meta-value { font-weight: 600; }
  .section { margin-bottom: 40px; }
  .section-title { font-size: 18px; font-weight: 700; margin-bottom: 16px;
                   padding-bottom: 8px; border-bottom: 2px solid #e8e5de; }
  .chunk-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
  .chunk-card { background: #fff; border: 1px solid #e8e5de; border-radius: 12px;
                overflow: hidden; }
  .chunk-card-header { padding: 12px 16px; font-size: 12px; font-weight: 600;
                       letter-spacing: 0.3px; text-transform: uppercase; }
  .chunk-card-header.base { background: #eff6ff; color: #1d4ed8; border-bottom: 1px solid #dbeafe; }
  .chunk-card-header.lora { background: #f0fdf4; color: #15803d; border-bottom: 1px solid #dcfce7; }
  .chunk-card-body { padding: 16px; font-size: 13px; white-space: pre-wrap; line-height: 1.7; }
  .chunk-index { font-size: 13px; font-weight: 700; margin-bottom: 12px; color: #6b6760; }
  .minutes-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .minutes-card { background: #fff; border: 1px solid #e8e5de; border-radius: 12px;
                  overflow: hidden; }
  .minutes-card-header { padding: 14px 20px; font-size: 13px; font-weight: 700;
                          text-transform: uppercase; letter-spacing: 0.3px; }
  .minutes-card-header.base { background: #eff6ff; color: #1d4ed8; border-bottom: 1px solid #dbeafe; }
  .minutes-card-header.lora { background: #f0fdf4; color: #15803d; border-bottom: 1px solid #dcfce7; }
  .minutes-card-body { padding: 20px; }
  .field-label { font-size: 11px; font-weight: 700; color: #6b6760; text-transform: uppercase;
                 letter-spacing: 0.5px; margin: 16px 0 6px; }
  .field-label:first-child { margin-top: 0; }
  .summary-text { font-size: 14px; line-height: 1.7; }
  .list-item { display: flex; gap: 8px; padding: 5px 0;
               border-bottom: 1px solid #f5f3ef; font-size: 13px; }
  .list-item:last-child { border-bottom: none; }
  .list-bullet { color: #a8a49e; flex-shrink: 0; }
  .todo-member { background: #f0f9ff; color: #0369a1; padding: 1px 8px;
                 border-radius: 999px; font-size: 11px; font-weight: 600;
                 flex-shrink: 0; align-self: flex-start; margin-top: 2px; }
  .empty-label { color: #a8a49e; font-size: 13px; font-style: italic; }
  .timing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
                 margin-bottom: 32px; }
  .timing-card { background: #fff; border: 1px solid #e8e5de; border-radius: 10px;
                 padding: 16px; text-align: center; }
  .timing-label { font-size: 12px; color: #6b6760; margin-bottom: 4px; }
  .timing-value { font-size: 22px; font-weight: 700; color: #1a1916; }
  .timing-unit  { font-size: 12px; color: #a8a49e; }
  .diff-added   { background: #dcfce7; border-radius: 3px; padding: 0 2px; }
  .diff-removed { background: #fee2e2; border-radius: 3px; padding: 0 2px;
                  text-decoration: line-through; color: #b91c1c; }
</style>
</head>
<body>
"""

HTML_FOOT = """</body></html>"""


# ── 헬퍼 ─────────────────────────────────────────────────────────────────────

def _esc(s: str) -> str:
    return (s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
             .replace('"', "&quot;"))


def _render_list(items: list[str], bullet: str = "•") -> str:
    if not items:
        return '<span class="empty-label">없음</span>'
    rows = "".join(
        f'<div class="list-item"><span class="list-bullet">{bullet}</span>'
        f'<span>{_esc(it)}</span></div>'
        for it in items
    )
    return rows


def _render_todos(todos: list[dict]) -> str:
    if not todos:
        return '<span class="empty-label">없음</span>'
    rows = "".join(
        f'<div class="list-item">'
        f'<span class="list-bullet">▸</span>'
        f'<span style="flex:1">{_esc(t["text"])}</span>'
        f'<span class="todo-member">{_esc(t.get("member","미정"))}</span>'
        f'</div>'
        for t in todos
    )
    return rows


def _minutes_card(data: dict, side: str) -> str:
    label = "Before LoRA" if side == "base" else "After LoRA"
    fm = data["final_minutes"]
    return f"""
<div class="minutes-card">
  <div class="minutes-card-header {side}">{label} — {data['meta']['reduce_model']}</div>
  <div class="minutes-card-body">
    <div class="field-label">요약</div>
    <div class="summary-text">{_esc(fm.get("summary",""))}</div>

    <div class="field-label">결정사항 ({len(fm.get("decisions",[]))}건)</div>
    {_render_list(fm.get("decisions",[]))}

    <div class="field-label">할 일 ({len(fm.get("todos",[]))}건)</div>
    {_render_todos(fm.get("todos",[]))}

    <div class="field-label">미결 질문</div>
    {_render_list(fm.get("questions",[]), "?")}

    <div class="field-label">다음 안건</div>
    {_render_list(fm.get("next_agenda",[]), "→")}
  </div>
</div>"""


# ── 메인 ─────────────────────────────────────────────────────────────────────

def build_report(base: dict, lora: dict) -> str:
    bm = base["meta"]
    lm = lora["meta"]

    # ── 헤더 ──
    html = HTML_HEAD
    html += f"""
<div class="header">
  <h1>MeetLog — LoRA 파인튜닝 전/후 비교</h1>
  <p>발표용 데모 원고 ({bm['transcript_chars']:,}자 · 청크 {bm['chunk_count']}개) 기준</p>
</div>
<div class="container">
"""

    # ── 메타 정보 ──
    html += '<div class="meta-grid">'
    for label, meta, side in [("Before LoRA (Base 7B)", bm, "base"), ("After LoRA (Fine-tuned 7B)", lm, "lora")]:
        badge_cls = "badge-base" if side == "base" else "badge-lora"
        html += f"""
<div class="meta-card">
  <h3><span class="badge {badge_cls}">{label}</span></h3>
  <div class="meta-row"><span class="meta-label">Map 모델</span>
    <span class="meta-value">{_esc(meta['map_model'])}</span></div>
  <div class="meta-row"><span class="meta-label">Reduce 모델</span>
    <span class="meta-value">{_esc(meta['reduce_model'])}</span></div>
</div>"""
    html += '</div>'

    # ── MAP 단계 중간 결과 비교 ──
    html += '<div class="section"><div class="section-title">📋 MAP 단계 — 구간별 핵심 정리 비교</div>'

    chunk_count = bm["chunk_count"]
    for i in range(chunk_count):
        b_note = base["map_notes"][i]["note"] if i < len(base["map_notes"]) else "(없음)"
        l_note = lora["map_notes"][i]["note"] if i < len(lora["map_notes"]) else "(없음)"
        b_sec  = base["map_notes"][i]["elapsed"] if i < len(base["map_notes"]) else 0
        l_sec  = lora["map_notes"][i]["elapsed"] if i < len(lora["map_notes"]) else 0

        html += f"""
<div class="chunk-index">구간 {i+1} / {chunk_count}</div>
<div class="chunk-grid">
  <div class="chunk-card">
    <div class="chunk-card-header base">Before LoRA — {bm['map_model']}</div>
    <div class="chunk-card-body">{_esc(b_note)}</div>
  </div>
  <div class="chunk-card">
    <div class="chunk-card-header lora">After LoRA — {lm['map_model']}</div>
    <div class="chunk-card-body">{_esc(l_note)}</div>
  </div>
</div>"""

    html += '</div>'

    # ── 최종 회의록 비교 ──
    html += '<div class="section"><div class="section-title">📄 최종 회의록 (REDUCE) 비교</div>'
    html += '<div class="minutes-grid">'
    html += _minutes_card(base, "base")
    html += _minutes_card(lora, "lora")
    html += '</div></div>'

    html += '</div>'  # container
    html += HTML_FOOT
    return html


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--open", action="store_true", help="생성 후 브라우저 열기")
    args = parser.parse_args()

    missing = [f for f in [BASE_FILE, LORA_FILE] if not f.exists()]
    if missing:
        print("❌ 다음 파일이 없습니다:")
        for f in missing:
            tag = "base" if "base" in f.name else "lora"
            cmd = f"OLLAMA_MAP_MODEL={'qwen2.5:7b' if tag=='base' else 'meetlog-7b'} python finetune/precompute_demo.py --tag {tag}"
            print(f"   {f.name}  →  {cmd}")
        return

    base = json.loads(BASE_FILE.read_text(encoding="utf-8"))
    lora = json.loads(LORA_FILE.read_text(encoding="utf-8"))

    report = build_report(base, lora)
    OUT_FILE.write_text(report, encoding="utf-8")
    print(f"✅ 보고서 생성 완료: {OUT_FILE}")

    if args.open:
        webbrowser.open(OUT_FILE.as_uri())


if __name__ == "__main__":
    main()
