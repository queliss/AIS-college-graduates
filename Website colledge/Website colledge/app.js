// Simple localStorage-based DB for graduates with comprehensive error handling
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

  // ========== ERROR HANDLING SYSTEM ==========
  
  // Контейнер для уведомлений
  let notificationContainer = null;

  function createNotificationContainer() {
    if (!notificationContainer) {
      notificationContainer = document.createElement('div');
      notificationContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
        max-width: 400px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      `;
      document.body.appendChild(notificationContainer);
    }
    return notificationContainer;
  }

  function showNotification(message, type = 'info') {
    try {
      const container = createNotificationContainer();
      const notification = document.createElement('div');
      const styles = {
        error: { background: '#fee2e2', color: '#dc2626', border: '#fecaca' },
        success: { background: '#d1fae5', color: '#065f46', border: '#a7f3d0' },
        info: { background: '#dbeafe', color: '#1e40af', border: '#93c5fd' }
      };
      
      const style = styles[type] || styles.info;
      
      notification.style.cssText = `
        padding: 12px 16px;
        border-radius: 8px;
        border: 1px solid ${style.border};
        background: ${style.background};
        color: ${style.color};
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        font-family: inherit;
        animation: slideIn 0.3s ease-out;
      `;

      // Добавляем CSS анимацию
      if (!document.querySelector('#notification-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'notification-styles';
        styleElement.textContent = `
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
          }
        `;
        document.head.appendChild(styleElement);
      }
      
      notification.textContent = message;
      container.appendChild(notification);
      
      // Автоматическое удаление через 5 секунд
      setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }, 5000);

      return notification;
      
    } catch (error) {
      console.error('Error showing notification:', error);
      alert(message); // Fallback
    }
  }

  function showError(message) {
    showNotification(message, 'error');
  }

  function showSuccess(message) {
    showNotification(message, 'success');
  }

  // Функция для показа нескольких ошибок сразу
  function showMultipleErrors(errors) {
    errors.forEach(error => showError(error));
  }

  // ========== VALIDATION SYSTEM ==========
  
  function validateGraduateData(data) {
    const errors = [];
    
    try {
      // Проверка обязательных полей
      if (!data.fullName || data.fullName.trim().length < 2) {
        errors.push('ФИО должно содержать минимум 2 символа');
      }
      
      if (!data.year) {
        errors.push('Год выпуска обязателен для заполнения');
      }
      
      if (!data.major) {
        errors.push('Специальность обязательна для выбора');
      }
      
      // Проверка формата года
      if (data.year) {
        const currentYear = new Date().getFullYear();
        const gradYear = parseInt(data.year);
        if (isNaN(gradYear) || gradYear < 2000 || gradYear > currentYear + 1) {
          errors.push(`Год выпуска должен быть между 2000 и ${currentYear + 1}`);
        }
      }
      
      // Проверка длины текстовых полей
      if (data.company && data.company.length > 255) {
        errors.push('Название компании слишком длинное (макс. 255 символов)');
      }
      
      if (data.position && data.position.length > 255) {
        errors.push('Название должности слишком длинное (макс. 255 символов)');
      }
      
      if (data.fullName && data.fullName.length > 255) {
        errors.push('ФИО слишком длинное (макс. 255 символов)');
      }
      
      return {
        isValid: errors.length === 0,
        errors: errors
      };
      
    } catch (error) {
      console.error('Validation error:', error);
      return {
        isValid: false,
        errors: ['Ошибка при проверке данных']
      };
    }
  }

  // ========== DATA MANAGEMENT ==========
  
  function loadAll() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      
      const data = JSON.parse(raw);
      if (!Array.isArray(data)) {
        throw new Error('Invalid data format in storage');
      }
      
      return data;
    } catch (error) {
      console.warn('Failed to parse storage, resetting', error);
      showError('Ошибка загрузки данных. Хранилище будет сброшено.');
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {
        console.error('Failed to clear storage:', e);
      }
      return [];
    }
  }

  function saveAll(items) {
    try {
      if (!Array.isArray(items)) {
        throw new Error('Data must be an array');
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      return true;
    } catch (error) {
      console.error('Save error:', error);
      showError('Ошибка сохранения данных: ' + error.message);
      return false;
    }
  }

  function generateId() {
    try {
      return 'g_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    } catch (error) {
      console.error('ID generation error:', error);
      return 'g_' + Date.now(); // Fallback
    }
  }

  function readForm() {
    try {
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
    } catch (error) {
      console.error('Form reading error:', error);
      showError('Ошибка чтения данных формы');
      return {};
    }
  }

  function fillForm(item) {
    try {
      form.id.value = item.id || '';
      form.fullName.value = item.fullName || '';
      form.year.value = item.year || '';
      form.major.value = item.major || '';
      form.company.value = item.company || '';
      form.position.value = item.position || '';
      form.status.value = item.status || '';
    } catch (error) {
      console.error('Form filling error:', error);
      showError('Ошибка заполнения формы');
    }
  }

  function clearForm() {
    try {
      fillForm({});
      showSuccess('Форма очищена');
    } catch (error) {
      console.error('Form clearing error:', error);
      showError('Ошибка очистки формы');
    }
  }

  function safeUpsert(item) {
    try {
      const validation = validateGraduateData(item);
      if (!validation.isValid) {
        // Показываем все ошибки сразу, каждая в отдельном уведомлении
        showMultipleErrors(validation.errors);
        return false;
      }
      
      const all = loadAll();
      const idx = all.findIndex((x) => x.id === item.id);
      
      if (idx >= 0) {
        all[idx] = item;
        showSuccess('Данные выпускника обновлены');
      } else {
        all.push(item);
        showSuccess('Выпускник успешно добавлен');
      }
      
      if (!saveAll(all)) {
        return false;
      }
      
      render();
      return true;
      
    } catch (error) {
      console.error('Upsert error:', error);
      showError('Ошибка сохранения данных: ' + error.message);
      return false;
    }
  }

  function safeRemove(id) {
    try {
      if (!id) {
        throw new Error('Invalid ID for deletion');
      }
      
      if (!confirm('Вы уверены, что хотите удалить этого выпускника?')) {
        return false;
      }
      
      const all = loadAll();
      const initialLength = all.length;
      const filtered = all.filter((x) => x.id !== id);
      
      if (filtered.length === initialLength) {
        throw new Error('Выпускник не найден для удаления');
      }
      
      if (!saveAll(filtered)) {
        return false;
      }
      
      showSuccess('Выпускник успешно удален');
      render();
      return true;
      
    } catch (error) {
      console.error('Deletion error:', error);
      showError('Ошибка удаления: ' + error.message);
      return false;
    }
  }

  // ========== RENDERING ==========
  
  function renderTable(items) {
    try {
      if (!tableBody) {
        throw new Error('Table body element not found');
      }
      
      tableBody.innerHTML = '';
      
      if (!items || items.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="7" style="text-align: center; color: var(--muted);">Нет данных о выпускниках</td>`;
        tableBody.appendChild(tr);
        return;
      }
      
      for (const item of items) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${escapeHtml(item.fullName)}</td>
          <td>${escapeHtml(item.year)}</td>
          <td>${escapeHtml(item.major)}</td>
          <td>${escapeHtml(item.company || '—')}</td>
          <td>${escapeHtml(item.position || '—')}</td>
          <td>${escapeHtml(item.status || 'Не указан')}</td>
          <td>
            <div class="row-actions">
              <button class="action" data-edit="${item.id}">Ред.</button>
              <button class="action danger" data-del="${item.id}">Удал.</button>
            </div>
          </td>`;
        tableBody.appendChild(tr);
      }
    } catch (error) {
      console.error('Table rendering error:', error);
      showError('Ошибка отображения таблицы');
    }
  }

  function computeReport(items, key) {
    try {
      if (!items || !Array.isArray(items)) {
        return [['Нет данных', 0]];
      }
      
      const counts = new Map();
      for (const it of items) {
        const k = it[key] || '—';
        counts.set(k, (counts.get(k) || 0) + 1);
      }
      return Array.from(counts.entries()).sort((a, b) => String(a[0]).localeCompare(String(b[0])));
    } catch (error) {
      console.error('Report computation error:', error);
      return [['Ошибка', 0]];
    }
  }

  function renderReports(items) {
    try {
      function safeFill(body, rows) {
        if (!body) return;
        
        body.innerHTML = '';
        for (const [k, v] of rows) {
          const tr = document.createElement('tr');
          tr.innerHTML = `<td>${escapeHtml(String(k))}</td><td>${v}</td>`;
          body.appendChild(tr);
        }
      }
      
      safeFill(reportYearBody, computeReport(items, 'year'));
      safeFill(reportMajorBody, computeReport(items, 'major'));
      safeFill(reportStatusBody, computeReport(items, 'status'));
    } catch (error) {
      console.error('Reports rendering error:', error);
      showError('Ошибка генерации отчетов');
    }
  }

  function render() {
    try {
      const items = loadAll();
      renderTable(items);
      renderReports(items);
    } catch (error) {
      console.error('Render error:', error);
      showError('Ошибка отображения данных');
    }
  }

  function escapeHtml(s) {
    try {
      return String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    } catch (error) {
      console.error('HTML escape error:', error);
      return String(s || '');
    }
  }

  // ========== EVENT HANDLERS ==========
  
  function initEventHandlers() {
    try {
      // Form submission
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        const item = readForm();
        safeUpsert(item);
        clearForm();
      });

      // Reset button
      resetBtn.addEventListener('click', function () {
        clearForm();
      });

      // Table actions
      tableBody.addEventListener('click', function (e) {
        try {
          const target = e.target;
          if (!(target instanceof HTMLElement)) return;
          
          const editId = target.getAttribute('data-edit');
          const delId = target.getAttribute('data-del');
          
          if (editId) {
            const item = loadAll().find((x) => x.id === editId);
            if (item) fillForm(item);
          }
          if (delId) {
            safeRemove(delId);
          }
        } catch (error) {
          console.error('Table action error:', error);
          showError('Ошибка обработки действия');
        }
      });
    } catch (error) {
      console.error('Event handlers initialization error:', error);
      showError('Ошибка инициализации интерфейса');
    }
  }

  // ========== DEMO DATA ==========
  
  function seedDemoData() {
    try {
      const existing = loadAll();
      if (existing.length > 0) return;
      
      const demo = [
        { fullName: 'Иванов Иван', year: '2023', major: 'Программирование', company: 'TechSoft', position: 'Frontend разработчик', status: 'Трудоустроен' },
        { fullName: 'Петров Петр', year: '2022', major: 'Информационные системы', company: 'DataWorks', position: 'Аналитик', status: 'Трудоустроен' },
        { fullName: 'Сидорова Анна', year: '2024', major: 'Дизайн', company: 'Creativa', position: 'UI/UX дизайнер', status: 'Ищет работу' },
        { fullName: 'Кузнецов Олег', year: '2021', major: 'Экономика', company: 'FinCorp', position: 'Экономист', status: 'Трудоустроен' },
      ].map((x) => ({ id: generateId(), ...x }));
      
      if (saveAll(demo)) {
        console.log('Demo data seeded successfully');
      }
    } catch (error) {
      console.error('Demo data seeding error:', error);
    }
  }

  // ========== GLOBAL ERROR HANDLING ==========
  
  function initGlobalErrorHandling() {
    // Global error handler
    window.addEventListener('error', function(event) {
      console.error('Global error:', event.error);
      showError('Произошла непредвиденная ошибка в системе');
    });

    // Promise rejection handler
    window.addEventListener('unhandledrejection', function(event) {
      console.error('Unhandled promise rejection:', event.reason);
      showError('Ошибка выполнения операции');
    });
  }

  // ========== INITIALIZATION ==========
  
  function init() {
    try {
      initGlobalErrorHandling();
      initEventHandlers();
      seedDemoData();
      render();
      console.log('AIS Graduates system initialized successfully');
    } catch (error) {
      console.error('Initialization error:', error);
      showError('Ошибка инициализации системы');
    }
  }

  // Start the application
  init();
})();