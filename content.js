(() => {
  'use strict';

  const STORAGE_KEY = 'uneti_th_courses_v2';
  const ROOT_ID = 'uneti-th-extension-root';
  const SCAN_HINT_KEY = 'uneti_th_last_scan_v2';

  function uid() {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function norm(value = '') {
    return String(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function cleanText(value = '') {
    return String(value).replace(/\s+/g, ' ').trim();
  }

  function parseDayFromText(value = '') {
    const text = norm(value);
    const weekday = text.match(/\bthu\s*([2-7])\b/);
    if (weekday) return Number(weekday[1]);
    if (/\bchu\s*nhat\b/.test(text)) return 8;
    return null;
  }

  function parseScheduleInput(value = '') {
    const text = norm(value);
    const day = parseDayFromText(text);
    if (!day) return null;

    const period = text.match(/\btiet\s*:?\s*(\d{1,2})\s*(?:-|–|—|den|toi)\s*(\d{1,2})\b/);
    if (!period) return null;

    const start = Number(period[1]);
    const end = Number(period[2]);
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end > 15 || start > end) return null;

    let session = null;
    let sessionStart = null;
    let sessionEnd = null;
    if (start >= 1 && end <= 6) {
      session = 'morning'; sessionStart = 1; sessionEnd = 6;
    } else if (start >= 7 && end <= 12) {
      session = 'afternoon'; sessionStart = 7; sessionEnd = 12;
    } else if (start >= 13 && end <= 15) {
      session = 'evening'; sessionStart = 13; sessionEnd = 15;
    } else {
      return null;
    }

    return { day, start, end, session, sessionStart, sessionEnd };
  }

  function buildCalendarCardHtml(course, placement) {
    const classLine = [cleanText(course.classCode || ''), cleanText(course.code || '')].filter(Boolean).join(' - ');
    const room = cleanText(course.room || '');
    const lecturer = cleanText(course.lecturer || '');
    return `
      <strong class="uneti-th-calendar-name">${escapeHtml(course.name || '')}</strong>
      ${classLine ? `<div>${escapeHtml(classLine)}</div>` : ''}
      <div>Tiết: ${placement.start} - ${placement.end}</div>
      ${room ? `<div>Phòng: ${escapeHtml(room)}</div>` : ''}
      ${lecturer ? `<div>GV: ${escapeHtml(lecturer)}</div>` : ''}
    `;
  }

  function findWeeklyScheduleTable() {
    let best = null;

    for (const table of document.querySelectorAll('table')) {
      const rows = [...table.querySelectorAll('tr')];
      if (rows.length < 3) continue;

      for (const row of rows.slice(0, 5)) {
        const cells = [...row.querySelectorAll('th,td')];
        if (cells.length < 5) continue;

        const dayColumns = new Map();
        cells.forEach((cell, index) => {
          const day = parseDayFromText(cell.innerText || cell.textContent || '');
          if (day) dayColumns.set(day, index);
        });
        if (dayColumns.size < 5) continue;

        const sessionRows = new Map();
        for (const candidate of rows) {
          const rowCells = [...candidate.querySelectorAll('th,td')];
          for (const cell of rowCells) {
            const label = norm(cell.innerText || cell.textContent || '');
            if (label === 'sang') sessionRows.set('morning', candidate);
            if (label === 'chieu') sessionRows.set('afternoon', candidate);
            if (label === 'toi') sessionRows.set('evening', candidate);
          }
        }

        if (sessionRows.size < 2) continue;
        const score = dayColumns.size * 10 + sessionRows.size;
        if (!best || score > best.score) best = { table, dayColumns, sessionRows, score };
      }
    }

    return best;
  }

  function clearCalendarCards() {
    for (const el of document.querySelectorAll('.uneti-th-calendar-card')) el.remove();
  }

  function getSessionTargetCell(schedule, placement) {
    const row = schedule?.sessionRows?.get(placement.session);
    const columnIndex = schedule?.dayColumns?.get(placement.day);
    if (!row || !Number.isInteger(columnIndex)) return null;
    const cells = [...row.querySelectorAll('th,td')];
    return cells[columnIndex] || null;
  }

  async function renderCalendarCourses() {
    clearCalendarCards();
    const schedule = findWeeklyScheduleTable();
    if (!schedule) return 0;

    const courses = (await loadCourses()).filter(isPracticeCourse);
    let rendered = 0;

    for (const course of courses) {
      const placement = parseScheduleInput(course.time || '');
      if (!placement) continue;
      const cell = getSessionTargetCell(schedule, placement);
      if (!cell) continue;

      if (cell.style) {
        const computed = typeof getComputedStyle === 'function' ? getComputedStyle(cell) : null;
        if (!computed || computed.position === 'static') cell.style.position = 'relative';
      }

      const card = document.createElement('div');
      card.className = 'uneti-th-calendar-card';
      card.dataset.courseId = course.id || courseKey(course);
      card.title = 'Lịch thực hành cá nhân';
      card.innerHTML = buildCalendarCardHtml(course, placement);

      const span = placement.sessionEnd - placement.sessionStart + 1;
      const top = ((placement.start - placement.sessionStart) / span) * 100;
      const height = ((placement.end - placement.start + 1) / span) * 100;
      card.style.top = `${top}%`;
      card.style.height = `${height}%`;
      cell.appendChild(card);
      rendered++;
    }

    return rendered;
  }

  function escapeHtml(value = '') {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  async function loadCourses() {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    return Array.isArray(result[STORAGE_KEY]) ? result[STORAGE_KEY] : [];
  }

  async function saveCourses(items) {
    await chrome.storage.local.set({ [STORAGE_KEY]: items });
  }

  function courseKey(course) {
    return `name:${norm(course.name || '')}`;
  }

  function isPracticeCourse(courseOrName) {
    const name = typeof courseOrName === 'string' ? courseOrName : courseOrName?.name;
    return norm(name || '').includes('thuc hanh');
  }

  function scoreCourseNameHeader(text) {
    const h = norm(text);
    if (!h || h.includes('ma hoc phan') || h.includes('ma mon')) return -1;
    if (h === 'ten hoc phan') return 100;
    if (h === 'ten mon hoc/hp' || h === 'ten mon hoc hp') return 100;
    if (h === 'ten mon hoc' || h === 'ten mon') return 95;
    if (h.includes('ten') && h.includes('hoc phan')) return 90;
    if (h.includes('ten') && h.includes('mon hoc')) return 90;
    if (h === 'hoc phan') return 80;
    if (h === 'mon hoc') return 80;
    if (h.includes('hoc phan') && !h.includes('nhom')) return 60;
    return -1;
  }

  function scoreCodeHeader(text) {
    const h = norm(text);
    if (h === 'ma hoc phan' || h === 'ma mon hoc' || h === 'ma mon') return 100;
    if (h === 'ma lop hp' || h === 'ma lop hoc phan') return 100;
    if (h.includes('ma') && h.includes('hoc phan')) return 90;
    if (h.includes('ma') && h.includes('lop') && /\bhp\b/.test(h)) return 90;
    if (h.includes('ma') && h.includes('mon')) return 80;
    return -1;
  }

  function scoreClassHeader(text) {
    const h = norm(text);
    if (h === 'lop hoc phan' || h === 'ma lop hoc phan') return 100;
    if (h === 'lop hoc du kien') return 100;
    if (h.includes('lop hoc phan')) return 90;
    if (h.includes('lop hoc') && h.includes('du kien')) return 90;
    return -1;
  }

  function isLikelyCourseName(name) {
    const n = cleanText(name);
    const x = norm(n);
    if (n.length < 3 || n.length > 180) return false;
    const banned = [
      'hoc phan cho dang ky', 'hoc phan da dang ky', 'mon hoc da dang ky',
      'thong ke mon hoc', 'dang ky hoc phan', 'ten hoc phan', 'mon hoc',
      'chua co du lieu', 'khong co du lieu', 'tong'
    ];
    if (banned.some(b => x === b || x.startsWith(`${b}:`))) return false;
    if (/^\d+[\s.,-]*$/.test(n)) return false;
    return true;
  }

  function extractFromHtmlTables() {
    const found = [];

    for (const table of document.querySelectorAll('table')) {
      const rows = [...table.querySelectorAll('tr')];
      if (rows.length < 2) continue;

      let headerRowIndex = -1;
      let nameIndex = -1;
      let codeIndex = -1;
      let classIndex = -1;
      let bestNameScore = -1;

      for (let r = 0; r < Math.min(rows.length, 6); r++) {
        const cells = [...rows[r].querySelectorAll('th,td')];
        if (!cells.length) continue;
        const texts = cells.map(c => cleanText(c.innerText || c.textContent || ''));
        for (let i = 0; i < texts.length; i++) {
          const score = scoreCourseNameHeader(texts[i]);
          if (score > bestNameScore) {
            bestNameScore = score;
            headerRowIndex = r;
            nameIndex = i;
          }
        }
      }

      if (headerRowIndex < 0 || nameIndex < 0 || bestNameScore < 60) continue;

      const headers = [...rows[headerRowIndex].querySelectorAll('th,td')]
        .map(c => cleanText(c.innerText || c.textContent || ''));

      for (let i = 0; i < headers.length; i++) {
        if (scoreCodeHeader(headers[i]) >= 80) codeIndex = i;
        if (scoreClassHeader(headers[i]) >= 80) classIndex = i;
      }

      for (let r = headerRowIndex + 1; r < rows.length; r++) {
        const cells = [...rows[r].querySelectorAll('td,th')];
        if (cells.length <= nameIndex) continue;

        const name = cleanText(cells[nameIndex]?.innerText || cells[nameIndex]?.textContent || '');
        if (!isLikelyCourseName(name)) continue;

        const code = codeIndex >= 0
          ? cleanText(cells[codeIndex]?.innerText || cells[codeIndex]?.textContent || '')
          : '';
        const classCode = classIndex >= 0
          ? cleanText(cells[classIndex]?.innerText || cells[classIndex]?.textContent || '')
          : '';

        found.push({ name, code, classCode, source: 'table' });
      }
    }

    return found;
  }

  function extractFromAriaGrids() {
    const found = [];
    const grids = document.querySelectorAll('[role="grid"], [role="table"]');

    for (const grid of grids) {
      const rows = [...grid.querySelectorAll('[role="row"]')];
      if (rows.length < 2) continue;

      const header = rows.find(row => {
        const cells = [...row.querySelectorAll('[role="columnheader"], [role="cell"], [role="gridcell"]')];
        return cells.some(c => scoreCourseNameHeader(c.innerText || c.textContent || '') >= 60);
      });
      if (!header) continue;

      const headers = [...header.querySelectorAll('[role="columnheader"], [role="cell"], [role="gridcell"]')]
        .map(c => cleanText(c.innerText || c.textContent || ''));

      let nameIndex = -1, codeIndex = -1, classIndex = -1, best = -1;
      headers.forEach((h, i) => {
        const ns = scoreCourseNameHeader(h);
        if (ns > best) { best = ns; nameIndex = i; }
        if (scoreCodeHeader(h) >= 80) codeIndex = i;
        if (scoreClassHeader(h) >= 80) classIndex = i;
      });
      if (nameIndex < 0) continue;

      for (const row of rows) {
        if (row === header) continue;
        const cells = [...row.querySelectorAll('[role="cell"], [role="gridcell"]')];
        if (cells.length <= nameIndex) continue;
        const name = cleanText(cells[nameIndex]?.innerText || cells[nameIndex]?.textContent || '');
        if (!isLikelyCourseName(name)) continue;
        found.push({
          name,
          code: codeIndex >= 0 ? cleanText(cells[codeIndex]?.innerText || cells[codeIndex]?.textContent || '') : '',
          classCode: classIndex >= 0 ? cleanText(cells[classIndex]?.innerText || cells[classIndex]?.textContent || '') : '',
          source: 'grid'
        });
      }
    }

    return found;
  }

  function extractFromKnownLabels() {
    const found = [];
    const selectors = [
      '[class*="hocphan" i]', '[id*="hocphan" i]',
      '[class*="course" i]', '[id*="course" i]',
      '[class*="monhoc" i]', '[id*="monhoc" i]'
    ];

    const candidates = document.querySelectorAll(selectors.join(','));
    for (const el of candidates) {
      if (el.closest(`#${ROOT_ID}`)) continue;
      if (el.children.length > 4) continue;
      const text = cleanText(el.innerText || el.textContent || '');
      if (!isLikelyCourseName(text)) continue;
      if (text.length > 120) continue;
      found.push({ name: text, code: '', classCode: '', source: 'label' });
    }
    return found;
  }

  function dedupeScanned(items) {
    const map = new Map();
    for (const item of items) {
      if (!isPracticeCourse(item)) continue;
      const key = courseKey(item);
      if (key.endsWith(':')) continue;

      const existing = map.get(key);
      if (!existing) {
        map.set(key, item);
        continue;
      }

      // Prefer the richer table/grid record over a text-only fallback duplicate.
      map.set(key, {
        ...existing,
        ...item,
        name: existing.name || item.name,
        code: existing.code || item.code || '',
        classCode: existing.classCode || item.classCode || '',
        source: existing.code || existing.classCode ? existing.source : item.source
      });
    }
    return [...map.values()];
  }

  function scanPageForCourses() {
    return dedupeScanned([
      ...extractFromHtmlTables(),
      ...extractFromAriaGrids(),
      ...extractFromKnownLabels()
    ]);
  }

  async function mergeScannedCourses(scanned) {
    if (!scanned.length) return { added: 0, total: (await loadCourses()).length };

    const current = (await loadCourses()).filter(isPracticeCourse);
    const map = new Map();
    for (const item of current) {
      const key = courseKey(item);
      const existing = map.get(key);
      if (!existing) {
        map.set(key, item);
      } else {
        map.set(key, {
          ...existing,
          ...item,
          id: existing.id || item.id,
          name: existing.name || item.name,
          code: existing.code || item.code || '',
          classCode: existing.classCode || item.classCode || '',
          time: existing.time || item.time || '',
          room: existing.room || item.room || '',
          lecturer: existing.lecturer || item.lecturer || ''
        });
      }
    }
    let added = 0;

    for (const incoming of scanned) {
      const key = courseKey(incoming);
      const existing = map.get(key);
      if (existing) {
        map.set(key, {
          ...existing,
          name: incoming.name || existing.name,
          code: incoming.code || existing.code,
          classCode: incoming.classCode || existing.classCode,
          detectedAt: new Date().toISOString()
        });
      } else {
        map.set(key, {
          id: uid(),
          name: incoming.name,
          code: incoming.code || '',
          classCode: incoming.classCode || '',
          time: '',
          room: '',
          lecturer: '',
          detectedAt: new Date().toISOString()
        });
        added++;
      }
    }

    const merged = [...map.values()];
    await saveCourses(merged);
    await chrome.storage.local.set({ [SCAN_HINT_KEY]: new Date().toISOString() });
    return { added, total: merged.length };
  }

  function createRoot() {
    if (document.getElementById(ROOT_ID)) return;

    const root = document.createElement('div');
    root.id = ROOT_ID;
    root.innerHTML = `
      <button id="uneti-th-launcher" type="button" title="Mở lịch thực hành">TH</button>

      <section id="uneti-th-panel" aria-label="Lịch thực hành cá nhân">
        <header class="uneti-th-header">
          <div>
            <div class="uneti-th-title">Lịch thực hành</div>
            <div class="uneti-th-subtitle">Tự lấy môn “Thực hành” · Nhập tiết, phòng và giảng viên · Tự hiện trên lịch tuần</div>
          </div>
          <button id="uneti-th-close" class="uneti-th-icon-btn" type="button" title="Đóng">×</button>
        </header>

        <div class="uneti-th-toolbar">
          <button id="uneti-th-scan" class="uneti-th-primary" type="button">↻ Quét lại</button>
          <button id="uneti-th-clear" class="uneti-th-danger-outline" type="button">Xóa dữ liệu</button>
        </div>

        <div id="uneti-th-status" class="uneti-th-status">Mở danh sách học phần đã đăng ký để extension tự đọc môn thực hành.</div>

        <div class="uneti-th-table-wrap">
          <table class="uneti-th-table">
            <thead>
              <tr>
                <th>Môn thực hành</th>
                <th>Thời gian / Tiết</th>
                <th>Phòng</th>
                <th>Giảng viên</th>
              </tr>
            </thead>
            <tbody id="uneti-th-body"></tbody>
          </table>
          <div id="uneti-th-empty" class="uneti-th-empty">
            Chưa tìm thấy môn có chữ “Thực hành”. Hãy mở danh sách học phần đã đăng ký rồi bấm “Quét lại”.
          </div>
        </div>
      </section>
    `;
    document.body.appendChild(root);
    bindEvents();
    render();
  }

  function setStatus(message, tone = 'normal') {
    const el = document.getElementById('uneti-th-status');
    if (!el) return;
    el.textContent = message;
    el.dataset.tone = tone;
  }

  async function render() {
    const body = document.getElementById('uneti-th-body');
    const empty = document.getElementById('uneti-th-empty');
    if (!body || !empty) return;

    const rawItems = await loadCourses();
    const map = new Map();
    for (const item of rawItems.filter(isPracticeCourse)) {
      const key = courseKey(item);
      const existing = map.get(key);
      if (!existing) {
        map.set(key, item);
      } else {
        map.set(key, {
          ...existing,
          ...item,
          id: existing.id || item.id,
          name: existing.name || item.name,
          code: existing.code || item.code || '',
          classCode: existing.classCode || item.classCode || '',
          time: existing.time || item.time || '',
          room: existing.room || item.room || '',
          lecturer: existing.lecturer || item.lecturer || ''
        });
      }
    }

    const items = [...map.values()];
    items.sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'vi'));
    body.innerHTML = '';
    empty.style.display = items.length ? 'none' : 'block';

    for (const item of items) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="uneti-th-course"><strong>${escapeHtml(item.name)}</strong></td>
        <td>
          <input
            class="uneti-th-inline-input uneti-th-time-input"
            data-id="${escapeHtml(item.id)}"
            data-field="time"
            type="text"
            maxlength="100"
            value="${escapeHtml(item.time || '')}"
            placeholder="VD: Thứ 3, tiết 1–3"
            aria-label="Thời gian hoặc tiết học của ${escapeHtml(item.name)}"
          >
        </td>
        <td>
          <input
            class="uneti-th-inline-input uneti-th-room-input"
            data-id="${escapeHtml(item.id)}"
            data-field="room"
            type="text"
            maxlength="80"
            value="${escapeHtml(item.room || '')}"
            placeholder="VD: HA10.205"
            aria-label="Phòng học của ${escapeHtml(item.name)}"
          >
        </td>
        <td>
          <input
            class="uneti-th-inline-input uneti-th-lecturer-input"
            data-id="${escapeHtml(item.id)}"
            data-field="lecturer"
            type="text"
            maxlength="100"
            value="${escapeHtml(item.lecturer || '')}"
            placeholder="VD: Nguyễn Văn A"
            aria-label="Giảng viên của ${escapeHtml(item.name)}"
          >
        </td>
      `;
      body.appendChild(tr);
    }
  }

  async function saveInlineField(id, field, value) {
    if (!id || !['time', 'room', 'lecturer'].includes(field)) return;
    const items = await loadCourses();
    const index = items.findIndex(x => x.id === id);
    if (index < 0) return;
    items[index] = {
      ...items[index],
      [field]: cleanText(value),
      updatedAt: new Date().toISOString()
    };
    await saveCourses(items);
    await renderCalendarCourses();
  }

  async function runScan({ silent = false } = {}) {
    const scanned = scanPageForCourses();
    if (!scanned.length) {
      if (!silent) setStatus('Chưa tìm thấy môn “Thực hành” trên trang hiện tại. Hãy mở danh sách học phần đã đăng ký rồi quét lại.', 'warn');
      return;
    }

    const result = await mergeScannedCourses(scanned);
    await render();
    await renderCalendarCourses();
    setStatus(`Đã tìm thấy ${scanned.length} môn thực hành. Bạn có thể nhập tiết, phòng và giảng viên trực tiếp bên dưới.`, 'ok');
  }

  async function openPanel() {
    document.getElementById('uneti-th-panel')?.classList.add('open');
    await runScan({ silent: true });
    await renderCalendarCourses();
  }

  function closePanel() {
    document.getElementById('uneti-th-panel')?.classList.remove('open');
  }

  async function clearAll() {
    if (!confirm('Xóa toàn bộ học phần và thời gian/phòng/giảng viên đã lưu trong extension?')) return;
    await chrome.storage.local.remove([STORAGE_KEY, SCAN_HINT_KEY]);
    await render();
    clearCalendarCards();
    setStatus('Đã xóa lịch thực hành đã lưu. Dữ liệu trên UNETI không bị thay đổi.', 'normal');
  }

  function bindEvents() {
    document.getElementById('uneti-th-launcher').addEventListener('click', openPanel);
    document.getElementById('uneti-th-close').addEventListener('click', closePanel);
    document.getElementById('uneti-th-scan').addEventListener('click', () => runScan());
    document.getElementById('uneti-th-clear').addEventListener('click', clearAll);

    document.getElementById('uneti-th-body').addEventListener('change', e => {
      const input = e.target.closest('.uneti-th-inline-input');
      if (!input) return;
      saveInlineField(input.dataset.id, input.dataset.field, input.value);
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closePanel();
    });

    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== 'local' || !changes[STORAGE_KEY]) return;
      const active = document.activeElement;
      if (!active?.classList?.contains('uneti-th-inline-input')) render();
      renderCalendarCourses();
    });
  }

  function ensureRoot() {
    if (document.body && !document.getElementById(ROOT_ID)) createRoot();
  }

  ensureRoot();

  let lastUrl = location.href;
  setInterval(async () => {
    ensureRoot();
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      setTimeout(() => { runScan({ silent: true }); renderCalendarCourses(); }, 1200);
    }
  }, 1500);

  // Tự quét sau khi trang/SPA có thời gian tải dữ liệu.
  setTimeout(() => { runScan({ silent: true }); renderCalendarCourses(); }, 2000);
  setTimeout(() => { runScan({ silent: true }); renderCalendarCourses(); }, 5000);
})();
