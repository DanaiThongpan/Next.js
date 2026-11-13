import { AssetPage } from '@/components/admin/asset-page';
import type { Filters } from '@/lib/sqlite/catalog';
export default function Page({searchParams}:{searchParams:Promise<Filters>}) {return <AssetPage searchParams={searchParams}/>;}
