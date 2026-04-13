# Audit: boolean-marketing-integration-export.yml
Generated: 2026-04-13T18:30:39.710Z

## Summary
- Total flows: 18 (18 business, 0 infrastructure)
- Processes matched: 12
- Bundles covered: 2 / 12
- Unmapped flows: 9
- Overall accuracy: 6%

## Flow Mapping

| Flow | # | Steps | Process | Bundle | Status |
|------|---|-------|---------|--------|--------|
| 03 Marketing Vendor / Channel Lead Data Mapping | 03 | 9 | P-01 | Expense Management Pipeline | mapped |
| 03.1 Customer-Selected Project Type -> Project Type Conversion | 03.1 | 2 | - | - | unmapped |
| 03.2 Customer-Selected Marketing Source -> Multi-Source Conversion | 03.2 | 2 | - | - | unmapped |
| 03.3 Update/Create HubSpot Contact | 03.3 | 8 | - | - | unmapped |
| 03.4 Update/Create HubSpot Deal | 03.4 | 2 | - | - | unmapped |
| 04 MQL to SQL Initiator Webhook | 04 | 5 | P-02 | Expense Management Pipeline | mapped |
| 05 MQL HubSpot Webform Submission | 05 | 4 | P-03 | Expense Management Pipeline | mapped |
| 06 Lead Follow Up flow | 06 | 3 | P-04 | Invoice Lifecycle | mapped |
| 07 New Appointment | 07 | 14 | P-05 | Invoice Lifecycle | mapped |
| 07.1 Sub Flow - Check Incoming Open Deal | 07.1 | 2 | - | - | unmapped |
| 08 Appointment Cancelled | 08 | 4 | P-06 | Invoice Lifecycle | mapped |
| 10 Appointment Reschedule | 10 | 2 | P-07 | Expense Management Pipeline | mapped |
| 11 Estimate Date Converter | 11 | 2 | P-08 | - | unmapped |
| 12 Contact Level Booking Link | 12 | 2 | P-09 | - | unmapped |
| 12.1 Generate YCBM Customer Facing Pre-filled Link | 12.1 | 2 | - | - | unmapped |
| 13 Get Latest Open Deal | 13 | 2 | P-10 | Expense Management Pipeline | mapped |
| 14 Auto Reply Business Hours | 14 | 2 | P-11 | Invoice Lifecycle | mapped |
| 15 - Message Transpiler | 15 | 5 | P-12 | - | unmapped |

## Hallucination Analysis

### Invoice Lifecycle (invoice-lifecycle)
Accuracy: 13% (1 found, 1 partial, 6 not found)

| Step | Actor | Evidence | Matched Actions | Notes |
|------|-------|----------|-----------------|-------|
| Detect unbilled line items ready for invoicing | System | partial | - | Partial match - related components found but action differs |
| Create invoice in accounting software from project data | System | not-found | - | No evidence for: create, invoice |
| Sync invoice details back to project database | System | found | YCBM HS Contact Sync | Found 1 matching step(s) |
| Send invoice to customer via email | System | not-found | - | No evidence for: send, invoice, customer |
| Track payment status and sync updates | Accounting | not-found | - | No evidence for: track, payment, status |
| Handle invoice modifications and corrections | Accounting | not-found | - | No evidence for: handle, invoice, modifications |
| Process void requests and update all systems | Accounting | not-found | - | No evidence for: process, void, requests |
| Generate work order URLs for customer reference | System | not-found | - | No evidence for: generate, customer |

### Expense Management Pipeline (expense-management-pipeline)
Accuracy: 0% (0 found, 1 partial, 7 not found)

| Step | Actor | Evidence | Matched Actions | Notes |
|------|-------|----------|-----------------|-------|
| Import bills and expenses from accounting software | System | not-found | - | No evidence for: import, bills, expenses |
| Match expenses to jobs and projects | System | not-found | - | No evidence for: match, expenses, jobs |
| Sync customer records between accounting and database | System | not-found | - | No evidence for: sync, customer |
| Link parent companies to job records | System | not-found | - | No evidence for: link, parent, companies |
| Link sub-customers to individual projects | System | not-found | - | No evidence for: link, sub-customers, individual |
| Save expense attachments and receipts to database | System | not-found | - | No evidence for: save, expense, attachments |
| Categorize transactions by type and department | System | not-found | - | No evidence for: categorize, transactions, type |
| Generate expense reports by job and time period | System | partial | - | Partial match - related components found but action differs |

## Missed Processes (Not in Any Bundle)

| Flow | Steps | Key Actions | Showcase Potential |
|------|-------|-------------|-------------------|
| [03.1] 03.1 Customer-Selected Project Type -> Project Type Conversion | 2 | cross-flow, branch | medium |
| [03.2] 03.2 Customer-Selected Marketing Source -> Multi-Source Conversion | 2 | cross-flow, branch | medium |
| [03.3] 03.3 Update/Create HubSpot Contact | 8 | cross-flow, code, hubspot, branch | high |
| [03.4] 03.4 Update/Create HubSpot Deal | 2 | cross-flow, branch | medium |
| [07.1] 07.1 Sub Flow - Check Incoming Open Deal | 2 | cross-flow, code | medium |
| [11] 11 Estimate Date Converter | 2 | cross-flow, code | medium |
| [12] 12 Contact Level Booking Link | 2 | branch | low |
| [12.1] 12.1 Generate YCBM Customer Facing Pre-filled Link | 2 | cross-flow, branch | medium |
| [15] 15 - Message Transpiler | 5 | cross-flow, code, http, branch | high |

## Recommendations

- Bundle 'Invoice Lifecycle' has 6 hallucinated step(s) that should be removed or replaced with verified actions
- Bundle 'Expense Management Pipeline' has 7 hallucinated step(s) that should be removed or replaced with verified actions
- Flow '03.3 Update/Create HubSpot Contact' is a strong candidate for a new bundle (8 steps, 4 apps: cross-flow, code, hubspot, branch)
- Flow '15 - Message Transpiler' is a strong candidate for a new bundle (5 steps, 4 apps: cross-flow, code, http, branch)
