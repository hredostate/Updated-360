
// @ts-ignore
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

declare const Deno: any;

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Server configuration error: Missing Supabase URL or Service Key.');
    }

    // Service role client is required for admin.createUser and admin.updateUserById
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Safely parse body
    let body;
    try {
        body = await req.json();
    } catch (e) {
        throw new Error('Invalid JSON body.');
    }

    const { action, students, studentId, studentIds } = body;
    
    console.log(`Processing action: ${action}`);

    if (action === 'bulk_create') {
        if (!students || !Array.isArray(students)) throw new Error("Invalid 'students' array.");

        console.log(`Processing bulk_create for ${students.length} students`);
        const results = [];
        
        for (const student of students) {
            try {
                const studentName = student.name || 'Unknown Student';
                console.log(`Processing student: ${studentName}`);
                
                // Validate required fields
                if (!student.school_id) {
                    results.push({ name: studentName, status: 'Failed', error: 'Missing school_id' });
                    continue;
                }

                // Create new auth user - skip duplicate checking to avoid DB errors
                const password = `Student${Math.floor(1000 + Math.random() * 9000)}!`;
                
                // Safe generation of email prefix
                const cleanName = studentName.toLowerCase().replace(/[^a-z0-9]/g, '');
                const cleanAdmission = student.admission_number ? student.admission_number.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
                
                const emailPrefix = cleanAdmission || cleanName || 'student';
                
                // Generate pseudo-email if not provided - use timestamp + random to ensure uniqueness
                const timestamp = Date.now().toString().slice(-6);
                const random = Math.floor(Math.random() * 1000);
                const email = student.email || `${emailPrefix}.${timestamp}${random}@school.local`;

                console.log(`Creating auth user with email: ${email}`);

                const { data: newUser, error: userError } = await supabaseAdmin.auth.admin.createUser({
                    email: email,
                    password: password,
                    email_confirm: true,
                    user_metadata: {
                        name: studentName,
                        user_type: 'student',
                        class_id: student.class_id,
                        arm_id: student.arm_id,
                        admission_number: student.admission_number,
                        initial_password: password,
                        school_id: student.school_id
                    }
                });

                if (userError) {
                    console.error(`Auth user creation failed for ${studentName}:`, userError);
                    results.push({ name: studentName, status: 'Failed', error: userError.message });
                } else {
                    console.log(`Successfully created auth user for ${studentName}, ID: ${newUser.user.id}`);
                    results.push({ name: studentName, email: email, password: password, status: 'Success' });
                }
            } catch (innerError: any) {
                console.error(`Crash processing student ${student.name}:`, innerError);
                results.push({ name: student.name || 'Unknown', status: 'Failed', error: `System Error: ${innerError.message}` });
            }
        }

        console.log(`Bulk create completed. Results: ${results.length} processed`);
        return new Response(JSON.stringify({ success: true, credentials: results }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });
    }

    if (action === 'create_single_for_existing') {
        if (!studentId) throw new Error("Missing 'studentId'.");

        const { data: studentRecord, error: fetchError } = await supabaseAdmin
            .from('students')
            .select('*')
            .eq('id', studentId)
            .single();

        if (fetchError || !studentRecord) {
            throw new Error('Student record not found in database.');
        }

        if (studentRecord.user_id) {
            throw new Error('This student already has a login account.');
        }

        const password = `Student${Math.floor(1000 + Math.random() * 9000)}!`;
        const emailPrefix = studentRecord.admission_number 
            ? studentRecord.admission_number.toLowerCase().replace(/[^a-z0-9]/g, '') 
            : studentRecord.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const email = `${emailPrefix}.${Math.floor(Math.random() * 1000)}@school.com`;

        const { data: user, error: userError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: {
                name: studentRecord.name,
                user_type: 'student',
                class_id: studentRecord.class_id,
                arm_id: studentRecord.arm_id,
                admission_number: studentRecord.admission_number,
                initial_password: password,
                school_id: studentRecord.school_id,
                skip_student_creation: true
            }
        });

        if (userError) throw userError;

        const { error: updateError } = await supabaseAdmin
            .from('students')
            .update({ user_id: user.user.id })
            .eq('id', studentId);

        if (updateError) throw updateError;
        
        await supabaseAdmin
            .from('student_profiles')
            .update({ student_record_id: studentId })
            .eq('id', user.user.id);

        return new Response(JSON.stringify({ success: true, credential: { email, password } }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });
    }

    if (action === 'bulk_create_for_existing') {
        if (!studentIds || !Array.isArray(studentIds)) {
            throw new Error("studentIds array is required");
        }

        const results = [];
        for (const id of studentIds) {
             const { data: student, error: fetchError } = await supabaseAdmin
                .from('students')
                .select('*')
                .eq('id', id)
                .single();
             
             if (fetchError || !student) {
                 results.push({ id, name: `ID: ${id}`, status: 'Failed', error: 'Student not found' });
                 continue;
             }

             if (student.user_id) {
                 results.push({ id, name: student.name, status: 'Skipped', error: 'Account already exists' });
                 continue;
             }

             const password = `Student${Math.floor(1000 + Math.random() * 9000)}!`;
             const emailPrefix = student.admission_number 
                ? student.admission_number.toLowerCase().replace(/[^a-z0-9]/g, '') 
                : student.name.toLowerCase().replace(/[^a-z0-9]/g, '');
             const email = `${emailPrefix}.${Math.floor(Math.random()*1000)}@school.com`;

             const { data: user, error: userError } = await supabaseAdmin.auth.admin.createUser({
                email: email,
                password: password,
                email_confirm: true,
                user_metadata: {
                    name: student.name,
                    user_type: 'student',
                    class_id: student.class_id,
                    arm_id: student.arm_id,
                    admission_number: student.admission_number,
                    initial_password: password,
                    school_id: student.school_id,
                    skip_student_creation: true
                }
            });

            if (userError) {
                results.push({ name: student.name, status: 'Failed', error: userError.message });
            } else {
                await supabaseAdmin.from('students').update({ user_id: user.user.id }).eq('id', id);
                
                await supabaseAdmin
                    .from('student_profiles')
                    .update({ student_record_id: id })
                    .eq('id', user.user.id);

                results.push({ name: student.name, email, password, status: 'Success' });
            }
        }

        return new Response(JSON.stringify({ success: true, credentials: results }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });
    }

    if (action === 'reset_password') {
        console.log('reset_password action called with studentId:', studentId);
        
        if (!studentId) {
            console.error("Missing studentId");
            throw new Error("Missing 'studentId' for password reset.");
        }

        // In this system, the studentId passed from the app IS the auth user UUID
        // (student_profiles.id references auth.users.id directly)
        // So we can directly use studentId as the auth user ID
        
        const newPassword = `Student${Math.floor(1000 + Math.random() * 9000)}!`;
        console.log('Attempting to reset password for auth user ID:', studentId);
        
        // Try to get the auth user directly
        let authUser;
        let authError;
        
        try {
            const result = await supabaseAdmin.auth.admin.getUserById(studentId);
            authUser = result.data;
            authError = result.error;
        } catch (e: any) {
            console.error('Exception calling getUserById:', e.message);
            throw new Error(`Failed to access auth user: ${e.message}`);
        }
        
        if (authError) {
            console.error("Auth user fetch error:", authError);
            throw new Error(`Could not find the authentication user: ${authError.message}`);
        }
        
        if (!authUser || !authUser.user) {
            console.error("Auth user is null or missing user object");
            throw new Error("Could not find the authentication user. The account might have been deleted.");
        }

        console.log('Auth user found:', authUser.user.email, '- updating password...');
        
        // Safely merge metadata
        const currentMetadata = authUser.user.user_metadata || {};

        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            studentId,
            {
                password: newPassword,
                user_metadata: {
                    ...currentMetadata,
                    initial_password: newPassword
                }
            }
        );

        if (updateError) {
            console.error("Update User Error:", updateError);
            throw new Error(`Failed to update user password: ${updateError.message}`);
        }

        console.log('Password reset successful');
        return new Response(JSON.stringify({ success: true, password: newPassword }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });
    }

    // Delete a single student account
    if (action === 'delete_account') {
        console.log('delete_account action called with studentId:', studentId);
        
        if (!studentId) {
            console.error("Missing studentId");
            throw new Error("Missing 'studentId' for account deletion.");
        }

        // The studentId is the auth user UUID (student_profiles.id = auth.users.id)
        console.log('Attempting to delete auth user ID:', studentId);
        
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(studentId);
        
        if (deleteError) {
            console.error("Delete user error:", deleteError);
            throw new Error(`Failed to delete user account: ${deleteError.message}`);
        }

        console.log('Account deleted successfully');
        return new Response(JSON.stringify({ success: true, message: 'Account deleted successfully' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });
    }

    // Bulk delete student accounts
    if (action === 'bulk_delete') {
        console.log('bulk_delete action called');
        
        if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            throw new Error("Missing or invalid 'studentIds' array for bulk deletion.");
        }

        console.log(`Processing bulk delete for ${studentIds.length} accounts`);
        const results = [];

        for (const id of studentIds) {
            try {
                console.log(`Deleting account: ${id}`);
                const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(id);
                
                if (deleteError) {
                    console.error(`Failed to delete ${id}:`, deleteError);
                    results.push({ id, status: 'Failed', error: deleteError.message });
                } else {
                    console.log(`Successfully deleted ${id}`);
                    results.push({ id, status: 'Deleted' });
                }
            } catch (e: any) {
                console.error(`Exception deleting ${id}:`, e);
                results.push({ id, status: 'Failed', error: e.message });
            }
        }

        const successCount = results.filter(r => r.status === 'Deleted').length;
        console.log(`Bulk delete completed. ${successCount}/${studentIds.length} deleted successfully`);
        
        return new Response(JSON.stringify({ success: true, results, deleted: successCount, total: studentIds.length }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });
    }

    throw new Error(`Unknown action: ${action}`);

  } catch (error) {
    console.error('Manage Users Function Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
