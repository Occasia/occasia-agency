// ==========================================
// OCCASIA AGENCY - LEAD SUBMISSION HANDLER
// Serverless Function for Vercel / Node.js
// Upserts Contact + creates linked Opportunity in Notion
// ==========================================

const NOTION_VERSION = '2022-06-28';
const DEFAULT_OPPORTUNITIES_DB_ID = '41ccd2c2-707d-807f-a243-cbb21ddb7efe';
const DEFAULT_CONTACTS_DB_ID = '41dcd2c2-707d-80b3-a106-fb512300708e';
const DEFAULT_METRICS_ALL_TIME_ID = '0e4cd2c2-707d-823f-b9f2-01516c139832';

const DINNER_CRM_TARGETS = {
    tooly: {
        dinnerName: 'Tooly - Dîner exécutif Croissance & Opérations (21 janv. 2027)',
        sourceLabel: 'Tooly - Croissance & Opérations (2027-01-21)',
        masterContactsDbId: process.env.TOOLY_MASTER_CONTACTS_DB_ID || '41fcd2c2-707d-8166-9296-ffd1f7ab8eb0',
        dinnerDbId: process.env.TOOLY_DINNER_DB_ID || '421cd2c2-707d-8181-81f8-db21d0541961'
    }
};

function escapeHtml(raw) {
    return String(raw || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

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
        icon: { type: 'emoji', emoji: isDinner ? '🍽️' : '🔥' },
        properties: contactProps
    });
    return created.id;
}

async function upsertMasterContact({
    notionToken,
    masterContactsDbId,
    cleanName,
    cleanEmail,
    cleanRole,
    cleanCompany,
    cleanLinkedIn,
    cleanLanguage,
    sourceLabel,
    notesText,
    todayDate
}) {
    const existing = await notionFetch(`/databases/${masterContactsDbId}/query`, notionToken, 'POST', {
        filter: { property: 'Email', email: { equals: cleanEmail } },
        page_size: 1
    });

    if (existing.results && existing.results.length > 0) {
        const pageId = existing.results[0].id;
        const patchProps = {
            Status: { select: { name: 'In Active Campaign' } },
            Reason: { select: { name: 'Active Conversation' } },
            'Last Contact Date': { date: { start: todayDate } }
        };
        if (cleanLinkedIn) patchProps['LinkedIn URL'] = { url: cleanLinkedIn };
        await notionFetch(`/pages/${pageId}`, notionToken, 'PATCH', { properties: patchProps });
        return pageId;
    }

    const createProps = {
        Name: { title: buildRichText(cleanName) },
        Email: { email: cleanEmail },
        Status: { select: { name: 'In Active Campaign' } },
        Reason: { select: { name: 'Active Conversation' } },
        Language: { select: { name: cleanLanguage } },
        'Source Dinner': { rich_text: buildRichText(sourceLabel) },
        'Last Contact Date': { date: { start: todayDate } }
    };
    if (cleanRole) createProps.Role = { rich_text: buildRichText(cleanRole) };
    if (cleanCompany) createProps.Company = { rich_text: buildRichText(cleanCompany) };
    if (cleanLinkedIn) createProps['LinkedIn URL'] = { url: cleanLinkedIn };
    if (notesText) createProps.Notes = { rich_text: buildRichText(notesText) };

    const created = await notionFetch('/pages', notionToken, 'POST', {
        parent: { database_id: masterContactsDbId },
        properties: createProps
    });
    return created.id;
}

async function upsertDinnerLead({
    notionToken,
    dinnerConfig,
    cleanName,
    cleanEmail,
    cleanPhone,
    cleanRole,
    cleanCompany,
    cleanLinkedIn,
    cleanLanguage,
    cleanNotes,
    todayDate
}) {
    const noteSummary = [
        `Inbound invite request from ${dinnerConfig.sourceLabel}`,
        cleanPhone ? `Phone: ${cleanPhone}` : null,
        cleanNotes ? `Notes: ${cleanNotes}` : null
    ].filter(Boolean).join(' | ');
    let masterContactId = null;
    try {
        masterContactId = await upsertMasterContact({
            notionToken,
            masterContactsDbId: dinnerConfig.masterContactsDbId,
            cleanName,
            cleanEmail,
            cleanRole,
            cleanCompany,
            cleanLinkedIn,
            cleanLanguage,
            sourceLabel: dinnerConfig.sourceLabel,
            notesText: noteSummary,
            todayDate
        });
    } catch (masterErr) {
        console.error('Master Contacts upsert failed (continuing with dinner CRM):', masterErr.message);
    }

    const existing = await notionFetch(`/databases/${dinnerConfig.dinnerDbId}/query`, notionToken, 'POST', {
        filter: { property: 'Email', email: { equals: cleanEmail } },
        page_size: 1
    });

    const nextActionText = `Inbound invite request${cleanPhone ? ` (${cleanPhone})` : ''}: review ICP fit and call/reply`;
    const sharedProps = {
        'Status / Step': { select: { name: '2. In Conversation' } },
        'Reply Channel': { multi_select: [{ name: 'Email' }] },
        'Last Touch Date': { date: { start: todayDate } },
        'Next Action Date': { date: { start: todayDate } },
        'Next Action': { rich_text: buildRichText(nextActionText) }
    };
    if (cleanPhone) sharedProps['Research Note'] = { rich_text: buildRichText(`Téléphone : ${cleanPhone}`) };
    if (cleanLinkedIn) sharedProps.LinkedIn = { url: cleanLinkedIn };
    if (cleanNotes) sharedProps['Dietary Restrictions'] = { rich_text: buildRichText(cleanNotes) };
    if (masterContactId) sharedProps['Master Contact'] = { relation: [{ id: masterContactId }] };

    if (existing.results && existing.results.length > 0) {
        const pageId = existing.results[0].id;
        await notionFetch(`/pages/${pageId}`, notionToken, 'PATCH', { properties: sharedProps });
        return { pageId, masterContactId, updated: true };
    }

    const createProps = {
        Name: { title: buildRichText(cleanName) },
        Email: { email: cleanEmail },
        Language: { select: { name: cleanLanguage } },
        ...sharedProps
    };
    if (cleanRole) createProps.Role = { rich_text: buildRichText(cleanRole) };
    if (cleanCompany) createProps.Company = { rich_text: buildRichText(cleanCompany) };

    const created = await notionFetch('/pages', notionToken, 'POST', {
        parent: { database_id: dinnerConfig.dinnerDbId },
        properties: createProps
    });
    return { pageId: created.id, masterContactId, updated: false };
}

async function sendMailgunNotification({
    dinnerName,
    cleanName,
    cleanRole,
    cleanCompany,
    cleanEmail,
    cleanPhone,
    cleanLinkedIn,
    cleanLanguage,
    cleanNotes,
    pageId
}) {
    const apiKey = process.env.MAILGUN_API_KEY;
    const domain = process.env.MAILGUN_DOMAIN;
    if (!apiKey || !domain) {
        console.warn('Mailgun notification skipped: MAILGUN_API_KEY or MAILGUN_DOMAIN is not configured.');
        return { sent: false, reason: 'missing_env' };
    }

    const isEu = (process.env.MAILGUN_REGION || '').toLowerCase() === 'eu';
    const baseUrl = isEu ? 'https://api.eu.mailgun.net' : 'https://api.mailgun.net';
    const toEmail = process.env.NOTIFICATION_EMAIL || 'kevin@occasia.agency';
    const fromEmail = process.env.MAILGUN_FROM || `Occasia Dinners <noreply@${domain}>`;
    const notionUrl = pageId ? `https://www.notion.so/${pageId.replace(/-/g, '')}` : '';

    const subject = `Nouvelle demande d'invitation : ${cleanName}${cleanCompany ? ` (${cleanCompany})` : ''}`;
    const textLines = [
        `Dîner : ${dinnerName}`,
        `Statut CRM : 2. In Conversation`,
        '',
        `Nom : ${cleanName}`,
        `Titre : ${cleanRole || 'Non précisé'}`,
        `Entreprise : ${cleanCompany || 'Non précisée'}`,
        `Téléphone : ${cleanPhone || 'Non précisé'}`,
        `Courriel : ${cleanEmail}`,
        `Langue : ${cleanLanguage}`,
        cleanLinkedIn ? `LinkedIn : ${cleanLinkedIn}` : null,
        cleanNotes ? `Notes / Restrictions : ${cleanNotes}` : null,
        notionUrl ? `Fiche Notion : ${notionUrl}` : null
    ].filter(Boolean);

    const htmlBody = [
        `<p><strong>Nouvelle demande d'invitation reçue</strong> pour <strong>${escapeHtml(dinnerName)}</strong>.</p>`,
        `<p>Le contact a été ajouté/mis à jour dans Notion au statut <strong>2. In Conversation</strong>.</p>`,
        '<ul>',
        `<li><strong>Nom :</strong> ${escapeHtml(cleanName)}</li>`,
        `<li><strong>Titre :</strong> ${escapeHtml(cleanRole || 'Non précisé')}</li>`,
        `<li><strong>Entreprise :</strong> ${escapeHtml(cleanCompany || 'Non précisée')}</li>`,
        `<li><strong>Téléphone :</strong> ${cleanPhone ? `<a href="tel:${escapeHtml(cleanPhone)}">${escapeHtml(cleanPhone)}</a>` : 'Non précisé'}</li>`,
        `<li><strong>Courriel :</strong> <a href="mailto:${escapeHtml(cleanEmail)}">${escapeHtml(cleanEmail)}</a></li>`,
        `<li><strong>Langue :</strong> ${escapeHtml(cleanLanguage)}</li>`,
        cleanLinkedIn ? `<li><strong>LinkedIn :</strong> <a href="${escapeHtml(cleanLinkedIn)}">${escapeHtml(cleanLinkedIn)}</a></li>` : '',
        cleanNotes ? `<li><strong>Notes / Restrictions :</strong> ${escapeHtml(cleanNotes)}</li>` : '',
        '</ul>',
        notionUrl ? `<p><a href="${escapeHtml(notionUrl)}">Ouvrir la fiche dans Notion →</a></p>` : ''
    ].filter(Boolean).join('\n');

    const form = new URLSearchParams();
    form.set('from', fromEmail);
    form.set('to', toEmail);
    form.set('h:Reply-To', cleanEmail);
    form.set('subject', subject);
    form.set('text', textLines.join('\n'));
    form.set('html', htmlBody);

    const auth = Buffer.from(`api:${apiKey}`).toString('base64');
    const res = await fetch(`${baseUrl}/v3/${domain}/messages`, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: form.toString()
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Mailgun failed (${res.status}): ${errText}`);
    }
    return { sent: true };
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
            role,
            companyName,
            companyWebsite,
            linkedinUrl,
            language,
            dinnerTarget,
            dealSize,
            targetClients,
            type,
            notes,
            submittedAt
        } = body || {};

        const dinnerConfig = dinnerTarget ? DINNER_CRM_TARGETS[dinnerTarget] : null;
        if (dinnerTarget && !dinnerConfig) {
            return res.status(400).json({ error: 'Unknown dinner target.' });
        }

        if (dinnerConfig) {
            if (!fullName || !workEmail || !phone) {
                return res.status(400).json({
                    error: 'Missing required fields: fullName, workEmail, and phone are mandatory.'
                });
            }

            const cleanName = fullName.trim();
            const cleanEmail = workEmail.trim();
            const cleanPhone = phone.trim();
            const cleanRole = (role || '').trim();
            const cleanCompany = (companyName || '').trim();
            const cleanLinkedIn = normalizeUrl(linkedinUrl || companyWebsite);
            const cleanLanguage = String(language || '').toUpperCase() === 'EN' ? 'EN' : 'FR';
            const cleanNotes = (notes || '').trim();
            const timestamp = submittedAt || new Date().toISOString();
            const todayDate = timestamp.slice(0, 10);

            const crmResult = await upsertDinnerLead({
                notionToken,
                dinnerConfig,
                cleanName,
                cleanEmail,
                cleanPhone,
                cleanRole,
                cleanCompany,
                cleanLinkedIn,
                cleanLanguage,
                cleanNotes,
                todayDate
            });

            let mailResult = { sent: false };
            try {
                mailResult = await sendMailgunNotification({
                    dinnerName: dinnerConfig.dinnerName,
                    cleanName,
                    cleanRole,
                    cleanCompany,
                    cleanEmail,
                    cleanPhone,
                    cleanLinkedIn,
                    cleanLanguage,
                    cleanNotes,
                    pageId: crmResult.pageId
                });
            } catch (mailErr) {
                console.error('Mailgun notification failed (Notion lead saved):', mailErr.message);
                mailResult = { sent: false, error: mailErr.message };
            }

            return res.status(200).json({
                success: true,
                pageId: crmResult.pageId,
                masterContactId: crmResult.masterContactId,
                updated: crmResult.updated,
                notified: Boolean(mailResult.sent),
                message: 'Dinner invite request saved at stage 2. In Conversation'
            });
        }

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
            properties.Contacts = { relation: [{ id: contactPageId }] };
        }
        if (metricsAllTimeId) {
            properties['Metrics Period'] = { relation: [{ id: metricsAllTimeId }] };
        }

        const notionData = await notionFetch('/pages', notionToken, 'POST', {
            parent: { database_id: opportunitiesDbId },
            icon: { type: 'emoji', emoji: isDinner ? '🍽️' : '🔥' },
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
