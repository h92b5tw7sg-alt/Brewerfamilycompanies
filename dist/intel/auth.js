// Brewer Intelligence sign-in gate.
// Business records are never stored in this site's files. They load from a private
// Supabase project only after sign-in, and row-level security returns rows only to
// approved members. The key below is the browser-safe publishable key.
// Pinned to an exact release so a new upstream publish can't change this private page.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.1/+esm';

const SUPABASE_URL = 'https://ligjdeagnirrnaoixpue.supabase.co';
const SUPABASE_KEY = 'sb_publishable__brtUpVtwgA8BjSCxUEZTg_3WKqKLrl';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit' }
});

const TABLES = {
  companies: 'bi_companies',
  properties: 'bi_properties',
  tenants: 'bi_tenants',
  leases: 'bi_leases',
  company_property_relationships: 'bi_relationships',
  loans: 'bi_loans',
  open_reviews: 'bi_reviews',
  documents: 'bi_documents'
};

const gate = document.createElement('section');
gate.id = 'bi-gate';
gate.setAttribute('aria-live', 'polite');
gate.innerHTML = `
  <div class="bi-gate-card">
    <img src="bi-logo.png" alt="" class="bi-gate-logo">
    <div class="eyebrow">BREWER INTELLIGENCE</div>
    <h1>Private workspace</h1>
    <p id="bi-gate-msg">Sign in with your approved email. We'll send you a one-time sign-in link.</p>
    <form id="bi-gate-form">
      <label for="bi-email">Email</label>
      <input id="bi-email" type="email" autocomplete="email" required placeholder="you@example.com">
      <button type="submit">Email me a sign-in link</button>
    </form>
    <button id="bi-signout" class="text-button" type="button" hidden>Sign out</button>
  </div>`;
document.body.prepend(gate);

const msg = text => { document.getElementById('bi-gate-msg').textContent = text; };
const form = document.getElementById('bi-gate-form');
const signOutBtn = document.getElementById('bi-signout');

form.addEventListener('submit', async e => {
  e.preventDefault();
  const email = document.getElementById('bi-email').value.trim();
  if (!email) return;
  form.querySelector('button').disabled = true;
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: location.origin + location.pathname, shouldCreateUser: false }
  });
  form.querySelector('button').disabled = false;
  // Same message either way, so the form never reveals which emails are approved.
  msg('If ' + email + ' is approved, a sign-in link is on its way. You can close this tab.');
});

signOutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut();
  location.reload();
});

let loading = false;
async function loadWorkspace(session) {
  if (loading) return;
  loading = true;
  form.hidden = true;
  signOutBtn.hidden = false;
  msg('Signed in as ' + session.user.email + '. Loading your records…');
  try {
    const entries = await Promise.all(Object.entries(TABLES).map(async ([key, table]) => {
      const { data, error } = await supabase.from(table).select('data').order('sort_order').order('id');
      if (error) throw error;
      return [key, data.map(r => r.data)];
    }));
    const records = Object.fromEntries(entries);
    if (!records.companies.length) {
      msg('Signed in as ' + session.user.email + ', but this account has not been approved for Brewer Intelligence yet.');
      return;
    }
    const { data: meta } = await supabase.from('bi_meta').select('key,value');
    records.as_of = meta?.find(m => m.key === 'as_of')?.value ?? null;
    window.REVIEW_DATA = records;
    const app = document.createElement('script');
    app.src = 'app.js?v=20261119';
    app.onload = () => {
      document.documentElement.classList.remove('bi-locked');
      gate.hidden = true;
      addHeaderSignOut();
    };
    document.body.appendChild(app);
  } catch (err) {
    msg('Signed in, but records could not load. Please refresh. (' + (err.message || err) + ')');
  }
}

function addHeaderSignOut() {
  const right = document.querySelector('.header-right');
  if (!right || document.getElementById('bi-header-signout')) return;
  const b = document.createElement('button');
  b.id = 'bi-header-signout';
  b.className = 'text-button';
  b.type = 'button';
  b.textContent = 'Sign out';
  b.onclick = async () => { await supabase.auth.signOut(); location.reload(); };
  right.appendChild(b);
}

const { data: { session } } = await supabase.auth.getSession();
if (session) loadWorkspace(session);
supabase.auth.onAuthStateChange((event, s) => {
  if (event === 'SIGNED_IN' && s && !window.REVIEW_DATA) loadWorkspace(s);
});
