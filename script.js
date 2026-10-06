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
                `• Deal Size / ACV: ${formData.dealSize || 'Not specified'}`,
                formData.notes ? `• Additional Notes: ${formData.notes}` : null,
                formData.targetClients ? `• Target Dream Clients: ${formData.targetClients}` : null,
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
            const originalText = submitBtn.textContent;

            const phoneInput = document.getElementById('phoneNumber');
            const phoneVal = phoneInput ? phoneInput.value.trim() : '';

            if (!phoneVal) {
                if (phoneInput) {
                    phoneInput.focus();
                    phoneInput.style.borderColor = 'var(--accent-rose)';
                }
                return;
            }

            submitBtn.textContent = 'Securing Your Spot...';
            submitBtn.disabled = true;

            const formData = {
                fullName: document.getElementById('fullName')?.value.trim() || '',
                workEmail: document.getElementById('workEmail')?.value.trim() || '',
                phone: phoneVal,
                companyName: document.getElementById('companyName')?.value.trim() || '',
                dealSize: document.getElementById('dealSize')?.value || '',
                targetClients: document.getElementById('targetClients')?.value.trim() || '',
                submittedAt: new Date().toISOString()
            };

            try {
                // First try serverless function /api/submit
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
                    // /api/submit not available on local static server, fallback to direct GHL
                }

                // If serverless endpoint wasn't reached, sync directly with GHL
                if (!submissionSuccessful) {
                    await submitToGHLDirectly(formData);
                }

                // Show confirmation screen
                if (modalContainer) {
                    modalContainer.innerHTML = `
                        <button class="modal-close" id="closeModalAfter" aria-label="Close modal">&times;</button>
                        <div style="text-align: center; padding: 24px 8px;">
                            <div style="width: 64px; height: 64px; border-radius: 50%; background: rgba(225, 29, 72, 0.15); border: 1px solid var(--accent-rose); color: var(--accent-rose); display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 1.8rem;">✓</div>
                            <h3 style="font-size: 1.7rem; font-weight: 800; margin-bottom: 12px; font-family: var(--font-display);">Consultation Request Received</h3>
                            <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.6; margin-bottom: 28px;">
                                Thank you, <strong>${formData.fullName || 'there'}</strong>. We have logged your request in our CRM and will reach out directly at <strong>${formData.workEmail}</strong> or <strong>${formData.phone}</strong> within 24 hours to schedule your strategy call.
                            </p>
                            <button class="btn btn-secondary" id="finishCloseBtn" style="min-width: 160px;">Close Window</button>
                        </div>
                    `;

                    document.getElementById('closeModalAfter')?.addEventListener('click', closeModal);
                    document.getElementById('finishCloseBtn')?.addEventListener('click', closeModal);
                }
            } catch (err) {
                console.error('Submission failed:', err);
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
                alert('We encountered an issue submitting your request. Please try again or reach out directly.');
            }
        });
    }

    // Dynamic Headline Sliding Mechanism (15 / Every Month -> 30 / Every Quarter)
    const numEl = document.querySelector('.hero-dyn-num');
    const periodEl = document.querySelector('.hero-dyn-period');

    if (numEl && periodEl) {
        const numTrack = numEl.querySelector('.dyn-track');
        const periodTrack = periodEl.querySelector('.dyn-track');
        const num15 = numEl.querySelector('.num-15');
        const num30 = numEl.querySelector('.num-30');
        const pMonth = periodEl.querySelector('.period-month');
        const pQuarter = periodEl.querySelector('.period-quarter');

        let isQuarter = false;

        function syncDimensionsAndPosition() {
            const targetNum = isQuarter ? num30 : num15;
            const targetPeriod = isQuarter ? pQuarter : pMonth;

            if (targetNum) {
                numEl.style.width = targetNum.offsetWidth + 'px';
            }
            if (targetPeriod) {
                periodEl.style.width = targetPeriod.offsetWidth + 'px';
            }

            const translateY = isQuarter ? '-50%' : '0%';
            if (numTrack) numTrack.style.transform = `translateY(${translateY})`;
            if (periodTrack) periodTrack.style.transform = `translateY(${translateY})`;
        }

        // Initialize once fonts are ready
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(syncDimensionsAndPosition);
        } else {
            setTimeout(syncDimensionsAndPosition, 50);
        }

        window.addEventListener('resize', syncDimensionsAndPosition);

        // Calm, unhurried cycle: 4.5 seconds on each value
        setInterval(() => {
            isQuarter = !isQuarter;
            syncDimensionsAndPosition();
        }, 4500);
    }
});
