/**
 * GoodWatch Explore — Client-side search, filter & browse
 * Queries Supabase REST API directly from the browser.
 */
(function () {
    'use strict';

    // ============ CONFIG ============
    const SUPABASE_URL = 'https://jdjqrlkynwfhbtyuddjk.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
        + '.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkanFybGt5bndmaGJ0eXVkZGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NzUwMTEsImV4cCI6MjA4MDA1MTAxMX0'
        + '.KDRMLCewVMp3lwphkUvtoWOkg6kyAk8iSbVkRKiHYSk';
    const TMDB_IMG = 'https://image.tmdb.org/t/p/w342';
    const PAGE_SIZE = 30;

    // ============ SLUG MANIFEST ============
    // Loaded from _slugs.json (movie ID → actual page slug, handles deduped slugs)
    let _slugManifest = null;
    (function loadSlugManifest() {
        fetch('/movies/_slugs.json')
            .then(function (r) { return r.ok ? r.json() : null; })
            .then(function (data) { _slugManifest = data; })
            .catch(function () { _slugManifest = null; });
    })();

    // ============ FILTER DEFINITIONS ============
    const FILTERS = {
        genre: {
            label: 'Genre',
            options: ['Action','Adventure','Animation','Comedy','Crime','Documentary','Drama','Family','Fantasy','History','Horror','Music','Mystery','Romance','Science Fiction','Thriller','War','Western']
        },
        language: {
            label: 'Language',
            options: [
                {v:'en',l:'English'},{v:'hi',l:'Hindi'},{v:'ta',l:'Tamil'},{v:'te',l:'Telugu'},
                {v:'ml',l:'Malayalam'},{v:'kn',l:'Kannada'},{v:'bn',l:'Bengali'},{v:'mr',l:'Marathi'},
                {v:'ko',l:'Korean'},{v:'ja',l:'Japanese'},{v:'es',l:'Spanish'},{v:'fr',l:'French'},
                {v:'zh',l:'Chinese'},{v:'pt',l:'Portuguese'},{v:'gu',l:'Gujarati'},{v:'pa',l:'Punjabi'}
            ]
        },
        platform: {
            label: 'Platform',
            options: ['Netflix','Amazon Prime Video','JioHotstar','Apple TV Plus','Sony LIV','Zee5']
        },
        mood: {
            label: 'Mood',
            options: [
                {v:'feel_good',l:'Feel-Good'},{v:'uplifting',l:'Uplifting'},{v:'dark',l:'Dark'},
                {v:'tense',l:'Intense'},{v:'calm',l:'Calm'},{v:'high_energy',l:'High Energy'},
                {v:'light',l:'Light'},{v:'heavy',l:'Heavy'},{v:'bittersweet',l:'Bittersweet'}
            ]
        },
        duration: {
            label: 'Duration',
            options: [
                {v:'0-90',l:'Under 90 min'},{v:'90-120',l:'90–120 min'},
                {v:'120-150',l:'120–150 min'},{v:'150-999',l:'Over 150 min'}
            ]
        },
        rating: {
            label: 'Rating',
            options: [
                {v:'9-10',l:'90+ GoodScore'},{v:'8-9',l:'80–89'},
                {v:'7-8',l:'70–79'},{v:'6-7',l:'60–69'}
            ]
        },
        decade: {
            label: 'Decade',
            options: [
                {v:'2020-2029',l:'2020s'},{v:'2010-2019',l:'2010s'},
                {v:'2000-2009',l:'2000s'},{v:'1990-1999',l:'1990s'},
                {v:'1980-1989',l:'1980s'},{v:'0-1979',l:'Before 1980'}
            ]
        }
    };

    const SORT_OPTIONS = {
        'rating-desc': {label:'Highest Rated', order:'composite_score.desc.nullslast'},
        'rating-asc':  {label:'Lowest Rated',  order:'composite_score.asc.nullsfirst'},
        'year-desc':   {label:'Newest First',   order:'year.desc.nullslast'},
        'year-asc':    {label:'Oldest First',   order:'year.asc.nullsfirst'},
        'runtime-desc':{label:'Longest First',  order:'runtime.desc.nullslast'},
        'runtime-asc': {label:'Shortest First', order:'runtime.asc.nullsfirst'}
    };

    // ============ STATE ============
    let state = {
        query: '',
        genre: [],
        language: [],
        platform: [],
        mood: [],
        duration: null,
        rating: null,
        decade: null,
        contentType: 'all',
        sort: 'rating-desc',
        offset: 0,
        loading: false,
        hasMore: true,
        totalCount: null,
        activeCategory: null
    };

    // ============ PAGE MODE ============
    // Detect which page we're on
    const pageMode = (function () {
        const path = window.location.pathname;
        if (path.includes('/new-releases')) return 'new-releases';
        if (path.includes('/platforms')) return 'platforms';
        return 'explore';
    })();

    // ============ INIT ============
    function init() {
        readURLState();
        buildFilterUI();
        bindEvents();
        renderActiveFilters();

        // Page-specific defaults
        if (pageMode === 'new-releases' && state.decade === null && state.query === '') {
            state.decade = '2024-2029';
        }

        fetchMovies();
    }

    // ============ URL STATE ============
    function readURLState() {
        const p = new URLSearchParams(window.location.search);
        state.query = p.get('q') || '';
        state.genre = p.get('genre') ? p.get('genre').split(',') : [];
        state.language = p.get('lang') ? p.get('lang').split(',') : [];
        state.platform = p.get('platform') ? p.get('platform').split(',') : [];
        state.mood = p.get('mood') ? p.get('mood').split(',') : [];
        state.duration = p.get('duration') || null;
        state.rating = p.get('rating') || null;
        state.decade = p.get('decade') || null;
        state.contentType = p.get('type') || 'all';
        state.sort = p.get('sort') || 'rating-desc';

        const si = document.getElementById('search-input');
        if (si) si.value = state.query;
        const ss = document.getElementById('sort-select');
        if (ss) ss.value = state.sort;
    }

    function writeURLState() {
        const p = new URLSearchParams();
        if (state.query) p.set('q', state.query);
        if (state.genre.length) p.set('genre', state.genre.join(','));
        if (state.language.length) p.set('lang', state.language.join(','));
        if (state.platform.length) p.set('platform', state.platform.join(','));
        if (state.mood.length) p.set('mood', state.mood.join(','));
        if (state.duration) p.set('duration', state.duration);
        if (state.rating) p.set('rating', state.rating);
        if (state.decade) p.set('decade', state.decade);
        if (state.contentType !== 'all') p.set('type', state.contentType);
        if (state.sort !== 'rating-desc') p.set('sort', state.sort);
        const qs = p.toString();
        const url = window.location.pathname + (qs ? '?' + qs : '');
        window.history.replaceState(null, '', url);
    }

    // ============ SUPABASE QUERIES ============
    async function fetchMovies(append) {
        if (state.loading) return;
        state.loading = true;
        if (!append) state.offset = 0;
        showLoading(append);

        const params = [];
        params.push('select=id,tmdb_id,title,year,content_type,poster_path,composite_score,imdb_rating,vote_average,runtime,genres,ott_providers,original_language,tags,director');

        // Only show movies that have static pages (composite_score not null)
        params.push('composite_score=not.is.null');

        // Search
        if (state.query) {
            const q = state.query.replace(/[%_\\]/g, '\\$&');
            params.push('or=(title.ilike.*' + encodeURIComponent(q) + '*,director.ilike.*' + encodeURIComponent(q) + '*)');
        }

        // Genre filter (JSONB array of objects with "name" key)
        if (state.genre.length) {
            for (const g of state.genre) {
                params.push('genres=cs.' + encodeURIComponent('[{"name":"' + g + '"}]'));
            }
        }

        // Language
        if (state.language.length) {
            if (state.language.length === 1) {
                params.push('original_language=eq.' + state.language[0]);
            } else {
                params.push('or=(' + state.language.map(l => 'original_language.eq.' + l).join(',') + ')');
            }
        }

        // Platform (ott_providers is JSONB array of objects with "name" key)
        if (state.platform.length) {
            for (const pl of state.platform) {
                params.push('ott_providers=cs.' + encodeURIComponent('[{"name":"' + pl + '"}]'));
            }
        }

        // Mood (tags is TEXT[] array)
        if (state.mood.length) {
            for (const m of state.mood) {
                params.push('tags=cs.{' + encodeURIComponent(m) + '}');
            }
        }

        // Duration
        if (state.duration) {
            const [lo, hi] = state.duration.split('-').map(Number);
            if (lo > 0) params.push('runtime=gte.' + lo);
            if (hi < 999) params.push('runtime=lte.' + hi);
        }

        // Rating (composite_score is 0-10 scale)
        if (state.rating) {
            const [lo, hi] = state.rating.split('-').map(Number);
            params.push('composite_score=gte.' + lo);
            if (hi < 10) params.push('composite_score=lt.' + hi);
        }

        // Decade
        if (state.decade) {
            const [lo, hi] = state.decade.split('-').map(Number);
            if (lo > 0) params.push('year=gte.' + lo);
            params.push('year=lte.' + hi);
        }

        // Content type
        if (state.contentType !== 'all') {
            params.push('content_type=eq.' + state.contentType);
        }

        // Sort
        const sortCfg = SORT_OPTIONS[state.sort] || SORT_OPTIONS['rating-desc'];
        params.push('order=' + sortCfg.order);

        // Pagination
        params.push('limit=' + PAGE_SIZE);
        params.push('offset=' + state.offset);

        const url = SUPABASE_URL + '/rest/v1/movies?' + params.join('&');

        try {
            const resp = await fetch(url, {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': 'Bearer ' + SUPABASE_KEY,
                    'Prefer': 'count=estimated'
                }
            });

            if (!resp.ok) {
                throw new Error('Supabase query failed: ' + resp.status);
            }

            const movies = await resp.json();

            // Parse total count from content-range header
            const cr = resp.headers.get('content-range');
            if (cr) {
                const m = cr.match(/\/(\d+)/);
                if (m) state.totalCount = parseInt(m[1], 10);
            }

            state.hasMore = movies.length === PAGE_SIZE;
            state.offset += movies.length;
            state.loading = false;

            renderMovies(movies, append);
            renderResultsCount();
            updateLoadMore();
        } catch (err) {
            console.error('Fetch error:', err);
            state.loading = false;
            showError();
        }
    }

    // ============ SLUG ============
    // Client-side fallback — only used when manifest not loaded yet
    function slugify(title, year) {
        let s = title.toLowerCase().trim();
        s = s.replace(/['\u2019\u2018\u2032]/g, '');
        s = s.replace(/[^a-z0-9\s-]/g, '');
        s = s.replace(/[\s-]+/g, '-').replace(/^-|-$/g, '');
        if (year) s += '-' + year;
        return s;
    }

    // Authoritative slug resolution: manifest first, fallback to client-side
    // Returns null if manifest is loaded but movie has no page (prevents 404s)
    function resolveSlug(movie) {
        if (_slugManifest) {
            // Manifest loaded — use it as source of truth
            if (movie.id && _slugManifest[movie.id]) {
                return _slugManifest[movie.id];
            }
            return null; // Movie has no static page
        }
        // Manifest not loaded yet — fallback to client-side slugify
        return slugify(movie.title, movie.year);
    }

    // ============ GOODSCORE ============
    function goodScore(movie) {
        var cs = movie.composite_score;
        if (cs) return Math.round(cs * 10);
        var imdb = movie.imdb_rating;
        var tmdb = movie.vote_average;
        if (imdb && tmdb) return Math.round((imdb * 0.75 + tmdb * 0.25) * 10);
        if (imdb) return Math.round(imdb * 10);
        if (tmdb) return Math.round(tmdb * 10);
        return null;
    }

    function scoreColor(score) {
        if (score === null) return 'text-gray-500';
        if (score >= 80) return 'text-green-400';
        if (score >= 65) return 'text-gw-accent';
        if (score >= 50) return 'text-yellow-400';
        return 'text-red-400';
    }

    // ============ RENDERING ============
    function renderMovies(movies, append) {
        const grid = document.getElementById('movie-grid');
        if (!grid) return;

        if (!append) grid.innerHTML = '';

        if (!append && movies.length === 0) {
            showEmpty();
            return;
        }
        hideEmpty();

        const frag = document.createDocumentFragment();
        movies.forEach(function (m) {
            frag.appendChild(renderMovieCard(m));
        });
        grid.appendChild(frag);
    }

    function renderMovieCard(m) {
        const score = goodScore(m);
        const slug = resolveSlug(m);
        var genres = '';
        if (m.genres && Array.isArray(m.genres)) {
            genres = m.genres.slice(0, 2).map(function (g) {
                return typeof g === 'string' ? g : (g.name || '');
            }).filter(Boolean).join(', ');
        }
        var posterUrl = m.poster_path ? (TMDB_IMG + m.poster_path) : '';

        var wrapper = document.createElement('div');
        wrapper.className = 'relative group';

        var a = document.createElement('a');
        if (slug) {
            a.href = '/movies/' + slug + '/';
        }
        a.className = 'block';

        var scoreHtml = '';
        if (score !== null) {
            scoreHtml = '<div class="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-lg px-2 py-1">'
                + '<span class="' + scoreColor(score) + ' text-sm font-bold">' + score + '</span></div>';
        }

        var imgHtml = posterUrl
            ? '<img src="' + esc(posterUrl) + '" alt="' + esc(m.title) + '" class="w-full h-full object-cover" loading="lazy" onerror="this.parentElement.classList.add(\'poster-fallback\');this.remove()">'
            : '<div class="w-full h-full flex items-center justify-center bg-gw-surface text-gw-text-muted text-xs p-2 text-center">' + esc(m.title) + '</div>';

        a.innerHTML = '<div class="relative aspect-[2/3] rounded-xl overflow-hidden mb-2">'
            + imgHtml
            + scoreHtml
            + '<div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>'
            + '</div>'
            + '<h3 class="font-medium text-sm group-hover:text-gw-accent transition-colors truncate">' + esc(m.title) + '</h3>'
            + '<div class="flex items-center gap-1 text-xs text-gw-text-muted">'
            + (m.year ? '<span>' + m.year + '</span>' : '')
            + (genres ? '<span class="text-gw-border">\u00b7</span><span>' + esc(genres) + '</span>' : '')
            + '</div>';

        wrapper.appendChild(a);

        // Watchlist bookmark button
        if (window.gwWatchlist) {
            var isSaved = window.gwWatchlist.check(m.id);
            var btn = document.createElement('button');
            btn.className = 'absolute top-2 left-2 z-10 w-8 h-8 flex items-center justify-center rounded-lg bg-black/60 backdrop-blur-sm hover:bg-black/80 transition-colors';
            btn.title = isSaved ? 'Remove from Watchlist' : 'Add to Watchlist';
            btn.innerHTML = isSaved
                ? '<svg class="w-5 h-5 text-gw-accent" fill="currentColor" viewBox="0 0 24 24"><path d="M5 3h14a2 2 0 012 2v16l-9-4-9 4V5a2 2 0 012-2z"/></svg>'
                : '<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>';
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                window.gwWatchlist.toggle(m.id, m.tmdb_id).then(function () {
                    var nowSaved = window.gwWatchlist.check(m.id);
                    btn.title = nowSaved ? 'Remove from Watchlist' : 'Add to Watchlist';
                    btn.innerHTML = nowSaved
                        ? '<svg class="w-5 h-5 text-gw-accent" fill="currentColor" viewBox="0 0 24 24"><path d="M5 3h14a2 2 0 012 2v16l-9-4-9 4V5a2 2 0 012-2z"/></svg>'
                        : '<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>';
                }).catch(function (err) { console.error('Watchlist error:', err); });
            });
            wrapper.appendChild(btn);
        }

        return wrapper;
    }

    function renderResultsCount() {
        var el = document.getElementById('results-count');
        if (!el) return;
        var hasFilters = state.query || state.genre.length || state.language.length
            || state.platform.length || state.mood.length || state.duration
            || state.rating || state.decade || state.contentType !== 'all';
        if (hasFilters && state.totalCount !== null) {
            el.textContent = state.totalCount.toLocaleString() + ' movies found';
        } else {
            el.textContent = '';
        }
    }

    function showLoading(append) {
        if (append) {
            var btn = document.getElementById('load-more');
            if (btn) { btn.textContent = 'Loading...'; btn.disabled = true; }
            return;
        }
        var grid = document.getElementById('movie-grid');
        if (!grid) return;
        grid.innerHTML = '';
        for (var i = 0; i < 15; i++) {
            var div = document.createElement('div');
            div.innerHTML = '<div class="aspect-[2/3] rounded-xl skeleton mb-2"></div>'
                + '<div class="h-4 w-3/4 skeleton rounded mb-1"></div>'
                + '<div class="h-3 w-1/2 skeleton rounded"></div>';
            grid.appendChild(div);
        }
        hideEmpty();
    }

    function showEmpty() {
        var el = document.getElementById('empty-state');
        if (el) el.classList.remove('hidden');
        var grid = document.getElementById('movie-grid');
        if (grid) grid.innerHTML = '';
    }

    function hideEmpty() {
        var el = document.getElementById('empty-state');
        if (el) el.classList.add('hidden');
    }

    function showError() {
        var grid = document.getElementById('movie-grid');
        if (grid) grid.innerHTML = '<div class="col-span-full text-center py-16 text-gw-text-muted">'
            + '<p class="text-lg mb-2">Something went wrong</p>'
            + '<p class="text-sm">Could not load movies. Please try again.</p>'
            + '</div>';
    }

    function updateLoadMore() {
        var btn = document.getElementById('load-more');
        if (!btn) return;
        btn.textContent = 'Load More Movies';
        btn.disabled = false;
        btn.style.display = state.hasMore ? '' : 'none';
    }

    // ============ FILTERS UI ============
    function buildFilterUI() {
        // Build filter category tabs
        var catRow = document.getElementById('filter-categories');
        if (!catRow) return;

        Object.keys(FILTERS).forEach(function (key) {
            var btn = document.createElement('button');
            btn.className = 'filter-cat-btn px-4 py-2 rounded-full text-sm font-medium border border-gw-border text-gw-text-muted hover:border-gw-accent/50 hover:text-gw-text transition-colors whitespace-nowrap';
            btn.dataset.cat = key;
            btn.textContent = FILTERS[key].label;

            // Show active count
            var count = getFilterCount(key);
            if (count > 0) {
                btn.textContent = FILTERS[key].label + ' \u00b7 ' + count;
                btn.classList.add('filter-chip-active');
            }

            btn.addEventListener('click', function () {
                toggleCategory(key);
            });
            catRow.appendChild(btn);
        });
    }

    function getFilterCount(key) {
        if (key === 'genre') return state.genre.length;
        if (key === 'language') return state.language.length;
        if (key === 'platform') return state.platform.length;
        if (key === 'mood') return state.mood.length;
        if (key === 'duration') return state.duration ? 1 : 0;
        if (key === 'rating') return state.rating ? 1 : 0;
        if (key === 'decade') return state.decade ? 1 : 0;
        return 0;
    }

    function toggleCategory(key) {
        var chipsEl = document.getElementById('filter-chips');
        if (!chipsEl) return;

        if (state.activeCategory === key) {
            state.activeCategory = null;
            chipsEl.innerHTML = '';
            chipsEl.classList.add('hidden');
            updateCategoryButtons();
            return;
        }

        state.activeCategory = key;
        chipsEl.innerHTML = '';
        chipsEl.classList.remove('hidden');

        var filterDef = FILTERS[key];
        filterDef.options.forEach(function (opt) {
            var value, label;
            if (typeof opt === 'string') {
                value = opt; label = opt;
            } else {
                value = opt.v; label = opt.l;
            }

            var chip = document.createElement('button');
            chip.className = 'px-3 py-1.5 rounded-full text-sm border border-gw-border text-gw-text-muted hover:border-gw-accent/50 transition-colors';
            chip.textContent = label;
            chip.dataset.value = value;

            // Check if active
            if (isFilterActive(key, value)) {
                chip.classList.add('filter-chip-active');
            }

            chip.addEventListener('click', function () {
                toggleFilter(key, value);
                // Update chip visual
                if (isFilterActive(key, value)) {
                    chip.classList.add('filter-chip-active');
                } else {
                    chip.classList.remove('filter-chip-active');
                }
            });

            chipsEl.appendChild(chip);
        });

        updateCategoryButtons();
    }

    function isFilterActive(key, value) {
        if (key === 'genre') return state.genre.includes(value);
        if (key === 'language') return state.language.includes(value);
        if (key === 'platform') return state.platform.includes(value);
        if (key === 'mood') return state.mood.includes(value);
        if (key === 'duration') return state.duration === value;
        if (key === 'rating') return state.rating === value;
        if (key === 'decade') return state.decade === value;
        return false;
    }

    function toggleFilter(key, value) {
        // Multi-select for genre, language, platform, mood
        if (['genre', 'language', 'platform', 'mood'].includes(key)) {
            var arr = state[key];
            var idx = arr.indexOf(value);
            if (idx >= 0) arr.splice(idx, 1);
            else arr.push(value);
        } else {
            // Single-select for duration, rating, decade
            state[key] = state[key] === value ? null : value;
        }

        state.offset = 0;
        state.totalCount = null;
        writeURLState();
        renderActiveFilters();
        updateCategoryButtons();
        fetchMovies();
    }

    function updateCategoryButtons() {
        document.querySelectorAll('.filter-cat-btn').forEach(function (btn) {
            var key = btn.dataset.cat;
            var count = getFilterCount(key);
            var label = FILTERS[key].label;
            btn.textContent = count > 0 ? label + ' \u00b7 ' + count : label;

            btn.classList.toggle('filter-chip-active', count > 0 || state.activeCategory === key);
        });
    }

    function renderActiveFilters() {
        var container = document.getElementById('active-filters');
        if (!container) return;

        var pills = [];

        state.genre.forEach(function (g) {
            pills.push({key: 'genre', value: g, label: g});
        });
        state.language.forEach(function (l) {
            var def = FILTERS.language.options.find(function (o) { return o.v === l; });
            pills.push({key: 'language', value: l, label: def ? def.l : l});
        });
        state.platform.forEach(function (p) {
            pills.push({key: 'platform', value: p, label: p});
        });
        state.mood.forEach(function (m) {
            pills.push({key: 'mood', value: m, label: m});
        });
        if (state.duration) {
            var dd = FILTERS.duration.options.find(function (o) { return o.v === state.duration; });
            pills.push({key: 'duration', value: state.duration, label: dd ? dd.l : state.duration});
        }
        if (state.rating) {
            var rd = FILTERS.rating.options.find(function (o) { return o.v === state.rating; });
            pills.push({key: 'rating', value: state.rating, label: rd ? rd.l : state.rating});
        }
        if (state.decade) {
            var dec = FILTERS.decade.options.find(function (o) { return o.v === state.decade; });
            pills.push({key: 'decade', value: state.decade, label: dec ? dec.l : state.decade});
        }

        if (pills.length === 0) {
            container.classList.add('hidden');
            return;
        }
        container.classList.remove('hidden');
        container.innerHTML = '';

        pills.forEach(function (p) {
            var pill = document.createElement('button');
            pill.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gw-accent/15 text-gw-accent border border-gw-accent/30';
            pill.innerHTML = esc(p.label) + ' <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>';
            pill.addEventListener('click', function () {
                toggleFilter(p.key, p.value);
                // Also update chips if that category is open
                if (state.activeCategory === p.key) {
                    toggleCategory(p.key);
                    toggleCategory(p.key);
                }
            });
            container.appendChild(pill);
        });

        var clearBtn = document.createElement('button');
        clearBtn.className = 'text-xs text-gw-text-muted hover:text-gw-accent transition-colors ml-1';
        clearBtn.textContent = 'Clear all';
        clearBtn.addEventListener('click', clearAllFilters);
        container.appendChild(clearBtn);
    }

    function clearAllFilters() {
        state.genre = [];
        state.language = [];
        state.platform = [];
        state.mood = [];
        state.duration = null;
        state.rating = null;
        state.decade = null;
        state.offset = 0;
        state.totalCount = null;

        writeURLState();
        renderActiveFilters();
        updateCategoryButtons();

        // Close & reopen chips if a category is open
        if (state.activeCategory) {
            var cat = state.activeCategory;
            state.activeCategory = null;
            toggleCategory(cat);
        }

        fetchMovies();
    }

    // ============ PLATFORM TILES (platforms page) ============
    function initPlatformTiles() {
        var tiles = document.querySelectorAll('.platform-tile');
        tiles.forEach(function (tile) {
            tile.addEventListener('click', function () {
                var pl = tile.dataset.platform;
                // Toggle
                var idx = state.platform.indexOf(pl);
                if (idx >= 0) {
                    state.platform.splice(idx, 1);
                    tile.classList.remove('platform-tile-active');
                } else {
                    state.platform = [pl]; // single select for tiles
                    // Deselect others
                    tiles.forEach(function (t) { t.classList.remove('platform-tile-active'); });
                    tile.classList.add('platform-tile-active');
                }
                state.offset = 0;
                state.totalCount = null;
                writeURLState();
                fetchMovies();
            });
        });
    }

    // ============ EVENT BINDINGS ============
    function bindEvents() {
        // Search input
        var si = document.getElementById('search-input');
        if (si) {
            si.addEventListener('input', debounce(function () {
                state.query = si.value.trim();
                state.offset = 0;
                state.totalCount = null;
                writeURLState();
                fetchMovies();
                // Toggle clear button / search icon
                var cb = document.getElementById('search-clear');
                var si2 = document.getElementById('search-icon');
                if (cb) cb.style.display = state.query ? 'flex' : 'none';
                if (si2) si2.style.display = state.query ? 'none' : '';
            }, 300));

            // Clear button
            var cb = document.getElementById('search-clear');
            var si2 = document.getElementById('search-icon');
            if (cb) {
                cb.style.display = state.query ? 'flex' : 'none';
                if (si2) si2.style.display = state.query ? 'none' : '';
                cb.addEventListener('click', function () {
                    si.value = '';
                    state.query = '';
                    state.offset = 0;
                    state.totalCount = null;
                    cb.style.display = 'none';
                    if (si2) si2.style.display = '';
                    writeURLState();
                    fetchMovies();
                });
            }
        }

        // Sort
        var ss = document.getElementById('sort-select');
        if (ss) {
            ss.addEventListener('change', function () {
                state.sort = ss.value;
                state.offset = 0;
                state.totalCount = null;
                writeURLState();
                fetchMovies();
            });
        }

        // Content type buttons
        document.querySelectorAll('[data-type]').forEach(function (btn) {
            if (state.contentType === btn.dataset.type) btn.classList.add('type-active');
            btn.addEventListener('click', function () {
                document.querySelectorAll('[data-type]').forEach(function (b) { b.classList.remove('type-active'); });
                btn.classList.add('type-active');
                state.contentType = btn.dataset.type;
                state.offset = 0;
                state.totalCount = null;
                writeURLState();
                fetchMovies();
            });
        });

        // Load more
        var lm = document.getElementById('load-more');
        if (lm) {
            lm.addEventListener('click', function () {
                fetchMovies(true);
            });
        }

        // Back/forward
        window.addEventListener('popstate', function () {
            readURLState();
            renderActiveFilters();
            updateCategoryButtons();
            fetchMovies();
        });

        // Platform tiles
        if (pageMode === 'platforms') initPlatformTiles();
    }

    // ============ UTILITIES ============
    function debounce(fn, ms) {
        var timer;
        return function () {
            var args = arguments;
            clearTimeout(timer);
            timer = setTimeout(function () { fn.apply(null, args); }, ms);
        };
    }

    function esc(s) {
        if (!s) return '';
        var d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }

    // ============ START ============
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
