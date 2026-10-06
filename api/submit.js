// ==========================================
// OCCASIA AGENCY - LEAD SUBMISSION HANDLER
// Serverless Function for Vercel / Node.js
// Integrates directly with GoHighLevel (Location: jHbmtYzLJIFF9GbAX6mz)
// ==========================================

const GHL_API_KEY = process.env.GHL_API_KEY || 'pit-e987338e-f698-4158-886a-49e83c50c78e';
const LOCATION_ID = process.env.GHL_LOCATION_ID || 'jHbmtYzLJIFF9GbAX6mz';

module.exports = async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        let body = req.body;
        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            } catch (e) {
                // Ignore parse error
            }
        }

        const { fullName, workEmail, phone, companyName, dealSize, targetClients } = body || {};

        if (!fullName || !workEmail || !phone) {
            return res.status(400).json({ 
                error: 'Missing required contact fields: fullName, workEmail, and phone are mandatory.' 
            });
        }

        // 1. Upsert contact in GoHighLevel
        const upsertResponse = await fetch('https://services.leadconnectorhq.com/contacts/upsert', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GHL_API_KEY}`,
                'Version': '2021-07-28',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                locationId: LOCATION_ID,
                name: fullName.trim(),
                email: workEmail.trim(),
                phone: phone.trim(),
                companyName: (companyName || '').trim(),
                tags: ['website-lead', 'executive-dinners'],
                source: 'occasia.agency website'
            })
        });

        const upsertData = await upsertResponse.json();
        const contactId = upsertData?.contact?.id;

        // 2. Attach strategy consultation note with deal details
        if (contactId) {
            const noteBody = [
                '🎯 NEW STRATEGY CONSULTATION REQUEST (occasia.agency):',
                `• Full Name: ${fullName}`,
                `• Work Email: ${workEmail}`,
                `• Direct Phone: ${phone}`,
                `• Company & Website: ${companyName || 'Not specified'}`,
                `• Deal Size / ACV: ${dealSize || 'Not specified'}`,
                `• Target Dream Clients: ${targetClients || 'Not specified'}`,
                `• Submitted At: ${new Date().toISOString()}`
            ].join('\n');

            await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/notes`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${GHL_API_KEY}`,
                    'Version': '2021-07-28',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ body: noteBody })
            });
        }

        return res.status(200).json({ 
            success: true, 
            contactId, 
            message: 'Lead successfully captured in Occasia CRM' 
        });
    } catch (error) {
        console.error('Server error submitting to GHL:', error);
        return res.status(500).json({ 
            error: 'Failed to process lead in CRM', 
            details: error.message 
        });
    }
};
