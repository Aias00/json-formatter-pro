/**
 * JSON Diff Utilities
 * Handles comparison and diff visualization of JSON objects
 */

/**
 * Compare two JSON objects and find differences
 * @param {*} json1 - First JSON object
 * @param {*} json2 - Second JSON object
 * @returns {Array} Array of changes
 */
export const diffJSON = (json1, json2) => {
  const changes = [];
  
  const compare = (o1, o2, path = '') => {
    // Both null
    if (o1 === null && o2 === null) {
      return;
    }
    
    // One is null
    if (o1 === null || o2 === null) {
      changes.push({
        type: 'changed',
        path,
        old: o1,
        new: o2,
        message: `${path || 'root'}: ${formatValue(o1)} → ${formatValue(o2)}`
      });
      return;
    }
    
    // Different types
    if (typeof o1 !== typeof o2) {
      changes.push({
        type: 'changed',
        path,
        old: o1,
        new: o2,
        message: `${path || 'root'}: type changed from ${getTypeName(o1)} to ${getTypeName(o2)}`
      });
      return;
    }
    
    // Primitive types (string, number, boolean)
    if (typeof o1 !== 'object') {
      if (o1 !== o2) {
        changes.push({
          type: 'changed',
          path,
          old: o1,
          new: o2,
          message: `${path || 'root'}: ${formatValue(o1)} → ${formatValue(o2)}`
        });
      }
      return;
    }
    
    // Array vs Object
    if (Array.isArray(o1) !== Array.isArray(o2)) {
      changes.push({
        type: 'changed',
        path,
        old: o1,
        new: o2,
        message: `${path || 'root'}: changed from array to object or vice versa`
      });
      return;
    }
    
    // Arrays
    if (Array.isArray(o1)) {
      const maxLen = Math.max(o1.length, o2.length);
      
      for (let i = 0; i < maxLen; i++) {
        const newPath = `${path}[${i}]`;
        
        if (i >= o1.length) {
          changes.push({
            type: 'added',
            path: newPath,
            new: o2[i],
            message: `${newPath}: +${formatValue(o2[i])}`
          });
        } else if (i >= o2.length) {
          changes.push({
            type: 'removed',
            path: newPath,
            old: o1[i],
            message: `${newPath}: -${formatValue(o1[i])}`
          });
        } else {
          compare(o1[i], o2[i], newPath);
        }
      }
      return;
    }
    
    // Objects
    const keys1 = Object.keys(o1);
    const keys2 = Object.keys(o2);
    const allKeys = new Set([...keys1, ...keys2]);
    
    for (const key of allKeys) {
      const newPath = path ? `${path}.${key}` : key;
      
      if (!(key in o1)) {
        changes.push({
          type: 'added',
          path: newPath,
          new: o2[key],
          message: `${newPath}: +${formatValue(o2[key])}`
        });
      } else if (!(key in o2)) {
        changes.push({
          type: 'removed',
          path: newPath,
          old: o1[key],
          message: `${newPath}: -${formatValue(o1[key])}`
        });
      } else {
        compare(o1[key], o2[key], newPath);
      }
    }
  };
  
  compare(json1, json2);
  return changes;
};

/**
 * Get type name for display
 * @param {*} value - Value to get type name for
 * @returns {string} Type name
 */
const getTypeName = (value) => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
};

/**
 * Format value for display
 * @param {*} value - Value to format
 * @returns {string} Formatted string
 */
const formatValue = (value) => {
  if (value === null) return 'null';
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return `[array(${value.length})]`;
    }
    return `{object(${Object.keys(value).length})}`;
  }
  return String(value);
};

/**
 * Generate visual diff output
 * @param {Array} changes - Array of changes from diffJSON
 * @returns {string} HTML formatted diff output
 */
export const formatDiffOutput = (changes) => {
  if (changes.length === 0) {
    return '<div class="diff-item unchanged"><span class="diff-icon">⚪</span>No differences found</div>';
  }
  
  // Group changes by type
  const added = changes.filter(c => c.type === 'added');
  const removed = changes.filter(c => c.type === 'removed');
  const changed = changes.filter(c => c.type === 'changed');
  
  let output = '';
  
  // Show added items first
  for (const change of added) {
    output += `<div class="diff-item added"><span class="diff-icon">🟢</span><strong>Added:</strong> ${escapeHtml(change.message)}</div>`;
  }
  
  // Show removed items
  for (const change of removed) {
    output += `<div class="diff-item removed"><span class="diff-icon">🔴</span><strong>Removed:</strong> ${escapeHtml(change.message)}</div>`;
  }
  
  // Show changed items
  for (const change of changed) {
    output += `<div class="diff-item changed"><span class="diff-icon">🟡</span><strong>Changed:</strong> ${escapeHtml(change.message)}</div>`;
  }
  
  // Summary
  const summary = [];
  if (added.length > 0) summary.push(`${added.length} added`);
  if (removed.length > 0) summary.push(`${removed.length} removed`);
  if (changed.length > 0) summary.push(`${changed.length} changed`);
  
  output += `<div class="diff-item" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-color);"><strong>Summary:</strong> ${summary.join(', ')}</div>`;
  
  return output;
};

/**
 * Escape HTML for safe display
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
const escapeHtml = (str) => {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

/**
 * Generate side-by-side diff view
 * @param {*} json1 - First JSON object
 * @param {*} json2 - Second JSON object
 * @returns {Object} Object with left and right formatted JSON
 */
export const generateSideBySideDiff = (json1, json2) => {
  const changes = diffJSON(json1, json2);
  const changePaths = new Set(changes.map(c => c.path));
  
  // For now, return formatted JSON with highlights
  // A full side-by-side diff would require more complex line-by-line comparison
  return {
    left: JSON.stringify(json1, null, 2),
    right: JSON.stringify(json2, null, 2),
    changes
  };
};

/**
 * Calculate similarity percentage between two JSON objects
 * @param {*} json1 - First JSON object
 * @param {*} json2 - Second JSON object
 * @returns {number} Similarity percentage (0-100)
 */
export const calculateSimilarity = (json1, json2) => {
  const changes = diffJSON(json1, json2);
  
  const countNodes = (obj) => {
    if (obj === null || typeof obj !== 'object') {
      return 1;
    }
    
    if (Array.isArray(obj)) {
      return obj.reduce((sum, item) => sum + countNodes(item), 1);
    }
    
    return Object.values(obj).reduce((sum, val) => sum + countNodes(val), Object.keys(obj).length);
  };
  
  const totalNodes = countNodes(json1) + countNodes(json2);
  const changeCount = changes.length;
  
  if (totalNodes === 0) return 100;
  
  const similarity = Math.max(0, Math.min(100, ((totalNodes - changeCount * 2) / totalNodes) * 100));
  return Math.round(similarity);
};
