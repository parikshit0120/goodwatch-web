globalThis.process ??= {}; globalThis.process.env ??= {};
/* empty css                                    */
import { e as createAstro, f as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead, h as addAttribute } from '../../chunks/astro/server_Cyy51z0E.mjs';
import { $ as $$Layout } from '../../chunks/Layout_B6Hz-kRD.mjs';
import { s as supabase } from '../../chunks/supabase_MFvNP5ai.mjs';
export { renderers } from '../../renderers.mjs';

const $$Astro = createAstro("https://goodwatch.movie");
const prerender = false;
const $$Trust = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Trust;
  Astro2.url.searchParams.get("admin") === "true";
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1e3).toISOString();
  const { data: feedbackStats } = await supabase.from("provider_feedback").select("reported_provider, issue_type, created_at").gte("created_at", sevenDaysAgo);
  const providerIssues = {};
  feedbackStats?.forEach((f) => {
    if (!providerIssues[f.reported_provider]) {
      providerIssues[f.reported_provider] = { total: 0, byType: {} };
    }
    providerIssues[f.reported_provider].total++;
    providerIssues[f.reported_provider].byType[f.issue_type] = (providerIssues[f.reported_provider].byType[f.issue_type] || 0) + 1;
  });
  const { data: snapshotStats } = await supabase.from("decision_snapshots").select("is_valid, confidence_score").eq("region", "IN");
  const totalSnapshots = snapshotStats?.length || 0;
  const validSnapshots = snapshotStats?.filter((s) => s.is_valid).length || 0;
  const highConfidence = snapshotStats?.filter((s) => s.confidence_score >= 0.7).length || 0;
  snapshotStats?.filter((s) => s.confidence_score >= 0.4 && s.confidence_score < 0.7).length || 0;
  const { data: recentOverrides } = await supabase.from("provider_overrides").select("*").eq("is_active", true).order("created_at", { ascending: false }).limit(10);
  const totalFeedback = feedbackStats?.length || 0;
  const notAvailableCount = feedbackStats?.filter((f) => f.issue_type === "not_available").length || 0;
  const missRate = totalFeedback > 0 ? (notAvailableCount / totalFeedback * 100).toFixed(2) : "0";
  const slaStatus = parseFloat(missRate) <= 0.2 ? "healthy" : parseFloat(missRate) <= 0.5 ? "warning" : "critical";
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Trust Dashboard - GoodWatch", "description": "SLA monitoring" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="min-h-screen bg-gw-bg px-4 py-8"> <div class="max-w-6xl mx-auto"> <div class="flex items-center justify-between mb-8"> <h1 class="text-3xl font-bold">Trust Dashboard</h1> <span${addAttribute(`px-3 py-1 rounded-full text-sm font-medium ${slaStatus === "healthy" ? "bg-green-500/20 text-green-400" : slaStatus === "warning" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}`, "class")}>
SLA: ${slaStatus.toUpperCase()} </span> </div> <!-- Key Metrics --> <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"> <div class="bg-gw-card border border-gw-border rounded-xl p-4"> <p class="text-sm text-gw-text-secondary">Total Snapshots</p> <p class="text-2xl font-bold">${totalSnapshots.toLocaleString()}</p> </div> <div class="bg-gw-card border border-gw-border rounded-xl p-4"> <p class="text-sm text-gw-text-secondary">Valid</p> <p class="text-2xl font-bold text-green-400">${validSnapshots.toLocaleString()}</p> </div> <div class="bg-gw-card border border-gw-border rounded-xl p-4"> <p class="text-sm text-gw-text-secondary">High Confidence (≥0.7)</p> <p class="text-2xl font-bold text-gw-accent">${highConfidence.toLocaleString()}</p> </div> <div class="bg-gw-card border border-gw-border rounded-xl p-4"> <p class="text-sm text-gw-text-secondary">Miss Rate (7d)</p> <p class="text-2xl font-bold">${missRate}%</p> <p class="text-xs text-gw-text-secondary">Target: ≤0.2%</p> </div> </div> <!-- Provider Health --> <section class="mb-8"> <h2 class="text-lg font-semibold mb-4">Provider Health (Last 7 Days)</h2> <div class="bg-gw-card border border-gw-border rounded-xl overflow-hidden"> <table class="w-full"> <thead class="bg-gw-bg"> <tr> <th class="text-left px-4 py-3 text-sm font-medium">Provider</th> <th class="text-right px-4 py-3 text-sm font-medium">Reports</th> <th class="text-right px-4 py-3 text-sm font-medium">Not Available</th> <th class="text-right px-4 py-3 text-sm font-medium">Wrong Provider</th> <th class="text-right px-4 py-3 text-sm font-medium">Rent Only</th> </tr> </thead> <tbody> ${Object.entries(providerIssues).length > 0 ? Object.entries(providerIssues).sort((a, b) => b[1].total - a[1].total).map(([provider, stats]) => renderTemplate`<tr class="border-t border-gw-border"> <td class="px-4 py-3">${provider}</td> <td class="px-4 py-3 text-right">${stats.total}</td> <td class="px-4 py-3 text-right text-red-400">${stats.byType["not_available"] || 0}</td> <td class="px-4 py-3 text-right text-yellow-400">${stats.byType["different_provider"] || 0}</td> <td class="px-4 py-3 text-right text-orange-400">${stats.byType["rent_only"] || 0}</td> </tr>`) : renderTemplate`<tr> <td colspan="5" class="px-4 py-8 text-center text-gw-text-secondary">No feedback yet</td> </tr>`} </tbody> </table> </div> </section> <!-- Recent Overrides --> <section class="mb-8"> <h2 class="text-lg font-semibold mb-4">Active Overrides</h2> <div class="bg-gw-card border border-gw-border rounded-xl overflow-hidden"> ${recentOverrides && recentOverrides.length > 0 ? renderTemplate`<div class="divide-y divide-gw-border"> ${recentOverrides.map((o) => renderTemplate`<div class="px-4 py-3 flex items-center justify-between"> <div> <span class="font-medium">TMDB ${o.tmdb_id}</span> <span class="text-gw-text-secondary mx-2">→</span> <span class="text-gw-accent">${o.provider_name}</span> </div> <div class="text-sm text-gw-text-secondary"> <span>+${o.confidence_boost} confidence</span> <span class="mx-2">•</span> <span>Expires ${new Date(o.expires_at).toLocaleDateString()}</span> </div> </div>`)} </div>` : renderTemplate`<p class="px-4 py-8 text-center text-gw-text-secondary">No active overrides</p>`} </div> </section> <!-- SLA Targets --> <section> <h2 class="text-lg font-semibold mb-4">SLA Targets</h2> <div class="bg-gw-card border border-gw-border rounded-xl p-6"> <div class="space-y-4"> <div class="flex items-center justify-between"> <span>Miss rate per 1,000 sessions</span> <span class="font-mono">≤ 2 (0.2%)</span> </div> <div class="flex items-center justify-between"> <span>Same-session suppression rate</span> <span class="font-mono">≥ 90%</span> </div> <div class="flex items-center justify-between"> <span>Repeat miss prevention (7 days)</span> <span class="font-mono">0</span> </div> <div class="flex items-center justify-between text-gw-text-secondary"> <span>Netflix/Prime/Apple target</span> <span class="font-mono">≤ 0.1%</span> </div> <div class="flex items-center justify-between text-gw-text-secondary"> <span>JioHotstar/Zee5/SonyLIV target</span> <span class="font-mono">≤ 0.3%</span> </div> </div> </div> </section> </div> </main> ` })}`;
}, "/Users/parikshitjhajharia/Desktop/GOODWATCH/goodwatch-web/src/pages/admin/trust.astro", void 0);

const $$file = "/Users/parikshitjhajharia/Desktop/GOODWATCH/goodwatch-web/src/pages/admin/trust.astro";
const $$url = "/admin/trust";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Trust,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
