/**
 * GoodWatch Watchlist — Supabase watchlist module for web
 * Requires: auth.js loaded before this script.
 */
(function () {
    'use strict';

    var _cache = {}; // movieId -> true

    function _sb() {
        return window.gwAuth ? window.gwAuth.getSupabase() : null;
    }

    function _authHeaders() {
        return window.gwAuth.getSession().then(function (res) {
            var token = res.data && res.data.session ? res.data.session.access_token : null;
            if (!token) throw new Error('Not authenticated');
            return {
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkanFybGt5bndmaGJ0eXVkZGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NzUwMTEsImV4cCI6MjA4MDA1MTAxMX0.KDRMLCewVMp3lwphkUvtoWOkg6kyAk8iSbVkRKiHYSk',
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            };
        });
    }

    function gwWatchlistAdd(movieId, tmdbId) {
        return window.gwAuth.getUser().then(function (res) {
            var userId = res.data && res.data.user ? res.data.user.id : null;
            if (!userId) throw new Error('Not authenticated');
            return _authHeaders().then(function (headers) {
                return fetch('https://jdjqrlkynwfhbtyuddjk.supabase.co/rest/v1/user_watchlist', {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify({
                        user_id: userId,
                        movie_id: movieId,
                        tmdb_id: tmdbId || null,
                        status: 'want_to_watch',
                        added_from: 'web'
                    })
                }).then(function (resp) {
                    if (resp.ok || resp.status === 201) {
                        _cache[movieId] = true;
                        return true;
                    }
                    // Handle duplicate (409 conflict)
                    if (resp.status === 409) {
                        _cache[movieId] = true;
                        return true;
                    }
                    throw new Error('Failed to add: ' + resp.status);
                });
            });
        }).catch(function (err) {
            console.error('Watchlist add error:', err.message);
            return false;
        });
    }

    function gwWatchlistRemove(movieId) {
        return window.gwAuth.getUser().then(function (res) {
            var userId = res.data && res.data.user ? res.data.user.id : null;
            if (!userId) throw new Error('Not authenticated');
            return _authHeaders().then(function (headers) {
                return fetch('https://jdjqrlkynwfhbtyuddjk.supabase.co/rest/v1/user_watchlist?user_id=eq.' + userId + '&movie_id=eq.' + movieId, {
                    method: 'DELETE',
                    headers: headers
                }).then(function (resp) {
                    if (resp.ok) {
                        delete _cache[movieId];
                        return true;
                    }
                    throw new Error('Failed to remove: ' + resp.status);
                });
            });
        }).catch(function (err) {
            console.error('Watchlist remove error:', err.message);
            return false;
        });
    }

    function gwWatchlistGet() {
        return window.gwAuth.getUser().then(function (res) {
            var userId = res.data && res.data.user ? res.data.user.id : null;
            if (!userId) throw new Error('Not authenticated');
            return _authHeaders().then(function (headers) {
                return fetch('https://jdjqrlkynwfhbtyuddjk.supabase.co/rest/v1/user_watchlist?user_id=eq.' + userId + '&order=created_at.desc&select=movie_id,tmdb_id,status,created_at', {
                    headers: headers
                }).then(function (resp) {
                    if (!resp.ok) throw new Error('Failed to fetch: ' + resp.status);
                    return resp.json();
                }).then(function (items) {
                    // Populate cache
                    _cache = {};
                    items.forEach(function (item) { _cache[item.movie_id] = true; });
                    return items;
                });
            });
        });
    }

    function gwWatchlistCheck(movieId) {
        return movieId in _cache;
    }

    function gwWatchlistToggle(movieId, tmdbId) {
        if (gwWatchlistCheck(movieId)) {
            return gwWatchlistRemove(movieId);
        } else {
            return gwWatchlistAdd(movieId, tmdbId);
        }
    }

    function gwWatchlistLoadCache() {
        return gwWatchlistGet().then(function () { return true; }).catch(function () { return false; });
    }

    window.gwWatchlist = {
        add: gwWatchlistAdd,
        remove: gwWatchlistRemove,
        get: gwWatchlistGet,
        check: gwWatchlistCheck,
        toggle: gwWatchlistToggle,
        loadCache: gwWatchlistLoadCache
    };
})();
