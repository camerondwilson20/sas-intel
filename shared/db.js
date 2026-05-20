/**
 * SAS Intel - Shared Database Layer
 * Pure localStorage, no dependencies.
 * All pages include this via <script src="../shared/db.js">
 */

window.SASDB = (function () {

  const PREFIX = 'sas-intel-';
  const COLLECTIONS = ['properties', 'requirements', 'contacts', 'intel', 'deals'];

  // — Internal ————————————————————————————
  function _key(col) { return PREFIX + col; }

  function _load(col) {
    try { return JSON.parse(localStorage.getItem(_key(col))) || []; }
    catch (e) { return []; }
  }

  function _save(col, arr) {
    localStorage.setItem(_key(col), JSON.stringify(arr));
  }

  function _ts() { return new Date().toISOString(); }

  function _today() { return new Date().toISOString().split('T')[0]; }

  function _id() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  function _daysSince(dateStr) {
    if (!dateStr) return 9999;
    return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  }

  // — CRUD ————————————————————————————————
  function get(col) { return _load(col); }

  function getById(col, id) { return _load(col).find(r => r.id === id) || null; }

  function add(col, record) {
    const arr = _load(col);
    const rec = {
      id: _id(),
      createdAt: _ts(),
      updatedAt: _ts(),
      lastTouch: _today(),
      addedBy: record.addedBy || 'Cwilly',
      ...record
    };
    arr.push(rec);
    _save(col, arr);
    _logActivity('added', col, rec.id, _summary(col, rec));
    return rec;
  }

  function update(col, id, patch) {
    const arr = _load(col);
    const idx = arr.findIndex(r => r.id === id);
    if (idx === -1) return null;
    arr[idx] = { ...arr[idx], ...patch, updatedAt: _ts() };
    _save(col, arr);
    _logActivity('updated', col, id, _summary(col, arr[idx]));
    return arr[idx];
  }

  function remove(col, id) {
    const arr = _load(col).filter(r => r.id !== id);
    _save(col, arr);
  }

  function touch(col, id) {
    return update(col, id, { lastTouch: _today() });
  }

  // — Queries —————————————————————————————
  function filter(col, predicate) { return _load(col).filter(predicate); }

  function stale(col, days) {
    return _load(col).filter(r => _daysSince(r.lastTouch) >= days);
  }

  function search(col, query) {
    const q = query.toLowerCase();
    return _load(col).filter(r =>
      Object.values(r).some(v => String(v).toLowerCase().includes(q))
    );
  }

  // — Stats ———————————————————————————————
  function stats() {
    const result = {};
    for (const col of COLLECTIONS) {
      const arr = _load(col);
      result[col] = {
        total: arr.length,
        stale30: arr.filter(r => _daysSince(r.lastTouch) >= 30).length,
        thisWeek: arr.filter(r => _daysSince(r.createdAt) <= 7).length
      };
    }
    return result;
  }

  // — Activity Log ————————————————————————
  function _logActivity(action, col, id, summary) {
    const log = _load('activity');
    log.unshift({ id: _id(), action, col, recordId: id, summary, at: _ts() });
    _save('activity', log.slice(0, 200)); // keep last 200
  }

  function getActivity(limit) {
    return _load('activity').slice(0, limit || 50);
  }

  // — Match Engine ————————————————————————
  function runMatches() {
    const props = _load('properties').filter(p => p.stage !== 'Closed' && p.stage !== 'Dead');
    const reqs = _load('requirements').filter(r => r.status === 'Active');
    const matches = [];

    for (const req of reqs) {
      for (const prop of props) {
        const score = _scoreMatch(prop, req);
        if (score > 0) {
          matches.push({
            id: _id(),
            propertyId: prop.id,
            propertyAddress: prop.address,
            requirementId: req.id,
            requirementName: req.buyerName,
            score,
            at: _ts()
          });
        }
      }
    }

    matches.sort((a, b) => b.score - a.score);
    _save('matches', matches.slice(0, 100));
    return matches;
  }

  function _scoreMatch(prop, req) {
    let score = 0;

    // Type match
    if (req.propertyType && prop.propertyType) {
      if (prop.propertyType.toLowerCase().includes(req.propertyType.toLowerCase()) ||
          req.propertyType.toLowerCase().includes(prop.propertyType.toLowerCase())) {
        score += 40;
      } else {
        return 0; // type mismatch = no match
      }
    }

    // Submarket
    if (req.submarket && prop.submarket) {
      if (prop.submarket.toLowerCase().includes(req.submarket.toLowerCase()) ||
          req.submarket === 'Triangle Wide') {
        score += 25;
      }
    }

    // Size
    const sf = parseFloat(prop.squareFeet) || 0;
    const minSF = parseFloat(req.sizeMin) || 0;
    const maxSF = parseFloat(req.sizeMax) || 999999;
    if (sf >= minSF && sf <= maxSF) score += 20;

    // Budget/Rate
    const price = parseFloat(prop.askingPrice) || 0;
    const budget = parseFloat(req.budget) || 0;
    if (budget > 0 && price > 0 && price <= budget * 1.1) score += 15;

    return score;
  }

  function getMatches() {
    return _load('matches');
  }

  // — Import/Export ———————————————————————
  function exportAll() {
    const data = { exportedAt: _ts(), version: 1 };
    for (const col of [...COLLECTIONS, 'activity', 'matches']) {
      data[col] = _load(col);
    }
    return data;
  }

  function importAll(data) {
    if (!data || data.version !== 1) throw new Error('Invalid export format');
    let imported = 0;
    for (const col of COLLECTIONS) {
      if (!data[col]) continue;
      const existing = _load(col);
      const existingIds = new Set(existing.map(r => r.id));
      const newRecs = data[col].filter(r => !existingIds.has(r.id));
      _save(col, [...existing, ...newRecs]);
      imported += newRecs.length;
    }
    return imported;
  }

  function importCSV(col, rows) {
    let added = 0;
    for (const raw of rows) {
      const normalized = _normalizeCSV(col, raw);
      add(col, normalized);
      added++;
    }
    return added;
  }

  function _normalizeCSV(col, raw) {
    const alias = (keys) => {
      for (const k of keys) {
        const match = Object.keys(raw).find(r => r.toLowerCase().replace(/[^a-z]/g,'') === k.toLowerCase().replace(/[^a-z]/g,''));
        if (match) return raw[match];
      }
      return '';
    };

    if (col === 'properties') return {
      address: alias(['address','property address','location']) || raw[Object.keys(raw)[0]],
      owner: alias(['owner','owner name','contact']),
      propertyType: alias(['type','property type','asset type']),
      squareFeet: alias(['sf','sqft','square feet','size']),
      submarket: alias(['submarket','market','area']) || 'Triangle Wide',
      source: alias(['source']),
      stage: alias(['stage','status']) || 'Cold',
      notes: alias(['notes','comments'])
    };

    if (col === 'requirements') return {
      buyerName: alias(['buyer','tenant','name','company','contact']) || raw[Object.keys(raw)[0]],
      repBroker: alias(['broker','rep broker','agent']),
      propertyType: alias(['type','property type']),
      sizeMin: alias(['size min','min sf','min size','size']),
      sizeMax: alias(['size max','max sf','max size']),
      budget: alias(['budget','rate','price','asking rate']),
      submarket: alias(['submarket','market','area']) || 'Triangle Wide',
      source: alias(['source']) || 'CSV Import',
      timeline: alias(['timeline','timing']),
      mustHaves: alias(['must haves','must-haves','requirements','needs']),
      notes: alias(['notes','comments']),
      status: 'Active'
    };

    if (col === 'contacts') return {
      name: alias(['name','contact','full name']) || raw[Object.keys(raw)[0]],
      firm: alias(['firm','company','organization']),
      role: alias(['role','title','type']),
      phone: alias(['phone','cell','mobile']),
      email: alias(['email']),
      specialty: alias(['specialty','focus','asset type']),
      relationship: alias(['relationship','strength','tier']) || 'Cold',
      notes: alias(['notes','comments'])
    };

    return { ...raw };
  }

  // — Public API ——————————————————————————
  return {
    get, getById, add, update, remove, touch,
    filter, stale, search,
    stats, getActivity,
    runMatches, getMatches,
    exportAll, importAll,
    importCSV,
    daysSince: _daysSince,
    today: _today
  };

})();
