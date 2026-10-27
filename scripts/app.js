(function () {
  'use strict';
  const app = document.getElementById('app');
  const storageKey = 'incident-lab-session-v1';
  let questions, resultData, fingerprint, answers = [], current = 0, screen = 'home', posterUrl = null;
  const esc = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const pad = n => String(n).padStart(2, '0');
  const brand = '<div class="brand"><span class="brand-icon" aria-hidden="true">✦</span> DEBUT LAB</div>';
  const header = (right = 'INCIDENT FILE / 事故档案') => `<header class="masthead">${brand}<span class="issue">${right}</span></header>`;
  const footer = '<footer class="footer"><span><span class="star">✦</span> 原创情境 · 娱乐测试 · 不指向任何真实人物或事件</span><span>EVERYONE HAS A FALL.</span></footer>';
  const fansColors = result => [result.color, '#c59a83', '#b6beb0', '#d8d4c9'];
  function saveState() {
    try { sessionStorage.setItem(storageKey, JSON.stringify({fingerprint, answers, current, screen})); } catch (_) { /* Storage is optional. */ }
  }
  function restoreState() {
    try {
      const state = JSON.parse(sessionStorage.getItem(storageKey));
      if (!state || state.fingerprint !== fingerprint || !Array.isArray(state.answers) || state.answers.length > questions.length) return;
      if (!state.answers.every((answer, i) => questions[i].options.some(option => option.id === answer))) return;
      if (!Number.isInteger(state.current) || state.current < 0 || state.current >= questions.length || state.current > state.answers.length) return;
      if (!['home', 'quiz', 'result'].includes(state.screen)) return;
      if (state.screen === 'result' && state.answers.length !== questions.length) return;
      answers = state.answers; current = state.current; screen = state.screen;
    } catch (_) { /* Invalid/blocked browser storage starts a fresh test. */ }
  }
  function render({focus = true} = {}) {
    if (screen === 'quiz') renderQuiz();
    else if (screen === 'result') renderResult();
    else renderHome();
    saveState();
    window.scrollTo({top: 0, behavior: 'instant'});
    if (focus) app.querySelector('h1')?.focus({preventScroll: true});
  }
  function renderHome() {
    const hasProgress = answers.length > 0;
    app.innerHTML = `<div class="shell screen-enter">${header()}<main>
      <div class="home-grid"><div class="desktop-edition">THE INCIDENT FILE — 001</div>
        <div class="home-copy"><div class="eyebrow"><span class="live-dot"></span> YOUR DOWNFALL STARTS HERE</div>
          <h1 class="home-title" tabindex="-1">如果真让你出道，<br>你会<span class="red">怎么塌？</span></h1>
          <p class="home-description">聚光灯亮起的那一秒，考古帖也同步开始了。<br><strong>${questions.length} 道情境题，生成你的塌房事故档案。</strong></p>
          <div class="home-action">${hasProgress ? `<div class="resume-note"><span>已作答 ${answers.length} / ${questions.length} 题</span><button data-action="reset">清空重来</button></div>` : ''}
            <button class="primary" data-action="start">${hasProgress ? (answers.length === questions.length ? '查看我的事故档案' : '继续我的事故调查') : '开始我的塌房档案'}<span aria-hidden="true">↗</span></button>
            <div class="home-meta"><span>${questions.length} 道题</span><span>约 ${Math.max(1, Math.round(questions.length / 7))}–${Math.max(2, Math.round(questions.length / 5))} 分钟</span><span>${resultData.results.length} 种塌房方式</span></div>
          </div>
        </div>
        <div class="home-visual"><span class="handwritten">Born to fall.</span><img src="./assets/incident-file.svg" alt="原创米色事故档案袋与归档印章" width="640" height="570"><div class="visual-caption"><span>NO SCANDAL NEEDED</span><span>✦ IT ONLY TAKES ONE</span></div></div>
      </div>
      <div class="lineup"><div class="lineup-title"><span>THE INCIDENT TYPES</span><span>你会是哪种？</span></div><div class="persona-tags">${resultData.results.map(r => `<span class="persona-tag">${esc(r.name)}</span>`).join('')}</div></div>
    </main>${footer}</div>`;
  }
  function renderQuiz() {
    const question = questions[current];
    const selected = answers[current];
    app.innerHTML = `<div class="test-shell screen-enter">${header('<button class="quiet-button" data-action="home">返回首页 ↗</button>')}<main>
      <div class="quiz-header"><span class="chapter-label">${esc(question.chapter)}</span><div class="progress-number"><b>${pad(current + 1)}</b> / ${pad(questions.length)}</div></div>
      <div class="progress-track" role="progressbar" aria-label="答题进度" aria-valuemin="0" aria-valuemax="${questions.length}" aria-valuenow="${current + 1}"><div class="progress-fill" style="width:${(current + 1) / questions.length * 100}%"></div></div>
      <div class="question-id">Question ${pad(current + 1)}.</div><h1 class="question-title" id="question-title" tabindex="-1">${esc(question.title)}</h1>
      <p class="question-hint">跟着第一反应选，没有标准答案。</p>
      <div class="options" role="group" aria-labelledby="question-title">${question.options.map((option, i) => `<button class="option" data-option="${esc(option.id)}" aria-pressed="${selected === option.id}"><span class="option-letter" aria-hidden="true">${String.fromCharCode(65 + i)}</span><span class="option-text">${esc(option.text)}</span></button>`).join('')}</div>
      <div class="quiz-actions"><button class="quiet-button" data-action="back" ${current === 0 ? 'disabled style="visibility:hidden"' : ''}>← 上一题</button><button class="primary" data-action="next" ${selected ? '' : 'disabled'}>${current === questions.length - 1 ? '生成我的事故档案' : '下一题'}<span aria-hidden="true">→</span></button></div>
      <p class="test-note">${current === questions.length - 1 ? '档案就快写完了，就差最后一句口供。' : '没有标准答案，只有你真实的选择。'}</p>
    </main></div>`;
  }
  function getResult() {
    const {resultId} = IdolCore.calculateResult(questions, resultData, answers);
    return resultData.results.find(result => result.id === resultId);
  }
  function renderResult() {
    const result = getResult(), colors = fansColors(result), number = pad(resultData.results.indexOf(result) + 1);
    app.innerHTML = `<div class="result-shell screen-enter">${header('INCIDENT FILE')}<main>
      <div class="result-intro"><b>你的塌房事故档案已归档</b><span>${questions.length} / ${questions.length} COMPLETED ✦</span></div>
      <article class="result-card" id="result-card" style="--accent:${esc(result.color)}">
        <div class="card-topline"><span>OFFICIAL INCIDENT REPORT</span><span>TYPE ${number} / ${pad(resultData.results.length)}</span></div>
        <div class="persona-hero"><p class="persona-kicker">${esc(result.kicker)}</p><h1 class="persona-name" tabindex="-1">${esc(result.name)}</h1><div class="persona-english">${esc(result.english)}</div><span class="persona-emblem" aria-hidden="true">✦</span><p class="persona-tagline">${esc(result.tagline)}</p><div class="result-tags">${result.tags.map(tag => `<span># ${esc(tag)}</span>`).join('')}</div></div>
        <div class="incident-strip">
          <div class="incident-item"><span>塌房时间 / TIMELINE</span><b>${esc(result.timeline)}</b></div>
          <div class="incident-item"><span>引爆人 / TRIGGER</span><b>${esc(result.trigger)}</b></div>
          <div class="incident-item"><span>事故等级 / LEVEL</span><b class="level">${esc(result.level)}</b></div>
        </div>
        <div class="role-strip"><span>事故定性 / VERDICT</span><b>${esc(result.position)}</b></div>
        <div class="stats-grid">${result.stats.map(stat => `<div class="stat"><span class="stat-label">${esc(stat.label)}</span><span class="stars" role="img" aria-label="${stat.value} 星，共 5 星">${'★'.repeat(stat.value)}<span class="empty">${'★'.repeat(5 - stat.value)}</span></span></div>`).join('')}</div>
        <div class="card-body">
          <section class="result-section"><h2 class="section-label"><span class="label-no">01</span> 事故经过</h2><p>${esc(result.core)}</p></section>
          <section class="result-section quote-section"><h2 class="section-label">FANS LATER / 粉丝后来说</h2><blockquote>“${esc(result.quote)}”</blockquote></section>
          <section class="result-section"><h2 class="section-label"><span class="label-no">02</span> 塌房现场</h2><p>${esc(result.scene)}</p></section>
          <section class="result-section"><h2 class="section-label"><span class="label-no">03</span> 粉丝去留</h2><div class="fan-bar" aria-hidden="true">${result.fans.map((fan, i) => `<span style="width:${fan.value}%;background:${colors[i]}"></span>`).join('')}</div><div class="fan-legend">${result.fans.map((fan, i) => `<div class="fan-item"><span class="fan-dot" style="background:${colors[i]}"></span><span>${esc(fan.label)}</span><b>${fan.value}%</b></div>`).join('')}</div></section>
        </div>
        <div class="card-advice"><b>AFTERMATH / 事后忠告</b>${esc(result.advice)}</div>
        <div class="card-foot"><strong>✦ DEBUT LAB</strong><p>星级与比例均为虚构设定<br>仅供娱乐 · 不指向任何真实人物或事件</p></div>
      </article>
      <div class="result-actions"><button class="primary" data-action="save">保存结果图<span aria-hidden="true">↓</span></button><button class="secondary" data-action="reset">↻ 重新测试</button></div><p class="save-hint" id="save-status" role="status">把这份档案发给最想嘲笑你的那个人。也可以直接截图分享。</p>
    </main>${footer}</div>`;
  }
  async function showPoster() {
    const button = app.querySelector('[data-action="save"]');
    const status = document.getElementById('save-status');
    button.disabled = true; status.textContent = '正在制作你的结果图…';
    try {
      const result = getResult();
      const blob = await IdolPoster.create(result);
      if (posterUrl) URL.revokeObjectURL(posterUrl);
      posterUrl = URL.createObjectURL(blob);
      const img = document.getElementById('poster-image');
      img.src = posterUrl; img.alt = `${result.name} · 完整塌房事故档案`;
      const download = document.getElementById('download-poster');
      download.href = posterUrl; download.download = `我的塌房档案-${result.name}.png`;
      document.getElementById('poster-dialog').showModal();
      status.textContent = '图片已生成，点击下载或在预览中长按保存。';
    } catch (error) {
      status.textContent = '图片暂时未能生成，可以直接截图保存结果。';
    } finally { button.disabled = false; }
  }
  app.addEventListener('click', event => {
    const option = event.target.closest('[data-option]');
    if (option && screen === 'quiz') {
      answers[current] = option.dataset.option;
      app.querySelectorAll('[data-option]').forEach(button => button.setAttribute('aria-pressed', String(button === option)));
      app.querySelector('[data-action="next"]').disabled = false;
      saveState(); return;
    }
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (!action) return;
    if (action === 'save') { showPoster(); return; }
    if (action === 'home') screen = 'home';
    if (action === 'reset') { answers = []; current = 0; screen = 'quiz'; }
    if (action === 'start') {
      screen = answers.length === questions.length ? 'result' : 'quiz';
      if (screen === 'quiz') current = Math.min(current, answers.length);
    }
    if (action === 'back' && screen === 'quiz' && current > 0) current--;
    if (action === 'next' && screen === 'quiz') {
      if (!answers[current]) return;
      if (current === questions.length - 1) screen = 'result'; else current++;
    }
    render();
  });
  const dialog = document.getElementById('poster-dialog');
  document.getElementById('close-poster').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
  async function init() {
    try {
      const [questionData, results] = await Promise.all(['questions', 'results'].map(async file => {
        const response = await fetch(`./data/${file}.json`, {cache: 'no-cache'});
        if (!response.ok) throw new Error('Data unavailable');
        return response.json();
      }));
      IdolCore.validateData(questionData, results);
      questions = questionData.questions; resultData = results;
      // Content changes invalidate saved sessions, including edits that retain IDs/version.
      const source = JSON.stringify([questionData, results]); let hash = 2166136261;
      for (let i = 0; i < source.length; i++) hash = Math.imul(hash ^ source.charCodeAt(i), 16777619);
      fingerprint = String(hash >>> 0);
      restoreState(); render({focus: false});
    } catch (error) {
      app.innerHTML = `<main class="loading"><span class="spark">✦</span><h1 style="font-size:22px;color:#252623">档案还在调取中</h1><p>${location.protocol === 'file:' ? '请使用源码包中的「启动预览.cmd」打开本地网站。' : '题目暂时没有加载成功，请刷新重试。'}</p><button class="primary" id="retry-load">重新加载 <span>↻</span></button></main>`;
      document.getElementById('retry-load').addEventListener('click', () => location.reload());
      console.error('Quiz initialization failed:', error.message);
    }
  }
  init();
}());
