globalThis.process ??= {}; globalThis.process.env ??= {};
import { renderers } from './renderers.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_lRFmQe0_.mjs';
import { manifest } from './manifest_DdXU4OEJ.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/404.astro.mjs');
const _page2 = () => import('./pages/admin/trust.astro.mjs');
const _page3 = () => import('./pages/api/dismiss-reflection.astro.mjs');
const _page4 = () => import('./pages/api/provider-feedback.astro.mjs');
const _page5 = () => import('./pages/api/watch-history.astro.mjs');
const _page6 = () => import('./pages/api/watchlist.astro.mjs');
const _page7 = () => import('./pages/app.astro.mjs');
const _page8 = () => import('./pages/auth/callback.astro.mjs');
const _page9 = () => import('./pages/best/_combo_.astro.mjs');
const _page10 = () => import('./pages/best.astro.mjs');
const _page11 = () => import('./pages/blog/_slug_.astro.mjs');
const _page12 = () => import('./pages/blog.astro.mjs');
const _page13 = () => import('./pages/calibrate.astro.mjs');
const _page14 = () => import('./pages/comforting-movies-to-watch.astro.mjs');
const _page15 = () => import('./pages/decade/_decade_.astro.mjs');
const _page16 = () => import('./pages/decade.astro.mjs');
const _page17 = () => import('./pages/discover.astro.mjs');
const _page18 = () => import('./pages/genre/_genre_.astro.mjs');
const _page19 = () => import('./pages/genres.astro.mjs');
const _page20 = () => import('./pages/lists.astro.mjs');
const _page21 = () => import('./pages/mood/_mood_.astro.mjs');
const _page22 = () => import('./pages/moods.astro.mjs');
const _page23 = () => import('./pages/movie/_id_.astro.mjs');
const _page24 = () => import('./pages/movies-for/_occasion_.astro.mjs');
const _page25 = () => import('./pages/movies-for.astro.mjs');
const _page26 = () => import('./pages/movies-to-watch-tonight.astro.mjs');
const _page27 = () => import('./pages/netflix-india/movies-tonight.astro.mjs');
const _page28 = () => import('./pages/search.astro.mjs');
const _page29 = () => import('./pages/sitemap.xml.astro.mjs');
const _page30 = () => import('./pages/taste.astro.mjs');
const _page31 = () => import('./pages/tonight.astro.mjs');
const _page32 = () => import('./pages/watchlist.astro.mjs');
const _page33 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/@astrojs/cloudflare/dist/entrypoints/image-endpoint.js", _page0],
    ["src/pages/404.astro", _page1],
    ["src/pages/admin/trust.astro", _page2],
    ["src/pages/api/dismiss-reflection.ts", _page3],
    ["src/pages/api/provider-feedback.ts", _page4],
    ["src/pages/api/watch-history.ts", _page5],
    ["src/pages/api/watchlist.ts", _page6],
    ["src/pages/app.astro", _page7],
    ["src/pages/auth/callback.astro", _page8],
    ["src/pages/best/[combo].astro", _page9],
    ["src/pages/best/index.astro", _page10],
    ["src/pages/blog/[slug].astro", _page11],
    ["src/pages/blog.astro", _page12],
    ["src/pages/calibrate.astro", _page13],
    ["src/pages/comforting-movies-to-watch.astro", _page14],
    ["src/pages/decade/[decade].astro", _page15],
    ["src/pages/decade/index.astro", _page16],
    ["src/pages/discover.astro", _page17],
    ["src/pages/genre/[genre].astro", _page18],
    ["src/pages/genres.astro", _page19],
    ["src/pages/lists.astro", _page20],
    ["src/pages/mood/[mood].astro", _page21],
    ["src/pages/moods.astro", _page22],
    ["src/pages/movie/[id].astro", _page23],
    ["src/pages/movies-for/[occasion].astro", _page24],
    ["src/pages/movies-for/index.astro", _page25],
    ["src/pages/movies-to-watch-tonight.astro", _page26],
    ["src/pages/netflix-india/movies-tonight.astro", _page27],
    ["src/pages/search.astro", _page28],
    ["src/pages/sitemap.xml.ts", _page29],
    ["src/pages/taste.astro", _page30],
    ["src/pages/tonight.astro", _page31],
    ["src/pages/watchlist.astro", _page32],
    ["src/pages/index.astro", _page33]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./noop-entrypoint.mjs'),
    middleware: () => import('./_astro-internal_middleware.mjs')
});
const _args = undefined;
const _exports = createExports(_manifest);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) {
	serverEntrypointModule[_start](_manifest, _args);
}

export { __astrojsSsrVirtualEntry as default, pageMap };
