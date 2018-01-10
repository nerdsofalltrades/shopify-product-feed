const rateLimit = require('micro-ratelimit');

const sugartrends = require('./sugartrends');

const handler = {
  get: {
    '/shopify-product-feed': () => ({
      ok: new Date().toISOString()
    }),
    '/shopify-product-feed/sugartrends': async (req, res) => {
      return sugartrends(req, res);
    }
  }
};

module.exports = rateLimit((req, res) => {
  const method = req.method.toLowerCase();
  const url = req.url.replace(/\?.*$/, '').replace(/\/$/, '') || '/';

  if (handler[method] && handler[method][url]) {
    return handler[method][url](req, res);
  }

  return { err: `${url}? Yes but no but yes. Actually no.` };
});
