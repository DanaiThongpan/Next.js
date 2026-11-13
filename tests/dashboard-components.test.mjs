import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const require = createRequire(import.meta.url);
const charts = [];
const source = readFileSync(new URL('../components/admin/dashboard-widgets.tsx', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
const compiledModule = { exports: {} };
const mocks = {
  'next/link': { default: ({ children, ...props }) => React.createElement('a', props, children), __esModule: true },
  './icon': { Icon: () => null },
  './dashboard-chart': { DashboardChart: props => { charts.push(props); return React.createElement('canvas', { 'data-kind': props.kind }); } },
  './dashboard-controls': { DashboardRefresh: () => React.createElement('button', null, 'Refresh') },
};
new Function('require', 'module', 'exports', compiled)(name => mocks[name] ?? require(name), compiledModule, compiledModule.exports);
const { DashboardWidgets } = compiledModule.exports;
const ready = value => ({ state: 'ready', value });
function fixture() {
  return { total: ready(20), borrowed: ready(2), overdue: ready(1), pending: ready(3), maintenance: ready(4), available: ready(14), category: ready([{ label: 'Fixture category', total: 20 }]), recent: ready([{ id: 'fixture', number: '<script>alert(1)</script>', name: 'Fixture asset', borrower: 'Fixture borrower', date: '2026-11-04', returned: false, pendingReturn: true, overdue: true }]), sidebarPending: ready(3), sidebarOverdue: ready(1), sync: ready('04/11/2026 12:00'), mode: 'normal', generatedAt: '2026-11-04T05:00:00Z' };
}
function render(data, connectionError = false) { charts.length = 0; return renderToStaticMarkup(React.createElement(DashboardWidgets, { data, connectionError, showSync: true })); }
test('actual dashboard component renders mapped counts, escaped activity and raw chart inputs', () => {
  const html = render(fixture());
  assert.match(html, /stat-number">20</);
  assert.match(html, /Fixture asset/);
  assert.match(html, /รออนุมัติคืน/);
  assert.ok(!html.includes('<script>'));
  assert.match(html, /&lt;script&gt;/);
  assert.deepEqual(charts.map(c => c.values), [[14, 2, 4], [20]]);
});
test('schema gaps do not render invented counts or charts', () => {
  const data = fixture();
  for (const key of Object.keys(data)) if (data[key]?.state) data[key] = { state: 'unmapped', missing: ['fixture.column'] };
  const html = render(data);
  assert.match(html, /รอการตรวจสอบ Schema/);
  assert.ok(!html.includes('stat-number'));
  assert.equal(charts.length, 0);
});
test('successful empty reads and failed reads have distinct visible states', () => {
  const data = fixture(); data.category = ready([]); data.recent = ready([]);
  let html = render(data);
  assert.match(html, /ยังไม่มีข้อมูลหมวดหมู่/);
  assert.match(html, /ยังไม่มีประวัติ/);
  data.category = { state: 'error' }; data.recent = { state: 'error' };
  html = render(data, true);
  assert.match(html, /ไม่สามารถโหลดข้อมูล/);
  assert.ok(!html.includes('ยังไม่มีประวัติ'));
  assert.equal(charts.filter(c => c.kind === 'category').length, 0);
});
