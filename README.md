<div align="center">
  <h1 style="color: #d3869b; font-family: monospace; font-size: 2.5em; margin: 0; font-weight: bold;">Shimer</h1>
  <p style="font-size: 1.1em; color: #83a598; margin-top: 5px;">
    <strong>A powerful time-tracking and productivity app — built from scratch with React Native</strong>
  </p>
  <br>
  <p>
    <img src="https://img.shields.io/badge/React_Native-0.81-61DAFB?style=for-the-badge&logo=react" alt="React Native">
    <img src="https://img.shields.io/badge/Expo-54-000020?style=for-the-badge&logo=expo" alt="Expo">
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript">
    <img src="https://img.shields.io/badge/NativeWind-4.1-06B6D4?style=for-the-badge&logo=tailwindcss" alt="NativeWind">
    <img src="https://img.shields.io/badge/iOS_Design-000000?style=for-the-badge&logo=apple" alt="iOS Design">
  </p>
</div>

---

## 📱 About

**Shimer** is a feature-rich **time-tracking and personal productivity app** built entirely from scratch with React Native (Expo). Inspired by time.to.me, it goes beyond with more features — all running **fully offline** on your device.

Every timer session, activity, goal, and event is stored locally in a single JSON file. No accounts, no cloud, no data collection. Your data belongs to you.

---

<div align="center">
  <h3>Built entirely by one developer — no templates, no clones, just pure code</h3>
</div>

---

## ✨ Features

<div align="center">

| Feature | Description |
|---------|-------------|
| ⏱️ **Live Timer** | Countdown, stopwatch, goal, and break modes with overtime tracking |
| 🎯 **Goal System** | Track goals with progress, completion alerts, and +5min/+1hr quick-add |
| 🏃 **Activity Tracking** | Custom activities with icons, colors, and categories |
| 📜 **Session History** | Auto-logged timeline with edit, delete, and smart overlap handling |
| 📊 **Analytics** | SVG donut chart, period comparison, and trend indicators |
| 📅 **Calendar** | Month grid with events, time picker, and plan integration |
| 📋 **Daily Planner** | JSON-based scheduler with live progress tracking |
| ✅ **Checklists** | Multiple checklists with drag-to-reorder and activity linking |
| 📁 **Folders** | Today, Tomorrow, and custom task folders with auto-move at midnight |
| 🔒 **Secure Vault** | PIN/Pattern/Biometric-protected file storage |
| 💾 **Backup & Restore** | Full data export/import as JSON with auto-backup scheduling |
| 🎨 **iOS Design** | Dark mode, Apple-style modals, smooth animations |

</div>

---

## 🚀 Installation

### Prerequisites

- **Node.js v18+**
- **Expo CLI** (`npm install -g expo-cli`)
- **Android Studio** (for Android emulator) or **Xcode** (for iOS simulator)

### Setup

```bash
git clone https://github.com/AmirabbasRouintan/Shimer.git
cd Shimer
npm install
npx expo start
```

Scan the QR code with **Expo Go** on your phone, or press `a` for Android emulator / `i` for iOS simulator.

### Build APK

```bash
npx eas build --platform android --profile preview
```

---

## 🧠 Tech Stack

<div align="center">

| Layer | Technology |
|-------|-----------|
| **Framework** | React Native 0.81, Expo 54 |
| **Language** | TypeScript |
| **Navigation** | Expo Router 6, React Navigation 7 |
| **Styling** | NativeWind 4 (Tailwind for RN) |
| **Animations** | React Native Reanimated 4, Gesture Handler |
| **Charts** | React Native SVG (custom donut chart) |
| **Storage** | Expo File System (JSON file) |
| **Security** | Expo Local Authentication (biometric) |
| **Icons** | Ionicons, Solar Icons |

</div>

---

## 📁 Project Structure

```
Shimer/
├── app/                    # Expo Router file-based routing
│   ├── (tabs)/             # Tab-based screens
│   │   ├── index.tsx       # Home — Timer, Goals, Checklists
│   │   ├── main.tsx        # Tasks & Events
│   │   ├── things.tsx      # Activities management
│   │   ├── history.tsx     # Time history log
│   │   ├── summary.tsx     # Analytics & donut chart
│   │   ├── calendar.tsx    # Calendar & JSON Planner
│   │   ├── settings.tsx    # All settings & backups
│   │   ├── folders.tsx     # Folder management
│   │   ├── secure-files.tsx # PIN/Pattern/Biometric vault
│   │   └── ...
│   ├── activitiesStore.ts  # Global state + file persistence
│   ├── components/         # Shared components
│   └── _layout.tsx         # Root layout
├── components/             # UI components
│   ├── JSONPlanner.tsx     # Daily JSON plan viewer
│   ├── CustomAlert.tsx     # Apple-style alerts
│   └── ui/                 # shadcn-style components
├── constants/              # Theme & design tokens
├── hooks/                  # Custom hooks
└── assets/                 # Images, icons, splash
```

---

## 🔌 Architecture

```
                    ┌─────────────────────────┐
                    │   activitiesStore.ts     │
                    │  (Global state + pub/sub) │
                    └──────────┬──────────────┘
                               │
                    ┌──────────▼──────────────┐
                    │   shimer_data.json       │
                    │   (FileSystem persistence)│
                    └─────────────────────────┘
```

All data is managed through a single **pub/sub store** that persists to a JSON file on the device. Every screen subscribes to changes and re-renders automatically. No backend, no cloud, no external APIs.

---

## 🎯 Screens Overview

| Screen | Description |
|--------|-------------|
| **Home** | Live timer with goal/break modes, checklists, pause/resume |
| **Tasks** | Folder-based task list with calendar events and JSON planner |
| **Activities** | Create and manage activities with icons, colors, timers |
| **History** | Day-by-day timeline with edit, delete, and calendar navigation |
| **Summary** | SVG donut chart with period comparison and trend analysis |
| **Calendar** | Month grid, events, and daily plan integration |
| **Settings** | Full settings: backups, checklists, folders, home customization |
| **Secure Vault** | PIN/Pattern/Biometric-protected file storage |

---

## 📄 License

This project is [MIT](LICENSE) licensed.

---

<div align="center">
  <br>
  <p style="font-size: 1.3em; color: #d3869b;">
    ⭐ If you found this project useful, please give it a star!
  </p>
  <p style="color: #83a598;">
    This project was built entirely from scratch by one developer — your support means a lot ❤️
  </p>
  <br>
  <p>
    <a href="https://github.com/AmirabbasRouintan/Shimer">
      <img src="https://img.shields.io/github/stars/AmirabbasRouintan/Shimer?style=for-the-badge&logo=github&color=yellow" alt="Stars">
    </a>
    <a href="https://github.com/AmirabbasRouintan/Shimer/issues">
      <img src="https://img.shields.io/github/issues/AmirabbasRouintan/Shimer?style=for-the-badge&logo=github" alt="Issues">
    </a>
  </p>
  <br>
</div>
