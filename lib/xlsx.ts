/** Minimal standards-compliant OOXML spreadsheet writer. No runtime dependency. */
export type ExcelValue = string | number | boolean | null | undefined;
export interface ExcelSheet { name: string; headers: string[]; rows: ExcelValue[][] }
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
function col(n: number): string {
  let result = ''; do { result = String.fromCharCode(65 + (n % 26)) + result; n = Math.floor(n / 26) - 1; } while (n >= 0);
  return result;
}
function sheetXml(sheet: ExcelSheet): string {
  const headers = sheet.headers;
  const all = [headers, ...sheet.rows];
  const widths = headers.map((name, i) => Math.min(34, Math.max(12, name.length + 3,
    ...sheet.rows.slice(0, 40).map(r => String(r[i] ?? '').length > 25 ? 25 : String(r[i] ?? '').length + 2))));
  const rows = all.map((values, ri) => `<row r="${ri + 1}">` +
    values.map((value, ci) => {
      const address = `${col(ci)}${ri + 1}`;
      if (value === null || value === undefined || value === '') return `<c r="${address}" s="${ri === 0 ? 1 : 0}"/>`;
      if (typeof value === 'number' && Number.isFinite(value)) return `<c r="${address}" s="${ri === 0 ? 1 : 0}"><v>${value}</v></c>`;
      if (typeof value === 'boolean') return `<c r="${address}" t="b"><v>${value ? 1 : 0}</v></c>`;
      // inlineStr is always data, never a formula; protects against CSV/Excel injection.
      return `<c r="${address}" s="${ri === 0 ? 1 : 0}" t="inlineStr"><is><t xml:space="preserve">${esc(String(value))}</t></is></c>`;
    }).join('') + '</row>').join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<dimension ref="A1:${col(Math.max(0, headers.length - 1))}${all.length}"/>` +
    `<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>` +
    `<sheetFormatPr defaultRowHeight="18"/><cols>${widths.map((w,i) => `<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join('')}</cols>` +
    `<sheetData>${rows}</sheetData><autoFilter ref="A1:${col(Math.max(0, headers.length - 1))}${all.length}"/>` +
    `<pageMargins left="0.3" right="0.3" top="0.5" bottom="0.5" header="0.2" footer="0.2"/></worksheet>`;
}
function crc32(data: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function zip(entries: Array<[string,string]>): Buffer {
  const files: Buffer[] = []; const central: Buffer[] = [];
  let offset = 0;
  for (const [name, content] of entries) {
    const fileName = Buffer.from(name, 'utf8'); const body = Buffer.from(content, 'utf8');
    const crc = crc32(body);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(0, 8); local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(body.length, 18); local.writeUInt32LE(body.length, 22);
    local.writeUInt16LE(fileName.length, 26);
    files.push(local, fileName, body);
    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0); cd.writeUInt16LE(20, 4); cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(0x0800, 8); cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(body.length, 20); cd.writeUInt32LE(body.length, 24);
    cd.writeUInt16LE(fileName.length, 28); cd.writeUInt32LE(offset, 42);
    central.push(cd, fileName);
    offset += local.length + fileName.length + body.length;
  }
  const centralLength = central.reduce((sum, x) => sum + x.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10); end.writeUInt32LE(centralLength, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...files, ...central, end]);
}
export function buildExcelWorkbook(sheets: ExcelSheet[]): Buffer {
  const valid = sheets.slice(0, 12).map((s, i) => ({ ...s, name: (s.name || `Sheet${i+1}`).slice(0,31) }));
  const pfx = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  const types = `${pfx}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
    `<Default Extension="xml" ContentType="application/xml"/>` +
    `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
    `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
    valid.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('') + `</Types>`;
  const rels = `${pfx}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
  const wb = `${pfx}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>`+
    valid.map((s,i)=>`<sheet name="${esc(s.name)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('') + '</sheets></workbook>';
  const wrels = `${pfx}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    valid.map((_,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('') +
    `<Relationship Id="rId${valid.length+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
  const styles = `${pfx}<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<fonts count="2"><font><sz val="11"/><name val="Aptos"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Aptos"/></font></fonts>` +
    `<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFC8102E"/><bgColor indexed="64"/></patternFill></fill></fills>` +
    `<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>` +
    `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
    `<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFill="1" applyFont="1"/></cellXfs></styleSheet>`;
  return zip([['[Content_Types].xml',types],['_rels/.rels',rels],['xl/workbook.xml',wb],['xl/_rels/workbook.xml.rels',wrels],['xl/styles.xml',styles],
    ...valid.map((s,i)=>[`xl/worksheets/sheet${i+1}.xml`,sheetXml(s)] as [string,string])]);
}
