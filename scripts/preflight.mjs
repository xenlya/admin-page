import { existsSync, readFileSync } from 'node:fs';
const path = '.env.local';
if (!existsSync(path)) { console.error('ERROR: .env.local is missing. Copy .env.example and configure it.'); process.exit(1); }
const lines=readFileSync(path,'utf8').split(/\r?\n/);
const env=Object.fromEntries(lines.filter(x=>x.includes('=') && !x.trim().startsWith('#')).map(x=>{const i=x.indexOf('=');return [x.slice(0,i).trim(),x.slice(i+1).trim().replace(/^['"]|['"]$/g,'')]}));
let errors=0;
const required=['NEXTAUTH_URL','NEXTAUTH_SECRET','AZURE_AD_CLIENT_ID','AZURE_AD_CLIENT_SECRET','AZURE_AD_TENANT_ID','ADMIN_ALLOWED_EMAILS','SEMESTER_WEBHOOK_URL','STUDENT_PROFILE_WEBHOOK_URL'];
for (const key of required) {
 const val=env[key];const suspicious=!val || /YOUR_|REPLACE_|your-university\.example/.test(val);
 console.log(`${suspicious ? 'FAIL' : 'OK  '} ${key}`);
 if (suspicious) errors++;
}
for (const key of ['SEMESTER_WEBHOOK_URL', 'STUDENT_PROFILE_WEBHOOK_URL']) {
 try {
  const u=new URL(env[key]??'');
  if (u.protocol!=='https:' && !(u.hostname==='localhost' && u.protocol==='http:')) throw new Error('HTTPS required');
 } catch { console.log(`FAIL ${key} is not a secure URL`); errors++; }
}
if ((env.ADMIN_ALLOWED_EMAILS??'').includes('*')) {console.error('FAIL wildcard emails are not allowed');errors++;}
if (errors) {console.error(`${errors} preflight checks failed; inspect .env.local locally (never send secrets).`);process.exit(1);}
console.log('Preflight passed (syntax/presence only, not a Microsoft sign-in or n8n authentication test).');
