/**
 * Utilidades para la impresión nativa en formato A4 de Facturas y Recibos
 */

const formatBoletaMoney = (val: number | string | null | undefined): string => {
  const amount = Number(val ?? 0);
  return new Intl.NumberFormat("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
};

export const imprimirFacturaA4 = (venta: any) => {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) return;

  const originalTotal = venta.items 
    ? venta.items.reduce((sum: number, it: any) => sum + (it.quantity * it.priceUnit), 0) 
    : venta.total;
  const descuento = venta.descuento || 0;
  
  const fechaFormateada = new Date(venta.date).toLocaleString("es-BO", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit"
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Comprobante de Venta - Nro ${venta.nroFactura || venta.id}</title>
      <style>
        @page {
          size: A4;
          margin: 15mm;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #333;
          margin: 0;
          padding: 0;
          font-size: 11px;
          line-height: 1.4;
        }
        .header {
          display: flex;
          justify-content: space-between;
          border-bottom: 2px solid #0095ff;
          padding-bottom: 12px;
          margin-bottom: 18px;
        }
        .logo-area h1 {
          margin: 0;
          font-size: 22px;
          color: #0095ff;
          font-weight: 800;
          letter-spacing: 0.5px;
        }
        .logo-area p {
          margin: 2px 0 0 0;
          color: #666;
          font-size: 9px;
        }
        .invoice-title {
          text-align: right;
        }
        .invoice-title h2 {
          margin: 0;
          font-size: 16px;
          color: #333;
        }
        .invoice-title p {
          margin: 4px 0 0 0;
          font-size: 10px;
          color: #555;
        }
        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 20px;
        }
        .section-title {
          font-size: 10px;
          text-transform: uppercase;
          color: #888;
          font-weight: bold;
          border-bottom: 1px solid #eee;
          padding-bottom: 3px;
          margin-bottom: 6px;
        }
        .details-col p {
          margin: 2px 0;
          font-size: 10px;
        }
        .details-col strong {
          color: #111;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 25px;
        }
        th {
          background-color: #f4f6f8;
          color: #444;
          text-align: left;
          padding: 6px 8px;
          font-size: 10px;
          text-transform: uppercase;
          border-bottom: 1px solid #ddd;
        }
        td {
          padding: 6px 8px;
          border-bottom: 1px solid #eee;
          font-size: 10px;
        }
        .text-right {
          text-align: right;
        }
        .totals-section {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 30px;
        }
        .totals-table {
          width: 220px;
          margin-bottom: 0;
        }
        .totals-table td {
          padding: 4px 8px;
          border-bottom: none;
        }
        .totals-table tr.grand-total td {
          border-top: 2px solid #0095ff;
          font-size: 13px;
          font-weight: bold;
          color: #0095ff;
          padding-top: 8px;
        }
        .signatures {
          margin-top: 50px;
          display: flex;
          justify-content: space-around;
        }
        .signature-line {
          text-align: center;
          width: 160px;
          border-top: 1px solid #999;
          padding-top: 4px;
          font-size: 9px;
          color: #666;
        }
        .footer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          text-align: center;
          font-size: 8px;
          color: #aaa;
          border-top: 1px solid #eee;
          padding-top: 4px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo-area">
          <h1>REPUESTOS LA PAZ</h1>
          <p>Venta de Repuestos Automotrices - La Paz, Bolivia</p>
          <p>Dirección: Av. Montes Nro 425, La Paz, Bolivia</p>
          <p>Teléfono: +591 2 2445566 | Nit: 1020304050</p>
        </div>
        <div class="invoice-title">
          <h2>COMPROBANTE DE VENTA</h2>
          <p><strong>Nro Factura:</strong> ${venta.nroFactura || `VT-${String(venta.id).padStart(6, '0')}`}</p>
          <p><strong>Fecha/Hora:</strong> ${fechaFormateada}</p>
          <p><strong>Método de Pago:</strong> ${venta.metodoPago}</p>
        </div>
      </div>

      <div class="details-grid">
        <div class="details-col">
          <div class="section-title">Datos del Cliente</div>
          <p><strong>Nombre/Razón:</strong> ${venta.clientName}</p>
          <p><strong>ID/NIT/CI:</strong> ${venta.clientNit || "Particular (S/N)"}</p>
        </div>
        <div class="details-col">
          <div class="section-title">Información Adicional</div>
          <p><strong>Atendido por:</strong> ${venta.sellerName || "Operador de Caja"}</p>
          <p><strong>Estado:</strong> ${venta.estado || "Completada"}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>OEM / Código</th>
            <th>Descripción del Repuesto</th>
            <th class="text-right">Cant.</th>
            <th class="text-right">P. Unit (Bs.)</th>
            <th class="text-right">Subtotal (Bs.)</th>
          </tr>
        </thead>
        <tbody>
          ${venta.items && venta.items.length > 0 ? venta.items.map((it: any) => `
            <tr>
              <td>${it.productOem}</td>
              <td>${it.productName}</td>
              <td class="text-right">${it.quantity}</td>
              <td class="text-right">${formatBoletaMoney(it.priceUnit)}</td>
              <td class="text-right">${formatBoletaMoney(it.subtotal)}</td>
            </tr>
          `).join('') : `
            <tr>
              <td colspan="5" style="text-align: center; color: #777;">Detalle no disponible (Consolidado de venta)</td>
            </tr>
          `}
        </tbody>
      </table>

      <div class="totals-section">
        <table class="totals-table">
          <tr>
            <td>Subtotal:</td>
            <td class="text-right">${formatBoletaMoney(originalTotal)} Bs.</td>
          </tr>
          ${descuento > 0 ? `
            <tr>
              <td>Descuento:</td>
              <td class="text-right">-${formatBoletaMoney(descuento)} Bs.</td>
            </tr>
          ` : ''}
          <tr class="grand-total">
            <td>TOTAL NETO:</td>
            <td class="text-right">${formatBoletaMoney(venta.total)} Bs.</td>
          </tr>
        </table>
      </div>

      ${venta.observaciones ? `
        <div style="margin-top: -10px; margin-bottom: 20px;">
          <div class="section-title">Observaciones</div>
          <p style="font-size: 9px; color: #555; font-style: italic; margin: 4px 0;">${venta.observaciones}</p>
        </div>
      ` : ''}

      <div class="signatures">
        <div class="signature-line">
          Firma Entregue Conforme<br>
          <strong>Cajero/Vendedor</strong>
        </div>
        <div class="signature-line">
          Firma Recibí Conforme<br>
          <strong>Cliente</strong>
        </div>
      </div>

      <div class="footer">
        Este documento es un comprobante interno de venta de repuestos. Agradecemos su preferencia.
      </div>
    </body>
    </html>
  `;

  doc.open();
  doc.write(html);
  doc.close();

  setTimeout(() => {
    if (iframe.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 350);
};

export const imprimirReciboA4 = (abono: any) => {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) return;

  const fechaFormateada = new Date(abono.fecha).toLocaleString("es-BO", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit"
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Recibo de Abono - Nro ${abono.id}</title>
      <style>
        @page {
          size: A4;
          margin: 15mm;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #333;
          margin: 0;
          padding: 0;
          font-size: 11px;
          line-height: 1.4;
        }
        .header {
          display: flex;
          justify-content: space-between;
          border-bottom: 2px solid #10b981; /* Green accent for financial abonos */
          padding-bottom: 12px;
          margin-bottom: 18px;
        }
        .logo-area h1 {
          margin: 0;
          font-size: 22px;
          color: #10b981;
          font-weight: 800;
          letter-spacing: 0.5px;
        }
        .logo-area p {
          margin: 2px 0 0 0;
          color: #666;
          font-size: 9px;
        }
        .invoice-title {
          text-align: right;
        }
        .invoice-title h2 {
          margin: 0;
          font-size: 16px;
          color: #333;
        }
        .invoice-title p {
          margin: 4px 0 0 0;
          font-size: 10px;
          color: #555;
        }
        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 20px;
        }
        .section-title {
          font-size: 10px;
          text-transform: uppercase;
          color: #888;
          font-weight: bold;
          border-bottom: 1px solid #eee;
          padding-bottom: 3px;
          margin-bottom: 6px;
        }
        .details-col p {
          margin: 2px 0;
          font-size: 10px;
        }
        .details-col strong {
          color: #111;
        }
        .amount-box {
          border: 1.5px dashed #10b981;
          background-color: #f0fdf4;
          border-radius: 8px;
          padding: 12px;
          margin: 20px 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .amount-val {
          font-size: 20px;
          font-weight: bold;
          color: #10b981;
        }
        .signatures {
          margin-top: 60px;
          display: flex;
          justify-content: space-around;
        }
        .signature-line {
          text-align: center;
          width: 160px;
          border-top: 1px solid #999;
          padding-top: 4px;
          font-size: 9px;
          color: #666;
        }
        .footer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          text-align: center;
          font-size: 8px;
          color: #aaa;
          border-top: 1px solid #eee;
          padding-top: 4px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo-area">
          <h1>REPUESTOS LA PAZ</h1>
          <p>Venta de Repuestos Automotrices - La Paz, Bolivia</p>
          <p>Dirección: Av. Montes Nro 425, La Paz, Bolivia</p>
          <p>Teléfono: +591 2 2445566 | Nit: 1020304050</p>
        </div>
        <div class="invoice-title">
          <h2>RECIBO DE ABONO</h2>
          <p><strong>Nro Transacción:</strong> REC-${String(abono.id).padStart(6, '0')}</p>
          <p><strong>Fecha/Hora:</strong> ${fechaFormateada}</p>
          <p><strong>Venta Ref:</strong> Venta Nro #${abono.ventaId}</p>
        </div>
      </div>

      <div class="details-grid">
        <div class="details-col">
          <div class="section-title">Datos del Cliente</div>
          <p><strong>Nombre/Razón:</strong> ${abono.clienteNombre || "Cliente General"}</p>
          <p><strong>ID Cliente:</strong> ${abono.clienteId || "N/A"}</p>
        </div>
        <div class="details-col">
          <div class="section-title">Detalles del Pago</div>
          <p><strong>Método de Pago:</strong> ${abono.metodoPago}</p>
          <p><strong>Comprobante Ref:</strong> ${abono.comprobante || "Sin Comprobante (Caja)"}</p>
        </div>
      </div>

      <div class="amount-box">
        <div>
          <span style="font-size: 9px; text-transform: uppercase; color: #888; font-weight: bold; display: block;">Monto Abonado</span>
          <span style="font-size: 11px; color: #555;">Por concepto de amortización de deuda comercial.</span>
        </div>
        <div class="amount-val">
          ${formatBoletaMoney(abono.monto)} Bs.
        </div>
      </div>

      ${abono.notas ? `
        <div style="margin-bottom: 30px;">
          <div class="section-title">Notas / Comentarios</div>
          <p style="font-size: 9px; color: #555; font-style: italic; margin: 4px 0;">${abono.notas}</p>
        </div>
      ` : ''}

      <div class="signatures" style="margin-top: 80px;">
        <div class="signature-line">
          Firma Cajero/Operador<br>
          <strong>Caja General</strong>
        </div>
        <div class="signature-line">
          Firma Titular del Crédito<br>
          <strong>Cliente</strong>
        </div>
      </div>

      <div class="footer">
        Este documento certifica el ingreso de fondos para la amortización del crédito comercial otorgado.
      </div>
    </body>
    </html>
  `;

  doc.open();
  doc.write(html);
  doc.close();

  setTimeout(() => {
    if (iframe.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 350);
};

export const imprimirReporteA4 = (
  titulo: string,
  headers: string[],
  keys: string[],
  data: any[],
  filtersDesc?: string
) => {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) return;

  const fechaFormateada = new Date().toLocaleString("es-BO", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit"
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${titulo}</title>
      <style>
        @page {
          size: A4;
          margin: 10mm;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #333;
          margin: 0;
          padding: 0;
          font-size: 10px;
          line-height: 1.3;
        }
        .header {
          display: flex;
          justify-content: space-between;
          border-bottom: 2px solid #0095ff;
          padding-bottom: 8px;
          margin-bottom: 12px;
          align-items: center;
        }
        .logo-area h1 {
          margin: 0;
          font-size: 18px;
          color: #0095ff;
          font-weight: 800;
          letter-spacing: 0.5px;
        }
        .logo-area p {
          margin: 1px 0 0 0;
          color: #666;
          font-size: 8px;
        }
        .report-title {
          text-align: right;
        }
        .report-title h2 {
          margin: 0;
          font-size: 14px;
          color: #111;
          text-transform: uppercase;
        }
        .report-title p {
          margin: 2px 0 0 0;
          font-size: 9px;
          color: #555;
        }
        .filters-box {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 6px 10px;
          border-radius: 6px;
          margin-bottom: 12px;
          font-size: 9px;
          color: #475569;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
        }
        th {
          background-color: #f1f5f9;
          color: #334155;
          text-align: left;
          padding: 5px 6px;
          font-size: 9px;
          text-transform: uppercase;
          border-bottom: 1.5px solid #cbd5e1;
          font-weight: bold;
        }
        td {
          padding: 5px 6px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 9px;
          color: #334155;
          max-width: 180px;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        tr:nth-child(even) td {
          background-color: #f8fafc;
        }
        .text-right {
          text-align: right;
        }
        .text-center {
          text-align: center;
        }
        .summary-stats {
          margin-top: 10px;
          font-size: 10px;
          text-align: right;
          font-weight: bold;
          color: #0f172a;
        }
        .footer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          text-align: center;
          font-size: 7.5px;
          color: #94a3b8;
          border-top: 1px solid #e2e8f0;
          padding-top: 3px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo-area">
          <h1>REPUESTOS LA PAZ</h1>
          <p>Venta de Repuestos Automotrices - La Paz, Bolivia</p>
        </div>
        <div class="report-title">
          <h2>${titulo}</h2>
          <p><strong>Generado el:</strong> ${fechaFormateada}</p>
        </div>
      </div>

      ${filtersDesc ? `
        <div class="filters-box">
          <strong>Filtros aplicados:</strong> ${filtersDesc}
        </div>
      ` : ''}

      <table>
        <thead>
          <tr>
            ${headers.map((h) => {
              const alignClass = h.toLowerCase().includes("total") || h.toLowerCase().includes("monto") || h.toLowerCase().includes("precio") || h.toLowerCase().includes("stock") || h.toLowerCase().includes("cant") || h.toLowerCase().includes("acum") ? ' class="text-right"' : '';
              return `<th${alignClass}>${h}</th>`;
            }).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.length === 0 ? `
            <tr>
              <td colspan="${headers.length}" style="text-align: center; padding: 20px; color: #64748b;">
                No hay registros coincidentes para el reporte.
              </td>
            </tr>
          ` : data.map((item: any) => `
            <tr>
              ${keys.map((k, idx) => {
                const h = headers[idx];
                const alignClass = h.toLowerCase().includes("total") || h.toLowerCase().includes("monto") || h.toLowerCase().includes("precio") || h.toLowerCase().includes("stock") || h.toLowerCase().includes("cant") || h.toLowerCase().includes("acum") ? ' class="text-right"' : '';
                return `<td${alignClass}>${item[k] !== undefined && item[k] !== null ? item[k] : ''}</td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="summary-stats">
        Total Registros Reportados: ${data.length}
      </div>

      <div class="footer">
        Reporte generado internamente desde el sistema comercial. Reservados todos los derechos.
      </div>
    </body>
    </html>
  `;

  doc.open();
  doc.write(html);
  doc.close();

  setTimeout(() => {
    if (iframe.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 350);
};
