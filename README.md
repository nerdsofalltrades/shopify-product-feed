# Shopify product feed for 3rd party systems

Microservice to export product data from a Shopify shop to 3rd party systems

## Start

```
$ npm start
```

will start a server on port 3000.

```
$ PORT=4242 npm start
```

will start a server on a custom port.

## Sugartrends.com

Their system accepts a CSV which one get via:

```
$ curl http://localhost:3000/shopfiy-product-feed/sugartrends?key=shopify-app-key&secret=shopify-app-secret&store=shopify-store
```

or try it live at:

https://nerdsofalltrad.es/shopify-product-feed/sugartrends
