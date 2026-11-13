'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Chart from 'chart.js/auto';
import type { Plugin } from 'chart.js';
import { visualSlices } from '@/lib/dashboard/model';
export function DashboardChart({ kind, labels, values, navigateOnClick = true }: { kind: 'status' | 'category'; labels: string[]; values: number[]; navigateOnClick?: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const router = useRouter();
  useEffect(() => {
    if (!canvas.current) return;
    if (kind === 'status') {
      const center: Plugin<'doughnut'> = { id: 'statusCenterText', beforeDraw(chart) {
        const { ctx, chartArea } = chart;
        if (!chartArea) return;
        const x = (chartArea.left + chartArea.right) / 2, y = (chartArea.top + chartArea.bottom) / 2;
        ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = "700 20px 'Prompt','Sarabun',sans-serif"; ctx.fillStyle = '#1e293b';
        ctx.fillText(values.reduce((a, b) => a + b, 0).toLocaleString('th-TH'), x, y - 9);
        ctx.font = "500 11px 'Prompt','Sarabun',sans-serif"; ctx.fillStyle = '#64748b'; ctx.fillText('ครุภัณฑ์ทั้งหมด', x, y + 13); ctx.restore();
      } };
      const chart = new Chart(canvas.current, { type: 'doughnut', plugins: [center], data: { labels, datasets: [{ data: visualSlices(values), backgroundColor: ['#10b981', '#f59e0b', '#ef4444'], hoverBackgroundColor: ['#059669', '#d97706', '#dc2626'], borderWidth: 1.5, borderColor: '#ffffff', hoverOffset: 6 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '70%', onClick(_event, elements) { if (navigateOnClick && elements[0]) router.push(elements[0].index === 1 ? '/admin/history' : '/admin/assets'); }, plugins: { legend: { display: false }, tooltip: { callbacks: { label(context) { const total = values.reduce((a, b) => a + b, 0); const value = values[context.dataIndex]; const share = total > 0 ? value / total * 100 : 0; return `${labels[context.dataIndex]}: ${value.toLocaleString('th-TH')} รายการ (${share > 0 && share < 0.01 ? '<0.01' : share.toLocaleString('th-TH', { maximumFractionDigits: 2 })}%)`; } } } } } });
      return () => chart.destroy();
    }
    const chart = new Chart(canvas.current, { type: 'bar', data: { labels, datasets: [{ label: 'จำนวนครุภัณฑ์ (ชิ้น)', data: values, backgroundColor: 'rgba(30,60,114,.85)', hoverBackgroundColor: '#1e3c72', borderRadius: 8, barPercentage: .65 }] }, options: { responsive: true, maintainAspectRatio: false, onClick(_event, elements) { if (navigateOnClick && elements.length) router.push('/admin/reports'); }, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { font: { family: 'Prompt, Sarabun, sans-serif', size: 11 } } }, y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,.05)' }, ticks: { precision: 0 } } } } });
    return () => chart.destroy();
  }, [kind, labels, values, router, navigateOnClick]);
  return <div style={{ position: 'relative', height: kind === 'status' ? 210 : 280, width: kind === 'status' ? 210 : '100%', maxWidth: '100%' }}><canvas ref={canvas} role="img" aria-label={`${kind === 'status' ? 'สัดส่วนสถานะครุภัณฑ์' : 'จำนวนครุภัณฑ์ตามหมวดหมู่'}: ${labels.map((label, i) => `${label} ${values[i]}`).join(', ')}`} /></div>;
}
