# Salon Accounting System

A comprehensive Google Sheets-based accounting system designed for a tanning salon. This system manages sales, expenses, inventory, and customers, and includes automated invoice generation and CRM features.

## Installation Instructions

### Step 1: Create the Spreadsheet
1. Go to [Google Sheets](https://sheets.google.com) and create a **New Spreadsheet**.
2. Give it a name, e.g., "Salon Master Sheet".

### Step 2: Install the Script
1. In the spreadsheet, go to **Extensions** > **Apps Script**.
2. This will open a new tab with a code editor.
3. Delete any code currently in the `Code.gs` file.
4. Copy the entire content of `Code.js` provided in this package and paste it into the editor.
5. Click the **Save** icon (floppy disk) or press `Ctrl + S`.
6. Name the project "SalonSystem" (or any name you prefer).

### Step 3: Authorize the Script
1. Reload your Google Sheet tab.
2. After a few seconds, you should see a new menu item appear at the top called **Salon Manager**.
3. Click **Salon Manager** > **1. Setup System (Run Once)**.
4. Google will ask for permission to run the script.
   - Click **Continue**.
   - Choose your Google Account.
   - You might see a warning "Google hasn't verified this app" (since you just created it). Click **Advanced** > **Go to SalonSystem (unsafe)**.
   - Click **Allow**.

---

## Getting Started

### 1. Run Setup
If you haven't already, click **Salon Manager** > **1. Setup System (Run Once)**.
This will:
- Create 5 tabs: **Sales, Expenses, Inventory, Customers, Tax P&L**.
- Create a folder in your Google Drive called `Salon Accounting System`.
- Create an invoice template inside that folder.

### 2. The Tabs (Dashboard)

#### **Tab A: Sales** (Cash Register)
- **Usage:** Enter every sale here.
- **Columns:**
  - **Date:** Date of the transaction.
  - **Client Name:** Must match the name in the Customers tab for CRM to work.
  - **Service:** What they bought (e.g., "Spray Tan", "Lotion").
  - **Price:** The amount paid.
  - **Invoice Generated?:** The system marks "Yes" here automatically when you generate an invoice.

#### **Tab B: Expenses** (Checkbook)
- **Usage:** Log all business costs here for tax purposes.
- **Columns:** Date, Category (Rent, Utilities, Stock), Amount, Description.

#### **Tab C: Inventory** (Stock Room)
- **Usage:** Track your physical assets.
- **Columns:** Item Name, Category, Quantity, Unit Value, Total Value (Calculated manually or via formula).

#### **Tab D: Customers** (CRM)
- **Usage:** Your client database.
- **Columns:**
  - **Client Name:** The unique identifier.
  - **Phone/Birthday:** Enter manually.
  - **Total Spent / Last Visit:** These are **automatically calculated** by the "Update CRM" function.

#### **Tab E: Tax P&L** (Scorecard)
- **Usage:** View your financial health.
- **Columns:** Shows Total Sales, Total Expenses, and Net Profit.
- **Note:** Formulas are set up to auto-calculate based on Sales and Expenses tabs.

---

## Features

### Generate Invoices
1. Go to the **Sales** tab.
2. Click on the row of the sale you want to invoice.
3. Click **Salon Manager** > **2. Generate Invoice from Active Row**.
4. The script will:
   - Create a Google Doc invoice in the `Generated Invoices` folder.
   - Fill in the Client, Service, Date, and Price.
   - Mark the row as "Yes" in the "Invoice Generated?" column.

### Update CRM
1. Click **Salon Manager** > **3. Update CRM Data**.
2. The script will:
   - Scan all sales history.
   - Calculate total money spent by each client.
   - Find the last date they visited.
   - Update the **Customers** tab with these stats.
   - Add new customers if they appear in Sales but not in Customers.

---

## Important Notes
- **Do not rename the tabs** (Sales, Expenses, Customers, etc.) or the script may stop working.
- **Google Drive:** Do not delete the `Salon Accounting System` folder or the `Master Invoice Template v2` inside it, as the script relies on them.



