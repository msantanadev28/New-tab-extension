Supabase JavaScript API GuideThis guide covers the fundamental Database operations using @supabase/supabase-js, including creating, searching, updating, and deleting data, as well as managing table structures.1. Setup and InitializationFirst, ensure you have the client initialized:import { createClient } from '@supabase/supabase-js'

const supabaseUrl = '[https://your-project-url.supabase.co](https://your-project-url.supabase.co)'
const supabaseKey = 'your-anon-key'
const supabase = createClient(supabaseUrl, supabaseKey)
2. Create (Insert Data)To add new rows to your table, use the .insert() method.Insert a single rowconst { data, error } = await supabase
  .from('profiles')
  .insert({ username: 'dennis', website: '[https://supabase.com](https://supabase.com)' })
  .select()
Insert multiple rows (Batch)const { data, error } = await supabase
  .from('profiles')
  .insert([
    { username: 'alice', website: '[https://alice.com](https://alice.com)' },
    { username: 'bob', website: '[https://bob.com](https://bob.com)' }
  ])
3. Search (Read/Query Data)Supabase uses the .select() method for fetching data, combined with filters.Basic Selectconst { data, error } = await supabase
  .from('profiles')
  .select('*') // Fetches all columns
Searching with FiltersYou can chain filters to find specific records:Equal to (eq): .eq('column', 'value')Greater than (gt): .gt('age', 21)Full Text Search: .textSearch('content', 'query')Pattern Matching (ilike): .ilike('username', '%den%') (Case-insensitive)const { data, error } = await supabase
  .from('profiles')
  .select('username, website')
  .eq('username', 'dennis')
4. Update (Modify Data)To update existing rows, use the .update() method combined with a filter to target specific rows.const { data, error } = await supabase
  .from('profiles')
  .update({ website: '[https://new-website.com](https://new-website.com)' })
  .eq('username', 'dennis') // CRITICAL: Always use a filter to avoid updating all rows
5. Delete (Remove Data)The .delete() method removes rows that match your filter.const { data, error } = await supabase
  .from('profiles')
  .delete()
  .eq('username', 'alice')
6. Table Management (DDL)Table creation and deletion (Schema changes) are typically performed via SQL in the Supabase Dashboard SQL Editor or via migrations, as the JavaScript client is designed for data manipulation, not schema definition.Create a TableRun this in the Supabase SQL Editor:create table profiles (
  id uuid default gen_random_uuid() primary key,
  username text unique not null,
  website text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);
Remove (Drop) a TableTo completely delete a table and all its data:drop table if exists profiles;
Add a Columnalter table profiles 
add column age int;
Summary TableOperationJS MethodSQL EquivalentCreate.insert()INSERT INTORead.select()SELECT FROMUpdate.update()UPDATE SETDelete.delete()DELETE FROMCreate TableN/A (Use SQL)CREATE TABLEDelete TableN/A (Use SQL)DROP TABLENote: Always enable Row Level Security (RLS) in your Supabase Dashboard to ensure that only authorized users can perform these operations.
