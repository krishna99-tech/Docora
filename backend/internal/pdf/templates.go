package pdf

const ReceiptTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #111111;
    background: #ffffff;
    font-size: 13px;
    line-height: 1.5;
    padding: 32px;
  }
  .receipt-container {
    max-width: 800px;
    margin: 0 auto;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2px solid #111111;
    padding-bottom: 20px;
    margin-bottom: 24px;
  }
  .business-info h1 {
    font-size: 24px;
    font-weight: 800;
    letter-spacing: -0.5px;
    margin-bottom: 4px;
  }
  .business-info p {
    color: #444444;
    font-size: 12px;
  }
  .receipt-meta {
    text-align: right;
  }
  .receipt-badge {
    display: inline-block;
    background: #111111;
    color: #ffffff;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    padding: 4px 10px;
    border-radius: 4px;
    margin-bottom: 8px;
  }
  .receipt-number {
    font-size: 18px;
    font-weight: 700;
    color: #111111;
  }
  .receipt-date {
    font-size: 12px;
    color: #666666;
  }
  .status-badge {
    display: inline-block;
    border: 1px solid #111111;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    padding: 2px 8px;
    border-radius: 3px;
    margin-top: 4px;
  }
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 28px;
  }
  .info-box {
    background: #f9f9f9;
    border: 1px solid #e5e5e5;
    border-radius: 6px;
    padding: 14px 16px;
  }
  .info-box h3 {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: #666666;
    margin-bottom: 6px;
  }
  .info-box p {
    font-weight: 600;
    color: #111111;
  }
  .info-box .subtext {
    font-weight: normal;
    color: #555555;
    font-size: 12px;
    margin-top: 2px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 24px;
  }
  th {
    background: #111111;
    color: #ffffff;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    text-align: left;
    padding: 10px 12px;
  }
  th.text-right, td.text-right {
    text-align: right;
  }
  th.text-center, td.text-center {
    text-align: center;
  }
  td {
    padding: 10px 12px;
    border-bottom: 1px solid #eeeeee;
    font-size: 12px;
  }
  tr:nth-child(even) td {
    background: #fafafa;
  }
  .summary-section {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 28px;
  }
  .summary-table {
    width: 320px;
  }
  .summary-row {
    display: flex;
    justify-content: space-between;
    padding: 6px 0;
    font-size: 12px;
    color: #444444;
  }
  .summary-row.total-row {
    border-top: 2px solid #111111;
    border-bottom: 2px solid #111111;
    margin-top: 6px;
    padding: 10px 0;
    font-size: 16px;
    font-weight: 800;
    color: #111111;
  }
  .summary-row.paid-row {
    color: #111111;
    font-weight: 600;
    padding-top: 8px;
  }
  .summary-row.balance-row {
    font-weight: 700;
    color: #111111;
  }
  .notes-section {
    border-top: 1px solid #e5e5e5;
    padding-top: 16px;
    margin-bottom: 24px;
  }
  .notes-title {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 700;
    margin-bottom: 4px;
  }
  .notes-content {
    font-size: 12px;
    color: #555555;
    white-space: pre-wrap;
  }
  .footer {
    text-align: center;
    border-top: 1px solid #e5e5e5;
    padding-top: 16px;
    color: #888888;
    font-size: 11px;
  }
</style>
</head>
<body>
<div class="receipt-container">
  <div class="header">
    <div class="business-info">
      <h1>{{if .BusinessProfile.BusinessName}}{{.BusinessProfile.BusinessName}}{{else}}Official Receipt{{end}}</h1>
      {{if .BusinessProfile.Address}}<p>{{.BusinessProfile.Address}}</p>{{end}}
      {{if .BusinessProfile.Phone}}<p>Phone: {{.BusinessProfile.Phone}}</p>{{end}}
      {{if .BusinessProfile.TaxRegistrationNumber}}<p>Tax ID: {{.BusinessProfile.TaxRegistrationNumber}}</p>{{end}}
    </div>
    <div class="receipt-meta">
      <div class="receipt-badge">RECEIPT</div>
      <div class="receipt-number">#{{.Document.DocumentNumber}}</div>
      <div class="receipt-date">Date: {{formatDate .Document.IssueDate}}</div>
      <div><span class="status-badge">{{upper .Document.Status}}</span></div>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-box">
      <h3>Billed To</h3>
      {{if .Customer}}
        <p>{{.Customer.Name}}</p>
        {{if .Customer.Email}}<p class="subtext">{{.Customer.Email}}</p>{{end}}
        {{if .Customer.Phone}}<p class="subtext">{{.Customer.Phone}}</p>{{end}}
        {{if .Customer.Address}}<p class="subtext">{{.Customer.Address}}</p>{{end}}
      {{else}}
        <p>Walk-in Customer</p>
      {{end}}
    </div>
    <div class="info-box">
      <h3>Payment Details</h3>
      <p>Method: {{if .Document.PaymentMethod}}{{.Document.PaymentMethod}}{{else}}Standard Payment{{end}}</p>
      {{if .Document.PaymentReference}}<p class="subtext">Ref: {{.Document.PaymentReference}}</p>{{end}}
      <p class="subtext">Currency: {{.Document.Currency}}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 45%;">Item & Description</th>
        <th class="text-center" style="width: 15%;">Qty</th>
        <th class="text-right" style="width: 20%;">Unit Price</th>
        <th class="text-right" style="width: 20%;">Total</th>
      </tr>
    </thead>
    <tbody>
      {{range .Document.Items}}
      <tr>
        <td>
          <strong>{{.Description}}</strong>
          {{if gt .TaxRate 0.0}}<div style="font-size:11px;color:#777;">Tax: {{formatTax .TaxRate}}</div>{{end}}
        </td>
        <td class="text-center">{{formatFloat .Quantity}}</td>
        <td class="text-right">{{formatMoney .UnitPriceMinor $.Document.Currency}}</td>
        <td class="text-right">{{formatMoney .LineTotalMinor $.Document.Currency}}</td>
      </tr>
      {{end}}
    </tbody>
  </table>

  <div class="summary-section">
    <div class="summary-table">
      <div class="summary-row">
        <span>Subtotal</span>
        <span>{{formatMoney .Document.SubtotalMinor .Document.Currency}}</span>
      </div>
      {{if gt .Document.DiscountMinor 0}}
      <div class="summary-row">
        <span>Discount</span>
        <span>-{{formatMoney .Document.DiscountMinor .Document.Currency}}</span>
      </div>
      {{end}}
      {{if gt .Document.TaxMinor 0}}
      <div class="summary-row">
        <span>Tax</span>
        <span>{{formatMoney .Document.TaxMinor .Document.Currency}}</span>
      </div>
      {{end}}
      <div class="summary-row total-row">
        <span>Total</span>
        <span>{{formatMoney .Document.TotalMinor .Document.Currency}}</span>
      </div>
      <div class="summary-row paid-row">
        <span>Amount Paid</span>
        <span>{{formatMoney .Document.AmountPaidMinor .Document.Currency}}</span>
      </div>
      <div class="summary-row balance-row">
        <span>Balance Due</span>
        <span>{{formatMoney .Document.BalanceMinor .Document.Currency}}</span>
      </div>
    </div>
  </div>

  {{if .Document.Notes}}
  <div class="notes-section">
    <div class="notes-title">Notes</div>
    <div class="notes-content">{{.Document.Notes}}</div>
  </div>
  {{end}}

  {{if .Document.Terms}}
  <div class="notes-section">
    <div class="notes-title">Terms & Conditions</div>
    <div class="notes-content">{{.Document.Terms}}</div>
  </div>
  {{end}}

  <div class="footer">
    <p>Thank you for your business! This is an official computer-generated document.</p>
  </div>
</div>
</body>
</html>`

const InvoiceTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #111111;
    background: #ffffff;
    font-size: 13px;
    line-height: 1.5;
    padding: 36px;
  }
  .invoice-container {
    max-width: 820px;
    margin: 0 auto;
  }
  .top-banner {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 24px;
    border-bottom: 3px solid #111111;
    margin-bottom: 24px;
  }
  .brand-title {
    font-size: 28px;
    font-weight: 900;
    letter-spacing: -0.5px;
  }
  .brand-details {
    margin-top: 4px;
    color: #555555;
    font-size: 12px;
  }
  .invoice-header-right {
    text-align: right;
  }
  .invoice-label {
    font-size: 28px;
    font-weight: 900;
    letter-spacing: 1px;
    color: #111111;
  }
  .invoice-number {
    font-size: 15px;
    font-weight: 700;
    color: #444444;
    margin-top: 2px;
  }
  .meta-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    background: #f7f7f7;
    border: 1px solid #e5e5e5;
    border-radius: 6px;
    padding: 12px 16px;
    margin-bottom: 24px;
  }
  .meta-col {
    display: flex;
    flex-direction: column;
  }
  .meta-col .label {
    font-size: 10px;
    text-transform: uppercase;
    font-weight: 700;
    color: #777777;
    letter-spacing: 0.5px;
  }
  .meta-col .value {
    font-size: 13px;
    font-weight: 600;
    color: #111111;
    margin-top: 2px;
  }
  .parties-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 28px;
  }
  .party-card {
    border: 1px solid #e5e5e5;
    border-radius: 6px;
    padding: 16px;
  }
  .party-card h3 {
    font-size: 11px;
    text-transform: uppercase;
    font-weight: 700;
    letter-spacing: 0.8px;
    color: #777777;
    margin-bottom: 8px;
    border-bottom: 1px solid #eeeeee;
    padding-bottom: 4px;
  }
  .party-name {
    font-size: 15px;
    font-weight: 700;
    color: #111111;
  }
  .party-detail {
    font-size: 12px;
    color: #555555;
    margin-top: 2px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 24px;
  }
  th {
    background: #111111;
    color: #ffffff;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 10px 12px;
    text-align: left;
  }
  th.text-right, td.text-right {
    text-align: right;
  }
  th.text-center, td.text-center {
    text-align: center;
  }
  td {
    padding: 12px;
    border-bottom: 1px solid #e5e5e5;
    font-size: 13px;
  }
  .summary-wrap {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 28px;
  }
  .summary-box {
    width: 340px;
    background: #fafafa;
    border: 1px solid #e5e5e5;
    border-radius: 6px;
    padding: 16px;
  }
  .summary-line {
    display: flex;
    justify-content: space-between;
    padding: 5px 0;
    font-size: 13px;
    color: #555555;
  }
  .summary-line.total {
    border-top: 2px solid #111111;
    margin-top: 8px;
    padding-top: 10px;
    font-size: 17px;
    font-weight: 800;
    color: #111111;
  }
  .summary-line.balance {
    font-weight: 800;
    color: #111111;
    font-size: 14px;
    border-top: 1px dashed #cccccc;
    margin-top: 6px;
    padding-top: 8px;
  }
  .section-block {
    margin-bottom: 20px;
    border-left: 3px solid #111111;
    padding-left: 12px;
  }
  .section-block h4 {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #777777;
    margin-bottom: 4px;
  }
  .section-block p {
    font-size: 12px;
    color: #444444;
    white-space: pre-wrap;
  }
  .footer {
    border-top: 1px solid #e5e5e5;
    padding-top: 20px;
    text-align: center;
    font-size: 11px;
    color: #888888;
  }
</style>
</head>
<body>
<div class="invoice-container">
  <div class="top-banner">
    <div>
      <div class="brand-title">{{if .BusinessProfile.BusinessName}}{{.BusinessProfile.BusinessName}}{{else}}INVOICE{{end}}</div>
      <div class="brand-details">
        {{if .BusinessProfile.Address}}<div>{{.BusinessProfile.Address}}</div>{{end}}
        {{if .BusinessProfile.Phone}}<div>Phone: {{.BusinessProfile.Phone}}</div>{{end}}
        {{if .BusinessProfile.TaxRegistrationNumber}}<div>Tax ID: {{.BusinessProfile.TaxRegistrationNumber}}</div>{{end}}
      </div>
    </div>
    <div class="invoice-header-right">
      <div class="invoice-label">INVOICE</div>
      <div class="invoice-number">#{{.Document.DocumentNumber}}</div>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-col">
      <span class="label">Issue Date</span>
      <span class="value">{{formatDate .Document.IssueDate}}</span>
    </div>
    <div class="meta-col">
      <span class="label">Due Date</span>
      <span class="value">{{if .Document.DueDate}}{{formatDate .Document.DueDate}}{{else}}Due on Receipt{{end}}</span>
    </div>
    <div class="meta-col">
      <span class="label">Status</span>
      <span class="value">{{upper .Document.Status}}</span>
    </div>
    <div class="meta-col">
      <span class="label">Currency</span>
      <span class="value">{{.Document.Currency}}</span>
    </div>
  </div>

  <div class="parties-grid">
    <div class="party-card">
      <h3>From</h3>
      <div class="party-name">{{if .BusinessProfile.BusinessName}}{{.BusinessProfile.BusinessName}}{{else}}Issuer{{end}}</div>
      {{if .BusinessProfile.Address}}<div class="party-detail">{{.BusinessProfile.Address}}</div>{{end}}
      {{if .BusinessProfile.Phone}}<div class="party-detail">{{.BusinessProfile.Phone}}</div>{{end}}
    </div>
    <div class="party-card">
      <h3>Bill To</h3>
      {{if .Customer}}
        <div class="party-name">{{.Customer.Name}}</div>
        {{if .Customer.Email}}<div class="party-detail">{{.Customer.Email}}</div>{{end}}
        {{if .Customer.Phone}}<div class="party-detail">{{.Customer.Phone}}</div>{{end}}
        {{if .Customer.Address}}<div class="party-detail">{{.Customer.Address}}</div>{{end}}
      {{else}}
        <div class="party-name">Customer Not Specified</div>
      {{end}}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 45%;">Description</th>
        <th class="text-center" style="width: 15%;">Quantity</th>
        <th class="text-right" style="width: 20%;">Unit Price</th>
        <th class="text-right" style="width: 20%;">Amount</th>
      </tr>
    </thead>
    <tbody>
      {{range .Document.Items}}
      <tr>
        <td>
          <strong>{{.Description}}</strong>
          {{if gt .TaxRate 0.0}}<div style="font-size:11px;color:#777;">Tax: {{formatTax .TaxRate}}</div>{{end}}
        </td>
        <td class="text-center">{{formatFloat .Quantity}}</td>
        <td class="text-right">{{formatMoney .UnitPriceMinor $.Document.Currency}}</td>
        <td class="text-right">{{formatMoney .LineTotalMinor $.Document.Currency}}</td>
      </tr>
      {{end}}
    </tbody>
  </table>

  <div class="summary-wrap">
    <div class="summary-box">
      <div class="summary-line">
        <span>Subtotal</span>
        <span>{{formatMoney .Document.SubtotalMinor .Document.Currency}}</span>
      </div>
      {{if gt .Document.DiscountMinor 0}}
      <div class="summary-line">
        <span>Discount</span>
        <span>-{{formatMoney .Document.DiscountMinor .Document.Currency}}</span>
      </div>
      {{end}}
      {{if gt .Document.TaxMinor 0}}
      <div class="summary-line">
        <span>Tax</span>
        <span>{{formatMoney .Document.TaxMinor .Document.Currency}}</span>
      </div>
      {{end}}
      <div class="summary-line total">
        <span>Total Due</span>
        <span>{{formatMoney .Document.TotalMinor .Document.Currency}}</span>
      </div>
      <div class="summary-line">
        <span>Paid to Date</span>
        <span>{{formatMoney .Document.AmountPaidMinor .Document.Currency}}</span>
      </div>
      <div class="summary-line balance">
        <span>Remaining Balance</span>
        <span>{{formatMoney .Document.BalanceMinor .Document.Currency}}</span>
      </div>
    </div>
  </div>

  {{if .Document.PaymentMethod}}
  <div class="section-block">
    <h4>Payment Instructions</h4>
    <p>Method: {{.Document.PaymentMethod}} {{if .Document.PaymentReference}}| Ref: {{.Document.PaymentReference}}{{end}}</p>
  </div>
  {{end}}

  {{if .Document.Notes}}
  <div class="section-block">
    <h4>Notes</h4>
    <p>{{.Document.Notes}}</p>
  </div>
  {{end}}

  {{if .Document.Terms}}
  <div class="section-block">
    <h4>Terms</h4>
    <p>{{.Document.Terms}}</p>
  </div>
  {{end}}

  <div class="footer">
    <p>Please make payment before the due date. For inquiries, contact support.</p>
  </div>
</div>
</body>
</html>`

const GeneralDocumentTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #111111;
    background: #ffffff;
    font-size: 13px;
    line-height: 1.6;
    padding: 40px;
  }
  .doc-container {
    max-width: 820px;
    margin: 0 auto;
  }
  .doc-header {
    border-bottom: 2px solid #111111;
    padding-bottom: 20px;
    margin-bottom: 28px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .doc-title {
    font-size: 26px;
    font-weight: 800;
    color: #111111;
  }
  .doc-subtitle {
    font-size: 14px;
    color: #555555;
    margin-top: 4px;
  }
  .doc-meta {
    text-align: right;
    font-size: 12px;
    color: #666666;
  }
  .section {
    margin-bottom: 24px;
  }
  .heading {
    font-size: 18px;
    font-weight: 700;
    color: #111111;
    border-bottom: 1px solid #e5e5e5;
    padding-bottom: 6px;
    margin-bottom: 10px;
  }
  .paragraph {
    font-size: 13px;
    color: #333333;
    line-height: 1.7;
    white-space: pre-wrap;
  }
  table.custom-table {
    width: 100%;
    border-collapse: collapse;
    margin: 14px 0;
  }
  table.custom-table th {
    background: #111111;
    color: #ffffff;
    padding: 8px 12px;
    font-size: 12px;
    text-align: left;
  }
  table.custom-table td {
    padding: 8px 12px;
    border-bottom: 1px solid #e5e5e5;
    font-size: 12px;
  }
  .key-value-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    background: #f9f9f9;
    padding: 14px;
    border-radius: 6px;
    border: 1px solid #eeeeee;
  }
  .kv-item {
    font-size: 12px;
  }
  .kv-key {
    font-weight: 700;
    color: #555555;
  }
  .kv-val {
    color: #111111;
  }
  .divider {
    border-top: 1px solid #e5e5e5;
    margin: 20px 0;
  }
  .spacer {
    height: 24px;
  }
  .footer {
    border-top: 1px solid #e5e5e5;
    padding-top: 16px;
    margin-top: 40px;
    font-size: 11px;
    color: #888888;
    display: flex;
    justify-content: space-between;
  }
</style>
</head>
<body>
<div class="doc-container">
  <div class="doc-header">
    <div>
      <h1 class="doc-title">{{.Document.Title}}</h1>
      {{if .Document.Notes}}<div class="doc-subtitle">{{.Document.Notes}}</div>{{end}}
    </div>
    <div class="doc-meta">
      <div><strong>Doc ID:</strong> #{{.Document.DocumentNumber}}</div>
      <div><strong>Date:</strong> {{formatDate .Document.IssueDate}}</div>
      {{if .BusinessProfile.BusinessName}}<div><strong>Issuer:</strong> {{.BusinessProfile.BusinessName}}</div>{{end}}
    </div>
  </div>

  {{range .Sections}}
    {{if eq .Type "heading"}}
      <div class="section">
        <h2 class="heading">{{.Title}}</h2>
      </div>
    {{else if eq .Type "paragraph"}}
      <div class="section">
        <p class="paragraph">{{.Content}}</p>
      </div>
    {{else if eq .Type "table"}}
      <div class="section">
        <table class="custom-table">
          <thead>
            <tr>
              {{range .Headers}}
                <th>{{.}}</th>
              {{end}}
            </tr>
          </thead>
          <tbody>
            {{range .Rows}}
              <tr>
                {{range .}}
                  <td>{{.}}</td>
                {{end}}
              </tr>
            {{end}}
          </tbody>
        </table>
      </div>
    {{else if eq .Type "key_value"}}
      <div class="section">
        <div class="key-value-grid">
          {{range .Pairs}}
            <div class="kv-item">
              <span class="kv-key">{{.Key}}:</span>
              <span class="kv-val">{{.Value}}</span>
            </div>
          {{end}}
        </div>
      </div>
    {{else if eq .Type "divider"}}
      <div class="divider"></div>
    {{else if eq .Type "spacer"}}
      <div class="spacer"></div>
    {{end}}
  {{end}}

  <div class="footer">
    <span>Generated by Docora Platform</span>
    <span>Page 1 of 1</span>
  </div>
</div>
</body>
</html>`
