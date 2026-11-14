# GOJIFEM Marketplace — Production Launch & Operational Runbook

This runbook outlines the required deployment steps, merchant verification procedures, and payment configurations for taking GOJIFEM live.

---

## 1. Payment Provider Setup (Paystack & Flutterwave)

### A. Paystack Configuration
1. **Live Merchant Activation**: Complete business registration and CAC certificate verification in the Paystack Live Dashboard.
2. **Enable International Cards**:
   - In Paystack Dashboard $\rightarrow$ **Settings** $\rightarrow$ **Preferences**, request activation for **International Card Payments** (Visa, Mastercard, American Express).
   - Confirm card presentment charges remain anchored in **NGN** with 3D Secure issuer authentication.
3. **Webhook Registration**:
   - Register endpoint URL: `https://api.gojifem.com/api/v1/payments/webhooks/paystack`
   - Store secret in environment: `PAYSTACK_WEBHOOK_SECRET`
4. **Paystack Transfers (Payouts)**:
   - Ensure the NIBSS Transfers feature is activated on the merchant account.
   - Fund the Paystack settlement balance to enable automated merchant escrow payouts.

---

## 2. Infrastructure & Database Deployment

1. **PostgreSQL 16 Engine**:
   - Apply production migration:
     ```bash
     npm run --workspace=@gojifem/database migrate:deploy
     ```
   - Seed core roles, categories, and chart of accounts:
     ```bash
     npm run --workspace=@gojifem/database seed
     ```
2. **Container Stack**:
   - Build and start production containers:
     ```bash
     docker compose -f docker-compose.prod.yml up -d --build
     ```
   - Verify health checks:
     ```bash
     docker compose -f docker-compose.prod.yml ps
     ```

---

## 3. Merchant & Shipping Governance

1. **Vendor Onboarding**:
   - Merchants register via `/auth/vendor-register`.
   - Submit official CAC incorporation certificate via `/vendor/apply`.
   - Connect verified NUBAN commercial bank account (GTBank, Zenith, Access, etc.).
   - Compliance officers review and approve via `/admin/vendors`.
2. **Serviceable Shipping Corridors**:
   - Physical dispatch is gated to active serviceable destinations:
     - **Nigeria nationwide** (36 states + FCT via GIG Logistics & Red Star Express).
     - **International corridors** (Ghana, UK, US via DHL Express International).
   - Diaspora buyers worldwide can pay with their foreign cards for delivery to any Nigerian address.

---

## 4. Financial Audit & Double-Entry Reconciliations

1. **Double-Entry Reconciliation**:
   - Review general ledger accounts periodically via `/admin/finance`:
     - `1010-PAYSTACK-CLEARING` (gross customer collections)
     - `2020-VENDOR-PAYABLE` (escrow liabilities)
     - `3010-PLATFORM-COMMISSION` (GOJIFEM commission revenue: 10.00%)
     - `2030-DELIVERY-PAYABLE` (logistics payable)
2. **Escrow Hold & Payout Cadence**:
   - Funds become eligible for vendor payout withdrawal **72 hours** after recorded courier delivery receipt.
   - Payout batches are audited and transferred directly via NIBSS.
