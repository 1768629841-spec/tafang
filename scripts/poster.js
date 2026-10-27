(function () {
  'use strict';
  const W = 780, M = 48, INK = '#1c1b1a', PAPER = '#f2efe9', LINE = '#d8d2c8', STRIP = '#f7f4ec';
  const FAMILY = '"PingFang SC", "Microsoft YaHei", Arial, sans-serif';
  function create(result) {
    return new Promise((resolve, reject) => {
      try {
        const stage = document.createElement('canvas');
        stage.width = W; stage.height = 6000;
        const ctx = stage.getContext('2d');
        if (!ctx) throw new Error('Canvas unavailable');
        ctx.fillStyle = '#fbfaf7'; ctx.fillRect(0, 0, W, stage.height);
        ctx.textBaseline = 'top';
        let y = 47;
        function text(str, x, top, size = 24, color = INK, weight = 400, family = FAMILY) {
          ctx.fillStyle = color; ctx.font = `${weight} ${size}px ${family}`; ctx.fillText(str, x, top);
        }
        function lines(str, width, size, weight = 400) {
          ctx.font = `${weight} ${size}px ${FAMILY}`;
          const rows = []; let line = '';
          for (const char of String(str)) {
            if (char === '\n') { rows.push(line); line = ''; continue; }
            if (ctx.measureText(line + char).width > width && line) { rows.push(line); line = char; } else line += char;
          }
          if (line) rows.push(line); return rows;
        }
        function wrapped(str, x, top, width, size = 24, height = 40, color = INK, weight = 400) {
          const rows = lines(str, width, size, weight);
          rows.forEach((row, i) => text(row, x, top + i * height, size, color, weight));
          return rows.length * height;
        }
        function rule(top) { ctx.fillStyle = LINE; ctx.fillRect(M, top, W - M * 2, 1); }
        function section(label, str) {
          rule(y); y += 30;
          text(label, M, y, 20, result.color, 600); y += 40;
          y += wrapped(str, M, y, W - M * 2, 25, 42, '#3f3a33'); y += 26;
        }
        ctx.fillStyle = result.color; ctx.fillRect(0, 0, W, 10);
        text('✦  DEBUT LAB', M, y, 23, INK, 700);
        text('OFFICIAL INCIDENT REPORT', 400, y + 3, 15, '#77776f'); y += 53; rule(y); y += 41;
        text(result.kicker, M, y, 21, result.color, 500); y += 49;
        const titleSize = result.name.length > 6 ? 58 : 72;
        y += wrapped(result.name, M, y, W - M * 2 - 80, titleSize, titleSize + 8, INK, 700);
        text('✦', W - M - 74, y - 75, 73, result.color);
        y += 1;
        text(result.english, M, y, 37, result.color, 400, 'Georgia, serif'); y += 65;
        y += wrapped(result.tagline, M, y, W - M * 2, 25, 39, '#3f3a33'); y += 20;
        y += wrapped(result.tags.map(tag => '# ' + tag).join('   '), M, y, W - M * 2, 20, 31, '#77776f'); y += 30;

        // 塌房时间 / 引爆人 / 事故等级
        const stripH = 96, colW = (W - M * 2) / 3;
        ctx.fillStyle = STRIP; ctx.fillRect(M, y, W - M * 2, stripH);
        ctx.fillStyle = LINE; ctx.fillRect(M, y, W - M * 2, 1); ctx.fillRect(M, y + stripH - 1, W - M * 2, 1);
        const stripLabels = ['塌房时间 / TIMELINE', '引爆人 / TRIGGER', '事故等级 / LEVEL'];
        const stripValues = [result.timeline, result.trigger, result.level];
        stripLabels.forEach((label, i) => {
          const x = M + colW * i;
          if (i > 0) { ctx.fillStyle = LINE; ctx.fillRect(x, y + 16, 1, stripH - 32); }
          text(label, x + 20, y + 21, 14, '#7d786e');
          if (i === 2) text(stripValues[i], x + 20, y + 44, 34, result.color, 800, 'Georgia, serif');
          else text(stripValues[i], x + 20, y + 47, 22, INK, 600);
        });
        y += stripH + 1;
        rule(y); y += 26;

        text('事故定性', M, y, 20, '#77776f');
        y += Math.max(34, wrapped(result.position, M + 143, y - 2, W - M * 2 - 143, 24, 37, INK, 500)); y += 25; rule(y); y += 35;
        result.stats.forEach((stat, i) => {
          const x = M + (i % 2) * 354, rowY = y + Math.floor(i / 2) * 49;
          text(stat.label, x, rowY, 21, '#77776f');
          for (let s = 0; s < 5; s++) text('★', x + 110 + s * 28, rowY - 1, 23, s < stat.value ? result.color : '#d8d4c8');
        }); y += 163;
        section('01  /  事故经过', result.core);
        const quote = `“${result.quote}”`, quoteRows = lines(quote, W - M * 2 - 56, 31, 600);
        const quoteHeight = 91 + quoteRows.length * 49;
        ctx.fillStyle = PAPER; ctx.fillRect(M, y, W - M * 2, quoteHeight);
        text('FANS LATER  /  粉丝后来说', M + 28, y + 25, 18, '#77776f');
        wrapped(quote, M + 28, y + 67, W - M * 2 - 56, 31, 49, INK, 600); y += quoteHeight + 29;
        section('02  /  塌房现场', result.scene);
        rule(y); y += 31; text('03  /  粉丝去留', M, y, 20, result.color, 600); y += 47;
        const colors = [result.color, '#c2a996', '#b3b3a8', '#d8d4c8']; let barX = M;
        result.fans.forEach((fan, i) => { const width = (W - M * 2) * fan.value / 100; ctx.fillStyle = colors[i]; ctx.fillRect(barX, y, width, 17); barX += width; }); y += 41;
        result.fans.forEach((fan, i) => {
          const x = M + (i % 2) * 354, rowY = y + Math.floor(i / 2) * 44;
          ctx.fillStyle = colors[i]; ctx.beginPath(); ctx.arc(x + 5, rowY + 12, 5, 0, Math.PI * 2); ctx.fill();
          text(fan.label, x + 21, rowY, 22, '#5f5c53'); text(`${fan.value}%`, x + 247, rowY, 24);
        }); y += 107;
        rule(y); y += 29; text('AFTERMATH  /  事后忠告', M, y, 18, result.color); y += 35;
        y += wrapped(result.advice, M, y, W - M * 2, 22, 35, '#5f5c53'); y += 35;
        rule(y); y += 26;
        text('每个人，都有自己的塌房方式。', M, y, 20, INK, 500); y += 39;
        text('星级与比例均为虚构设定 · 仅供娱乐', M, y, 17, '#77776f'); y += 29;
        text('不指向任何真实人物或事件 · 塌房型爱豆测评', M, y, 17, '#77776f'); y += 44;
        const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = y;
        canvas.getContext('2d').drawImage(stage, 0, 0, W, y, 0, 0, W, y);
        canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Image export failed')), 'image/png');
      } catch (error) { reject(error); }
    });
  }
  window.IdolPoster = {create};
}());
