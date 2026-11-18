// ==========================================
// OCCASIA AGENCY - LEAD SUBMISSION HANDLER
// Serverless Function for Vercel / Node.js
// Upserts Contact + creates linked Opportunity in Notion
// ==========================================

const NOTION_VERSION = '2022-06-28';
const DEFAULT_OPPORTUNITIES_DB_ID = '41ccd2c2-707d-807f-a243-cbb21ddb7efe';
const DEFAULT_CONTACTS_DB_ID = '41ccd2c2-707d-8174-ad6d-d22588a39e36';
const DEFAULT_METRICS_ALL_TIME_ID = '41ccd2c2-707d-819d-92e1-f0a2d48d07ba';

function normalizeUrl(raw) {
    if (!raw || typeof raw !== 'string') return null;
    const trimmed = raw.trim();
    if (!trimmed) return null;
    const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    try {
        const parsed = new URL(candidate);
        return parsed.href;
    } catch {
        return null;
    }
}

function buildRichText(content) {
    return [{ type: 'text', text: { content: String(content).slice(0, 2000) } }];
}

async function notionFetch(path, token, method = 'GET', body = null) {
    const res = await fetch(`https://api.notion.com/v1${path}`, {
        method,
        headers: {
            Authorization: `Bearer ${token}`,
            'Notion-Version': NOTION_VERSION,
            'Content-Type': 'application/json'
        },
        body: body ? JSON.stringify(body) : undefined
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error(`Notion ${method} ${path} failed (${res.status}): ${data.message || 'Unknown error'}`);
    }
    return data;
}

async function upsertNotionContact({
    notionToken,
    contactsDbId,
    metricsAllTimeId,
    cleanName,
    cleanEmail,
    cleanPhone,
    cleanCompany,
    cleanWebsite,
    isDinner,
    tags,
    timestamp
}) {
    if (!contactsDbId) return null;

    const existing = await notionFetch(`/databases/${contactsDbId}/query`, notionToken, 'POST', {
        filter: { property: 'Email', email: { equals: cleanEmail } },
        page_size: 1
    });

    if (existing.results && existing.results.length > 0) {
        return existing.results[0].id;
    }

    const contactProps = {
        Name: { title: buildRichText(cleanName) },
        Email: { email: cleanEmail },
        Phone: { phone_number: cleanPhone },
        'Relationship Tier': { select: { name: isDinner ? 'Dinner Candidate' : 'Warm Lead' } },
        Source: { select: { name: isDinner ? 'Dinner RSVP' : 'Website Form' } },
        Tags: { multi_select: tags.map((name) => ({ name })) },
        'Date Added': { date: { start: timestamp.slice(0, 10) } }
    };

    if (cleanCompany) {
        contactProps.Company = { rich_text: buildRichText(cleanCompany) };
    }
    if (cleanWebsite) {
        if (cleanWebsite.toLowerCase().includes('linkedin.com')) {
            contactProps.LinkedIn = { url: cleanWebsite };
        } else {
            contactProps.Website = { url: cleanWebsite };
        }
    }
    if (metricsAllTimeId) {
        contactProps['Metrics Period'] = { relation: [{ id: metricsAllTimeId }] };
    }

    const created = await notionFetch('/pages', notionToken, 'POST', {
        parent: { database_id: contactsDbId },
        properties: contactProps
    });
    return created.id;
}

module.exports = async function handler(req, res) {
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

    const notionToken = process.env.NOTION_API_KEY;
    const opportunitiesDbId = process.env.NOTION_OPPORTUNITIES_DB_ID || DEFAULT_OPPORTUNITIES_DB_ID;
    const contactsDbId = process.env.NOTION_CONTACTS_DB_ID || DEFAULT_CONTACTS_DB_ID;
    const metricsAllTimeId = process.env.NOTION_METRICS_ALLTIME_PAGE_ID || DEFAULT_METRICS_ALL_TIME_ID;

    if (!notionToken) {
        console.error('Missing NOTION_API_KEY environment variable');
        return res.status(500).json({ error: 'Server configuration error: NOTION_API_KEY is not set.' });
    }

    try {
        let body = req.body;
        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            } catch {
                return res.status(400).json({ error: 'Invalid JSON request body.' });
            }
        }

        const {
            fullName,
            workEmail,
            phone,
            companyName,
            companyWebsite,
            dealSize,
            targetClients,
            type,
            notes,
            submittedAt
        } = body || {};

        if (!fullName || !workEmail || !phone) {
            return res.status(400).json({
                error: 'Missing required contact fields: fullName, workEmail, and phone are mandatory.'
            });
        }

        const cleanName = fullName.trim();
        const cleanEmail = workEmail.trim();
        const cleanPhone = phone.trim();
        const cleanCompany = (companyName || '').trim();
        const cleanDealSize = (dealSize || '').trim();
        const cleanWebsite = normalizeUrl(companyWebsite);
        const isDinner = type === 'dinner';
        const timestamp = submittedAt || new Date().toISOString();

        const tags = isDinner
            ? ['dinner-candidate', 'executive-dinner']
            : ['website-lead', 'executive-dinners'];
        if (cleanDealSize) {
            tags.push(cleanDealSize.replace(/,/g, ''));
        }

        let contactPageId = null;
        try {
            contactPageId = await upsertNotionContact({
                notionToken,
                contactsDbId,
                metricsAllTimeId,
                cleanName,
                cleanEmail,
                cleanPhone,
                cleanCompany,
                cleanWebsite,
                isDinner,
                tags,
                timestamp
            });
        } catch (contactErr) {
            console.error('Contact upsert failed (continuing with opportunity):', contactErr.message);
        }

        const opportunityTitle = cleanCompany
            ? `${cleanCompany} — ${isDinner ? 'Dinner RSVP' : 'Strategy Call'}`
            : `${cleanName} — ${isDinner ? 'Dinner RSVP' : 'Strategy Call'}`;

        const summaryLines = [
            isDinner
                ? 'NEW DINNER INVITATION REQUEST (occasia.agency/dinner)'
                : 'NEW STRATEGY CONSULTATION REQUEST (occasia.agency)',
            `• Full Name: ${cleanName}`,
            `• Work Email: ${cleanEmail}`,
            `• Direct Phone: ${cleanPhone}`,
            `• Company Name: ${cleanCompany || 'Not specified'}`,
            cleanWebsite ? `• Company Website: ${cleanWebsite}` : null,
            `• Deal Size / ACV: ${cleanDealSize || 'Not specified'}`,
            isDinner && notes ? `• Additional Notes / Dietary: ${notes.trim()}` : null,
            !isDinner && targetClients ? `• Target Dream Clients: ${targetClients.trim()}` : null,
            !isDinner && notes ? `• Additional Notes: ${notes.trim()}` : null,
            `• Submitted At: ${timestamp}`
        ].filter(Boolean);

        const properties = {
            Opportunity: { title: buildRichText(opportunityTitle) },
            Stage: { select: { name: 'Qualified lead' } },
            Status: { select: { name: 'Open' } },
            Probability: { number: 0.1429 },
            Source: { select: { name: isDinner ? 'Dinner RSVP' : 'Website Form' } },
            'Contact Name': { rich_text: buildRichText(cleanName) },
            Email: { email: cleanEmail },
            Phone: { phone_number: cleanPhone },
            Tags: { multi_select: tags.map((name) => ({ name })) },
            Notes: { rich_text: buildRichText(summaryLines.join('\n')) },
            'Next Action': {
                rich_text: buildRichText(
                    isDinner
                        ? 'Review dinner fit & confirm seat within 24h'
                        : 'Confirm Cal.com booking & prep sample guest list'
                )
            },
            'Created Date': { date: { start: timestamp.slice(0, 10) } }
        };

        if (cleanCompany) {
            properties.Company = { rich_text: buildRichText(cleanCompany) };
        }
        if (cleanWebsite) {
            properties.Website = { url: cleanWebsite };
        }
        if (cleanDealSize) {
            properties['Deal Size / ACV'] = { rich_text: buildRichText(cleanDealSize) };
        }
        if (contactPageId) {
            properties.Contact = { relation: [{ id: contactPageId }] };
        }
        if (metricsAllTimeId) {
            properties['Metrics Period'] = { relation: [{ id: metricsAllTimeId }] };
        }

        const notionData = await notionFetch('/pages', notionToken, 'POST', {
            parent: { database_id: opportunitiesDbId },
            properties,
            children: summaryLines.map((line) => ({
                object: 'block',
                type: 'paragraph',
                paragraph: { rich_text: buildRichText(line) }
            }))
        });

        return res.status(200).json({
            success: true,
            pageId: notionData.id,
            contactPageId,
            message: 'Lead successfully captured in Occasia Notion Pipeline'
        });
    } catch (error) {
        console.error('Server error submitting to Notion:', error);
        return res.status(500).json({
            error: 'Failed to process lead in CRM',
            details: error.message
        });
    }
};
