// Shared receipt print utility — used by both FeeReceipt and ReceiptManagement.
// Any template change belongs here so both print paths stay identical.

export const RECEIPT_CSS = `
  .receipt {
    width: 490px;
    margin: 20px auto;
    background: #fff;
    border: 4px solid #25D366;
    padding: 8px;
    font-size: 12px;
    position: relative;
  }
  .center-name {
    width: 100%;
    margin: 5px auto 2px auto;
    background: #25D366;
    color: #fff;
    text-align: center;
    font-weight: bold;
    font-size: 16px;
    padding: 5px 0;
    border-radius: 10px;
    letter-spacing: 2px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
  .center-address {
    text-align: center;
    font-size: 13px;
    margin-bottom: 10px;
    color: #444;
  }
  .student {
    display: flex;
    justify-content: space-between;
  }
  .details {
    flex: 1;
    margin: 0 8px;
  }
  .row {
    margin-bottom: 3px;
  }
  .label {
    display: inline-block;
    width: 110px;
    font-weight: bold;
  }
  .fee-title {
    margin: 8px auto;
    width: 75%;
    background: #25D366;
    color: #fff;
    text-align: center;
    font-weight: bold;
    padding: 8px 0;
    border-radius: 30px;
    letter-spacing: 1px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
  .photo img {
    width: 90px;
    height: 90px;
    border: 1px solid #000;
    object-fit: cover;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;
    margin-top: 6px;
  }
  th, td {
    border: 1px solid #000;
    padding: 3px;
    text-align: center;
  }
  th {
    background: #eaeaea;
  }
  .footer {
    margin-top: 6px;
    font-size: 10px;
  }
`;

/**
 * Build the receipt HTML string from a data object.
 *
 * Required fields:  studentName, courseName, sessionStart, receiptNo,
 *                   monthlyPayments[], totalPaid, totalDue
 * Optional fields:  fatherName, dob, photo, paymentMethod, paymentDate
 */
export function buildReceiptHTML(data) {
  const {
    studentName   = 'N/A',
    fatherName    = null,
    dob           = null,
    photo         = null,
    courseName    = 'N/A',
    sessionStart  = '',
    receiptNo     = '',
    paymentMethod = null,
    paymentDate   = null,
    monthlyPayments = [],
    totalPaid     = 0,
    totalDue      = 0,
  } = data;

  const fmt = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    if (isNaN(dt)) return String(d);
    return dt.toLocaleDateString('en-GB').replace(/\//g, '-');
  };

  const monthRows = monthlyPayments.map(p => `
    <tr>
      <td>${p.month || ''}</td>
      <td>${p.date  || ''}</td>
      <td>${p.paid  ?? 0}</td>
      <td>${p.due   ?? 0}</td>
    </tr>`).join('');

  return `
    <div class="receipt">
      <div class="center-name">
        <hr style="margin:2px 0;opacity:0.5"/>
        SHREE GANPATI COMPUTER AND STUDY CENTRE
        <hr style="margin:2px 0;opacity:0.5"/>
      </div>
      <div class="center-address"><u>RAIPUR CHIRAIYAKOT MAU</u></div>

      <div class="student">
        ${photo ? `<div class="photo"><img src="${photo}" alt="Student"/></div>` : ''}
        <div class="details" style="flex:1">
          <div class="row"><span class="label">Student's Name</span>: ${studentName}</div>
          ${fatherName ? `<div class="row"><span class="label">Father's Name</span>: ${fatherName}</div>` : ''}
          ${dob        ? `<div class="row"><span class="label">Date of Birth</span>: ${fmt(dob)}</div>`    : ''}
          <div class="row"><span class="label">Course Name</span>: ${courseName}</div>
          <div class="row"><span class="label">Session Start</span>: ${fmt(sessionStart) || sessionStart}</div>
          <div class="row"><span class="label">Receipt No</span>: ${receiptNo}</div>
          ${paymentMethod ? `<div class="row"><span class="label">Payment Method</span>: ${paymentMethod}</div>` : ''}
          ${paymentDate   ? `<div class="row"><span class="label">Date</span>: ${fmt(paymentDate)}</div>`         : ''}
          <div class="fee-title">STUDENT'S FEE RECEIPT</div>
        </div>
      </div>

      <table>
        <thead>
          <tr><th>Month</th><th>Date</th><th>Paid</th><th>Due</th></tr>
        </thead>
        <tbody>
          ${monthRows}
          <tr><th>Total</th><th>-</th><th>${totalPaid}</th><th>${totalDue}</th></tr>
        </tbody>
      </table>

      <div class="footer">
        Received By: ............................................................ All fees are non-refundable
      </div>
    </div>`;
}

/** Open a print window, inject CSS into <head>, and trigger print. */
export function printReceiptWindow(data) {
  const html = buildReceiptHTML(data);
  const win  = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Fee Receipt</title>
  <style>
    ${RECEIPT_CSS}
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; }
  </style>
</head>
<body>${html}</body>
</html>`);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 500);
}
