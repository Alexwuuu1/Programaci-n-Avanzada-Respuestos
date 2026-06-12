/**
 * Utilidades para exportación de datos a hojas de cálculo con formato y diseño corporativo
 */

export interface ExcelColumn {
  header: string;
  key: string;
  transform?: (val: any) => string | number;
}

export const exportarAExcel = (filename: string, columns: ExcelColumn[], data: any[]) => {
  const dateStr = new Date().toLocaleString("es-BO", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit"
  });
  const reportTitle = filename.replace(/_/g, " ").toUpperCase();

  // Generar HTML estilizado con namespaces de Office Excel para conservar formatos y estilos
  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>${filename.slice(0, 30)}</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; margin: 0; }
        table { border-collapse: collapse; width: 100%; }
        .title-cell { font-size: 16px; font-weight: bold; color: #0095ff; padding: 12px 0 4px 0; text-align: left; }
        .meta-cell { font-size: 10px; color: #64748b; padding-bottom: 16px; text-align: left; border-bottom: 2px solid #0095ff; }
        th { 
          background-color: #0095ff; 
          color: #ffffff; 
          font-weight: bold; 
          border: 1px solid #cbd5e1; 
          text-align: left; 
          padding: 8px 10px; 
          font-size: 11px;
          text-transform: uppercase;
        }
        td { 
          border: 1px solid #e2e8f0; 
          padding: 6px 10px; 
          color: #334155; 
          font-size: 11px;
        }
        .zebra { background-color: #f8fafc; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .bold { font-weight: bold; }
      </style>
    </head>
    <body>
      <table>
        <tr>
          <td colspan="${columns.length}" class="title-cell">
            REPUESTOS LA PAZ - ${reportTitle}
          </td>
        </tr>
        <tr>
          <td colspan="${columns.length}" class="meta-cell">
            Generado el: ${dateStr} | Total registros: ${data.length}
          </td>
        </tr>
        <!-- Fila de espacio -->
        <tr><td colspan="${columns.length}" style="border: none; height: 10px;"></td></tr>
        <tr>
          ${columns.map(c => {
            const hLow = c.header.toLowerCase();
            const isNumeric = hLow.includes("total") || 
                              hLow.includes("monto") || 
                              hLow.includes("precio") || 
                              hLow.includes("stock") || 
                              hLow.includes("cant") || 
                              hLow.includes("acum") ||
                              hLow.includes("costo") ||
                              hLow.includes("deuda") ||
                              hLow.includes("límite");
            const alignClass = isNumeric ? ' class="text-right"' : '';
            return `<th${alignClass}>${c.header}</th>`;
          }).join('')}
        </tr>
        ${data.map((item, rowIdx) => {
          const rowClass = rowIdx % 2 === 1 ? ' class="zebra"' : '';
          return `
            <tr${rowClass}>
              ${columns.map(c => {
                let val = item[c.key];
                if (c.transform) {
                  val = c.transform(val);
                }
                if (val === undefined || val === null) {
                  val = "";
                }
                
                const hLow = c.header.toLowerCase();
                const isNumeric = hLow.includes("total") || 
                                  hLow.includes("monto") || 
                                  hLow.includes("precio") || 
                                  hLow.includes("stock") || 
                                  hLow.includes("cant") || 
                                  hLow.includes("acum") ||
                                  hLow.includes("costo") ||
                                  hLow.includes("deuda") ||
                                  hLow.includes("límite");
                const alignClass = isNumeric ? ' class="text-right"' : '';
                return `<td${alignClass}>${String(val)}</td>`;
              }).join('')}
            </tr>
          `;
        }).join('')}
      </table>
    </body>
    </html>
  `;

  // Descargar el archivo binario simulando formato de Excel
  const blob = new Blob(["\uFEFF" + html], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.xls`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
