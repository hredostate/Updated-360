/**
 * Paystack Dedicated Virtual Accounts (DVA) Service
 * Handles all interactions with the Paystack API for managing virtual accounts
 */

import type { BankProvider, DedicatedVirtualAccount, Student } from '../types';

export interface PaystackDVACreateRequest {
    customer: number | string; // Customer ID or code
    preferred_bank?: string;
    subaccount?: string;
    split_code?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
}

export interface PaystackDVAAssignRequest {
    email: string;
    first_name: string;
    last_name: string;
    phone: string;
    preferred_bank: string;
    country: string; // NG or GH
    account_number?: string;
    bvn?: string;
    bank_code?: string;
    subaccount?: string;
    split_code?: string;
}

export interface PaystackDVAResponse {
    status: boolean;
    message: string;
    data: {
        bank: {
            name: string;
            id: number;
            slug: string;
        };
        account_name: string;
        account_number: string;
        assigned: boolean;
        currency: string;
        metadata: any;
        active: boolean;
        id: number;
        created_at: string;
        updated_at: string;
        assignment?: {
            integration: number;
            assignee_id: number;
            assignee_type: string;
            expired: boolean;
            account_type: string;
            assigned_at: string;
        };
        customer?: {
            id: number;
            first_name: string;
            last_name: string;
            email: string;
            customer_code: string;
            phone: string;
            risk_action: string;
        };
    };
}

export interface PaystackCustomerResponse {
    status: boolean;
    message: string;
    data: {
        id: number;
        first_name: string;
        last_name: string;
        email: string;
        customer_code: string;
        phone: string | null;
        metadata: any;
        risk_action: string;
        createdAt: string;
        updatedAt: string;
    };
}

/**
 * Fetch available bank providers for DVA
 */
export async function fetchBankProviders(secretKey: string): Promise<BankProvider[]> {
    const response = await fetch('https://api.paystack.co/dedicated_account/available_providers', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${secretKey}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch bank providers: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.status) {
        throw new Error(result.message || 'Failed to fetch bank providers');
    }

    return result.data.map((provider: any) => ({
        id: provider.id,
        provider_slug: provider.provider_slug,
        bank_id: provider.bank_id,
        bank_name: provider.bank_name
    }));
}

/**
 * Create or get a Paystack customer for a student
 */
export async function createOrGetPaystackCustomer(
    secretKey: string,
    student: Student
): Promise<number> {
    // First, try to find existing customer by email
    if (student.email) {
        try {
            const searchResponse = await fetch(
                `https://api.paystack.co/customer/${encodeURIComponent(student.email)}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${secretKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (searchResponse.ok) {
                const result: PaystackCustomerResponse = await searchResponse.json();
                if (result.status) {
                    return result.data.id;
                }
            }
        } catch (error) {
            // Customer doesn't exist, will create below
            console.log('Customer not found, creating new one');
        }
    }

    // Create new customer
    const [firstName, ...lastNameParts] = student.name.split(' ');
    const lastName = lastNameParts.join(' ') || firstName;
    
    const createResponse = await fetch('https://api.paystack.co/customer', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${secretKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: student.email || `student${student.id}@${student.school_id}.temp`,
            first_name: firstName,
            last_name: lastName,
            phone: student.parent_phone_number_1 || '',
            metadata: {
                student_id: student.id,
                school_id: student.school_id,
                admission_number: student.admission_number
            }
        })
    });

    if (!createResponse.ok) {
        throw new Error(`Failed to create Paystack customer: ${createResponse.statusText}`);
    }

    const result: PaystackCustomerResponse = await createResponse.json();
    
    if (!result.status) {
        throw new Error(result.message || 'Failed to create customer');
    }

    return result.data.id;
}

/**
 * Create a Dedicated Virtual Account for a customer
 */
export async function createDedicatedVirtualAccount(
    secretKey: string,
    customerId: number,
    preferredBank: string
): Promise<PaystackDVAResponse> {
    const response = await fetch('https://api.paystack.co/dedicated_account', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${secretKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            customer: customerId,
            preferred_bank: preferredBank
        })
    });

    if (!response.ok) {
        throw new Error(`Failed to create DVA: ${response.statusText}`);
    }

    const result: PaystackDVAResponse = await response.json();
    
    if (!result.status) {
        throw new Error(result.message || 'Failed to create dedicated virtual account');
    }

    return result;
}

/**
 * Fetch a specific Dedicated Virtual Account
 */
export async function fetchDedicatedVirtualAccount(
    secretKey: string,
    accountId: number
): Promise<PaystackDVAResponse> {
    const response = await fetch(`https://api.paystack.co/dedicated_account/${accountId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${secretKey}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch DVA: ${response.statusText}`);
    }

    const result: PaystackDVAResponse = await response.json();
    
    if (!result.status) {
        throw new Error(result.message || 'Failed to fetch dedicated virtual account');
    }

    return result;
}

/**
 * List all Dedicated Virtual Accounts
 */
export async function listDedicatedVirtualAccounts(
    secretKey: string,
    params?: {
        active?: boolean;
        currency?: string;
        provider_slug?: string;
        bank_id?: string;
        customer?: string;
    }
): Promise<PaystackDVAResponse['data'][]> {
    const queryParams = new URLSearchParams();
    if (params?.active !== undefined) queryParams.append('active', String(params.active));
    if (params?.currency) queryParams.append('currency', params.currency);
    if (params?.provider_slug) queryParams.append('provider_slug', params.provider_slug);
    if (params?.bank_id) queryParams.append('bank_id', params.bank_id);
    if (params?.customer) queryParams.append('customer', params.customer);

    const url = `https://api.paystack.co/dedicated_account${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${secretKey}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to list DVAs: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.status) {
        throw new Error(result.message || 'Failed to list dedicated virtual accounts');
    }

    return result.data;
}

/**
 * Deactivate a Dedicated Virtual Account
 */
export async function deactivateDedicatedVirtualAccount(
    secretKey: string,
    accountId: number
): Promise<void> {
    const response = await fetch(`https://api.paystack.co/dedicated_account/${accountId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${secretKey}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to deactivate DVA: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.status) {
        throw new Error(result.message || 'Failed to deactivate dedicated virtual account');
    }
}
