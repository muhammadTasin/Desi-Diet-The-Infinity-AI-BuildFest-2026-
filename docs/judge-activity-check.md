# Supabase SQL Diagnostics for Judge Activity & Usage Checking

The following queries can be executed in the **Supabase Dashboard SQL Editor** to directly verify account creation, guest visits, and usage of key demo features.

---

### 1. Check Latest Created Accounts
Lists the most recently created user accounts from Supabase Auth.

```sql
select id, email, created_at, last_sign_in_at
from auth.users
order by created_at desc
limit 20;
```

---

### 2. Check Latest App Activity
Displays the last 100 anonymous product analytics events recorded.

```sql
select mode, event_name, page, feature, created_at
from public.app_activity_events
order by created_at desc
limit 100;
```

---

### 3. Count Guest Sessions
Provides a count of unique browser session IDs that have used the app in Guest Mode.

```sql
select count(distinct session_id) as guest_sessions
from public.app_activity_events
where mode = 'guest';
```

---

### 4. Count Logged-in Sessions
Provides a count of unique browser session IDs that have logged in to user accounts.

```sql
select count(distinct session_id) as logged_in_sessions
from public.app_activity_events
where mode = 'logged_in';
```

---

### 5. Check Judge/Demo Feature Usage
Filters and highlights specific judge activity events (like entering guest mode, plate scans, chat, and wearable demo triggers) ordered chronologically.

```sql
select event_name, mode, page, feature, created_at
from public.app_activity_events
where event_name in (
  'guest_mode_started',
  'login_success',
  'dashboard_viewed',
  'plate_analysis_started',
  'plate_analysis_completed',
  'chat_opened',
  'demo_mode_started'
)
order by created_at desc;
```
