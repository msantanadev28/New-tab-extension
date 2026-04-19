import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
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
   * Upsert data into a table
   */
  async upsertData(tableName: string, rowData: any) {
    const { data, error } = await this.supabase
      .from(tableName)
      .upsert(rowData)
      .select();

    if (error) throw error;
    return data;
  }

  /**
   * Sync data to Supabase (Legacy method name)
   */
  async syncBackup(id: string, state: any) {
    return this.upsertData('backups', { id, state });
  }

  /**
   * Get backup data from Supabase (Legacy method name)
   */
  async getBackup(id: string) {
    const { data, error } = await this.supabase
      .from('backups')
      .select('state')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    return data?.state;
  }
}
