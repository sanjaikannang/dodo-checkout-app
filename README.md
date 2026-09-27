# dodo-checkout-app

Dodo's own hosted payment page. This is what opens inside the iframe that
`dodo-sdk` creates on a merchant's site. It holds all of the actual product:
the form, validation, the fake payment engine, and every state the flow can
be in.

The merchant's page never has access to anything inside this app — it's a
separate origin, and no card data ever leaves it.

## What it does

- Connects to the parent page (the SDK) over a private `MessageChannel`
- Looks up the product by the `productId` it receives, from a small hardcoded
  catalog (there's no backend in this exercise — see "what I'd explore next")
- Shows product, email, card, expiry, and CVC fields
- Runs a fake payment against three test cards
- Reports the outcome back to the host via `success` / `error` / `close`
  messages, and **always** eventually sends `close`, so the host never gets
  stuck not knowing what happened

## Test cards

| Card number | Behavior |
|---|---|
| `4242 4242 4242 4242` | Succeeds |
| `4000 0000 0000 0002` | Declines (recoverable — form stays filled in) |
| `4000 0000 0000 0341` | Fails once, succeeds on the next attempt |

Any other card number is treated as a decline.

## States handled

- Connecting to the host
- Opened directly outside an iframe (clear diagnostic message, not a generic error)
- Unknown/invalid `productId`
- Ready (form visible)
- Processing (Pay button disabled, no double-submit)
- Declined (form preserved, inline error, retry allowed)
- Network error (distinct from a decline — no charge was made)
- Succeeded
- Closing while a payment is mid-flight (asks for confirmation instead of
  silently abandoning it)
- Escape key and the ✕ button both close the same way

## Requirements

- Node 18+

## Setup

```bash
npm install
npm run dev
```

Runs on `http://localhost:5174` by default.

> **Important:** this app expects to be loaded inside an iframe by
> `dodo-sdk`. Opening its URL directly in a browser tab will show a message
> saying so, rather than a payment form — that's expected behavior, not a bug.
> To test it properly, run `dodo-example-merchant-site` and click Buy there.

## Build

```bash
npm run build
```

## How it talks to the SDK

See `src/host.ts`. On load, it posts a `ready` message to `window.parent`
using `"*"` as the target origin (deliberate — it has no way to know in
advance which merchant site is embedding it, and `ready` carries no
sensitive data). The SDK replies with an `init` message containing the
`productId`, along with one port of a `MessageChannel`. From that point on,
every message goes over that private port instead of `window.postMessage`,
so no other script on the page can intercept or forge them.

## Related repos

- [`dodo-sdk`](#) — the embed script that opens this app in an iframe
- [`dodo-example-merchant-site`](#) — a demo site using the SDK to open this app