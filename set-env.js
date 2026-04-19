const fs = require('fs');

const envConfigFile = `export const environment = {
  supabaseUrl: '${process.env.VITE_SUPABASE_URL || ''}',
  supabaseAnonKey: '${process.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''}'
};
`;

const dir = './src/environments';
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}
fs.writeFileSync('./src/environments/environment.ts', envConfigFile);
console.log('Environment file generated correctly');
