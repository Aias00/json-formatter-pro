/**
 * JSONPath Query Utilities
 * Implements JSONPath query syntax for JSON data
 */

/**
 * Execute JSONPath query on JSON data
 * @param {*} json - Parsed JSON object
 * @param {string} path - JSONPath expression
 * @returns {Object} Query result with matches
 */
export const queryJSONPath = (json, path) => {
  try {
    const tokens = tokenize(path);
    let results = [json];
    const paths = [['$']];
    
    for (const token of tokens) {
      const newResults = [];
      const newPaths = [];
      
      for (let i = 0; i < results.length; i++) {
        const current = results[i];
        const currentPath = paths[i];
        
        const { values, paths: tokenPaths } = applyToken(token, current, currentPath);
        newResults.push(...values);
        newPaths.push(...tokenPaths);
      }
      
      results = newResults;
      paths.push(...newPaths.slice(results.length));
      
      // Update paths array properly
      while (paths.length > results.length) {
        paths.shift();
      }
    }
    
    return {
      success: true,
      results,
      paths: paths.slice(0, results.length),
      count: results.length
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      results: [],
      count: 0
    };
  }
};

/**
 * Tokenize JSONPath expression
 * @param {string} path - JSONPath expression
 * @returns {Array} Array of tokens
 */
const tokenize = (path) => {
  if (!path || path === '$') {
    return [];
  }
  
  const tokens = [];
  let i = 0;
  
  // Skip leading $
  if (path[0] === '$') {
    i = 1;
  }
  
  while (i < path.length) {
    // Skip dots
    if (path[i] === '.') {
      i++;
      continue;
    }
    
    // Bracket notation [index] or [*] or ['key']
    if (path[i] === '[') {
      i++;
      let bracket = '';
      while (i < path.length && path[i] !== ']') {
        bracket += path[i];
        i++;
      }
      i++; // Skip closing bracket
      
      // Wildcard [*]
      if (bracket === '*') {
        tokens.push({ type: 'wildcard' });
      }
      // String key ['key']
      else if (bracket.startsWith("'") || bracket.startsWith('"')) {
        tokens.push({ 
          type: 'key', 
          value: bracket.slice(1, -1) 
        });
      }
      // Number index [0]
      else if (/^\d+$/.test(bracket)) {
        tokens.push({ 
          type: 'index', 
          value: parseInt(bracket) 
        });
      }
      // Slice [start:end]
      else if (bracket.includes(':')) {
        const [start, end] = bracket.split(':').map(s => s ? parseInt(s) : null);
        tokens.push({ type: 'slice', start, end });
      }
      // Filter expression [?(...)]
      else if (bracket.startsWith('?')) {
        tokens.push({ 
          type: 'filter', 
          expression: bracket.slice(1) 
        });
      }
      continue;
    }
    
    // Double dot (recursive descent)
    if (path[i] === '.' && path[i + 1] === '.') {
      tokens.push({ type: 'recursive' });
      i += 2;
      continue;
    }
    
    // Wildcard *
    if (path[i] === '*') {
      tokens.push({ type: 'wildcard' });
      i++;
      continue;
    }
    
    // Identifier (key name)
    let identifier = '';
    while (i < path.length && path[i] !== '.' && path[i] !== '[') {
      identifier += path[i];
      i++;
    }
    
    if (identifier) {
      tokens.push({ type: 'key', value: identifier });
    }
  }
  
  return tokens;
};

/**
 * Apply token to current value
 * @param {Object} token - Token object
 * @param {*} current - Current value
 * @param {Array} currentPath - Current path array
 * @returns {Object} Object with values and paths
 */
const applyToken = (token, current, currentPath) => {
  const values = [];
  const paths = [];
  
  switch (token.type) {
    case 'key':
      if (current !== null && typeof current === 'object' && !Array.isArray(current)) {
        if (token.value in current) {
          values.push(current[token.value]);
          paths.push([...currentPath, token.value]);
        }
      }
      break;
      
    case 'index':
      if (Array.isArray(current) && token.value >= 0 && token.value < current.length) {
        values.push(current[token.value]);
        paths.push([...currentPath, token.value]);
      }
      break;
      
    case 'wildcard':
      if (Array.isArray(current)) {
        for (let i = 0; i < current.length; i++) {
          values.push(current[i]);
          paths.push([...currentPath, i]);
        }
      } else if (current !== null && typeof current === 'object') {
        for (const key of Object.keys(current)) {
          values.push(current[key]);
          paths.push([...currentPath, key]);
        }
      }
      break;
      
    case 'slice':
      if (Array.isArray(current)) {
        const start = token.start ?? 0;
        const end = token.end ?? current.length;
        for (let i = start; i < Math.min(end, current.length); i++) {
          values.push(current[i]);
          paths.push([...currentPath, i]);
        }
      }
      break;
      
    case 'recursive':
      // Recursive descent - collect all values recursively
      const collect = (obj, path) => {
        if (obj === null || typeof obj !== 'object') {
          return;
        }
        
        if (Array.isArray(obj)) {
          for (let i = 0; i < obj.length; i++) {
            values.push(obj[i]);
            paths.push([...path, i]);
            collect(obj[i], [...path, i]);
          }
        } else {
          for (const key of Object.keys(obj)) {
            values.push(obj[key]);
            paths.push([...path, key]);
            collect(obj[key], [...path, key]);
          }
        }
      };
      collect(current, currentPath);
      break;
      
    case 'filter':
      // Simple filter expression support
      // Supports: @.property, comparison operators
      if (Array.isArray(current)) {
        const filterExpr = token.expression;
        for (let i = 0; i < current.length; i++) {
          if (evaluateFilter(current[i], filterExpr)) {
            values.push(current[i]);
            paths.push([...currentPath, i]);
          }
        }
      }
      break;
  }
  
  return { values, paths };
};

/**
 * Evaluate filter expression
 * @param {*} item - Item to evaluate
 * @param {string} expression - Filter expression
 * @returns {boolean} Whether item matches filter
 */
const evaluateFilter = (item, expression) => {
  // Simple filter implementation
  // Supports: @.property == value, @.property != value
  // @.property > value, @.property < value
  
  const match = expression.match(/@\.(\w+)\s*(==|!=|>|<|>=|<=)\s*(.+)/);
  if (!match) return false;
  
  const [, property, operator, valueStr] = match;
  const itemValue = item[property];
  
  // Parse value
  let compareValue;
  if (valueStr.startsWith("'") || valueStr.startsWith('"')) {
    compareValue = valueStr.slice(1, -1);
  } else if (valueStr === 'true') {
    compareValue = true;
  } else if (valueStr === 'false') {
    compareValue = false;
  } else if (valueStr === 'null') {
    compareValue = null;
  } else if (!isNaN(valueStr)) {
    compareValue = parseFloat(valueStr);
  } else {
    compareValue = valueStr;
  }
  
  switch (operator) {
    case '==': return itemValue == compareValue;
    case '!=': return itemValue != compareValue;
    case '>': return itemValue > compareValue;
    case '<': return itemValue < compareValue;
    case '>=': return itemValue >= compareValue;
    case '<=': return itemValue <= compareValue;
    default: return false;
  }
};

/**
 * Format query results for display
 * @param {Object} result - Query result object
 * @returns {string} Formatted output
 */
export const formatQueryResult = (result) => {
  if (!result.success) {
    return `Error: ${result.error}`;
  }
  
  if (result.count === 0) {
    return 'No results found';
  }
  
  const output = result.results.map((item, index) => {
    const path = result.paths[index];
    const value = typeof item === 'object' 
      ? JSON.stringify(item, null, 2) 
      : String(item);
    return `Path: ${path.join('.')}\nValue: ${value}`;
  });
  
  return `Found ${result.count} result(s):\n\n${output.join('\n\n---\n\n')}`;
};

/**
 * Get JSONPath suggestions based on JSON structure
 * @param {*} json - Parsed JSON object
 * @param {string} partialPath - Partial path for completion
 * @returns {Array} Array of suggestions
 */
export const getPathSuggestions = (json, partialPath) => {
  const suggestions = [];
  const tokens = tokenize(partialPath);
  
  let current = json;
  for (const token of tokens) {
    if (token.type === 'key' && current !== null && typeof current === 'object') {
      current = current[token.value];
    } else if (token.type === 'index' && Array.isArray(current)) {
      current = current[token.value];
    }
  }
  
  if (current !== null && typeof current === 'object') {
    if (Array.isArray(current)) {
      suggestions.push(`[${current.length - 1}]`);
      suggestions.push('[*]');
      if (current.length > 0 && typeof current[0] === 'object') {
        Object.keys(current[0]).forEach(key => {
          suggestions.push(`[*].${key}`);
        });
      }
    } else {
      Object.keys(current).forEach(key => {
        suggestions.push(`.${key}`);
      });
      suggestions.push('.*');
    }
  }
  
  return suggestions;
};
