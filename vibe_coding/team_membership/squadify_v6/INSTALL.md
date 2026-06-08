# Squadify — Installation & Configuration Guide

Exact steps to install, run, and troubleshoot Squadify. Based on real experience — every fix here was tested.

---

## Prerequisites

| Tool | Version | Check |
|---|---|---|
| Node.js | 20.x LTS | `node --version` |
| npm | 10+ | `npm --version` |
| Expo Go | SDK 54 | Update in App Store / Google Play |

### Install Node.js 20
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
# Restart terminal, then:
nvm install 20
nvm alias default 20
node --version  # should show v20.x.x
```

> Make sure Expo Go on your phone is updated to the latest version — it must match SDK 54.

---

## First-time setup

Run in order — do not skip any step:

```bash
cd squadify
rm -rf node_modules
rm -f package-lock.json
npm install
npx expo install --fix
npm install expo-asset
npx expo start --clear
```

| Command | Why |
|---|---|
| `rm -rf node_modules` | Clean slate — removes stale packages |
| `npm install` | Installs all dependencies from package.json |
| `npx expo install --fix` | Auto-corrects version mismatches |
| `npm install expo-asset` | Required by Expo, not always auto-installed |
| `npx expo start --clear` | Clears Metro cache before first run |

Note: `babel-preset-expo` is already in `devDependencies` and installs automatically with `npm install`.

---

## Daily use

```bash
npx expo start --clear
```

- Scan QR code with **Expo Go** on your phone
- Press `i` for iOS Simulator (Mac + Xcode required)
- Press `a` for Android emulator (Android Studio required)

### Phone + Mac must be on the same Wi-Fi
If connection fails: `npx expo start --tunnel`

---

## Updating the app

When you receive new source files:

1. Copy files into your `squadify/` folder, replacing existing ones
2. Run: `npx expo start --clear`

Only run `npm install` again if `package.json` changed — the guide says explicitly when that happens.

---

## Critical configuration rules

### package.json
```json
{
  "name": "squadify",
  "main": "node_modules/expo/AppEntry.js",
  "dependencies": {
    "expo": "~54.0.0",
    "expo-asset": "~11.0.0"
  },
  "devDependencies": {
    "babel-preset-expo": "^12.0.0"
  }
}
```
- `main` must always be `node_modules/expo/AppEntry.js`
- Never run `npm install expo` without a version number
- Always include `expo-asset` and `babel-preset-expo`

### app.json
```json
{
  "expo": {
    "name": "Squadify",
    "slug": "squadify",
    "sdkVersion": "54.0.0",
    "plugins": ["expo-document-picker"]
  }
}
```
- Only `expo-document-picker` in plugins — never `expo-sqlite` or `expo-router`

### expo-sqlite import
```js
import * as SQLite from 'expo-sqlite';
// Uses async API: openDatabaseAsync, execAsync, runAsync, getFirstAsync, getAllAsync
```

### expo-file-system — SDK 54 new API
```js
import { File, Directory, Paths } from 'expo-file-system/next';
// Never use the old API — all old methods are deprecated in SDK 54
```

### Safe area
```js
import { SafeAreaView } from 'react-native-safe-area-context';
<SafeAreaView edges={['top']}>...</SafeAreaView>
// NOT from 'react-native' — that is deprecated in SDK 54
```

---

## Troubleshooting

### `Cannot find module 'babel-preset-expo'`
```bash
npm install babel-preset-expo
npx expo start --clear
```

### `expo-asset` cannot be found
```bash
npm install expo-asset
npx expo start --clear
```

### `getInfoAsync` / `makeDirectoryAsync` / `writeAsStringAsync` deprecated
These old `expo-file-system` methods are deprecated in SDK 54. Squadify uses `expo-file-system/next` with `File`, `Directory`, and `Paths` — no action needed if using the latest package.

### SDK version mismatch in Expo Go
Update Expo Go on your phone to the latest version.

### App shows default Expo page (Try / Explore / Get a fresh start)
1. `package.json` → `"main"` must be `"node_modules/expo/AppEntry.js"`
2. `rm -rf app/` — delete the app/ folder if it exists
3. `npx expo start --clear`

### `toReversed is not a function`
Node.js too old:
```bash
nvm install 20 && nvm use 20
```

### Content hidden behind status bar or home button bar
All screens use `SafeAreaView` from `react-native-safe-area-context` with `edges={['top']}`. Make sure `<SafeAreaProvider>` wraps everything in `App.js`.

### QR code scanned but app doesn't load
```bash
npx expo start --tunnel
```

### Full clean reinstall
```bash
rm -rf node_modules
rm -f package-lock.json
npm install
npx expo install --fix
npm install expo-asset
npx expo start --clear
```

---

*Squadify · Installation Guide · SDK 54*

---

## SDK 54 file system — definitive rule (learned through testing)

In SDK 54 every method in plain `expo-file-system` is deprecated and throws errors at runtime. The solution is to use two different sub-packages:

| Operation | Package | Why |
|---|---|---|
| Read a picked file | `expo-file-system/legacy` | Only package that can reliably read document picker URIs on Android |
| Write a file | `expo-file-system/next` | New object API, works for writing to app's own directories |
| Never use | `expo-file-system` (plain) | All methods deprecated — `copyAsync`, `readAsStringAsync`, `writeAsStringAsync`, `getInfoAsync`, `makeDirectoryAsync`, `EncodingType` all throw errors |

### Import pattern for SettingsScreen (CSV import):
```js
import * as FileSystemLegacy from 'expo-file-system/legacy';

// Copy first — Android picker URIs cannot be read directly
const dest = FileSystemLegacy.cacheDirectory + 'squadify_import.csv';
await FileSystemLegacy.copyAsync({ from: asset.uri, to: dest });
const text = await FileSystemLegacy.readAsStringAsync(dest, { encoding: 'utf8' });
```

### Import pattern for csv.js (CSV export):
```js
import { File, Directory, Paths } from 'expo-file-system/next';
const dir = new Directory(Paths.document, 'Squadify');
if (!dir.exists) dir.create();
const file = new File(dir, filename);
file.write(csv);
```
