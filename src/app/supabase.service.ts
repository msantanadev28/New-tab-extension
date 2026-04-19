import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private _currentUser = new BehaviorSubject<User | null>(null);

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);

    // Listen for auth state changes
    this.supabase.auth.onAuthStateChange((event, session) => {
      this._currentUser.next(session?.user ?? null);
    });
  }

  get user$() {
    return this._currentUser.asObservable();
  }

  get currentUserValue() {
    return this._currentUser.value;
  }

  /**
   * --- AUTHENTICATION ---
   */
  async signUp(email: string, pass: string) {
    return await this.supabase.auth.signUp({ email, password: pass });
  }

  async signIn(email: string, pass: string) {
    return await this.supabase.auth.signInWithPassword({ email, password: pass });
  }

  async signOut() {
    return await this.supabase.auth.signOut();
  }

  /**
   * Fetch all entries from a specific table
   */
  async getTableData(tableName: string) {
    const { data, error } = await this.supabase
      .from(tableName)
      .select('*');

    if (error) throw error;
    return data;
  }

  /**
   * Insert a new row into a table
   */
  async insertData(tableName: string, rowData: any) {
    const { data, error } = await this.supabase
      .from(tableName)
      .insert([rowData]);

    if (error) throw error;
    return data;
  }

  /**
   * Update existing data
   */
  async updateData(tableName: string, id: string | number, update: any) {
    const { data, error } = await this.supabase
      .from(tableName)
      .update(update)
      .match({ id });

    if (error) throw error;
    return data;
  }

  /**
   * Delete data
   */
  async deleteData(tableName: string, id: string | number) {
    const { data, error } = await this.supabase
      .from(tableName)
      .delete()
      .match({ id });

    if (error) throw error;
    return data;
  }

  /**
   * UPSERT data - useful for syncing settings
   */
  async upsertData(tableName: string, rowData: any) {
    const { data, error } = await this.supabase
      .from(tableName)
      .upsert(rowData);

    if (error) throw error;
    return data;
  }
}
