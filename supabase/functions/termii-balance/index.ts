// @ts-ignore
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Termii Balance Check Function
 * 
 * Checks the Termii account balance and returns information about available credits.
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only accept GET requests
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405,
    });
  }

  try {
    // Get environment variables
    const termiiApiKey = Deno.env.get('TERMII_API_KEY');
    const termiiBaseUrl = Deno.env.get('TERMII_BASE_URL') || 'https://api.ng.termii.com';

    if (!termiiApiKey) {
      console.error('TERMII_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'Configuration error' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Check balance via Termii API
    const balanceResponse = await fetch(
      `${termiiBaseUrl}/api/get-balance?api_key=${termiiApiKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!balanceResponse.ok) {
      throw new Error(`Failed to check balance: ${balanceResponse.statusText}`);
    }

    const balanceData = await balanceResponse.json();
    
    return new Response(JSON.stringify({ 
      success: true,
      balance: balanceData.balance,
      currency: balanceData.currency || 'NGN',
      user: balanceData.user,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Balance check error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to check balance',
      message: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
