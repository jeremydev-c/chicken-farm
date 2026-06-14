This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Payments (Paystack)

The checkout supports two payment methods: **Pay on Pickup** (M-Pesa / Cash) and **Pay Now** (card or M-Pesa via [Paystack](https://paystack.com)).

### Setup

1. Copy the example env file and add your keys:

   ```powershell
   Copy-Item env.example .env.local
   ```

2. In `.env.local`, set your Paystack **secret** key from the
   [Paystack dashboard](https://dashboard.paystack.com/#/settings/developers):

   ```env
   PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx
   PAYSTACK_CURRENCY=KES
   # Optional, for production callback URLs:
   # NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

3. Restart the dev server so the new environment variables are loaded.

### How it works

- The customer reserves an order at `/checkout`. The order is created via `POST /api/orders` (stock is validated and held).
- For **Pay Now**, the client calls `POST /api/payments/initialize`, which uses the Paystack API to create a transaction and returns a hosted checkout URL. The customer is redirected there.
- After payment, Paystack redirects back to `/checkout/verify`, which calls `GET /api/payments/verify?reference=...`. The server verifies the transaction, reconciles the amount, and marks the order `paid`.
- Server logic lives in `lib/paystack.ts`; secret keys are only ever used server-side.

> If `PAYSTACK_SECRET_KEY` is not set, online payment is disabled gracefully and the "Pay Now" flow returns a clear error while reservations still work.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
