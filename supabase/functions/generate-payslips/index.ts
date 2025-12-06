
// @ts-ignore
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple HTML template for a payslip
const generatePayslipHtml = (item: any, run: any, school: any) => {
    const earnings = (item.deductions || []).filter((d: any) => d.amount > 0);
    const deductions = (item.deductions || []).filter((d: any) => d.amount < 0);
    const toCurrency = (num: number) => `₦${Number(num || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 12px; color: #333; }
        .container { width: 90%; max-width: 800px; margin: auto; border: 1px solid #eee; padding: 20px; }
        .header { text-align: center; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 20px; }
        .header h1 { margin: 0; }
        .header p { margin: 5px 0; color: #555; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .total-row td { font-weight: bold; border-top: 2px solid #333; }
        .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;}
        .text-right { text-align: right; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${school.display_name || 'School Name'}</h1>
            <p>${school.address || ''}</p>
            <h2>Payslip for ${run.period_label}</h2>
        </div>
        <div class="info-grid">
            <div>
                <p><strong>Employee:</strong> ${item.user.name}</p>
                <p><strong>Staff ID:</strong> ${item.user.staff_code || 'N/A'}</p>
            </div>
            <div>
                <p><strong>Payment Date:</strong> ${new Date(run.created_at).toLocaleDateString()}</p>
                <p><strong>Bank:</strong> ${item.user.bank_name || 'N/A'}</p>
                <p><strong>Account Number:</strong> ${item.user.account_number ? '******' + item.user.account_number.slice(-4) : 'N/A'}</p>
            </div>
        </div>
        
        <div class="summary-grid">
            <div>
                <table>
                    <thead><tr><th>Earnings</th><th class="text-right">Amount</th></tr></thead>
                    <tbody>
                        <tr><td>Base Pay</td><td class="text-right">${toCurrency(item.user.base_pay)}</td></tr>
                        ${earnings.map((d: any) => `<tr><td>${d.label}</td><td class="text-right">${toCurrency(d.amount)}</td></tr>`).join('')}
                        <tr class="total-row"><td>Gross Earnings</td><td class="text-right">${toCurrency(item.gross_amount)}</td></tr>
                    </tbody>
                </table>
            </div>
            <div>
                <table>
                    <thead><tr><th>Deductions</th><th class="text-right">Amount</th></tr></thead>
                    <tbody>
                        ${deductions.map((d: any) => `<tr><td>${d.label}</td><td class="text-right">${toCurrency(Math.abs(d.amount))}</td></tr>`).join('')}
                        ${deductions.length === 0 ? '<tr><td>None</td><td class="text-right">₦0.00</td></tr>' : ''}
                        <tr class="total-row"><td>Total Deductions</td><td class="text-right">${toCurrency(deductions.reduce((sum: number, d: any) => sum + Math.abs(d.amount), 0))}</td></tr>
                    </tbody>
                </table>
            </div>
        </div>

        <table>
            <tbody>
                <tr class="total-row">
                    <td>Net Pay</td>
                    <td class="text-right" style="font-size: 14px;">${toCurrency(item.net_amount)}</td>
                </tr>
            </tbody>
        </table>
    </div>
</body>
</html>`;
}


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Get secrets and initialize clients
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    const pdfApiKey = Deno.env.get('PDF_API_KEY');
    const pdfApiSecret = Deno.env.get('PDF_API_SECRET');
    const pdfApiWorkspace = Deno.env.get('PDF_API_WORKSPACE');
    if (!pdfApiKey || !pdfApiSecret || !pdfApiWorkspace) {
        throw new Error('PDF generation secrets are not configured.');
    }
    
    const adminClient = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));

    // 2. Get request body and validate
    const { run_id } = await req.json();
    if (!run_id) throw new Error("Missing 'run_id' in request body.");
    
    // 3. Fetch all necessary data
    const { data: run, error: runError } = await adminClient.from('payroll_runs').select('*').eq('id', run_id).single();
    if (runError) throw runError;
    
    const { data: items, error: itemsError } = await adminClient.from('payroll_items').select('*, user:user_profiles(*)').eq('payroll_run_id', run_id);
    if (itemsError) throw itemsError;
    
    const { data: school, error: schoolError } = await adminClient.from('school_config').select('*').eq('school_id', run.school_id).single();
    if (schoolError) throw schoolError;

    const pdfAuthToken = btoa(`${pdfApiKey}:${pdfApiSecret}`);
    const pdfEndpoint = 'https://us1.pdfgeneratorapi.com/api/v4/documents/generate';
    
    // 4. Loop through items, generate PDF, and update record
    for (const item of items) {
        if (!item.user) {
            console.warn(`Skipping payslip for item ${item.id} because user data is missing.`);
            continue;
        }

        const htmlContent = generatePayslipHtml(item, run, school);
        
        // --- Call PDFGeneratorAPI ---
        const pdfPayload = {
            template: { "format": "html", "content": htmlContent },
            format: "pdf",
            output: "url",
            name: `payslip_${item.user.name.replace(/\s/g, '_')}_${run.period_label.replace(/\s/g, '_')}`
        };

        const generationResponse = await fetch(pdfEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${pdfAuthToken}`,
                'X-Auth-Workspace': pdfApiWorkspace,
            },
            body: JSON.stringify(pdfPayload)
        });

        if (!generationResponse.ok) {
            const errorBody = await generationResponse.json();
            throw new Error(`PDF API failed for ${item.user.name}: ${JSON.stringify(errorBody)}`);
        }
        
        const genData = await generationResponse.json();
        const pdfUrl = genData.response;

        const pdfFileResponse = await fetch(pdfUrl);
        if (!pdfFileResponse.ok) throw new Error(`Failed to download generated PDF from ${pdfUrl}`);
        const pdfBlob = await pdfFileResponse.blob();
        
        // --- Upload to Supabase Storage ---
        const filePath = `payslips/${run.id}/${item.user.id}_${run.period_label.replace(/[^a-z0-9]/gi, '_')}.pdf`;
        const { error: uploadError } = await adminClient.storage
            .from('documents')
            .upload(filePath, pdfBlob, {
                contentType: 'application/pdf',
                upsert: true,
            });
        
        if (uploadError) throw uploadError;

        // --- Update item with URL ---
        const { data: { publicUrl } } = adminClient.storage.from('documents').getPublicUrl(filePath);
        await adminClient.from('payroll_items').update({ payslip_url: publicUrl }).eq('id', item.id);
    }
    
    return new Response(JSON.stringify({ success: true, message: `${items.length} payslips generated successfully.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in generate-payslips function:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
