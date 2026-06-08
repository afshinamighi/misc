# Squadify — Full Specification Prompt

Build a cross-platform mobile app (iOS + Android) called **Squadify** using React Native with Expo SDK 54. The app is a sports team membership, attendance, and fee tracker for a coach/admin.

---

## App identity

- App name: **Squadify**
- Slug: `squadify`
- Bundle identifier (iOS): `com.yourteam.squadify`
- Package (Android): `com.yourteam.squadify`
- DB file: `squadify.db`
- Export folder: `/Documents/Squadify/`
- Export filename prefix: `squadify_balances_`

---

## Technology stack

- React Native with Expo SDK 54 (managed workflow)
- `expo-sqlite` v16 — async API (`openDatabaseAsync`, `execAsync`, `runAsync`, `getFirstAsync`, `getAllAsync`). No `/legacy` import.
- `expo-file-system/next` — for WRITING files only (File, Directory, Paths classes)
- `expo-file-system/legacy` — for READING files only (copyAsync, readAsStringAsync)
- `expo-document-picker` for importing CSV files from the device
- `expo-sharing` for sharing exported CSV
- `react-native-safe-area-context` — `SafeAreaView` with `edges={['top']}` on all screens
- `react-native-svg` for tab bar icons
- React Navigation: `@react-navigation/bottom-tabs` + `@react-navigation/native-stack`
- No backend — all data stored locally on device

### package.json critical fields
```json
{
  "name": "squadify",
  "main": "node_modules/expo/AppEntry.js",
  "dependencies": {
    "expo": "~54.0.0",
    "expo-asset": "~11.0.0",
    "expo-file-system": "~18.0.0"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0",
    "babel-preset-expo": "^12.0.0"
  }
}
```

### app.json critical fields
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
Never add `expo-sqlite` or `expo-router` to plugins.

---

## CRITICAL: File system API rules for SDK 54

In SDK 54, the main `expo-file-system` package deprecated ALL its methods.
The solution is to use TWO different sub-packages depending on the operation:

### For WRITING files — use `expo-file-system/next`
```js
import { File, Directory, Paths } from 'expo-file-system/next';

// Create directory
const dir = new Directory(Paths.document, 'Squadify');
if (!dir.exists) dir.create();

// Write a file
const file = new File(dir, 'output.csv');
file.write(csvString);

// Get file size
const size = file.exists ? (file.size ?? 0) : 0;

// Share
await Sharing.shareAsync(file.uri, { mimeType: 'text/csv' });
```

### For READING files (especially from document picker) — use `expo-file-system/legacy`
```js
import * as FileSystemLegacy from 'expo-file-system/legacy';

// Copy picked file to cache (required — Android picker URIs expire)
const dest = FileSystemLegacy.cacheDirectory + 'squadify_import.csv';
await FileSystemLegacy.copyAsync({ from: asset.uri, to: dest });

// Read from cache — use plain 'utf8' string, NOT FileSystem.EncodingType.UTF8
const text = await FileSystemLegacy.readAsStringAsync(dest, { encoding: 'utf8' });
```

### Why this split?
- `expo-file-system/next` File.text() returns `undefined` on URIs from the document picker
- XMLHttpRequest fails on Android with picker URIs
- `copyAsync` and `readAsStringAsync` from main `expo-file-system` throw deprecation errors
- `expo-file-system/legacy` works reliably for reading picker files on both iOS and Android
- `expo-file-system/next` works correctly for writing to the app's own directories

### NEVER use these — all deprecated in SDK 54 and will throw errors:
```js
// ❌ All of these throw deprecation errors:
import * as FileSystem from 'expo-file-system';
FileSystem.readAsStringAsync(...)
FileSystem.writeAsStringAsync(...)
FileSystem.copyAsync(...)
FileSystem.makeDirectoryAsync(...)
FileSystem.getInfoAsync(...)
FileSystem.EncodingType.UTF8  // undefined — causes "Cannot read property UTF8"
```

---

## Safe area — SDK 54

```js
import { SafeAreaView } from 'react-native-safe-area-context';
<SafeAreaView edges={['top']}>...</SafeAreaView>
```
Never use `SafeAreaView` from `react-native` — deprecated in SDK 54.
`App.js` must wrap everything in `<SafeAreaProvider>`.

---

## Database schema (SQLite — squadify.db)

**members**
- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `first_name` TEXT NOT NULL
- `last_name` TEXT NOT NULL
- `position` TEXT
- `sport` TEXT DEFAULT ''
- `balance` REAL DEFAULT 0
- `created_at` TEXT
- `updated_at` TEXT

**sessions**
- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `name` TEXT
- `date` TEXT
- `location` TEXT
- `fee` REAL
- `created_at` TEXT

**session_attendance**
- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `session_id` INTEGER
- `member_id` INTEGER
- `present` INTEGER (0 or 1)

**settings**
- `key` TEXT PRIMARY KEY
- `value` TEXT

Default settings:
- `fee` → `"5.00"`
- `team_name` → `"My Team"`
- `season` → `"Season 1"`
- `export_path` → `"/Documents/Squadify/"`
- `sports_list` → `"Volleyball,Football,Badminton"`

Run `ALTER TABLE members ADD COLUMN sport TEXT DEFAULT ""` in try/catch on every init for upgrade safety.

---

## App structure

Four bottom tabs: Squad, Sessions, Balance, Settings.
- Active tab color: `#1a9e75`
- Tab icons: custom SVG via `react-native-svg`

Navigation stacks:
- Squad: SquadMain → AddMember, MemberDetail
- Sessions: SessionsMain → NewSession, EditSession
- Settings: SettingsMain → ImportPreview
- Balance: single screen

---

## Tab 1 · Squad

Top bar (`#1a1a2e`): title "Squad", subtitle with team name and member count.

Three stat cards: pool balance, members in debt count, session fee.

Member list (FlatList):
- Avatar (initials, colour by `id % 6`)
- Full name — red if balance < 0
- Subtitle: assigned sport (or "No sport assigned")
- Balance — green if ≥ 0, red if < 0

Tapping row → MemberDetail. "+ Add member" → AddMember.

---

## Add Member screen

Fields: First name (required), Last name (**optional** — if left empty, stored as `"."` in the database and CSV export), Position (optional), Sport (pill selector), Opening balance (€, default 0).

The label must read "Last name (optional)". On save, if last name is empty: `resolvedLastName = lastName.trim() || '.'`.

---

## Member Detail screen

Profile card. Edit button → inline edit form (all fields including sport). Full session history. "Remove member" with confirmation.

---

## Tab 2 · Sessions

Top bar: "Sessions" + season and count.
Three stat cards: total, avg attendance %, total collected.
Session list newest first. Tapping → EditSession. "+ New session" → NewSession.

---

## New Session screen

Optional name, date (today pre-filled), location.
Member checklist with teal checkboxes. Present/Absent pill. Sport shown as subtitle.
**Members are sorted alphabetically by first name** using `localeCompare` with `sensitivity: 'base'`.
Summary: present count, total deduction.
"Save session & deduct fees" → inserts session, attendance rows, deducts fee from present members.

---

## Edit Session screen

Pre-populated with existing data. Same layout as New Session.
**Members are sorted alphabetically by first name** using `localeCompare` with `sensitivity: 'base'`.
Diffs attendance on save:
- Absent → present: deduct fee
- Present → absent: refund fee
- New member: insert row, deduct if present

---

## Tab 3 · Balance

Search + selected member highlight. Amount input + Add/Deduct buttons. Inline ± quick buttons per member. All changes persist immediately.

---

## Tab 4 · Settings

**Session**: Fee (editable), Currency (display).
**Team**: Team name (editable), Season (editable).
**Sports**: Editable list — add/remove sports, persists to settings.
**Import members**: CSV import using `expo-file-system/legacy` (see file system rules above).
**Export**: CSV export using `expo-file-system/next`.
**Data**: DB size, last export timestamp.

---

## CSV Import implementation (EXACT code required)

```js
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystemLegacy from 'expo-file-system/legacy';

const handleImport = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['text/csv', 'text/plain', 'text/comma-separated-values', '*/*'],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];

    // Copy to cache first — Android picker URIs expire and cannot be read directly
    const dest = FileSystemLegacy.cacheDirectory + 'squadify_import.csv';
    await FileSystemLegacy.copyAsync({ from: asset.uri, to: dest });

    // Read from cache — use plain 'utf8' string not FileSystem.EncodingType
    const text = await FileSystemLegacy.readAsStringAsync(dest, { encoding: 'utf8' });

    if (!text || text.trim().length === 0) {
      Alert.alert('Empty file', 'The file appears to be empty.');
      return;
    }
    navigation.navigate('ImportPreview', { csvText: text, fileName: asset.name });
  } catch (e) {
    Alert.alert('Import failed', `Reason: ${e.message || 'Unknown error'}`);
  }
};
```

---

## CSV Parser requirements

The parseCSV function must handle:
1. **BOM character** (`\uFEFF`) — strip with `text.replace(/^\uFEFF/, '')`
2. **Windows line endings** (`\r\n`) — split with `/\r?\n/`
3. **Empty last name** — treat as empty string, not error
4. **Optional header row** — skip if first column is "first_name" (case-insensitive)
5. **Missing balance** — default to 0

---

## Import Preview screen

Parses CSV. Shows row count, preview list, DB fields. "Confirm import" upserts each row (match by first_name + last_name, case-insensitive).

---

## Design system

- Top bars: `#1a1a2e`, `paddingTop: 6`
- Teal accent: `#1a9e75`
- Positive: `#0F6E56`, Negative: `#A32D2D`
- Avatar palette (6, by `id % 6`):
  `[{bg:'#E6F1FB',text:'#0C447C'},{bg:'#E1F5EE',text:'#085041'},{bg:'#EEEDFE',text:'#3C3489'},{bg:'#FAECE7',text:'#712B13'},{bg:'#EAF3DE',text:'#27500A'},{bg:'#FAEEDA',text:'#633806'}]`
- Theme via `useColorScheme()` + React Context — never hardcode colours
- No gradients, shadows, or emoji in UI

---

## Data logic rules

1. Session save: present members → `balance -= fee`
2. Session edit: diff attendance, deduct/refund accordingly
3. Manual add/deduct: immediate balance update
4. Balance has no floor
5. Fee read from settings at save time
6. CSV export filename: `squadify_balances_YYYY-MM-DD_HH-MM.csv`
7. Member delete: removes member + all attendance rows
8. First launch: init tables, seed default settings

---

## File structure

```
squadify/
├── App.js
├── app.json
├── package.json
├── babel.config.js
├── eas.json
├── PROMPT.md
├── README.md
├── INSTALL.md
├── DEPLOY.md
├── ARCHITECTURE.md
└── src/
    ├── db/database.js
    ├── context/ThemeContext.js
    ├── screens/
    │   ├── SquadScreen.js
    │   ├── AddMemberScreen.js
    │   ├── MemberDetailScreen.js
    │   ├── SessionsScreen.js
    │   ├── NewSessionScreen.js
    │   ├── EditSessionScreen.js
    │   ├── BalanceScreen.js
    │   ├── SettingsScreen.js
    │   └── ImportPreviewScreen.js
    ├── components/
    │   ├── Avatar.js
    │   ├── StatCard.js
    │   └── TabBarIcon.js
    └── utils/
        ├── csv.js
        └── format.js
```

---

*Squadify · Full Specification · SDK 54*
