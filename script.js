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
        strategyForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const submitBtn = strategyForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            submitBtn.textContent = 'Submitting...';
            submitBtn.disabled = true;

            const formData = {
                fullName: document.getElementById('fullName')?.value,
                workEmail: document.getElementById('workEmail')?.value,
                companyName: document.getElementById('companyName')?.value,
                dealSize: document.getElementById('dealSize')?.value,
                targetClients: document.getElementById('targetClients')?.value,
                submittedAt: new Date().toISOString()
            };

            // Simulating API dispatch / ready for GHL webhook
            setTimeout(() => {
                if (modalContainer) {
                    modalContainer.innerHTML = `
                        <button class="modal-close" id="closeModalAfter" aria-label="Close modal">&times;</button>
                        <div style="text-align: center; padding: 24px 8px;">
                            <div style="width: 64px; height: 64px; border-radius: 50%; background: rgba(225, 29, 72, 0.15); border: 1px solid var(--accent-rose); color: var(--accent-rose); display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 1.8rem;">✓</div>
                            <h3 style="font-size: 1.7rem; font-weight: 800; margin-bottom: 12px; font-family: var(--font-display);">Consultation Request Received</h3>
                            <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.6; margin-bottom: 28px;">
                                Thank you, <strong>${formData.fullName || 'there'}</strong>. We will review your company profile and reach out directly at <strong>${formData.workEmail || 'your email'}</strong> within 24 hours to schedule your strategy call.
                            </p>
                            <button class="btn btn-secondary" id="finishCloseBtn" style="min-width: 160px;">Close Window</button>
                        </div>
                    `;

                    document.getElementById('closeModalAfter')?.addEventListener('click', closeModal);
                    document.getElementById('finishCloseBtn')?.addEventListener('click', closeModal);
                }
            }, 800);
        });
    }
});
