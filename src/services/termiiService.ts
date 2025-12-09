/**
 * Termii WhatsApp Integration Service
 * Handles all interactions with the Termii API for WhatsApp messaging
 */

import type {
    TermiiTemplateMessage,
    TermiiTemplateMediaMessage,
    TermiiConversationalMessage,
    TermiiSenderId,
    TermiiPhonebookContact
} from '../types';

const TERMII_BASE_URL = 'https://api.ng.termii.com';

export interface TermiiApiResponse<T = any> {
    message?: string;
    message_id?: string;
    balance?: number;
    user?: string;
    currency?: string;
    data?: T;
}

export interface TermiiSenderIdRequest {
    api_key: string;
    sender_id: string;
    usecase: string;
    company: string;
}

export interface TermiiContactUpload {
    api_key: string;
    phonebook_id: string;
    contact_file: string; // Base64 encoded CSV
    country_code: string;
}

/**
 * Send WhatsApp template message (no media)
 */
export async function sendWhatsAppTemplate(
    params: TermiiTemplateMessage
): Promise<TermiiApiResponse> {
    const response = await fetch(`${TERMII_BASE_URL}/api/send/template`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            api_key: params.api_key,
            device_id: params.device_id,
            template_id: params.template_id,
            phone_number: params.phone_number,
            data: params.data,
        }),
    });

    if (!response.ok) {
        throw new Error(`Failed to send WhatsApp template: ${response.statusText}`);
    }

    return await response.json();
}

/**
 * Send WhatsApp template message with media (PDFs, images)
 */
export async function sendWhatsAppTemplateWithMedia(
    params: TermiiTemplateMediaMessage
): Promise<TermiiApiResponse> {
    const response = await fetch(`${TERMII_BASE_URL}/api/send/template/media`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            api_key: params.api_key,
            device_id: params.device_id,
            template_id: params.template_id,
            phone_number: params.phone_number,
            data: params.data,
            media: params.media,
        }),
    });

    if (!response.ok) {
        throw new Error(`Failed to send WhatsApp template with media: ${response.statusText}`);
    }

    return await response.json();
}

/**
 * Send conversational WhatsApp message
 */
export async function sendConversationalWhatsApp(
    params: TermiiConversationalMessage
): Promise<TermiiApiResponse> {
    const response = await fetch(`${TERMII_BASE_URL}/api/sms/send`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            api_key: params.api_key,
            to: params.to,
            from: params.from,
            sms: params.sms,
            type: params.type,
            channel: 'whatsapp',
        }),
    });

    if (!response.ok) {
        throw new Error(`Failed to send conversational WhatsApp: ${response.statusText}`);
    }

    return await response.json();
}

/**
 * Fetch all Sender IDs
 */
export async function fetchSenderIds(apiKey: string): Promise<TermiiSenderId[]> {
    const response = await fetch(`${TERMII_BASE_URL}/api/sender-id?api_key=${apiKey}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch sender IDs: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data || [];
}

/**
 * Request a new Sender ID
 */
export async function requestSenderId(
    params: TermiiSenderIdRequest
): Promise<TermiiApiResponse> {
    const response = await fetch(`${TERMII_BASE_URL}/api/sender-id/request`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
    });

    if (!response.ok) {
        throw new Error(`Failed to request sender ID: ${response.statusText}`);
    }

    return await response.json();
}

/**
 * Fetch phonebook contacts
 */
export async function fetchPhonebookContacts(
    apiKey: string,
    phonebookId: string
): Promise<TermiiPhonebookContact[]> {
    const response = await fetch(
        `${TERMII_BASE_URL}/api/phonebooks/${phonebookId}/contacts?api_key=${apiKey}`,
        {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch phonebook contacts: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data || [];
}

/**
 * Add a single contact to phonebook
 */
export async function addPhonebookContact(
    apiKey: string,
    phonebookId: string,
    contact: {
        phone_number: string;
        email_address?: string;
        first_name?: string;
        last_name?: string;
        company?: string;
        country_code?: string;
    }
): Promise<TermiiApiResponse> {
    const response = await fetch(
        `${TERMII_BASE_URL}/api/phonebooks/${phonebookId}/contacts`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                api_key: apiKey,
                ...contact,
            }),
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to add phonebook contact: ${response.statusText}`);
    }

    return await response.json();
}

/**
 * Add multiple contacts to phonebook (bulk upload)
 */
export async function addMultiplePhonebookContacts(
    params: TermiiContactUpload
): Promise<TermiiApiResponse> {
    const response = await fetch(`${TERMII_BASE_URL}/api/phonebooks/contacts/upload`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
    });

    if (!response.ok) {
        throw new Error(`Failed to upload contacts: ${response.statusText}`);
    }

    return await response.json();
}

/**
 * Delete a contact from phonebook
 */
export async function deletePhonebookContact(
    apiKey: string,
    phonebookId: string,
    contactId: string
): Promise<TermiiApiResponse> {
    const response = await fetch(
        `${TERMII_BASE_URL}/api/phonebooks/${phonebookId}/contacts`,
        {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                api_key: apiKey,
                contact_id: contactId,
            }),
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to delete phonebook contact: ${response.statusText}`);
    }

    return await response.json();
}

/**
 * Check Termii account balance
 */
export async function checkBalance(apiKey: string): Promise<TermiiApiResponse> {
    const response = await fetch(`${TERMII_BASE_URL}/api/get-balance?api_key=${apiKey}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to check balance: ${response.statusText}`);
    }

    return await response.json();
}
