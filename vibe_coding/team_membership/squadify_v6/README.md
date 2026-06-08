# Squadify

A cross-platform mobile app (iOS + Android) for managing a sports team's membership, attendance, session fees, and balances. Built with React Native and Expo.

---

## Features

- **Squad tab** — full member roster with balance indicators; red name when in debt
- **Sessions tab** — create and edit sessions, mark attendance, auto-deduct fee per present member
- **Balance tab** — manual add/deduct per member with quick fee-sized buttons
- **Settings tab** — configure session fee, team name, season, sports list, import/export CSV

---

## Tech stack

| Library | Purpose |
|---|---|
| Expo SDK 54 | Cross-platform tooling |
| expo-sqlite v16 | Local SQLite (async API) |
| expo-file-system/next | File read/write (SDK 54 new API) |
| expo-document-picker | Pick CSV from device |
| expo-sharing | Share exported CSV |
| React Navigation | Bottom tabs + native stack |
| react-native-safe-area-context | Notch/home bar safe areas |
| react-native-svg | SVG tab icons |

---

## Getting started

See `INSTALL.md` for full setup instructions.

```bash
cd squadify
npm install
npx expo install --fix
npm install expo-asset
npx expo start --clear
```

---

## CSV import format

Plain `.csv`, comma-separated, header row optional.

```
first_name, last_name, balance
Jan,de Vries,15.00
Sara,Bakker,0.00
Rob,Kok,-8.00
```

---

## CSV export format

Filename: `squadify_balances_YYYY-MM-DD_HH-MM.csv`

Columns: `first_name, last_name, sport, balance, exported_at`

---

## Database schema

### members
| Column | Type | Notes |
|---|---|---|
| id | INTEGER | PK autoincrement |
| first_name | TEXT | Required |
| last_name | TEXT | Required |
| position | TEXT | Optional |
| sport | TEXT | From sports list |
| balance | REAL | Default 0, can go negative |
| created_at | TEXT | ISO timestamp |
| updated_at | TEXT | ISO timestamp |

### sessions
| Column | Type |
|---|---|
| id | INTEGER PK |
| name | TEXT |
| date | TEXT |
| location | TEXT |
| fee | REAL |
| created_at | TEXT |

### session_attendance
| Column | Type |
|---|---|
| id | INTEGER PK |
| session_id | INTEGER |
| member_id | INTEGER |
| present | INTEGER (0/1) |

### settings
| Key | Default |
|---|---|
| fee | 5.00 |
| team_name | My Team |
| season | Season 1 |
| export_path | /Documents/Squadify/ |
| sports_list | Volleyball,Football,Badminton |
| last_backup | — |

---

## File structure

```
squadify/
├── App.js
├── app.json
├── package.json
├── babel.config.js
├── eas.json                      # EAS build config
├── PROMPT.md                     # Full spec to regenerate this app
├── README.md
├── INSTALL.md                    # Installation & troubleshooting
├── DEPLOY.md                     # Deployment guide
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

*Squadify · Built with React Native + Expo SDK 54*
