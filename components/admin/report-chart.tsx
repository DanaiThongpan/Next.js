'use client';

import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

export function ReportChart({ type, labels, series, horizontal = false }: {
  type: 'doughnut' | 'bar' | 'line' | 'polarArea';
  labels: string[];
  series: { label: string; values: number[]; color: string | string[] }[];
  horizontal?: boolean;
}) {
  const rankedAssets = type === 'bar' && horizontal;
  const radial = type === 'polarArea';
  const canvas = useRef<HTMLCanvasElement>(null);
  const hasData = series.some(item => item.values.some(value => Number.isFinite(value) && value > 0));
  useEffect(() => {
    if (!canvas.current || !hasData) return;
    const chart = new Chart(canvas.current, {
      type,
      data: { labels, datasets: series.map(item => ({
        label: item.label,
        data: item.values.map(value => Number.isFinite(value) ? value : 0),
        backgroundColor: type === 'line' && typeof item.color === 'string' ? item.color + '25' : item.color,
        fill: type === 'line',
        borderColor: type === 'doughnut' || radial ? '#fff' : item.color,
        hoverBackgroundColor: rankedAssets ? '#7c3aed' : undefined,
        tension: type === 'line' ? 0.4 : 0,
        cubicInterpolationMode: type === 'line' ? 'monotone' : undefined,
        borderRadius: rankedAssets ? 8 : type === 'bar' ? 6 : 0,
        borderWidth: type === 'doughnut' ? 0 : radial ? 2 : undefined,
      })) },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: horizontal ? 'y' : 'x',
        plugins: {
          legend: {
            display: type !== 'bar' && type !== 'doughnut',
            position: type === 'line' ? 'top' : 'bottom',
            labels: radial ? { boxWidth: 12, padding: 14, font: { family: 'Prompt, Sarabun, sans-serif', size: 11 } } : undefined,
          },
          tooltip: {
            callbacks: rankedAssets || radial ? {
              title: rankedAssets ? entries => labels[entries[0]?.dataIndex] ?? '' : undefined,
              label: entry => rankedAssets ? `ถูกยืมทั้งหมด ${entry.raw} ครั้ง` : `${entry.label}: ${entry.raw} ครั้ง`,
            } : undefined,
          },
        },
        scales: rankedAssets ? {
          x: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { precision: 0 } },
          y: {
            grid: { display: false },
            ticks: {
              font: { family: 'Prompt, Sarabun, sans-serif', size: 11 },
              callback(value) {
                const label = Array.from(this.getLabelForValue(Number(value)).trim());
                return label.length > 30 ? label.slice(0, 28).join('') + '…' : label.join('');
              },
            },
          },
        } : undefined,
      },
    });
    return () => chart.destroy();
  }, [type, labels, series, horizontal, hasData, rankedAssets, radial]);
  return hasData
    ? <div className="chart-box"><canvas ref={canvas} role="img" aria-label={series.map(item => item.label).join(', ')}/></div>
    : <p className="text-center text-muted py-5 mb-0">ไม่มีข้อมูลสำหรับแสดงกราฟ</p>;
}
