export const csvColumns = ["DA_Number", "DA_ListName", "DA_Brand", "classificationID", "buildingID", "classroomID", "DA_Price", "DA_Year", "owner_department"] as const;
export const assetFieldLimits = [150, 255, 255, 50, 50, 50, 32, 4, 100] as const;
export const assetDetailLimits = { DA_Detail: 255, DA_Size: 200, DA_DetailLocation: 255 } as const;
export const csvExamples = [
  [
    "6310040000730",
    "ตู้ล็อกเกอร์ ขนาด 9 ประตู",
    "Modernform",
    "c0000000003",
    "PB",
    "PB101",
    "8500.00",
    "2566",
    "ส่วนกลาง"
  ],
  [
    "6310130000105",
    "เครื่องคอมพิวเตอร์ All-in-One",
    "Dell",
    "c0000000004",
    "PB",
    "PB201",
    "32000.00",
    "2567",
    "ส่วนกลาง"
  ],
  [
    "6310060000121",
    "ชุดไมค์คาดศรีษะและลำโพงขยายเสียง",
    "Sherman",
    "c0000000001",
    "CLB3",
    "CLB3100",
    "4500.00",
    "2565",
    "ส่วนกลาง"
  ],
  [
    "6310050000088",
    "เครื่องโปรเจคเตอร์แสดงภาพ",
    "Epson",
    "c0000000005",
    "CLB3",
    "CLB3000",
    "18900.00",
    "2566",
    "ส่วนกลาง"
  ]
];

export const csvMaxBytes = 5 * 1024 * 1024;
export const csvMaxRows = 10_000;
export type CsvIssue = { row: number; field: string; message: string };
export type CsvDuplicate = 'existing' | 'in-file' | 'both';
export type CsvRow = { row: number; values: string[]; duplicate: CsvDuplicate | null };
export type CsvPreviewResult = {
  rows: CsvRow[]; issues: CsvIssue[]; total: number; valid: number; invalid: number;
  duplicates: number; inserted: number; token: string;
};

export function csvTemplate() {
  return '\uFEFF' + [csvColumns, ...csvExamples].map(row =>
    row.map(value => '"' + value.replaceAll('"', '""') + '"').join(','),
  ).join('\r\n') + '\r\n';
}
