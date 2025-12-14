globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createClient } from '../../chunks/wrapper_CRWxChbs.mjs';
export { renderers } from '../../renderers.mjs';

const supabase = createClient(
  "https://jdjqrlkynwfhbtyuddjk.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkanFybGt5bndmaGJ0eXVkZGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NzUwMTEsImV4cCI6MjA4MDA1MTAxMX0.KDRMLCewVMp3lwphkUvtoWOkg6kyAk8iSbVkRKiHYSk"
);
const POST = async ({ request }) => {
  try {
    const body = await request.json();
    const { userId, tmdbId, provider, sourcePage } = body;
    const { data: movie } = await supabase.from("movies").select("id").eq("tmdb_id", parseInt(tmdbId)).single();
    const { data: watch, error } = await supabase.from("user_watch_history").insert({
      user_id: userId || "anonymous",
      movie_id: movie?.id || null,
      tmdb_id: parseInt(tmdbId),
      status: "started",
      watched_on_provider: provider,
      source_page: sourcePage || "unknown",
      session_date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      started_at: (/* @__PURE__ */ new Date()).toISOString()
    }).select("id").single();
    if (error) {
      console.error("Watch history insert error:", error);
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify({ success: true, historyId: watch?.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("Watch history API error:", err);
    return new Response(JSON.stringify({ success: false, error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
const PUT = async ({ request }) => {
  try {
    const body = await request.json();
    const { historyId, tmdbId, userId, status, reaction, wouldRecommend, provider } = body;
    const updateData = {
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (status) {
      updateData.status = status;
      if (status === "finished") {
        updateData.finished_at = (/* @__PURE__ */ new Date()).toISOString();
      }
    }
    if (reaction) updateData.reaction = reaction;
    if (wouldRecommend !== void 0) updateData.would_recommend = wouldRecommend;
    let query = supabase.from("user_watch_history").update(updateData);
    if (historyId) {
      query = query.eq("id", historyId);
    } else if (tmdbId && userId) {
      query = query.eq("user_id", userId).eq("tmdb_id", parseInt(tmdbId)).eq("status", "started").order("started_at", { ascending: false }).limit(1);
    }
    const { error } = await query;
    if (error) {
      console.error("Watch history update error:", error);
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (status === "finished" && tmdbId) {
      await boostConfidenceOnSuccess(parseInt(tmdbId), provider, "IN");
      await updateTasteStats(userId, reaction);
    }
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("Watch history API error:", err);
    return new Response(JSON.stringify({ success: false, error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
async function boostConfidenceOnSuccess(tmdbId, provider, region) {
  const { data: snapshot } = await supabase.from("decision_snapshots").select("confidence_score, user_success_count, suppressed_reason").eq("tmdb_id", tmdbId).eq("region", region).single();
  if (!snapshot) return;
  const newConfidence = Math.min((snapshot.confidence_score || 0) + 0.2, 1);
  const newSuccessCount = (snapshot.user_success_count || 0) + 1;
  const shouldRevalidate = snapshot.suppressed_reason === "community_reported_unavailable" && newSuccessCount >= 2;
  await supabase.from("decision_snapshots").update({
    confidence_score: newConfidence,
    user_success_count: newSuccessCount,
    last_success_at: (/* @__PURE__ */ new Date()).toISOString(),
    verified_at: (/* @__PURE__ */ new Date()).toISOString(),
    updated_at: (/* @__PURE__ */ new Date()).toISOString(),
    // Revalidate if conditions met
    ...shouldRevalidate ? {
      is_valid: true,
      invalid_reason: null,
      suppressed_at: null,
      suppressed_reason: null,
      suppression_expires_at: null
    } : {}
  }).eq("tmdb_id", tmdbId).eq("region", region);
  console.log(`[CONFIDENCE BOOST] tmdb_id=${tmdbId}, new_score=${newConfidence}, success_count=${newSuccessCount}`);
  if (provider) {
    await supabase.from("provider_overrides").upsert({
      tmdb_id: tmdbId,
      region,
      provider_name: provider,
      availability_type: "flatrate",
      confidence_boost: 0.1,
      source: "user_watch_success",
      is_active: true,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toISOString()
    }, {
      onConflict: "tmdb_id,region,provider_name"
    });
  }
}
async function updateTasteStats(userId, reaction) {
  if (!userId) return;
  const { data: profile } = await supabase.from("user_taste_profile").select("total_watches, total_loved").eq("user_id", userId).single();
  const totalWatches = (profile?.total_watches || 0) + 1;
  const totalLoved = (profile?.total_loved || 0) + (reaction === "loved" ? 1 : 0);
  await supabase.from("user_taste_profile").upsert({
    user_id: userId,
    total_watches: totalWatches,
    total_loved: totalLoved,
    last_activity_at: (/* @__PURE__ */ new Date()).toISOString(),
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }, {
    onConflict: "user_id"
  });
}

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST,
  PUT
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
