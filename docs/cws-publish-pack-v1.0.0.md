# CWS Publish Pack - JSON Formatter Pro v1.0.0

Release date: February 27, 2026
Release type: First publish
Target version: 1.0.0

## 1) Release readiness checklist

- PASS: Manifest is valid JSON and uses MV3.
- PASS: Permissions minimized to `storage` and `clipboardWrite`.
- PASS: No host permissions requested.
- PASS: No remote code execution (`eval`/`new Function`/remote wasm not used).
- PASS: Store assets generated and validated.
- PASS: Upload ZIP generated from runtime source files only.
- ACTION NEEDED: Replace privacy policy contact placeholder `<your-support-email>` with real support email and publish policy at a public URL.

## 2) Required manifest changes

Completed for this release:
- Removed unused `activeTab` permission.

Current permissions:
- `storage`
- `clipboardWrite`

## 3) Graphic asset checklist

Required:
- PASS: `icon-128x128.png` (128x128)
- PASS: `screenshots/screenshot-1-1280x800.png` (1280x800, 1 screenshot)
- PASS: `small-promo-440x280.png` (440x280)

Optional:
- PASS: `marquee-1400x560.png` (1400x560)

Asset root:
- `/Users/aias/Work/github/json-formatter-pro/release/store-assets`

## 4) Privacy policy decision

Decision: update required (first publish)

Reason:
- First CWS release requires a finalized and publicly accessible privacy policy URL.
- Policy text exists in repo and matches current behavior; only support contact + hosting URL must be finalized.

Canonical policy file:
- `/Users/aias/Work/github/json-formatter-pro/docs/privacy-policy.md`

## 5) Ready-to-paste CWS text blocks

### Short summary
Format, validate, query, compare, and convert JSON locally in Chrome.

### Detailed description (EN)
JSON Formatter Pro helps developers and analysts work with JSON faster and more reliably.

Key features:
1. Format and minify JSON with configurable indentation.
2. Validate JSON and show clear error locations.
3. Compare two JSON documents and highlight differences.
4. Query JSON with JSONPath-style expressions.
5. Convert JSON to YAML, XML, TypeScript, Python, and JSON Schema.
6. Utility tools for URL/Base64/string escape conversion.

All JSON processing runs locally in the extension UI.

### Single purpose
The extension has a single purpose: helping users inspect and transform JSON data directly in the browser. Every feature (formatting, validation, querying, diff, and conversion) supports this same JSON workflow and does not provide unrelated functionality.

### Permission rationale
- `storage`: Stores local user preferences (theme, indentation, auto-format) in `chrome.storage.local` for consistent behavior across sessions. No personal data is collected or transmitted.
- `clipboardWrite`: Used only when users click copy actions to copy output content. Clipboard content is not sent to external services.

### Remote code answer
No, this extension does not use remote code.
All executable JavaScript/CSS/HTML is packaged with the extension. No remote JS/Wasm execution and no `eval`/`new Function` usage.

### Data use disclosure
- Personal data collection: none
- Sensitive data collection: none
- Data sale: no
- Data sharing with third parties: no
- Purpose limitation: all processing is local and related to JSON tooling only

### Reviewer notes
Initial release v1.0.0.

Test path:
1. Open extension from toolbar.
2. In Format mode, run Format/Minify/Validate.
3. In Diff mode, compare two JSON documents.
4. In Query mode, run sample JSONPath queries.
5. Verify Convert and copy actions.

Permission scope:
- `storage`: local settings only.
- `clipboardWrite`: user-triggered copy only.

No host permissions.
No remote code execution.

## 6) Final packaging command and ZIP path

Command:
```bash
python3 - <<'PY'
import os, zipfile
root='/Users/aias/Work/github/json-formatter-pro'
out=os.path.join(root,'release','chrome-webstore-v1.0.0.zip')
os.makedirs(os.path.dirname(out), exist_ok=True)
files=[
  'manifest.json',
  'background.js',
  'popup.html',
  'popup.js',
  'styles.css',
  'icons/icon16.png',
  'icons/icon48.png',
  'icons/icon128.png',
  'utils/formatter.js',
  'utils/converter.js',
  'utils/differ.js',
  'utils/query.js',
]
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as z:
  for rel in files:
    z.write(os.path.join(root,rel), arcname=rel)
print(out)
PY
```

ZIP:
- `/Users/aias/Work/github/json-formatter-pro/release/chrome-webstore-v1.0.0.zip`
