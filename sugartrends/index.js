const Url = require('url');
const fetch = require('node-fetch');

const transpile = require('./sugartrends');

module.exports = (req, res) => {
  const params = Url.parse(req.url, true).query;

  if (params.key && params.secret && params.store) {
    const token = `${params.key}:${params.secret}@${params.store}`;
    const url = `https://${token}.myshopify.com/admin/products.json?limit=250`;

    return fetch(url)
      .then(response => {
        return response.json();
      })
      .then(data => {
        if (data.errors) {
          return {
            err: data.errors
          };
        }
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        return transpile(data);
      })
      .catch(err => {
        return {
          err: `No, because ${err}`
        };
      });
  }
  return `
  Contract violation

  To use the product feed for Sugartrends.com specify the following fields:

  store               Your Shopify store name
  key                 Your Shopify private app key (has to have products read permission)
  secret              Your Shopify private app secret
`;
};
