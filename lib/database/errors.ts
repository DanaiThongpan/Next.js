export const DATABASE_DISABLED_MESSAGE = 'การเชื่อมต่อฐานข้อมูลจริงถูกปิดไว้เพื่อความปลอดภัย';
export type DatabaseErrorCode = 'DB_ACCESS_DISABLED' | 'DB_CONFIG_INVALID' | 'DB_QUERY_REJECTED' | 'DB_UNAVAILABLE' | 'DB_CLOSING';
export class DatabaseError extends Error {
  readonly code: DatabaseErrorCode;
  constructor(code: DatabaseErrorCode) {
    super(code === 'DB_ACCESS_DISABLED' ? DATABASE_DISABLED_MESSAGE : code === 'DB_CONFIG_INVALID' ? 'การตั้งค่าฐานข้อมูลไม่ครบถ้วนหรือไม่ถูกต้อง' : code === 'DB_QUERY_REJECTED' ? 'คำสั่งอ่านข้อมูลไม่ได้รับอนุญาต' : 'ไม่สามารถอ่านฐานข้อมูลได้ในขณะนี้');
    this.name = 'DatabaseError'; this.code = code;
  }
}
