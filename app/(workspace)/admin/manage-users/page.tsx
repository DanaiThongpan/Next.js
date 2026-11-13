import { UserCatalogPage } from '@/components/admin/user-catalog-page';
import type { Filters } from '@/lib/sqlite/catalog';
export const metadata = { title: 'จัดการข้อมูลผู้ใช้ - Admin System' };
export default function Page({searchParams}:{searchParams:Promise<Filters>}) { return <UserCatalogPage searchParams={searchParams}/>; }
