import { AssetDetailContent } from './asset-detail-content';
import { AssetFilterPanel } from './asset-filter-panel';
import { AssetResponsiveRow } from './asset-responsive-row';
import { ClbVisibilitySwitch } from './clb-visibility-switch';
import { canManageCategoryAvailability } from '@/lib/auth/policy';
import './asset-table.css';
const styles = {"page": "asset-page", "heading": "asset-heading", "filters": "asset-filters", "modes": "asset-modes", "availability": "asset-availability", "card": "asset-card", "toolbar": "asset-toolbar", "tableScroll": "asset-tableScroll", "table": "asset-table", "sort": "asset-sort", "action": "asset-action", "actions": "asset-actions"};
import { AssetStatusForm } from './asset-status-form';
import { OperationButton } from './operation-button';
import { AssetCategorySwitches } from './asset-category-switches';
import { Suspense } from 'react';
import Link from 'next/link';
import { requireIdentity } from '@/lib/auth/session';
import { readAssetPage } from '@/lib/sqlite/assets';
import type { Filters,CatalogRow } from '@/lib/sqlite/catalog';
import { AdminShell } from './admin-shell';
import { AdminSidebar } from './admin-sidebar';
import { OriginalDetailModal } from './original-detail-modal';
import { Icon } from './icon';
function categoryFields(filters:Filters){return ['filter_category','category','category_selection'].flatMap(key=>{const raw=filters[key];const values=Array.isArray(raw)?raw:typeof raw==='string'?[raw]:[];return values.map((value,i)=><input key={key+i} type="hidden" name={key} value={value}/>);});}
const labels:Record<string,string>={id:'รหัสครุภัณฑ์',number:'หมายเลขครุภัณฑ์',name:'รายการ',brand:'ยี่ห้อ',year:'ปี',price:'ราคาจัดซื้อ',detail:'รายละเอียด',responsible:'ผู้รับผิดชอบ',size:'ขนาด',department:'แผนกเจ้าของ',creator:'ผู้บันทึก',approved:'อนุมัติ',visible:'การแสดงผล',category:'หมวดหมู่',status:'สถานะ',building:'อาคาร',room:'ห้อง'};
function Detail({row,trigger,number=false}:{row:CatalogRow;trigger?:string;number?:boolean}){return <OriginalDetailModal title="รายละเอียดข้อมูลครุภัณฑ์" button={trigger?{label:'ดูรายละเอียด '+trigger,className:`btn btn-link p-0 fw-bold text-decoration-none ${number?'text-primary font-monospace':'text-dark text-start'}`,content:trigger}:action('ดูรายละเอียดครุภัณฑ์','circle-info','info text-white')} variant="primary" lazy><AssetDetailContent row={row}/></OriginalDetailModal>;}
function action(label:string, icon:string, variant:string) {
 return {label,className:`btn btn-sm ${styles.action} btn-${variant}`,content:<Icon name={icon}/>};
}

function Status({row, compact=false}:{row:CatalogRow;compact?:boolean}) {
 const borrowed=String(row.status??'').includes('ยืม')||row.status==='s0003';
 const damaged=/ชำรุด|ไม่พร้อม|สูญหาย|s0002/.test(String(row.status??''));
 const label=borrowed?'กำลังถูกยืม':damaged?'ชำรุด/ไม่พร้อมใช้งาน':'พร้อมใช้งาน';
 const button=compact ? {...action('อัปเดตสถานะ','arrows-rotate','outline-danger'),disabled:borrowed}
 : {label:borrowed?label:'อัปเดตสถานะ: '+label,disabled:borrowed,className:`btn btn-sm py-0 px-2 rounded-pill text-nowrap btn-outline-${borrowed?'warning':damaged?'danger':'success'}`,content:<><Icon name={borrowed?'clock':damaged?'triangle-exclamation':'circle-check'} className="me-1"/>{label}{!borrowed&&<Icon name="pen-to-square" className="ms-1"/>}</>};
 return <OriginalDetailModal title="อัปเดตสถานะความพร้อมครุภัณฑ์" button={button} variant="primary" lazy><AssetStatusForm id={String(row.id)} name={String(row.name)} initialDamaged={String(row.status??'').includes('ชำรุด')}/></OriginalDetailModal>;
}
async function Content({searchParams}:{searchParams:Promise<Filters>}){
 const user=await requireIdentity('admin');const filters=await searchParams;const get=(k:string)=>typeof filters[k]==='string'?filters[k]:'';let data;try{data=await readAssetPage(user,filters);}catch{}
 const href=(changes:Record<string,string>)=>{const p=new URLSearchParams();for(const[k,v]of Object.entries(filters))if(typeof v==='string')p.set(k,v);else if(Array.isArray(v))for(const entry of v)p.append(k,entry);for(const[k,v]of Object.entries(changes))p.set(k,v);return '?'+p;};
 return <AdminShell sidebar={<AdminSidebar user={user}/>} year={new Date().getFullYear()}><div className={`container-fluid px-0 ${styles.page}`}><div className={`d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3 ${styles.heading}`}><div><h5 className="fw-bold text-dark mb-1"><Icon name="boxes-stacked" className="text-primary me-2"/>ระบบจัดการและแสดงรายละเอียดครุภัณฑ์</h5><p className="text-muted small mb-0">เรียกดูข้อมูลจำเพาะเชิงลึก กรองตามหมวดหมู่/สถานที่ และตรวจสอบสถานะแสดงผลครุภัณฑ์ทั้งหมด</p></div><div className="d-flex flex-wrap gap-2"><Link href="/admin/manage-data/add" className="btn btn-primary btn-sm rounded-pill"><Icon name="plus" className="me-1"/>เพิ่มครุภัณฑ์</Link><Link href="/admin/manage-users" className="btn btn-outline-primary btn-sm rounded-pill"><Icon name="users-gear" className="me-1"/>จัดการข้อมูลผู้ใช้</Link></div></div>{!data?<p role="alert" className="alert alert-danger">ไม่สามารถอ่านข้อมูลครุภัณฑ์ได้ในขณะนี้</p>:<>
 <div className={`filter-card shadow-sm p-4 mb-4 ${styles.filters}`}><div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2 pb-3 border-bottom"><div className="d-flex align-items-center gap-2 flex-wrap"><span className="fw-bold text-secondary small"><Icon name="shield-halved" className="text-primary me-1"/>โหมดการแสดงผล:</span><div className={`btn-group btn-group-sm p-1 ${styles.modes}`}>{[['visible','ใช้งานปกติ','success'],['hidden','ซ่อนอยู่ (CLB)','warning'],['all','ทั้งหมด','primary']].map(([v,label,color])=><Link key={v} href={href({filter_visibility:v,page:'1'})} className={`btn rounded-pill px-3 fw-semibold ${data.visibility===v?'btn-'+color:'btn-light text-secondary'}`}><Icon name={v==='visible'?'eye':v==='hidden'?'eye-slash':'layer-group'} className="me-1"/>{label} <span className="badge bg-white text-dark">{Number(data.counts[v==='all'?'total':v]??0).toLocaleString('th-TH')}</span></Link>)}</div></div><div className="d-flex flex-wrap gap-2">{user.id==='admin'&&<button disabled className="btn btn-outline-primary btn-sm rounded-pill" title="ยังไม่ได้ยืนยันแหล่งข้อมูลและผลกระทบการซิงค์">ซิงค์ฐานข้อมูล</button>}<Link href="/admin/print-qrcode" className="btn btn-outline-primary btn-sm rounded-pill">พิมพ์ QR Code</Link><Link href="/admin/csv" className="btn btn-outline-secondary btn-sm rounded-pill">นำเข้าผ่าน CSV</Link></div></div><details className={styles.availability}>
   <summary>
    <Icon name="sliders" className="asset-availability-icon"/>
    <span>ตั้งค่าการเปิด–ปิดใช้งานหมวดหมู่และ CLB</span>
    <Icon name="chevron-down" className="asset-availability-chevron"/>
   </summary>
   <div className="asset-availability-content">
    <ClbVisibilitySwitch enabled={data.showClb} canManage={canManageCategoryAvailability(user)}/>
    <div className="mt-3">
     <AssetCategorySwitches categories={data.categories.map(c=>({id:String(c.id),name:String(c.name)}))}
      disabled={data.disabledCategories} canManage={canManageCategoryAvailability(user)}/>
    </div>
   </div>
  </details>
  <AssetFilterPanel active={['filter_category','filter_building','filter_status','filter_year'].some(key=>Boolean(get(key)))}><form className="row g-3 align-items-end">{['q','length','sort','direction','department'].map(key=>get(key)?<input key={key} type="hidden" name={key} value={get(key)}/>:null)}<input type="hidden" name="filter_visibility" value={data.visibility}/><label className="col-lg-3 col-md-6 form-label fw-bold text-secondary small"><Icon name="tags" className="text-primary me-1"/> หมวดหมู่ครุภัณฑ์:
<select name="filter_category" defaultValue={get('filter_category')||get('category')} className="form-select form-select-sm border shadow-sm"><option value="">-- ทุกหมวดหมู่ (All) --</option>{data.categories.map(row=><option key={String(row.id)} value={String(row.id)}>{row.name}</option>)}</select></label>{[['filter_building','สถานที่ / อาคาร','-- ทุกสถานที่ / ทุกอาคาร --',data.buildings]].map(([key,label,empty,items])=><label key={String(key)} className="col-lg-3 col-md-6 form-label fw-bold text-secondary small"><Icon name="building" className="text-success me-1"/>{String(label)}:<select name={String(key)} defaultValue={get(String(key))} className="form-select form-select-sm border shadow-sm"><option value="">{String(empty)}</option>{(items as CatalogRow[]).map(r=><option key={String(r.id)} value={String(r.id)}>{r.name}</option>)}</select></label>)}<label className="col-lg-2 col-md-6 form-label fw-bold text-secondary small"><Icon name="circle-notch" className="text-warning me-1"/> สถานะความพร้อม:<select name="filter_status" defaultValue={get('filter_status')} className="form-select form-select-sm border shadow-sm"><option value="">-- ทุกสถานะ --</option>{['พร้อมใช้งาน','กำลังถูกยืม','ชำรุด / ไม่พร้อมใช้'].map(v=><option key={v}>{v}</option>)}</select></label><label className="col-lg-2 col-md-6 form-label fw-bold text-secondary small"><Icon name="calendar-days" className="text-info me-1"/> ปีงบประมาณ / ประจำปี:<select name="filter_year" defaultValue={get('filter_year')} className="form-select form-select-sm border shadow-sm"><option value="">-- ทุกปี (All) --</option>{data.years.map(r=><option key={String(r.year)}>{r.year}</option>)}</select></label><div className="col-lg-2 col-md-12 d-flex gap-2"><button className="btn btn-primary btn-sm flex-grow-1 shadow-sm"><Icon name="filter" className="me-1"/>กรองข้อมูล</button><Link href={`/admin/manage-data?filter_visibility=${data.visibility}`} title="ล้างตัวกรอง" aria-label="ล้างตัวกรอง" className="btn btn-outline-secondary btn-sm shadow-sm"><Icon name="rotate-left"/></Link></div></form></AssetFilterPanel><div className="d-flex flex-wrap gap-2 mt-3">{[['filter_building',data.buildings.find(r=>String(r.id)===get('filter_building'))?.name],['filter_status',get('filter_status')],['filter_year',get('filter_year')],['q',get('q')]].filter(([key])=>get(String(key))).map(([key,label])=><Link key={String(key)} href={href({[String(key)]:'',page:'1'})} className="badge bg-light text-dark border text-decoration-none" aria-label={'ล้างตัวกรอง '+String(label??get(String(key)))}>{label||get(String(key))} ×</Link>)}</div></div><section className={`card shadow-sm border-0 ${styles.card}`}>
 <header className="asset-list-header">
  <div className="asset-list-heading">
   <span className="asset-list-symbol"><Icon name="list-check"/></span>
   <h2>รายการครุภัณฑ์ในระบบ</h2>
   <span className="asset-list-count">{data.total.toLocaleString('th-TH')} <span>รายการ</span></span>
  </div>
  <p className="asset-list-hint"><Icon name="circle-info"/>เลือกชื่อครุภัณฑ์หรือปุ่มรายละเอียดเพื่อดูข้อมูลทั้งหมด</p>
 </header>
 <div className="card-body p-3 p-lg-4">
  <form className={styles.toolbar}>
   {Object.entries(filters).filter(([key])=>!['q','length','page'].includes(key)).flatMap(([key,value])=>(Array.isArray(value)?value:typeof value==='string'?[value]:[]).map((entry,index)=><input type="hidden" name={key} value={entry} key={key+index}/>))}
   <label>Show <select name="length" defaultValue={data.pageSize} className="form-select form-select-sm d-inline-block w-auto mx-1">{[10,25,50,100].map(n=><option key={n}>{n}</option>)}</select> entries</label>
   <div className="d-flex gap-2 align-items-center"><label>Search: <input name="q" defaultValue={get('q')} placeholder="หมายเลข ชื่อ หรือยี่ห้อ…" aria-label="ค้นหาครุภัณฑ์" className="form-control form-control-sm d-inline-block w-auto"/></label><button type="submit" className="btn btn-outline-secondary btn-sm">ค้นหา</button></div>
  </form>
  <div className={`table-responsive ${styles.tableScroll}`}><table className={`table table-hover table-striped align-middle border mb-0 ${styles.table}`}>
   <thead><tr>{[['number','หมายเลขครุภัณฑ์'],['name','ชื่อรายการครุภัณฑ์'],['category','หมวดหมู่'],['building','สถานที่ / อาคาร'],['price','ราคาจัดซื้อ'],['department','แผนกเจ้าของ'],['visible','การแสดงผล'],['status','สถานะ']].map(([key,label])=>{
    const active=(get('sort')||'number')===key;
    const descending=active&&get('direction')==='desc';
    const next=active&&!descending?'desc':'asc';
    return <th key={key} scope="col" aria-sort={active?(descending?'descending':'ascending'):'none'}>
     <form>{Object.entries(filters).filter(([name])=>!['sort','direction','page','order'].includes(name)).flatMap(([name,value])=>(Array.isArray(value)?value:typeof value==='string'?[value]:[]).map((entry,index)=><input type="hidden" name={name} value={entry} key={name+index}/>))}
      <input type="hidden" name="direction" value={next}/><button type="submit" className={styles.sort} name="sort" value={key} aria-label={`เรียง ${label} ${next==='asc'?'จากน้อยไปมาก':'จากมากไปน้อย'}`}>{label}<Icon name={active?(descending?'sort-down':'sort-up'):'sort'}/></button>
     </form>
    </th>;
   })}<th scope="col" className="text-center">จัดการ</th><th scope="col" className="asset-expand-cell"><span className="visually-hidden">ขยายรายละเอียด</span></th></tr></thead>
   <tbody>{data.rows.map(row=>{
    const id=encodeURIComponent(String(row.id));
    const hidden=String(row.visible)==='0';
    const year=String(row.year??'').replace(/^['"]+|['"]+$/g,'').trim();
    const price=Number(String(row.price??0).replaceAll(',',''));
    return <AssetResponsiveRow key={String(row.id)} name={String(row.name??row.number)} image={row.image?'/admin/manage-data/photo?id='+id:undefined} detail={<Detail row={row} trigger="ดูรายละเอียด"/>}>
     <td className="text-center"><Detail row={row} trigger={String(row.number??'—')} number/>{year&&<small className="d-block text-muted">ปี {/^[12][0-9]{3}$/.test(year)&&Number(year)<2400?Number(year)+543:year}</small>}</td>
     <td><Detail row={row} trigger={String(row.name??'—')}/>{row.brand&&<small className="d-block text-muted"><Icon name="tag" className="me-1"/>{row.brand}</small>}</td>
     <td><span className="badge rounded-pill bg-info-subtle text-info-emphasis border border-info-subtle">{row.category??'—'}</span></td>
     <td><strong><Icon name="location-dot" className="text-danger me-1"/>{row.building??'—'}</strong><small className="d-block text-muted">{row.room??row.department}</small></td>
     <td className="text-end fw-bold text-nowrap">฿{(Number.isFinite(price)?price:0).toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
     <td><span className="badge rounded-pill bg-light text-secondary border">{row.department??'ส่วนกลาง'}</span></td>
     <td><span className={`badge rounded-pill border ${hidden?'bg-warning-subtle text-warning-emphasis border-warning-subtle':'bg-success-subtle text-success border-success-subtle'}`}><Icon name={hidden?'eye-slash':'eye'} className="me-1"/>{hidden?'ซ่อนอยู่':'ปกติ'}</span></td>
     <td><Status row={row}/></td>
     <td><div className={styles.actions}>
      <Detail row={row}/>
      <Link className={action('','', 'warning text-white').className} href={`/admin/manage-data/edit?id=${id}`} title="แก้ไขข้อมูล" aria-label="แก้ไขข้อมูล"><Icon name="pen-to-square"/></Link>
      <Status row={row} compact/>
      <Link className={action('','', 'outline-secondary').className} href={'/admin/repairs/asset?DAID='+encodeURIComponent(String(row.id))} title="ประวัติการซ่อมบำรุง" aria-label="ประวัติการซ่อมบำรุง"><Icon name="screwdriver-wrench"/></Link>
      <OriginalDetailModal title="รูปภาพครุภัณฑ์" button={action('ดูรูปภาพครุภัณฑ์','image','outline-success')} variant="success" lazy><div className="img-preview-box text-center">{row.image?<img src={`/admin/manage-data/photo?id=${id}`} alt={String(row.name)} className="img-fluid rounded"/>:<p className="text-muted">ไม่มีรูปภาพ</p>}</div></OriginalDetailModal>
      <Link className={action('','','dark').className} href={`/admin/manage-data/qr?id=${id}`} title="พิมพ์ QR Code" aria-label="พิมพ์ QR Code"><Icon name="qrcode"/></Link>
      <OperationButton action={hidden?'show-asset':'hide-asset'} id={String(row.id)} label={hidden?'แสดงครุภัณฑ์':'ซ่อนครุภัณฑ์'} className={`btn btn-sm btn-outline-secondary ${styles.action}`} icon={<Icon name={hidden?'eye':'eye-slash'}/>}/>
     </div></td>
    </AssetResponsiveRow>;
   })}{!data.rows.length&&<tr><td colSpan={10} className="text-center text-muted">ไม่พบข้อมูลครุภัณฑ์ตามเงื่อนไข</td></tr>}</tbody>
  </table></div>
  <Pagination page={data.page} length={data.pageSize} total={data.total} count={data.rows.length} href={href}/>
 </div>
</section></>}</div></AdminShell>;
}
function Pagination({page,length,total,count,href}:{page:number;length:number;total:number;count:number;href:(changes:Record<string,string>)=>string}){
 const last=Math.max(1,Math.ceil(total/length));
 const pages=[...new Set([1,page-2,page-1,page,page+1,page+2,last])].filter(n=>n>=1&&n<=last).sort((a,b)=>a-b);
 return <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-3">
  <small>แสดง {count?(page-1)*length+1:0} ถึง {count?(page-1)*length+count:0} จากทั้งหมด {total.toLocaleString('th-TH')} รายการ</small>
  <nav aria-label="แบ่งหน้าครุภัณฑ์"><ul className="pagination pagination-sm mb-0 flex-wrap">
   {page>1?<li className="page-item"><Link className="page-link" href={href({page:String(page-1)})}>ก่อนหน้า</Link></li>:<li className="page-item disabled"><span className="page-link">ก่อนหน้า</span></li>}
   {pages.map((n,i)=><li key={n} className={`page-item ${n===page?'active':''}`}>{i>0&&n-pages[i-1]>1&&<span className="px-1">…</span>}<Link className="page-link d-inline-block" aria-current={n===page?'page':undefined} href={href({page:String(n)})}>{n}</Link></li>)}
   {page<last?<li className="page-item"><Link className="page-link" href={href({page:String(page+1)})}>ถัดไป</Link></li>:<li className="page-item disabled"><span className="page-link">ถัดไป</span></li>}
  </ul></nav>
 </div>;
}
export function AssetPage(props:{searchParams:Promise<Filters>}){return <Suspense fallback={<p>กำลังตรวจสอบสิทธิ์และโหลดครุภัณฑ์…</p>}><Content {...props}/></Suspense>;}
