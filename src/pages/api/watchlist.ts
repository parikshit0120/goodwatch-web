import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

// Add to watchlist
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { userId, tmdbId, sourcePage } = body;
    
    // Get movie ID
    const { data: movie } = await supabase
      .from('movies')
      .select('id')
      .eq('tmdb_id', parseInt(tmdbId))
      .single();
    
    if (!movie) {
      return new Response(JSON.stringify({ success: false, error: 'Movie not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const { error } = await supabase
      .from('user_watchlist')
      .upsert({
        user_id: userId || 'anonymous',
        movie_id: movie.id,
        tmdb_id: parseInt(tmdbId),
        status: 'queued',
        added_from: sourcePage || 'unknown'
      }, {
        onConflict: 'user_id,tmdb_id'
      });
    
    if (error) {
      console.error('Watchlist insert error:', error);
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (err) {
    console.error('Watchlist API error:', err);
    return new Response(JSON.stringify({ success: false, error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Update watchlist item (plan date, context, status)
export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { userId, itemId, tmdbId, plannedDate, watchContext, status, priority } = body;
    
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    if (plannedDate !== undefined) updateData.planned_date = plannedDate;
    if (watchContext !== undefined) updateData.watch_context = watchContext;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    
    let query = supabase.from('user_watchlist').update(updateData);
    
    if (itemId) {
      query = query.eq('id', itemId);
    } else if (tmdbId) {
      query = query.eq('user_id', userId || 'anonymous').eq('tmdb_id', parseInt(tmdbId));
    }
    
    const { error } = await query;
    
    if (error) {
      console.error('Watchlist update error:', error);
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (err) {
    console.error('Watchlist API error:', err);
    return new Response(JSON.stringify({ success: false, error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Remove from watchlist
export const DELETE: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { userId, itemId, tmdbId } = body;
    
    let query = supabase.from('user_watchlist').delete();
    
    if (itemId) {
      query = query.eq('id', itemId);
    } else if (tmdbId) {
      query = query.eq('user_id', userId || 'anonymous').eq('tmdb_id', parseInt(tmdbId));
    }
    
    const { error } = await query;
    
    if (error) {
      console.error('Watchlist delete error:', error);
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (err) {
    console.error('Watchlist API error:', err);
    return new Response(JSON.stringify({ success: false, error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
