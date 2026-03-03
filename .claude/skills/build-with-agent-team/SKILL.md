---
name: build-with-agent-team
description: Denne appliksjonen vil vaere mitt ENK regnskapsprogram, slik at jeg enkelt kan foere MVA melding og ha grunnlag hvis jeg blir kontrollert.
argument-hint: [plan-path] [num-agents]
disable-model-invocation: true
---

# Build with Agent Team

You are coordinating a build using Claude Code Agent Teams. Read the plan document, determine the right team structure, spawn teammates, and orchestrate the build.

This application is a personal MVA/accounting system for a Norwegian ENK (sole proprietorship) selling software internationally. It replaces manual Excel bookkeeping and generates ready-to-submit MVA-melding (VAT returns) for Skatteetaten. The goal is to make it easy to register transactions, automatically calculate MVA per term, and have proper documentation in case of a tax audit.

/app directory should only contain routes with server components. Pages should allways be loaded with server components to fetch data before rendering.

IMPORTANT!
Keep all .ts files under 200 lines of code, add subfolders and split components into smaller files if needed.
Translations files can be larger.

Client components should allways be placed in the /features directory. Features should be organized by domain, with each feature having its own subdirectory. Each feature directory can contain components, hooks, styles, actions and tests related to that specific feature.

For server actions, use one action pr file, so each file will be named after the action it contains.

# Authentication
Use BetterAuth for authentication. The app must have a login feature. All protected routes require authentication. All server actions should be wrapped with withAuth to ensure that only authenticated users can perform actions that modify data.

# UI Framework and Layout
- Allways use shadcn components when possible.
- Use shadcn sidebar-04 as the main layout when logged in. Navigation should include: Dashboard, Transactions, MVA-Melding, Reports, Suppliers, Settings.
- Landing page should be elegant with a clean design and prominent login/register functionality.
- IMPORTANT: Allways use Dialog (from shadcn) for user questions, confirmations and warnings. NEVER use alert() or window.confirm(). Use AlertDialog for destructive actions.
- Use tailwindcss for all styling.

# Data Fetching
Data fetching should be done in server components using async/await syntax. This ensures that data is fetched before the component is rendered, improving performance and user experience.

If a client component needs to fetch data, use react-query for efficient data fetching and caching. Allways use zod for schema validation when fetching data.

# Error Handling
Error handling should be implemented using try/catch blocks in server components and actions. This allows for graceful handling of errors and provides a better user experience. See withAuth for an example of error handling in server actions.

All errors should be propagated to the user with meaningful messages. Use Dialog or toast notifications to show errors to the user. NEVER use alert().

For submenus, use same layout as /settings were we have a child sidebar.

# Example Structure
```
/project-root
|
+-- /app
|   +-- /api
|   +-- /(auth)
|   |   +-- /sign-in
|   |   |   +-- page.tsx
|   |   +-- /sign-up
|   |   |   +-- page.tsx
|   +-- /(protected)
|   |   +-- /dashboard
|   |   |   +-- page.tsx
|   |   +-- /transactions
|   |   |   +-- page.tsx
|   |   |   +-- /new
|   |   |   |   +-- page.tsx
|   |   +-- /mva
|   |   |   +-- page.tsx
|   |   |   +-- /[term]
|   |   |   |   +-- page.tsx
|   |   +-- /reports
|   |   |   +-- page.tsx
|   |   +-- /suppliers
|   |   |   +-- page.tsx
|   |   +-- /settings
|   |   |   +-- page.tsx
|   |   +-- layout.tsx  (sidebar-04 layout)
|   +-- page.tsx  (landing page)
|   +-- layout.tsx
|
+-- /features
|   +-- /auth
|   |   +-- Actions
|   |   |   +-- signInUser.ts
|   |   |   +-- registerUser.ts
|   |   |   +-- logoutUser.ts
|   |   +-- Components
|   |   |   +-- LoginForm.tsx
|   |   |   +-- RegisterForm.tsx
|   |   +-- Hooks
|   |   |   +-- useAuth.ts
|   |   +-- Schema
|   |   |   +-- loginSchema.ts
|   |   |   +-- registerSchema.ts
|   +-- /transactions
|   |   +-- Actions
|   |   |   +-- createTransaction.ts
|   |   |   +-- updateTransaction.ts
|   |   |   +-- deleteTransaction.ts
|   |   |   +-- getTransactions.ts
|   |   +-- Components
|   |   |   +-- TransactionForm.tsx
|   |   |   +-- TransactionList.tsx
|   |   |   +-- TransactionFilters.tsx
|   |   |   +-- RecurringTransactionDialog.tsx
|   |   +-- Hooks
|   |   |   +-- useTransactions.ts
|   |   +-- Schema
|   |   |   +-- transactionSchema.ts
|   +-- /mva
|   |   +-- Actions
|   |   |   +-- calculateTerm.ts
|   |   |   +-- submitTerm.ts
|   |   +-- Components
|   |   |   +-- MvaTermOverview.tsx
|   |   |   +-- MvaMeldingPreview.tsx
|   |   |   +-- TermSelector.tsx
|   |   +-- Hooks
|   |   |   +-- useMvaTerm.ts
|   |   +-- Schema
|   |   |   +-- mvaTermSchema.ts
|   +-- /reports
|   |   +-- Actions
|   |   |   +-- generateReport.ts
|   |   |   +-- exportReport.ts
|   |   +-- Components
|   |   |   +-- ReportOverview.tsx
|   |   |   +-- EkomAdjustmentCalculator.tsx
|   |   +-- Hooks
|   |   |   +-- useReports.ts
|   +-- /suppliers
|   |   +-- Actions
|   |   |   +-- createSupplier.ts
|   |   |   +-- updateSupplier.ts
|   |   |   +-- deleteSupplier.ts
|   |   +-- Components
|   |   |   +-- SupplierForm.tsx
|   |   |   +-- SupplierList.tsx
|   |   +-- Hooks
|   |   |   +-- useSuppliers.ts
|   |   +-- Schema
|   |   |   +-- supplierSchema.ts
|   +-- /settings
|   |   +-- Actions
|   |   |   +-- updateSettings.ts
|   |   +-- Components
|   |   |   +-- BusinessInfoForm.tsx
|   |   |   +-- EkomSettingsForm.tsx
|   |   +-- Schema
|   |   |   +-- settingsSchema.ts
|   +-- /landing
|   |   +-- Components
|   |   |   +-- Hero.tsx
|   |   |   +-- Features.tsx
|   |   |   +-- LoginCTA.tsx
```

---

## Domain Context: Norwegian MVA (VAT) for ENK

### Business Model
- Sole proprietorship (ENK) registered in the Norwegian MVA registry (Merverdiavgiftsregisteret)
- Revenue: Software sales to international clients (export, 0% MVA)
- Expenses: Mix of foreign SaaS services and Norwegian suppliers
- MVA returns submitted 6 times per year (bi-monthly terms)

### Critical MVA Codes and Calculation Rules

#### Kode 52 - Export Sales (Utfoersel av varer og tjenester)
- All sales to international clients
- VAT rate: 0% (fritatt/zero-rated, NOT exempt/unntatt)
- Zero-rated sales still grant full deduction rights for input VAT
- Only grunnlag (base amount) is reported, MVA is always 0
- Legal basis: Merverdiavgiftsloven sections 6-21 and 6-22

#### Kode 86 - Foreign Services Purchased (Tjenester kjoept fra utlandet)
- Services purchased from foreign suppliers without Norwegian VAT
- Reverse charge mechanism (omvendt avgiftsplikt) applies
- Amounts are EXCLUDING VAT (supplier invoices have no Norwegian MVA)
- Calculated MVA = amount x 0.25 (25% of base amount)
- Deduction = same amount as calculated MVA, but with negative sign
- Net MVA effect is ALWAYS zero (calculated MVA cancels out with deduction)
- Must still be reported in the MVA-melding
- Foreign currency must be converted to NOK using exchange rate on invoice date or payment date
- Examples: Microsoft 365, domain registrations, hosting services, SaaS subscriptions

#### Kode 1 - Norwegian Purchases with VAT (Inngaaende MVA, hoey sats)
- Purchases from Norwegian suppliers where invoice INCLUDES 25% MVA
- CRITICAL CALCULATION: Amounts on invoices are INCLUDING VAT
- MVA deduction = total amount including VAT x 0.2 (NOT x 0.25!)
- Explanation: If base = 878.40, MVA = 878.40 x 0.25 = 219.60, Total = 1098. So: 1098 x 0.2 = 219.60
- Only the MVA amount is entered in the return (not base amount), with negative sign
- Requirement: Seller must be registered in MVA registry, invoice must show org.nr with "MVA"
- Examples: Telenor internet, Norwegian software, office supplies

#### Other Codes (future support)
- Kode 11: Input VAT 15% (food/drinks)
- Kode 13: Input VAT 12% (hotel/transport)
- Kode 81: Import of physical goods from abroad

### MVA-Melding Structure Per Term

Terms: Jan-Feb, Mar-Apr, Mai-Jun, Jul-Aug, Sep-Okt, Nov-Des
Deadline: 10th of the month after the term (e.g., Feb 10 for Nov-Dec term)

What gets submitted to Skatteetaten per term:

1. Kode 52: Grunnlag = sum of sales, Sats = 0%, MVA = 0
2. Kode 86 beregnet: Grunnlag = sum of foreign purchases, Sats = 25%, MVA = grunnlag x 0.25 (positive)
3. Kode 86 fradrag: MVA = same amount as line 2 (negative)
4. Kode 1: MVA = sum of Norwegian purchases incl. MVA x 0.2 (negative)

Result formula: Sum MVA = 0 + kode86_mva - kode86_fradrag - kode1_fradrag = -kode1_fradrag
Negative total = money returned from the state.

### EKOM Rules (Electronic Communication Services)
- Fixed annual deduction for private use: 4392 NOK/year (2025 and 2026), 366 NOK/month
- Applies regardless of number of subscriptions
- Private portion must be reversed at year-end (tax adjustment, not per MVA term)
- MVA deduction must also be corrected for private use at year-end

### Currency Handling
- Foreign invoices (EUR, USD) must be converted to NOK
- Use exchange rate from invoice date or payment date
- Bank rate at time of account debit is acceptable

### Receipt/Documentation Requirements
- All purchases must have receipt/invoice
- Norwegian invoices must show sellers org.nr + "MVA"
- No receipt = no deduction

---

## Application Features

### Feature: Landing Page (/features/landing)
- Elegant, clean landing page as the root route
- Prominent login and register buttons/forms
- Brief explanation of what the app does
- Redirect to /dashboard if already authenticated

### Feature: Auth (/features/auth)
- BetterAuth integration for authentication
- Login form with email/password
- Register form for new users
- Session management and protected routes
- Logout functionality

### Feature: Transactions (/features/transactions)
- Register expenses: description, amount, currency, supplier type (Norwegian/foreign), date, category
- Register sales: description, amount, client, date
- Auto-assign MVA code based on supplier type (foreign = kode 86, Norwegian = kode 1, sales = kode 52)
- Support recurring monthly transactions (subscriptions) via Dialog
- Currency conversion EUR/USD to NOK (automatic API or manual input)
- Attach receipts (image/PDF upload)
- List/filter/search transactions by period, type, MVA code
- Delete confirmation using AlertDialog (destructive action)

### Feature: MVA Calculator (/features/mva)
- Automatic calculation per bi-monthly term
- Kode 52: Sum sales per term
- Kode 86: Sum foreign purchases, calculate MVA x 0.25, calculate deduction
- Kode 1: Sum Norwegian purchases (incl. MVA), calculate MVA deduction x 0.2
- Display complete MVA-melding ready for manual entry at skatteetaten.no
- Show net result (amount to pay or receive back)
- Term deadline reminders
- Mark term as submitted via confirmation Dialog

### Feature: Dashboard (/features/dashboard)
- Overview of current term status
- Total sales, expenses, and MVA position
- Upcoming deadlines
- Quick-add transaction shortcuts

### Feature: Reports (/features/reports)
- Transaction overview per month/term/year
- MVA-melding summary per term (printable)
- Annual summary: total sales, total costs, total MVA returned
- Export to Excel/PDF
- EKOM year-end adjustment calculator

### Feature: Suppliers (/features/suppliers)
- Supplier registry with name, country, currency, type (Norwegian/foreign)
- Auto-detect MVA code when creating transactions for known suppliers
- Store default categories per supplier
- Delete confirmation using AlertDialog

### Feature: Settings (/features/settings)
- Business information (org.nr, name, address)
- MVA registration details
- Default currency exchange rate source
- EKOM private use percentage
- Fiscal year settings
- Data backup/export
- Child sidebar for settings sub-pages

---

## Data Models

### User (managed by BetterAuth)
- id: string
- email: string
- name: string
- password: hashed

### Transaction
- id: string (uuid)
- userId: string (reference to user)
- date: Date (invoice date, determines which term it belongs to)
- description: string
- amount: number (in original currency)
- currency: enum (NOK, EUR, USD)
- amountNOK: number (converted amount)
- exchangeRate: number (if foreign currency)
- type: enum (SALE, EXPENSE)
- mvaCode: enum (52, 86, 1, 11, 13, 81)
- supplierId: string (optional, reference to supplier)
- category: string
- receiptUrl: string (optional, path to uploaded receipt)
- isRecurring: boolean
- notes: string (optional)
- createdAt: Date
- updatedAt: Date

### Supplier
- id: string (uuid)
- userId: string (reference to user)
- name: string
- country: string
- currency: enum (NOK, EUR, USD)
- type: enum (NORWEGIAN, FOREIGN)
- defaultMvaCode: enum (1, 86)
- defaultCategory: string (optional)

### MvaTerm
- id: string (uuid)
- userId: string (reference to user)
- year: number
- term: enum (JAN_FEB, MAR_APR, MAI_JUN, JUL_AUG, SEP_OKT, NOV_DES)
- kode52Grunnlag: number (calculated)
- kode86Grunnlag: number (calculated)
- kode86Mva: number (calculated, grunnlag x 0.25)
- kode86Fradrag: number (calculated, same as mva but negative)
- kode1MvaFradrag: number (calculated, sum inkl. MVA x 0.2, negative)
- totalMva: number (calculated, sum of all MVA lines)
- status: enum (DRAFT, SUBMITTED)
- submittedAt: Date (optional)
- deadline: Date (calculated)

### EkomAdjustment
- id: string (uuid)
- userId: string (reference to user)
- year: number
- totalEkomCost: number
- privateShareAmount: number (max 4392 for 2025/2026)
- mvaAdjustment: number (MVA to reverse for private use)

### BusinessSettings
- id: string (uuid)
- userId: string (reference to user)
- orgNr: string
- businessName: string
- address: string
- ekomPrivatePercent: number (default based on sjablong)
- defaultCurrency: enum (NOK, EUR, USD)

---

## Example Data for Testing

Term: Nov-Des 2025

Kode 86 transactions:
- Outlook egeland.io: 131.55 NOK (Nov) + 131.55 NOK (Des) = 263.10
- Outlook uavmatrix.com: 86.36 NOK (Nov) + 86.36 NOK (Des) = 172.72
- Tuxis Proxmox PBS: 237.55 NOK (Nov) + 237.55 NOK (Des) = 475.10
- Domene uavmatrix.com: 1234.00 NOK (Des)
- Sum grunnlag kode 86: 2144.92 (rounded to 2145)

Kode 1 transactions:
- Telenor internett: 1098.00 NOK inkl. MVA (Nov) + 1098.00 NOK inkl. MVA (Des) = 2196.00
- MVA fradrag: 2196 x 0.2 = 439.20 (rounded to 439)

Kode 52 transactions:
- Software sales: 3828 NOK

Expected MVA-melding output:
- Kode 52: Grunnlag 3828, Sats 0%, MVA 0
- Kode 86 beregnet: Grunnlag 2145, Sats 25%, MVA +536
- Kode 86 fradrag: MVA -536
- Kode 1 fradrag: MVA -439
- Sum MVA: -439 (439 kr returned from state)
