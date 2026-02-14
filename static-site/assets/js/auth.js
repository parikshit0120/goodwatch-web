/**
 * GoodWatch Auth — Supabase Auth module for web
 * Requires: @supabase/supabase-js UMD loaded before this script.
 */
(function () {
    'use strict';

    var SUPABASE_URL = 'https://jdjqrlkynwfhbtyuddjk.supabase.co';
    var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
        + '.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkanFybGt5bndmaGJ0eXVkZGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NzUwMTEsImV4cCI6MjA4MDA1MTAxMX0'
        + '.KDRMLCewVMp3lwphkUvtoWOkg6kyAk8iSbVkRKiHYSk';

    var REDIRECT_URL = window.location.origin + '/auth/callback.html';

    // Create Supabase client (singleton)
    var _sb = null;
    function getSb() {
        if (!_sb) {
            if (!window.supabase || !window.supabase.createClient) {
                console.error('GWAuth: Supabase JS not loaded');
                return null;
            }
            _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        }
        return _sb;
    }

    // ============ Public API ============

    function gwSignInWithGoogle() {
        var sb = getSb();
        if (!sb) return Promise.reject(new Error('Supabase not loaded'));
        // Remember current page for post-auth redirect
        sessionStorage.setItem('gw_auth_redirect', window.location.href);
        return sb.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: REDIRECT_URL }
        });
    }

    function gwSignInWithApple() {
        var sb = getSb();
        if (!sb) return Promise.reject(new Error('Supabase not loaded'));
        sessionStorage.setItem('gw_auth_redirect', window.location.href);
        return sb.auth.signInWithOAuth({
            provider: 'apple',
            options: { redirectTo: REDIRECT_URL }
        });
    }

    function gwSignInWithFacebook() {
        var sb = getSb();
        if (!sb) return Promise.reject(new Error('Supabase not loaded'));
        sessionStorage.setItem('gw_auth_redirect', window.location.href);
        return sb.auth.signInWithOAuth({
            provider: 'facebook',
            options: {
                redirectTo: REDIRECT_URL,
                scopes: 'email,public_profile'
            }
        });
    }

    function gwSignOut() {
        var sb = getSb();
        if (!sb) return Promise.reject(new Error('Supabase not loaded'));
        return sb.auth.signOut().then(function () {
            window.location.reload();
        });
    }

    function gwGetSession() {
        var sb = getSb();
        if (!sb) return Promise.resolve({ data: { session: null } });
        return sb.auth.getSession();
    }

    function gwGetUser() {
        var sb = getSb();
        if (!sb) return Promise.resolve({ data: { user: null } });
        return sb.auth.getUser();
    }

    function gwIsAuthenticated() {
        return gwGetSession().then(function (res) {
            return !!(res.data && res.data.session);
        });
    }

    function gwOnAuthStateChange(callback) {
        var sb = getSb();
        if (!sb) return { data: { subscription: { unsubscribe: function () {} } } };
        return sb.auth.onAuthStateChange(callback);
    }

    function gwGetSupabase() {
        return getSb();
    }

    // ============ Expose globally ============
    window.gwAuth = {
        signInWithGoogle: gwSignInWithGoogle,
        signInWithApple: gwSignInWithApple,
        signInWithFacebook: gwSignInWithFacebook,
        signOut: gwSignOut,
        getSession: gwGetSession,
        getUser: gwGetUser,
        isAuthenticated: gwIsAuthenticated,
        onAuthStateChange: gwOnAuthStateChange,
        getSupabase: gwGetSupabase
    };
})();
