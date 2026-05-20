/**
 * SAS Intel - Shared Nav + Sync Utilities
 * Inject top nav and wire up export/import on every page.
 */

(function () {

  const PAGES = [
    { label: 'Pipeline',     href: '../intel/index.html#properties', section: 'properties' },
    { label: 'Requirements', href: '../intel/index.html#requirements', section: 'requirements' },
    { label: 'Contacts',     href: '../intel/index.html#contacts', section: 'contacts' },
    { label: 'Market Intel', href: '../intel/index.html#intel', section: 'intel' },
    { label: 'Deal History', href: '../intel/index.html#deals', section: 'deals' },
  ];

  function _currentSection() {
    return window.location.hash.replace('#', '') || 'properties';
  }

  function injectNav(container) {
    const el = container || document.body;
    const section = _currentSection();

    const nav = document.createElement('nav');
    nav.id = 'sas-nav';

    const brand = document.createElement('a');
    brand.className = 'nav-brand';
    brand.href = '../intel/index.html';
    brand.textContent = 'SAS INTEL';
    nav.appendChild(brand);

    const links = document.createElement('div');
    links.className = 'nav-links';

    for (const p of PAGES) {
      const a = document.createElement('a');
      a.href = p.href;
      a.textContent = p.label;
      if (p.section === section) a.classList.add('active');
      links.appendChild(a);
    }
    nav.appendChild(links);

    const actions = document.createElement('div');
    actions.className = 'nav-actions';

    // Export button
    const exportBtn = document.createElement('button');
    exportBtn.className = 'btn btn-outline btn-sm';
    exportBtn.innerHTML = '&#8659; Export';
    exportBtn.onclick = _handleExport;
    actions.appendChild(exportBtn);

    // Import button
    const importBtn = document.createElement('button');
    importBtn.className = 'btn btn-outline btn-sm';
    importBtn.innerHTML = '&#8657; Import';
    importBtn.onclick = _handleImport;
    actions.appendChild(importBtn);

    nav.appendChild(actions);
    el.insertBefore(nav, el.firstChild);
  }

  function _handleExport() {
    if (!window.SASDB) { alert('DB not loaded'); return; }
    const data = SASDB.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sas-intel-export-' + SASDB.today() + '.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function _handleImport() {
    if (!window.SASDB) { alert('DB not loaded'); return; }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          const count = SASDB.importAll(data);
          alert('Imported ' + count + ' new records. Refreshing...');
          window.location.reload();
        } catch (err) {
          alert('Import failed: ' + err.message);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  // Auto-inject when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => injectNav());
  } else {
    injectNav();
  }

  // Expose for manual use
  window.SASNav = { injectNav };

})();
