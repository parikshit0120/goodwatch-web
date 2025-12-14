globalThis.process ??= {}; globalThis.process.env ??= {};
import { renderers } from './renderers.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_N542Q-Qz.mjs';
import { manifest } from './manifest_CZV_-lw4.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/404.astro.mjs');
const _page2 = () => import('./pages/app.astro.mjs');
const _page3 = () => import('./pages/best/_combo_.astro.mjs');
const _page4 = () => import('./pages/best.astro.mjs');
const _page5 = () => import('./pages/blog/_slug_.astro.mjs');
const _page6 = () => import('./pages/blog.astro.mjs');
const _page7 = () => import('./pages/calibrate.astro.mjs');
const _page8 = () => import('./pages/decade/_decade_.astro.mjs');
const _page9 = () => import('./pages/decade.astro.mjs');
const _page10 = () => import('./pages/discover.astro.mjs');
const _page11 = () => import('./pages/genre/_genre_.astro.mjs');
const _page12 = () => import('./pages/genres.astro.mjs');
const _page13 = () => import('./pages/lists.astro.mjs');
const _page14 = () => import('./pages/mood/_mood_.astro.mjs');
const _page15 = () => import('./pages/moods.astro.mjs');
const _page16 = () => import('./pages/movie/_id_.astro.mjs');
const _page17 = () => import('./pages/movies-for/_occasion_.astro.mjs');
const _page18 = () => import('./pages/movies-for.astro.mjs');
const _page19 = () => import('./pages/search.astro.mjs');
const _page20 = () => import('./pages/sitemap.xml.astro.mjs');
const _page21 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/@astrojs/cloudflare/dist/entrypoints/image-endpoint.js", _page0],
    ["src/pages/404.astro", _page1],
    ["src/pages/app.astro", _page2],
    ["src/pages/best/[combo].astro", _page3],
    ["src/pages/best/index.astro", _page4],
    ["src/pages/blog/[slug].astro", _page5],
    ["src/pages/blog.astro", _page6],
    ["src/pages/calibrate.astro", _page7],
    ["src/pages/decade/[decade].astro", _page8],
    ["src/pages/decade/index.astro", _page9],
    ["src/pages/discover.astro", _page10],
    ["src/pages/genre/[genre].astro", _page11],
    ["src/pages/genres.astro", _page12],
    ["src/pages/lists.astro", _page13],
    ["src/pages/mood/[mood].astro", _page14],
    ["src/pages/moods.astro", _page15],
    ["src/pages/movie/[id].astro", _page16],
    ["src/pages/movies-for/[occasion].astro", _page17],
    ["src/pages/movies-for/index.astro", _page18],
    ["src/pages/search.astro", _page19],
    ["src/pages/sitemap.xml.ts", _page20],
    ["src/pages/index.astro", _page21]
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
