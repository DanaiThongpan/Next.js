import { ApprovalsPage } from '@/components/admin/approvals-page';
import type { Filters } from '@/lib/sqlite/catalog';
export const metadata={title:'อนุมัติคำขอขึ้นทะเบียนครุภัณฑ์ (Approval)'};
export default function Page({searchParams}:{searchParams:Promise<Filters>}){return <ApprovalsPage searchParams={searchParams}/>;}
