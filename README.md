# StayNest

StayNest is a travel service prototype with a mobile web app, platform admin console, SQLite-backed Python backend, and Capacitor iOS wrapper.

## Local Development

```bash
python3 -m src.staynest_auth_server --host 127.0.0.1 --port 4174
```

Open:

```text
http://127.0.0.1:4174
```

Admin console:

```text
http://127.0.0.1:4174/admin.html
```

## iOS

```bash
npm install
npx cap sync ios
npx cap open ios
```

## Data

Runtime data is stored in SQLite at `staynest.sqlite3` by default. Override it with:

```bash
export STAYNEST_DB_PATH="/opt/staynest/staynest.sqlite3"
```

## SMS

Development mode uses fixed verification code `123456`. For production, configure Aliyun SMS environment variables in `src/staynest_auth_server.py`.
