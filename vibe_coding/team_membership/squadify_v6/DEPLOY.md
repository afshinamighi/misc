# Squadify — Deployment Guide

How to build and deploy Squadify to real devices and app stores.

---

## Overview

| Method | Platform | Cost | Use case |
|---|---|---|---|
| Expo Go | iOS + Android | Free | Development only |
| EAS Preview APK | Android | Free | Test on real phone |
| EAS iOS Simulator | iOS (Mac) | Free | Test on Mac |
| EAS Internal | iOS real device | Free (limited) | Team testing |
| Google Play Store | Android | $25 one-time | Public release |
| Apple App Store | iOS | €99/year | Public release |

---

## Step 1 — Create a free Expo account

Go to [expo.dev](https://expo.dev) and sign up. Required for EAS builds.

---

## Step 2 — Install EAS CLI

```bash
npm install -g eas-cli
```

---

## Step 3 — Log in

```bash
eas login
```

Enter your expo.dev email and password.

---

## Step 4 — Configure EAS

Inside your `squadify/` folder:

```bash
cd squadify
eas build:configure
```

When asked which platforms → choose **All**.

This creates `eas.json`. Replace its contents with:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "android": {
        "buildType": "aab"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

## Android — Test on your real phone (APK)

### Build
```bash
eas build --platform android --profile preview
```

- Build runs in Expo's cloud — takes 5–10 minutes
- You get a download link and QR code when done
- Also visible at [expo.dev](https://expo.dev) → your project → Builds

### Install on your Android phone
1. Download the `.apk` file from the link
2. Send it to your phone (email, WhatsApp, USB cable, or AirDroid)
3. On your phone: **Settings → Security → Install unknown apps** → enable for your browser or Files app
4. Open the `.apk` file → tap Install
5. Squadify appears on your home screen

---

## Android — Google Play Store (production)

### Build AAB
```bash
eas build --platform android --profile production
```

### Submit to Play Store
1. Create a Google Play developer account at [play.google.com/console](https://play.google.com/console) — one-time $25 fee
2. Create a new app → Squadify
3. Upload the `.aab` file to the internal testing track first
4. Fill in store listing (description, screenshots, privacy policy)
5. Gradually roll out to production

Or use EAS Submit to automate:
```bash
eas submit --platform android
```

---

## iOS — Test on Simulator (Mac only, free)

```bash
npx expo start --ios
```

Requires Xcode from the Mac App Store.

Or build a simulator binary:
```bash
eas build --platform ios --profile preview
```

---

## iOS — Test on your real iPhone (free, limited)

### Option A — EAS Internal Distribution (no Apple account needed for testing)
```bash
eas build --platform ios --profile development
```

EAS generates a link. Open it on your iPhone → install the profile → install the app.

Note: This requires registering your device's UDID in the Expo dashboard first.

### Register your iPhone UDID
1. Connect iPhone to Mac via USB
2. Open Xcode → Window → Devices and Simulators
3. Copy the **Identifier** (UDID)
4. Go to [expo.dev](https://expo.dev) → your account → Devices → Add device

---

## iOS — Apple App Store (production)

### Requirements
- Apple Developer account: [developer.apple.com](https://developer.apple.com) — **€99/year**
- Xcode installed on Mac (for some steps)

### Build
```bash
eas build --platform ios --profile production
```

EAS handles certificates and provisioning profiles automatically — just follow the prompts.

### Submit to App Store
```bash
eas submit --platform ios
```

Or manually upload the `.ipa` via Xcode or Transporter app.

Then in App Store Connect:
1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Create new app → Squadify
3. Fill in metadata (description, screenshots, privacy policy URL)
4. Submit for review (usually 1–3 days)

---

## Updating the app after release

### Android update
```bash
eas build --platform android --profile production
eas submit --platform android
```

Google Play auto-updates installed apps.

### iOS update
Bump the version in `app.json`:
```json
"version": "1.0.1"
```
Then:
```bash
eas build --platform ios --profile production
eas submit --platform ios
```

---

## Over-the-Air (OTA) updates — no store review needed

For small JS-only changes (no new native packages), you can push updates instantly without going through the store:

```bash
eas update --branch production --message "Fix balance calculation"
```

Users get the update next time they open the app. This works for most bug fixes and UI changes.

---

## Checklist before first release

- [ ] Update `app.json` version to `1.0.0`
- [ ] Update `bundleIdentifier` (iOS) and `package` (Android) to your own domain, e.g. `com.yourname.squadify`
- [ ] Add an app icon (1024×1024 PNG) as `assets/icon.png`
- [ ] Add a splash screen image as `assets/splash.png`
- [ ] Write a privacy policy (required by both stores) — even a simple one
- [ ] Test on a real device before submitting
- [ ] Take screenshots on the required device sizes for store listings

---

## Useful commands summary

| Command | What it does |
|---|---|
| `npx expo start --clear` | Run in Expo Go (development) |
| `npx expo start --ios` | Run in iOS Simulator |
| `eas build --platform android --profile preview` | Build APK for Android testing |
| `eas build --platform android --profile production` | Build AAB for Play Store |
| `eas build --platform ios --profile preview` | Build for iOS Simulator |
| `eas build --platform ios --profile production` | Build IPA for App Store |
| `eas submit --platform android` | Submit to Google Play |
| `eas submit --platform ios` | Submit to App Store |
| `eas update --branch production` | Push OTA update |

---

*Squadify · Deployment Guide · SDK 54*
