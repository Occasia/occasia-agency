// ==========================================
// OCCASIA AGENCY - CLIENT ACQUISITION SYSTEM
// Domain: occasia.agency
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // Navbar Scroll Effect
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Modal Elements
    const modalOverlay = document.getElementById('rsvpModal');
    const modalContainer = modalOverlay ? modalOverlay.querySelector('.modal-container') : null;
    const closeModalBtn = document.getElementById('closeModal');
    const openModalBtns = document.querySelectorAll('.trigger-modal');
    const strategyForm = document.getElementById('strategyForm');

    function openModal(e) {
        if (e) e.preventDefault();
        if (modalOverlay) {
            modalOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            const firstInput = modalOverlay.querySelector('input');
            if (firstInput) firstInput.focus();
        }
    }

    function closeModal() {
        if (modalOverlay) {
            modalOverlay.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }

    // Attach open modal to all trigger buttons
    openModalBtns.forEach(btn => {
        btn.addEventListener('click', openModal);
    });

    // Close button
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }

    // Backdrop click
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });
    }

    // Escape key closes modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalOverlay && modalOverlay.classList.contains('active')) {
            closeModal();
        }
    });

    // GoHighLevel Direct Configuration (fallback for static hosting / local testing)
    const GHL_FALLBACK_API_KEY = 'pit-e987338e-f698-4158-886a-49e83c50c78e';
    const GHL_LOCATION_ID = 'jHbmtYzLJIFF9GbAX6mz';

    async function submitToGHLDirectly(formData) {
        const isDinner = formData.type === 'dinner';
        const tags = isDinner 
            ? ['dinner-candidate', 'executive-dinner'] 
            : ['website-lead', 'executive-dinners'];

        if (formData.dealSize && formData.dealSize.trim()) {
            tags.push(formData.dealSize.trim());
        }

        // Upsert contact in GoHighLevel
        const upsertRes = await fetch('https://services.leadconnectorhq.com/contacts/upsert', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GHL_FALLBACK_API_KEY}`,
                'Version': '2021-07-28',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                locationId: GHL_LOCATION_ID,
                name: formData.fullName,
                email: formData.workEmail,
                phone: formData.phone,
                companyName: formData.companyName || '',
                website: formData.companyWebsite || undefined,
                tags: tags,
                source: isDinner ? 'occasia.agency next dinner RSVP' : 'occasia.agency website'
            })
        });

        const upsertData = await upsertRes.json();
        const contactId = upsertData?.contact?.id;

        // Attach consultation notes
        if (contactId) {
            const noteHeading = isDinner 
                ? '🍷 NEW DINNER INVITATION REQUEST (occasia.agency/dinner):' 
                : '🎯 NEW STRATEGY CONSULTATION REQUEST (occasia.agency):';

            const noteBody = [
                noteHeading,
                `• Full Name: ${formData.fullName}`,
                `• Work Email: ${formData.workEmail}`,
                `• Direct Phone: ${formData.phone}`,
                `• Company Name: ${formData.companyName || 'Not specified'}`,
                formData.companyWebsite ? `• Company Website: ${formData.companyWebsite}` : null,
                `• Deal Size / ACV: ${formData.dealSize || 'Not specified'}`,
                formData.notes ? `• Additional Notes: ${formData.notes}` : null,
                `• Submitted At: ${formData.submittedAt}`
            ].filter(Boolean).join('\n');

            await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/notes`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${GHL_FALLBACK_API_KEY}`,
                    'Version': '2021-07-28',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ body: noteBody })
            });
        }

        return contactId;
    }

    // Strategy Form Submission Handler
    if (strategyForm) {
        strategyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = strategyForm.querySelector('button[type="submit"]');

            const phoneInput = document.getElementById('phoneNumber');
            const phoneVal = phoneInput ? phoneInput.value.trim() : '';

            if (!phoneVal) {
                if (phoneInput) {
                    phoneInput.focus();
                    phoneInput.style.borderColor = 'var(--accent-rose)';
                }
                return;
            }

            if (submitBtn) {
                submitBtn.textContent = 'Loading Calendar...';
                submitBtn.disabled = true;
            }

            const formData = {
                fullName: document.getElementById('fullName')?.value.trim() || '',
                workEmail: document.getElementById('workEmail')?.value.trim() || '',
                phone: phoneVal,
                companyName: document.getElementById('companyName')?.value.trim() || '',
                companyWebsite: document.getElementById('companyWebsite')?.value.trim() || '',
                dealSize: document.getElementById('dealSize')?.value || '',
                submittedAt: new Date().toISOString()
            };

            // Build pre-filled LeadConnector booking URL
            const nameParts = formData.fullName.split(/\s+/);
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';
            const bookingParams = new URLSearchParams();
            if (formData.fullName) bookingParams.set('name', formData.fullName);
            if (firstName) bookingParams.set('first_name', firstName);
            if (lastName) bookingParams.set('last_name', lastName);
            if (formData.workEmail) bookingParams.set('email', formData.workEmail);
            if (formData.phone) bookingParams.set('phone', formData.phone);

            const baseCalendarUrl = 'https://api.leadconnectorhq.com/widget/bookings/kevinleumassi';
            const calendarUrl = bookingParams.toString()
                ? `${baseCalendarUrl}?${bookingParams.toString()}`
                : baseCalendarUrl;

            // Fire CRM sync in background so the user sees the calendar immediately
            (async () => {
                try {
                    let submissionSuccessful = false;
                    try {
                        const apiRes = await fetch('/api/submit', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(formData)
                        });
                        if (apiRes.ok) {
                            submissionSuccessful = true;
                        }
                    } catch (apiErr) {
                        // /api/submit not available on static server, fallback to direct GHL
                    }

                    if (!submissionSuccessful) {
                        await submitToGHLDirectly(formData);
                    }
                } catch (err) {
                    console.error('Background CRM sync failed:', err);
                }
            })();

            // Immediately show Kevin's live booking calendar inside the modal
            if (modalContainer) {
                modalContainer.style.width = 'min(880px, 100%)';
                modalContainer.style.padding = 'clamp(20px, 3vw, 32px)';
                modalContainer.innerHTML = `
                    <button type="button" class="modal-close" id="closeModalAfter" aria-label="Close modal">✕</button>
                    <div style="display: flex; align-items: baseline; justify-content: space-between; flex-wrap: wrap; gap: 12px; padding-right: 44px; margin-bottom: 16px;">
                        <div>
                            <span class="sec-eyebrow" style="margin-bottom: 4px;">Step 2 of 2 · Select a Time</span>
                            <h2 class="modal-title" style="font-size: 30px; margin-bottom: 0;">Book Your Strategy Call</h2>
                        </div>
                        <a href="${calendarUrl}" target="_blank" rel="noopener noreferrer" style="font-family: var(--f-mono, monospace); font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--crimson, #E11D48); text-decoration: underline;">
                            Open in new tab ↗
                        </a>
                    </div>
                    <div style="width: 100%; min-height: 660px; border-radius: 12px; overflow: hidden; background: #FFFFFF; border: 1px solid var(--hair-strong, rgba(20,22,26,0.16));">
                        <iframe
                            src="${calendarUrl}"
                            style="width: 100%; min-height: 660px; height: 72vh; border: none; display: block;"
                            scrolling="yes"
                            id="kevinleumassi_calendar_iframe"
                            title="Book a Strategy Call with Kevin Leumassi"
                        ></iframe>
                    </div>
                `;

                if (!document.querySelector('script[src="https://link.msgsndr.com/js/form_embed.js"]')) {
                    const embedScript = document.createElement('script');
                    embedScript.src = 'https://link.msgsndr.com/js/form_embed.js';
                    embedScript.type = 'text/javascript';
                    document.body.appendChild(embedScript);
                }

                document.getElementById('closeModalAfter')?.addEventListener('click', closeModal);
            } else {
                window.location.href = calendarUrl;
            }
        });
    }
});
