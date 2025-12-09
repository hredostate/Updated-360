// @ts-ignore
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppRequest {
  phone_number: string;
  device_id?: string;
  template_id?: string;
  data?: Record<string, string>;
  media?: {
    url: string;
    caption?: string;
  };
  message_type?: 'template' | 'template_media' | 'conversational';
  message?: string; // For conversational messages
  from?: string; // Sender ID for conversational messages
}

/**
 * Termii WhatsApp Sender Function
 * 
 * Sends WhatsApp messages via Termii API and logs them to the database.
 * Supports template messages, template messages with media, and conversational messages.
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
    // Get environment variables
    const termiiApiKey = Deno.env.get('TERMII_API_KEY');
    const termiiDeviceId = Deno.env.get('TERMII_DEVICE_ID');
    const termiiBaseUrl = Deno.env.get('TERMII_BASE_URL') || 'https://api.ng.termii.com';

    if (!termiiApiKey) {
      console.error('TERMII_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'Configuration error' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Parse request body
    const body: WhatsAppRequest = await req.json();
    const {
      phone_number,
      device_id = termiiDeviceId,
      template_id,
      data,
      media,
      message_type = 'template',
      message,
      from = 'SchoolGuardian',
    } = body;

    // Validate required fields
    if (!phone_number) {
      throw new Error('phone_number is required');
    }

    if (message_type === 'template' || message_type === 'template_media') {
      if (!template_id) {
        throw new Error('template_id is required for template messages');
      }
      if (!device_id) {
        throw new Error('device_id is required for template messages');
      }
    }

    if (message_type === 'conversational' && !message) {
      throw new Error('message is required for conversational messages');
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get authorization header to determine school_id
    const authHeader = req.headers.get('Authorization');
    let schoolId: number | null = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
      
      if (!userError && userData?.user) {
        const { data: profile } = await supabaseAdmin
          .from('user_profiles')
          .select('school_id')
          .eq('id', userData.user.id)
          .single();
        
        if (profile) {
          schoolId = profile.school_id;
        }
      }
    }

    // Prepare Termii API request
    let termiiEndpoint: string;
    let termiiPayload: any;

    if (message_type === 'template') {
      termiiEndpoint = `${termiiBaseUrl}/api/send/template`;
      termiiPayload = {
        api_key: termiiApiKey,
        device_id: device_id,
        template_id: template_id,
        phone_number: phone_number,
        data: data || {},
      };
    } else if (message_type === 'template_media') {
      termiiEndpoint = `${termiiBaseUrl}/api/send/template/media`;
      termiiPayload = {
        api_key: termiiApiKey,
        device_id: device_id,
        template_id: template_id,
        phone_number: phone_number,
        data: data || {},
        media: media,
      };
    } else {
      // conversational
      termiiEndpoint = `${termiiBaseUrl}/api/sms/send`;
      termiiPayload = {
        api_key: termiiApiKey,
        to: phone_number,
        from: from,
        sms: message,
        type: 'plain',
        channel: 'whatsapp',
      };
    }

    // Send WhatsApp message via Termii
    console.log('Sending WhatsApp message via Termii:', { endpoint: termiiEndpoint, phone: phone_number });
    
    const termiiResponse = await fetch(termiiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(termiiPayload),
    });

    const termiiResult = await termiiResponse.json();
    console.log('Termii response:', termiiResult);

    const isSuccess = termiiResponse.ok && termiiResult.message_id;
    const status = isSuccess ? 'sent' : 'failed';
    const errorMessage = !isSuccess ? (termiiResult.message || 'Failed to send message') : null;

    // Log to database
    const logEntry = {
      school_id: schoolId,
      recipient_phone: phone_number,
      template_id: template_id,
      message_type: message_type,
      message_content: message_type === 'conversational' ? { message } : data,
      media_url: media?.url,
      termii_message_id: termiiResult.message_id,
      status: status,
      error_message: errorMessage,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: logError } = await supabaseAdmin
      .from('whatsapp_message_logs')
      .insert(logEntry);

    if (logError) {
      console.error('Failed to log WhatsApp message:', logError);
    }

    if (!isSuccess) {
      return new Response(JSON.stringify({ 
        error: 'Failed to send WhatsApp message',
        message: errorMessage 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'WhatsApp message sent successfully',
      message_id: termiiResult.message_id,
      balance: termiiResult.balance,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('WhatsApp send error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
