/*
 * SALON MANAGER PRO - Modularized v4
 * Features: Tax, Tips, PDF Receipts, Inventory Locking, & Drive Organization.
 */

function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('Salon Pro')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getUserEmail() { 
  return Session.getActiveUser().getEmail(); 
}

// --- PROCESSING SALE (WITH LOCK & SAFETY) ---
function processSale(data) {
  const lock = LockService.getScriptLock();
  // 1. SAFETY: Wait 5 seconds for other users to finish
  if (!lock.tryLock(5000)) throw "System busy, please try again.";

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sales = ss.getSheetByName('Sales');
    const inv = ss.getSheetByName('Inventory');
    const clients = ss.getSheetByName('Clients');
    
    // Calculate totals
    const subtotal = data.price * data.qty;
    const taxAmt = subtotal * (data.taxRate / 100);
    const total = subtotal + data.tip + taxAmt;
    
    // 2. RECORD SALE
    sales.appendRow([
      new Date(), data.client, data.phone, data.type, 
      data.item, data.qty, data.price, data.tip, 
      data.taxRate, taxAmt, total, data.pay, 'No'
    ]);
    
    // 3. UPDATE INVENTORY (Real-time)
    if (data.type === 'Product') {
      const items = inv.getDataRange().getValues();
      let found = false;
      for (let i = 1; i < items.length; i++) {
        if (items[i][0].toString().toLowerCase() === data.item.toLowerCase()) {
          const currentQty = Number(items[i][1]);
          inv.getRange(i + 1, 2).setValue(currentQty - data.qty);
          inv.getRange(i + 1, 3).setValue(new Date());
          found = true;
          break;
        }
      }
      if (!found) inv.appendRow([data.item, -data.qty, new Date()]);
    }
    
    // 4. UPDATE CRM
    const clientData = clients.getDataRange().getValues();
    let clientFound = false;
    for (let i = 1; i < clientData.length; i++) {
      if (clientData[i][0].toString().toLowerCase() === data.client.toLowerCase()) {
        const currentSpent = Number(clientData[i][3]);
        const visits = Number(clientData[i][5]);
        clients.getRange(i + 1, 4).setValue(currentSpent + total);
        clients.getRange(i + 1, 5).setValue(new Date());
        clients.getRange(i + 1, 6).setValue(visits + 1);
        clientFound = true;
        break;
      }
    }
    if (!clientFound) clients.appendRow([data.client, data.phone, '', total, new Date(), 1]);
    
    // 5. GENERATE PDF RECEIPT
    createReceiptPDF(data, total, taxAmt);
    
  } catch (e) {
    throw e;
  } finally {
    lock.releaseLock();
  }
}

function createReceiptPDF(data, total, taxAmt) {
  try {
    const root = DriveApp.getRootFolder();
    // Organize into folder
    let folder = root.getFoldersByName('Salon Accounting System');
    if (folder.hasNext()) folder = folder.next();
    else folder = root.createFolder('Salon Accounting System');
    
    let receiptFolder = folder.getFoldersByName('Receipts');
    if (receiptFolder.hasNext()) receiptFolder = receiptFolder.next();
    else receiptFolder = folder.createFolder('Receipts');

    // Create Temp Doc
    const doc = DocumentApp.create('Receipt_' + new Date().getTime());
    const body = doc.getBody();
    body.appendParagraph('SALON RECEIPT').setHeading(DocumentApp.ParagraphHeading.HEADING1).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    body.appendParagraph(`Date: ${new Date().toLocaleString()}`);
    body.appendParagraph(`Client: ${data.client}`);
    body.appendParagraph('--------------------------------');
    body.appendParagraph(`Item: ${data.item} (x${data.qty})`);
    body.appendParagraph(`Price: $${data.price.toFixed(2)}`);
    body.appendParagraph(`Tax: $${taxAmt.toFixed(2)}`);
    body.appendParagraph(`Tip: $${data.tip.toFixed(2)}`);
    body.appendParagraph(`TOTAL: $${total.toFixed(2)}`).setBold(true);
    body.appendParagraph(`Paid via: ${data.pay}`);
    body.appendParagraph('--------------------------------');
    body.appendParagraph('Thank you for your business!').setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    doc.saveAndClose();
    
    // Convert to PDF and move
    const pdf = DriveApp.getFileById(doc.getId()).getAs('application/pdf');
    pdf.setName(`Receipt_${data.client}_${new Date().toISOString().slice(0,10)}.pdf`);
    receiptFolder.createFile(pdf);
    
    // Delete Temp Doc
    DriveApp.getFileById(doc.getId()).setTrashed(true);
    
  } catch(e) {
    console.log("Receipt Error: " + e); // Non-blocking error
  }
}

// --- HELPERS ---
function getTodayStats() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sales = ss.getSheetByName('Sales');
  if (!sales) return {rev: "0.00", clients: 0};
  
  const data = sales.getDataRange().getValues();
  let rev = 0, clients = 0;
  const today = new Date().toDateString();
  
  for (let i = 1; i < data.length; i++) {
    if (new Date(data[i][0]).toDateString() === today) {
      rev += Number(data[i][10]); // Column K (Total)
      clients++;
    }
  }
  return {rev: rev.toFixed(2), clients: clients};
}

function adjustStock(item, qty) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) throw "System busy.";
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Inventory');
    const data = sheet.getDataRange().getValues();
    let found = false;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0].toString().toLowerCase() === item.toLowerCase()) {
        const current = Number(data[i][1]);
        sheet.getRange(i + 1, 2).setValue(current + Number(qty));
        sheet.getRange(i + 1, 3).setValue(new Date());
        found = true;
        break;
      }
    }
    if (!found) sheet.appendRow([item, qty, new Date()]);
  } finally {
    lock.releaseLock();
  }
}

function getInventory() { 
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Inventory').getDataRange().getValues().slice(1); 
}

function getClients() { 
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Clients').getDataRange().getValues().slice(1); 
}

function bookAppt(d, t, n, s) { 
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Appointments').appendRow([d, t, n, s]); 
}

function getAppts() { 
  const data = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Appointments').getDataRange().getValues();
  return data.length > 1 ? data.slice(1) : [];
}

// --- SETUP ---
function setupSystem() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const sheets = {
    'Sales': ['Date','Client','Phone','Type','Item','Qty','Price','Tip','TaxRate','Tax','Total','Payment','InvGen'],
    'Inventory': ['Item','Qty','LastUpdated'],
    'Expenses': ['Date','Description','Amount'],
    'Clients': ['Name','Phone','Notes','TotalSpent','LastVisit','Visits'],
    'Appointments': ['Date','Time','Client','Service'],
    'Settings': ['Key','Value']
  };
  
  for (let name in sheets) {
    if (!ss.getSheetByName(name)) {
      let s = ss.insertSheet(name);
      s.appendRow(sheets[name]);
      s.getRange('1:1').setFontWeight('bold').setBackground('#764ba2').setFontColor('white');
    }
  }
  
  // Create Folders
  const root = DriveApp.getRootFolder();
  if(!root.getFoldersByName('Salon Accounting System').hasNext()) {
    root.createFolder('Salon Accounting System').createFolder('Receipts');
  }

  ui.alert('Setup Complete! You can now Deploy the Web App.');
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Salon Pro')
    .addItem('Run Setup', 'setupSystem')
    .addToUi();
}


