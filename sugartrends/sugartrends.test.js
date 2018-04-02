const transpile = require('./sugartrends');

const header =
  'sku,name,description,status,price,qty,manufacturer,attribute_set,prodtype,visibility,tax_class_id,is_in_stock,weight,website,store,category_ids,image,thumbnail,small_image,gallery';

describe('sugartrends transpiler', () => {
  // Broken inputs
  it('should handle empty input', () => {
    expect(transpile()).toBe(header);
  });
  it('should handle undefined input', () => {
    expect(transpile(undefined)).toBe(header);
  });
  it('should handle null input', () => {
    expect(transpile(null)).toBe(header);
  });
  it('should handle invalid types input: boolean', () => {
    expect(transpile({ products: true })).toBe(header);
  });
  it('should handle invalid types input: number', () => {
    expect(transpile({ products: 42 })).toBe(header);
  });
  it('should handle invalid types input: string', () => {
    expect(transpile({ products: 'uh oh' })).toBe(header);
  });
  it('should handle invalid types input: object', () => {
    expect(transpile({ products: {} })).toBe(header);
  });

  // Business facts
  it('should return zero products for empty list', () => {
    const result = transpile({ products: [] }).split(/\n/);
    expect(result.length).toBe(1);
    expect(result[0]).toBe(header);
  });

  it('should ignore broken products', () => {
    const result = transpile({
      products: [{}]
    }).split(/\n/);
    expect(result.length).toBe(1);
    expect(result[0]).toBe(header);
  });

  it('should handle single products', () => {
    const result = transpile({
      products: [
        {
          title: 'Simple product',
          variants: [{ sku: 'sku-1' }]
        }
      ]
    }).split(/\n/);
    expect(result.length).toBe(2);
    expect(result[0]).toBe(header);
    expect(result[1]).toBe(
      'sku-1,Simple product,,Disabled,,0,,General (use for bulk import products),simple,"Catalog, Search",None,0,,base,admin,,,,,'
    );
  });

  it('should handle products with variants', () => {
    const result = transpile({
      products: [
        {
          title: 'Pill',
          variants: [
            { sku: 'sku-1', title: 'blue' },
            { sku: 'sku-2', title: 'red' }
          ]
        }
      ]
    }).split(/\n/);
    expect(result.length).toBe(3);
    expect(result[0]).toBe(header);
    expect(result[1]).toBe(
      'sku-1,Pill - blue,,Disabled,,0,,General (use for bulk import products),simple,"Catalog, Search",None,0,,base,admin,,,,,'
    );
    expect(result[2]).toBe(
      'sku-2,Pill - red,,Disabled,,0,,General (use for bulk import products),simple,"Catalog, Search",None,0,,base,admin,,,,,'
    );
  });

  it('should handle product descriptions', () => {
    const result = transpile({
      products: [
        {
          // eslint-disable-next-line camelcase
          body_html: 'Product description',
          variants: [{ sku: 'sku-1' }, { sku: 'sku-2' }]
        }
      ]
    }).split(/\n/);
    expect(result[1]).toBe(
      'sku-1,-,Product description,Disabled,,0,,General (use for bulk import products),simple,"Catalog, Search",None,0,,base,admin,,,,,'
    );
    expect(result[2]).toBe(
      'sku-2,-,Product description,Disabled,,0,,General (use for bulk import products),simple,"Catalog, Search",None,0,,base,admin,,,,,'
    );
  });

  it('should handle product stati enabled when inventory > 0', () => {
    const result = transpile({
      products: [
        {
          variants: [
            {
              sku: 'sku-1',
              // eslint-disable-next-line camelcase
              inventory_quantity: -1
            },
            {
              sku: 'sku-2',
              // eslint-disable-next-line camelcase
              inventory_quantity: 0
            },
            {
              sku: 'sku-3',
              // eslint-disable-next-line camelcase
              inventory_quantity: 2
            }
          ]
        }
      ]
    }).split(/\n/);
    expect(result.length).toBe(4);
    expect(result[1]).toBe(
      'sku-1,-,,Disabled,,0,,General (use for bulk import products),simple,"Catalog, Search",None,0,,base,admin,,,,,'
    );
    expect(result[2]).toBe(
      'sku-2,-,,Disabled,,0,,General (use for bulk import products),simple,"Catalog, Search",None,0,,base,admin,,,,,'
    );
    expect(result[3]).toBe(
      'sku-3,-,,Enabled,,2,,General (use for bulk import products),simple,"Catalog, Search",None,1,,base,admin,,,,,'
    );
  });

  it('should handle product prices', () => {
    const result = transpile({
      products: [
        {
          variants: [
            { sku: 'sku-1', price: '1.00' },
            { sku: 'sku-2', price: '1.50' }
          ]
        }
      ]
    }).split(/\n/);
    expect(result[1]).toBe(
      'sku-1,-,,Disabled,1.00,0,,General (use for bulk import products),simple,"Catalog, Search",None,0,,base,admin,,,,,'
    );
    expect(result[2]).toBe(
      'sku-2,-,,Disabled,1.50,0,,General (use for bulk import products),simple,"Catalog, Search",None,0,,base,admin,,,,,'
    );
  });

  it('should handle product manufacturers', () => {
    const result = transpile({
      products: [
        {
          vendor: 'bob',
          variants: [{ sku: 'sku-1' }, { sku: 'sku-2' }]
        }
      ]
    }).split(/\n/);
    expect(result[1]).toBe(
      'sku-1,bob -  -,,Disabled,,0,bob,General (use for bulk import products),simple,"Catalog, Search",None,0,,base,admin,,,,,'
    );
    expect(result[2]).toBe(
      'sku-2,bob -  -,,Disabled,,0,bob,General (use for bulk import products),simple,"Catalog, Search",None,0,,base,admin,,,,,'
    );
  });

  it('should handle product weights', () => {
    const result = transpile({
      products: [
        {
          variants: [
            { sku: 'sku-1', weight: 100 },
            { sku: 'sku-2', weight: 200 }
          ]
        }
      ]
    }).split(/\n/);
    expect(result[1]).toBe(
      'sku-1,-,,Disabled,,0,,General (use for bulk import products),simple,"Catalog, Search",None,0,100,base,admin,,,,,'
    );
    expect(result[2]).toBe(
      'sku-2,-,,Disabled,,0,,General (use for bulk import products),simple,"Catalog, Search",None,0,200,base,admin,,,,,'
    );
  });

  it('should handle product categories', () => {
    const result = transpile({
      products: [
        {
          tags:
            'foo, sugartrends-category-id:123, sugartrends-category-id:456, bar',
          variants: [{ sku: 'sku-1' }]
        }
      ]
    }).split(/\n/);
    expect(result[1]).toBe(
      'sku-1,,,Disabled,,0,,General (use for bulk import products),simple,"Catalog, Search",None,0,,base,admin,"123,456",,,,'
    );
  });

  it('should handle product images', () => {
    const result = transpile({
      products: [
        {
          images: [{ src: 'image-1' }],
          variants: [{ sku: 'sku-1' }]
        }
      ]
    }).split(/\n/);
    expect(result[1]).toBe(
      'sku-1,,,Disabled,,0,,General (use for bulk import products),simple,"Catalog, Search",None,0,,base,admin,,image-1,image-1,image-1,image-1'
    );
  });

  it('should handle product images for variants', () => {
    const result = transpile({
      products: [
        {
          images: [
            {
              src: 'image-1',
              // eslint-disable-next-line camelcase
              variant_ids: []
            },
            {
              src: 'image-variant-1',
              // eslint-disable-next-line camelcase
              variant_ids: [1]
            },
            {
              src: 'image-variant-2',
              // eslint-disable-next-line camelcase
              variant_ids: [2]
            }
          ],
          variants: [{ sku: 'sku-1', id: 1 }, { sku: 'sku-2', id: 2 }]
        }
      ]
    }).split(/\n/);
    expect(result[1]).toBe(
      'sku-1,-,,Disabled,,0,,General (use for bulk import products),simple,"Catalog, Search",None,0,,base,admin,,image-variant-1,image-variant-1,image-variant-1,"image-1,image-variant-1,image-variant-2"'
    );
    expect(result[2]).toBe(
      'sku-2,-,,Disabled,,0,,General (use for bulk import products),simple,"Catalog, Search",None,0,,base,admin,,image-variant-2,image-variant-2,image-variant-2,"image-1,image-variant-1,image-variant-2"'
    );
  });
});
