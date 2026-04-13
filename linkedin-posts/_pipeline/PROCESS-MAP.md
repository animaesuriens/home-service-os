# Process Map: Home Service Automation Pipeline

**Generated:** 2026-04-12
**Source:** 8 Prismatic integration YAML exports
**Total Processes:** 76
**Customer Journey Coverage:** Lead Capture (3), Lead Qualification (1), Appointment Booking (4), Estimating (1), Sales/Proposal (11), Contract Management (3), Job Setup (1), Production Tracking (4), Time Tracking (7), Invoicing (8), Expense Management (7), Reporting (2), Uncategorized (24)

## Summary

| # | Process Name | Journey Stage | Source Files | Steps | Multi-File |
|---|--------------|---------------|--------------|-------|------------|
| 1 | Lead Follow Up flow | Lead Capture | marketing-integration | 3 |  |
| 2 | Marketing Vendor / Channel Lead Data Mapping | Lead Capture | marketing-integration | 23 |  |
| 3 | MQL HubSpot Webform Submission | Lead Capture | marketing-integration | 4 |  |
| 4 | MQL to SQL Initiator Webhook | Lead Qualification | marketing-integration | 5 |  |
| 5 | Appointment Reschedule | Appointment Booking | marketing-integration | 2 |  |
| 6 | Contact Level Booking Link | Appointment Booking | marketing-integration | 4 |  |
| 7 | New Appointment | Appointment Booking | marketing-integration | 16 |  |
| 8 | accounting software Bills | Appointment Booking | accounting-system | 53 |  |
| 9 | estimating tool > HubSpot | Process Quote - Estimate > Deal Sync | Estimating | sales-integration | 8 |  |
| 10 | Cancelled Deal Sync | Sales/Proposal | sales-integration | 2 |  |
| 11 | Change Order Label Processor | Sales/Proposal | sales-integration | 4 |  |
| 12 | Change Order Label Processor | Sales/Proposal | job-management-integration | 4 |  |
| 13 | Change Order Process | Sales/Proposal | sales-integration | 22 |  |
| 14 | Create Any Missing estimating tool, HubSpot Deal & photo storage | Sales/Proposal | sales-integration | 2 |  |
| 15 | Deal Naming System Trigger | Sales/Proposal | sales-integration | 5 |  |
| 16 | Get Latest Open Deal | Sales/Proposal | marketing-integration | 2 |  |
| 17 | Process Change Order | Sales/Proposal | job-management-integration | 7 |  |
| 18 | Process Deal | Sales/Proposal | job-management-integration | 5 |  |
| 19 | Register HS Deal Owner | Sales/Proposal | sales-integration | 4 |  |
| 20 | Set/Update HS Deal Name & photo storage Project Name | Sales/Proposal | sales-integration | 2 |  |
| 21 | Contract Sent | Contract Management | job-management-integration | 3 |  |
| 22 | Contract Signed | Contract Management | job-management-integration | 4 |  |
| 23 | Subcontractor Bill Payment | Contract Management | accounting-system | 4 |  |
| 24 | Create Addendums | Job Setup | job-management-integration | 10 |  |
| 25 | Process Timelog | Production Tracking | daily-production-data | 2 |  |
| 26 | Sync QBT | Production Tracking | daily-production-data | 3 |  |
| 27 | Update DPD | Production Tracking | daily-production-data | 3 |  |
| 28 | Update DPD Schedule | Production Tracking | daily-production-data | 3 |  |
| 29 | Inactive Jobcode Sync | Time Tracking | qb-time-tracking-system | 2 |  |
| 30 | Initial Timelogs Sync | Time Tracking | qb-time-tracking-system | 10 |  |
| 31 | Job Codes Sync | Time Tracking | qb-time-tracking-system | 5 |  |
| 32 | Jobcodes Location Sync | Time Tracking | qb-time-tracking-system | 5 |  |
| 33 | Sync Delete Timelogs | Time Tracking | qb-time-tracking-system | 7 |  |
| 34 | Time Tracking System | Time Tracking | qb-time-tracking-system | 9 |  |
| 35 | User Sync | Time Tracking | qb-time-tracking-system | 4 |  |
| 36 | [Manual Sync] Sync All Invoices and Transactions | Invoicing | accounting-system | 6 |  |
| 37 | [Ongoing] 11 Invoice and Work Order URL | Invoicing | sales-integration | 10 |  |
| 38 | Create Invoice in AT from Unbilled Line Items | Invoicing | accounting-system | 18 |  |
| 39 | Import Invoices from accounting software | Invoicing | accounting-system | 8 |  |
| 40 | Send or ReSend Invoice | Invoicing | accounting-system | 4 |  |
| 41 | Sync Modified Invoices and Transactions | Invoicing | accounting-system | 20 |  |
| 42 | Update Invoice in accounting software | Invoicing | accounting-system | 13 |  |
| 43 | Void Invoice | Invoicing | accounting-system | 7 |  |
| 44 | Initial Sync QB Bills | Expense Management | accounting-system | 18 |  |
| 45 | Save Expense's Attachments in Airtable | Expense Management | accounting-system | 10 |  |
| 46 | Sync Payment | Expense Management | accounting-system | 2 |  |
| 47 | Sync accounting software Customer | Expense Management | accounting-system | 4 |  |
| 48 | Sync Vendors accounting software -> AT | Expense Management | accounting-system | 3 |  |
| 49 | Upsert accounting software Parent Customer Linked to Jobs | Expense Management | accounting-system | 5 |  |
| 50 | Upsert accounting software Sub Customer Linked to Projects | Expense Management | accounting-system | 5 |  |
| 51 | On deploy | Reporting | sales-and-marketing-reporting | 6 |  |
| 52 | Sync every 2 minutes | Reporting | sales-and-marketing-reporting | 12 |  |
| 53 | - Message Transpiler | Uncategorized | marketing-integration | 5 |  |
| 54 | Appointment Cancelled | Uncategorized | marketing-integration | 4 |  |
| 55 | Auto Reply Business Hours | Uncategorized | marketing-integration | 2 |  |
| 56 | Company Sync | Uncategorized | job-management-integration | 2 |  |
| 57 | Contact Sync | Uncategorized | job-management-integration | 2 |  |
| 58 | Create Available Event Calendar | Uncategorized | gmail-and-ring-central-communicator | 2 |  |
| 59 | Customer-Selected Project Type -> Project Type Conversion | Uncategorized | sales-integration | 2 |  |
| 60 | Error Notification Sender | Uncategorized | job-management-integration, gmail-and-ring-central-communicator | 3 | Yes |
| 61 | Estimate Date Converter | Uncategorized | marketing-integration | 2 |  |
| 62 | Fetch customers from accounting software | Uncategorized | accounting-system | 4 |  |
| 63 | Fetch Departments | Uncategorized | accounting-system | 3 |  |
| 64 | Fetch Tax Codes | Uncategorized | accounting-system | 3 |  |
| 65 | your email Sender | Uncategorized | gmail-and-ring-central-communicator | 5 |  |
| 66 | Grab Items/Classes from QB | Uncategorized | accounting-system | 9 |  |
| 67 | Hubspot mapper to file field | Uncategorized | job-management-integration | 5 |  |
| 68 | Hubspot SMS Sent Logger | Uncategorized | sales-integration | 6 |  |
| 69 | Manual Update accounting software Customer Status | Uncategorized | accounting-system | 3 |  |
| 70 | estimating tool All Data Sync to HubSpot | Uncategorized | sales-integration | 19 |  |
| 71 | estimating tool Default Identifier | Uncategorized | sales-integration | 13 |  |
| 72 | accounting software Transactions | Uncategorized | accounting-system | 8 |  |
| 73 | RC Text Sender | Uncategorized | gmail-and-ring-central-communicator | 3 |  |
| 74 | Register HS Users | Uncategorized | job-management-integration | 6 |  |
| 75 | TNT Contact Flow | Uncategorized | sales-integration | 2 |  |
| 76 | Update Estimate Calendar | Uncategorized | gmail-and-ring-central-communicator | 5 |  |

## Detailed Process Descriptions

### 1. Lead Follow Up flow

**Journey Stage:** Lead Capture

**Source:** boolean-marketing-integration-export.yml

**Description:** New Call/Meeting Engagement in HubSpot deal

**Key Steps:**
1. Sleep

**Apps Involved:** Webhook Triggers, Sleep

### 2. Marketing Vendor / Channel Lead Data Mapping

**Journey Stage:** Lead Capture

**Source:** boolean-marketing-integration-export.yml

**Description:** Purpose: Format incoming lead data from whatever JSON format a marketing vendor/channel has lead data into the standard format that we need to process the new lead

**Key Steps:**
1. Lookup Project
2. Lookup Sources
3. Get Contact
4. Get Deal
5. Search Contact by id
6. Search Contact by email
7. HS Contact Final Output

**Apps Involved:** Webhook Triggers, HubSpot

**Inefficiencies to Fix in Posts:**
- Complex flow could be simplified (15+ steps)
- Custom code could be replaced with native actions

### 3. MQL HubSpot Webform Submission

**Journey Stage:** Lead Capture

**Source:** boolean-marketing-integration-export.yml

**Description:** New contact created in HubSpot with associated deal

**Key Steps:**
1. Get Contact Properties

**Apps Involved:** Webhook Triggers, HubSpot

### 4. MQL to SQL Initiator Webhook

**Journey Stage:** Lead Qualification

**Source:** boolean-marketing-integration-export.yml

**Description:** Deal Trigger from HS then send data to YCBM to autofill the page

**Key Steps:**
1. Retrieve Deal Properties

**Apps Involved:** Webhook Triggers, HubSpot

### 5. Appointment Reschedule

**Journey Stage:** Appointment Booking

**Source:** boolean-marketing-integration-export.yml

**Description:** Updates the hubspot estimated date when the YCBM Rescheduled

**Apps Involved:** Webhook Triggers

### 6. Contact Level Booking Link

**Journey Stage:** Appointment Booking

**Source:** boolean-marketing-integration-export.yml

**Description:** Contact Level Booking Link

**Key Steps:**
1. HTTP

**Apps Involved:** Webhook Triggers

### 7. New Appointment

**Journey Stage:** Appointment Booking

**Source:** boolean-marketing-integration-export.yml

**Description:** Triggers when a new appointment is initiated then it will create a deal, PS quote, and photo storage project.

**Key Steps:**
1. Override Payload
2. Lookup Project Type
3. Lookup Sources
4. Extract Email
5. Output Contact
6. Check dealStage

**Apps Involved:** Text Manipulation

**Inefficiencies to Fix in Posts:**
- Complex flow could be simplified (15+ steps)
- Custom code could be replaced with native actions

### 8. accounting software Bills

**Journey Stage:** Appointment Booking

**Source:** boolean-accounting-system-export.yml

**Description:** accounting software Bills: Flow is enabled in Wizard?, Calculated Date, Format Date/Time, ...

**Key Steps:**
1. Runs Every Day
2. Calculated Date
3. Format Date/Time
4. Start Index
5. Loop N Times
6. Runs Every Day
7. Calculated Date
8. Format Date/Time
9. Start Index
10. Loop N Times

**Apps Involved:** Schedule Triggers, Datetime, Persist Data, Airtable, Stop Execution

**Inefficiencies to Fix in Posts:**
- Complex flow could be simplified (15+ steps)
- Custom code could be replaced with native actions
- Repetitive datetime API calls could be batched (8 calls)

### 9. estimating tool > HubSpot | Process Quote - Estimate > Deal Sync

**Journey Stage:** Estimating

**Source:** boolean-sales-integration-export.yml

**Description:** estimating tool > HubSpot | Process Quote - Estimate > Deal Sync

**Key Steps:**
1. Estimate Date To Sync
2. Time X Minutes Ago
3. Time X Minutes Ago to Epoch
4. List Quotes

**Apps Involved:** Schedule Triggers, Datetime, estimating tool

### 10. Cancelled Deal Sync

**Journey Stage:** Sales/Proposal

**Source:** boolean-sales-integration-export.yml

**Description:** Cancelled Deal Sync

**Apps Involved:** 

### 11. Change Order Label Processor

**Journey Stage:** Sales/Proposal

**Source:** boolean-sales-integration-export.yml

**Description:** Counts the number of CO in HS

**Key Steps:**
1. Get Deals with same job record id

**Apps Involved:** HubSpot

### 12. Change Order Label Processor

**Journey Stage:** Sales/Proposal

**Source:** job-management-integration-export.yml

**Description:** Counts the number of CO in HS

**Key Steps:**
1. Get Deals with same job record id

**Apps Involved:** HubSpot

### 13. Change Order Process

**Journey Stage:** Sales/Proposal

**Source:** boolean-sales-integration-export.yml

**Description:** 03 Change Order Process

**Key Steps:**
1. Split Sources
2. Source IDs Count
3. Get Deal Properties
4. Get Deal
5. Get Contact Association
6. Get Company Association
7. Sales Rate
8. Sum Deal Amounts
9. Sum Deal Hours
10. Sum Deal Labor

**Apps Involved:** Text Manipulation, Collection Tools, HubSpot, Math

**Inefficiencies to Fix in Posts:**
- Complex flow could be simplified (15+ steps)
- Custom code could be replaced with native actions
- Repetitive collection-tools API calls could be batched (6 calls)

### 14. Create Any Missing estimating tool, HubSpot Deal & photo storage

**Journey Stage:** Sales/Proposal

**Source:** boolean-sales-integration-export.yml

**Description:** Create Any Missing estimating tool, HubSpot Deal & photo storage

**Apps Involved:** 

### 15. Deal Naming System Trigger

**Journey Stage:** Sales/Proposal

**Source:** boolean-sales-integration-export.yml

**Description:** Deal Naming System Trigger: Adjust Date/Time, Time 2 Minutes Ago to Epoch, Get Deals, ...

**Key Steps:**
1. Adjust Date/Time
2. Time 2 Minutes Ago to Epoch

**Apps Involved:** Schedule Triggers, Datetime

### 16. Get Latest Open Deal

**Journey Stage:** Sales/Proposal

**Source:** boolean-marketing-integration-export.yml

**Description:** Get Latest Open Deal

**Apps Involved:** 

### 17. Process Change Order

**Journey Stage:** Sales/Proposal

**Source:** job-management-integration-export.yml

**Description:** Creates change order record in Addendums table

**Key Steps:**
1. Get Fields
2. Get Job

**Apps Involved:** Airtable

### 18. Process Deal

**Journey Stage:** Sales/Proposal

**Source:** job-management-integration-export.yml

**Description:** Processing won deals to Jobs table in PaintOS

**Key Steps:**
1. Get Deal Properties
2. Get Companies Properties

**Apps Involved:** Webhook Triggers, HubSpot

### 19. Register HS Deal Owner

**Journey Stage:** Sales/Proposal

**Source:** boolean-sales-integration-export.yml

**Description:** Register HS Deal Owner: Get Owner, List People, Upsert Deal Owners

**Key Steps:**
1. Get Owner
2. List People

**Apps Involved:** Schedule Triggers, HubSpot, Airtable

### 20. Set/Update HS Deal Name & photo storage Project Name

**Journey Stage:** Sales/Proposal

**Source:** boolean-sales-integration-export.yml

**Description:** Set/Update HS Deal Name & photo storage Project Name: HS Deal ID Exists

**Apps Involved:** Webhook Triggers

### 21. Contract Sent

**Journey Stage:** Contract Management

**Source:** job-management-integration-export.yml

**Description:** Send eSignature Contract for all Addendum Type

**Key Steps:**
1. CO Records

**Apps Involved:** Schedule Triggers, Airtable

### 22. Contract Signed

**Journey Stage:** Contract Management

**Source:** job-management-integration-export.yml

**Description:** Watch Signed eSignature Contract for all Addendum Type

**Key Steps:**
1. Format Date
2. Get Addendum Record

**Apps Involved:** Webhook Triggers, Datetime, Airtable

### 23. Subcontractor Bill Payment

**Journey Stage:** Contract Management

**Source:** boolean-accounting-system-export.yml

**Description:** Subcontractor Bill Payment: Expenses sync enabled?, List Expenses, Loop Over Expenses

**Key Steps:**
1. List Expenses

**Apps Involved:** Schedule Triggers, Airtable

### 24. Create Addendums

**Journey Stage:** Job Setup

**Source:** job-management-integration-export.yml

**Description:** Creates new Addendums deal in HubSpot for field types.

**Key Steps:**
1. List Addendums
2. Stop Execution
3. Sleep

**Apps Involved:** Schedule Triggers, Airtable, Stop Execution, Sleep

**Inefficiencies to Fix in Posts:**
- Custom code could be replaced with native actions

### 25. Process Timelog

**Journey Stage:** Production Tracking

**Source:** daily-production-data-export.yml

**Description:** Process Timelog: Project exists?

**Apps Involved:** 

### 26. Sync QBT

**Journey Stage:** Production Tracking

**Source:** daily-production-data-export.yml

**Description:** Sync QBT: Stop Execution, List Records

**Key Steps:**
1. Stop Execution
2. List Records

**Apps Involved:** Schedule Triggers, Stop Execution, Airtable

### 27. Update DPD

**Journey Stage:** Production Tracking

**Source:** daily-production-data-export.yml

**Description:** Update DPD: List Time Logs, Loop Time Logs

**Key Steps:**
1. List Time Logs

**Apps Involved:** Schedule Triggers, Airtable

### 28. Update DPD Schedule

**Journey Stage:** Production Tracking

**Source:** daily-production-data-export.yml

**Description:** This updates the daily production data records when the associated project's start and end dates are updated.

**Key Steps:**
1. Runs 30 Minutes
2. List Projects

**Apps Involved:** Schedule Triggers, Airtable

### 29. Inactive Jobcode Sync

**Journey Stage:** Time Tracking

**Source:** quick-books-time-tracking-system-export.yml

**Description:** The purpose of this flow is to archive or inactive ALL existing jobcodes in the account. This is to remove test projects created by the automation.

**Apps Involved:** Webhook Triggers

### 30. Initial Timelogs Sync

**Journey Stage:** Time Tracking

**Source:** quick-books-time-tracking-system-export.yml

**Description:** Initial Timelogs Sync: Default Days, Adjust Date/Time, Format to ISO Date, ...

**Key Steps:**
1. Adjust Date/Time
2. Format to ISO Date

**Apps Involved:** Management Triggers, Datetime

**Inefficiencies to Fix in Posts:**
- Custom code could be replaced with native actions

### 31. Job Codes Sync

**Journey Stage:** Time Tracking

**Source:** quick-books-time-tracking-system-export.yml

**Description:** Job Codes Sync: Retrieve Eligible Projects, Retrieve All Active Jobcodes, Jobcodes Bulk Update, ...

**Apps Involved:** Schedule Triggers

**Inefficiencies to Fix in Posts:**
- Custom code could be replaced with native actions

### 32. Jobcodes Location Sync

**Journey Stage:** Time Tracking

**Source:** quick-books-time-tracking-system-export.yml

**Description:** Jobcodes Location Sync: Retrieve Eligible Projects, Retrieve Locations, Upsert Location, ...

**Apps Involved:** Schedule Triggers

**Inefficiencies to Fix in Posts:**
- Custom code could be replaced with native actions

### 33. Sync Delete Timelogs

**Journey Stage:** Time Tracking

**Source:** quick-books-time-tracking-system-export.yml

**Description:** Sync Delete Timelogs: Adjust Date/Time, Format to ISO Date, Retrieve All Deleted Time Sheets, ...

**Key Steps:**
1. Adjust Date/Time
2. Format to ISO Date

**Apps Involved:** Schedule Triggers, Datetime

**Inefficiencies to Fix in Posts:**
- Custom code could be replaced with native actions

### 34. Time Tracking System

**Journey Stage:** Time Tracking

**Source:** quick-books-time-tracking-system-export.yml

**Description:** Time Tracking System: Adjust Date/Time, Format to ISO Date, Retrieve All Time Sheets, ...

**Key Steps:**
1. Adjust Date/Time
2. Format to ISO Date

**Apps Involved:** Schedule Triggers, Datetime

**Inefficiencies to Fix in Posts:**
- Custom code could be replaced with native actions

### 35. User Sync

**Journey Stage:** Time Tracking

**Source:** quick-books-time-tracking-system-export.yml

**Description:** User Sync: Retrieve All Users, Retrieve All People, Bulk Update Users

**Apps Involved:** Schedule Triggers

**Inefficiencies to Fix in Posts:**
- Custom code could be replaced with native actions

### 36. [Manual Sync] Sync All Invoices and Transactions

**Journey Stage:** Invoicing

**Source:** boolean-accounting-system-export.yml

**Description:** [Manual Sync] Sync All Invoices and Transactions: Get Cursor, List Project Types, Map Project Types, ...

**Key Steps:**
1. Get Cursor
2. List Project Types

**Apps Involved:** Webhook Triggers, Persist Data, Airtable

### 37. [Ongoing] 11 Invoice and Work Order URL

**Journey Stage:** Invoicing

**Source:** boolean-sales-integration-export.yml

**Description:** estimating tool > HubSpot > Invoice and work order url Sync

**Key Steps:**
1. Get Accepted Quotes
2. Stop Execution 2
3. Estimate Date To Sync
4. Time 2 Minutes Ago
5. Time 2 Minutes Ago to Epoch
6. List Quotes

**Apps Involved:** Webhook Triggers, estimating tool, Stop Execution, Datetime

### 38. Create Invoice in AT from Unbilled Line Items

**Journey Stage:** Invoicing

**Source:** boolean-accounting-system-export.yml

**Description:** Create Invoice in AT from Unbilled Line Items: Get Job, Job Found?, Get Preferences, ...

**Key Steps:**
1. Get Job
2. Get Preferences
3. Get Invoice
4. Get Job
5. Get Customer By Id
6. Update Parent Customer
7. List Invoices Linked to Job
8. Get Invoice Lines
9. Create Invoice

**Apps Involved:** Webhook Triggers, Airtable, accounting software

**Inefficiencies to Fix in Posts:**
- Complex flow could be simplified (15+ steps)
- Custom code could be replaced with native actions

### 39. Import Invoices from accounting software

**Journey Stage:** Invoicing

**Source:** boolean-accounting-system-export.yml

**Description:** Given a Job Record ID

**Key Steps:**
1. Initial Status
2. Get Job
3. List Project Types
4. Get All Invoices

**Apps Involved:** Webhook Triggers, Airtable, accounting software

### 40. Send or ReSend Invoice

**Journey Stage:** Invoicing

**Source:** boolean-accounting-system-export.yml

**Description:** Send or ReSend Invoice: Get Invoice, Send Invoice, Status Branch

**Key Steps:**
1. Get Invoice
2. Send Invoice

**Apps Involved:** Webhook Triggers, Airtable, accounting software

### 41. Sync Modified Invoices and Transactions

**Journey Stage:** Invoicing

**Source:** boolean-accounting-system-export.yml

**Description:** Sync invoices that were modified for the last x hours

**Key Steps:**
1. Get Cursor
2. List Project Types
3. Find Associated Job
4. Upsert Invoice
5. Process Payments
6. Save Invoice PDF
7. Get All Payment Methods

**Apps Involved:** Schedule Triggers, Persist Data, Airtable, accounting software

**Inefficiencies to Fix in Posts:**
- Complex flow could be simplified (15+ steps)
- Custom code could be replaced with native actions

### 42. Update Invoice in accounting software

**Journey Stage:** Invoicing

**Source:** boolean-accounting-system-export.yml

**Description:** Update Invoice in accounting software: Get Invoice, Get Invoice By Id, Get Job, ...

**Key Steps:**
1. Get Invoice
2. Get Invoice By Id
3. Get Job
4. List Invoices Linked to Job
5. Get Invoice Lines
6. Update Invoice

**Apps Involved:** Webhook Triggers, Airtable, accounting software

**Inefficiencies to Fix in Posts:**
- Custom code could be replaced with native actions

### 43. Void Invoice

**Journey Stage:** Invoicing

**Source:** boolean-accounting-system-export.yml

**Description:** Void Invoice: Get Invoice, Get Invoice By Id, Update Doc Number Payload, ...

**Key Steps:**
1. Get Invoice
2. Get Invoice By Id
3. Update Doc Number
4. Void Invoice

**Apps Involved:** Webhook Triggers, Airtable, accounting software

### 44. Initial Sync QB Bills

**Journey Stage:** Expense Management

**Source:** boolean-accounting-system-export.yml

**Description:** Initial Sync QB Bills: Current Time, Stopwatch Time, Expenses Sync enabled?, ...

**Key Steps:**
1. Instance Deploy - QB Expenses
2. Current Time
3. Stopwatch Time
4. Set Start Position
5. Calculated Date
6. Format Date/Time
7. Loop N Times
8. Get Progress
9. Stop Execution 2
10. Upsert Expense Record

**Apps Involved:** Management Triggers, Datetime, Persist Data, Stop Execution, Airtable

**Inefficiencies to Fix in Posts:**
- Complex flow could be simplified (15+ steps)
- Custom code could be replaced with native actions

### 45. Save Expense's Attachments in Airtable

**Journey Stage:** Expense Management

**Source:** boolean-accounting-system-export.yml

**Description:** Early version of a subflow to upload attachments from accounting software expenses to drive.

**Key Steps:**
1. Get Attachables
2. Get Attachables URLs
3. Update Record
4. Sleep
5. Stop Execution (Success)

**Apps Involved:** accounting software, Persist Data, Airtable, Sleep, Stop Execution

### 46. Sync Payment

**Journey Stage:** Expense Management

**Source:** boolean-accounting-system-export.yml

**Description:** Sync Payment: Check Operation

**Apps Involved:** 

### 47. Sync accounting software Customer

**Journey Stage:** Expense Management

**Source:** boolean-accounting-system-export.yml

**Description:** Sync accounting software Customer: Is this a Job or Project?, Customer Payload, Update Parent Customer

**Key Steps:**
1. Customer Payload
2. Update Parent Customer

**Apps Involved:** accounting software

### 48. Sync Vendors accounting software -> AT

**Journey Stage:** Expense Management

**Source:** boolean-accounting-system-export.yml

**Description:** Fetch Vendors from accounting software and sync in AT

**Key Steps:**
1. Execution - Save Value
2. Loop N Times

**Apps Involved:** Webhook Triggers, Persist Data

### 49. Upsert accounting software Parent Customer Linked to Jobs

**Journey Stage:** Expense Management

**Source:** boolean-accounting-system-export.yml

**Description:** Upsert accounting software Parent Customer Linked to Jobs

**Key Steps:**
1. List Jobs

**Apps Involved:** Schedule Triggers, Airtable

### 50. Upsert accounting software Sub Customer Linked to Projects

**Journey Stage:** Expense Management

**Source:** boolean-accounting-system-export.yml

**Description:** Upsert accounting software Sub Customer Linked to Projects

**Key Steps:**
1. List Projects

**Apps Involved:** Schedule Triggers, Airtable

### 51. On deploy

**Journey Stage:** Reporting

**Source:** sales-and-marketing-reporting-export.yml

**Description:** On deploy: Get Config Variables, Stop Execution

**Key Steps:**
1. On deploy
2. Stop Execution

**Apps Involved:** Management Triggers, Stop Execution

### 52. Sync every 2 minutes

**Journey Stage:** Reporting

**Source:** sales-and-marketing-reporting-export.yml

**Description:** Sync every 2 minutes: Get Config Variables, Adjust Date/Time, Time 2 Minutes Ago to Epoch, ...

**Key Steps:**
1. Scheduled
2. Adjust Date/Time
3. Time 2 Minutes Ago to Epoch
4. Stop Execution 2

**Apps Involved:** Schedule Triggers, Datetime, Stop Execution

**Inefficiencies to Fix in Posts:**
- Custom code could be replaced with native actions

### 53. - Message Transpiler

**Journey Stage:** Uncategorized

**Source:** boolean-marketing-integration-export.yml

**Description:** - Message Transpiler: Get latest open deal, Get YCBM Link, Get Short Link

**Key Steps:**
1. Get latest open deal
2. Get Short Link

**Apps Involved:** Http

### 54. Appointment Cancelled

**Journey Stage:** Uncategorized

**Source:** boolean-marketing-integration-export.yml

**Description:** Triggers when an appointment is cancelled then update the deal and calendar

**Key Steps:**
1. Search

**Apps Involved:** Webhook Triggers, HubSpot

### 55. Auto Reply Business Hours

**Journey Stage:** Uncategorized

**Source:** boolean-marketing-integration-export.yml

**Description:** Auto Reply Business Hours

**Apps Involved:** 

### 56. Company Sync

**Journey Stage:** Uncategorized

**Source:** job-management-integration-export.yml

**Description:** Sync Companies between HubSpot and Airtable

**Key Steps:**
1. Cron

**Apps Involved:** Schedule Triggers

### 57. Contact Sync

**Journey Stage:** Uncategorized

**Source:** job-management-integration-export.yml

**Description:** Sync Contacts between HubSpot and Airtable

**Key Steps:**
1. Cron

**Apps Involved:** Schedule Triggers

### 58. Create Available Event Calendar

**Journey Stage:** Uncategorized

**Source:** gmail-and-ring-central-communicator-export.yml

**Description:** Create Available Event Calendar: Create Open Calendar

**Key Steps:**
1. Create Open Calendar

**Apps Involved:** Webhook Triggers, your calendar

### 59. Customer-Selected Project Type -> Project Type Conversion

**Journey Stage:** Uncategorized

**Source:** boolean-sales-integration-export.yml

**Description:** Customer-Selected Project Type -> Project Type Conversion: Branch on Value

**Apps Involved:** 

### 60. Error Notification Sender

**Journey Stage:** Uncategorized

**Source:** job-management-integration-export.yml, gmail-and-ring-central-communicator-export.yml

**Description:** Error Notification Sender: Error Payload, POST Request

**Key Steps:**
1. POST Request

**Apps Involved:** Http

**Cross-File Connections:**
- POST Request calls gmail-and-ring-central-communicator via Email Sender Webhook URL

### 61. Estimate Date Converter

**Journey Stage:** Uncategorized

**Source:** boolean-marketing-integration-export.yml

**Description:** Estimate Date Converter: Convert Date Estimate

**Apps Involved:** 

### 62. Fetch customers from accounting software

**Journey Stage:** Uncategorized

**Source:** boolean-accounting-system-export.yml

**Description:** Fetch customers from accounting software: Build Query, Start Index, Loop N Times

**Key Steps:**
1. Start Index
2. Loop N Times

**Apps Involved:** Webhook Triggers, Persist Data

### 63. Fetch Departments

**Journey Stage:** Uncategorized

**Source:** boolean-accounting-system-export.yml

**Description:** Fetch Departments: Stop Execution, Get Department

**Key Steps:**
1. Stop Execution
2. Get Department

**Apps Involved:** Webhook Triggers, Stop Execution, accounting software

### 64. Fetch Tax Codes

**Journey Stage:** Uncategorized

**Source:** boolean-accounting-system-export.yml

**Description:** Fetch Tax Codes: Fetch All TaxCodes, Loop Over TaxCodes

**Apps Involved:** Webhook Triggers, accounting software

### 65. your email Sender

**Journey Stage:** Uncategorized

**Source:** gmail-and-ring-central-communicator-export.yml

**Description:** your email Sender: Get User Info, String or JSON Checker, Generate Receiver Info, ...

**Key Steps:**
1. Send Message

**Apps Involved:** Webhook Triggers, your email

**Inefficiencies to Fix in Posts:**
- Custom code could be replaced with native actions

### 66. Grab Items/Classes from QB

**Journey Stage:** Uncategorized

**Source:** boolean-accounting-system-export.yml

**Description:** Grab Items/Classes from QB: Loop Over Existing Accounts, Create List, Filtered List, ...

**Key Steps:**
1. Loop Over Existing Accounts
2. Create List
3. Filtered List
4. Get Items
5. Get Classes

**Apps Involved:** Schedule Triggers, Collection Tools, accounting software

### 67. Hubspot mapper to file field

**Journey Stage:** Uncategorized

**Source:** job-management-integration-export.yml

**Description:** Maps file field and sync the file between HS to AT

**Key Steps:**
1. Get Deal Properties
2. Get Deal

**Apps Involved:** HubSpot

### 68. Hubspot SMS Sent Logger

**Journey Stage:** Uncategorized

**Source:** boolean-sales-integration-export.yml

**Description:** Hubspot SMS Sent Logger: Hubspot Phone Formatter, Hubspot Phone Formatter From, Get Contact, ...

**Key Steps:**
1. HTTP
2. Get Contact

**Apps Involved:** Webhook Triggers

### 69. Manual Update accounting software Customer Status

**Journey Stage:** Uncategorized

**Source:** boolean-accounting-system-export.yml

**Description:** Manual Update accounting software Customer Status: List Records

**Key Steps:**
1. List Records

**Apps Involved:** Webhook Triggers, Airtable

### 70. estimating tool All Data Sync to HubSpot

**Journey Stage:** Uncategorized

**Source:** boolean-sales-integration-export.yml

**Description:** estimating tool All Data Sync to HubSpot: Get All Owners, Get Project Types, Get All Companies, ...

**Key Steps:**
1. HTTP
2. Stop Execution
3. List Deals
4. List Contacts
5. Stop Execution

**Apps Involved:** Recursive Flow, Stop Execution, HubSpot

**Inefficiencies to Fix in Posts:**
- Complex flow could be simplified (15+ steps)
- Custom code could be replaced with native actions

### 71. estimating tool Default Identifier

**Journey Stage:** Uncategorized

**Source:** boolean-sales-integration-export.yml

**Description:** estimating tool Default Identifier: Convert To String, Deal ID Value Branch, Get Deal Properties, ...

**Key Steps:**
1. Http
2. Convert To String
3. Get Deal Properties
4. Get Contact Properties
5. Get Company Properties
6. Get Deal
7. Get Associated Contact
8. Get Associated Company
9. Get Contact
10. Get Company

**Apps Involved:** Webhook Triggers, Change Data Format, HubSpot

**Inefficiencies to Fix in Posts:**
- Repetitive hubspot API calls could be batched (8 calls)

### 72. accounting software Transactions

**Journey Stage:** Uncategorized

**Source:** boolean-accounting-system-export.yml

**Description:** accounting software Transactions: Adjust Date/Time, Format Date/Time, Get All Payment Methods, ...

**Key Steps:**
1. Adjust Date/Time
2. Format Date/Time
3. Get All Payment Methods
4. Get Sales Receipts
5. Get Payments

**Apps Involved:** Schedule Triggers, Datetime, accounting software

### 73. RC Text Sender

**Journey Stage:** Uncategorized

**Source:** gmail-and-ring-central-communicator-export.yml

**Description:** RC Text Sender: Json Format Checker

**Apps Involved:** Webhook Triggers

### 74. Register HS Users

**Journey Stage:** Uncategorized

**Source:** job-management-integration-export.yml

**Description:** Update People table in PaintOS with HubSpot active users.

**Key Steps:**
1. Get Owner
2. HS Owner x People Table

**Apps Involved:** Management Triggers, HubSpot, Airtable

### 75. TNT Contact Flow

**Journey Stage:** Uncategorized

**Source:** boolean-sales-integration-export.yml

**Description:** TNT Contact Flow: Update TNT Contact

**Apps Involved:** Webhook Triggers

### 76. Update Estimate Calendar

**Journey Stage:** Uncategorized

**Source:** gmail-and-ring-central-communicator-export.yml

**Description:** Update Estimate Calendar: Start UTC, End UTC, Search Event

**Key Steps:**
1. Start UTC
2. End UTC

**Apps Involved:** Webhook Triggers, Datetime

