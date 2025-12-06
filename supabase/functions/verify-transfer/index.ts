// @ts-ignore
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Verify Transfer Status
 * 
 * This function verifies the status of a transfer using Paystack's Verify Transfer API.
 * It can be used to check if a transfer has been completed, failed, or is still pending.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { reference } = await req.json();
    if (!reference) {
      throw new Error("Transfer reference is required.");
    }

    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      throw new Error('Paystack secret key is not configured.');
    }

    // Use Service Role for backend operations
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify transfer status via Paystack API
    const verifyResponse = await fetch(`https://api.paystack.co/transfer/verify/${reference}`, {
      method: 'GET',
      headers: { 
        Authorization: `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json' 
      },
    });
    
    const verifyData = await verifyResponse.json();
    
    if (!verifyResponse.ok || !verifyData.status) {
      throw new Error(`Failed to verify transfer: ${verifyData.message}`);
    }

    // Update payroll item with verified status
    const transferStatus = verifyData.data.status;
    await adminClient
      .from('payroll_items')
      .update({ transfer_status: transferStatus })
      .eq('transfer_reference', reference);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Transfer status verified',
      data: {
        reference: reference,
        status: transferStatus,
        amount: verifyData.data.amount,
        recipient: verifyData.data.recipient,
        created_at: verifyData.data.createdAt,
        transferred_at: verifyData.data.transferred_at,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
