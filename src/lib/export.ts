// ============================================================
// NIRNAY — Export Module
// ============================================================

import type { SavedDecision } from '../types/decision';

// ---- JSON Export ----
export function exportJSON(decision: SavedDecision): void {
  const blob = new Blob([JSON.stringify(decision, null, 2)], { type: 'application/json' });
  triggerDownload(blob, `${slugify(decision.name)}.json`);
}

// ---- CSV Export ----
// Exports the result that is currently saved and displayed (no re-computation).
export function exportCSV(decision: SavedDecision): void {
  const { input, result } = decision;
  if (!result) return;

  const rows: string[][] = [];

  // Header
  rows.push([
    'Option', 'Status', 'Rank', 'Total Score',
    ...input.criteria.map((c) => `${c.name} (raw${c.unit ? ', ' + c.unit : ''})`),
    ...input.criteria.map((c) => `${c.name} (normalized /100)`),
    ...input.criteria.map((c) => `${c.name} (weighted contribution)`),
  ]);

  for (const r of result.rankedResults) {
    rows.push([
      r.alternative.name,
      r.feasible ? 'Feasible' : 'Infeasible',
      r.rank?.toString() ?? 'N/A',
      r.feasible ? r.totalScore.toFixed(2) : 'N/A',
      ...input.criteria.map((c) => r.rawValues[c.id]?.toString() ?? 'N/A'),
      ...input.criteria.map((c) => r.feasible ? (r.normalizedScores[c.id]?.toFixed(2) ?? 'N/A') : 'N/A'),
      ...input.criteria.map((c) => r.feasible ? (r.weightedContributions[c.id]?.toFixed(3) ?? 'N/A') : 'N/A'),
    ]);
  }

  const csv = rows.map((row) => row.map(escapeCSV).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  triggerDownload(blob, `${slugify(decision.name)}.csv`);
}

// ---- Print Report ----
// Generates a clean, print-ready HTML report with full detail.
export function printReport(decision: SavedDecision): void {
  const { input, result } = decision;
  const recommendation = result?.recommendation?.alternative.name ?? 'None';
  const score = result?.recommendation?.totalScore.toFixed(1) ?? '—';
  const date = new Date(decision.updatedAt).toLocaleString();

  // Weights table rows
  const weightRows = input.criteria.map((c) => {
    const w = input.weights.find((ww) => ww.criterionId === c.id);
    return `<tr>
      <td>${escapeHtml(c.name)}</td>
      <td>${escapeHtml(c.unit || '—')}</td>
      <td>${c.direction === 'lower_is_better' ? '↓ lower = better' : '↑ higher = better'}</td>
      <td>${w?.weight ?? 0}%</td>
      <td>${escapeHtml(c.description || '—')}</td>
    </tr>`;
  }).join('');

  // Constraints table rows
  const constraintRows = input.constraints.length > 0
    ? input.constraints.map((con) => {
        const crit = input.criteria.find((c) => c.id === con.criterionId);
        return `<tr>
          <td>${escapeHtml(crit?.name ?? con.criterionId)}</td>
          <td>${con.operator}</td>
          <td>${con.value}${crit?.unit ? ' ' + crit.unit : ''}</td>
        </tr>`;
      }).join('')
    : '<tr><td colspan="3" class="muted">No hard constraints defined.</td></tr>';

  // Ranking table rows
  const rankRows = (result?.rankedResults ?? []).map((r) => {
    const isWinner = result?.recommendation?.alternative.id === r.alternative.id;
    const violations = r.violations.map((v) => escapeHtml(v.message)).join('<br>');
    return `<tr class="${isWinner ? 'winner' : ''}">
      <td>${r.rank ?? '—'}</td>
      <td>${escapeHtml(r.alternative.name)}${isWinner ? ' ★' : ''}</td>
      <td>${r.feasible ? r.totalScore.toFixed(1) + '/100' : '—'}</td>
      <td><span class="badge ${r.feasible ? 'feasible' : 'infeasible'}">${r.feasible ? 'Feasible' : 'Infeasible'}</span></td>
      <td class="small">${violations || '—'}</td>
    </tr>`;
  }).join('');

  // Criterion breakdown table (for winner only)
  let breakdownRows = '';
  if (result?.recommendation) {
    const rec = result.recommendation;
    const weightMap = Object.fromEntries(input.weights.map((w) => [w.criterionId, w.weight]));
    breakdownRows = input.criteria
      .map((c) => {
        const raw = rec.rawValues[c.id] ?? 0;
        const norm = (rec.normalizedScores[c.id] ?? 0).toFixed(1);
        const w = weightMap[c.id] ?? 0;
        const contrib = (rec.weightedContributions[c.id] ?? 0).toFixed(2);
        return `<tr>
          <td>${escapeHtml(c.name)}${c.unit ? ` (${c.unit})` : ''}</td>
          <td>${raw}</td>
          <td>${norm}/100</td>
          <td>${w}%</td>
          <td><strong>${contrib}</strong></td>
        </tr>`;
      }).join('');
  }

  // Infeasible exclusion reasons
  const infeasibleBlock = (result?.rankedResults ?? [])
    .filter((r) => !r.feasible && r.violations.length > 0)
    .map((r) => `<p><strong>${escapeHtml(r.alternative.name)}:</strong> ${r.violations.map((v) => escapeHtml(v.message)).join(' ')}</p>`)
    .join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>NIRNAY Decision Report — ${escapeHtml(decision.name)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 40px auto; color: #1a1d23; font-size: 13px; line-height: 1.6; padding: 0 20px; }
    h1 { font-size: 26px; color: #1a1d23; margin-bottom: 4px; }
    h2 { color: #4338ca; margin-top: 28px; margin-bottom: 10px; font-size: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
    h3 { font-size: 13px; font-weight: 700; margin-bottom: 6px; color: #374151; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th { background: #f0f1f5; text-align: left; padding: 7px 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #4b5563; }
    td { border-bottom: 1px solid #e5e7eb; padding: 7px 10px; vertical-align: top; }
    .small { font-size: 11px; color: #6b7280; }
    .muted { color: #9ca3af; }
    .badge { padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; display: inline-block; }
    .feasible { background: #dcfce7; color: #166534; }
    .infeasible { background: #fee2e2; color: #991b1b; }
    .winner td { background: #f0fdf4; }
    .recommendation-box { background: #f0fdf4; border: 2px solid #22c55e; border-radius: 8px; padding: 16px 20px; margin: 16px 0; }
    .score { font-size: 28px; font-weight: 800; color: #16a34a; }
    .explanation { background: #f8f9fb; border-left: 4px solid #4338ca; padding: 12px 16px; margin-top: 4px; font-size: 12px; color: #374151; }
    .formula-box { background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; font-family: monospace; font-size: 11px; color: #334155; margin-top: 6px; }
    .tie-box { background: #fffbeb; border: 2px solid #f59e0b; border-radius: 8px; padding: 16px 20px; margin: 16px 0; }
    .nofeasible-box { background: #fef2f2; border: 2px solid #ef4444; border-radius: 8px; padding: 16px 20px; margin: 16px 0; }
    .meta { color: #6b7280; font-size: 12px; margin-bottom: 20px; }
    .footer { margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 16px; font-size: 11px; color: #9ca3af; text-align: center; }
    .criterion-exp { font-size: 11px; color: #4b5563; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; padding: 6px 10px; margin-bottom: 4px; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <h1>NIRNAY Decision Report</h1>
  <p class="meta">
    <strong>${escapeHtml(decision.name)}</strong>
    &nbsp;|&nbsp; Generated: ${date}
  </p>

  <h2>Recommendation</h2>
  ${result?.noFeasibleOption ? `
    <div class="nofeasible-box">
      <strong>No Feasible Option.</strong> Every alternative violates at least one hard constraint.
    </div>
  ` : result?.isTie ? `
    <div class="tie-box">
      <strong>Tie Detected.</strong> The following alternatives have equal scores:<br>
      ${(result.tiedAlternatives ?? []).map((r) => `<strong>${escapeHtml(r.alternative.name)}</strong> (${r.totalScore.toFixed(1)}/100)`).join(', ')}.<br>
      Adjust priorities, constraints, or values to break the tie.
    </div>
  ` : `
    <div class="recommendation-box">
      <div style="font-size:11px;font-weight:700;color:#15803d;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Recommended Option</div>
      <div style="font-size:22px;font-weight:800;color:#111827;">${escapeHtml(recommendation)}</div>
      <div class="score">${score}<span style="font-size:16px;font-weight:400;color:#6b7280;">/100</span></div>
    </div>
  `}

  ${result?.explanation ? `
    <h2>Explanation</h2>
    <div class="explanation">${escapeHtml(result.explanation)}</div>
    ${(result.criterionExplanations ?? []).length > 0 ? `
      <div style="margin-top:10px;">
        ${result.criterionExplanations.map((e) => `<div class="criterion-exp">${escapeHtml(e)}</div>`).join('')}
      </div>
    ` : ''}
  ` : ''}

  <h2>Ranking</h2>
  <table>
    <tr><th>Rank</th><th>Option</th><th>Score</th><th>Status</th><th>Exclusion Reason</th></tr>
    ${rankRows}
  </table>

  ${result?.recommendation && breakdownRows ? `
    <h2>Score Breakdown — ${escapeHtml(result.recommendation.alternative.name)}</h2>
    <p style="font-size:12px;color:#6b7280;margin-bottom:8px;">How the winner's total score was calculated from criterion contributions.</p>
    <table>
      <tr><th>Criterion</th><th>Raw Value</th><th>Normalized (/100)</th><th>Weight</th><th>Contribution</th></tr>
      ${breakdownRows}
      <tr style="background:#f0fdf4;font-weight:700;">
        <td colspan="4">Total Weighted Score</td>
        <td>${result.recommendation.totalScore.toFixed(1)}/100</td>
      </tr>
    </table>
  ` : ''}

  <h2>Criteria &amp; Weights</h2>
  <table>
    <tr><th>Criterion</th><th>Unit</th><th>Direction</th><th>Weight</th><th>Description</th></tr>
    ${weightRows}
  </table>

  <h2>Alternatives</h2>
  <table>
    <tr><th>Name</th><th>Description</th></tr>
    ${input.alternatives.map((a) => `<tr><td>${escapeHtml(a.name)}</td><td class="small">${escapeHtml(a.description || '—')}</td></tr>`).join('')}
  </table>

  <h2>Hard Constraints</h2>
  <table>
    <tr><th>Criterion</th><th>Operator</th><th>Threshold</th></tr>
    ${constraintRows}
  </table>

  ${infeasibleBlock ? `
    <h2>Exclusion Reasons</h2>
    <div class="explanation">${infeasibleBlock}</div>
  ` : ''}

  ${result?.tradeOffs && result.tradeOffs.length > 0 ? `
    <h2>Trade-off Analysis</h2>
    ${result.tradeOffs.map((t) => `
      <h3>${escapeHtml(result.recommendation?.alternative.name ?? '')} vs. ${escapeHtml(t.advantageOver)}</h3>
      ${t.advantages.length > 0 ? `<p style="color:#166534;"><strong>Advantages:</strong> ${t.advantages.map(escapeHtml).join(', ')}</p>` : ''}
      ${t.disadvantages.length > 0 ? `<p style="color:#991b1b;"><strong>Trade-offs:</strong> ${t.disadvantages.map(escapeHtml).join(', ')}</p>` : ''}
    `).join('')}
  ` : ''}

  <h2>Methodology</h2>
  <p>NIRNAY uses <strong>weighted min-max normalization</strong> (also known as the Simple Additive Weighting / SAW method):</p>
  <div class="formula-box">
    Higher is better:  normalized = (value − min) / (max − min) × 100<br>
    Lower  is better:  normalized = (max − value) / (max − min) × 100<br>
    If max = min (all values equal): normalized = 100<br>
    <br>
    contribution = normalized × (weight / 100)<br>
    total score  = Σ contribution  [all criteria]<br>
    <br>
    Normalization is applied only over feasible alternatives (those that pass all hard constraints).<br>
    Alternatives with identical scores within 0.01 points are considered tied.
  </div>
  <p style="margin-top:8px;font-size:12px;color:#6b7280;">
    All scores are computed deterministically from the input data. No randomness or AI is involved.
  </p>

  <div class="footer">Generated by <strong>NIRNAY — The Decision Engine</strong> &nbsp;·&nbsp; "From choices to confident decisions."</div>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
    win.print();
  }
}

// ---- Helpers ----
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'decision';
}

function escapeCSV(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
