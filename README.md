# starter.store

A starter store powered by FastStore.

![FastStore CLI](https://img.shields.io/github/package-json/dependency-version/vtex-sites/starter.store/@faststore/cli)

## Getting started

Install dependencies
```bash
yarn i
```  

Start local dev server at http://localhost:3000
```bash
yarn dev
```   

Production build
```bash
yarn build
```

### Docs 
[FastStore documentation](https://developers.vtex.com/docs/guides/faststore)

## VTEX Ads

The VTEX Ads integration is configured per section and viewport in the Headless
CMS. Server-side delivery accepts the following optional WebOps environment
variables:

- `VTEX_ADS_PUBLISHER_ID`: publisher identifier. Defaults to the publisher for
  the `masterclass` account.
- `VTEX_ADS_TIMEOUT_MS`: delivery timeout in milliseconds. Defaults to `2500`
  and is constrained to values between `250` and `10000`.

When Ads is disabled, unavailable, empty, or times out, the storefront keeps
the original organic content.
