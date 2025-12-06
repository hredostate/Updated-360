
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

declare const Deno: any;

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey',
      },
    });
  }

  try {
    const bulksmsApiToken = Deno.env.get('BULKSMS_API_TOKEN');
    const bulksmsBaseUrl = Deno.env.get('BULKSMS_BASE_URL') || 'https://www.bulksmsnigeria.com/api';

    if (!bulksmsApiToken) {
      throw new Error('BULKSMS_API_TOKEN is not set in Supabase function secrets.');
    }

    const response = await fetch(`${bulksmsBaseUrl}/v2/balance`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${bulksmsApiToken}`,
      },
    });

    if (!response.ok) {
        // Handle non-2xx responses from the provider
        const errorBody = await response.json().catch(() => ({ message: 'Failed to parse error response from SMS provider.' }));
        return new Response(JSON.stringify({
            ok: false,
            balanceRaw: null,
            balanceFormatted: null,
            currency: null,
            providerCode: errorBody.code || `HTTP-${response.status}`,
            providerMessage: errorBody.message || 'Provider returned an error.',
            friendlyMessage: 'Could not connect to the SMS provider to fetch balance.',
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
    }

    const providerResponse = await response.json();
    const isSuccess = providerResponse.status === 'success';

    const normalizedResponse = {
      ok: isSuccess,
      balanceRaw: providerResponse.data?.balance || null,
      balanceFormatted: providerResponse.data?.formatted || null,
      currency: providerResponse.data?.currency || null,
      providerCode: providerResponse.code || 'UNKNOWN',
      providerMessage: providerResponse.message || 'No message from provider.',
      friendlyMessage: isSuccess ? 'Balance retrieved successfully.' : 'There was a problem retrieving the balance from the provider.',
    };

    return new Response(JSON.stringify(normalizedResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (error) {
    console.error('Error in sms-balance function:', error.message);
    return new Response(JSON.stringify({
      ok: false,
      balanceRaw: null,
      balanceFormatted: null,
      currency: null,
      providerCode: 'INTERNAL_ERROR',
      providerMessage: error.message,
      friendlyMessage: 'An internal error occurred while fetching the SMS balance.',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});
