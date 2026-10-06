// ==========================================
// OCCASIA AGENCY - DYNAMIC POPUP & INTERACTIVE SCRIPT
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
    const openModalBtns = document.querySelectorAll('.trigger-modal');

    // Content Configurations for Relevant Popups
    const popupConfigs = {
        'VIP Executive Dinners': {
            badge: 'Sponsorship Allocation',
            title: 'Sponsor VIP Executive Dinners',
            subtitle: 'Gain keynote speaking time, host tickets, and direct introductions with 20 vetted founders and decision-makers.',
            formHTML: `
                <div class="form-group">
                    <label class="form-label">Full Name</label>
                    <input type="text" class="form-input" placeholder="e.g. Alexander Vance" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Work Email</label>
                    <input type="email" class="form-input" placeholder="alexander@company.com" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Phone Number</label>
                    <input type="tel" class="form-input" placeholder="+1 (514) 000-0000" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Company Name</label>
                    <input type="text" class="form-input" placeholder="e.g. EcomFlow SaaS" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Sponsorship Type</label>
                    <select class="form-select">
                        <option value="Title Sponsor">Title Sponsor ($5,000 CAD)</option>
                        <option value="Co-Host">Co-Host ($2,500 CAD)</option>
                    </select>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 10px;">Reserve Sponsorship</button>
            `
        },
        'Industry Mixers': {
            badge: 'Mixer Sponsorship Package',
            title: 'Request Mixer Package',
            subtitle: 'Complete the form below to receive our full sponsorship package deck for upcoming industry cocktail mixers ($500 - $2,000 CAD).',
            formHTML: `
                <div class="form-group">
                    <label class="form-label">Full Name</label>
                    <input type="text" class="form-input" placeholder="e.g. Marcus Chen" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Work Email</label>
                    <input type="email" class="form-input" placeholder="marcus@company.com" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Phone Number</label>
                    <input type="tel" class="form-input" placeholder="+1 (514) 000-0000" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Company Name</label>
                    <input type="text" class="form-input" placeholder="e.g. Apex Tech Agency" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Sponsorship Objectives & Notes</label>
                    <textarea class="form-textarea" rows="3" placeholder="Tell us about your brand visibility goals or target attendee profiles..."></textarea>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 10px;">Request Sponsorship Package</button>
            `
        },
        'Custom VIP Experiences': {
            badge: 'Strategy Consultation',
            title: 'Book Strategy Call',
            subtitle: 'Schedule a strategy call with our executive team to plan custom private events, yacht cruises, or executive retreats.',
            formHTML: `
                <div class="form-group">
                    <label class="form-label">Full Name & Title</label>
                    <input type="text" class="form-input" placeholder="e.g. Elena Rostova, VP Marketing" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Work Email</label>
                    <input type="email" class="form-input" placeholder="elena@enterprise.com" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Phone Number</label>
                    <input type="tel" class="form-input" placeholder="+1 (514) 000-0000" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Company Name</label>
                    <input type="text" class="form-input" placeholder="e.g. Enterprise Global" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Project Description</label>
                    <textarea class="form-textarea" rows="3" placeholder="Describe your custom event concept, target audience, or retreat goals..." required></textarea>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 10px;">Schedule Strategy Call</button>
            `
        },
        'Title Sponsorship ($5,000 CAD)': {
            badge: 'Title Sponsor Application',
            title: 'Apply For Title Sponsorship',
            subtitle: 'Secure exclusive category rights, 15-20 min keynote slot, and 4 leadership passes for $5,000 CAD.',
            formHTML: `
                <div class="form-group">
                    <label class="form-label">Full Name</label>
                    <input type="text" class="form-input" placeholder="e.g. David Sterling" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Work Email</label>
                    <input type="email" class="form-input" placeholder="david@sterling.com" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Phone Number</label>
                    <input type="tel" class="form-input" placeholder="+1 (514) 000-0000" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Company Name & Industry</label>
                    <input type="text" class="form-input" placeholder="e.g. Sterling Fintech Solutions" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Application Details</label>
                    <textarea class="form-textarea" rows="3" placeholder="Tell us about your company and key objectives for sponsoring..." required></textarea>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 10px;">Submit Title Application</button>
            `
        },
        'Co-Sponsorship ($2,500 CAD)': {
            badge: 'Co-Sponsor Application',
            title: 'Apply For Co-Sponsorship',
            subtitle: 'Receive opening remarks recognition, table collateral placement, and 2 host passes for $2,500 CAD.',
            formHTML: `
                <div class="form-group">
                    <label class="form-label">Full Name</label>
                    <input type="text" class="form-input" placeholder="e.g. Sarah Miller" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Work Email</label>
                    <input type="email" class="form-input" placeholder="sarah@saascompany.com" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Phone Number</label>
                    <input type="tel" class="form-input" placeholder="+1 (514) 000-0000" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Company Name</label>
                    <input type="text" class="form-input" placeholder="e.g. GrowthAnalytics Inc." required>
                </div>
                <div class="form-group">
                    <label class="form-label">Application Details</label>
                    <textarea class="form-textarea" rows="3" placeholder="Tell us about your team and goals for co-sponsoring..." required></textarea>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 10px;">Submit Co-Sponsor Application</button>
            `
        },
        'August E-Commerce Dinner': {
            badge: 'Montreal, QC | Late August 2026',
            title: 'Montreal E-Commerce Dinner Pass',
            subtitle: 'Request one of 20 guest seats at an exclusive private dining room gathering Montreal e-commerce CEOs and DTC leaders.',
            formHTML: `
                <div class="form-group">
                    <label class="form-label">Founder / CEO Name</label>
                    <input type="text" class="form-input" placeholder="e.g. Jordan Blake" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Work Email</label>
                    <input type="email" class="form-input" placeholder="jordan@brand.com" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Phone Number</label>
                    <input type="tel" class="form-input" placeholder="+1 (514) 000-0000" required>
                </div>
                <div class="form-group">
                    <label class="form-label">E-Commerce Related URL</label>
                    <input type="url" class="form-input" placeholder="https://yourbrand.com" required>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 10px;">Apply For Dinner Seat</button>
            `
        },
        'default': {
            badge: 'VIP Executive Access',
            title: 'Request Invitation',
            subtitle: 'Complete the form below to initiate partner vetting with our executive team.',
            formHTML: `
                <div class="form-group">
                    <label class="form-label">Full Name</label>
                    <input type="text" class="form-input" placeholder="e.g. Sarah Jenkins" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Work Email</label>
                    <input type="email" class="form-input" placeholder="sarah@company.com" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Phone Number</label>
                    <input type="tel" class="form-input" placeholder="+1 (514) 000-0000" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Company Name & Title</label>
                    <input type="text" class="form-input" placeholder="e.g. VP of Marketing, EcomSaaS" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Interest Type</label>
                    <select class="form-select">
                        <option value="Executive Dinner">Executive Dinner</option>
                        <option value="Industry Mixer">Industry Mixer</option>
                        <option value="Sponsorship">Sponsorship</option>
                        <option value="Custom Private Event">Custom Private Event</option>
                    </select>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 10px;">Submit Invitation Request</button>
            `
        }
    };

    // Open Modal Event Handler
    openModalBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const eventKey = btn.getAttribute('data-event') || 'default';
            const config = popupConfigs[eventKey] || popupConfigs['default'];

            if (modalContainer) {
                modalContainer.innerHTML = `
                    <button class="modal-close" id="closeModal" aria-label="Close modal">&times;</button>
                    <div class="badge"><span class="badge-dot"></span> ${config.badge}</div>
                    <h3 style="font-size: 1.8rem; font-weight: 800; margin-bottom: 8px; font-family: var(--font-display);">${config.title}</h3>
                    <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 24px; line-height: 1.5;">${config.subtitle}</p>
                    <form id="dynamicRsvpForm">
                        ${config.formHTML}
                    </form>
                `;

                // Re-bind Close Button
                const newCloseBtn = document.getElementById('closeModal');
                if (newCloseBtn) {
                    newCloseBtn.addEventListener('click', closeModal);
                }

                // Re-bind Form Submit
                const newForm = document.getElementById('dynamicRsvpForm');
                if (newForm) {
                    newForm.addEventListener('submit', handleFormSubmit);
                }
            }

            modalOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });

    function closeModal() {
        if (modalOverlay) {
            modalOverlay.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }

    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });
    }

    function handleFormSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        
        if (submitBtn) {
            submitBtn.textContent = 'Submitting...';
            submitBtn.disabled = true;
        }

        setTimeout(() => {
            form.innerHTML = `
                <div style="text-align: center; padding: 30px 10px;">
                    <div style="width: 60px; height: 60px; border-radius: 50%; background: rgba(225, 29, 72, 0.15); border: 1px solid var(--accent-rose); color: var(--accent-rose); display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 1.8rem;">✓</div>
                    <h3 style="font-size: 1.6rem; font-weight: 700; margin-bottom: 12px; font-family: var(--font-display);">Application Received</h3>
                    <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.6; margin-bottom: 24px;">Thank you! Our executive team will contact you directly via phone and email within 24 hours.</p>
                    <button class="btn btn-secondary" onclick="document.getElementById('rsvpModal').classList.remove('active'); document.body.style.overflow = 'auto';">Close Window</button>
                </div>
            `;
        }, 1000);
    }

    // Card Carousel Logic (Madhouse Party Slides 9-13)
    const carousels = document.querySelectorAll('.card-carousel-header');
    carousels.forEach(carousel => {
        const slides = carousel.querySelectorAll('.carousel-slide');
        const prevBtn = carousel.querySelector('.prev-btn');
        const nextBtn = carousel.querySelector('.next-btn');
        const indicators = carousel.querySelectorAll('.indicator');
        let currentIndex = 0;
        let autoInterval;

        function showSlide(index) {
            slides.forEach((slide, i) => {
                slide.classList.toggle('active', i === index);
            });
            indicators.forEach((ind, i) => {
                ind.classList.toggle('active', i === index);
            });
            currentIndex = index;
        }

        function nextSlide() {
            let nextIndex = (currentIndex + 1) % slides.length;
            showSlide(nextIndex);
        }

        function prevSlide() {
            let prevIndex = (currentIndex - 1 + slides.length) % slides.length;
            showSlide(prevIndex);
        }

        if (nextBtn) nextBtn.addEventListener('click', (e) => { e.preventDefault(); nextSlide(); resetAuto(); });
        if (prevBtn) prevBtn.addEventListener('click', (e) => { e.preventDefault(); prevSlide(); resetAuto(); });

        indicators.forEach(ind => {
            ind.addEventListener('click', (e) => {
                e.preventDefault();
                const index = parseInt(ind.getAttribute('data-slide'));
                showSlide(index);
                resetAuto();
            });
        });

        function startAuto() {
            autoInterval = setInterval(nextSlide, 4000);
        }

        function resetAuto() {
            clearInterval(autoInterval);
            startAuto();
        }

        startAuto();
    });

    // Smooth Scroll Offset Adjustment
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerOffset = 90;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
});
