# Supabase JS API Explorer Documentation

## Overview

This document describes the structure and functionality of an interactive **Supabase JS API Explorer** built using HTML, TailwindCSS, and Chart.js. The application provides a modular, dashboard-style interface for learning and experimenting with the `@supabase/supabase-js` client.

---

## Architecture

The application follows a **dashboard layout**:

- **Sidebar Navigation**: Provides access to different modules
  - Overview
  - Database (CRUD)
  - Storage
  - Table Management (DDL)
- **Main Content Area**: Dynamically renders content based on the selected section

### Design Principles

- Modular learning (task-based instead of linear documentation)
- Visual reinforcement using charts
- Direct comparison between JavaScript API and SQL

---

## 1. Client Initialization

Before interacting with Supabase services, initialize the client:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://your-project-url.supabase.co'
const supabaseKey = 'your-anon-key'
const supabase = createClient(supabaseUrl, supabaseKey)
```

### Responsibilities of the Client

- Handles authentication
- Sends API requests
- Acts as a unified interface for:
  - Database (PostgREST)
  - Storage (S3-compatible)
  - Realtime (WebSockets)

---

## 2. Database Operations (CRUD)

Supabase provides a fluent JavaScript API that maps closely to SQL operations.

### 2.1 Create (Insert)

```javascript
const { data, error } = await supabase
  .from('profiles')
  .insert({ username: 'dennis', website: 'https://supabase.com' })
  .select()
```

**SQL Equivalent:**

```sql
INSERT INTO profiles (username, website)
VALUES ('dennis', 'https://supabase.com')
RETURNING *;
```

---

### 2.2 Read (Select/Search)

```javascript
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .ilike('username', '%den%')
```

**SQL Equivalent:**

```sql
SELECT * FROM profiles
WHERE username ILIKE '%den%';
```

---

### 2.3 Update

```javascript
const { data, error } = await supabase
  .from('profiles')
  .update({ website: 'https://new-site.com' })
  .eq('username', 'dennis')
```

**SQL Equivalent:**

```sql
UPDATE profiles
SET website = 'https://new-site.com'
WHERE username = 'dennis';
```

> ⚠️ Always use filters (`.eq`, `.match`, etc.) to avoid updating all rows.

---

### 2.4 Delete

```javascript
const { data, error } = await supabase
  .from('profiles')
  .delete()
  .eq('username', 'alice')
```

**SQL Equivalent:**

```sql
DELETE FROM profiles
WHERE username = 'alice';
```

---

## 3. Storage Operations

Supabase Storage provides an abstraction over S3-compatible object storage.

### 3.1 Create Bucket

```javascript
await supabase.storage.createBucket('avatars', {
  public: true,
  fileSizeLimit: 2097152,
  allowedMimeTypes: ['image/png']
})
```

### 3.2 Upload File

```javascript
await supabase.storage
  .from('avatars')
  .upload('public/avatar1.png', file)
```

### 3.3 Replace File (Upsert)

```javascript
await supabase.storage
  .from('avatars')
  .upload('public/avatar1.png', file, { upsert: true })
```

### 3.4 Download File

```javascript
const { data } = await supabase.storage
  .from('avatars')
  .download('public/avatar1.png')
```

### 3.5 List Files

```javascript
const { data } = await supabase.storage
  .from('avatars')
  .list('public', { limit: 10 })
```

### 3.6 Public URL

```javascript
const { data } = supabase.storage
  .from('avatars')
  .getPublicUrl('public/avatar1.png')
```

### 3.7 Signed URL (Private Access)

```javascript
const { data } = await supabase.storage
  .from('avatars')
  .createSignedUrl('private/file.pdf', 60)
```

### 3.8 Move File

```javascript
await supabase.storage
  .from('avatars')
  .move('old.png', 'new.png')
```

### 3.9 Delete File

```javascript
await supabase.storage
  .from('avatars')
  .remove(['public/avatar1.png'])
```

---

## 4. Table Management (DDL)

DDL operations are handled via SQL, not the JavaScript client.

### 4.1 Create Table

```sql
create table table_name (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  created_at timestamp with time zone default now()
);
```

### 4.2 Drop Table

```sql
drop table if exists table_name;
```

> ⚠️ Avoid performing schema changes from client-side code in production.

---

## 5. Visual Components

### Charts

- **Overview Chart (Doughnut)**
  - Displays API usage distribution
- **Storage Chart (Bar)**
  - Shows file size limits and usage patterns

### UI Features

- TailwindCSS styling
- Responsive layout
- Interactive tabs and navigation
- Code comparison panels (JS vs SQL)

---

## 6. Key Takeaways

- Supabase abstracts PostgreSQL into a fluent JS API
- CRUD operations map directly to SQL semantics
- Storage uses S3-compatible patterns
- Schema management should remain SQL-driven

---

## 7. Recommended Practices

- Use filters in update/delete queries
- Keep schema changes in migrations
- Use signed URLs for private files
- Structure code around modular services

---

## Conclusion

This explorer provides a structured and visual way to understand Supabase's capabilities. It bridges the gap between JavaScript abstractions and underlying SQL operations, enabling developers to build more predictable and maintainable systems.

