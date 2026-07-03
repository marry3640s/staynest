# StayNest

StayNest is a mobile-first travel service app with a lightweight Python backend, SQLite storage, a web admin console, and a Capacitor iOS wrapper.

## Local Development

```bash
python3 -m src.staynest_auth_server --host 127.0.0.1 --port 4174
```

Open:

```text
http://127.0.0.1:4174
http://127.0.0.1:4174/admin.html
```

The development SMS code is currently fixed as:

```text
123456
```

## iOS

```bash
npx cap sync ios
```

Then open the iOS project in Xcode:

```text
ios/App/App.xcodeproj
```

## Deployment

The backend serves both the API and static frontend files:

```bash
python3 -m src.staynest_auth_server --host 0.0.0.0 --port 4174
```

Runtime data is stored in SQLite. Do not overwrite `staynest.sqlite3` when deploying code updates.

## Main Features

- Phone login and Apple ID login with phone binding
- Fast app startup with local session, silent session refresh, and persisted server sessions
- Traveler product browsing and order creation
- Guide application and guide order grabbing
- Trips, messages, unread badges, and chat translation to English
- Profile editing with name, gender, nationality, bio, and avatar upload
- Admin console for guide review, travel products, orders, and users
