/**
 * JSON Formatter Utilities
 * Handles JSON formatting, validation, minification, and statistics
 */

/**
 * Format JSON with specified indentation
 * @param {string} input - JSON string to format
 * @param {number|string} indent - Indentation (2, 4, or 'tab')
 * @param {boolean} sortKeys - Whether to sort object keys
 * @returns {Object} Result object with success status and output/error
 */
export const formatJSON = (input, indent = 2, sortKeys = false) => {
  try {
    let parsed = JSON.parse(input);
    
    if (sortKeys) {
      parsed = sortObjectKeys(parsed);
    }
    
    const indentStr = indent === 'tab' ? '\t' : ' '.repeat(indent);
    const output = JSON.stringify(parsed, null, indentStr);
    
    return {
      success: true,
      output,
      parsed
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      position: getErrorPosition(error, input)
    };
  }
};

/**
 * Minify JSON (remove whitespace)
 * @param {string} input - JSON string to minify
 * @returns {Object} Result object with success status and output/error
 */
export const minifyJSON = (input) => {
  try {
    const parsed = JSON.parse(input);
    const output = JSON.stringify(parsed);
    return {
      success: true,
      output,
      parsed
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      position: getErrorPosition(error, input)
    };
  }
};

/**
 * Validate JSON and return detailed error info
 * @param {string} input - JSON string to validate
 * @returns {Object} Validation result
 */
export const validateJSON = (input) => {
  try {
    JSON.parse(input);
    return {
      valid: true,
      message: 'Valid JSON'
    };
  } catch (error) {
    const position = getErrorPosition(error, input);
    const errorType = getErrorType(error, input);
    
    return {
      valid: false,
      error: error.message,
      position,
      errorType,
      message: `Invalid JSON: ${errorType}${position ? ` at line ${position.line}, column ${position.column}` : ''}`
    };
  }
};

/**
 * Get error position from JSON parse error
 * @param {Error} error - The error object
 * @param {string} input - The input JSON string
 * @returns {Object|null} Position object with line and column
 */
export const getErrorPosition = (error, input) => {
  const match = error.message.match(/position (\d+)/);
  if (match) {
    const position = parseInt(match[1]);
    const lines = input.substring(0, position).split('\n');
    return {
      line: lines.length,
      column: lines[lines.length - 1].length + 1,
      index: position
    };
  }
  return null;
};

/**
 * Determine the type of JSON error
 * @param {Error} error - The error object
 * @param {string} input - The input JSON string
 * @returns {string} Error type description
 */
const getErrorType = (error, input) => {
  const message = error.message.toLowerCase();
  
  if (message.includes('unexpected token')) {
    const match = error.message.match(/Unexpected token (.)/);
    if (match) {
      const token = match[1];
      if (token === ',') return 'Unexpected comma (trailing comma or missing value)';
      if (token === '}') return 'Unexpected closing brace';
      if (token === ']') return 'Unexpected closing bracket';
      if (token === ':') return 'Unexpected colon (missing key)';
      return `Unexpected token '${token}'`;
    }
  }
  
  if (message.includes('expected')) {
    if (message.includes(':')) return 'Missing colon after key';
    if (message.includes(',')) return 'Missing comma';
  }
  
  if (message.includes('unterminated string')) return 'Unterminated string (missing closing quote)';
  if (message.includes('unexpected end')) return 'Unexpected end of input (incomplete JSON)';
  if (message.includes('unexpected number')) return 'Invalid number format';
  if (message.includes('unexpected string')) return 'Unexpected string';
  
  return 'Syntax error';
};

/**
 * Sort object keys recursively
 * @param {*} obj - Object to sort
 * @returns {*} Sorted object
 */
const sortObjectKeys = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }
  
  const sorted = {};
  const keys = Object.keys(obj).sort();
  
  for (const key of keys) {
    sorted[key] = sortObjectKeys(obj[key]);
  }
  
  return sorted;
};

/**
 * Calculate JSON statistics
 * @param {string} input - JSON string
 * @returns {Object} Statistics object
 */
export const getJSONStats = (input) => {
  try {
    const parsed = JSON.parse(input);
    const formatted = JSON.stringify(parsed, null, 2);
    
    return {
      lines: formatted.split('\n').length,
      chars: input.length,
      keys: countKeys(parsed),
      depth: getDepth(parsed),
      size: new Blob([input]).size
    };
  } catch {
    return {
      lines: 0,
      chars: 0,
      keys: 0,
      depth: 0,
      size: 0
    };
  }
};

/**
 * Count total keys in JSON object
 * @param {*} obj - Object to count keys in
 * @returns {number} Total key count
 */
const countKeys = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return 0;
  }
  
  if (Array.isArray(obj)) {
    return obj.reduce((sum, item) => sum + countKeys(item), 0);
  }
  
  return Object.keys(obj).length + 
    Object.values(obj).reduce((sum, val) => sum + countKeys(val), 0);
};

/**
 * Get maximum depth of JSON structure
 * @param {*} obj - Object to measure
 * @returns {number} Maximum depth
 */
const getDepth = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return 0;
  }
  
  if (Array.isArray(obj)) {
    if (obj.length === 0) return 1;
    return 1 + Math.max(...obj.map(getDepth));
  }
  
  const keys = Object.keys(obj);
  if (keys.length === 0) return 1;
  
  return 1 + Math.max(...Object.values(obj).map(getDepth));
};

/**
 * Highlight JSON syntax for display
 * @param {string} json - JSON string to highlight
 * @returns {string} HTML with syntax highlighting
 */
export const highlightJSON = (json) => {
  if (!json) return '';
  
  // Escape HTML entities
  const escapeHtml = (str) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  };
  
  // Use JSON.stringify if input is an object
  const jsonString = typeof json === 'object' 
    ? JSON.stringify(json, null, 2) 
    : json;
  
  // Regex to match JSON tokens
  const regex = /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g;
  
  let result = escapeHtml(jsonString);
  
  // We need to highlight after escaping
  result = result.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
    let cls = 'json-number';
    
    if (/^"/.test(match)) {
      if (/:$/.test(match)) {
        cls = 'json-key';
      } else {
        cls = 'json-string';
      }
    } else if (/true|false/.test(match)) {
      cls = 'json-boolean';
    } else if (/null/.test(match)) {
      cls = 'json-null';
    }
    
    return `<span class="${cls}">${match}</span>`;
  });
  
  // Add brackets highlighting
  result = result.replace(/([{}\[\]])/g, '<span class="json-bracket">$1</span>');
  
  return result;
};
