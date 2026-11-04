import { createClient } from '@supabase/supabase-js';
const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.ADMIN_EMAIL;
const username = process.env.ADMIN_USERNAME || 'admin';
const password = process.env.ADMIN_PASSWORD || 'Bakkar@player';
if (!url || !serviceKey || !email) {
  console.error('Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY or ADMIN_EMAIL in .env');
  process.exit(1);
}
const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
const { data: users, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (listError) throw listError;
let user = users.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
if (!user) {
  const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  user = data.user;
} else {
  const { error } = await supabase.auth.admin.updateUserById(user.id, { password, email_confirm: true });
  if (error) throw error;
}
const { error: profileError } = await supabase.from('profiles').upsert({ id: user.id, username, role: 'admin' });
if (profileError) throw profileError;
console.log(`Admin account ready. Login username: ${username}; email mapped internally: ${email}`);
console.log('Password was set from ADMIN_PASSWORD. Change it after first login and keep .env private.');
