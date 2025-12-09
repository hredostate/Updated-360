// @ts-ignore
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TermiiWebhookEvent {
  message_id: string;
  status: string; // 'SENT', 'DELIVERED', 'FAILED', 'READ'
  phone_number: string;
  timestamp?: string;
  error?: string;
}

/**
 * Termii Webhook Handler
 * 
 * Handles delivery status callbacks from Termii and updates message logs.
 * Termii sends webhook events when message status changes (sent, delivered, failed, read).
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405,
    });
  }

  try {
    // Parse webhook payload
    const event: TermiiWebhookEvent = await req.json();
    console.log('Termii webhook event received:', event);

    // Validate required fields
    if (!event.message_id) {
      console.error('Missing message_id in webhook event');
      return new Response(JSON.stringify({ error: 'Invalid webhook data' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // Return 200 to acknowledge receipt
      });
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Map Termii status to our internal status
    let internalStatus: string;
    switch (event.status?.toUpperCase()) {
      case 'SENT':
        internalStatus = 'sent';
        break;
      case 'DELIVERED':
      case 'READ':
        internalStatus = 'delivered';
        break;
      case 'FAILED':
        internalStatus = 'failed';
        break;
      default:
        internalStatus = 'pending';
    }

    // Update message log
    const { data: updatedLog, error: updateError } = await supabaseAdmin
      .from('whatsapp_message_logs')
      .update({
        status: internalStatus,
        error_message: event.error || null,
        updated_at: new Date().toISOString(),
      })
      .eq('termii_message_id', event.message_id)
      .select();

    if (updateError) {
      console.error('Error updating message log:', updateError);
      return new Response(JSON.stringify({ 
        error: 'Failed to update message log',
        message: updateError.message 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // Return 200 to acknowledge receipt
      });
    }

    if (!updatedLog || updatedLog.length === 0) {
      console.log(`No message log found for message_id: ${event.message_id}`);
      return new Response(JSON.stringify({ 
        success: true,
        message: 'Message not found in logs' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    console.log(`Updated message log for ${event.message_id} to status: ${internalStatus}`);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Webhook processed successfully',
      updated_status: internalStatus,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    // Always return 200 to prevent Termii from retrying
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }
});
