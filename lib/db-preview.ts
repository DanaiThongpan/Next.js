import 'server-only';
import { readSqliteQueries } from './sqlite/read';
export type Table = {tableName:string;tableType:string};
export type Column = {tableName:string;columnName:string;columnType:string;dataType:string;columnKey:string;nullable:string};
export type Relation = {tableName:string;columnName:string;referencedTable:string;referencedColumn:string};
export async function readPreview() {
 if(process.env.NODE_ENV!=='development')return {ok:false as const,error:'Preview เปิดได้เฉพาะ development mode'};
 try{
  const [rawTables,rawColumns,rawRelations,samples]=await readSqliteQueries([
   {sql:"SELECT name AS tableName,'BASE TABLE' AS tableType FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",values:[]},
   {sql:"SELECT m.name AS tableName,p.name AS columnName,p.type AS columnType,lower(p.type) AS dataType,CASE WHEN p.pk>0 THEN 'PRI' ELSE '' END AS columnKey,CASE WHEN p.[notnull]=1 THEN 'NO' ELSE 'YES' END AS nullable FROM sqlite_master m JOIN pragma_table_info(m.name) p WHERE m.type='table' ORDER BY m.name,p.cid",values:[]},
   {sql:'SELECT m.name AS tableName,p.[from] AS columnName,p.[table] AS referencedTable,p.[to] AS referencedColumn FROM sqlite_master m JOIN pragma_foreign_key_list(m.name) p WHERE m.type=\'table\'',values:[]},
   {sql:'SELECT DA_ID AS id,DA_Price AS price FROM durable_articles ORDER BY DA_ID LIMIT 10',values:[]}
  ]);
  return {ok:true as const,tables:rawTables as unknown as Table[],columns:rawColumns as unknown as Column[],relations:rawRelations as unknown as Relation[],samples:samples.map(row=>({id:String(row.id),price:String(row.price??'')})),sampleTable:'durable_articles'};
 }catch{return {ok:false as const,error:'ไม่สามารถอ่านฐานข้อมูล SQLite ได้'};}
}
