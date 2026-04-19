import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Bookmark, SearchEngine, TableName, User, UserSettings } from '../models/database.types';
import { TABLE_PRIMARY_KEYS } from '../models/table-metadata';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient | null = null;

  constructor() {
    const supabaseUrl = environment.supabaseUrl;
    const supabaseKey = environment.supabaseAnonKey;

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  }

  private requireClient(): SupabaseClient {
    if (!this.supabase) {
      throw new Error('Supabase is not configured. Check src/environments/environment.ts.');
    }

    return this.supabase;
  }

  private generateBookmarkId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }

    return `bm_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }

  private getPrimaryKey(table: TableName): string {
    return TABLE_PRIMARY_KEYS[table];
  }

  private stripPrimaryKey(table: TableName, row: Record<string, unknown>): Record<string, unknown> {
    const primaryKey = this.getPrimaryKey(table);
    const payload = { ...row };
    delete payload[primaryKey];

    if (table === 'bookmarks') {
      const bookmarkPayload = row as Partial<Bookmark>;

      return {
        ...bookmarkPayload,
        bookmark_id: bookmarkPayload.bookmark_id ?? this.generateBookmarkId()
      };
    }

    return payload;
  }

  private tableQuery(table: TableName): any {
    return this.requireClient().from(table as any);
  }

  async listRows(table: TableName) {
    return await this.tableQuery(table).select('*');
  }

  async getRowById(table: TableName, id: string | number) {
    return await this.tableQuery(table).select('*').eq(this.getPrimaryKey(table), id).single();
  }

  async createRow(table: TableName, row: Record<string, unknown>) {
    const payload = this.stripPrimaryKey(table, row);

    return await this.tableQuery(table).insert(payload).select();
  }

  async updateRow(table: TableName, id: string | number, updates: Record<string, unknown>) {
    const payload = this.stripPrimaryKey(table, updates);

    return await this.tableQuery(table).update(payload).eq(this.getPrimaryKey(table), id).select();
  }

  async deleteRow(table: TableName, id: string | number) {
    return await this.tableQuery(table).delete().eq(this.getPrimaryKey(table), id);
  }

  async upsertRow(table: TableName, row: Record<string, unknown>) {
    // We don't strip primary key for upsert, as it's needed to identify the record
    return await this.tableQuery(table).upsert(row).select();
  }

  async upsertRows(table: TableName, rows: Record<string, unknown>[]) {
    return await this.tableQuery(table).upsert(rows).select();
  }

  // --- Bookmarks CRUD ---

  async getBookmarks() {
    return await this.tableQuery('bookmarks')
      .select('*')
      .order('display_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true, nullsFirst: false });
  }

  async getBookmarkById(id: string) {
    return await this.getRowById('bookmarks', id);
  }

  async createBookmark(bookmark: Partial<Bookmark>) {
    return await this.createRow('bookmarks', bookmark);
  }

  async updateBookmark(id: string, updates: Partial<Bookmark>) {
    return await this.updateRow('bookmarks', id, updates);
  }

  async deleteBookmark(id: string) {
    return await this.deleteRow('bookmarks', id);
  }

  // --- User Settings CRUD ---

  async getUserSettings(userId: string) {
    return await this.getRowById('user_settings', userId);
  }

  async updateUserSettings(userId: string, updates: Partial<UserSettings>) {
    return await this.updateRow('user_settings', userId, updates);
  }

  // --- Search Engines CRUD ---

  async getSearchEngines() {
    return await this.listRows('search_engines');
  }

  async createSearchEngine(searchEngine: Partial<SearchEngine>) {
    return await this.createRow('search_engines', searchEngine);
  }

  async updateSearchEngine(id: number, updates: Partial<SearchEngine>) {
    return await this.updateRow('search_engines', id, updates);
  }

  async deleteSearchEngine(id: number) {
    return await this.deleteRow('search_engines', id);
  }

  // --- Users CRUD ---

  async getUsers() {
    return await this.listRows('users');
  }

  async getUserById(id: string) {
    return await this.getRowById('users', id);
  }

  async createUser(user: Partial<User>) {
    return await this.createRow('users', user);
  }

  async updateUser(id: string, updates: Partial<User>) {
    return await this.updateRow('users', id, updates);
  }

  async deleteUser(id: string) {
    return await this.deleteRow('users', id);
  }
}
