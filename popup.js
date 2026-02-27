/**
 * JSON Formatter Pro - Main Application
 * Handles UI interactions and coordinates all utilities
 */

import { 
  formatJSON, 
  minifyJSON, 
  validateJSON, 
  getJSONStats, 
  highlightJSON 
} from './utils/formatter.js';

import {
  jsonToYAML,
  jsonToXML,
  jsonToTypeScript,
  jsonToPython,
  jsonToSchema
} from './utils/converter.js';

import {
  diffJSON,
  formatDiffOutput,
  calculateSimilarity
} from './utils/differ.js';

import {
  queryJSONPath,
  formatQueryResult
} from './utils/query.js';

// DOM Elements
const elements = {};

// State
let state = {
  currentMode: 'format',
  autoFormat: false,
  indent: 2,
  theme: 'light'
};

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
  initElements();
  initEventListeners();
  loadSettings();
  renderDiffHighlightLayer(elements.diffHighlight1, elements.diffInput1.value);
  renderDiffHighlightLayer(elements.diffHighlight2, elements.diffInput2.value);
  
  // Set initial example
  const exampleJson = {
    name: "JSON Formatter Pro",
    version: "1.0.0",
    features: ["format", "validate", "convert", "diff"],
    config: {
      theme: "light",
      autoFormat: true
    }
  };
  
  elements.inputJson.value = JSON.stringify(exampleJson, null, 2);
  handleFormat();
});

/**
 * Initialize DOM element references
 */
const initElements = () => {
  // Mode tabs
  elements.modeTabs = document.querySelectorAll('.mode-tab');
  elements.sections = document.querySelectorAll('.section');
  
  // Format section
  elements.inputJson = document.getElementById('input-json');
  elements.outputJson = document.getElementById('output-json');
  elements.inputError = document.getElementById('input-error');
  elements.indentSelect = document.getElementById('indent-select');
  elements.autoFormat = document.getElementById('auto-format');
  
  // Buttons
  elements.btnFormat = document.getElementById('btn-format');
  elements.btnMinify = document.getElementById('btn-minify');
  elements.btnValidate = document.getElementById('btn-validate');
  elements.btnConvert = document.getElementById('btn-convert');
  elements.btnSortKeys = document.getElementById('btn-sort-keys');
  elements.btnCopy = document.getElementById('btn-copy');
  elements.btnDownload = document.getElementById('btn-download');
  elements.btnClearInput = document.getElementById('btn-clear-input');
  elements.fileInput = document.getElementById('file-input');
  
  // Stats
  elements.statLines = document.getElementById('stat-lines');
  elements.statChars = document.getElementById('stat-chars');
  elements.statKeys = document.getElementById('stat-keys');
  elements.statDepth = document.getElementById('stat-depth');
  
  // Diff section
  elements.diffInput1 = document.getElementById('diff-input-1');
  elements.diffInput2 = document.getElementById('diff-input-2');
  elements.diffHighlight1 = document.getElementById('diff-highlight-1');
  elements.diffHighlight2 = document.getElementById('diff-highlight-2');
  elements.diffResult = document.getElementById('diff-result');
  elements.btnDiff = document.getElementById('btn-diff');
  elements.btnSwapDiff = document.getElementById('btn-swap-diff');
  elements.btnClearDiff = document.getElementById('btn-clear-diff');
  
  // Query section
  elements.queryInput = document.getElementById('query-input');
  elements.queryOutput = document.getElementById('query-output');
  elements.jsonpathInput = document.getElementById('jsonpath-input');
  elements.btnQuery = document.getElementById('btn-query');
  
  // Tools section
  elements.urlInput = document.getElementById('url-input');
  elements.base64Input = document.getElementById('base64-input');
  elements.escapeInput = document.getElementById('escape-input');
  elements.jsonstringInput = document.getElementById('jsonstring-input');
  
  // Theme toggle
  elements.btnTheme = document.getElementById('btn-theme');
  
  // Toast container
  elements.toastContainer = document.getElementById('toast-container');
};

/**
 * Initialize event listeners
 */
const initEventListeners = () => {
  // Mode tabs
  elements.modeTabs.forEach(tab => {
    tab.addEventListener('click', () => switchMode(tab.dataset.mode));
  });
  
  // Format section
  elements.btnFormat.addEventListener('click', handleFormat);
  elements.btnMinify.addEventListener('click', handleMinify);
  elements.btnValidate.addEventListener('click', handleValidate);
  elements.btnSortKeys.addEventListener('click', handleSortKeys);
  elements.btnCopy.addEventListener('click', handleCopy);
  elements.btnDownload.addEventListener('click', handleDownload);
  elements.btnClearInput.addEventListener('click', handleClearInput);
  elements.fileInput.addEventListener('change', handleFileUpload);
  
  elements.indentSelect.addEventListener('change', (e) => {
    state.indent = e.target.value === 'tab' ? 'tab' : parseInt(e.target.value);
    if (state.autoFormat) handleFormat();
  });
  
  elements.autoFormat.addEventListener('change', (e) => {
    state.autoFormat = e.target.checked;
    saveSettings();
  });
  
  // Input JSON auto-format on change
  elements.inputJson.addEventListener('input', () => {
    if (state.autoFormat) {
      debounce(handleFormat, 500)();
    }
    updateStats();
  });
  
  // Convert dropdown
  const dropdown = elements.btnConvert.parentElement;
  elements.btnConvert.addEventListener('click', () => {
    dropdown.classList.toggle('open');
  });
  
  document.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', () => handleConvert(item.dataset.convert));
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target)) {
      dropdown.classList.remove('open');
    }
  });
  
  // Diff section
  elements.btnDiff.addEventListener('click', handleDiff);
  elements.btnSwapDiff.addEventListener('click', handleSwapDiff);
  elements.btnClearDiff.addEventListener('click', handleClearDiff);
  elements.diffInput1.addEventListener('scroll', () => {
    syncDiffOverlayScroll(elements.diffInput1, elements.diffHighlight1);
  });
  elements.diffInput2.addEventListener('scroll', () => {
    syncDiffOverlayScroll(elements.diffInput2, elements.diffHighlight2);
  });
  elements.diffInput1.addEventListener('input', () => {
    renderDiffHighlightLayer(elements.diffHighlight1, elements.diffInput1.value);
    syncDiffOverlayScroll(elements.diffInput1, elements.diffHighlight1);
  });
  elements.diffInput2.addEventListener('input', () => {
    renderDiffHighlightLayer(elements.diffHighlight2, elements.diffInput2.value);
    syncDiffOverlayScroll(elements.diffInput2, elements.diffHighlight2);
  });
  
  // Query section
  elements.btnQuery.addEventListener('click', handleQuery);
  elements.jsonpathInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleQuery();
  });
  
  // Example links
  document.querySelectorAll('.example-link').forEach(link => {
    link.addEventListener('click', () => {
      elements.jsonpathInput.value = link.textContent;
      handleQuery();
    });
  });
  
  // Tools section
  document.querySelectorAll('[data-tool]').forEach(btn => {
    btn.addEventListener('click', () => handleToolAction(btn.dataset.tool));
  });
  
  // Theme toggle
  elements.btnTheme.addEventListener('click', toggleTheme);
};

/**
 * Switch between modes (Format, Diff, Query, Tools)
 */
const switchMode = (mode) => {
  state.currentMode = mode;
  
  elements.modeTabs.forEach(tab => {
    tab.classList.toggle('active', tab.dataset.mode === mode);
  });
  
  elements.sections.forEach(section => {
    section.classList.toggle('active', section.id === `section-${mode}`);
  });
};

/**
 * Handle JSON formatting
 */
const handleFormat = () => {
  const input = elements.inputJson.value;
  const indent = state.indent;
  
  const result = formatJSON(input, indent);
  
  if (result.success) {
    elements.outputJson.innerHTML = highlightJSON(result.output);
    hideError();
  } else {
    showError(result.error, result.position);
  }
  
  updateStats();
};

/**
 * Handle JSON minification
 */
const handleMinify = () => {
  const input = elements.inputJson.value;
  const result = minifyJSON(input);
  
  if (result.success) {
    elements.outputJson.innerHTML = highlightJSON(result.output);
    hideError();
    showToast('JSON minified successfully', 'success');
  } else {
    showError(result.error, result.position);
  }
};

/**
 * Handle JSON validation
 */
const handleValidate = () => {
  const input = elements.inputJson.value;
  const result = validateJSON(input);
  
  if (result.valid) {
    showToast('✓ Valid JSON', 'success');
    hideError();
  } else {
    showError(result.message, result.position);
  }
};

/**
 * Handle JSON conversion
 */
const handleConvert = (format) => {
  const input = elements.inputJson.value;
  const parseResult = formatJSON(input);
  
  if (!parseResult.success) {
    showError(parseResult.error, parseResult.position);
    return;
  }
  
  const json = parseResult.parsed;
  let output = '';
  
  switch (format) {
    case 'yaml':
      output = jsonToYAML(json);
      break;
    case 'xml':
      output = jsonToXML(json);
      break;
    case 'typescript':
      output = jsonToTypeScript(json);
      break;
    case 'python':
      output = jsonToPython(json);
      break;
    case 'schema':
      output = jsonToSchema(json);
      break;
  }
  
  elements.outputJson.innerHTML = `<pre class="plain-output">${escapeHtml(output)}</pre>`;
  showToast(`Converted to ${format.toUpperCase()}`, 'success');
  
  // Close dropdown
  elements.btnConvert.parentElement.classList.remove('open');
};

/**
 * Handle sort keys
 */
const handleSortKeys = () => {
  const input = elements.inputJson.value;
  const indent = state.indent;
  
  const result = formatJSON(input, indent, true);
  
  if (result.success) {
    elements.outputJson.innerHTML = highlightJSON(result.output);
    showToast('Keys sorted alphabetically', 'success');
  } else {
    showError(result.error, result.position);
  }
};

/**
 * Handle copy to clipboard
 */
const handleCopy = async () => {
  const output = elements.outputJson.textContent;
  
  try {
    await navigator.clipboard.writeText(output);
    showToast('Copied to clipboard', 'success');
  } catch {
    showToast('Failed to copy', 'error');
  }
};

/**
 * Handle download as JSON file
 */
const handleDownload = () => {
  const output = elements.outputJson.textContent;
  const blob = new Blob([output], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'formatted.json';
  a.click();
  
  URL.revokeObjectURL(url);
  showToast('Downloaded formatted.json', 'success');
};

/**
 * Handle clear input
 */
const handleClearInput = () => {
  elements.inputJson.value = '';
  elements.outputJson.innerHTML = '';
  hideError();
  updateStats();
};

/**
 * Handle file upload
 */
const handleFileUpload = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (event) => {
    elements.inputJson.value = event.target.result;
    handleFormat();
    showToast(`Loaded ${file.name}`, 'success');
  };
  reader.onerror = () => {
    showToast('Failed to read file', 'error');
  };
  reader.readAsText(file);
};

/**
 * Handle JSON diff
 */
const handleDiff = () => {
  const input1 = elements.diffInput1.value;
  const input2 = elements.diffInput2.value;
  
  const result1 = formatJSON(input1);
  const result2 = formatJSON(input2);
  
  if (!result1.success) {
    renderDiffHighlightLayer(elements.diffHighlight1, input1);
    renderDiffHighlightLayer(elements.diffHighlight2, input2);
    showToast('Invalid JSON 1', 'error');
    return;
  }
  
  if (!result2.success) {
    renderDiffHighlightLayer(elements.diffHighlight1, input1);
    renderDiffHighlightLayer(elements.diffHighlight2, input2);
    showToast('Invalid JSON 2', 'error');
    return;
  }
  
  const leftSerialized = stringifyWithPathMap(result1.parsed);
  const rightSerialized = stringifyWithPathMap(result2.parsed);

  elements.diffInput1.value = leftSerialized.output;
  elements.diffInput2.value = rightSerialized.output;

  const changes = diffJSON(result1.parsed, result2.parsed);
  const similarity = calculateSimilarity(result1.parsed, result2.parsed);
  const lineKinds = collectDiffLineKinds(changes, leftSerialized.pathToLine, rightSerialized.pathToLine);

  renderDiffHighlightLayer(elements.diffHighlight1, leftSerialized.output, lineKinds.left);
  renderDiffHighlightLayer(elements.diffHighlight2, rightSerialized.output, lineKinds.right);
  syncDiffOverlayScroll(elements.diffInput1, elements.diffHighlight1);
  syncDiffOverlayScroll(elements.diffInput2, elements.diffHighlight2);
  
  elements.diffResult.innerHTML = `${formatDiffOutput(changes)}
    <div class="diff-item diff-summary"><strong>Similarity:</strong> ${similarity}%</div>`;
};

/**
 * Handle swap diff inputs
 */
const handleSwapDiff = () => {
  const temp = elements.diffInput1.value;
  elements.diffInput1.value = elements.diffInput2.value;
  elements.diffInput2.value = temp;
  handleDiff();
};

/**
 * Handle clear diff
 */
const handleClearDiff = () => {
  elements.diffInput1.value = '';
  elements.diffInput2.value = '';
  renderDiffHighlightLayer(elements.diffHighlight1, '');
  renderDiffHighlightLayer(elements.diffHighlight2, '');
  elements.diffResult.innerHTML = '';
};

/**
 * Keep diff highlight overlay scroll position aligned with textarea
 */
const syncDiffOverlayScroll = (textarea, overlay) => {
  if (!textarea || !overlay) return;
  overlay.scrollTop = textarea.scrollTop;
  overlay.scrollLeft = textarea.scrollLeft;
};

/**
 * Render line-level diff highlights on top of editable JSON textarea
 */
const renderDiffHighlightLayer = (overlay, text, lineKinds = new Map()) => {
  if (!overlay) return;

  const lines = String(text).split('\n');
  overlay.innerHTML = lines.map((line, idx) => {
    const lineNo = idx + 1;
    const lineClass = lineKinds.get(lineNo) || '';
    const safeText = line.length > 0 ? escapeHtml(line) : '&nbsp;';
    return `<span class="diff-highlight-line ${lineClass}">${safeText}</span>`;
  }).join('');
};

/**
 * Build JSON string and line number map for each JSON path
 */
const stringifyWithPathMap = (value, indent = 2) => {
  const lines = [];
  const pathToLine = new Map();
  const indentText = ' '.repeat(indent);

  const addLine = (text) => {
    lines.push(text);
    return lines.length;
  };

  const appendValue = (current, path, depth, addComma = false, key = null) => {
    const prefix = indentText.repeat(depth);
    const keyPrefix = key !== null ? `${JSON.stringify(key)}: ` : '';

    if (current === null || typeof current !== 'object') {
      const lineNo = addLine(`${prefix}${keyPrefix}${JSON.stringify(current)}${addComma ? ',' : ''}`);
      if (path) pathToLine.set(path, lineNo);
      return;
    }

    if (Array.isArray(current)) {
      if (current.length === 0) {
        const lineNo = addLine(`${prefix}${keyPrefix}[]${addComma ? ',' : ''}`);
        if (path) pathToLine.set(path, lineNo);
        return;
      }

      const openLine = addLine(`${prefix}${keyPrefix}[`);
      if (path) pathToLine.set(path, openLine);

      current.forEach((item, index) => {
        const itemPath = path ? `${path}[${index}]` : `[${index}]`;
        appendValue(item, itemPath, depth + 1, index < current.length - 1);
      });

      addLine(`${prefix}]${addComma ? ',' : ''}`);
      return;
    }

    const entries = Object.entries(current);
    if (entries.length === 0) {
      const lineNo = addLine(`${prefix}${keyPrefix}{}${addComma ? ',' : ''}`);
      if (path) pathToLine.set(path, lineNo);
      return;
    }

    const openLine = addLine(`${prefix}${keyPrefix}{`);
    if (path) pathToLine.set(path, openLine);

    entries.forEach(([childKey, childValue], index) => {
      const childPath = path ? `${path}.${childKey}` : childKey;
      appendValue(childValue, childPath, depth + 1, index < entries.length - 1, childKey);
    });

    addLine(`${prefix}}${addComma ? ',' : ''}`);
  };

  appendValue(value, '', 0);
  return {
    output: lines.join('\n'),
    pathToLine
  };
};

/**
 * Collect per-line highlight classes for both diff editors
 */
const collectDiffLineKinds = (changes, leftPathToLine, rightPathToLine) => {
  const left = new Map();
  const right = new Map();
  const priority = {
    'diff-inline-added': 1,
    'diff-inline-removed': 2,
    'diff-inline-changed': 3
  };

  const setLineKind = (targetMap, line, kind) => {
    const previous = targetMap.get(line);
    if (!previous || priority[kind] > priority[previous]) {
      targetMap.set(line, kind);
    }
  };

  for (const change of changes) {
    if (change.type === 'changed') {
      const leftLine = resolvePathLine(change.path, leftPathToLine);
      const rightLine = resolvePathLine(change.path, rightPathToLine);
      setLineKind(left, leftLine, 'diff-inline-changed');
      setLineKind(right, rightLine, 'diff-inline-changed');
    } else if (change.type === 'removed') {
      const leftLine = resolvePathLine(change.path, leftPathToLine);
      setLineKind(left, leftLine, 'diff-inline-removed');
    } else if (change.type === 'added') {
      const rightLine = resolvePathLine(change.path, rightPathToLine);
      setLineKind(right, rightLine, 'diff-inline-added');
    }
  }

  return { left, right };
};

/**
 * Resolve a JSON path to a closest visible line in the serialized output
 */
const resolvePathLine = (path, pathToLine) => {
  if (!path) return 1;
  if (pathToLine.has(path)) return pathToLine.get(path);

  let currentPath = path;
  while (currentPath) {
    currentPath = getParentPath(currentPath);
    if (pathToLine.has(currentPath)) {
      return pathToLine.get(currentPath);
    }
  }

  return 1;
};

/**
 * Get parent path from a dotted path like a.b[0].c
 */
const getParentPath = (path) => {
  if (!path) return '';

  if (/\[\d+\]$/.test(path)) {
    return path.replace(/\[\d+\]$/, '');
  }

  const dotIndex = path.lastIndexOf('.');
  if (dotIndex === -1) return '';
  return path.slice(0, dotIndex);
};

/**
 * Handle JSONPath query
 */
const handleQuery = () => {
  const input = elements.queryInput.value;
  const path = elements.jsonpathInput.value;
  
  const parseResult = formatJSON(input);
  
  if (!parseResult.success) {
    elements.queryOutput.innerHTML = '<span class="status-text error">Invalid JSON</span>';
    return;
  }
  
  const result = queryJSONPath(parseResult.parsed, path);
  
  if (result.success) {
    const output = result.results.map((item, i) => {
      const pathStr = result.paths[i].join('.');
      const value = typeof item === 'object' ? JSON.stringify(item, null, 2) : item;
      return `<div class="query-block">
        <div class="query-path">${pathStr}</div>
        <div>${highlightJSON(value)}</div>
      </div>`;
    }).join('');
    
    elements.queryOutput.innerHTML = output || '<span class="status-text muted">No results</span>';
  } else {
    elements.queryOutput.innerHTML = `<span class="status-text error">${result.error}</span>`;
  }
};

/**
 * Handle tool actions
 */
const handleToolAction = (action) => {
  let input, output = '';
  
  switch (action) {
    case 'url-encode':
      input = elements.urlInput.value;
      output = encodeURIComponent(input);
      elements.urlInput.value = output;
      break;
      
    case 'url-decode':
      input = elements.urlInput.value;
      try {
        output = decodeURIComponent(input);
        elements.urlInput.value = output;
      } catch {
        showToast('Invalid URL encoding', 'error');
      }
      break;
      
    case 'copy-url':
      copyToClipboard(elements.urlInput.value);
      return;
      
    case 'base64-encode':
      input = elements.base64Input.value;
      output = btoa(unescape(encodeURIComponent(input)));
      elements.base64Input.value = output;
      break;
      
    case 'base64-decode':
      input = elements.base64Input.value;
      try {
        output = decodeURIComponent(escape(atob(input)));
        elements.base64Input.value = output;
      } catch {
        showToast('Invalid Base64', 'error');
      }
      break;
      
    case 'copy-base64':
      copyToClipboard(elements.base64Input.value);
      return;
      
    case 'escape':
      input = elements.escapeInput.value;
      output = JSON.stringify(input);
      elements.escapeInput.value = output;
      break;
      
    case 'unescape':
      input = elements.escapeInput.value;
      try {
        output = JSON.parse(input);
        elements.escapeInput.value = output;
      } catch {
        showToast('Invalid escaped string', 'error');
      }
      break;
      
    case 'copy-escape':
      copyToClipboard(elements.escapeInput.value);
      return;
      
    case 'json-to-string':
      input = elements.jsonstringInput.value;
      try {
        const parsed = JSON.parse(input);
        output = JSON.stringify(parsed);
        elements.jsonstringInput.value = output;
      } catch {
        showToast('Invalid JSON', 'error');
      }
      break;
      
    case 'string-to-json':
      input = elements.jsonstringInput.value;
      try {
        const parsed = JSON.parse(input);
        output = JSON.stringify(parsed, null, 2);
        elements.jsonstringInput.value = output;
      } catch {
        showToast('Invalid JSON string', 'error');
      }
      break;
      
    case 'copy-jsonstring':
      copyToClipboard(elements.jsonstringInput.value);
      return;
  }
  
  showToast('Operation completed', 'success');
};

/**
 * Toggle theme
 */
const toggleTheme = () => {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  document.body.classList.toggle('theme-dark', state.theme === 'dark');
  saveSettings();
};

/**
 * Update statistics display
 */
const updateStats = () => {
  const input = elements.inputJson.value;
  const stats = getJSONStats(input);
  
  elements.statLines.textContent = stats.lines;
  elements.statChars.textContent = stats.chars.toLocaleString();
  elements.statKeys.textContent = stats.keys;
  elements.statDepth.textContent = stats.depth;
};

/**
 * Show error message
 */
const showError = (message, position) => {
  let errorMsg = message;
  if (position) {
    errorMsg = `Line ${position.line}, Column ${position.column}: ${message}`;
  }
  
  elements.inputError.textContent = errorMsg;
  elements.inputError.classList.add('show');
};

/**
 * Hide error message
 */
const hideError = () => {
  elements.inputError.classList.remove('show');
};

/**
 * Show toast notification
 */
const showToast = (message, type = 'success') => {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  
  elements.toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
};

/**
 * Copy to clipboard helper
 */
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    showToast('Copied to clipboard', 'success');
  } catch {
    showToast('Failed to copy', 'error');
  }
};

/**
 * Escape HTML
 */
const escapeHtml = (str) => {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

/**
 * Debounce helper
 */
const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

/**
 * Save settings to storage
 */
const saveSettings = () => {
  const settings = {
    autoFormat: state.autoFormat,
    indent: state.indent,
    theme: state.theme
  };
  
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.set(settings);
  } else {
    localStorage.setItem('jsonFormatterSettings', JSON.stringify(settings));
  }
};

/**
 * Load settings from storage
 */
const loadSettings = () => {
  const loadSettings = (settings) => {
    if (settings) {
      state.autoFormat = settings.autoFormat ?? false;
      state.indent = settings.indent ?? 2;
      state.theme = settings.theme ?? 'light';
      
      elements.autoFormat.checked = state.autoFormat;
      elements.indentSelect.value = String(state.indent);
      document.body.classList.toggle('theme-dark', state.theme === 'dark');
    }
  };
  
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get(['autoFormat', 'indent', 'theme'], loadSettings);
  } else {
    const saved = localStorage.getItem('jsonFormatterSettings');
    if (saved) {
      loadSettings(JSON.parse(saved));
    }
  }
};
