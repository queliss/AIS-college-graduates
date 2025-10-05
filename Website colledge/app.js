// Simple localStorage-based DB for graduates
(function () {
  const STORAGE_KEY = 'ais_graduates_v1';

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const form = $('#graduate-form');
  const resetBtn = $('#reset');
  const tableBody = $('#graduates-table tbody');

  const reportYearBody = $('#report-by-year tbody');
  const reportMajorBody = $('#report-by-major tbody');
  const reportStatusBody = $('#report-by-status tbody');

  function loadAll() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn('Failed to parse storage, resetting', e);
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }
  }

  function saveAll(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  function generateId() {
    return 'g_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  function readForm() {
    const data = {
      id: form.id.value || generateId(),
      fullName: form.fullName.value.trim(),
      year: form.year.value,
      major: form.major.value,
      company: form.company.value.trim(),
      position: form.position.value.trim(),
      status: form.status.value || '',
    };
    return data;
  }

  function fillForm(item) {
    form.id.value = item.id || '';
    form.fullName.value = item.fullName || '';
    form.year.value = item.year || '';
    form.major.value = item.major || '';
    form.company.value = item.company || '';
    form.position.value = item.position || '';
    form.status.value = item.status || '';
  }

  function clearForm() {
    fillForm({});
  }

  function upsert(item) {
    const all = loadAll();
    const idx = all.findIndex((x) => x.id === item.id);
    if (idx >= 0) all[idx] = item; else all.push(item);
    saveAll(all);
    render();
  }

  function remove(id) {
    const all = loadAll().filter((x) => x.id !== id);
    saveAll(all);
    render();
  }

  function renderTable(items) {
    tableBody.innerHTML = '';
    for (const item of items) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHtml(item.fullName)}</td>
        <td>${escapeHtml(item.year)}</td>
        <td>${escapeHtml(item.major)}</td>
        <td>${escapeHtml(item.company)}</td>
        <td>${escapeHtml(item.position)}</td>
        <td>${escapeHtml(item.status)}</td>
        <td>
          <div class="row-actions">
            <button class="action" data-edit="${item.id}">Ред.</button>
            <button class="action danger" data-del="${item.id}">Удал.</button>
          </div>
        </td>`;
      tableBody.appendChild(tr);
    }
  }

  function computeReport(items, key) {
    const counts = new Map();
    for (const it of items) {
      const k = it[key] || '—';
      counts.set(k, (counts.get(k) || 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  }

  function renderReports(items) {
    function fill(body, rows) {
      body.innerHTML = '';
      for (const [k, v] of rows) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${escapeHtml(String(k))}</td><td>${v}</td>`;
        body.appendChild(tr);
      }
    }
    fill(reportYearBody, computeReport(items, 'year'));
    fill(reportMajorBody, computeReport(items, 'major'));
    fill(reportStatusBody, computeReport(items, 'status'));
  }

  function render() {
    const items = loadAll();
    renderTable(items);
    renderReports(items);
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Event handlers
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const item = readForm();
    if (!item.fullName || !item.year || !item.major) return;
    upsert(item);
    clearForm();
  });

  resetBtn.addEventListener('click', function () {
    clearForm();
  });

  tableBody.addEventListener('click', function (e) {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    const editId = target.getAttribute('data-edit');
    const delId = target.getAttribute('data-del');
    if (editId) {
      const item = loadAll().find((x) => x.id === editId);
      if (item) fillForm(item);
    }
    if (delId) {
      if (confirm('Удалить запись?')) remove(delId);
    }
  });

  // Seed demo data if empty
  function seed() {
    const existing = loadAll();
    if (existing.length) return;
    const demo = [
      { fullName: 'Иванов Иван', year: '2023', major: 'Программирование', company: 'TechSoft', position: 'Frontend разработчик', status: 'Трудоустроен' },
      { fullName: 'Петров Петр', year: '2022', major: 'Информационные системы', company: 'DataWorks', position: 'Аналитик', status: 'Трудоустроен' },
      { fullName: 'Сидорова Анна', year: '2024', major: 'Дизайн', company: 'Creativa', position: 'UI/UX дизайнер', status: 'Ищет работу' },
      { fullName: 'Кузнецов Олег', year: '2021', major: 'Экономика', company: 'FinCorp', position: 'Экономист', status: 'Трудоустроен' },
    ].map((x) => ({ id: generateId(), ...x }));
    saveAll(demo);
  }

  seed();
  render();
})();


