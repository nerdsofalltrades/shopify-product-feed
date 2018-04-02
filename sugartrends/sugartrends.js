module.exports = (source = { products: [] }) => {
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
  if (
    source &&
    source.products &&
    typeof source.products.forEach === 'function'
  ) {
    source.products.forEach(product => {
      if (product.variants && product.variants.length > 0) {
        const hasVariants = product.variants.length > 1;

        product.variants.forEach(variant => {
          const categories = product.tags
            ? /* eslint-disable indent */
              product.tags
                .split(/, /)
                .filter(tag => tag.indexOf('sugartrends-category-id:') === 0)
                .map(c => c.replace(/^.*:/, ''))
                .join(',')
            : '';
          const name = product.vendor
            ? `${product.vendor} - ${product.title || ''}`
            : product.title || '';
          /* eslint-enable */
          const image =
            product.images && product.images.length
              ? hasVariants
                ? /* eslint-disable indent */
                  (
                    product.images.find(i =>
                      i.variant_ids.includes(variant.id)
                    ) ||
                    product.images[0] || { src: '' }
                  ).src
                : (product.images[0] || { src: '' }).src
              : '';
          /* eslint-enable */
          const item = {
            sku: variant.sku,
            name: hasVariants ? `${name} - ${variant.title || ''}` : name || '',
            description: product.body_html,
            status:
              variant.inventory_quantity && variant.inventory_quantity > 0
                ? 'Enabled'
                : 'Disabled',
            price: variant.price,
            qty:
              variant.inventory_quantity < 0
                ? 0
                : variant.inventory_quantity || 0,
            manufacturer: product.vendor,
            // eslint-disable-next-line camelcase
            attribute_set: 'General (use for bulk import products)',
            prodtype: 'simple',
            visibility: 'Catalog, Search',
            // eslint-disable-next-line camelcase
            tax_class_id: 'None',
            // eslint-disable-next-line camelcase
            is_in_stock: variant.inventory_quantity
              ? variant.inventory_quantity > 0 ? 1 : 0
              : 0,
            weight: variant.weight,
            website: 'base',
            store: 'admin',
            // eslint-disable-next-line camelcase
            category_ids: categories,
            image,
            thumbnail: image,
            // eslint-disable-next-line camelcase
            small_image: image,
            gallery:
              product.images && product.images.length
                ? product.images.map(i => i.src).join(',')
                : ''
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
