import 'server-only';
import { createHash } from 'node:crypto';
import { csvColumns, assetFieldLimits, csvMaxRows, type CsvIssue, type CsvPreviewResult, type CsvRow } from '../csv-import-format';
import type { Identity } from '../auth/policy';
import { bangkokDay } from '../dashboard/model';
import { readSqliteQueries } from './read';

const aliases = [
  ['da_number','รหัสครุภัณฑ์','หมายเลขครุภัณฑ์','barcode'],
  ['da_listname','ชื่อรายการ','รายการครุภัณฑ์','item_name'],
  ['da_brand','ยี่ห้อ','brand','รุ่น'],
  ['classificationid','classification_id','หมวดหมู่','category','classificationname'],
  ['buildingid','building_id','อาคาร','สถานที่','buildingname','location'],
  ['classroomid','classroom_id','ห้อง','room','classroomname'],
  ['da_price','ราคา','price'], ['da_year','ปีงบประมาณ','ปี','year'],
  ['owner_department','department','สังกัด','หน่วยงาน'],
];

export function parseCsv(bytes: Uint8Array) {
  let text: string;
  try { text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
  catch { throw new Error('ไฟล์ต้องเข้ารหัส UTF-8'); }
  if (text.includes('\0')) throw new Error('ไฟล์มีอักขระที่ไม่รองรับ');
  const records: { row: number; values: string[] }[] = [];
  let line = 1, start = 1, field = '', values: string[] = [];
  let state: 'start' | 'plain' | 'quoted' | 'closed' = 'start';
  function finishField() { values.push(field); field = ''; state = 'start'; }
  function finishRow() {
    finishField();
    if (values.some(value => value.trim())) records.push({ row: start, values });
    if (records.length > csvMaxRows + 1) throw new Error('รองรับสูงสุด 10,000 แถวต่อไฟล์');
    values = [];
  }
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const newline = c === '\r' || c === '\n';
    if (state === 'quoted') {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') state = 'closed';
      else if (newline) {
        if (c === '\r' && text[i + 1] === '\n') i++;
        field += '\n'; line++;
      } else field += c;
    } else if (newline) {
      finishRow();
      if (c === '\r' && text[i + 1] === '\n') i++;
      start = ++line;
    } else if (c === ',') finishField();
    else if (c === '"' && state === 'start') state = 'quoted';
    else if (c === '"' || state === 'closed') throw new Error(`แถว ${line} ใช้เครื่องหมายคำพูดไม่ถูกต้อง`);
    else { state = 'plain'; field += c; }
  }
  if (state === 'quoted') throw new Error(`แถว ${start} ปิดเครื่องหมายคำพูดไม่ครบ`);
  if (field || values.length || state === 'closed') finishRow();
  const [header, ...rows] = records;
  if (!header || !rows.length) throw new Error('ไฟล์ต้องมีหัวคอลัมน์และข้อมูลอย่างน้อยหนึ่งแถว');
  const fields = header.values.map(value => value.trim().toLowerCase());
  const columns = aliases.map(names => fields.flatMap((field, index) => names.includes(field) ? [index] : []));
  if (columns[0].length !== 1 || columns[1].length !== 1 || columns.some(indexes => indexes.length > 1)) {
    throw new Error('หัวคอลัมน์ต้องมี DA_Number และ DA_ListName และห้ามระบุฟิลด์เดียวกันซ้ำ');
  }
  return { rows, columns: columns.map(indexes => indexes[0] ?? -1), width: fields.length, headers: header.values.map(value => value.trim()) };
}

export async function readCsvReferences() {
  const [categories, buildings, rooms] = await readSqliteQueries([
    { sql: 'SELECT classificationID AS id, classificationName AS name FROM classification ORDER BY classificationID', values: [] },
    { sql: 'SELECT buildingID AS id, buildingName AS name FROM building ORDER BY buildingID', values: [] },
    { sql: 'SELECT classroomID AS id, classroomName AS name, buildingID AS building FROM building_classroom ORDER BY buildingID, classroomID', values: [] },
  ]);
  return { categories, buildings, rooms };
}

type Reference = Awaited<ReturnType<typeof readCsvReferences>>['categories'][number];

function findReference(input: string, rows: Reference[]) {
  const key = input.toLowerCase();
  const exact = rows.filter(row => String(row.id).toLowerCase() === key || String(row.name).toLowerCase() === key);
  if (exact.length) return exact.length === 1 ? exact[0] : undefined;
  const partial = rows.filter(row => {
    const name = String(row.name ?? '').toLowerCase();
    return name && (name.includes(key) || key.includes(name));
  });
  return partial.length === 1 ? partial[0] : undefined;
}

const categoryByNumber: [RegExp, number][] = [
  [/^631006|671006|^อธ/, 1], [/^631014|751014/, 2], [/^631004|571004|581004/, 3],
  [/^631013|551013|561013|571013|581013|581014/, 4], [/^631007|561004|561006|581007/, 5], [/^631012/, 7],
];
const categoryByName: [RegExp, number][] = [
  [/คอมพิวเตอร์|โน้ตบุ๊ก|notebook|laptop|pc|server|printer|ปริ้นเตอร์|scanner|สแกนเนอร์|แท็บเล็ต|tablet|ipad|ups|สำรองไฟ/i, 4],
  [/โปรเจคเตอร์|projector|จอรับภาพ|โทรทัศน์|ทีวี|smart tv|กล้อง|camera|ลำโพง|speaker|ไมค์|microphone|เครื่องเสียง/i, 5],
  [/แอร์|ปรับอากาศ|พัดลม|generator|หม้อแปลง|ตู้ไฟ|เบรคเกอร์|วิทยุ/i, 1],
  [/นักเรียน|การสอน|กระดาน|โพเดียม|podium|ห้องเรียน/i, 2],
  [/ผ้าม่าน|เครื่องซักผ้า|ตู้เย็น|เตา|ไมโครเวฟ|เครื่องขัดพื้น|ดูดฝุ่น/i, 6],
  [/กล้องจุลทรรศน์|วัดอุณหภูมิ|เครื่องช่วยหายใจ|เตียงผู้ป่วย|เครื่องมือแพทย์|สารเคมี/i, 7],
  [/ปั๊มน้ำ|เครื่องตัดหญ้า|ฉีดน้ำ/i, 13], [/สว่าน|เลื่อย|เครื่องเจียร|ตู้เชื่อม/i, 12],
  [/รถเข็น|โฟล์คลิฟท์|แม่แรง/i, 11],
];

export async function validateCsv(user: Identity, parsed: Pick<ReturnType<typeof parseCsv>, 'rows' | 'columns' | 'width'>, exactIds = false, mode: 'admin' | 'user-request' = 'admin'): Promise<CsvPreviewResult> {
  const refs = await readCsvReferences();
  const resolveRef = (key: string, rows: Reference[]) => exactIds ? rows.find(row => row.id === key) : findReference(key, rows);
  const occurrences = new Map<string, number>();
  for (const record of parsed.rows) {
    const number = record.values[parsed.columns[0]]?.trim();
    if (number) occurrences.set(number, (occurrences.get(number) ?? 0) + 1);
  }
  const numbers = [...occurrences.keys()];
  const queries = [];
  for (let i = 0; i < numbers.length; i += 400) {
    const values = numbers.slice(i, i + 400);
    queries.push({ sql: `SELECT DISTINCT DA_Number AS number FROM main.durable_articles WHERE DA_Number IN (${values.map(() => '?').join(',')})`, values });
  }
  const existing = new Set((queries.length ? (await readSqliteQueries(queries, { useStdin: true })).flat() : [])
    .map(row => String(row.number)));
  const issues: CsvIssue[] = [];
  const invalidRows = new Set<number>();
  const defaultDepartment = user.department.trim() || (mode === 'admin' && user.id === 'admin' ? 'ส่วนกลาง' : '');
  const currentYear = String(Number(bangkokDay().slice(0, 4)) + 543);
  const rows: CsvRow[] = parsed.rows.map(record => {
    const values = parsed.columns.map(index => record.values[index]?.trim() ?? '');
    const [number, name, , category, building, room, price, year, department] = values;
    const issue = (field: string, message: string) => {
      issues.push({ row: record.row, field, message });
      if (!duplicate) invalidRows.add(record.row);
    };
    const repeated = (occurrences.get(number) ?? 0) > 1;
    const alreadyExists = existing.has(number);
    const duplicate = alreadyExists ? (repeated ? 'both' : 'existing') : repeated ? 'in-file' : null;
    if (duplicate && mode === 'admin') return { row: record.row, values, duplicate };
    if (record.values.length !== parsed.width) issue('CSV', 'จำนวนคอลัมน์ไม่เท่ากับหัวตาราง');
    values.forEach((value, i) => { if (value.length > assetFieldLimits[i]) issue(csvColumns[i], `ข้อมูลยาวเกิน ${assetFieldLimits[i]} ตัวอักษร`); });
    if (!number) issue('DA_Number', 'กรุณาระบุหมายเลขครุภัณฑ์');
    if (!name) issue('DA_ListName', 'กรุณาระบุชื่อรายการ');
    values[8] = department || defaultDepartment;
    const allowed = (mode === 'admin' && user.id === 'admin') || values[8] === defaultDepartment;
    if (!values[8] || !allowed) issue('owner_department', 'สังกัดอยู่นอกขอบเขตสิทธิ์ของคุณ');
    const categoryIndex = categoryByNumber.find(([pattern]) => pattern.test(number))?.[1]
      ?? categoryByName.find(([pattern]) => pattern.test(name))?.[1] ?? 3;
    const categoryKey = category || 'c' + String(categoryIndex).padStart(10, '0');
    values[3] = String(resolveRef(categoryKey, refs.categories)?.id ?? '');
    if (!values[3]) issue('classificationID', 'ไม่พบหมวดหมู่หรือชื่อหมวดหมู่ไม่เจาะจง');
    values[4] = building ? String(resolveRef(building, refs.buildings)?.id ?? '') : '';
    if (building && !values[4]) issue('buildingID', 'ไม่พบอาคารหรือชื่ออาคารไม่เจาะจง');
    if (room) {
      values[5] = String(resolveRef(room, refs.rooms.filter(item => item.building === values[4]))?.id ?? '');
      if (!values[5]) issue('classroomID', 'ไม่พบห้องในอาคารที่ระบุ');
    }
    values[6] = price.replaceAll(',', '');
    if (price && (!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(price) || !/^\d{1,8}(\.\d{1,2})?$/.test(values[6]))) issue('DA_Price', 'ราคาต้องเป็นเลขตั้งแต่ 0 และมีทศนิยมไม่เกิน 2 ตำแหน่ง');
    if (year && (!/^\d{4}$/.test(year) || (mode === 'user-request' && Number(year) < 1000))) issue('DA_Year', 'ปีงบประมาณต้องมี 4 หลัก');
    const yearInNumber = number.match(/\/([0-9]{2})(?:\(|$)/)?.[1] ?? number.match(/^([4-7][0-9])[0-9]{4}/)?.[1];
    values[7] = year || (yearInNumber ? '25' + yearInNumber : currentYear);
    return { row: record.row, values, duplicate };
  });
  const valid = rows.filter(row => !row.duplicate && !invalidRows.has(row.row));
  return {
    rows, issues, total: rows.length, valid: valid.length, invalid: invalidRows.size,
    duplicates: rows.filter(row => row.duplicate).length, inserted: valid.length,
    token: createHash('sha256').update(JSON.stringify(rows)).digest('hex'),
  };
}
