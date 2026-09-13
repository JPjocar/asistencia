import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@^2/cors';

type CreateUserRequest = {
  action: 'create';
  email: string;
  password: string;
};

type SetActiveRequest = {
  action: 'set-active';
  isActive: boolean;
  userId: string;
};

type RequestBody = CreateUserRequest | SetActiveRequest;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(body: unknown, status = 200) {
  return Response.json(body, { headers: corsHeaders, status });
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') {
    return json({ ok: true });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const authorization = request.headers.get('Authorization');
  if (!authorization) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return json({ error: 'Function configuration is incomplete' }, 500);
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authorization } },
  });
  const { data: userData, error: userError } = await authClient.auth.getUser();
  if (userError || !userData.user) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { data: profile } = await adminClient
    .from('profiles')
    .select('role, is_active')
    .eq('id', userData.user.id)
    .single();
  if (profile?.role !== 'admin' || !profile.is_active) {
    return json({ error: 'Forbidden' }, 403);
  }

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request body' }, 400);
  }

  if (body.action === 'create') {
    const email = body.email?.trim().toLowerCase();
    if (!email || !emailPattern.test(email) || !body.password || body.password.length < 10) {
      return json({ error: 'Invalid account data' }, 400);
    }

    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      email_confirm: true,
      password: body.password,
    });
    if (error || !data.user) {
      if (error?.code === 'email_exists' || error?.message.toLowerCase().includes('already')) {
        return json({ code: 'email_exists', error: 'Account already exists' }, 409);
      }

      return json({ error: 'Unable to create user' }, 422);
    }

    return json({ id: data.user.id }, 201);
  }

  if (body.action === 'set-active') {
    if (!body.userId || typeof body.isActive !== 'boolean') {
      return json({ error: 'Invalid account data' }, 400);
    }

    const { data: target } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', body.userId)
      .single();
    if (target?.role !== 'worker') {
      return json({ error: 'Only worker accounts can be changed' }, 403);
    }

    const { error: authError } = await adminClient.auth.admin.updateUserById(body.userId, {
      ban_duration: body.isActive ? 'none' : '876000h',
    });
    if (authError) {
      return json({ error: 'Unable to update user access' }, 422);
    }

    const { error: profileError } = await adminClient
      .from('profiles')
      .update({ is_active: body.isActive })
      .eq('id', body.userId);
    if (profileError) {
      return json({ error: 'Unable to update user status' }, 422);
    }

    return json({ success: true });
  }

  return json({ error: 'Unknown action' }, 400);
});
