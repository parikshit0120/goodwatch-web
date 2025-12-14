globalThis.process ??= {}; globalThis.process.env ??= {};
import './chunks/astro-designed-error-pages_GXglpO_A.mjs';
import './chunks/astro/server_AFKA17W8.mjs';
import { s as sequence } from './chunks/index_Cw3OIONy.mjs';

const onRequest$1 = (context, next) => {
  if (context.isPrerendered) {
    context.locals.runtime ??= {
      env: process.env
    };
  }
  return next();
};

const onRequest = sequence(
	onRequest$1,
	
	
);

export { onRequest };
