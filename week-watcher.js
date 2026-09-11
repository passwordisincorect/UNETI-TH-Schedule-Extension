(() => {
  'use strict';

  const STORAGE_KEY = 'uneti_th_courses_v2';
  const ROOT_ID = 'uneti-th-extension-root';
  let refreshTimer = null;

  function isExtensionOwnedNode(node) {
    if (!node || node.nodeType !== 1) return false;
    if (node.id === ROOT_ID) return true;
    if (node.classList?.contains('uneti-th-calendar-card')) return true;
    if (typeof node.closest === 'function' && node.closest(`#${ROOT_ID}`)) return true;
    return false;
  }

  function mutationNeedsRefresh(mutations = []) {
    for (const mutation of mutations) {
      if (isExtensionOwnedNode(mutation?.target)) continue;
      if (mutation?.type === 'characterData') return true;
      if (mutation?.type !== 'childList') continue;

      const changedNodes = [
        ...(mutation.addedNodes ? Array.from(mutation.addedNodes) : []),
        ...(mutation.removedNodes ? Array.from(mutation.removedNodes) : [])
      ];
      if (!changedNodes.length) continue;
      if (changedNodes.some(node => !isExtensionOwnedNode(node))) return true;
    }
    return false;
  }

  async function requestCalendarRender() {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const courses = Array.isArray(result[STORAGE_KEY]) ? result[STORAGE_KEY] : [];
    if (!courses.length) return;

    const next = courses.map((course, index) => index === 0
      ? { ...course, _weekRefreshNonce: Date.now() }
      : course);
    await chrome.storage.local.set({ [STORAGE_KEY]: next });
  }

  function scheduleRefresh(delay = 300) {
    if (refreshTimer) clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      refreshTimer = null;
      requestCalendarRender();
    }, delay);
  }

  function startWatcher() {
    if (typeof MutationObserver !== 'function' || !document.body) return;
    const observer = new MutationObserver(mutations => {
      if (mutationNeedsRefresh(mutations)) scheduleRefresh();
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  startWatcher();
})();
