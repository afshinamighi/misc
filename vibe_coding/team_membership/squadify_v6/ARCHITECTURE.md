# Squadify — Technical Architecture Report

This document provides a high-level architectural overview of the Squadify mobile app. It is intended as learning material to understand the structure and main elements of a React Native application.

---

## 1. What is React Native?

React Native is a framework for building mobile apps using JavaScript and React. Unlike a web app running in a browser, React Native compiles your JavaScript components into **real native UI elements** — so buttons, lists, and text fields look and behave exactly like native iOS and Android controls.

```
Your JavaScript code
        ↓
   React Native bridge
        ↓
Native iOS / Android UI components
```

Expo is a layer on top of React Native that provides a managed build system, a library of device APIs (camera, file system, SQLite, etc.), and the Expo Go app for instant testing without a full build.

---

## 2. High-level architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Squadify App                             │
│                                                                 │
│  ┌──────────────┐   ┌───────────────┐   ┌───────────────────┐  │
│  │   UI Layer   │   │  State Layer  │   │    Data Layer     │  │
│  │  (Screens +  │ ↔ │   (React      │ ↔ │  (SQLite DB +     │  │
│  │  Components) │   │   useState)   │   │   File System)    │  │
│  └──────────────┘   └───────────────┘   └───────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  Navigation Layer                         │   │
│  │           React Navigation (tabs + stacks)               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  Theme / Context Layer                    │   │
│  │              ThemeContext (light/dark mode)               │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Component and library map

```
App.js (entry point)
│
├── SafeAreaProvider           react-native-safe-area-context
│   └── ThemeProvider          src/context/ThemeContext.js
│       └── NavigationContainer   @react-navigation/native
│           │
│           ├── Tab.Navigator     @react-navigation/bottom-tabs
│           │   │
│           │   ├── Squad Stack   @react-navigation/native-stack
│           │   │   ├── SquadScreen
│           │   │   ├── AddMemberScreen
│           │   │   └── MemberDetailScreen
│           │   │
│           │   ├── Sessions Stack
│           │   │   ├── SessionsScreen
│           │   │   ├── NewSessionScreen
│           │   │   └── EditSessionScreen
│           │   │
│           │   ├── BalanceScreen  (single screen, no stack)
│           │   │
│           │   └── Settings Stack
│           │       ├── SettingsScreen
│           │       └── ImportPreviewScreen
│           │
│           └── TabBarIcon.js  react-native-svg
│
├── src/db/database.js         expo-sqlite
├── src/utils/csv.js           expo-file-system/next, expo-sharing
├── src/utils/format.js        (pure JS, no dependencies)
└── src/components/
    ├── Avatar.js
    └── StatCard.js
```

---

## 4. Navigation architecture

Squadify uses two types of navigators from React Navigation:

### Bottom Tab Navigator
Displays the four tabs at the bottom of the screen. Each tab is a separate navigation stack.

```
Bottom Tab Navigator
├── Squad       (stack)   — main roster
├── Sessions    (stack)   — session management
├── Balance     (screen)  — manual adjustments
└── Settings    (stack)   — configuration
```

### Native Stack Navigator
Each tab that has sub-screens uses a stack. Screens are "pushed" onto the stack when you navigate deeper, and "popped" when you go back — like a stack of cards.

```
Sessions Stack
├── SessionsScreen        ← base (always visible when tab is active)
├── NewSessionScreen      ← pushed when "+ New session" is tapped
└── EditSessionScreen     ← pushed when a session card is tapped
```

**Key navigation concepts:**
- `navigation.navigate('ScreenName')` — go to a screen
- `navigation.goBack()` — return to previous screen
- `route.params` — data passed between screens (e.g. `{ sessionId: 5 }`)
- `useFocusEffect` — runs code every time a screen comes back into focus (used to refresh data after returning from a sub-screen)

---

## 5. State management

Squadify uses React's built-in `useState` hook for local component state. There is no external state library (like Redux or Zustand) — the app is simple enough that each screen manages its own data.

### Data flow pattern

```
Screen mounts / comes into focus
        ↓
useFocusEffect fires
        ↓
Async function loads data from SQLite
        ↓
setState called with fresh data
        ↓
React re-renders the screen with new data
```

### Example from SquadScreen.js

```js
const [members, setMembers] = useState([]);      // local state

useFocusEffect(useCallback(() => {
  getAllMembers().then(m => setMembers(m));        // load from DB
}, []));

// React automatically re-renders the FlatList when members changes
<FlatList data={members} renderItem={...} />
```

### Why no global state?
- Each screen fetches its own data from SQLite when it comes into focus
- This keeps screens independent and always showing fresh data
- `useFocusEffect` ensures that when you edit a member and go back to the list, the list refreshes automatically

---

## 6. Database architecture (SQLite)

SQLite is a local relational database stored as a single file on the device. It works offline, requires no server, and persists data between app sessions.

### Tables and relationships

```
members                    sessions
─────────────────          ──────────────────
id (PK)                    id (PK)
first_name                 name
last_name                  date
position                   location
sport                      fee
balance        ←──┐        created_at
created_at         │
updated_at         │
                   │
            session_attendance
            ──────────────────
            id (PK)
            session_id ──────────→ sessions.id
            member_id  ──────────→ members.id
            present (0 or 1)

settings
──────────────────
key   (PK)  e.g. "fee", "team_name"
value       e.g. "5.00", "My Team"
```

### How balance works
The `balance` column on `members` is a running total — not recalculated from attendance history. Every time a session is saved or a manual adjustment is made, the balance is updated directly:

```
member.balance += delta   (positive = add, negative = deduct)
```

This means balance changes from session editing are handled as diffs — if a member's status changes from absent to present, the fee is deducted at that moment.

### Database singleton pattern
```js
let _db = null;          // module-level variable

async function getDB() {
  if (!_db) {
    _db = await SQLite.openDatabaseAsync('squadify.db');
  }
  return _db;            // return the same connection every time
}
```
Opening a database connection is expensive. By keeping a single connection in a module-level variable, all database calls share the same connection.

---

## 7. Context and theming

React Context solves the "prop drilling" problem — instead of passing `theme` as a prop through every component in the tree, any component can access it directly via `useTheme()`.

```
App.js
└── ThemeProvider           ← provides theme to all children
    └── NavigationContainer
        └── SquadScreen
            └── MemberRow
                └── Avatar  ← can call useTheme() directly
```

### Light/dark mode
```js
const scheme = useColorScheme(); // reads device setting
const theme = scheme === 'dark' ? darkTheme : lightTheme;
```
React Native's `useColorScheme` returns `'light'`, `'dark'`, or `null`. The theme object is then provided to the whole app via Context.

---

## 8. File system and CSV

Expo SDK 54 introduced a new object-oriented file system API:

```
Old API (deprecated in SDK 54):         New API (expo-file-system/next):
─────────────────────────────────       ────────────────────────────────
FileSystem.writeAsStringAsync(uri, ...) file.write(content)
FileSystem.makeDirectoryAsync(uri, ...) dir.create()
FileSystem.getInfoAsync(uri, ...)       file.exists, file.size
```

### Export flow
```
User taps "Export"
        ↓
generateCSV(members) → CSV string
        ↓
new Directory(Paths.document, 'Squadify') → create folder if needed
        ↓
new File(dir, filename) → file.write(csv)
        ↓
Sharing.shareAsync(file.uri) → native share sheet
```

### Import flow
```
User taps "Choose CSV file..."
        ↓
DocumentPicker.getDocumentAsync() → user picks file
        ↓
new File(asset.uri).text() → read file content
        ↓
parseCSV(text) → array of { first_name, last_name, balance }
        ↓
ImportPreviewScreen → user reviews rows
        ↓
upsertMemberByName() → insert or update each member in SQLite
```

### CSV parsing challenges handled
- **BOM character** (`\uFEFF`): Excel adds this invisible byte at the start — stripped automatically
- **Empty last name**: `"Afshin, ,0"` — last name column is space/empty, treated as empty string
- **Line endings**: Both Windows (`\r\n`) and Unix (`\n`) formats supported
- **Missing columns**: Balance defaults to 0 if column is missing

---

## 9. Reusable components

Squadify has three shared components used across multiple screens:

### Avatar.js
Displays a coloured circle with a member's initials. Colour is assigned by `memberId % 6` so the same member always gets the same colour.

```
Props:
  firstName  — used for first initial
  lastName   — used for second initial
  memberId   — determines colour from palette
  size       — circle diameter in pixels (default 36)
```

### StatCard.js
A summary metric card shown in a row of three at the top of main screens.

```
Props:
  value       — the number or text to display large (e.g. "€60")
  label       — small label below (e.g. "Pool balance")
  valueColor  — optional colour override for the value
```

### TabBarIcon.js
Custom SVG icons for the bottom tab bar. Uses `react-native-svg` to render vector graphics — no image files needed, no third-party icon fonts.

---

## 10. Key React Native concepts used

### FlatList
Used for all scrollable member and session lists. More efficient than ScrollView + map() for long lists because it only renders items that are currently visible on screen (virtualisation).

```js
<FlatList
  data={members}                     // array of items
  keyExtractor={item => String(item.id)}  // unique key per item
  renderItem={({ item }) => <MemberRow member={item} />}
/>
```

### SafeAreaView
Ensures content doesn't overlap with the phone's status bar (top) or home indicator (bottom). Must be imported from `react-native-safe-area-context`, not from `react-native`.

```js
import { SafeAreaView } from 'react-native-safe-area-context';
<SafeAreaView edges={['top']}>
  {/* content */}
</SafeAreaView>
```

### KeyboardAvoidingView
On screens with text inputs (AddMember, NewSession), this component automatically shifts the content upward when the keyboard appears so inputs aren't hidden.

```js
<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : undefined}
>
```

### useFocusEffect + useCallback
`useFocusEffect` runs a function every time the screen comes into focus (not just on mount). `useCallback` prevents the function from being recreated on every render, which would cause an infinite loop.

```js
useFocusEffect(
  useCallback(() => {
    loadData(); // runs every time this screen becomes active
  }, [])
);
```

---

## 11. File structure explained

```
squadify/
│
├── App.js                  Entry point. Sets up providers (theme, safe area)
│                           and the navigation structure. Initialises the DB.
│
├── app.json                Expo configuration — app name, icons, permissions,
│                           SDK version, bundle identifiers for iOS/Android.
│
├── package.json            Dependencies list. npm install reads this file.
│                           "main" points to the Expo entry loader.
│
├── eas.json                EAS Build configuration — defines build profiles
│                           (preview APK, production AAB, iOS simulator).
│
└── src/
    │
    ├── db/
    │   └── database.js     All SQLite logic. Tables, queries, business rules.
    │                       Screens import functions from here — never write
    │                       SQL directly in screens.
    │
    ├── context/
    │   └── ThemeContext.js  Light/dark colour system. Provides theme via
    │                        React Context so any component can useTheme().
    │
    ├── utils/
    │   ├── csv.js          CSV parse, generate, export. File system calls.
    │   └── format.js       Pure formatting functions (currency, dates, sizes).
    │
    ├── components/         Reusable UI pieces used by multiple screens.
    │   ├── Avatar.js       Coloured initials circle for member rows.
    │   ├── StatCard.js     Summary metric card (value + label).
    │   └── TabBarIcon.js   SVG icons for the bottom tab bar.
    │
    └── screens/            One file per screen. Each screen is a React
        │                   component that renders UI and calls db/ functions.
        │
        ├── SquadScreen.js          Tab 1 — member roster
        ├── AddMemberScreen.js      Add new member form
        ├── MemberDetailScreen.js   Member profile + history + edit
        ├── SessionsScreen.js       Tab 2 — session list
        ├── NewSessionScreen.js     Create session + mark attendance
        ├── EditSessionScreen.js    Edit existing session attendance
        ├── BalanceScreen.js        Tab 3 — manual balance adjustments
        ├── SettingsScreen.js       Tab 4 — app config + import/export
        └── ImportPreviewScreen.js  CSV import preview + confirm
```

---

## 12. Libraries summary

| Library | Category | What it does in Squadify |
|---|---|---|
| `react` | Core | Component model, state (useState, useCallback, useEffect) |
| `react-native` | Core | Native UI components (View, Text, TextInput, FlatList, etc.) |
| `expo` | Platform | SDK, build tools, app entry point |
| `expo-sqlite` | Data | Local SQLite database — stores members, sessions, settings |
| `expo-file-system` | Storage | Read/write files — CSV export/import |
| `expo-document-picker` | Device | Opens native file picker to select CSV |
| `expo-sharing` | Device | Native share sheet for exporting CSV |
| `expo-status-bar` | UI | Controls status bar style (light/dark text) |
| `expo-asset` | Build | Required by Expo's Metro bundler for asset resolution |
| `@react-navigation/native` | Navigation | Navigation infrastructure and NavigationContainer |
| `@react-navigation/bottom-tabs` | Navigation | The four-tab bar at the bottom |
| `@react-navigation/native-stack` | Navigation | Stack navigation within each tab |
| `react-native-safe-area-context` | Layout | Handles notches, status bars, home indicators |
| `react-native-screens` | Performance | Native screen components (required by React Navigation) |
| `react-native-svg` | Graphics | SVG rendering for tab bar icons |
| `babel-preset-expo` | Build | Transpiles modern JS to React Native compatible code |

---

*Squadify · Architecture Report · SDK 54 · React Native*
