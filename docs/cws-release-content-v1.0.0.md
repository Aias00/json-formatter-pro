# Chrome Web Store Release Content (v1.0.0)

## Assumption

- Release type: first publish
- Version: 1.0.0

## Short Summary

Format, validate, query, compare, and convert JSON locally in Chrome.

## Detailed Description

JSON Formatter Pro helps developers and analysts work with JSON faster and more reliably.

Key features:
- Format and minify JSON with configurable indentation.
- Validate JSON and surface clear error locations.
- Compare two JSON documents and show differences.
- Query JSON using JSONPath-style expressions.
- Convert JSON to YAML, XML, TypeScript, Python, and JSON Schema.
- Utility tools for URL/Base64/string escape conversions.

Privacy first:
- JSON processing is local in the extension UI.
- No personal data collection.
- No remote script execution.

## Single Purpose Statement

The extension has a single purpose: helping users inspect and transform JSON data directly in the browser. Every feature (formatting, validation, querying, diff, and conversion) supports this same JSON workflow and does not provide unrelated functionality.

## Permissions Justification

- `storage`: saves user preferences (theme, indentation, auto-format) locally for a consistent editing experience. No personal data is collected or transferred.
- `clipboardWrite`: allows copy actions only when the user clicks copy buttons. Clipboard content is not transmitted to external services.

## Remote Code Declaration

No. All executable JavaScript/CSS/HTML is packaged in the extension bundle. The extension does not execute remote JavaScript, does not use `eval`/`new Function`, and does not execute remote WebAssembly.

## Data Use Declaration

- Data collection: none
- Personal or sensitive user data: none
- Data selling: no
- Data sharing with third parties: no
- Data used for unrelated purposes: no

All processing is local to the browser extension UI.

## Reviewer Notes

Version 1.0.0 initial release.

How to test:
1. Click extension icon and open the extension page.
2. Paste JSON in Format mode; run Format/Minify/Validate.
3. Use Diff mode with two JSON inputs and click Compare.
4. Use Query mode with JSONPath examples.
5. Use Convert and utility tools; verify copy buttons.

Permissions scope:
- `storage`: local settings only.
- `clipboardWrite`: user-triggered copy only.

No host permissions are requested.
No remote code is executed.

