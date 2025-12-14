globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createClient } from '../../chunks/wrapper_CRWxChbs.mjs';
export { renderers } from '../../renderers.mjs';

const supabase = createClient(
  "https://jdjqrlkynwfhbtyuddjk.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkanFybGt5bndmaGJ0eXVkZGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NzUwMTEsImV4cCI6MjA4MDA1MTAxMX0.KDRMLCewVMp3lwphkUvtoWOkg6kyAk8iSbVkRKiHYSk"
);
const FEEDBACK_WEIGHTS = {
  "not_available": 1,
  "link_broken": 0.7,
  "rent_only": 0.8,
  "different_provider": 0.5
};
const SUPPRESSION_THRESHOLD = 2;
const MIN_DISTINCT_USERS = 2;
const AGGREGATION_WINDOW_HOURS = 72;
const POST = async ({ request }) => {
  try {
    const body = await request.json();
    const {
      userId,
      tmdbId,
      reportedProvider,
      issueType,
      correctProvider,
      sourcePage,
      bounceTimeMs
    } = body;
    const weight = FEEDBACK_WEIGHTS[issueType] || 0.5;
    const { error: feedbackError } = await supabase.from("provider_feedback").insert({
      user_id: userId || "anonymous",
      tmdb_id: parseInt(tmdbId),
      reported_provider: reportedProvider,
      issue_type: issueType,
      correct_provider: correctProvider || null,
      source_page: sourcePage || "unknown",
      bounce_time_ms: bounceTimeMs || null,
      region: "IN",
      weight,
      processed: false
    });
    if (feedbackError) {
      console.error("Feedback insert error:", feedbackError);
      return new Response(JSON.stringify({ success: false, error: feedbackError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
    await supabase.from("decision_snapshots").update({
      is_valid: false,
      invalid_reason: "user_reported",
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("tmdb_id", parseInt(tmdbId)).eq("region", "IN");
    const shouldSuppress = await checkAggregationThreshold(parseInt(tmdbId), reportedProvider, "IN");
    if (shouldSuppress) {
      await suppressMovieProvider(parseInt(tmdbId), reportedProvider, "IN");
    }
    if (correctProvider && correctProvider !== reportedProvider) {
      await supabase.from("provider_overrides").upsert({
        tmdb_id: parseInt(tmdbId),
        region: "IN",
        provider_name: correctProvider,
        availability_type: "flatrate",
        confidence_boost: 0.3,
        source: "user_correction",
        source_details: `Reported by ${userId || "anonymous"} from ${sourcePage}`,
        is_active: true,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toISOString()
      }, {
        onConflict: "tmdb_id,region,provider_name"
      });
    }
    return new Response(JSON.stringify({
      success: true,
      suppressed: shouldSuppress
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("Provider feedback API error:", err);
    return new Response(JSON.stringify({ success: false, error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
async function checkAggregationThreshold(tmdbId, provider, region) {
  const windowStart = new Date(Date.now() - AGGREGATION_WINDOW_HOURS * 60 * 60 * 1e3).toISOString();
  const { data: feedback } = await supabase.from("provider_feedback").select("user_id, weight").eq("tmdb_id", tmdbId).eq("reported_provider", provider).eq("region", region).eq("processed", false).gte("created_at", windowStart);
  if (!feedback || feedback.length === 0) return false;
  const distinctUsers = new Set(feedback.map((f) => f.user_id)).size;
  const weightedScore = feedback.reduce((sum, f) => sum + (f.weight || 1), 0);
  const { data: snapshot } = await supabase.from("decision_snapshots").select("last_success_at").eq("tmdb_id", tmdbId).eq("region", region).single();
  const recentSuccess = snapshot?.last_success_at && new Date(snapshot.last_success_at) > new Date(Date.now() - 24 * 60 * 60 * 1e3);
  if (recentSuccess) return false;
  return weightedScore >= SUPPRESSION_THRESHOLD && distinctUsers >= MIN_DISTINCT_USERS;
}
async function suppressMovieProvider(tmdbId, provider, region) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3).toISOString();
  await supabase.from("decision_snapshots").update({
    is_valid: false,
    confidence_score: 0,
    invalid_reason: "community_reported_unavailable",
    suppressed_at: (/* @__PURE__ */ new Date()).toISOString(),
    suppressed_reason: "community_reported_unavailable",
    suppression_expires_at: expiresAt,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("tmdb_id", tmdbId).eq("region", region);
  await supabase.from("provider_feedback").update({ processed: true }).eq("tmdb_id", tmdbId).eq("reported_provider", provider).eq("region", region).eq("processed", false);
  console.log(`[SUPPRESSED] tmdb_id=${tmdbId}, provider=${provider}, region=${region}`);
}

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
