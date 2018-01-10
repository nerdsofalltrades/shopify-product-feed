const Url = require('url');
const fetch = require('node-fetch');

const transpile = source => {
  const DELIMITER = ',';
  const fields = [
    'sku',
    'name',
    'description',
    'status',
    'price',
    'qty',
    'manufacturer',
    'attribute_set', // General (use for bulk import products)
    'prodtype', // simple
    'visibility', // "Catalog, Search"
    'tax_class_id', // None
    'is_in_stock', // 1
    'weight', // 0.2
    'website', // base
    'store', // admin
    'category_ids', // 515 - match this by adding a tag to Shopify product called sugartrends-category_id:515
    'image', // http://www.gemshine.com/item/images/1743/1300x1150/Colp2372CH---1d.jpg
    'thumbnail', // http://www.gemshine.com/item/images/1743/1300x1150/Colp2372CH---1d.jpg
    'small_image', // http://www.gemshine.com/item/images/1743/1300x1150/Colp2372CH---1d.jpg
    'gallery' // "http://www.gemshine.com/item/images/1743/1300x1150/Colp2372CH---2d.jpg,http://www.gemshine.com/item/images/1743/1300x1150/Colp2372CH---3d.jpg,http://www.gemshine.com/item/images/1743/1300x1150/Colp2372CH---4d.jpg,http://www.gemshine.com/item/images/1743/1300x1150/Colp2372CH---5d.jpg,"
  ];
  const result = [];
  const items = [];
  if (source.products) {
    source.products.forEach(product => {
      if (product.variants && product.variants.length > 0) {
        const hasVariants = product.variants.length > 1;

        product.variants.forEach(variant => {
          const categories = product.tags
            .split(/, /)
            .filter(tag => tag.indexOf('sugartrends-category-id:') === 0)
            .map(c => c.replace(/^.*:/, ''))
            .join(',');
          const image = hasVariants
            ? (
                product.images.find(i => i.variant_ids.includes(variant.id)) ||
                product.images[0] || { src: '' }
              ).src
            : (product.images[0] || { src: '' }).src;
          const item = {
            sku: variant.sku,
            name: hasVariants
              ? `${product.title} - ${variant.title}`
              : product.title,
            description: product.body_html,
            status: variant.inventory_quantity > 0 ? 'Enabled' : 'Disabled',
            price: variant.price,
            qty:
              variant.inventory_quantity < 0 ? 0 : variant.inventory_quantity,
            manufacturer: product.vendor,
            // eslint-disable-next-line camelcase
            attribute_set: 'General (use for bulk import products)',
            prodtype: hasVariants ? 'configurable' : 'simple',
            visibility: 'Catalog, Search',
            // eslint-disable-next-line camelcase
            tax_class_id: 'None',
            // eslint-disable-next-line camelcase
            is_in_stock: variant.inventory_quantity > 0 ? 1 : 0,
            weight: variant.weight,
            website: 'base',
            store: 'admin',
            // eslint-disable-next-line camelcase
            category_ids: categories,
            image,
            thumbnail: image,
            // eslint-disable-next-line camelcase
            small_image: image,
            gallery: product.images.map(i => i.src).join(',')
          };
          items.push(item);
        });
      } else {
        // No variants found - skip it
      }
    });
  }

  result.push(fields.join(DELIMITER));

  items.forEach(item => {
    const line = [];
    fields.forEach(field => {
      const f = String(item[field] === undefined ? '' : item[field])
        .replace(/\n+/g, ' ')
        .replace(/"/g, '\\"')
        .trim();
      const csvified = f.includes(',') ? `"${f}"` : f;
      line.push(csvified);
    });
    result.push(line.join(DELIMITER));
  });

  return result.join('\n');
};

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
        return `# Product feed from ${
          params.store
        }.myshopify.com for sugartrends.com exported ${new Date().toISOString()}\n${transpile(
          data
        )}`;
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
