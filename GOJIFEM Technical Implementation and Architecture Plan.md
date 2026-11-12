# **GOJIFEM Technical Implementation and Architecture Plan**

## **1\. Product and operating assumptions**

GOJIFEM is a Nigeria-first multi-vendor marketplace where customers discover, compare, pay for, and receive products from approved vendors. Buyers outside Nigeria should also be able to pay with supported international cards, subject to provider activation, card issuer approval, and fraud controls.

**Payment availability and delivery coverage are separate.** GOJIFEM can accept an international payment while initially shipping only within Nigeria or other destinations it has explicitly enabled and can serve.

The implementation plan assumes:

* Nigeria is the first operating market, with NGN as the initial product and settlement currency.  
* International card acceptance is a launch requirement, subject to approval from the selected payment provider.  
* The marketplace begins with a single legal entity and a focused set of categories, vendors, and delivery zones.  
* The initial customer experience is a mobile-friendly website. A native app can follow after the main flows are validated.  
* Each customer order can contain products from multiple vendors. GOJIFEM manages checkout and the customer-facing order; each vendor fulfils their portion.  
* GOJIFEM does not provide a customer wallet or stored-value account in the MVP.  
* Shipping eligibility is checked separately from whether a customer can make a payment.

### **Users and their main tasks**

| User | Main tasks |
| ----- | ----- |
| Customer | Browse and compare products, pay, track orders, request support, returns, or refunds |
| Vendor owner or staff | Apply, complete verification, list products, manage stock, fulfil orders, view earnings |
| Marketplace operations | Review vendors and products, handle order exceptions, resolve customer and vendor issues |
| Finance staff | Reconcile payments, review vendor balances, approve payouts, handle failed transfers |
| Platform administrator | Manage staff permissions, marketplace policies, and operational settings |

### **Decisions GOJIFEM must make before launch**

Commercial and operational policies affect the payment and order flows. GOJIFEM should decide:

* Commission rates, calculation basis, discounts, and which party bears payment fees.  
* Vendor payout timing, reserve or hold amounts, minimum payout, and payout fees.  
* Returns, cancellations, disputes, and refunds policy.  
* Vendor verification requirements and document retention.  
* Delivery zones, supported service levels, failed-delivery handling, and whether cash on delivery is offered.  
* Which shipping destinations GOJIFEM can support at launch.  
* Whether products are initially priced only in NGN or also in another currency.  
* Support responsibilities and service levels.

## **2\. Recommended architecture**

Start with a **modular monolith**: one deployable application with clear boundaries between catalog, vendors, checkout, orders, payments, fulfilment, ledger, and administration. Use a separate worker process for slow or retryable work, such as provider webhooks, notifications, delivery updates, reconciliation, and payouts.

This gives the initial team clear ownership and transactional consistency without requiring the operations of multiple microservices. A module can be separated into its own service later if measured load, team ownership, or failure-isolation needs justify it.

### **Architecture overview**

```
Customers           Vendors             Staff admins
    \                  |                    /
     +--------- Web application / CDN -----+
                         |
                   HTTPS / API
                         |
             +---- Modular application ----+
             | Identity and permissions    |
             | Vendors and verification   |
             | Catalog and inventory      |
             | Cart, checkout and orders  |
             | Payments and refunds       |
             | Delivery and tracking      |
             | Ledger and payouts         |
             | Administration             |
             +-----+----------+-----------+
                   |          |
             PostgreSQL     Redis/cache
              source of     rate limits,
                truth       short-lived data
                   |
              Outbox / queue
                   |
                 Workers
          /          |             \
 Payment provider  Carrier APIs   Email/SMS
```

External providers should be accessed through adapters. Their secrets stay on the server, and provider-specific statuses should be translated into GOJIFEM’s internal states.

### **Suggested technology stack**

| Layer | Recommended starting choice |
| ----- | ----- |
| Storefront and portals | Next.js, React, TypeScript |
| Backend API | NestJS, TypeScript, REST, OpenAPI |
| Database | Managed PostgreSQL |
| Cache and rate limits | Redis when useful |
| Reliable job delivery | Transactional outbox with a durable queue |
| Product images and documents | Private object storage with CDN for approved public images |
| Initial product search | PostgreSQL full-text and trigram search |
| Hosting | Managed containers, managed database, object storage, CDN, secrets manager |
| Monitoring | Central logs, metrics, traces, and alerts |

### **Suggested code layout**

```
apps/
  web/                 storefront, vendor portal, admin portal
  api/                 REST routes, validation, authorization
  worker/              queue consumers and scheduled jobs
packages/
  identity/
  vendors/
  catalog/
  inventory/
  cart/
  checkout/
  orders/
  payments/
  fulfilment/
  ledger/
  notifications/
  admin/
  integrations/        payment and carrier adapters
  shared/              money, IDs, validation, observability
infra/
migrations/
runbooks/
```

## **3\. Database schema and relationships**

PostgreSQL should be the source of truth. Use UUID primary keys, UTC timestamps, foreign keys, unique constraints, and explicit status transitions.

Store money as integer minor units with an ISO currency code. Do not use floating-point money. For example, NGN amounts are handled in kobo where required by the provider.

Store product and pricing details as snapshots on order lines. A later product edit must not change a past order.

### **Core tables**

| Table | Key data | Relationships and notes |
| ----- | ----- | ----- |
| `users` | Email, phone, password hash or identity provider, account status | Can have customer and vendor memberships |
| `roles`, `permissions`, `user_roles` | Role and permission codes, resource scope | Supports role-based access with vendor-specific scope |
| `customer_profiles` | User profile details | One profile per customer |
| `addresses` | Country code, address lines, region, city, postal code, phone, landmark | Copy billing and shipping address details into the order snapshot |
| `vendors` | Legal name, display name, slug, owner, status, commission plan | Has many memberships, products, and settlement accounts |
| `vendor_memberships` | Vendor, user, role, status | Separates vendor owner and staff permissions |
| `vendor_verifications` | Evidence type, review status, reviewer, decision reason | Versioned evidence records; files stay in private storage |
| `vendor_settlement_accounts` | Provider reference, bank code, masked account details, verification status | Protect destination changes and require re-verification |
| `categories` | Name, slug, parent category, sort order | Supports a category tree |
| `products` | Vendor, category, title, slug, description, status | Vendor-owned listing; status controls public visibility |
| `product_variants` | SKU, sellable attributes, price, currency, status | SKU unique per vendor |
| `product_media` | Storage key, order, alt text, moderation status | Links product to image objects |
| `inventory_items` | Variant, location, on-hand, reserved, safety stock | Available stock is calculated; enforce non-negative stock |
| `carts`, `cart_items` | User or guest token, variant, quantity, currency | Recalculate prices and availability at checkout |
| `orders` | Order number, customer, status, presentment currency, settlement currency, billing country, totals | Parent order for the customer’s purchase |
| `vendor_orders` | Order, vendor, status, commission snapshot, vendor payable | One vendor order per vendor in the customer order |
| `order_items` | SKU/title/variant snapshots, quantity, unit price, commission details | Historical purchase snapshot |
| `payments`, `payment_events` | Provider, reference, amount, currency, status, event ID | Deduplicate events and maintain payment attempts |
| `shipments`, `shipment_items`, `tracking_events` | Carrier, tracking code, parcel state, event history | One vendor order may have multiple shipments |
| `refunds`, `disputes` | Payment, order, amount, reason, provider reference, status | Supports partial refunds and disputes |
| `commission_plans` | Effective dates, basis, rate or fixed amount | Versioned commercial terms |
| `ledger_accounts`, `ledger_transactions`, `ledger_entries` | Currency, transaction, direction, amount, reference | Append-only double-entry ledger |
| `payouts`, `payout_items` | Vendor, amount, destination snapshot, provider reference, status | Tracks payout batches and individual results |
| `audit_logs`, `outbox_events`, `idempotency_keys` | Actor, action, entity, correlation ID, request key | Audit and reliable asynchronous delivery |

### **Relationship overview**

```
User 1---many VendorMembership many---1 Vendor 1---many Product 1---many Variant
User 1---many Cart 1---many CartItem many---1 Variant
User 1---many Order 1---many VendorOrder 1---many OrderItem
Order 1---many Payment 1---many PaymentEvent
VendorOrder 1---many Shipment 1---many TrackingEvent
Vendor 1---many Payout 1---many PayoutItem
LedgerTransaction 1---many LedgerEntry many---1 LedgerAccount
```

### **Data integrity rules**

* Use unique constraints for order numbers, SKUs, provider references, webhook event IDs, and idempotency keys.  
* Reserve inventory atomically at checkout and expire reservations safely.  
* Never keep database locks open while calling a payment provider or carrier.  
* Record an outbox event in the same database transaction as the order or payment state change that requires follow-up work.  
* Make ledger entries append-only. Correct errors using reversing entries and new transactions, not edits or deletion.  
* Store country, presentment currency, settlement currency, and customer billing country explicitly. Do not infer these from the customer’s IP address.

## **4\. API design**

Use versioned REST routes under `/api/v1`, with JSON request and response bodies. Generate an OpenAPI specification. Use integer minor units for money and include currency on every monetary amount.

Require an `Idempotency-Key` for checkout creation, refunds, payouts, and other money-moving commands. Errors should include a stable error code, readable message, field-level errors, and correlation ID.

| Area | Example routes | Notes |
| ----- | ----- | ----- |
| Public catalog | `GET /products`, `GET /products/{slug}`, `GET /categories` | Cursor pagination and allowed filters only |
| Identity | `POST /auth/register`, `/login`, `/refresh`, `/logout` | Secure session handling and rate limits |
| Customer | `GET/POST /me/addresses`, `GET /me/orders` | Verify ownership on every request |
| Vendor | `POST /vendor-applications`, `GET /vendor/orders`, product CRUD | Derive vendor scope from authenticated membership |
| Cart and checkout | `GET/PUT /cart`, `POST /checkout/quote`, `POST /checkout/sessions` | Quote includes billing country, shipping destination, delivery eligibility, and currency |
| Orders | `GET /orders/{id}`, `POST /orders/{id}/cancel` | Customer sees only their own order |
| Payments | `POST /payments/{id}/retry`, `/webhooks/paystack`, `/webhooks/flutterwave` | Verify signatures, deduplicate, and verify payment with provider |
| Delivery | `POST /vendor/shipments`, `GET /shipments/{id}` | Carrier details and credentials stay server-side |
| Admin | Vendor review, moderation, refunds, payout batches | Strong permissions and audited actions |
| Finance | Reconciliation, payout batches, retry failed payouts | Finance role and approval workflow |

Additional API rules:

* Use cursor pagination and cap page sizes.  
* Use optimistic concurrency for vendor product and stock edits.  
* Reject reuse of an idempotency key with a different request body.  
* Cache public product reads where appropriate, but keep customer, admin, and payment data private.  
* Never let the browser calculate authoritative order totals.

## **5\. Authentication, authorization, and vendor verification**

### **Authentication**

Support verified email and Nigerian mobile phone numbers, normalized to E.164. Use a maintained password hashing library such as Argon2id. Rate-limit login attempts, OTP requests, and password resets.

For browser sessions, use secure, HttpOnly, SameSite cookies or short-lived access tokens with rotating refresh tokens. Revoke refresh sessions on logout, password reset, account suspension, and suspicious activity.

Require multi-factor authentication for administrators and finance users. Offer it to vendor owners as well.

### **Authorization**

Use role-based access control with resource scope. Example roles include:

* Customer  
* Vendor owner  
* Vendor manager  
* Vendor fulfilment staff  
* Support agent  
* Catalog moderator  
* Finance operator  
* Platform administrator

Check both the user’s permission and ownership of the requested resource. A vendor user can only access the products, orders, and accounts associated with their vendor membership. Deny access by default.

### **Vendor onboarding flow**

1. Vendor creates an account and verifies contact details.  
2. Vendor submits legal and trading name, contact person, business address, product category, operating regions, and return contact.  
3. Collect only the identity and business evidence needed by GOJIFEM’s policy and payment providers.  
4. Store evidence in private object storage with encryption, short-lived access links, and defined retention.  
5. Verify the payout bank account using the provider’s supported account-resolution or verification flow.  
6. A staff reviewer checks the application and records their decision and reason.  
7. Approve, reject, or request more information.  
8. Allow sales only after the vendor is approved, has valid settlement details, and has a published listing.

| Vendor state | Meaning |
| ----- | ----- |
| `draft` | Application started |
| `submitted` | Evidence provided |
| `under_review` | Staff review in progress |
| `needs_information` | Additional evidence requested |
| `approved` | Cleared to sell, subject to listing moderation |
| `suspended` | Temporarily blocked from new sales |
| `rejected` | Application declined |

Keep verification status separate from operational status. Record the reviewer, evidence version, decision, and reason. Re-verify when ownership, legal entity, or settlement account changes.

## **6\. Product catalog and inventory**

* Vendors own product title, description, brand, variants, SKU, price, stock, and media.  
* Products move through `draft`, `pending_review`, `active`, `rejected`, `paused`, or `archived`.  
* Moderators can stop a listing or vendor from selling.  
* Variants store SKU, attributes such as size or colour, price, currency, and status.  
* Use typed attributes for filters customers need. Reserve JSONB for category-specific attributes that do not need frequent querying.  
* Validate price ranges, required product details, image count, and upload type.  
* Strip image metadata and re-encode uploaded images.  
* Track inventory by vendor location, with `on_hand`, `reserved`, and `safety_stock`.  
* Use atomic stock reservation at checkout and prevent negative available inventory.  
* Start search with PostgreSQL full-text and trigram search. Move to a managed search service if search relevance or measured load requires it.

## **7\. Cart, checkout, orders, and refunds**

### **Checkout flow**

```
1. Validate cart, billing country, delivery address, and serviceability
2. Re-read current prices, discounts, taxes, and inventory on the server
3. Group cart items by vendor and calculate delivery per vendor
4. Create a short-lived quote and reserve stock
5. Create order, vendor orders, order lines, payment attempt, and outbox event
6. Initialize provider checkout with server-calculated amount and unique reference
7. Confirm payment through signed webhook and provider verification
8. Mark payment and order paid once; record ledger entries
9. Vendors fulfil their portion and shipments update tracking
10. Release vendor payable when fulfilment and policy conditions are met
```

The checkout quote should show item subtotal, discounts, delivery by vendor, any fees, and total. It should show the transaction currency clearly before payment. If the price or stock changes before payment, require a new quote and customer confirmation.

Never accept an international order and discover after payment that GOJIFEM cannot ship to that destination. Check delivery coverage and display delivery charges before checkout.

### **Order states**

One customer order can contain multiple vendor orders. Each vendor order has its own fulfilment status and shipments.

| Entity | Suggested states |
| ----- | ----- |
| Order | `pending_payment`, `paid`, `processing`, `partially_shipped`, `shipped`, `delivered`, `completed`, `cancelled`, `partially_refunded`, `refunded`, `disputed` |
| Vendor order | `awaiting_vendor`, `accepted`, `packing`, `ready_for_pickup`, `shipped`, `delivered`, `completed`, with cancellation and return states |
| Payment attempt | `created`, `pending`, `succeeded`, `failed`, `expired`, `reversed` |
| Stock reservation | `active`, `committed`, `released`, `expired` |
| Refund | `requested`, `approved`, `submitted`, `succeeded`, `failed` |

### **Failure and refund handling**

* Payment success must be idempotent. Duplicate callbacks must not duplicate an order, ledger entry, or fulfilment task.  
* If the payment provider is unavailable, leave the payment in a pending state and reconcile before expiring it.  
* If a provider times out, query by reference before trying to charge again.  
* Cancellation depends on fulfilment state. Once a parcel has shipped, use the return process.  
* Partial refunds must allocate values to affected order lines and account for commission reversals.  
* Keep original payment and accounting entries. Record refunds and corrections as separate transactions.  
* Notifications inform customers and vendors but do not control order state.

## **8\. Payments for Nigerian and international customers**

International payments are a first-release requirement. Implement a `PaymentProvider` interface so the rest of the system is not tied to Paystack- or Flutterwave-specific behavior.

Start with one contracted provider, enable international card payments, and implement the other provider through the same adapter after payment, refund, and reconciliation behavior has been proven.

### **Payment flow**

```
Checkout domain creates expected amount, currency, order, and unique reference
                         |
              Paystack or Flutterwave adapter
                         |
        Provider-hosted checkout or approved payment component
                         |
       Signed provider webhook received and deduplicated
                         |
      Server verifies payment with provider transaction API
                         |
        Check status, amount, currency, reference, and order
                         |
        Update payment/order once; write ledger and outbox
```

### **International buyer behavior**

* For the simplest international launch, price and charge products in NGN and allow supported international cards.  
* A buyer’s card issuer may convert the NGN charge into the buyer’s card currency. Show that the checkout charge is in NGN before the customer confirms.  
* Do not assume every card, country, or transaction will be approved. Issuer rules, provider risk controls, and account activation affect results.  
* Paystack currently documents international card acceptance for eligible merchants once international payments are enabled. It also documents NGN and USD collection for eligible Nigerian businesses. USD payout requires the appropriate approved setup, including a Nigerian USD domiciliary account according to Paystack’s current guidance.  
* Flutterwave’s supported payment methods vary by country and currency. Only offer methods supported by GOJIFEM’s account and the chosen transaction currency.  
* Do not infer customer country solely from IP. Capture billing and shipping country, and support customer country selection.  
* Keep payment eligibility separate from shipping eligibility. Limit international shipping to configured destinations GOJIFEM can serve.

### **Currency design**

The order and payment model should distinguish:

* Buyer country  
* Billing country  
* Shipping country  
* Presentment currency shown to the customer  
* Provider transaction currency  
* Vendor settlement currency

If GOJIFEM later offers USD, EUR, or GBP prices:

* Store prices separately by currency or use a controlled conversion service.  
* If FX conversion is dynamic, record rate, source, timestamp, and quote expiry.  
* Snapshot currency and amounts on the checkout and order.  
* Reconcile gross amount, payment fees, FX, refunds, and net settlement independently.

### **Payment security and reliability**

* Create the payment amount and reference on the server.  
* Keep provider secret keys in a secrets manager, never in the website or app.  
* Use a unique reference for every payment attempt.  
* Prefer provider-hosted checkout or approved tokenization. GOJIFEM must not store card number or CVV.  
* Treat browser redirects as user experience only. Verify payment by signed webhook and provider API.  
* Compare provider status, reference, amount, currency, and order association before marking an order paid.  
* Deduplicate webhook events and acknowledge them quickly. Process business logic from a durable queue.  
* Reconcile pending transactions, missed webhooks, provider settlement reports, refunds, and disputes.  
* Treat provider timeouts as unknown outcomes. Query the provider before retrying to avoid duplicate charges.

### **Provider capability summary**

| Provider | Documented capability | Implementation considerations |
| ----- | ----- | ----- |
| Paystack | Eligible businesses can accept international cards after enabling the feature; Nigerian businesses may collect NGN or USD with approval | Start with NGN-priced checkout and foreign cards. USD collection and payout require separate approval and account setup. Validate FX, fees, disputes, and refunds. |
| Flutterwave | Payment methods differ by country and currency; cards and regional methods vary | Render only supported methods for the selected currency and GOJIFEM’s account. Verify payment amount and currency server-side. |
| Provider adapter | Initialize, verify, refund, create recipient, transfer, fetch transfer, parse webhook | Normalize provider-specific states into GOJIFEM states. Retain provider references for support and reconciliation. |

Payment provider features, fees, settlement timing, eligibility, and exact terms must be confirmed against GOJIFEM’s own merchant account and contract before launch.

## **9\. Delivery and logistics**

Start with manual delivery zones and rate cards, then add carrier integrations through a stable adapter.

| Component | MVP behavior |
| ----- | ----- |
| Serviceability | Check destination country, region, city, or postal code before payment |
| Quote | Calculate delivery by zone and package band; store quote and expiry |
| Vendor dispatch | Vendor packs the order and marks it ready for pickup |
| Shipment | Support multiple parcels and partial fulfilment per vendor order |
| Tracking | Normalize carrier events into accepted, picked up, in transit, out for delivery, delivered, exception, or returned |
| Proof of delivery | Store timestamp and proof reference while protecting recipient details |
| Exceptions | Queue late, lost, or failed deliveries for operations |
| Fallback | Allow staff to enter manual tracking and delivery updates |

Keep a list of enabled delivery destinations. For each new destination, validate delivery cost, customs and tax handling, returns, customer support, and fulfilment capacity before enabling it.

Verify carrier webhooks and record every tracking event. Do not release payouts based on an unverified delivery callback.

## **10\. Commissions, ledger, and vendor payouts**

### **Commission calculation**

Use versioned commission plans by category or vendor. Define whether the commission rate applies before or after discounts and how shipping, taxes, payment fees, and refunds are handled.

Snapshot the exact commission rate, basis, amount, and vendor payable on the order line. Use basis points and integer arithmetic with documented rounding rules.

Illustrative formula:

```
vendor payable =
  eligible item amount
  - platform commission
  - vendor-borne fees
  + approved adjustments
```

This is an example only. GOJIFEM must define the actual commercial terms.

### **Double-entry ledger**

Maintain balanced double-entry transactions by currency. Possible accounts include:

* Provider clearing or receivable  
* Customer collections  
* Platform commission revenue  
* Vendor payable  
* Delivery payable  
* Refund liability  
* Payout clearing  
* Provider fees

When a payment succeeds, record the funds and liabilities. When a vendor payout is submitted, record the liability movement. Record final success, failure, or reversal from provider confirmation.

Have a finance or accounting professional validate the chart of accounts and reporting treatment.

### **Payout flow**

1. Calculate the vendor’s eligible balance from ledger entries and payout policy.  
2. Exclude orders subject to pending delivery, returns, disputes, refunds, account holds, or reserve.  
3. Create an immutable payout batch with vendor, destination snapshot, amount, currency, and idempotency key.  
4. Require a second approver for high-value or manual payouts.  
5. Submit the transfer with a unique reference.  
6. Verify final transfer status using a signed webhook and provider lookup.  
7. Reconcile provider settlement to the payout and ledger.  
8. Keep failed payouts as vendor liabilities and investigate before retry.  
9. Record reversals as compensating ledger entries.

Payout cadence, reserves, minimum amounts, and fees are commercial policies that must be visible to vendors and recorded with effective dates.

## **11\. Admin and support tools**

The internal admin portal should include:

* **Vendor review:** application queue, evidence access log, checklist, request-more-information, approve, reject, suspend, and decision history.  
* **Catalog moderation:** listing queue, media preview, approve or reject, product flags, and vendor listing pause.  
* **Order operations:** order search, parent and vendor order timelines, payment status, shipment delays, cancellations, returns, and exceptions.  
* **Payment reconciliation:** transaction lookup, webhook event status, verification result, settlement mismatch, refund status, dispute deadlines.  
* **Finance:** ledger journal, vendor statements, payout eligibility, approval, failed transfer queue, and audited exports.  
* **Customer support:** issue history and order context, with permission controls for refunds or account actions.  
* **Platform settings:** commission plans, delivery zones, return policy, feature flags, and provider availability.  
* **Audit:** search by staff actor, action, entity, or date.

Require MFA for internal staff. Hide secrets and full bank account numbers. Require a reason for refunds, suspensions, manual delivery confirmation, and ledger adjustments. Record the actor, timestamp, before-and-after state, reason, and approval chain.

## **12\. Security, privacy, and compliance**

* Use TLS, secure cookies, CSRF protections where relevant, strict CORS, content security policy, and output encoding.  
* Validate all inputs and use prepared database queries.  
* Protect login and OTP endpoints from abuse.  
* Scan and re-encode uploads; restrict file size and type.  
* Encrypt databases, object storage, and backups. Use managed secrets and rotate keys.  
* Apply least privilege to staff, services, cloud roles, and database users.  
* Rate-limit login, OTP, search, checkout, webhook, and admin export endpoints.  
* Minimize personal information. Define retention and deletion rules for identity evidence, payment events, support records, and logs.  
* Redact personal data and secrets from logs and traces.  
* Never store card number or CVV. Confirm PCI responsibilities with the payment provider and a qualified assessor.  
* Have Nigerian legal and compliance specialists review marketplace terms, privacy, returns, tax, vendor verification, payout flow, and applicable data-protection and payment obligations.  
* Maintain incident response contacts, breach escalation, provider key rotation, and backup restoration procedures.

## **13\. Testing and release quality**

Automated tests should cover:

| Test layer | Focus |
| ----- | ----- |
| Unit | Commission math, rounding, inventory availability, roles, state transitions, refunds, idempotency |
| Database integration | Constraints, stock reservation concurrency, ledger balance, outbox consistency, vendor data isolation |
| API contract | OpenAPI schemas, validation, permissions, pagination, compatibility |
| Provider contract | Local and foreign card payments, issuer challenge or decline, webhook signature, duplicates, currency mismatch, refunds, transfer success/failure/reversal |
| End-to-end | Vendor application through approval, listing, checkout, payment, shipment, delivery, and payout eligibility |
| Security | Authorization, IDOR, injection, XSS, CSRF, rate limits, file uploads, secrets and dependency scanning |
| Performance | Product search, checkout contention, webhook bursts, job queues, database capacity |
| Operational exercises | Provider timeout, missing webhook, late carrier update, payout reversal, database failover, backup restore |

This is the proposed test coverage, not a claim that the implementation has already been tested. Before launch, require successful payment and refund scenarios, no unexplained reconciliation differences, reviewed migrations, a rollback procedure, and no unresolved critical security findings.

## **14\. Deployment and infrastructure**

Use separate local, development, staging, and production environments. Keep provider keys, databases, storage, and secrets separate between environments. Do not copy production personal data into development.

```
Internet
   |
DNS / CDN / WAF
   |
Web application and API containers
   |
Private application network
 /            |              \
PostgreSQL   Redis/queue    Object storage
   |                         |
PITR backups           Private uploads + CDN
```

Recommended deployment practices:

* Build immutable container images through CI.  
* Run linting, type checks, automated tests, security scans, and migration checks.  
* Deploy to staging before production.  
* Use rolling or blue/green deployments with health checks and graceful shutdown.  
* Run workers separately from API processes so queues can scale independently.  
* Use retries, backoff, idempotent job consumers, and dead-letter handling.  
* Use expand-and-contract database migrations.  
* Manage infrastructure as code.  
* Define recovery point and recovery time objectives with business owners and test database restoration.  
* Maintain a provider outage runbook.

## **15\. Observability and scalability**

Track user and system outcomes, especially payment and order integrity.

| Area | Measures |
| ----- | ----- |
| Customer journey | Search-to-product, add-to-cart, checkout conversion, payment success by provider and method |
| Orders | Pending payment age, vendor acceptance time, fulfilment SLA, delivery exceptions, returns |
| Money | Provider-to-ledger variance, unverified transactions, refund backlog, payout success and reversal rate |
| Platform | API latency, errors, database connections, slow queries, queue backlog, worker retries |
| Security | Authentication failures, privileged actions, suspicious activity, secret access |

Pass a correlation ID through the API, checkout, order, payment, webhook, and worker job. Do not include personal information or secrets in metrics or traces.

Scale in measured steps:

1. Tune indexes, queries, pagination, cache headers, image delivery, and database pools.  
2. Add a dedicated search service when PostgreSQL search quality or performance requires it.  
3. Add read replicas for reporting and read-heavy work.  
4. Separate worker queues by priority so email does not delay payment jobs.  
5. Partition or archive append-heavy events when measured retention or query costs require it.  
6. Extract a module into a separate service only when a clear operational benefit exists.

## **16\. Phased roadmap and build sequence**

Durations are planning estimates for a small experienced team and should be adjusted for team size, provider onboarding, and business decisions.

| Phase | Build sequence | Exit evidence |
| ----- | ----- | ----- |
| 0\. Discovery and operating model, 1–2 weeks | Confirm categories, destination countries, delivery, vendor criteria, commissions, fees, payout timing, returns/disputes, international payment approval, currencies, FX, and support ownership | Policy decisions signed off; provider sandbox access and international card approval requested; shipping destination matrix completed |
| 1\. Foundation, 2–3 weeks | Repository, CI, environments, database, module skeleton, design system, logging, auth, roles, audit, outbox, storage | Staging environment deployed; staff MFA; migration process and backup plan |
| 2\. Vendor supply, 2–3 weeks | Vendor application and review, settlement account, products, variants, media, moderation, inventory | Vendor can apply, get approved, list product, and manage stock |
| 3\. Customer storefront, 2–3 weeks | Product pages, search, cart, address book, destination eligibility, delivery quote, checkout quote, order creation | Customer can build multi-vendor cart and receive a server-calculated quote |
| 4\. Payments and order integrity, 2–4 weeks | One provider adapter, hosted checkout, international cards enabled, issuer authentication, webhooks, verification, reconciliation, refunds, ledger | Tests cover local and foreign cards, declines, timeouts, duplicate webhooks, currency mismatch, and refunds |
| 5\. Fulfilment and operations, 2–3 weeks | Vendor order portal, shipments, tracking, notifications, admin queues, payout batches | Delivered order, exception, and return handled without manual database edits |
| 6\. Pilot hardening, 2–4 weeks | Security review, load checks, accessibility, analytics, policies, support scripts, runbooks, restore drill, pilot | No critical findings; payment and delivery reconciliation approved by operations and finance |
| 7\. Expansion, ongoing | Second provider, more carriers and destinations, reviews, promotions, richer search, apps, analytics, additional currencies | Each new country and currency validated for payments, delivery, returns, tax, support, and provider terms |

### **First ten delivery slices**

1. Customer account creation and secure sign-in.  
2. Vendor application and auditable staff approval.  
3. Vendor product and inventory creation.  
4. Public browsing and search.  
5. Multi-vendor cart and delivery quote.  
6. Payment through hosted checkout and verified callback.  
7. Independent vendor fulfilment and tracking.  
8. Support exception handling and partial refund.  
9. Finance reconciliation of payment, commission, and vendor payable.  
10. Finance approval and tracking of vendor payout.

## **17\. Key technical decisions**

| Decision | Recommendation |
| ----- | ----- |
| Architecture | Modular monolith with worker process |
| Database | PostgreSQL as source of truth |
| Frontend | Responsive web first |
| API | Versioned REST with OpenAPI |
| Payment providers | One provider live first, international cards enabled, adapter for both |
| International buyer payments | Accept supported foreign cards from launch; initially charge in NGN unless another currency is approved |
| International shipping | Separate country allow-list; start only where delivery, returns, customs, and support are manageable |
| Vendor money | Internal double-entry ledger with controlled payout eligibility |
| Search | PostgreSQL first; dedicated search later if needed |
| Inventory | Transactional stock reservation |
| Expansion | Keep country, currency, and tax as explicit fields |

## **Appendix A. Official payment provider references**

Provider documentation was checked on 11 November 2026 and should be rechecked during implementation and before launch.

### **Paystack**

* [Accept Payments](https://paystack.com/docs/payments/accept-payments/)  
* [Verify Payments](https://paystack.com/docs/payments/verify-payments/)  
* [Webhooks](https://paystack.com/docs/payments/webhooks/)  
* [International Payments](https://support.paystack.com/en/articles/2130690)  
* [Payment Channels](https://paystack.com/docs/payments/payment-channels/)  
* [Split Payments](https://paystack.com/docs/payments/split-payments/)  
* [Multi-split Payments](https://paystack.com/docs/payments/multi-split-payments/)  
* [Subaccount API](https://paystack.com/docs/api/subaccount/)  
* [Single Transfers](https://paystack.com/docs/transfers/single-transfers/)

### **Flutterwave**

* [Split Payments](https://developer.flutterwave.com/docs/split-payments)  
* [Transaction Verification](https://developer.flutterwave.com/docs/transaction-verification)  
* [Webhooks](https://developer.flutterwave.com/docs/webhooks)  
* [Payment Methods by Country and Currency](https://developer.flutterwave.com/v3.0.0/docs/payment-methods)  
* [Best Practices](https://developer.flutterwave.com/docs/best-practices)  
* [Bank Transfers](https://developer.flutterwave.com/v4.0.0/docs/bank-transfer)

These provider references describe technical capabilities.