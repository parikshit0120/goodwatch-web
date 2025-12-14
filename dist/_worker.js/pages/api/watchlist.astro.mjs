globalThis.process ??= {}; globalThis.process.env ??= {};
import { s as supabase } from '../../chunks/supabase_MFvNP5ai.mjs';
export { renderers } from '../../renderers.mjs';

const POST = async ({ request }) => {
  try {
    const body = await request.json();
    const { userId, tmdbId, sourcePage } = body;
    const { data: movie } = await supabase.from("movies").select("id").eq("tmdb_id", parseInt(tmdbId)).single();
    if (!movie) {
      return new Response(JSON.stringify({ success: false, error: "Movie not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    const { error } = await supabase.from("user_watchlist").upsert({
      user_id: userId || "anonymous",
      movie_id: movie.id,
      tmdb_id: parseInt(tmdbId),
      status: "queued",
      added_from: sourcePage || "unknown"
    }, {
      onConflict: "user_id,tmdb_id"
    });
    if (error) {
      console.error("Watchlist insert error:", error);
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("Watchlist API error:", err);
    return new Response(JSON.stringify({ success: false, error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
const PUT = async ({ request }) => {
  try {
    const body = await request.json();
    const { userId, itemId, tmdbId, plannedDate, watchContext, status, priority } = body;
    const updateData = {
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (plannedDate !== void 0) updateData.planned_date = plannedDate;
    if (watchContext !== void 0) updateData.watch_context = watchContext;
    if (status !== void 0) updateData.status = status;
    if (priority !== void 0) updateData.priority = priority;
    let query = supabase.from("user_watchlist").update(updateData);
    if (itemId) {
      query = query.eq("id", itemId);
    } else if (tmdbId) {
      query = query.eq("user_id", userId || "anonymous").eq("tmdb_id", parseInt(tmdbId));
    }
    const { error } = await query;
    if (error) {
      console.error("Watchlist update error:", error);
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("Watchlist API error:", err);
    return new Response(JSON.stringify({ success: false, error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
const DELETE = async ({ request }) => {
  try {
    const body = await request.json();
    const { userId, itemId, tmdbId } = body;
    let query = supabase.from("user_watchlist").delete();
    if (itemId) {
      query = query.eq("id", itemId);
    } else if (tmdbId) {
      query = query.eq("user_id", userId || "anonymous").eq("tmdb_id", parseInt(tmdbId));
    }
    const { error } = await query;
    if (error) {
      console.error("Watchlist delete error:", error);
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("Watchlist API error:", err);
    return new Response(JSON.stringify({ success: false, error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  DELETE,
  POST,
  PUT
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
