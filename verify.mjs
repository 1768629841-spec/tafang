// 数据校验 + 平衡度统计
// 用法: node verify.mjs
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const Q = JSON.parse(fs.readFileSync('./data/questions.json', 'utf8'));
const R = JSON.parse(fs.readFileSync('./data/results.json', 'utf8'));
const Core = require('./scripts/core.js');

// 1) 结构校验（复用引擎自带校验）
try {
  Core.validateData(Q, R);
  console.log('[OK] 结构校验通过');
} catch (e) {
  console.error('[FAIL] 结构校验失败:', e.message);
  process.exit(1);
}

// 2) 入口统计
const ids = R.tieBreakOrder;
const entries = Object.fromEntries(ids.map(id => [id, 0]));
const maxScore = Object.fromEntries(ids.map(id => [id, 0]));
const perQuestion = [];

Q.questions.forEach((q) => {
  const inQ = {}, topTypes = new Set();
  q.options.forEach(o => {
    const pairs = Object.entries(o.scores).filter(([, w]) => w > 0);
    pairs.forEach(([id, w]) => {
      entries[id] = (entries[id] || 0) + 1;
      inQ[id] = Math.max(inQ[id] || 0, w);
    });
    // 主类型 = 该选项得分最高的类型（决定结果的那一分）
    const top = pairs.sort((a, b) => b[1] - a[1])[0][0];
    topTypes.add(top);
  });
  Object.entries(inQ).forEach(([id, w]) => { maxScore[id] += w; });
  perQuestion.push({ q: q.id, covered: topTypes.size, topTypes: [...topTypes] });
});

console.log('\n[入口数 / 最大可得]');
ids.forEach(id => {
  const r = R.results.find(x => x.id === id);
  console.log(`  ${id.padEnd(9)} ${r.name.padEnd(5)} 入口 ${String(entries[id]).padStart(2)}  最大可得 ${String(maxScore[id]).padStart(2)}`);
});

// 3) 平衡度
const vals = ids.map(id => maxScore[id]);
const max = Math.max(...vals), min = Math.min(...vals);
console.log(`\n[平衡] max=${max} min=${min} 差异=${((max - min) / max * 100).toFixed(1)}%  ${max === min ? '✓ 完全均衡' : '⚠ 不均衡'}`);

// 4) 每题覆盖类型数
const bad = perQuestion.filter(p => p.covered !== 4 || new Set(p.topTypes).size !== 4);
console.log(`[每题覆盖] ${bad.length ? '异常: ' + JSON.stringify(bad) : '每题主类型恰好 4 个且不重复 ✓'}`);

// 5) 可达性：每类型构造一条满分路径，确认它排第一
console.log('\n[可达性]');
ids.forEach(target => {
  const answers = Q.questions.map(q => {
    const own = q.options.find(o => (o.scores[target] || 0) >= 3);
    if (own) return own.id;
    // 该题无 target 入口：选一个不给别人加分的（必然不存在），选第一个
    return q.options[0].id;
  });
  const res = Core.calculateResult(Q.questions, R, answers);
  const ok = res.resultId === target;
  console.log(`  ${ok ? '✓' : '✗'} ${target.padEnd(9)} 命中=${res.resultId.padEnd(9)} 得分=${res.scores[target]}${ok ? '' : '  <-- 需检查'}`);
});

// 6) 随机模拟：各类型出现频率
const rand = (n) => Math.floor(Math.random() * n);
const tally = Object.fromEntries(ids.map(id => [id, 0]));
const N = 20000;
for (let i = 0; i < N; i++) {
  const answers = Q.questions.map(q => q.options[rand(4)].id);
  const r = Core.calculateResult(Q.questions, R, answers);
  tally[r.resultId]++;
}
console.log('\n[随机作答 20000 次分布]');
ids.forEach(id => {
  const pct = tally[id] / N * 100;
  const bar = '█'.repeat(Math.round(pct));
  console.log(`  ${R.results.find(x => x.id === id).name.padEnd(5)} ${pct.toFixed(1).padStart(5)}% ${bar}`);
});
