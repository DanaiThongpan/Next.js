import { HistoryPage } from '@/components/admin/history-page';
import type { Filters } from '@/lib/sqlite/catalog';
export const metadata={title:'ประวัติการยืม-คืนครุภัณฑ์'};
export default function Page({searchParams}:{searchParams:Promise<Filters>}){return <HistoryPage searchParams={searchParams}/>;}
