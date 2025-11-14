// --- GLOBAL STATE & ELEMENTS ---
let adminLoggedIn = false;
let userLoggedIn = false;
let currentUser = null;
let users = {}; // Users will be stored with email as the key
let pageHistory = [];
let chartInstances = {}; // Initialize chart instances object

// Notification system - Available globally
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1edff'};
        color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 500;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// --- SAMPLE DATA ---
let testimonials = [
    {
        id: 1,
        name: "Sarah Johnson",
        email: "sarah@example.com",
        rating: 5,
        message: "Sparkling Windows transformed our home! The team was professional, punctual, and the results were incredible. Our windows haven't looked this good in years!",
        date: "2024-01-20",
        status: "approved"
    },
    {
        id: 2,
        name: "Michael Chen",
        email: "michael@example.com",
        rating: 5,
        message: "Outstanding service! They cleaned our office building's windows to perfection. Highly recommend for any commercial property.",
        date: "2024-01-18",
        status: "approved"
    },
    {
        id: 3,
        name: "Emma Davis",
        email: "emma@example.com",
        rating: 4,
        message: "Great service and very reasonable prices. The team was friendly and did a thorough job.",
        date: "2024-01-15",
        status: "pending"
    }
];

let inquiries = [
    {
        id: 1,
        name: "John Smith",
        email: "john@example.com",
        phone: "+44 123 456 7890",
        type: "Quote Request",
        message: "I need a quote for cleaning 20 windows in my house.",
        date: "2024-01-25",
        status: "new"
    },
    {
        id: 2,
        name: "Lisa Brown",
        email: "lisa@example.com",
        phone: "+44 987 654 3210",
        type: "General Inquiry",
        message: "Do you offer gutter cleaning services as well?",
        date: "2024-01-24",
        status: "read"
    }
];

let bookings = [
    {
        id: 1,
        clientName: "John Doe",
        clientEmail: "john@example.com",
        service: "Residential Cleaning",
        windows: 10,
        date: "2024-01-25",
        time: "10:00",
        status: "pending",
        notes: "Pre-existing booking for demo."
    },
    {
        id: 2,
        clientName: "Jane Smith",
        clientEmail: "jane@example.com",
        service: "Commercial Cleaning",
        windows: 50,
        date: "2024-01-28",
        time: "14:00",
        status: "confirmed",
        notes: "Office building cleaning"
    }
];

// --- LOCALSTORAGE HELPER FUNCTIONS ---
function saveUsersToStorage() { localStorage.setItem('sparklingUsersDB', JSON.stringify(users)); }
function saveSessionToStorage(user) { localStorage.setItem('sparklingCurrentUser', JSON.stringify(user)); }
function clearSessionFromStorage() { localStorage.removeItem('sparklingCurrentUser'); }
function loadStateFromStorage() {
    const savedUsers = localStorage.getItem('sparklingUsersDB');
    if (savedUsers) {
        users = JSON.parse(savedUsers);
    } else {
        // Updated default user with new structure (email as key)
        users = {
            'user@example.com': {
                password: 'user123',
                fullName: 'John Doe',
                bookings: [{
                    service: 'Residential Cleaning',
                    windows: 10,
                    date: '2024-11-15',
                    time: '10:00',
                    notes: 'Pre-existing booking for demo.'
                }]
            }
        };
        saveUsersToStorage();
    }
    const savedCurrentUser = localStorage.getItem('sparklingCurrentUser');
    if (savedCurrentUser) {
        currentUser = JSON.parse(savedCurrentUser);
        userLoggedIn = true;
    }
}


// emailjs use this section

document.getElementById('contact-form').addEventListener('submit', function(e) {
    e.preventDefault();

    emailjs.sendForm('service_cq1bb0d', 'template_lkmz24l', this)
      .then(() => {
        document.getElementById('result').innerText = "Message sent successfully!";
        this.reset();
      }, (error) => {
        document.getElementById('result').innerText = "Failed to send. Try again.";
        console.error('EmailJS Error:', error);
      });
});

// end emailjs section



document.addEventListener('DOMContentLoaded', () => {
    loadStateFromStorage();

    // --- Core Single Page Application (SPA) Navigation ---
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');
    const mainNav = document.querySelector('.main-nav');
    const backButton = document.getElementById('back-button');

    function showPage(pageId, isBackAction = false) {
        const currentPage = document.querySelector('.page.active');
        if (!isBackAction && currentPage && currentPage.id !== pageId) {
            pageHistory.push(currentPage.id);
        }
        backButton.style.display = pageHistory.length > 0 ? 'block' : 'none';

        pages.forEach(page => page.classList.remove('active'));
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
            if (pageId === 'profile' && userLoggedIn) renderProfilePage();
        }
        document.querySelectorAll('.main-nav a').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + pageId) link.classList.add('active');
        });
        AOS.refresh();
        window.scrollTo(0, 0);
        if (pageId === 'contact' && typeof initMap === 'function') setTimeout(() => initMap(), 100);
    }
    
    // Admin Navigation Handler
    const adminNavLink = document.querySelector('.main-nav a[href="#admin"]');
    const adminLoginModal = document.getElementById('admin-login-modal');
    const footerAdminCta = document.getElementById('footer-admin-cta');
    
    function handleAdminEntry(e) {
        e.preventDefault();
        if (!adminLoggedIn) {
            adminLoginModal.classList.add('active');
        } else {
            showPage('admin');
            mainNav.classList.remove('active');
        }
    }

    if (adminNavLink) {
    adminNavLink.addEventListener('click', (e) => {
            handleAdminEntry(e);
        });
    }

    if (footerAdminCta) {
        footerAdminCta.addEventListener('click', handleAdminEntry);
    }

    // User Action Links Handler (Book Now, Profile)
    const userActionLinks = document.querySelectorAll('.user-action-link');
    
    userActionLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const href = link.getAttribute('href');
            const pageId = href.substring(1);
            
            if (pageId === 'booking' || pageId === 'profile') {
                if (!userLoggedIn) {
                    // Store the intended page for redirect after login
                    sessionStorage.setItem('intendedPage', pageId);
                    showNotification('Please log in to access this feature', 'error');
                    document.getElementById('user-login-modal').classList.add('active');
                    return;
                }
            }
            
            showPage(pageId);
            mainNav.classList.remove('active');
        });
    });

    // Regular Navigation Links Handler
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        // Skip admin and user-action links as they have their own handlers
        if (href === '#admin' || link.classList.contains('user-action-link')) return;
        
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = link.getAttribute('href').substring(1);
            showPage(pageId);
            mainNav.classList.remove('active');
        });
    });
    
    backButton.addEventListener('click', () => {
        if (pageHistory.length > 0) {
            const lastPageId = pageHistory.pop();
            showPage(lastPageId, true);
        }
    });
    
    AOS.init({ duration: 800, once: true, offset: 50 });

    const header = document.querySelector('.main-header');
    const mobileToggle = document.querySelector('.mobile-nav-toggle[aria-label="Toggle navigation"]'); 
    window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 50));
    mobileToggle.addEventListener('click', () => mainNav.classList.toggle('active'));

    // --- All other feature initializations (GSAP, Forms, etc.) ---
    if (document.querySelector('.hero')) {
        gsap.registerPlugin(ScrollTrigger);
        const dropletContainer = document.querySelector('.water-droplets');
        for(let i = 0; i < 20; i++) {
            let droplet = document.createElement('div');
            droplet.classList.add('droplet');
            gsap.set(droplet, { x: gsap.utils.random(0, window.innerWidth), y: gsap.utils.random(-200, -100), scale: gsap.utils.random(0.5, 1.2) });
            dropletContainer.appendChild(droplet);
        }
        gsap.to('.droplet', { y: (i, target) => window.innerHeight + 300, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1.5 } });
    }
    
    document.querySelectorAll('.service-card').forEach(card => {
        card.addEventListener('mouseenter', function (e) {
            const ripple = this.querySelector('.ripple-effect');
            if(!ripple) return;
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            ripple.style.left = `${x}px`; ripple.style.top = `${y}px`;
            const newRipple = ripple.cloneNode(true);
            ripple.parentNode.replaceChild(newRipple, ripple);
        });
    });
    
    document.querySelectorAll('.team-member-card').forEach(card => {
        const cardInner = card.querySelector('.team-member-card-inner');
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left, y = e.clientY - rect.top;
            const { width, height } = rect;
            const rotateX = (y / height - 0.5) * -20;
            const rotateY = (x / width - 0.5) * 20;
            gsap.to(cardInner, { rotationX: rotateX, rotationY: rotateY, scale: 1.05, ease: "power1.out", duration: 0.5 });
        });
        card.addEventListener('mouseleave', () => {
            gsap.to(cardInner, { rotationX: 0, rotationY: 0, scale: 1, ease: "power1.out", duration: 0.5 });
        });
    });

    // Before/After Slider
    const beforeAfterSlider = document.querySelector('.ba-slider');
    if (beforeAfterSlider) {
        const resizeElement = beforeAfterSlider.querySelector('.ba-resize');
        const handle = beforeAfterSlider.querySelector('.ba-handle');
        let isDragging = false;
        
        const startDrag = () => { isDragging = true; };
        const stopDrag = () => { isDragging = false; };
        const onDrag = (e) => {
            if (!isDragging) return;
            const rect = beforeAfterSlider.getBoundingClientRect();
            const x = (e.clientX || e.touches[0].clientX) - rect.left;
            const newWidthPercent = Math.max(0, Math.min(100, (x / rect.width) * 100));
            resizeElement.style.width = `${newWidthPercent}%`;
            handle.style.left = `${newWidthPercent}%`;
        };
        handle.addEventListener('mousedown', startDrag); 
        handle.addEventListener('touchstart', startDrag);
        window.addEventListener('mouseup', stopDrag); 
        window.addEventListener('touchend', stopDrag);
        window.addEventListener('mousemove', onDrag); 
        window.addEventListener('touchmove', onDrag);
    }
    
    Fancybox.bind("[data-fancybox]", {});
    
    // Enhanced Booking Form with User Authentication
    const bookingForm = document.getElementById('booking-form');
    
    if(bookingForm) {
        const steps = Array.from(bookingForm.querySelectorAll('.form-step'));
        let currentStep = 1;
        
        const changeStep = (stepNumber) => {
            const currentStepEl = bookingForm.querySelector(`.form-step[data-step="${currentStep}"]`);
            const nextStepEl = bookingForm.querySelector(`.form-step[data-step="${stepNumber}"]`);
            if (currentStepEl && nextStepEl) {
                currentStepEl.classList.add('exiting');
                currentStepEl.addEventListener('transitionend', () => {
                    currentStepEl.classList.remove('active', 'exiting');
                    nextStepEl.classList.add('active');
                    currentStep = stepNumber;
                }, { once: true });
            }
        };
        
        bookingForm.addEventListener('click', (e) => {
            if (e.target.matches('.next-step')) { 
                // Check if user is logged in before proceeding to step 3
                if (currentStep === 2 && !userLoggedIn) {
                    // Store that we want to continue with booking after login
                    sessionStorage.setItem('intendedPage', 'booking');
                    showNotification('Please log in to complete your booking', 'error');
                    document.getElementById('user-login-modal').classList.add('active');
                    return;
                }
                changeStep(currentStep + 1); 
            }
            if (e.target.matches('.prev-step')) { 
                changeStep(currentStep - 1); 
            }
        });
        
        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Check if user is logged in
            if (!userLoggedIn) {
                showNotification('Please log in to complete your booking', 'error');
                document.getElementById('user-login-modal').classList.add('active');
                return;
            }
            
            try {
                // Call backend API for booking
                const response = await fetch('http://localhost:3000/api/booking', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: document.getElementById('booking-name').value,
                        email: document.getElementById('booking-email').value,
                        phone: document.getElementById('booking-phone').value,
                        movie: document.getElementById('booking-service').value,
                        date: document.getElementById('booking-date').value,
                        seat: document.getElementById('booking-windows').value,
                        address: document.getElementById('booking-address').value,
                        notes: document.getElementById('booking-notes').value
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // Create new booking for local storage
                    const newBooking = {
                        id: Date.now(),
                        clientName: document.getElementById('booking-name').value,
                        clientEmail: document.getElementById('booking-email').value,
                        clientPhone: document.getElementById('booking-phone').value,
                        service: document.getElementById('booking-service').value,
                        windows: parseInt(document.getElementById('booking-windows').value),
                        date: document.getElementById('booking-date').value,
                        time: document.getElementById('booking-time').value,
                        address: document.getElementById('booking-address').value,
                        notes: document.getElementById('booking-notes').value,
                        status: 'pending',
                        createdAt: new Date().toISOString()
                    };
                    
                    // Add to global bookings array
                    bookings.push(newBooking);
                    
                    // Add to user's bookings if user is logged in
                    if (currentUser && users[currentUser.email]) {
                        if (!users[currentUser.email].bookings) {
                            users[currentUser.email].bookings = [];
                        }
                        users[currentUser.email].bookings.push(newBooking);
                        saveUsersToStorage();
                    }
                    
                    // Show success animation
                    changeStep(steps.length);
                    const container = bookingForm.querySelector('.sparkle-container');
                    if(container){
                        container.innerHTML = '';
                        for (let i = 0; i < 30; i++) {
                            const sparkle = document.createElement('div');
                            sparkle.className = 'sparkle';
                            sparkle.style.left = `${Math.random() * 100}%`;
                            sparkle.style.top = `${Math.random() * 100}%`;
                            sparkle.style.animationDelay = `${Math.random() * 0.5}s`;
                            container.appendChild(sparkle);
                        }
                    }
                    
                    // Show success notification
                    showNotification('Booking submitted successfully!', 'success');
                    
                    // Reset form after 3 seconds
                    setTimeout(() => {
                        bookingForm.reset();
                        changeStep(1);
                    }, 3000);
                } else {
                    showNotification(data.message || 'Booking failed', 'error');
                }
            } catch (error) {
                console.error('Booking error:', error);
                showNotification('Network error. Please try again.', 'error');
            }
        });
    } else {
        console.error('Booking form not found!');
    }
    
    // Enhanced Contact Form
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Create new inquiry
            const newInquiry = {
                id: Date.now(),
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                type: document.getElementById('inquiry-type').value,
                message: document.getElementById('message').value,
                date: new Date().toISOString().split('T')[0],
                status: 'new'
            };
            
            // Add to inquiries array
            inquiries.push(newInquiry);
            
            const successMsg = document.getElementById('form-success-msg');
            contactForm.classList.add('sending');
            
            setTimeout(() => {
                contactForm.reset();
                contactForm.classList.remove('sending');
                successMsg.style.opacity = '1';
                showNotification('Message sent successfully!', 'success');
                setTimeout(() => { successMsg.style.opacity = '0'; }, 3000);
            }, 800);
        });
    }
    
    // Enhanced Admin Dashboard Functionality
    const adminSidebar = document.querySelector('.admin-sidebar');
    
    if (adminSidebar) {
        const toggleBtn = adminSidebar.querySelector('.sidebar-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => { 
                adminSidebar.classList.toggle('collapsed'); 
            });
        }
        
        // Admin Navigation
        const adminNavLinks = document.querySelectorAll('.admin-nav-link');
        const adminSections = document.querySelectorAll('.admin-section');
        const adminSectionTitle = document.getElementById('admin-section-title');
        
        adminNavLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetSection = link.getAttribute('data-section');
                
                // Update active states
                adminNavLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                adminSections.forEach(section => section.classList.remove('active'));
                const targetSectionEl = document.getElementById(`${targetSection}-section`);
                if (targetSectionEl) {
                    targetSectionEl.classList.add('active');
                }
                
                // Update section title
                if (adminSectionTitle) {
                    const span = link.querySelector('span');
                    if (span) {
                        adminSectionTitle.textContent = span.textContent;
                    }
                }
                
                // Load section data
                loadAdminSectionData(targetSection);
            });
        });
        
        // Initialize admin dashboard
        loadAdminSectionData('dashboard');
    } else {
        console.error('Admin sidebar not found!');
    }
    
    // Enhanced Login/Logout Functionality
    const adminLoginForm = document.getElementById('admin-login-form');
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('admin-username').value;
            const password = document.getElementById('admin-password').value;
            
            if (username === 'admin' && password === 'admin123') {
                adminLoggedIn = true;
                adminLoginModal.classList.remove('active');
                showPage('admin');
                showNotification('Admin login successful!', 'success');
            } else {
                document.getElementById('admin-login-error').textContent = 'Invalid credentials';
            }
        });
    }
    
    const userLoginForm = document.getElementById('user-login-form');
    if (userLoginForm) {
        userLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('user-email').value.trim();
            const password = document.getElementById('user-password').value;
            
            // Additional client-side validation
            if (!email) {
                document.getElementById('user-login-error').textContent = 'Email is required';
                return;
            }
            
            // Validate Gmail domain
            if (!email.toLowerCase().endsWith('@gmail.com')) {
                document.getElementById('user-login-error').textContent = 'Please use a Gmail address (@gmail.com)';
                return;
            }
            
            if (!password) {
                document.getElementById('user-login-error').textContent = 'Password is required';
                return;
            }
            
            try {
                // Call backend API for login
                const response = await fetch('http://localhost:3000/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: email,
                        password: password
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // Get user data from localStorage or create if not exists
                    if (!users[email]) {
                        users[email] = { password, fullName: email.split('@')[0], phone: '', bookings: [] };
                        saveUsersToStorage();
                    }
                    
                    userLoggedIn = true;
                    currentUser = { email, fullName: users[email].fullName, phone: users[email].phone || '' };
                    saveSessionToStorage(currentUser);
                    document.getElementById('user-login-modal').classList.remove('active');
                    updateUIAfterLogin();
                    showNotification('Login successful!', 'success');
                    
                    // Redirect to intended page if there was one
                    const intendedPage = sessionStorage.getItem('intendedPage');
                    if (intendedPage) {
                        sessionStorage.removeItem('intendedPage');
                        showPage(intendedPage);
                    }
                } else {
                    document.getElementById('user-login-error').textContent = data.message || 'Invalid email or password';
                }
            } catch (error) {
                console.error('Login error:', error);
                document.getElementById('user-login-error').textContent = 'Network error. Please try again.';
            }
        });
    }
    
    const userSignupForm = document.getElementById('user-signup-form');
    if (userSignupForm) {
        userSignupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fullName = document.getElementById('signup-fullname').value.trim();
            const email = document.getElementById('signup-email').value.trim();
            const phone = document.getElementById('signup-phone').value.trim();
            const password = document.getElementById('signup-password').value;
            const confirmPassword = document.getElementById('signup-confirm-password').value;
            
            // Additional client-side validation
            if (!fullName) {
                document.getElementById('user-signup-error').textContent = 'Full name is required';
                return;
            }
            
            if (!email) {
                document.getElementById('user-signup-error').textContent = 'Email is required';
                return;
            }
            
            // Validate Gmail domain
            if (!email.toLowerCase().endsWith('@gmail.com')) {
                document.getElementById('user-signup-error').textContent = 'Please use a Gmail address (@gmail.com)';
                return;
            }
            
            if (!phone) {
                document.getElementById('user-signup-error').textContent = 'Phone number is required';
                return;
            }
            
            if (!password) {
                document.getElementById('user-signup-error').textContent = 'Password is required';
                return;
            }
            
            if (!confirmPassword) {
                document.getElementById('user-signup-error').textContent = 'Please confirm your password';
                return;
            }
            
            if (password !== confirmPassword) {
                document.getElementById('user-signup-error').textContent = 'Passwords do not match';
                return;
            }
            
            try {
                // Call backend API for signup
                const response = await fetch('http://localhost:3000/api/auth/signup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        username: fullName,
                        email: email,
                        phone: phone,
                        password: password
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // Store user data locally for session management
                    users[email] = { password, fullName, phone, bookings: [] };
                    saveUsersToStorage();
                    
                    // Auto-login after signup
                    userLoggedIn = true;
                    currentUser = { email, fullName, phone };
                    saveSessionToStorage(currentUser);
                    document.getElementById('user-login-modal').classList.remove('active');
                    updateUIAfterLogin();
                    showNotification('Account created and logged in successfully!', 'success');
                    
                    // Redirect to intended page if there was one
                    const intendedPage = sessionStorage.getItem('intendedPage');
                    if (intendedPage) {
                        sessionStorage.removeItem('intendedPage');
                        showPage(intendedPage);
                    }
                } else {
                    document.getElementById('user-signup-error').textContent = data.message || 'Signup failed';
                }
            } catch (error) {
                console.error('Signup error:', error);
                document.getElementById('user-signup-error').textContent = 'Network error. Please try again.';
            }
        });
    }
    
    // Form Switcher
    const showSignupLink = document.getElementById('show-signup');
    const showLoginLink = document.getElementById('show-login');
    const loginView = document.getElementById('login-view');
    const signupView = document.getElementById('signup-view');

    if (showSignupLink) {
        showSignupLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginView.classList.add('slide-out');
        signupView.classList.add('slide-in');
    });
    }

    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        signupView.classList.remove('slide-in');
            loginView.classList.remove('slide-out');
        });
    }
    
    // Modal Close Functionality
    document.querySelectorAll('.login-modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
    
    // Feedback Form
    const feedbackForm = document.getElementById('feedback-form');
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const newTestimonial = {
                id: Date.now(),
                name: document.getElementById('feedback-name').value,
                email: document.getElementById('feedback-email').value,
                rating: parseInt(document.getElementById('feedback-rating').value),
                text: document.getElementById('feedback-message').value,
                image: `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000)}?ixlib=rb-4.0.3&auto=format&fit=crop&w=687&q=80`,
                type: 'residential',
                date: new Date().toISOString().split('T')[0],
                status: 'pending'
            };
            
            testimonials.push(newTestimonial);
            feedbackForm.reset();
            showNotification('Thank you for your feedback!', 'success');
        });
    }

    // Show booking details modal
function showBookingDetails(booking) {
    const modal = document.getElementById('booking-details-modal');
    const content = document.getElementById('booking-details-content');
    
    const assignedVendor = booking.assignedVendor ? 
        vendors.find(v => v._id === booking.assignedVendor) : null;
    
    content.innerHTML = `
        <div class="booking-details-grid">
            <div class="detail-section">
                <h3>Client Information</h3>
                <p><strong>Name:</strong> ${booking.clientName}</p>
                <p><strong>Email:</strong> ${booking.clientEmail}</p>
                <p><strong>Phone:</strong> ${booking.clientPhone}</p>
            </div>
            
            <div class="detail-section">
                <h3>Service Details</h3>
                <p><strong>Service:</strong> ${booking.service}</p>
                <p><strong>Windows:</strong> ${booking.windows}</p>
                <p><strong>Date:</strong> ${booking.date}</p>
                <p><strong>Time:</strong> ${booking.time}</p>
                <p><strong>Status:</strong> <span class="status-badge status-${booking.status}">${booking.status}</span></p>
            </div>
            
            <div class="detail-section">
                <h3>Address</h3>
                <p>${booking.address ? booking.address.replace(/\n/g, '<br>') : 'Not provided'}</p>
            </div>
            
            <div class="detail-section">
                <h3>Notes</h3>
                <p>${booking.notes ? booking.notes.replace(/\n/g, '<br>') : 'No notes'}</p>
            </div>
            
            <div class="detail-section">
                <h3>Vendor Assignment</h3>
                ${assignedVendor ? `
                    <p><strong>Assigned Vendor:</strong> ${assignedVendor.name}</p>
                    <p><strong>Email:</strong> ${assignedVendor.email}</p>
                    <p><strong>Phone:</strong> ${assignedVendor.phone}</p>
                ` : '<p>No vendor assigned yet</p>'}
            </div>
        </div>
    `;
    
    modal.classList.add('active');
}

// Hide booking details modal
function hideBookingDetails() {
    const modal = document.getElementById('booking-details-modal');
    modal.classList.remove('active');
}

// --- NOTIFICATION SYSTEM ---
    
    // Store user notifications in localStorage
    function addUserNotification(userEmail, notification) {
        const notifications = JSON.parse(localStorage.getItem('userNotifications') || '{}');
        if (!notifications[userEmail]) {
            notifications[userEmail] = [];
        }
        
        // Add timestamp to notification
        notification.timestamp = new Date().toISOString();
        notification.id = Date.now();
        
        notifications[userEmail].unshift(notification); // Add to beginning
        
        // Keep only last 10 notifications per user
        if (notifications[userEmail].length > 10) {
            notifications[userEmail] = notifications[userEmail].slice(0, 10);
        }
        
        localStorage.setItem('userNotifications', JSON.stringify(notifications));
    }
    
    function getUserNotifications() {
        if (!currentUser || !currentUser.email) return '<p>No notifications</p>';
        
        const notifications = JSON.parse(localStorage.getItem('userNotifications') || '{}');
        const userNotifications = notifications[currentUser.email] || [];
        
        if (userNotifications.length === 0) {
            return '<p>No notifications yet</p>';
        }
        
        return userNotifications.map(notification => `
            <div class="notification-item ${notification.type}">
                <div class="notification-icon">
                    <i class="fas ${getNotificationIcon(notification.type)}"></i>
                </div>
                <div class="notification-content">
                    <h4>${notification.title}</h4>
                    <p>${notification.message}</p>
                    <small>${formatNotificationDate(notification.timestamp)}</small>
                </div>
            </div>
        `).join('');
    }
    
    function getNotificationIcon(type) {
        switch (type) {
            case 'booking_confirmed': return 'fa-check-circle';
            case 'booking_completed': return 'fa-star';
            case 'booking_cancelled': return 'fa-times-circle';
            case 'booking_updated': return 'fa-edit';
            default: return 'fa-bell';
        }
    }
    
    function formatNotificationDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);
        
        if (diffInHours < 1) {
            return 'Just now';
        } else if (diffInHours < 24) {
            return `${Math.floor(diffInHours)} hours ago`;
        } else {
            return date.toLocaleDateString();
        }
    }
    
    // --- AUTHENTICATION AND PROFILE LOGIC ---
    function renderProfilePage() {
        const profileContent = document.getElementById('profile-content');
        if (!profileContent) {
            console.error('Profile content element not found!');
            return;
        }
        
        if (!userLoggedIn) {
            profileContent.innerHTML = `
                <div class="profile-header">
                    <h2>Please Log In</h2>
                    <p>You need to be logged in to view your profile.</p>
                    <button class="cta-button" onclick="document.getElementById('user-login-modal').classList.add('active')">
                        Log In
                    </button>
                </div>
            `;
            return;
        }

        const userBookings = users[currentUser.email]?.bookings || [];
        
        const bookingsHTML = userBookings.length > 0 
            ? userBookings.map(booking => `
                <div class="booking-list-item">
                    <div class="booking-header">
                        <h4>${booking.service}</h4>
                        <span class="status-badge status-${booking.status}">${booking.status}</span>
                    </div>
                    <div class="booking-details">
                        <p><strong>Date:</strong> ${booking.date} at ${booking.time}</p>
                        <p><strong>Windows:</strong> ${booking.windows}</p>
                        ${booking.address ? `<p><strong>Address:</strong> ${booking.address.replace(/\n/g, ', ')}</p>` : ''}
                        ${booking.notes ? `<p><strong>Notes:</strong> ${booking.notes}</p>` : ''}
                    </div>
                </div>
            `).join('')
            : '<p>No bookings yet. <a href="#booking" class="nav-link user-action-link">Book your first cleaning!</a></p>';
        
        profileContent.innerHTML = `
            <div class="profile-header">
                <h2>Welcome, ${currentUser.fullName}!</h2>
                <p>Email: ${currentUser.email}</p>
                ${currentUser.phone ? `<p>Phone: ${currentUser.phone}</p>` : ''}
                <button id="logout-btn" class="cta-button">Logout</button>
            </div>
            <div class="notifications-section">
                <h3>Notifications</h3>
                <div id="user-notifications">
                    ${getUserNotifications()}
                </div>
            </div>
            <div class="booking-list">
                <h3>Your Bookings (${userBookings.length})</h3>
                ${bookingsHTML}
            </div>
        `;
        
        // Add logout button event listener
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logout);
        }
    }

    function updateUIAfterLogin() {
        const mobileBookingLinkLi = document.getElementById('mobile-booking-link-li');
        const mobileProfileLinkLi = document.getElementById('mobile-profile-link-li');
        
        if (mobileBookingLinkLi) mobileBookingLinkLi.style.display = 'none';
        if (mobileProfileLinkLi) mobileProfileLinkLi.style.display = 'block';
        
        // Pre-fill booking form if on booking page
        if (document.getElementById('booking-name') && currentUser) {
            document.getElementById('booking-name').value = currentUser.fullName;
            document.getElementById('booking-email').value = currentUser.email;
            if (document.getElementById('booking-phone') && currentUser.phone) {
                document.getElementById('booking-phone').value = currentUser.phone;
            }
        }
        
        // Update header CTA button
        const headerCta = document.querySelector('.header-cta');
        if (headerCta) {
            headerCta.querySelector('span').textContent = 'My Profile';
            headerCta.querySelector('i').className = 'fas fa-user';
            headerCta.href = '#profile';
        }
        
        // Update hero CTA button
        const heroCta = document.querySelector('.hero .cta-button');
        if (heroCta) {
            heroCta.querySelector('span').textContent = 'My Profile';
            heroCta.querySelector('i').className = 'fas fa-user';
            heroCta.href = '#profile';
        }
        
        // Show quick booking section
        const quickBookingSection = document.getElementById('quick-booking-section');
        if (quickBookingSection) {
            quickBookingSection.style.display = 'block';
        }
    }

    function logout() {
        userLoggedIn = false;
        currentUser = null;
        clearSessionFromStorage();
        sessionStorage.removeItem('intendedPage'); // Clear any stored intended page
        
        const mobileBookingLinkLi = document.getElementById('mobile-booking-link-li');
        const mobileProfileLinkLi = document.getElementById('mobile-profile-link-li');
        
        if (mobileBookingLinkLi) mobileBookingLinkLi.style.display = 'block';
        if (mobileProfileLinkLi) mobileProfileLinkLi.style.display = 'none';
        
        // Reset header CTA button
        const headerCta = document.querySelector('.header-cta');
        if (headerCta) {
            headerCta.querySelector('span').textContent = 'Book Now';
            headerCta.querySelector('i').className = 'fas fa-arrow-right';
            headerCta.href = '#booking';
        }
        
        // Reset hero CTA button
        const heroCta = document.querySelector('.hero .cta-button');
        if (heroCta) {
            heroCta.querySelector('span').textContent = 'Book Now';
            heroCta.querySelector('i').className = 'fas fa-arrow-right';
            heroCta.href = '#booking';
        }
        
        // Hide quick booking section
        const quickBookingSection = document.getElementById('quick-booking-section');
        if (quickBookingSection) {
            quickBookingSection.style.display = 'none';
        }
        
        showPage('home');
        showNotification('Logged out successfully', 'info');
    }
    
    // Check if user is already logged in on page load
    const savedUser = localStorage.getItem('sparklingCurrentUser');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            userLoggedIn = true;
            updateUIAfterLogin();
        } catch (e) {
            console.error('Error loading saved user session:', e);
            clearSessionFromStorage();
        }
    }
    
    // Quick Booking Button Event Listeners
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('quick-book-btn') || e.target.closest('.quick-book-btn')) {
            const button = e.target.classList.contains('quick-book-btn') ? e.target : e.target.closest('.quick-book-btn');
            const service = button.getAttribute('data-service');
            
            if (service) {
                // Navigate to booking page
                showPage('booking');
                
                // Pre-fill the service selection
                setTimeout(() => {
                    const serviceSelect = document.getElementById('booking-service');
                    if (serviceSelect) {
                        serviceSelect.value = service;
                        // Trigger change event to update any dependent fields
                        serviceSelect.dispatchEvent(new Event('change'));
                    }
                    
                    // Pre-fill user details if available
                    if (currentUser) {
                        const nameField = document.getElementById('booking-name');
                        const emailField = document.getElementById('booking-email');
                        if (nameField) nameField.value = currentUser.fullName;
                        if (emailField) emailField.value = currentUser.email;
                    }
                    
                    showNotification(`Quick booking started for ${service}!`, 'success');
                }, 500);
            }
        }
    });
    
    // Set minimum date for booking date fields
    function setBookingDateMin() {
        const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
        const bookingDateInputs = document.querySelectorAll('input[type="date"][id="booking-date"]');
        
        bookingDateInputs.forEach(input => {
            input.min = today;
        });
    }
    
    // Call the function when the page loads
    setBookingDateMin();
    
    // Also call it when the booking page is shown
    document.addEventListener('DOMContentLoaded', function() {
        // Set minimum date for booking fields
        setBookingDateMin();
        
        // Set minimum date when booking page is shown
        const originalShowPage = window.showPage;
        window.showPage = function(pageId, isBackAction = false) {
            originalShowPage(pageId, isBackAction);
            if (pageId === 'booking') {
                setTimeout(setBookingDateMin, 100);
            }
        };
    });
    
    // Google Maps Integration
    function initMap() {
        try {
            const mapElement = document.getElementById('map');
            if (!mapElement) {
                console.error('Map element not found');
                return;
            }
            
            const location = { lat: 51.5886, lng: -0.3354 }; // Harrow, UK coordinates
            const map = new google.maps.Map(mapElement, {
                zoom: 15,
                center: location,
                styles: [
                    { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }
                ]
            });
            
            const marker = new google.maps.Marker({
                position: location,
                map: map,
                title: "Sparkling Window Cleaners Ltd.",
                icon: {
                    url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
                        <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="20" cy="20" r="18" fill="#00AAFF" stroke="#FFFFFF" stroke-width="2"/>
                            <path d="M12 16 L20 8 L28 16 L28 24 L20 32 L12 24 Z" fill="#FFFFFF"/>
                            <path d="M16 20 L20 16 L24 20 L24 24 L20 28 L16 24 Z" fill="#00AAFF"/>
                        </svg>
                    `),
                    scaledSize: new google.maps.Size(40, 40)
                }
            });
            
            const infoWindow = new google.maps.InfoWindow({
                content: `
                    <div style="padding: 10px; max-width: 200px;">
                        <h3 style="margin: 0 0 5px 0; color: #00AAFF;">Sparkling Window Cleaners Ltd.</h3>
                        <p style="margin: 0; font-size: 14px;">73 Kenmore Ave, Harrow HA3 8PA, UK</p>
                        <p style="margin: 5px 0 0 0; font-size: 14px;">Professional window cleaning services</p>
                    </div>
                `
            });
            
            marker.addListener('click', () => {
                infoWindow.open(map, marker);
            });
            
        } catch (error) {
            console.error('Error initializing map:', error);
        }
    }
    
    // Make initMap globally available
    window.initMap = initMap;

    // Admin Dashboard Functions
    async function loadAdminSectionData(section) {
        switch(section) {
            case 'dashboard':
                await updateDashboardStats();
                await loadRecentBookings();
                await initializeCharts();
                break;
            case 'bookings':
                await loadBookingsTable();
                break;
            case 'inquiries':
                loadInquiriesList();
                break;
            case 'testimonials':
                loadTestimonialsList();
                break;
            case 'analytics':
                initializeAnalyticsCharts();
                break;
            case 'vendors':
                initializeVendorManagement();
                break;
        }
    }
    
    // Admin Booking Management Functions
    async function updateBookingStatus(bookingId, newStatus) {
        try {
            // Call backend API to update booking status
            const response = await fetch(`http://localhost:3000/api/booking/${bookingId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Update local booking status
                const booking = bookings.find(b => b._id === bookingId || b.id === bookingId);
                if (booking) {
                    booking.status = newStatus;
                    
                    // Send notification to user if booking is confirmed, completed, or cancelled
                    if (['confirmed', 'completed', 'cancelled'].includes(newStatus)) {
                        const notification = {
                            type: `booking_${newStatus}`,
                            title: `Booking ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
                            message: `Your ${booking.service} booking for ${booking.date} has been ${newStatus}.`
                        };
                        
                        // Add notification for the user
                        addUserNotification(booking.clientEmail, notification);
                        
                        // If user is currently logged in and viewing their profile, refresh notifications
                        if (currentUser && currentUser.email === booking.clientEmail) {
                            const notificationsContainer = document.getElementById('user-notifications');
                            if (notificationsContainer) {
                                notificationsContainer.innerHTML = getUserNotifications();
                            }
                        }
                    }
                }
                
                // Refresh admin views
                await loadAdminSectionData('dashboard');
                await loadAdminSectionData('bookings');
                
                showNotification(`Booking ${newStatus} successfully!`, 'success');
            } else {
                showNotification(data.message || 'Failed to update booking status', 'error');
            }
        } catch (error) {
            console.error('Update booking status error:', error);
            showNotification('Network error. Please try again.', 'error');
        }
    }
    
    async function loadAllBookingsFromBackend() {
        try {
            const response = await fetch('http://localhost:3000/api/booking');
            const data = await response.json();
            
            console.log('Raw booking data from backend:', data); // Debug log
            
            if (response.ok) {
                // Convert backend booking format to frontend format
                bookings = data.map(booking => ({
                    _id: booking._id, // Keep the original _id
                    id: booking._id, // Also keep id for backward compatibility
                    clientName: booking.name,
                    clientEmail: booking.email,
                    clientPhone: booking.phone || '',
                    service: booking.movie,
                    windows: booking.seat,
                    date: booking.date,
                    time: booking.time || '10:00 AM', // Use actual time from backend
                    address: booking.address || '',
                    notes: booking.notes || '',
                    status: booking.status || 'pending',
                    assignedVendor: booking.assignedVendor,
                    assignmentDate: booking.assignmentDate,
                    assignmentNotes: booking.assignmentNotes,
                    createdAt: booking.createdAt || new Date().toISOString()
                }));
                
                console.log('Processed bookings:', bookings);
                return true;
            }
        } catch (error) {
            console.error('Load bookings error:', error);
            // Load sample bookings for demo
            loadSampleBookings();
            return true;
        }
        return false;
    }

    // Load sample bookings for demo
    function loadSampleBookings() {
        bookings = [
            {
                _id: '1',
                id: '1',
                clientName: 'Alice Brown',
                clientEmail: 'alice@example.com',
                clientPhone: '+44 123 456 7890',
                service: 'Residential Window Cleaning',
                windows: '15',
                date: '2024-02-15',
                time: '09:00 AM',
                address: '123 High Street, London SW1A 1AA, UK',
                notes: 'Second floor windows need special attention',
                status: 'confirmed',
                assignedVendor: '1', // John Smith
                assignmentDate: '2024-02-10',
                assignmentNotes: 'Customer prefers morning appointments'
            },
            {
                _id: '2',
                id: '2',
                clientName: 'David Wilson',
                clientEmail: 'david@example.com',
                clientPhone: '+44 987 654 3210',
                service: 'Commercial Window Cleaning',
                windows: '25',
                date: '2024-02-16',
                time: '10:00 AM',
                address: '456 Business Park, Manchester M1 1AA, UK',
                notes: 'Office building - high traffic area',
                status: 'pending',
                assignedVendor: null,
                assignmentDate: null,
                assignmentNotes: ''
            },
            {
                _id: '3',
                id: '3',
                clientName: 'Emma Davis',
                clientEmail: 'emma@example.com',
                clientPhone: '+44 555 123 4567',
                service: 'Residential Window Cleaning',
                windows: '12',
                date: '2024-02-17',
                time: '11:00 AM',
                address: '789 Garden Lane, Birmingham B1 1AA, UK',
                notes: 'New customer - first time service',
                status: 'confirmed',
                assignedVendor: '3', // Mike Wilson
                assignmentDate: '2024-02-11',
                assignmentNotes: 'Customer requested experienced cleaner'
            }
        ];
    }
    
    // Enhanced admin functions that load from backend
    async function loadBookingsTable() {
        const tableBody = document.getElementById('bookings-table-body');
        if (!tableBody) return;
        
        // Load fresh data from backend
        const success = await loadAllBookingsFromBackend();
        if (success) {
            tableBody.innerHTML = bookings.map(booking => {
                const assignedVendor = booking.assignedVendor ? 
                    vendors.find(v => v._id === booking.assignedVendor) : null;
                
                // Debug logging for address and notes
                console.log('Booking:', booking.clientName);
                console.log('Address:', booking.address);
                console.log('Notes:', booking.notes);
                console.log('Address type:', typeof booking.address);
                console.log('Notes type:', typeof booking.notes);
                
                return `
                    <tr>
                        <td>
                            <div class="client-info">
                                <strong>${booking.clientName}</strong>
                            </div>
                        </td>
                        <td>
                            <div class="contact-info">
                                <div>${booking.clientEmail}</div>
                                <div>${booking.clientPhone}</div>
                            </div>
                        </td>
                        <td>${booking.service}</td>
                        <td>${booking.windows}</td>
                        <td>${booking.date} at ${booking.time}</td>
                        <td>
                            <div class="address-info" title="${booking.address || 'Not provided'}">
                                ${booking.address ? (booking.address.length > 50 ? booking.address.substring(0, 50) + '...' : booking.address).replace(/\n/g, '<br>') : 'Not provided'}
                            </div>
                        </td>
                        <td>
                            <div class="notes-info" title="${booking.notes || 'No notes'}">
                                ${booking.notes ? (booking.notes.length > 40 ? booking.notes.substring(0, 40) + '...' : booking.notes).replace(/\n/g, '<br>') : 'No notes'}
                            </div>
                        </td>
                        <td>
                            ${assignedVendor ? `
                                <div class="assigned-vendor">
                                    <div class="vendor-avatar">${assignedVendor.name.charAt(0)}</div>
                                    <span>${assignedVendor.name}</span>
                                </div>
                            ` : '<span style="color: #999;">Not assigned</span>'}
                        </td>
                        <td><span class="status-badge status-${booking.status}">${booking.status}</span></td>
                        <td>
                            <div class="assignment-actions">
                                ${!assignedVendor ? `
                                    <button class="admin-btn" onclick="showAssignmentModal('${booking._id}')">
                                        <i class="fas fa-user-plus"></i> Assign
                                    </button>
                                ` : `
                                    <button class="admin-btn" onclick="unassignVendor('${booking._id}')">
                                        <i class="fas fa-user-minus"></i> Unassign
                                    </button>
                                `}
                                <button class="admin-btn" onclick="editBooking('${booking._id}')">
                                    <i class="fas fa-edit"></i> Edit
                                </button>
                                <button class="admin-btn" onclick="showBookingDetails(${JSON.stringify(booking).replace(/"/g, '&quot;')})">
                                    <i class="fas fa-eye"></i> Details
                                </button>
                                <button class="admin-btn" onclick="updateBookingStatus('${booking._id}', 'confirmed')">Confirm</button>
                                <button class="admin-btn" onclick="updateBookingStatus('${booking._id}', 'completed')">Complete</button>
                                <button class="admin-btn" onclick="updateBookingStatus('${booking._id}', 'cancelled')">Cancel</button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    }
    
    async function loadRecentBookings() {
        const recentBookingsList = document.getElementById('recent-bookings-list');
        if (!recentBookingsList) return;
        
        // Load fresh data from backend
        const success = await loadAllBookingsFromBackend();
        if (success) {
            const recentBookings = bookings.slice(0, 5);
            recentBookingsList.innerHTML = recentBookings.map(booking => `
                <div class="booking-item">
                    <div class="booking-info">
                        <h4>${booking.clientName}</h4>
                        <p>${booking.service} - ${booking.date} at ${booking.time}</p>
                        <span class="status-badge status-${booking.status}">${booking.status}</span>
                    </div>
                    <div class="booking-actions">
                        <button class="admin-btn" onclick="updateBookingStatus('${booking._id}', 'confirmed')">Confirm</button>
                        <button class="admin-btn" onclick="updateBookingStatus('${booking._id}', 'completed')">Complete</button>
                    </div>
                </div>
            `).join('');
        }
    }
    
    async function updateDashboardStats() {
        // Load fresh data from backend first
        const success = await loadAllBookingsFromBackend();
        if (success) {
            document.getElementById('total-bookings').textContent = bookings.length;
            document.getElementById('pending-bookings').textContent = bookings.filter(b => b.status === 'pending').length;
            document.getElementById('new-inquiries').textContent = inquiries.filter(i => i.status === 'new').length;
            
            const avgRating = testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length;
            document.getElementById('avg-rating').textContent = avgRating.toFixed(1);
        }
    }
    
    function loadInquiriesList() {
        const inquiriesList = document.getElementById('inquiries-list');
        if (!inquiriesList) return;
        
        inquiriesList.innerHTML = inquiries.map(inquiry => `
            <div class="inquiry-item">
                <div class="inquiry-header">
                    <h4>${inquiry.name}</h4>
                    <span class="inquiry-type">${inquiry.type}</span>
                    <span class="inquiry-date">${inquiry.date}</span>
                </div>
                <div class="inquiry-details">
                    <p><strong>Email:</strong> ${inquiry.email}</p>
                    <p><strong>Phone:</strong> ${inquiry.phone}</p>
                    <p><strong>Message:</strong> ${inquiry.message}</p>
                </div>
                <div class="inquiry-actions">
                    <button class="admin-btn" onclick="markInquiryRead(${inquiry.id})">Mark as Read</button>
                    <button class="admin-btn" onclick="deleteInquiry(${inquiry.id})">Delete</button>
                </div>
            </div>
        `).join('');
    }
    
    function loadTestimonialsList() {
        const testimonialsList = document.getElementById('admin-testimonials-list');
        if (!testimonialsList) return;
        
        testimonialsList.innerHTML = testimonials.map(testimonial => `
            <div class="testimonial-item">
                <div class="testimonial-header">
                    <img src="${testimonial.image}" alt="${testimonial.name}">
                    <div>
                        <h4>${testimonial.name}</h4>
                        <div class="rating">
                            ${'★'.repeat(testimonial.rating)}${'☆'.repeat(5-testimonial.rating)}
                        </div>
                        <span class="testimonial-date">${testimonial.date}</span>
                    </div>
                </div>
                <p class="testimonial-text">${testimonial.message}</p>
                <div class="testimonial-actions">
                    <button class="admin-btn" onclick="approveTestimonial(${testimonial.id})">Approve</button>
                    <button class="admin-btn" onclick="deleteTestimonial(${testimonial.id})">Delete</button>
                </div>
            </div>
        `).join('');
    }
    
    // Chart instances for management
    // Destroy existing charts before creating new ones
    function destroyChart(chartId) {
        if (chartInstances[chartId]) {
            chartInstances[chartId].destroy();
            chartInstances[chartId] = null;
        }
    }

    async function initializeCharts() {
        const ctx = document.getElementById('bookingsChart');
        if (ctx) {
            // Destroy existing chart
            destroyChart('bookingsChart');
            
            // Load fresh booking data from backend
            await loadAllBookingsFromBackend();
            
            // Generate booking data based on real bookings
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const currentMonth = new Date().getMonth();
            
            // Count bookings by month
            const bookingData = months.map((month, index) => {
                if (index <= currentMonth) {
                    const monthBookings = bookings.filter(booking => {
                        const bookingDate = new Date(booking.date);
                        return bookingDate.getMonth() === index;
                    });
                    return monthBookings.length;
                }
                return 0; // Future months
            });

            chartInstances.bookingsChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: months,
                    datasets: [{
                        label: 'Monthly Bookings',
                        data: bookingData,
                        backgroundColor: 'rgba(0, 170, 255, 0.1)',
                        borderColor: 'rgba(0, 170, 255, 1)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: 'rgba(0, 170, 255, 1)',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 6,
                        pointHoverRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            borderColor: 'rgba(0, 170, 255, 1)',
                            borderWidth: 1,
                            cornerRadius: 8,
                            displayColors: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)',
                                drawBorder: false
                            },
                            ticks: {
                                color: '#666',
                                font: {
                                    size: 12
                                }
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                color: '#666',
                                font: {
                                    size: 12
                                }
                            }
                        }
                    },
                    animation: {
                        duration: 1500,
                        easing: 'easeInOutQuart'
                    },
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    }
                }
            });
        }
    }
    
    function initializeAnalyticsCharts() {
        // Revenue Chart with enhanced styling
        const revenueCtx = document.getElementById('revenueChart');
        if (revenueCtx) {
            destroyChart('revenueChart');
            
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const currentMonth = new Date().getMonth();
            const revenueData = months.map((_, index) => {
                if (index <= currentMonth) {
                    return Math.floor(Math.random() * 8000) + 2000; // £2000-£10000 per month
                }
                return 0;
            });

            chartInstances.revenueChart = new Chart(revenueCtx, {
                type: 'bar',
                data: {
                    labels: months,
                    datasets: [{
                        label: 'Monthly Revenue (£)',
                        data: revenueData,
                        backgroundColor: [
                            'rgba(0, 170, 255, 0.8)',
                            'rgba(0, 170, 255, 0.7)',
                            'rgba(0, 170, 255, 0.6)',
                            'rgba(0, 170, 255, 0.5)',
                            'rgba(0, 170, 255, 0.4)',
                            'rgba(0, 170, 255, 0.3)',
                            'rgba(0, 170, 255, 0.2)',
                            'rgba(0, 170, 255, 0.1)',
                            'rgba(0, 170, 255, 0.05)',
                            'rgba(0, 170, 255, 0.03)',
                            'rgba(0, 170, 255, 0.02)',
                            'rgba(0, 170, 255, 0.01)'
                        ],
                        borderColor: 'rgba(0, 170, 255, 1)',
                        borderWidth: 1,
                        borderRadius: 8,
                        borderSkipped: false
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            borderColor: 'rgba(0, 170, 255, 1)',
                            borderWidth: 1,
                            cornerRadius: 8,
                            callbacks: {
                                label: function(context) {
                                    return `Revenue: £${context.parsed.y.toLocaleString()}`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)',
                                drawBorder: false
                            },
                            ticks: {
                                color: '#666',
                                font: { size: 12 },
                                callback: function(value) {
                                    return '£' + value.toLocaleString();
                                }
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                color: '#666',
                                font: { size: 12 }
                            }
                        }
                    },
                    animation: {
                        duration: 1500,
                        easing: 'easeInOutQuart'
                    }
                }
            });
        }
        
        // Service Distribution Chart with enhanced styling
        const serviceCtx = document.getElementById('serviceChart');
        if (serviceCtx) {
            destroyChart('serviceChart');
            
            const serviceData = {
                'Residential': 65,
                'Commercial': 25,
                'Gutter & Siding': 10
            };

            chartInstances.serviceChart = new Chart(serviceCtx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(serviceData),
                    datasets: [{
                        data: Object.values(serviceData),
                        backgroundColor: [
                            'rgba(0, 170, 255, 0.9)',
                            'rgba(0, 119, 204, 0.9)',
                            'rgba(10, 37, 64, 0.9)'
                        ],
                        borderColor: [
                            'rgba(0, 170, 255, 1)',
                            'rgba(0, 119, 204, 1)',
                            'rgba(10, 37, 64, 1)'
                        ],
                        borderWidth: 2,
                        hoverOffset: 15
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: '#333',
                                font: { size: 12 },
                                padding: 20,
                                usePointStyle: true,
                                pointStyle: 'circle'
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            borderColor: 'rgba(0, 170, 255, 1)',
                            borderWidth: 1,
                            cornerRadius: 8,
                            callbacks: {
                                label: function(context) {
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((context.parsed / total) * 100).toFixed(1);
                                    return `${context.label}: ${context.parsed}% (${percentage}%)`;
                                }
                            }
                        }
                    },
                    animation: {
                        duration: 1500,
                        easing: 'easeInOutQuart'
                    }
                }
            });
        }
        
        // Customer Satisfaction Chart with enhanced styling
        const satisfactionCtx = document.getElementById('satisfactionChart');
        if (satisfactionCtx) {
            destroyChart('satisfactionChart');
            
            chartInstances.satisfactionChart = new Chart(satisfactionCtx, {
                type: 'radar',
                data: {
                    labels: ['Quality', 'Punctuality', 'Professionalism', 'Communication', 'Value', 'Overall'],
                    datasets: [{
                        label: 'Customer Satisfaction',
                        data: [4.8, 4.9, 4.7, 4.6, 4.5, 4.7],
                        backgroundColor: 'rgba(0, 170, 255, 0.2)',
                        borderColor: 'rgba(0, 170, 255, 1)',
                        borderWidth: 3,
                        pointBackgroundColor: 'rgba(0, 170, 255, 1)',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 6,
                        pointHoverRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            borderColor: 'rgba(0, 170, 255, 1)',
                            borderWidth: 1,
                            cornerRadius: 8,
                            callbacks: {
                                label: function(context) {
                                    return `${context.label}: ${context.parsed.r}/5.0`;
                                }
                            }
                        }
                    },
                    scales: {
                        r: {
                            beginAtZero: true,
                            max: 5,
                            min: 0,
                            ticks: {
                                stepSize: 1,
                                color: '#666',
                                font: { size: 12 },
                                callback: function(value) {
                                    return value + '/5';
                                }
                            },
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            },
                            angleLines: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            },
                            pointLabels: {
                                color: '#333',
                                font: { size: 12, weight: 'bold' }
                            }
                        }
                    },
                    animation: {
                        duration: 1500,
                        easing: 'easeInOutQuart'
                    }
                }
            });
        }
    }

    // Refresh all charts
    async function refreshCharts() {
        await initializeCharts();
        initializeAnalyticsCharts();
    }

    // Add refresh functionality to admin buttons
    document.addEventListener('DOMContentLoaded', function() {
        const refreshBtn = document.getElementById('refresh-data');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', async function() {
                // Show loading state
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
                this.disabled = true;
                
                try {
                    // Refresh all data
                    await refreshCharts();
                    await updateDashboardStats();
                    await loadRecentBookings();
                    await loadBookingsTable();
                    loadInquiriesList();
                    loadTestimonialsList();
                    
                    // Show success message
                    showNotification('Data refreshed successfully!', 'success');
                } catch (error) {
                    console.error('Refresh error:', error);
                    showNotification('Error refreshing data', 'error');
                } finally {
                    // Reset button
                    this.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
                    this.disabled = false;
                }
            });
        }

        const exportBtn = document.getElementById('export-data');
        if (exportBtn) {
            exportBtn.addEventListener('click', function() {
                exportData();
            });
        }
    });

    // Export data functionality
    function exportData() {
        const data = {
            bookings: bookings,
            inquiries: inquiries,
            testimonials: testimonials,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sparkling-windows-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('Data exported successfully!', 'success');
    }

    // Admin Action Functions
    window.updateBookingStatus = async function(bookingId, newStatus) {
        await updateBookingStatus(bookingId, newStatus);
    };
    
    window.markInquiryRead = function(inquiryId) {
        const inquiry = inquiries.find(i => i.id === inquiryId);
        if (inquiry) {
            inquiry.status = 'read';
            loadAdminSectionData('inquiries');
        }
    };
    
    window.deleteInquiry = function(inquiryId) {
        inquiries = inquiries.filter(i => i.id !== inquiryId);
        loadAdminSectionData('inquiries');
    };
    
    window.approveTestimonial = function(testimonialId) {
        // Implementation for approving testimonials
    };
    
    window.deleteTestimonial = function(testimonialId) {
        testimonials = testimonials.filter(t => t.id !== testimonialId);
        loadAdminSectionData('testimonials');
    };
}); 

// script.js

// ... (keep all your existing JS code) ...

// --- APPENDED SCRIPT FOR PAYMENT FORM ---
document.addEventListener('DOMContentLoaded', () => {
    const bookingForm = document.getElementById('booking-form');
    if (!bookingForm) return;

    // Payment step elements
    const paymentTabs = bookingForm.querySelectorAll('.payment-tab');
    const cardPaymentForm = document.getElementById('card-payment-form');
    const cashPaymentForm = document.getElementById('cash-payment-form');
    const submitPaymentBtn = document.getElementById('submit-payment-btn');
    const cardInputs = cardPaymentForm.querySelectorAll('input[required]');

    // Payment tab switching logic
    paymentTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            paymentTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const method = tab.dataset.paymentMethod;
            const btnText = submitPaymentBtn.querySelector('.btn-text');

            if (method === 'card') {
                cardPaymentForm.classList.add('active');
                cashPaymentForm.classList.remove('active');
                btnText.textContent = 'Pay Now';
                // Make card inputs required
                cardInputs.forEach(input => input.required = true);
            } else {
                cardPaymentForm.classList.remove('active');
                cashPaymentForm.classList.add('active');
                btnText.textContent = 'Confirm Booking';
                // Make card inputs not required
                cardInputs.forEach(input => input.required = false);
            }
        });
    });

    // Real-time Credit Card validation and formatting
    const cardNumberInput = document.getElementById('card-number');
    const cardExpiryInput = document.getElementById('card-expiry');
    const cardCvvInput = document.getElementById('card-cvv');
    const cardNameInput = document.getElementById('card-name');
    const cardTypeIcon = document.getElementById('card-type-icon');

    if(cardNumberInput) {
        cardNumberInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
            
            // Card type detection
            let cardType = 'fa-credit-card'; // Default
            if (/^4/.test(value)) cardType = 'fa-cc-visa';
            else if (/^5[1-5]/.test(value)) cardType = 'fa-cc-mastercard';
            else if (/^3[47]/.test(value)) cardType = 'fa-cc-amex';
            else if (/^6/.test(value)) cardType = 'fa-cc-discover';
            cardTypeIcon.className = `fab ${cardType}`;

            // Add spaces for readability
            let formattedValue = '';
            for (let i = 0; i < value.length; i++) {
                if (i > 0 && i % 4 === 0) formattedValue += ' ';
                formattedValue += value[i];
            }
            e.target.value = formattedValue.trim();
        });
    }

    if(cardNameInput) {
        cardNameInput.addEventListener('input', e => {
            e.target.value = e.target.value.toUpperCase();
        });
    }

    if(cardExpiryInput) {
        cardExpiryInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 2) {
                value = value.substring(0, 2) + ' / ' + value.substring(2, 4);
            }
            e.target.value = value;
        });
    }
    
    if(cardCvvInput) {
        cardCvvInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').substring(0, 4);
        });
    }

    // --- Modify Existing Booking Form Submit Handler ---
    const originalSubmitHandler = bookingForm.onsubmit; // If any inline handler exists
    bookingForm.addEventListener('submit', function(e) {
        // This will now be triggered by the "Pay Now" / "Confirm Booking" button
        
        // Let's check if we are on the payment step.
        // The `submit` event will only fire from the button in the payment step.
        const activePaymentMethod = bookingForm.querySelector('.payment-tab.active').dataset.paymentMethod;

        if (activePaymentMethod === 'card') {
            let isCardValid = true;
            cardInputs.forEach(input => {
                input.classList.remove('invalid');
                if (!input.checkValidity()) {
                    isCardValid = false;
                    input.classList.add('invalid');
                }
            });

            if (!isCardValid) {
                e.preventDefault(); // Stop form submission
                showNotification('Please correct the errors in the payment form.', 'error');
                return;
            }
        }
        
        // If we reach here, the card form is valid OR cash was selected.
        // We can now show the loading spinner and proceed with the existing submission logic.
        submitPaymentBtn.classList.add('loading');
        
        // The rest of the original submission logic is already attached to the submit event
        // so we don't need to re-implement it. We just let it run after our validation.
        // We'll simulate a delay for payment processing before showing success.
        
        e.preventDefault(); // We must prevent default here to handle the fake delay
        
        setTimeout(() => {
             // Create new booking object (as in original script)
            const newBooking = {
                id: Date.now(),
                clientName: document.getElementById('booking-name').value,
                clientEmail: document.getElementById('booking-email').value,
                service: document.getElementById('booking-service').value,
                windows: parseInt(document.getElementById('booking-windows').value),
                date: document.getElementById('booking-date').value,
                time: document.getElementById('booking-time').value,
                notes: document.getElementById('booking-notes').value,
                status: 'confirmed', // Mark as confirmed since payment is "processed"
                createdAt: new Date().toISOString()
            };

            bookings.push(newBooking);

            if (currentUser && users[currentUser.email]) {
                if (!users[currentUser.email].bookings) {
                    users[currentUser.email].bookings = [];
                }
                users[currentUser.email].bookings.push(newBooking);
                saveUsersToStorage();
            }

            // Show success animation and step
            const steps = Array.from(bookingForm.querySelectorAll('.form-step'));
            const successStep = bookingForm.querySelector('.form-step[data-step="5"]');
            bookingForm.querySelector('.form-step.active').classList.remove('active');
            successStep.classList.add('active');

            const container = bookingForm.querySelector('.sparkle-container');
            if(container){
                container.innerHTML = '';
                for (let i = 0; i < 30; i++) {
                    const sparkle = document.createElement('div');
                    sparkle.className = 'sparkle';
                    sparkle.style.left = `${Math.random() * 100}%`;
                    sparkle.style.top = `${Math.random() * 100}%`;
                    sparkle.style.animationDelay = `${Math.random() * 0.5}s`;
                    container.appendChild(sparkle);
                }
            }
            
            showNotification('Booking confirmed successfully!', 'success');
            submitPaymentBtn.classList.remove('loading');

            setTimeout(() => {
                bookingForm.reset();
                // Find changeStep function if it's global or re-implement reset
                const firstStep = bookingForm.querySelector('.form-step[data-step="1"]');
                bookingForm.querySelector('.form-step.active').classList.remove('active');
                firstStep.classList.add('active');
                // Reset payment tabs
                document.querySelector('.payment-tab[data-payment-method="card"]').click();

            }, 4000);

        }, 1500); // 1.5 second fake processing delay
    });

});

// ===== VENDOR MANAGEMENT SYSTEM =====

// Global variables for vendor management
let vendors = [];
let currentVendorId = null;
let currentAssignmentBookingId = null;

// Initialize vendor management system
function initializeVendorManagement() {
    loadVendors();
    setupVendorEventListeners();
    setupAssignmentEventListeners();
}

// Load vendors from backend
async function loadVendors() {
    try {
        const response = await fetch('http://localhost:3000/api/vendor');
        if (response.ok) {
            vendors = await response.json();
            console.log('Loaded vendors from backend:', vendors); // Debug log
            populateVendorsTable();
            populateVendorFilters();
        } else {
            console.error('Failed to load vendors');
            // Load sample data for demo
            loadSampleVendors();
        }
    } catch (error) {
        console.error('Error loading vendors:', error);
        // Load sample data for demo
        loadSampleVendors();
    }
}

// Load sample vendors for demo
function loadSampleVendors() {
    vendors = [
        {
            _id: '1',
            name: 'John Smith',
            email: 'john.smith@sparkling.com',
            phone: '+44 123 456 7890',
            specializations: ['residential', 'interior'],
            availability: {
                monday: true, tuesday: true, wednesday: true, thursday: true, friday: true,
                saturday: false, sunday: false
            },
            rating: 4.8,
            totalJobs: 45,
            status: 'active',
            hourlyRate: 25.00
        },
        {
            _id: '2',
            name: 'Sarah Johnson',
            email: 'sarah.johnson@sparkling.com',
            phone: '+44 123 456 7891',
            specializations: ['commercial', 'high-rise', 'exterior'],
            availability: {
                monday: true, tuesday: true, wednesday: true, thursday: true, friday: true,
                saturday: true, sunday: false
            },
            rating: 4.9,
            totalJobs: 67,
            status: 'active',
            hourlyRate: 30.00
        },
        {
            _id: '3',
            name: 'Mike Wilson',
            email: 'mike.wilson@sparkling.com',
            phone: '+44 123 456 7892',
            specializations: ['residential', 'commercial'],
            availability: {
                monday: true, tuesday: true, wednesday: true, thursday: true, friday: true,
                saturday: false, sunday: false
            },
            rating: 4.7,
            totalJobs: 32,
            status: 'active',
            hourlyRate: 28.00
        }
    ];
    populateVendorsTable();
    populateVendorFilters();
}

// Populate vendors table
function populateVendorsTable() {
    const tbody = document.getElementById('vendors-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';
    
    vendors.forEach(vendor => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${vendor.name}</td>
            <td>${vendor.email}</td>
            <td>${vendor.phone}</td>
            <td>
                ${vendor.specializations.map(spec => 
                    `<span class="specialization-tag">${spec}</span>`
                ).join('')}
            </td>
            <td>
                <div class="vendor-rating">
                    <span>${vendor.rating.toFixed(1)}</span>
                    <i class="fas fa-star"></i>
                </div>
            </td>
            <td>
                <span class="vendor-status ${vendor.status}">${vendor.status.replace('_', ' ')}</span>
            </td>
            <td>
                <div class="assignment-actions">
                    <button class="admin-btn" onclick="editVendor('${vendor._id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="admin-btn" onclick="deleteVendor('${vendor._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Populate vendor filters
function populateVendorFilters() {
    const vendorFilter = document.getElementById('assignment-vendor-filter');
    if (!vendorFilter) return;

    // Clear existing options except "All Vendors"
    vendorFilter.innerHTML = '<option value="all">All Vendors</option>';
    
    vendors.filter(v => v.status === 'active').forEach(vendor => {
        const option = document.createElement('option');
        option.value = vendor._id;
        option.textContent = vendor.name;
        vendorFilter.appendChild(option);
    });
}

// Setup vendor event listeners
function setupVendorEventListeners() {
    // Add vendor button
    const addVendorBtn = document.getElementById('add-vendor-btn');
    if (addVendorBtn) {
        addVendorBtn.addEventListener('click', () => {
            currentVendorId = null;
            showVendorModal();
        });
    }

    // Vendor form submission
    const vendorForm = document.getElementById('vendor-form');
    if (vendorForm) {
        vendorForm.addEventListener('submit', handleVendorSubmit);
    }

    // Cancel vendor button
    const cancelVendorBtn = document.getElementById('cancel-vendor-btn');
    if (cancelVendorBtn) {
        cancelVendorBtn.addEventListener('click', hideVendorModal);
    }

    // Vendor tabs
    const vendorTabs = document.querySelectorAll('.vendor-tab');
    vendorTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            switchVendorTab(targetTab);
        });
    });
}

// Setup assignment event listeners
function setupAssignmentEventListeners() {
    // Close booking details button
    const closeBookingDetailsBtn = document.getElementById('close-booking-details-btn');
    if (closeBookingDetailsBtn) {
        closeBookingDetailsBtn.addEventListener('click', hideBookingDetails);
    }

    // Assignment form submission
    const assignmentForm = document.getElementById('assignment-form');
    if (assignmentForm) {
        assignmentForm.addEventListener('submit', handleAssignmentSubmit);
    }

    // Cancel assignment button
    const cancelAssignmentBtn = document.getElementById('cancel-assignment-btn');
    if (cancelAssignmentBtn) {
        cancelAssignmentBtn.addEventListener('click', hideAssignmentModal);
    }

    // Assignment filters
    const statusFilter = document.getElementById('assignment-status-filter');
    const vendorFilter = document.getElementById('assignment-vendor-filter');
    
    if (statusFilter) {
        statusFilter.addEventListener('change', loadAssignmentsTable);
    }
    if (vendorFilter) {
        vendorFilter.addEventListener('change', loadAssignmentsTable);
    }
}

// Show vendor modal
function showVendorModal() {
    const modal = document.getElementById('vendor-modal');
    const title = document.getElementById('vendor-modal-title');
    
    if (currentVendorId) {
        title.textContent = 'Edit Vendor';
        populateVendorForm(currentVendorId);
    } else {
        title.textContent = 'Add New Vendor';
        clearVendorForm();
    }
    
    modal.classList.add('active');
}

// Hide vendor modal
function hideVendorModal() {
    const modal = document.getElementById('vendor-modal');
    modal.classList.remove('active');
    clearVendorForm();
}

// Show assignment modal
function showAssignmentModal(bookingId) {
    console.log('Opening assignment modal for booking:', bookingId); // Debug log
    currentAssignmentBookingId = bookingId;
    const modal = document.getElementById('assignment-modal');
    
    // Populate vendor select
    const vendorSelect = document.getElementById('assignment-vendor-select');
    vendorSelect.innerHTML = '<option value="">Choose a vendor...</option>';
    
    const activeVendors = vendors.filter(v => v.status === 'active');
    console.log('Available vendors:', activeVendors); // Debug log
    
    activeVendors.forEach(vendor => {
        const option = document.createElement('option');
        option.value = vendor._id;
        option.textContent = vendor.name;
        vendorSelect.appendChild(option);
    });
    
    modal.classList.add('active');
}

// Hide assignment modal
function hideAssignmentModal() {
    const modal = document.getElementById('assignment-modal');
    modal.classList.remove('active');
    currentAssignmentBookingId = null;
    document.getElementById('assignment-form').reset();
}

// Handle vendor form submission
async function handleVendorSubmit(e) {
    e.preventDefault();
    
    // Get form elements directly
    const nameInput = document.getElementById('vendor-name');
    const emailInput = document.getElementById('vendor-email');
    const phoneInput = document.getElementById('vendor-phone');
    const hourlyRateInput = document.getElementById('vendor-hourly-rate');
    const statusSelect = document.getElementById('vendor-status');
    
    // Validate required fields
    if (!nameInput.value.trim()) {
        showNotification('Vendor name is required', 'error');
        return;
    }
    
    if (!emailInput.value.trim()) {
        showNotification('Vendor email is required', 'error');
        return;
    }
    
    if (!phoneInput.value.trim()) {
        showNotification('Vendor phone is required', 'error');
        return;
    }
    
    if (!hourlyRateInput.value || parseFloat(hourlyRateInput.value) <= 0) {
        showNotification('Valid hourly rate is required', 'error');
        return;
    }
    
    const vendorData = {
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        phone: phoneInput.value.trim(),
        specializations: getSelectedCheckboxes('checkbox-group'),
        availability: getAvailabilityObject(),
        hourlyRate: parseFloat(hourlyRateInput.value),
        status: statusSelect.value
    };

    try {
        const url = currentVendorId ? `http://localhost:3000/api/vendor/${currentVendorId}` : 'http://localhost:3000/api/vendor';
        const method = currentVendorId ? 'PUT' : 'POST';
        
        console.log('Sending vendor data:', vendorData); // Debug log
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(vendorData)
        });

        if (response.ok) {
            const message = currentVendorId ? 'Vendor updated successfully!' : 'Vendor added successfully!';
            showNotification(message, 'success');
            hideVendorModal();
            loadVendors();
        } else {
            const errorData = await response.json();
            console.error('Server error:', errorData); // Debug log
            showNotification(errorData.message || 'Failed to save vendor', 'error');
        }
    } catch (error) {
        console.error('Error saving vendor:', error);
        showNotification('Failed to save vendor. Please check your connection.', 'error');
    }
}

// Handle assignment form submission
async function handleAssignmentSubmit(e) {
    e.preventDefault();
    
    const vendorId = document.getElementById('assignment-vendor-select').value;
    const notes = document.getElementById('assignment-notes').value;

    if (!vendorId) {
        showNotification('Please select a vendor', 'error');
        return;
    }

    console.log('Assigning vendor:', { vendorId, notes, bookingId: currentAssignmentBookingId }); // Debug log

    try {
        const response = await fetch(`http://localhost:3000/api/vendor/assign/${currentAssignmentBookingId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ vendorId, notes })
        });

        console.log('Assignment response status:', response.status); // Debug log

        if (response.ok) {
            const result = await response.json();
            console.log('Assignment successful:', result); // Debug log
            showNotification('Vendor assigned successfully!', 'success');
            hideAssignmentModal();
            loadAssignmentsTable();
            loadBookingsTable(); // Refresh bookings table to show assignment
        } else {
            const error = await response.json();
            console.error('Assignment error:', error); // Debug log
            showNotification(error.message || 'Failed to assign vendor', 'error');
        }
    } catch (error) {
        console.error('Error assigning vendor:', error);
        showNotification('Failed to assign vendor', 'error');
    }
}

// Edit vendor
async function editVendor(vendorId) {
    currentVendorId = vendorId;
    showVendorModal();
}

// Delete vendor
async function deleteVendor(vendorId) {
    if (!confirm('Are you sure you want to delete this vendor?')) {
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/vendor/${vendorId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showNotification('Vendor deleted successfully!', 'success');
            loadVendors();
        } else {
            const error = await response.json();
            showNotification(error.message || 'Failed to delete vendor', 'error');
        }
    } catch (error) {
        console.error('Error deleting vendor:', error);
        showNotification('Failed to delete vendor', 'error');
    }
}

// Switch vendor tab
function switchVendorTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.vendor-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.vendor-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');

    // Load appropriate data
    if (tabName === 'assignments') {
        loadAssignmentsTable();
    }
}

// Load assignments table
async function loadAssignmentsTable() {
    try {
        const response = await fetch('http://localhost:3000/api/booking');
        if (!response.ok) {
            console.error('Failed to load bookings');
            return;
        }

        const bookings = await response.json();
        const tbody = document.getElementById('assignments-table-body');
        if (!tbody) return;

        const statusFilter = document.getElementById('assignment-status-filter')?.value || 'all';
        const vendorFilter = document.getElementById('assignment-vendor-filter')?.value || 'all';

        tbody.innerHTML = '';
        
        bookings.forEach(booking => {
            // Apply filters
            if (statusFilter !== 'all' && booking.status !== statusFilter) return;
            const assignedVendorId = booking.assignedVendor ?
                (typeof booking.assignedVendor === 'string' ? booking.assignedVendor : booking.assignedVendor._id) : null;
            if (vendorFilter !== 'all' && assignedVendorId !== vendorFilter) return;

            const assignedVendor = booking.assignedVendor && typeof booking.assignedVendor === 'object'
                ? booking.assignedVendor
                : (assignedVendorId ? vendors.find(v => v._id === assignedVendorId) : null);

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${booking.name}</td>
                <td>${booking.movie}</td>
                <td>${booking.date}</td>
                <td>
                    ${assignedVendor ? `
                        <div class="assigned-vendor">
                            <div class="vendor-avatar">${assignedVendor.name?.charAt(0) || '?'}</div>
                            <span>${assignedVendor.name || 'Unknown'}</span>
                        </div>
                    ` : '<span style="color: #999;">Not assigned</span>'}
                </td>
                <td>
                    <span class="status-badge status-${booking.status}">${booking.status}</span>
                </td>
                <td>
                    <div class="assignment-actions">
                        ${!assignedVendor ? `
                            <button class="admin-btn" onclick="showAssignmentModal('${booking._id}')">
                                <i class="fas fa-user-plus"></i> Assign
                            </button>
                        ` : `
                            <button class="admin-btn" onclick="unassignVendor('${booking._id}')">
                                <i class="fas fa-user-minus"></i> Unassign
                            </button>
                        `}
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading assignments:', error);
    }
}

// Unassign vendor from booking
async function unassignVendor(bookingId) {
    if (!confirm('Are you sure you want to unassign this vendor?')) {
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/vendor/unassign/${bookingId}`, {
            method: 'POST'
        });

        if (response.ok) {
            showNotification('Vendor unassigned successfully!', 'success');
            loadAssignmentsTable();
            loadBookingsTable(); // Refresh bookings table
        } else {
            const error = await response.json();
            showNotification(error.message || 'Failed to unassign vendor', 'error');
        }
    } catch (error) {
        console.error('Error unassigning vendor:', error);
        showNotification('Failed to unassign vendor', 'error');
    }
}

// Helper functions
function getSelectedCheckboxes(containerClass) {
    const checkboxes = document.querySelectorAll(`.${containerClass} input[type="checkbox"]:checked`);
    const selectedValues = Array.from(checkboxes).map(cb => cb.value);
    console.log('Selected specializations:', selectedValues); // Debug log
    return selectedValues;
}

function getAvailabilityObject() {
    const availability = {};
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    days.forEach(day => {
        const checkbox = document.querySelector(`input[value="${day}"]`);
        if (checkbox) {
            availability[day] = checkbox.checked;
        } else {
            // Default availability (weekdays checked, weekends unchecked)
            availability[day] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(day);
        }
    });
    
    console.log('Availability object:', availability); // Debug log
    return availability;
}

function populateVendorForm(vendorId) {
    const vendor = vendors.find(v => v._id === vendorId);
    if (!vendor) return;

    document.getElementById('vendor-name').value = vendor.name;
    document.getElementById('vendor-email').value = vendor.email;
    document.getElementById('vendor-phone').value = vendor.phone;
    document.getElementById('vendor-hourly-rate').value = vendor.hourlyRate;
    document.getElementById('vendor-status').value = vendor.status;

    // Set specializations
    document.querySelectorAll('.checkbox-group input[type="checkbox"]').forEach(cb => {
        cb.checked = vendor.specializations.includes(cb.value);
    });

    // Set availability
    Object.keys(vendor.availability).forEach(day => {
        const checkbox = document.querySelector(`input[value="${day}"]`);
        if (checkbox) {
            checkbox.checked = vendor.availability[day];
        }
    });
}

function clearVendorForm() {
    document.getElementById('vendor-form').reset();
    document.querySelectorAll('.checkbox-group input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });
    document.querySelectorAll('.availability-grid input[type="checkbox"]').forEach(cb => {
        cb.checked = cb.value !== 'saturday' && cb.value !== 'sunday';
    });
}

// Initialize vendor management when admin section is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add vendor management initialization to admin section loading
    const originalLoadAdminSectionData = window.loadAdminSectionData;
    if (originalLoadAdminSectionData) {
        window.loadAdminSectionData = async function(section) {
            await originalLoadAdminSectionData(section);
            if (section === 'vendors') {
                initializeVendorManagement();
            }
        };
    }
});

// Function to edit booking details
function editBooking(bookingId) {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) {
        showNotification('Booking not found', 'error');
        return;
    }

    // Create edit modal HTML
    const modalHTML = `
        <div id="edit-booking-modal" class="login-modal active">
            <div class="login-modal-content">
                <h2>Edit Booking</h2>
                <form id="edit-booking-form">
                    <div class="form-group">
                        <label>Client Name</label>
                        <input type="text" id="edit-booking-name" value="${booking.clientName}" required />
                    </div>
                    <div class="form-group">
                        <label>Client Email</label>
                        <input type="email" id="edit-booking-email" value="${booking.clientEmail}" required />
                    </div>
                    <div class="form-group">
                        <label>Client Phone</label>
                        <input type="tel" id="edit-booking-phone" value="${booking.clientPhone || ''}" />
                    </div>
                    <div class="form-group">
                        <label>Service</label>
                        <select id="edit-booking-service" required>
                            <option value="Residential Cleaning" ${booking.service === 'Residential Cleaning' ? 'selected' : ''}>Residential Cleaning</option>
                            <option value="Commercial Cleaning" ${booking.service === 'Commercial Cleaning' ? 'selected' : ''}>Commercial Cleaning</option>
                            <option value="Gutter & Siding Wash" ${booking.service === 'Gutter & Siding Wash' ? 'selected' : ''}>Gutter & Siding Wash</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Number of Windows</label>
                        <input type="number" id="edit-booking-windows" value="${booking.windows}" required min="1" />
                    </div>
                    <div class="form-group">
                        <label>Date</label>
                        <input type="date" id="edit-booking-date" value="${booking.date}" required />
                    </div>
                    <div class="form-group">
                        <label>Time</label>
                        <input type="time" id="edit-booking-time" value="${booking.time}" required />
                    </div>
                    <div class="form-group">
                        <label>Address</label>
                        <textarea rows="3" id="edit-booking-address" required>${booking.address || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Notes</label>
                        <textarea rows="3" id="edit-booking-notes">${booking.notes || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Status</label>
                        <select id="edit-booking-status" required>
                            <option value="pending" ${booking.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="confirmed" ${booking.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                            <option value="completed" ${booking.status === 'completed' ? 'selected' : ''}>Completed</option>
                            <option value="cancelled" ${booking.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="cta-button">Update Booking</button>
                        <button type="button" class="cta-button secondary" onclick="closeEditBookingModal()">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Add form submit handler
    document.getElementById('edit-booking-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            // Update local booking
            const updatedBooking = {
                ...booking,
                clientName: document.getElementById('edit-booking-name').value,
                clientEmail: document.getElementById('edit-booking-email').value,
                clientPhone: document.getElementById('edit-booking-phone').value,
                service: document.getElementById('edit-booking-service').value,
                windows: parseInt(document.getElementById('edit-booking-windows').value),
                date: document.getElementById('edit-booking-date').value,
                time: document.getElementById('edit-booking-time').value,
                address: document.getElementById('edit-booking-address').value,
                notes: document.getElementById('edit-booking-notes').value,
                status: document.getElementById('edit-booking-status').value
            };

            // Update in global array
            const index = bookings.findIndex(b => b.id === bookingId);
            if (index !== -1) {
                bookings[index] = updatedBooking;
            }

            // Update in user's bookings if exists
            if (users[updatedBooking.clientEmail]) {
                const userIndex = users[updatedBooking.clientEmail].bookings.findIndex(b => b.id === bookingId);
                if (userIndex !== -1) {
                    users[updatedBooking.clientEmail].bookings[userIndex] = updatedBooking;
                    saveUsersToStorage();
                }
            }

            // Close modal
            closeEditBookingModal();

            // Refresh admin views
            await loadAdminSectionData('dashboard');
            await loadAdminSectionData('bookings');

            showNotification('Booking updated successfully!', 'success');
        } catch (error) {
            console.error('Update booking error:', error);
            showNotification('Failed to update booking', 'error');
        }
    });
}

// Function to close edit booking modal
function closeEditBookingModal() {
    const modal = document.getElementById('edit-booking-modal');
    if (modal) {
        modal.remove();
    }
}

// Make functions globally available
window.editBooking = editBooking;
window.closeEditBookingModal = closeEditBookingModal;




/* ====================================================== */
/* ===== APPENDED SCRIPT FOR 3D GALLERY TILT EFFECT ===== */
/* ====================================================== */
document.addEventListener('DOMContentLoaded', function() {
    const galleryCards = document.querySelectorAll('.home-gallery-grid .gallery-card');

    galleryCards.forEach(card => {
        const cardContainer = card.parentElement;

        cardContainer.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            // Adjust multiplier for more/less tilt (e.g., 7 for more, 3 for less)
            const rotateX = ((y - centerY) / centerY) * -5;
            const rotateY = ((x - centerX) / centerX) * 5;

            card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
            card.style.transition = 'transform 0.1s linear';
        });

        cardContainer.addEventListener('mouseleave', () => {
            card.style.transform = 'rotateX(0) rotateY(0) scale(1)';
            card.style.transition = 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)';
        });
    });
});