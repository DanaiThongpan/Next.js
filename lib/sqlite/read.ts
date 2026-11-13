import 'server-only';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { isAbsolute } from 'node:path';
const run = promisify(execFile);
const program = `
import sqlite3,json,sys,pathlib
r=json.loads(sys.stdin.read() if len(sys.argv)==1 else sys.argv[1]); p=pathlib.Path(r['path'])
if not p.is_file(): raise RuntimeError('UNAVAILABLE')
c=sqlite3.connect(p.as_uri()+'?mode=ro',uri=True,timeout=5);c.row_factory=sqlite3.Row
policy=p.parent/'disabled-categories.json'
disabled=json.loads(policy.read_text()) if policy.exists() else []
if not isinstance(disabled,list) or any(not isinstance(x,str) for x in disabled): raise RuntimeError('INVALID_POLICY')
visibility=p.parent/'clb-visibility.json'
show_clb=json.loads(visibility.read_text()) if visibility.exists() else False
if not isinstance(show_clb,bool): raise RuntimeError('INVALID_POLICY')
inspect=r.get('inspectClb',False)
conditions=[]
category_condition='0'
if disabled:
 quoted=','.join("'"+x.replace("'","''")+"'" for x in disabled)
 category_condition='(classificationID IS NOT NULL AND classificationID IN ('+quoted+'))'
 conditions.append(category_condition)
clb="upper(COALESCE(buildingID,'')) LIKE 'CLB%'"
if not show_clb and not r.get('includeClbHistory',False): conditions.append(clb)
columns=[row['name'] for row in c.execute('PRAGMA main.table_info(durable_articles)')]
effective='CASE WHEN '+category_condition+' THEN 0 WHEN '+clb+' THEN '+('1' if show_clb else '0')+' ELSE is_visible END AS is_visible'
projection=','.join(effective if name=='is_visible' else '"'+name.replace('"','""')+'"' for name in columns)
excluded=' OR '.join(conditions) if conditions else '0'
if inspect: excluded='0'
c.execute('CREATE TEMP VIEW durable_articles AS SELECT '+projection+' FROM main.durable_articles WHERE NOT ('+excluded+')')
for table in ['borrow_back','repair']:
 if c.execute("SELECT 1 FROM main.sqlite_master WHERE type='table' AND name=?",(table,)).fetchone():
  c.execute('CREATE TEMP VIEW '+table+' AS SELECT t.* FROM main.'+table+' t WHERE NOT EXISTS (SELECT 1 FROM main.durable_articles WHERE DA_ID=t.DA_ID AND ('+excluded+'))')
c.execute('PRAGMA query_only=ON');c.execute('BEGIN')
result=[]
for q in r['queries']: result.append([dict(x) for x in c.execute(q['sql'],q['values']).fetchall()])
c.rollback();c.close();print(json.dumps(result))
`;

export async function readSqliteQueries(queries: {sql:string;values:(string|number)[]}[], options: { inspectClb?: boolean; includeClbHistory?: boolean; useStdin?: boolean } = {}) {
 if(process.env.DAAM_DB_ACCESS!=='enabled'||process.env.NEXT_PHASE==='phase-production-build') throw new Error('SOURCE_DISABLED');
 const path=process.env.DAAM_SQLITE_PATH;
 if(!path||!isAbsolute(path)) throw new Error('SOURCE_UNAVAILABLE');
 if(queries.some(q=>!q.sql.startsWith('SELECT ')||q.sql.includes(';'))) throw new Error('QUERY_REJECTED');
 const payload=JSON.stringify({path,queries,inspectClb:options.inspectClb===true,includeClbHistory:options.includeClbHistory===true});
 const limits={timeout:10000,maxBuffer:2*1024*1024};
 try {
  const stdout=options.useStdin
   ? await new Promise<string>((resolve,reject)=>{
     const child=execFile('python3',['-c',program],limits,(error,out)=>error?reject(error):resolve(out));
     child.stdin?.on('error',reject);
     child.stdin?.end(payload);
    })
   : (await run('python3',['-c',program,payload],limits)).stdout;
  return JSON.parse(stdout) as Record<string,string|number|null>[][];
 }catch{throw new Error('SOURCE_UNAVAILABLE');}
}
