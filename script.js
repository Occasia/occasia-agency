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

            // Build pre-filled Cal.com fallback link
            const bookingParams = new URLSearchParams();
            if (formData.fullName) bookingParams.set('name', formData.fullName);
            if (formData.workEmail) bookingParams.set('email', formData.workEmail);

            const baseCalendarUrl = 'https://cal.com/kevin-leumassi/30min';
            const calendarUrl = bookingParams.toString()
                ? `${baseCalendarUrl}?${bookingParams.toString()}`
                : baseCalendarUrl;

            // Fire Notion CRM sync in background so the user sees the calendar immediately
            (async () => {
                try {
                    const apiRes = await fetch('/api/submit', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(formData)
                    });
                    if (!apiRes.ok) {
                        const errBody = await apiRes.text();
                        console.error('CRM sync failed:', apiRes.status, errBody);
                    }
                } catch (err) {
                    console.error('Background CRM sync failed:', err);
                }
            })();

            // Immediately show Kevin's live Cal.com booking widget inside the modal
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
                    <div style="width: 100%; min-height: 620px; max-height: 74vh; overflow-y: auto; border-radius: 12px; background: #FFFFFF; border: 1px solid var(--hair-strong, rgba(20,22,26,0.16));">
                        <div id="cal-inline-booking" style="width: 100%; min-height: 620px;"></div>
                    </div>
                `;

                (function (C, A, L) {
                    const p = function (a, ar) { a.q.push(ar); };
                    const d = C.document;
                    C.Cal = C.Cal || function () {
                        const cal = C.Cal;
                        const ar = arguments;
                        if (!cal.loaded) {
                            cal.ns = {};
                            cal.q = cal.q || [];
                            d.head.appendChild(d.createElement('script')).src = A;
                            cal.loaded = true;
                        }
                        if (ar[0] === L) {
                            const api = function () { p(api, arguments); };
                            const namespace = ar[1];
                            api.q = api.q || [];
                            if (typeof namespace === 'string') {
                                cal.ns[namespace] = cal.ns[namespace] || api;
                                p(cal.ns[namespace], ar);
                                p(cal, ['initNamespace', namespace]);
                            } else {
                                p(cal, ar);
                            }
                            return;
                        }
                        p(cal, ar);
                    };
                })(window, 'https://app.cal.com/embed/embed.js', 'init');

                const calConfig = { layout: 'month_view' };
                if (formData.fullName) calConfig.name = formData.fullName;
                if (formData.workEmail) calConfig.email = formData.workEmail;

                window.Cal('init', { origin: 'https://app.cal.com' });
                window.Cal('inline', {
                    elementOrSelector: '#cal-inline-booking',
                    calLink: 'kevin-leumassi/30min',
                    config: calConfig
                });
                window.Cal('ui', {
                    theme: 'light',
                    hideEventTypeDetails: false
                });

                document.getElementById('closeModalAfter')?.addEventListener('click', closeModal);
            } else {
                window.location.href = calendarUrl;
            }
        });
    }
});
