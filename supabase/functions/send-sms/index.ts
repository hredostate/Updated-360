
// Supabase Edge Function for sending SMS via BulkSMSNigeria API.
// This function is invoked via `supabase.functions.invoke('send-sms', ...)` from the client.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

declare const Deno: any;

// CORS headers for preflight and actual requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { to, body, reference } = await req.json();

    // Input validation
    if (!to || !Array.isArray(to) || to.length === 0) {
      throw new Error('"to" field must be a non-empty array of phone numbers.');
    }
    if (!body) {
      throw new Error('"body" field is required.');
    }

    // Retrieve secrets from environment variables
    const bulksmsApiToken = Deno.env.get('BULKSMS_API_TOKEN');
    const bulksmsSenderId = Deno.env.get('BULKSMS_SENDER_ID') || 'UPSS';
    const bulksmsBaseUrl = Deno.env.get('BULKSMS_BASE_URL') || 'https://www.bulksmsnigeria.com/api';

    if (!bulksmsApiToken) {
      throw new Error('Server configuration error: BULKSMS_API_TOKEN secret is not set.');
    }
    
    // Create Supabase client to log to the audit table
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Server configuration error: Supabase credentials are not set.');
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Prepare payload for BulkSMSNigeria API
    const payload = {
      to: to.join(','),
      from: bulksmsSenderId,
      body: body,
      dnd: '2', // Attempt to deliver to numbers on Do-Not-Disturb list
    };
    
    // Send the SMS via the external provider
    const response = await fetch(`${bulksmsBaseUrl}/v2/sms/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${bulksmsApiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();
    const isSuccess = response.ok && responseData.status === 'success';

    // Log the transaction to the audit table regardless of success
    const auditLog = {
      recipients: to,
      message_body: body,
      reference_id: reference || null,
      provider_message_id: responseData.data?.message_id || null,
      provider_code: responseData.code || `HTTP-${response.status}`,
      cost: responseData.data?.total_cost || null,
      currency: responseData.data?.currency || 'NGN',
      ok: isSuccess,
      friendly_message: responseData.message || 'No message from provider.',
    };

    const { error: logError } = await supabaseClient
      .from('communications_audit')
      .insert(auditLog);
      
    if (logError) {
      // Log the error but don't fail the request, as the SMS might have sent.
      console.error('Failed to log SMS to communications_audit table:', logError);
    }

    if (!isSuccess) {
      // If the API call itself failed, throw an error to return a non-200 status to the client.
      throw new Error(responseData.message || 'Failed to send SMS due to a provider error.');
    }

    // Return a success response to the client
    return new Response(JSON.stringify({ ok: true, message: 'SMS sent successfully.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    // Catch any errors and return a standardized error response
    console.error('Error in send-sms function:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400, // Use 400 for client errors (bad input), 500 might also be appropriate for server config issues
    });
  }
});
