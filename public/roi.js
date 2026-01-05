// ==================== API CONFIGURATION ====================
const isLocalhost = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1';
                    
const API_BASE_URL = isLocalhost ? 'http://localhost:3000/api' : 'https://roi-beauty-api.onrender.com/api';
console.log('🌐 API Base URL:', API_BASE_URL);

// ==================== PRODUCT DATA ====================
const products = [
    { id: 1, name: "Hydrating Vitamin C Serum", description: "Brightens skin tone and reduces dark spots with natural vitamin C extract", price: 29.99, image: "image curology.jpeg", category: "serums", skinType: ["dry", "combination", "sensitive"], badge: "Bestseller", stockQuantity: 10 },
    { id: 2, name: "Nourishing Face Moisturizer", description: "Deeply hydrates and restores skin barrier with hyaluronic acid and ceramides", price: 24.99, image: "image curology.jpeg", category: "moisturizers", skinType: ["dry", "sensitive"], badge: "New", stockQuantity: 15 },
    { id: 3, name: "Gentle Foaming Cleanser", description: "Removes impurities without stripping natural oils, suitable for all skin types", price: 18.99, image: "image curology.jpeg", category: "cleansers", skinType: ["dry", "oily", "combination", "sensitive"], stockQuantity: 20 },
    { id: 4, name: "Revitalizing Eye Cream", description: "Reduces puffiness and dark circles with caffeine and peptide complex", price: 22.99, originalPrice: 27.99, image: "image curology.jpeg", category: "eye-care", skinType: ["dry", "combination", "sensitive"], stockQuantity: 8 },
    { id: 5, name: "Detoxifying Clay Mask", description: "Deep cleanses pores and absorbs excess oil with natural clay minerals", price: 19.99, image: "image curology.jpeg", category: "masks", skinType: ["oily", "combination"], stockQuantity: 12 },
    { id: 6, name: "Hydrating Facial Mist", description: "Instantly refreshes and hydrates skin with rosewater and aloe vera", price: 16.99, image: "image curology.jpeg", category: "serums", skinType: ["dry", "sensitive"], stockQuantity: 25 },
    { id: 7, name: "Brightening Toner", description: "Balances pH and improves skin texture with natural fruit extracts", price: 21.99, image: "image curology.jpeg", category: "cleansers", skinType: ["dry", "combination", "sensitive"], stockQuantity: 18 },
    { id: 8, name: "Overnight Repair Cream", description: "Intensive nighttime treatment that repairs skin while you sleep", price: 34.99, image: "image curology.jpeg", category: "moisturizers", skinType: ["dry", "sensitive"], badge: "New", stockQuantity: 6 },
    { id: 9, name: "Exfoliating Scrub", description: "Gentle exfoliation with natural jojoba beads for smoother skin", price: 17.99, image: "image curology.jpeg", category: "cleansers", skinType: ["oily", "combination"], stockQuantity: 14 },
    { id: 10, name: "Anti-Aging Serum", description: "Reduces fine lines and wrinkles with retinol and peptide complex", price: 39.99, image: "image curology.jpeg", category: "serums", skinType: ["dry", "combination", "sensitive"], stockQuantity: 9 },
    { id: 11, name: "Soothing Face Oil", description: "Nourishes and calms irritated skin with natural botanical oils", price: 26.99, image: "image curology.jpeg", category: "serums", skinType: ["dry", "sensitive"], stockQuantity: 11 },
    { id: 12, name: "Purifying Charcoal Mask", description: "Deep cleanses and detoxifies skin with activated charcoal", price: 23.99, image: "image curology.jpeg", category: "masks", skinType: ["oily", "combination"], stockQuantity: 7 }
];

// ==================== NETLIFY FIX - DISABLE API CALLS ====================
console.log('🌐 Netlify Mode: Using local data only');


// ==================== PAGE STATE MANAGEMENT ====================
class PageStateManager {
    constructor() {
        this.currentPage = 'home';
        this.init();
    }

    init() {
        const savedPage = sessionStorage.getItem('currentPage');
        if (savedPage) {
            this.currentPage = savedPage;
        }
        
        window.addEventListener('beforeunload', () => {
            sessionStorage.setItem('currentPage', this.currentPage);
        });
    }

    setCurrentPage(page) {
        this.currentPage = page;
        sessionStorage.setItem('currentPage', page);
    }

    getCurrentPage() {
        return this.currentPage;
    }

    clearState() {
        sessionStorage.removeItem('currentPage');
        this.currentPage = 'home';
    }
}

const pageStateManager = new PageStateManager();

// ==================== CART PERSISTENCE ====================
class CartManager {
    constructor() {
        this.cart = this.loadCartFromStorage();
    }

    loadCartFromStorage() {
        try {
            const savedCart = localStorage.getItem('roibeauty-cart');
            if (savedCart) {
                return JSON.parse(savedCart);
            }
        } catch (error) {
            console.error('Error loading cart from storage:', error);
        }
        return [];
    }

    saveCartToStorage() {
        try {
            localStorage.setItem('roibeauty-cart', JSON.stringify(this.cart));
        } catch (error) {
            console.error('Error saving cart to storage:', error);
        }
    }

    addItem(id, name, price, image, stockQuantity = 999) {
        const existingItem = this.cart.find(item => item.id == id);
        
        if (existingItem) {
            if (existingItem.quantity >= stockQuantity) {
                throw new Error(`Cannot add more than ${stockQuantity} items of ${name}`);
            }
            existingItem.quantity += 1;
        } else {
            this.cart.push({
                id: id,
                name: name,
                price: price,
                image: image,
                quantity: 1,
                stockQuantity: stockQuantity
            });
        }
        
        this.saveCartToStorage();
        return this.cart;
    }

    removeItem(id) {
        this.cart = this.cart.filter(item => item.id != id);
        this.saveCartToStorage();
        return this.cart;
    }

    updateQuantity(id, newQuantity) {
        const item = this.cart.find(item => item.id == id);
        if (!item) return this.cart;
        
        if (newQuantity > item.stockQuantity) {
            throw new Error(`Cannot add more than ${item.stockQuantity} items of ${item.name}`);
        }
        
        if (newQuantity < 1) {
            return this.removeItem(id);
        }
        
        item.quantity = newQuantity;
        this.saveCartToStorage();
        return this.cart;
    }

    clearCart() {
        this.cart = [];
        this.saveCartToStorage();
        return this.cart;
    }

    getCart() {
        return this.cart;
    }

    getTotalItems() {
        return this.cart.reduce((total, item) => total + item.quantity, 0);
    }

    getSubtotal() {
        return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }
}

const cartManager = new CartManager();

// ==================== FIXED AUTHENTICATION SERVICE ====================
class AuthService {
    constructor() {
        this.BASE_URL = '/api/auth';
        this.token = null;
        this.user = null;
        this.autoLogoutTimer = null;
        
        this.loadUserData();
        this.setupAutoLogout();
    }

    saveUserData() {
        try {
            if (this.token) {
                localStorage.setItem('authToken', this.token);
            }
            
            if (this.user) {
                localStorage.setItem('user', JSON.stringify(this.user));
            }
            
            return true;
        } catch (error) {
            console.error('❌ Error saving user data:', error);
            return false;
        }
    }

    loadUserData() {
        try {
            const token = localStorage.getItem('authToken');
            const userStr = localStorage.getItem('user');
            
            if (token) this.token = token;
            
            if (userStr) {
                try {
                    this.user = JSON.parse(userStr);
                } catch (e) {
                    this.user = null;
                }
            }
            
            return { token: this.token, user: this.user };
        } catch (error) {
            console.error('❌ Error loading user data:', error);
            return null;
        }
    }

    setupAutoLogout() {
        if (this.token && this.isTokenExpired(this.token)) {
            this.logout();
            return;
        }

        if (this.token) {
            this.autoLogoutTimer = setTimeout(() => {
                this.logout();
                this.showNotification('Your session has expired. Please log in again.', 'warning');
            }, 24 * 60 * 60 * 1000);
        }
    }

    isTokenExpired(token) {
        try {
            const decoded = JSON.parse(atob(token.split('.')[1]));
            return decoded.exp * 1000 < Date.now();
        } catch (error) {
            return true;
        }
    }

    isLoggedIn() {
        const hasToken = !!localStorage.getItem('authToken');
        const hasUser = !!localStorage.getItem('user');
        
        if (hasToken && !this.token) this.token = localStorage.getItem('authToken');
        if (hasUser && !this.user) {
            try {
                this.user = JSON.parse(localStorage.getItem('user'));
            } catch (e) {
                this.user = null;
            }
        }
        
        return hasToken && hasUser;
    }

    getCurrentUser() {
        if (!this.user) {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                try {
                    this.user = JSON.parse(userStr);
                } catch (e) {
                    this.user = null;
                }
            }
        }
        return this.user;
    }

    async register(userData) {
        try {
            const response = await fetch(`${this.BASE_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }
            
            return await this.login({
                email: userData.email,
                password: userData.password
            });
            
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    async login(credentials) {
        try {
            console.log('🔄 Login attempt:', { email: credentials.email });
            
            const response = await fetch(`${this.BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
            });

            if (!response.ok) {
                let errorMessage = `Server error: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (parseError) {
                    const errorText = await response.text();
                    errorMessage = errorText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            
            if (data.success) {
                this.token = data.token;
                
                this.user = {
                    _id: data.data?._id || data.data?.id || data.user?._id || data.user?.id || data.userId || 'temp-id',
                    id: data.data?._id || data.data?.id || data.user?._id || data.user?.id || data.userId || 'temp-id',
                    name: data.data?.name || data.user?.name || credentials.email.split('@')[0],
                    email: data.data?.email || data.user?.email || credentials.email,
                    isVerified: data.data?.isVerified !== undefined ? data.data.isVerified : 
                               data.user?.isVerified !== undefined ? data.user.isVerified : false,
                    role: data.data?.role || data.user?.role || 'user'
                };
                
                console.log('👤 Created user object:', this.user);
                
                this.saveUserData();
                
                this.setupAutoLogout();
                this.updateUI();
                console.log('✅ Login successful');
                return data;
            } else {
                throw new Error(data.message || 'Login failed');
            }
        } catch (error) {
            console.error('❌ Login error:', error);
            
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                throw new Error('Cannot connect to server. Please check if your backend is running on port 5000.');
            }
            
            throw error;
        }
    }

    logout() {
        console.log('🚪 Logging out...');
        
        this.token = null;
        this.user = null;
        
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        
        if (this.autoLogoutTimer) {
            clearTimeout(this.autoLogoutTimer);
            this.autoLogoutTimer = null;
        }
        
        console.log('✅ Logout complete');
        
        this.updateUI();
        
        if (profileModal) {
            profileModal.style.display = 'flex';
            this.showAuthForms();
        }
    }

    async forgotPassword(email) {
        try {
            const response = await fetch(`${this.BASE_URL}/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Password reset failed');
            }
            
            return data;
        } catch (error) {
            console.error('Forgot password error:', error);
            throw error;
        }
    }

    // FIXED: Contact form now uses correct endpoint
    async submitContact(formData) {
    console.log('📧 Contact form simulated for demo');
    console.log('Form data:', formData);
    
    // Always return success for demo
    return {
        success: true,
        message: 'Message sent successfully! (Demo mode)'
    };
}

    updateUI() {
        const profileBtn = document.getElementById('profileBtn');
        if (!profileBtn) return;
        
        const profileIcon = profileBtn.querySelector('i');
        
        if (this.isLoggedIn()) {
            if (this.user && this.user.isVerified) {
                profileIcon.className = 'fas fa-user-check';
                profileBtn.style.color = '#4a7c59';
            } else {
                profileIcon.className = 'fas fa-user-clock';
                profileBtn.style.color = '#f39c12';
            }
            const userName = this.user ? this.user.name : 'User';
            profileBtn.title = `Logged in as ${userName}`;
        } else {
            profileIcon.className = 'fas fa-user';
            profileBtn.style.color = '';
            profileBtn.title = 'Account';
        }
    }

    setupPasswordToggle() {
        const toggleLoginPassword = document.getElementById('toggleLoginPassword');
        const loginPasswordInput = document.getElementById('loginPassword');
        
        if (toggleLoginPassword && loginPasswordInput) {
            const newToggle = toggleLoginPassword.cloneNode(true);
            toggleLoginPassword.parentNode.replaceChild(newToggle, toggleLoginPassword);
            
            newToggle.addEventListener('click', () => {
                const type = loginPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                loginPasswordInput.setAttribute('type', type);
                const icon = newToggle.querySelector('i');
                if (icon) {
                    icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
                }
            });
        }

        const toggleSignupPassword = document.getElementById('toggleSignupPassword');
        const signupPasswordInput = document.getElementById('signupPassword');
        
        if (toggleSignupPassword && signupPasswordInput) {
            const newToggle = toggleSignupPassword.cloneNode(true);
            toggleSignupPassword.parentNode.replaceChild(newToggle, toggleSignupPassword);
            
            newToggle.addEventListener('click', () => {
                const type = signupPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                signupPasswordInput.setAttribute('type', type);
                const icon = newToggle.querySelector('i');
                if (icon) {
                    icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
                }
            });
        }
    }

    showAuthForms() {
        const modalContent = document.querySelector('.modal-content');
        if (!modalContent) return;
        
        modalContent.innerHTML = `
            <div class="modal-header">
                <h2>Account</h2>
                <button class="close-modal" id="closeModal">&times;</button>
            </div>
            <div class="auth-tabs">
                <button class="auth-tab active" data-tab="login">Login</button>
                <button class="auth-tab" data-tab="signup">Sign Up</button>
            </div>
            
            <div class="auth-form active" id="loginForm">
                <div class="form-group">
                    <label for="loginEmail">Email</label>
                    <input type="email" id="loginEmail" placeholder="Your email address" style="width: 100%; box-sizing: border-box;">
                </div>
                <div class="form-group password-group">
                    <label for="loginPassword">Password</label>
                    <div class="password-input-container">
                        <input type="password" id="loginPassword" placeholder="Your password" class="password-input" style="width: 100%; box-sizing: border-box;">
                        <button type="button" class="toggle-password" id="toggleLoginPassword">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
                <div class="form-group" style="text-align: right; margin-bottom: 20px;">
                    <a href="#" id="forgotPasswordLink" style="color: var(--primary); text-decoration: none; font-size: 0.9rem;">Forgot Password?</a>
                </div>
                <button class="auth-btn" id="loginBtn">Login</button>
            </div>
            
            <div class="auth-form" id="signupForm">
                <div class="form-group">
                    <label for="signupName">Full Name</label>
                    <input type="text" id="signupName" placeholder="Your full name" style="width: 100%; box-sizing: border-box;">
                </div>
                <div class="form-group">
                    <label for="signupEmail">Email</label>
                    <input type="email" id="signupEmail" placeholder="Your email address" style="width: 100%; box-sizing: border-box;">
                </div>
                <div class="form-group password-group">
                    <label for="signupPassword">Password</label>
                    <div class="password-input-container">
                        <input type="password" id="signupPassword" placeholder="Create a password (min. 6 characters)" class="password-input" style="width: 100%; box-sizing: border-box;">
                        <button type="button" class="toggle-password" id="toggleSignupPassword">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
                <button class="auth-btn" id="signupBtn">Sign Up</button>
            </div>
            
            <div class="auth-form" id="forgotPasswordForm">
                <div class="form-group">
                    <label for="resetEmail">Email Address</label>
                    <input type="email" id="resetEmail" placeholder="Enter your email address" style="width: 100%; box-sizing: border-box;">
                </div>
                <button class="auth-btn" id="resetPasswordBtn">Reset Password</button>
                <div class="form-group" style="text-align: center; margin-top: 15px;">
                    <a href="#" id="backToLoginLink" style="color: var(--primary); text-decoration: none; font-size: 0.9rem;">Back to Login</a>
                </div>
            </div>
        `;

        this.setupPasswordToggle();
        this.setupAuthEventListeners();
    }

    setupAuthEventListeners() {
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.getAttribute('data-tab');
                
                document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                document.querySelectorAll('.auth-form').forEach(form => {
                    form.classList.remove('active');
                    if (form.id === `${targetTab}Form`) {
                        form.classList.add('active');
                    }
                });

                this.setupPasswordToggle();
            });
        });

        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.handleLogin());
        }
        
        const signupBtn = document.getElementById('signupBtn');
        if (signupBtn) {
            signupBtn.addEventListener('click', () => this.handleSignup());
        }
        
        const forgotPasswordLink = document.getElementById('forgotPasswordLink');
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById('loginForm').classList.remove('active');
                document.getElementById('forgotPasswordForm').classList.add('active');
                this.setupPasswordToggle();
            });
        }
        
        const backToLoginLink = document.getElementById('backToLoginLink');
        if (backToLoginLink) {
            backToLoginLink.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById('forgotPasswordForm').classList.remove('active');
                document.getElementById('loginForm').classList.add('active');
                this.setupPasswordToggle();
            });
        }
        
        const resetPasswordBtn = document.getElementById('resetPasswordBtn');
        if (resetPasswordBtn) {
            resetPasswordBtn.addEventListener('click', () => this.handleForgotPassword());
        }
        
        const closeModal = document.getElementById('closeModal');
        if (closeModal) {
            const newCloseBtn = closeModal.cloneNode(true);
            closeModal.parentNode.replaceChild(newCloseBtn, closeModal);
            
            newCloseBtn.addEventListener('click', () => {
                if (profileModal) {
                    profileModal.style.display = 'none';
                }
            });
        }

        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const activeForm = document.querySelector('.auth-form.active');
                if (activeForm) {
                    if (activeForm.id === 'loginForm') {
                        this.handleLogin();
                    } else if (activeForm.id === 'signupForm') {
                        this.handleSignup();
                    } else if (activeForm.id === 'forgotPasswordForm') {
                        this.handleForgotPassword();
                    }
                }
            }
        });
    }

    async handleLogin() {
        const email = document.getElementById('loginEmail')?.value;
        const password = document.getElementById('loginPassword')?.value;
        const loginBtn = document.getElementById('loginBtn');
        
        if (!email || !password) {
            this.showAuthMessage('Please fill in all fields', 'error');
            return;
        }
        
        try {
            loginBtn.innerHTML = '<div class="loading-spinner"></div> Logging in...';
            loginBtn.disabled = true;
            
            await this.login({ email, password });
            
            this.showAuthMessage('Login successful!', 'success');
            
            this.saveUserData();
            this.updateUI();
            
            setTimeout(() => {
                if (profileModal) {
                    profileModal.style.display = 'none';
                }
            }, 1500);
            
        } catch (error) {
            console.error('❌ Login error:', error);
            this.showAuthMessage(error.message, 'error');
        } finally {
            if (loginBtn) {
                loginBtn.innerHTML = 'Login';
                loginBtn.disabled = false;
            }
        }
    }

    async handleSignup() {
        const name = document.getElementById('signupName')?.value;
        const email = document.getElementById('signupEmail')?.value;
        const password = document.getElementById('signupPassword')?.value;
        const signupBtn = document.getElementById('signupBtn');
        
        if (!name || !email || !password) {
            this.showAuthMessage('Please fill in all fields', 'error');
            return;
        }
        
        if (password.length < 6) {
            this.showAuthMessage('Password must be at least 6 characters', 'error');
            return;
        }
        
        try {
            signupBtn.innerHTML = '<div class="loading-spinner"></div> Creating account...';
            signupBtn.disabled = true;
            
            await this.register({ name, email, password });
            this.showAuthMessage('Account created successfully!', 'success');
            
            setTimeout(() => {
                if (profileModal) profileModal.style.display = 'none';
            }, 1500);
            
        } catch (error) {
            this.showAuthMessage(error.message, 'error');
        } finally {
            if (signupBtn) {
                signupBtn.innerHTML = 'Sign Up';
                signupBtn.disabled = false;
            }
        }
    }

    async handleForgotPassword() {
        const email = document.getElementById('resetEmail')?.value;
        const resetBtn = document.getElementById('resetPasswordBtn');
        
        if (!email) {
            this.showAuthMessage('Please enter your email address', 'error');
            return;
        }
        
        try {
            resetBtn.innerHTML = '<div class="loading-spinner"></div> Sending...';
            resetBtn.disabled = true;
            
            await this.forgotPassword(email);
            this.showAuthMessage('Password reset instructions sent to your email', 'success');
            
            setTimeout(() => {
                document.getElementById('forgotPasswordForm').classList.remove('active');
                document.getElementById('loginForm').classList.add('active');
            }, 2000);
            
        } catch (error) {
            this.showAuthMessage(error.message, 'error');
        } finally {
            if (resetBtn) {
                resetBtn.innerHTML = 'Reset Password';
                resetBtn.disabled = false;
            }
        }
    }

    async handleContactForm() {
    const nameInput = document.getElementById('contactName');
    const emailInput = document.getElementById('contactEmail');
    const messageInput = document.getElementById('contactMessage');
    const contactBtn = document.getElementById('contactBtn');
    
    // If elements don't exist, create them
    if (!nameInput || !emailInput || !messageInput || !contactBtn) {
        console.log('🔄 Creating missing contact form elements');
        createContactFormIfMissing();
        
        // Wait a bit and try again
        setTimeout(() => {
            this.handleContactForm();
        }, 500);
        return;
    }
    
    const name = nameInput.value;
    const email = emailInput.value;
    const message = messageInput.value;
    
    if (!name || !email || !message) {
        this.showContactMessage('Please fill in all fields', 'error');
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        this.showContactMessage('Please enter a valid email address', 'error');
        return;
    }
    
    try {
        contactBtn.innerHTML = '<div class="loading-spinner"></div> Sending...';
        contactBtn.disabled = true;
        
        await this.submitContact({ name, email, message });
        this.showContactMessage('Message sent successfully! We will get back to you soon.', 'success');
        
        // Clear form
        nameInput.value = '';
        emailInput.value = '';
        messageInput.value = '';
        
    } catch (error) {
        console.error('Contact form error:', error);
        this.showContactMessage(error.message || 'Failed to send message. Please try again.', 'error');
    } finally {
        contactBtn.innerHTML = 'Send Message';
        contactBtn.disabled = false;
    }
}

    showAuthMessage(message, type) {
        const existingMessage = document.querySelector('.auth-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        const messageEl = document.createElement('div');
        messageEl.className = `auth-message ${type}`;
        messageEl.textContent = message;
        
        const activeForm = document.querySelector('.auth-form.active');
        if (activeForm) {
            activeForm.insertBefore(messageEl, activeForm.firstChild);
        }
        
        setTimeout(() => {
            if (messageEl.parentElement) {
                messageEl.remove();
            }
        }, 5000);
    }

    showContactMessage(message, type) {
        const existingMessages = document.querySelectorAll('.contact-message');
        existingMessages.forEach(msg => msg.remove());
        
        const messageEl = document.createElement('div');
        messageEl.className = `contact-message ${type}`;
        messageEl.textContent = message;
        messageEl.style.cssText = `
            padding: 12px 15px;
            border-radius: 5px;
            margin-bottom: 15px;
            text-align: center;
            font-weight: 500;
        `;
        
        if (type === 'success') {
            messageEl.style.background = '#d4edda';
            messageEl.style.color = '#155724';
            messageEl.style.border = '1px solid #c3e6cb';
        } else {
            messageEl.style.background = '#f8d7da';
            messageEl.style.color = '#721c24';
            messageEl.style.border = '1px solid #f5c6cb';
        }
        
        const contactForm = document.querySelector('.contact-form');
        if (contactForm) {
            const formElement = contactForm.querySelector('form');
            if (formElement) {
                contactForm.insertBefore(messageEl, formElement);
            } else {
                contactForm.appendChild(messageEl);
            }
        }
        
        setTimeout(() => {
            if (messageEl.parentElement) {
                messageEl.remove();
            }
        }, 5000);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `auth-message ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            padding: 12px 20px;
            border-radius: 5px;
            font-weight: 500;
        `;
        
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    getAuthHeaders() {
        const token = localStorage.getItem('authToken');
        
        const headers = {
            'Content-Type': 'application/json',
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        return headers;
    }

    async getUserOrders() {
        try {
            const response = await fetch('/api/orders/my-orders', {
                method: 'GET',
                mode: 'cors', // Add this
                headers: this.getAuthHeaders()
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Server error:', errorText);
                return [];
            }
            
            const data = await response.json();
            
            return Array.isArray(data.data) ? data.data : 
                   Array.isArray(data) ? data : 
                   (data.data ? [data.data] : []);
        } catch (error) {
            console.error('Get user orders error:', error);
            return [];
        }
    }

    async associateGuestOrders(email) {
        try {
            const response = await fetch('/api/orders/associate-guest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({ email: email })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Server error:', errorText);
                return 0;
            }
            
            const data = await response.json();
            return data.count || 0;
            
        } catch (error) {
            console.error('❌ Associate error:', error);
            return 0;
        }
    }

    // FIXED: Profile loads immediately
    async showUserProfile() {
        const modalContent = document.querySelector('.modal-content');
        if (!this.isLoggedIn() || !modalContent) {
            this.showAuthForms();
            return;
        }

        // Show immediate loading
        modalContent.innerHTML = `
            <div class="modal-header">
                <h2>My Account</h2>
                <button class="close-modal" id="closeModal">&times;</button>
            </div>
            <div style="text-align: center; padding: 40px;">
                <div class="loading-spinner"></div>
                <p>Loading profile...</p>
            </div>
        `;

        // Load user data immediately
        setTimeout(async () => {
            try {
                const user = this.getCurrentUser();
                modalContent.innerHTML = `
                    <div class="modal-header modern-header">
                        <div class="header-content">
                            <h2><i class="fas fa-user-circle"></i> My Account</h2>
                            <p class="header-subtitle">Manage your profile and orders</p>
                        </div>
                        <button class="close-modal" id="closeModal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="modern-profile">
                        <div class="profile-card">
                            <div class="profile-avatar">
                                <div class="avatar-circle">
                                    <span>${user.name?.charAt(0) || 'U'}</span>
                                </div>
                                <div class="online-status"></div>
                            </div>
                            <div class="profile-info">
                                <h3 class="profile-name">${user.name || 'User'}</h3>
                                <p class="profile-email">${user.email || 'No email'}</p>
                                <div class="profile-stats">
                                    <div class="stat-item">
                                        <span class="stat-number" id="orderCount">0</span>
                                        <span class="stat-label">Orders</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-number">0</span>
                                        <span class="stat-label">Reviews</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="quick-actions">
                            <h3 class="section-title"><i class="fas fa-bolt"></i> Quick Actions</h3>
                            <div class="actions-grid">
                                <button class="action-btn" id="viewOrdersBtn">
                                    <div class="action-icon">
                                        <i class="fas fa-shopping-bag"></i>
                                    </div>
                                    <span>My Orders</span>
                                </button>
                                
                                <button class="action-btn" id="viewReviewsBtn">
                                    <div class="action-icon">
                                        <i class="fas fa-star"></i>
                                    </div>
                                    <span>My Reviews</span>
                                </button>
                            </div>
                        </div>

                        <div class="account-settings">
                            <h3 class="section-title"><i class="fas fa-cog"></i> Account Settings</h3>
                            <div class="settings-list">
                                <button class="setting-item" id="editProfileBtn">
                                    <i class="fas fa-user-edit"></i>
                                    <span>Edit Profile</span>
                                    <i class="fas fa-chevron-right"></i>
                                </button>
                            </div>
                        </div>

                        <button class="logout-btn" id="logoutBtn">
                            <i class="fas fa-sign-out-alt"></i>
                            <span>Logout</span>
                        </button>
                    </div>
                `;

                this.setupProfileEventListeners();
            } catch (error) {
                console.error('Error loading profile:', error);
                this.showAuthForms();
            }
        }, 100);
    }

    setupProfileEventListeners() {
        const viewOrdersBtn = document.getElementById('viewOrdersBtn');
        if (viewOrdersBtn) {
            const newBtn = viewOrdersBtn.cloneNode(true);
            viewOrdersBtn.parentNode.replaceChild(newBtn, viewOrdersBtn);
            newBtn.addEventListener('click', () => this.showOrderHistory());
        }
        
        const viewAllOrdersBtn = document.getElementById('viewAllOrdersBtn');
        if (viewAllOrdersBtn) {
            const newBtn = viewAllOrdersBtn.cloneNode(true);
            viewAllOrdersBtn.parentNode.replaceChild(newBtn, viewAllOrdersBtn);
            newBtn.addEventListener('click', () => this.showOrderHistory());
        }
        
        const viewReviewsBtn = document.getElementById('viewReviewsBtn');
        if (viewReviewsBtn) {
            const newBtn = viewReviewsBtn.cloneNode(true);
            viewReviewsBtn.parentNode.replaceChild(newBtn, viewReviewsBtn);
            newBtn.addEventListener('click', () => this.showUserReviews());
        }
        
        const editProfileBtn = document.getElementById('editProfileBtn');
        if (editProfileBtn) {
            const newBtn = editProfileBtn.cloneNode(true);
            editProfileBtn.parentNode.replaceChild(newBtn, editProfileBtn);
            newBtn.addEventListener('click', () => {
                showNotification('Edit profile feature coming soon!', 'info');
            });
        }
        
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            const newBtn = logoutBtn.cloneNode(true);
            logoutBtn.parentNode.replaceChild(newBtn, logoutBtn);
            newBtn.addEventListener('click', () => this.logout());
        }
        
        const closeModal = document.getElementById('closeModal');
        if (closeModal) {
            const newCloseBtn = closeModal.cloneNode(true);
            closeModal.parentNode.replaceChild(newCloseBtn, closeModal);
            newCloseBtn.addEventListener('click', () => {
                if (profileModal) {
                    profileModal.style.display = 'none';
                }
            });
        }
    }

    async loadRecentOrders() {
        try {
            const recentOrdersList = document.getElementById('recentOrdersList');
            if (!recentOrdersList) return;

            let orders = await this.getUserOrders();
            
            if (!Array.isArray(orders)) {
                orders = [];
            }
            
            const recentOrders = orders.slice(0, 3);
            
            if (!recentOrders || recentOrders.length === 0) {
                recentOrdersList.innerHTML = `
                    <div class="no-orders-mini">
                        <i class="fas fa-shopping-bag"></i>
                        <p>No orders yet</p>
                        <button class="btn" style="margin-top: 10px;" id="startShoppingMini">Start Shopping</button>
                    </div>
                `;
                
                const startShoppingBtn = document.getElementById('startShoppingMini');
                if (startShoppingBtn) {
                    startShoppingBtn.addEventListener('click', () => {
                        if (profileModal) profileModal.style.display = 'none';
                        showCatalogPage();
                    });
                }
                return;
            }
            
            let recentOrdersHTML = '';
            recentOrders.forEach(order => {
                const orderDate = order.createdAt 
                    ? new Date(order.createdAt).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                    }) 
                    : 'N/A';
                
                const orderStatus = order.status || 'pending';
                const orderNumber = order.orderNumber || order.orderId?.substring(0, 8) || 'N/A';
                const totalAmount = order.totalAmount?.toFixed(2) || '0.00';
                
                recentOrdersHTML += `
                    <div class="order-item-mini" data-order-id="${order.orderId}">
                        <div class="order-mini-info">
                            <div class="order-mini-icon">
                                <i class="fas fa-box"></i>
                            </div>
                            <div class="order-mini-details">
                                <h4>Order #${orderNumber}</h4>
                                <p>${orderDate} • £${totalAmount}</p>
                            </div>
                        </div>
                        <span class="order-mini-status ${orderStatus}">${orderStatus}</span>
                    </div>
                `;
            });
            
            if (orders.length > 3) {
                recentOrdersHTML += `
                    <div class="order-item-mini view-all-mini" style="justify-content: center;">
                        <span style="color: #667eea; font-weight: 600;">
                            View all ${orders.length} orders
                        </span>
                    </div>
                `;
            }
            
            recentOrdersList.innerHTML = recentOrdersHTML;
            
            const orderCountElement = document.getElementById('orderCount');
            if (orderCountElement) {
                orderCountElement.textContent = orders.length;
            }
            
        } catch (error) {
            console.error('Error loading recent orders:', error);
            const recentOrdersList = document.getElementById('recentOrdersList');
            if (recentOrdersList) {
                recentOrdersList.innerHTML = `
                    <div class="no-orders-mini">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Failed to load orders</p>
                    </div>
                `;
            }
        }
    }

    async showOrderHistory() {
        const modalContent = document.querySelector('.modal-content');
        if (!modalContent) return;

        try {
            modalContent.innerHTML = `
                <div class="modal-header">
                    <h2>My Orders</h2>
                    <button class="close-modal" id="closeModal">&times;</button>
                    <button class="back-btn" id="backToProfileBtn">
                        <i class="fas fa-arrow-left"></i> Back
                    </button>
                </div>
                <div class="order-history">
                    <div class="loading-orders">Loading your orders...</div>
                </div>
            `;

            let orders = await this.getUserOrders();
            
            if (!orders || !Array.isArray(orders)) {
                orders = [];
            }
            
            const orderHistory = document.querySelector('.order-history');
            
            if (orders.length === 0) {
                orderHistory.innerHTML = `
                    <div class="no-orders">
                        <i class="fas fa-shopping-bag"></i>
                        <h3>No Orders Yet</h3>
                        <p>You haven't placed any orders yet.</p>
                        <button class="btn" id="startShoppingBtn">Start Shopping</button>
                    </div>
                `;
                
                const startShoppingBtn = document.getElementById('startShoppingBtn');
                if (startShoppingBtn) {
                    const newBtn = startShoppingBtn.cloneNode(true);
                    startShoppingBtn.parentNode.replaceChild(newBtn, startShoppingBtn);
                    newBtn.addEventListener('click', () => {
                        if (profileModal) profileModal.style.display = 'none';
                        showCatalogPage();
                    });
                }
            } else {
                let ordersHTML = '';
                orders.forEach(order => {
                    const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A';
                    const orderNumber = order.orderNumber || order._id?.substring(-8) || order.orderId?.substring(-8) || 'N/A';
                    const orderStatus = order.status || order.orderStatus || 'pending';
                    const totalPrice = order.totalPrice || order.totalAmount || 0;
                    
                    ordersHTML += `
                        <div class="order-card">
                            <div class="order-header">
                                <div>
                                    <h4>Order #${orderNumber}</h4>
                                    <p>Placed on ${orderDate}</p>
                                </div>
                                <div class="order-status ${orderStatus}">
                                    ${orderStatus}
                                </div>
                            </div>
                            <div class="order-items">
                                ${order.orderItems && order.orderItems.slice(0, 2).map(item => `
                                    <div class="order-item-preview">
                                        <img src="${item.image || 'image curology.jpeg'}" alt="${item.name}">
                                        <span>${item.name} × ${item.quantity || 1}</span>
                                    </div>
                                `).join('') || ''}
                                ${order.orderItems && order.orderItems.length > 2 ? 
                                    `<div class="more-items">+${order.orderItems.length - 2} more items</div>` : ''}
                            </div>
                            <div class="order-footer">
                                <div class="order-total">Total: £${totalPrice.toFixed(2)}</div>
                                <button class="view-order-btn" data-order-id="${order._id || order.orderId}">
                                    View Details
                                </button>
                            </div>
                        </div>
                    `;
                });
                orderHistory.innerHTML = ordersHTML;
            }

            const backBtn = document.getElementById('backToProfileBtn');
            if (backBtn) {
                const newBackBtn = backBtn.cloneNode(true);
                backBtn.parentNode.replaceChild(newBackBtn, backBtn);
                newBackBtn.addEventListener('click', () => {
                    this.showUserProfile();
                });
            }

            const closeModal = document.getElementById('closeModal');
            if (closeModal) {
                const newCloseBtn = closeModal.cloneNode(true);
                closeModal.parentNode.replaceChild(newCloseBtn, closeModal);
                newCloseBtn.addEventListener('click', () => {
                    if (profileModal) {
                        profileModal.style.display = 'none';
                    }
                });
            }

        } catch (error) {
            console.error('Error loading orders:', error);
            const orderHistory = document.querySelector('.order-history');
            orderHistory.innerHTML = `
                <div class="error-loading">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Failed to load orders. Please try again.</p>
                    <button class="btn" onclick="location.reload()">Retry</button>
                </div>
            `;
        }
    }

    async showUserReviews() {
        const modalContent = document.querySelector('.modal-content');
        if (!modalContent) return;

        try {
            modalContent.innerHTML = `
                <div class="modal-header">
                    <h2>My Reviews</h2>
                    <button class="close-modal" id="closeModal">&times;</button>
                </div>
                <div class="user-reviews">
                    <div class="loading-reviews">Loading your reviews...</div>
                </div>
            `;

            const reviews = await this.getUserReviews();
            const reviewsContainer = document.querySelector('.user-reviews');
            
            if (reviews.length === 0) {
                reviewsContainer.innerHTML = `
                    <div class="no-reviews">
                        <i class="fas fa-star"></i>
                        <h3>No Reviews Yet</h3>
                        <p>You haven't reviewed any products yet.</p>
                    </div>
                `;
            } else {
                let reviewsHTML = '';
                reviews.forEach(review => {
                    reviewsHTML += `
                        <div class="review-card">
                            <div class="review-product">
                                <img src="${review.product.image}" alt="${review.product.name}">
                                <h4>${review.product.name}</h4>
                            </div>
                            <div class="review-rating">
                                ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}
                            </div>
                            <p class="review-comment">${review.comment}</p>
                            <div class="review-date">
                                ${new Date(review.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                    `;
                });
                reviewsContainer.innerHTML = reviewsHTML;
            }

            const closeModal = document.getElementById('closeModal');
            if (closeModal) {
                closeModal.addEventListener('click', () => {
                    if (profileModal) {
                        profileModal.style.display = 'none';
                    }
                });
            }

        } catch (error) {
            console.error('Error loading reviews:', error);
            const reviewsContainer = document.querySelector('.user-reviews');
            reviewsContainer.innerHTML = `
                <div class="error-loading">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Failed to load reviews. Please try again.</p>
                </div>
            `;
        }
    }
}

const authService = new AuthService();

// ==================== ENHANCED STRIPE PAYMENT WITH MULTIPLE METHODS ====================
class StripePayment {
    constructor() {
        this.stripe = null;
        this.elements = null;
        this.paymentElement = null;
        this.cardElement = null;
        this.clientSecret = null;
        this.orderId = null;
        this.isProcessing = false;
        
        this.loadStripeScript();
    }
    
    loadStripeScript() {
        return new Promise((resolve, reject) => {
            if (typeof Stripe !== 'undefined') {
                this.setupStripe();
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://js.stripe.com/v3/';
            script.async = true;
            
            script.onload = () => {
                console.log('✅ Stripe.js loaded');
                this.setupStripe();
                resolve();
            };
            
            script.onerror = () => {
                console.error('❌ Failed to load Stripe.js');
                showNotification('Payment system failed to load. Please refresh.', 'error');
                reject(new Error('Failed to load Stripe.js'));
            };
            
            document.head.appendChild(script);
        });
    }
    
    async setupStripe() {
    try {
        // Simple Stripe key - use your test key
        this.stripe = Stripe('pk_test_51SiykdIEN5UrlK0Wbi6IWNbT96QoqyzBN4rMelu6fygRsxuQiOoZHvk39tCPyB3gVMtSKIoh3gSkRfbJ9O9T5Jn400IbZT5CFF');
        
        console.log('✅ Stripe initialized');
        
        // Always use card element for now
        this.setupCardElement();
        
    } catch (error) {
        console.error('❌ Stripe setup error:', error);
        showNotification('Payment system initialization failed. Please refresh.', 'error');
    }
}
    
    async fetchPaymentMethodsConfig() {
    // Simple hardcoded config - remove API call
    return {
        card: true,
        googlePay: true,
        applePay: true,
        bankTransfer: false, // Disable for now
        link: false, // Disable for now
        paypal: false // Disable for now
    };
}
    
    getEnabledPaymentMethods(config) {
        const methods = [];
        
        if (config.card) methods.push('card');
       // if (config.googlePay) methods.push('google_pay');//
        //if (config.applePay) methods.push('apple_pay');//
        if (config.bankTransfer) methods.push('bacs_debit');
        if (config.link) methods.push('link');
        if (config.paypal) methods.push('paypal');
        
        return methods;
    }
    
    shouldUsePaymentElement(config) {
    return false; // Always use simple card element for now
}
    
    setupPaymentElement(elementsOptions) {
        const container = document.getElementById('stripe-payment-element');
        if (!container) {
            console.error('Payment element container not found');
            return;
        }
        
        container.innerHTML = '';
        
        this.elements = this.stripe.elements(elementsOptions);
        this.paymentElement = this.elements.create('payment', elementsOptions);
        this.paymentElement.mount('#stripe-payment-element');
        
        this.paymentElement.on('change', (event) => {
            const displayError = document.getElementById('stripe-payment-errors');
            if (displayError) {
                if (event.error) {
                    displayError.textContent = event.error.message;
                    displayError.style.display = 'block';
                } else {
                    displayError.style.display = 'none';
                }
            }
        });
        
        const checkoutBtn = document.getElementById('stripeCheckoutBtn');
        if (checkoutBtn) {
            const newBtn = checkoutBtn.cloneNode(true);
            checkoutBtn.parentNode.replaceChild(newBtn, checkoutBtn);
            newBtn.addEventListener('click', (e) => this.handlePaymentWithElement(e));
        }
    }
    
    setupCardElement() {
    const container = document.getElementById('stripe-card-element');
    if (!container) {
        console.error('❌ Card element container not found!');
        return;
    }
    
    // Make sure container is visible
    container.style.display = 'block';
    container.innerHTML = '<div class="loading-payment">Loading payment form...</div>';
    
    // Wait a bit for DOM
    setTimeout(() => {
        try {
            this.elements = this.stripe.elements();
            
            const style = {
                base: {
                    color: '#32325d',
                    fontFamily: '"Poppins", "Helvetica Neue", Helvetica, sans-serif',
                    fontSmoothing: 'antialiased',
                    fontSize: '16px',
                    '::placeholder': { color: '#aab7c4' }
                },
                invalid: { color: '#e74c3c', iconColor: '#e74c3c' }
            };
            
            this.cardElement = this.elements.create('card', { 
                style,
                hidePostalCode: true
            });
            
            this.cardElement.mount('#stripe-card-element');
            
            this.cardElement.on('change', (event) => {
                const errors = document.getElementById('stripe-card-errors');
                if (errors) {
                    if (event.error) {
                        errors.textContent = event.error.message;
                        errors.style.display = 'block';
                    } else {
                        errors.style.display = 'none';
                    }
                }
            });
            
            console.log('✅ Card element mounted successfully');
            
        } catch (error) {
            console.error('❌ Card element setup error:', error);
            showNotification('Payment form failed to load. Please refresh.', 'error');
        }
    }, 100);

    
    const checkoutBtn = document.getElementById('stripeCheckoutBtn');
    if (checkoutBtn) {
        const newBtn = checkoutBtn.cloneNode(true);
        checkoutBtn.parentNode.replaceChild(newBtn, checkoutBtn);
        newBtn.addEventListener('click', (e) => this.handlePaymentWithCard(e));
    }
}
    
    async handlePaymentWithElement(event) {
        event.preventDefault();
        
        if (this.isProcessing) return;
        
        try {
            this.isProcessing = true;
            const checkoutBtn = document.getElementById('stripeCheckoutBtn');
            if (checkoutBtn) {
                checkoutBtn.innerHTML = '<div class="stripe-loading"></div> Processing...';
                checkoutBtn.disabled = true;
            }
            
            if (!this.validateForm()) {
                throw new Error('Please fill in all required fields');
            }
            
            const formData = this.getFormData();
            const cart = cartManager.getCart();
            const totalAmount = cartManager.getSubtotal();
            
            if (cart.length === 0) {
                throw new Error('Your cart is empty');
            }
            
            const response = await fetch(`${API_BASE_URL}/payment/create-payment-intent`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: Math.round(totalAmount * 100),
                    cart: cart,
                    email: formData.email,
                    userId: authService.isLoggedIn() ? authService.getCurrentUser()._id : 'guest',
                    shippingAddress: {
                        fullName: formData.fullName,
                        address: formData.address,
                        city: formData.city,
                        postalCode: formData.zipCode,
                        country: formData.country
                    },
                    paymentMethodTypes: this.getEnabledPaymentMethods(await this.fetchPaymentMethodsConfig())
                })
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Payment setup failed');
            }
            
            this.clientSecret = data.clientSecret;
            this.orderId = data.orderId;
            
            const { error: confirmError } = await this.stripe.confirmPayment({
                elements: this.elements,
                clientSecret: this.clientSecret,
                confirmParams: {
                    return_url: `${window.location.origin}#success`,
                    payment_method_data: {
                        billing_details: {
                            name: formData.fullName,
                            email: formData.email,
                            address: {
                                line1: formData.address,
                                city: formData.city,
                                postal_code: formData.zipCode,
                                country: formData.country
                            }
                        }
                    }
                },
                redirect: 'if_required'
            });
            
            if (confirmError) {
                throw new Error(confirmError.message);
            }
            
            await this.confirmPaymentWithBackend();
            this.showSuccess();
            
        } catch (error) {
            console.error('Payment error:', error);
            this.showError(error.message);
        } finally {
            this.isProcessing = false;
            const checkoutBtn = document.getElementById('stripeCheckoutBtn');
            if (checkoutBtn) {
                checkoutBtn.innerHTML = '<i class="fas fa-lock"></i> Pay Now';
                checkoutBtn.disabled = false;
            }
        }
    }
    
    async handlePaymentWithCard(event) {
        event.preventDefault();
        
        if (this.isProcessing) return;
        
        try {
            this.isProcessing = true;
            const checkoutBtn = document.getElementById('stripeCheckoutBtn');
            if (checkoutBtn) {
                checkoutBtn.innerHTML = '<div class="stripe-loading"></div> Processing...';
                checkoutBtn.disabled = true;
            }
            
            if (!this.validateForm()) {
                throw new Error('Please fill in all required fields');
            }
            
            const formData = this.getFormData();
            const cart = cartManager.getCart();
            const totalAmount = cartManager.getSubtotal();
            
            if (cart.length === 0) {
                throw new Error('Your cart is empty');
            }
            
            const response = await fetch(`${API_BASE_URL}/payment/create-payment-intent`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: Math.round(totalAmount * 100),
                    cart: cart,
                    email: formData.email,
                    userId: authService.isLoggedIn() ? authService.getCurrentUser()._id : 'guest',
                    shippingAddress: {
                        fullName: formData.fullName,
                        address: formData.address,
                        city: formData.city,
                        postalCode: formData.zipCode,
                        country: formData.country
                    }
                })
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Payment setup failed');
            }
            
            const result = await this.stripe.confirmCardPayment(data.clientSecret, {
                payment_method: {
                    card: this.cardElement,
                    billing_details: {
                        name: formData.fullName,
                        email: formData.email,
                        address: {
                            line1: formData.address,
                            city: formData.city,
                            postal_code: formData.zipCode,
                            country: formData.country
                        }
                    }
                }
            });
            
            if (result.error) {
                throw new Error(result.error.message);
            }
            
            await this.confirmPaymentWithBackend(result.paymentIntent.id);
            this.showSuccess();
            
        } catch (error) {
            console.error('Payment error:', error);
            this.showError(error.message);
        } finally {
            this.isProcessing = false;
            const checkoutBtn = document.getElementById('stripeCheckoutBtn');
            if (checkoutBtn) {
                checkoutBtn.innerHTML = '<i class="fas fa-lock"></i> Pay Now';
                checkoutBtn.disabled = false;
            }
        }
    }
    
    getFormData() {
        return {
            fullName: document.getElementById('fullName').value,
            email: document.getElementById('email').value,
            address: document.getElementById('address').value,
            city: document.getElementById('city').value,
            zipCode: document.getElementById('zipCode').value,
            country: document.getElementById('country').value
        };
    }
    
    async confirmPaymentWithBackend(paymentIntentId = null) {
        const response = await fetch(`${API_BASE_URL}/payment/confirm-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                paymentIntentId: paymentIntentId || this.clientSecret.split('_secret')[0],
                orderId: this.orderId
            })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Payment confirmation failed');
        }
        
        return data;
    }
    
    showSuccess() {
        showNotification('Payment successful! Order created.', 'success');
        showSuccessMessage();
        cartManager.clearCart();
        updateCart();
        this.resetForm();
    }
    
    showError(message) {
        showNotification('Payment failed: ' + message, 'error');
        
        const errors = document.getElementById('stripe-payment-errors') || 
                      document.getElementById('stripe-card-errors');
        if (errors) {
            errors.textContent = message;
            errors.style.display = 'block';
        }
    }
    
    validateForm() {
        const requiredFields = ['fullName', 'email', 'address', 'city', 'zipCode'];
        let isValid = true;
        
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field && !field.value.trim()) {
                isValid = false;
                field.style.borderColor = '#e74c3c';
            } else if (field) {
                field.style.borderColor = '#ddd';
            }
        });
        
        const country = document.getElementById('country');
        if (country && !country.value) {
            isValid = false;
            country.style.borderColor = '#e74c3c';
        } else if (country) {
            country.style.borderColor = '#ddd';
        }
        
        if (!isValid) {
            showNotification('Please fill in all required fields', 'error');
        }
        
        return isValid;
    }
    
    resetForm() {
        document.getElementById('fullName').value = '';
        document.getElementById('email').value = '';
        document.getElementById('address').value = '';
        document.getElementById('city').value = '';
        document.getElementById('zipCode').value = '';
        document.getElementById('country').value = '';
        
        if (this.paymentElement) {
            this.paymentElement.clear();
        }
        if (this.cardElement) {
            this.cardElement.clear();
        }
        
        const errors = document.getElementById('stripe-payment-errors') || 
                      document.getElementById('stripe-card-errors');
        if (errors) {
            errors.style.display = 'none';
        }
        
        this.clientSecret = null;
        this.orderId = null;
    }
}

let stripePayment = null;

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.hash === '#payment' || window.location.pathname.includes('payment')) {
        setTimeout(() => {
            initializeStripePayment();
        }, 500);
    }
});


function initializeStripePayment() {
    if (!stripePayment) {
        stripePayment = new StripePayment();
    }
}

// ==================== SIMPLIFIED DATA SYNC ====================
class DataSync {
    constructor() {
        this.BASE_URL = '/api'; // Fixed
        this.isOnline = navigator.onLine;
        console.log('🌐 Using API URL:', this.BASE_URL);
    }

    async syncProducts(filters = {}) {
    console.log('🔄 Loading local products...');
    return this.getLocalProducts();
}

    getLocalProducts() {
        // Your existing local products array
        return [
            { id: 1, name: "Hydrating Vitamin C Serum", description: "Brightens skin tone", price: 29.99, image: "image curology.jpeg", category: "serums", skinType: ["dry", "combination"], badge: "Bestseller", stockQuantity: 10 },
            { id: 2, name: "Nourishing Face Moisturizer", description: "Deeply hydrates", price: 24.99, image: "image curology.jpeg", category: "moisturizers", skinType: ["dry", "sensitive"], badge: "New", stockQuantity: 15 },
            { id: 3, name: "Gentle Foaming Cleanser", description: "Removes impurities", price: 18.99, image: "image curology.jpeg", category: "cleansers", skinType: ["all"], stockQuantity: 20 },
            { id: 4, name: "Revitalizing Eye Cream", description: "Reduces puffiness", price: 22.99, originalPrice: 27.99, image: "image curology.jpeg", category: "eye-care", skinType: ["dry", "combination"], stockQuantity: 8 },
            { id: 5, name: "Detoxifying Clay Mask", description: "Deep cleanses pores", price: 19.99, image: "image curology.jpeg", category: "masks", skinType: ["oily", "combination"], stockQuantity: 12 },
            { id: 6, name: "Hydrating Facial Mist", description: "Instantly refreshes", price: 16.99, image: "image curology.jpeg", category: "serums", skinType: ["dry", "sensitive"], stockQuantity: 25 },
            { id: 7, name: "Brightening Toner", description: "Balances pH", price: 21.99, image: "image curology.jpeg", category: "toners", skinType: ["dry", "combination"], stockQuantity: 18 },
            { id: 8, name: "Overnight Repair Cream", description: "Intensive nighttime", price: 34.99, image: "image curology.jpeg", category: "moisturizers", skinType: ["dry", "sensitive"], badge: "New", stockQuantity: 6 }
        ];
    }

    async syncFeaturedProducts() {
    try {
        const response = await fetch(`${this.BASE_URL}/products/featured`);
        const data = await response.json();
        
        console.log('📦 Featured API response:', data);
        
        if (data.success && Array.isArray(data.data)) {
            return data.data;
        }
        
        // Fallback to first 4 products
        return this.getLocalProducts().slice(0, 4);
        
    } catch (error) {
        console.error('Featured sync failed:', error);
        return this.getLocalProducts().slice(0, 4);
    }
}
}

const dataSync = new DataSync();

// ==================== CART FUNCTIONALITY ====================
const cartCount = document.querySelector('.cart-count');
const cartItems = document.getElementById('cartItems');
const emptyCartMessage = document.getElementById('emptyCartMessage');
const cartSubtotal = document.getElementById('cartSubtotal');
const cartTotal = document.getElementById('cartTotal');
const checkoutBtn = document.getElementById('checkoutBtn');

function addToCart(id, name, price, image, stockQuantity = 999) {
    try {
        cartManager.addItem(id, name, price, image, stockQuantity);
        updateCart();
        
        showNotification(`${name} added to cart!`, 'success');
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

function removeFromCart(id) {
    cartManager.removeItem(id);
    updateCart();
}

function updateQuantity(id, newQuantity) {
    try {
        cartManager.updateQuantity(id, newQuantity);
        updateCart();
    } catch (error) {
        showNotification(error.message, 'error');
        updateCart();
    }
}

function clearCart() {
    cartManager.clearCart();
    updateCart();
}

function updateCart() {
    const cart = cartManager.getCart();
    const totalItems = cartManager.getTotalItems();
    const subtotal = cartManager.getSubtotal();
    
    if (cartCount) cartCount.textContent = totalItems;
    
    if (cartItems) {
        if (cart.length === 0) {
            emptyCartMessage.style.display = 'block';
            cartItems.innerHTML = '';
            cartItems.appendChild(emptyCartMessage);
        } else {
            emptyCartMessage.style.display = 'none';
            
            let cartHTML = '';
            
            cart.forEach(item => {
                const itemTotal = item.price * item.quantity;
                
                cartHTML += `
                    <div class="cart-item">
                        <div class="cart-item-image">
                            <img src="${item.image}" alt="${item.name}">
                        </div>
                        <div class="cart-item-details">
                            <h3>${item.name}</h3>
                            <p class="cart-item-price">£${item.price.toFixed(2)}</p>
                            <div class="cart-item-controls">
                                <div class="quantity-control">
                                    <button class="quantity-btn minus" data-id="${item.id}">-</button>
                                    <input type="number" class="quantity-input" value="${item.quantity}" min="1" max="${item.stockQuantity}" data-id="${item.id}">
                                    <button class="quantity-btn plus" data-id="${item.id}">+</button>
                                </div>
                                <button class="remove-item" data-id="${item.id}">Remove</button>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            cartItems.innerHTML = cartHTML;
            attachCartEventListeners();
        }
    }
    
    const total = subtotal;
    
    if (cartSubtotal) cartSubtotal.textContent = `£${subtotal.toFixed(2)}`;
    if (cartTotal) cartTotal.textContent = `£${total.toFixed(2)}`;
    
    updateOrderSummary(subtotal, total);
}

function attachCartEventListeners() {
    document.querySelectorAll('.quantity-btn.minus').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            const item = cartManager.getCart().find(item => item.id == id);
            if (item) updateQuantity(id, item.quantity - 1);
        });
    });
    
    document.querySelectorAll('.quantity-btn.plus').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            const item = cartManager.getCart().find(item => item.id == id);
            if (item) updateQuantity(id, item.quantity + 1);
        });
    });
    
    document.querySelectorAll('.quantity-input').forEach(input => {
        input.addEventListener('change', function() {
            const id = this.getAttribute('data-id');
            const newQuantity = parseInt(this.value);
            if (newQuantity >= 1) updateQuantity(id, newQuantity);
            else this.value = 1;
        });
    });
    
    document.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            removeFromCart(id);
        });
    });
}

// ==================== PAGE ELEMENTS ====================
const mainContent = document.getElementById('mainContent');
const catalogPage = document.getElementById('catalogPage');
const cartPage = document.getElementById('cartPage');
const paymentPage = document.getElementById('paymentPage');
const successMessage = document.getElementById('successMessage');
const productDetailPage = document.getElementById('productDetailPage');
const termsPage = document.getElementById('termsPage');
const cartLink = document.querySelector('.cart-link');
const homeLinks = document.querySelectorAll('.home-link');
const catalogLinks = document.querySelectorAll('.catalog-link');
const catalogGrid = document.getElementById('catalogGrid');
const pagination = document.getElementById('pagination');
const featuredCollections = document.querySelector('.collections');

// ==================== FILTER ELEMENTS ====================
const categoryFilter = document.getElementById('categoryFilter');
const skinTypeFilter = document.getElementById('skinTypeFilter');
const priceFilter = document.getElementById('priceFilter');
const productSearch = document.getElementById('productSearch');

// ==================== PAGINATION ====================
let currentPage = 1;
const productsPerPage = 8;

// ==================== HELPER FUNCTIONS ====================
function getCurrentFilters() {
    return {
        category: categoryFilter ? categoryFilter.value : 'all',
        skinType: skinTypeFilter ? skinTypeFilter.value : 'all',
        priceRange: priceFilter ? priceFilter.value : 'all',
        search: productSearch ? productSearch.value : ''
    };
}

// ==================== UPDATE attachProductEventListeners ====================
function attachProductEventListeners() {
    console.log('🔄 Attaching product event listeners...');
    
    // Only clone and replace the buttons, not the entire cards
    document.querySelectorAll('.add-to-cart').forEach(button => {
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
    });
    
    document.querySelectorAll('.wishlist').forEach(button => {
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
    });
    
    // Now attach fresh listeners to buttons only
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            
            const productId = this.getAttribute('data-id');
            const productName = this.getAttribute('data-name');
            const productPrice = parseFloat(this.getAttribute('data-price'));
            const productImage = this.getAttribute('data-image');
            const stockQuantity = parseInt(this.getAttribute('data-stock') || '999');
            
            console.log('🛒 Adding to cart:', productName);
            
            addToCart(productId, productName, productPrice, productImage, stockQuantity);
            
            // Visual feedback
            const clickedButton = this;
            clickedButton.textContent = 'Added!';
            clickedButton.style.backgroundColor = '#3a6548';
            clickedButton.disabled = true;
            
            setTimeout(() => {
                clickedButton.textContent = 'Add to Cart';
                clickedButton.style.backgroundColor = '#4a7c59';
                clickedButton.disabled = false;
            }, 1500);
        });
    });
    
    document.querySelectorAll('.wishlist').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            
            const icon = this.querySelector('i');
            if (icon.classList.contains('far')) {
                icon.classList.remove('far');
                icon.classList.add('fas');
                icon.style.color = '#e74c3c';
                showNotification('Added to wishlist!', 'success');
            } else {
                icon.classList.remove('fas');
                icon.classList.add('far');
                icon.style.color = '#777';
                showNotification('Removed from wishlist', 'info');
            }
        });
    });
    
    // Setup product card click listeners separately
    setupProductCardClickListeners();
    
    console.log('✅ Product event listeners attached');
}

function setupProductCardClickListeners() {
    console.log('🔄 Setting up product card click listeners...');
    
    document.querySelectorAll('.product-card').forEach(card => {
        // Don't clone the entire card - just add the listener
        card.addEventListener('click', function(e) {
            // Don't trigger if clicking on buttons
            if (e.target.closest('.add-to-cart') || e.target.closest('.wishlist')) {
                return;
            }
            
            // Get product data from the clicked card
            const productId = this.querySelector('.add-to-cart')?.getAttribute('data-id');
            const productName = this.querySelector('h3')?.textContent;
            
            console.log('🛍️ Product card clicked:', productName);
            
            // Show the product detail modal
            showProductDetailModal(this);
        });
    });
    
    console.log('✅ Product card listeners set up');
}

// ==================== FIXED PRODUCT CARD DISPLAY ====================
function attachProductClickListeners() {
    console.log('🔄 Setting up product card click listeners...');
    
    document.querySelectorAll('.product-card').forEach(card => {
        // Remove any existing listeners first
        const newCard = card.cloneNode(true);
        card.parentNode.replaceChild(newCard, card);
        
        newCard.addEventListener('click', function(e) {
            if (e.target.closest('.add-to-cart') || e.target.closest('.wishlist')) {
                return;
            }
            
            // Get product data from the clicked card
            const productId = this.querySelector('.add-to-cart')?.getAttribute('data-id');
            const productName = this.querySelector('h3')?.textContent;
            
            console.log('🛍️ Product card clicked:', productName);
            
            // Show the ACTUAL product detail modal instead of notification
            showProductDetailModal(this);
        });
    });
    
    console.log('✅ Product card listeners set up');
}

// ==================== ADD PRODUCT DETAIL MODAL ====================
function showProductDetailModal(productCard) {
    console.log('🔄 Opening product detail modal...');
    
    // Create modal if it doesn't exist
    let productModal = document.getElementById('productDetailModal');
    
    if (!productModal) {
        productModal = document.createElement('div');
        productModal.id = 'productDetailModal';
        productModal.className = 'modal';
        productModal.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 1000;
            justify-content: center;
            align-items: center;
        `;
        
        document.body.appendChild(productModal);
    }
    
    // Get product data from the card
    const productImage = productCard.querySelector('img')?.src || 'image curology.jpeg';
    const productName = productCard.querySelector('h3')?.textContent || 'Product';
    const productDescription = productCard.querySelector('p')?.textContent || 'No description available';
    const productPrice = productCard.querySelector('.price')?.textContent || '$0.00';
    const addToCartBtn = productCard.querySelector('.add-to-cart');
    const productId = addToCartBtn?.getAttribute('data-id');
    const productActualPrice = addToCartBtn?.getAttribute('data-price') || 0;
    const productImageUrl = addToCartBtn?.getAttribute('data-image') || 'image curology.jpeg';
    const stockQuantity = parseInt(addToCartBtn?.getAttribute('data-stock') || '999');
    
    // Create modal content
    productModal.innerHTML = `
        <div class="modal-content" style="
            background: white;
            padding: 30px;
            border-radius: 12px;
            max-width: 800px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
        ">
            <button class="close-modal" style="
                position: absolute;
                top: 15px;
                right: 15px;
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #666;
                z-index: 10;
            ">&times;</button>
            
            <div class="product-detail-container" style="
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 40px;
                align-items: start;
            ">
                <!-- Product Images -->
                <div class="product-images" style="
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                ">
                    <div class="main-image" style="
                        border-radius: 10px;
                        overflow: hidden;
                        background: #f9fafb;
                        height: 350px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">
                        <img src="${productImage}" alt="${productName}" style="
                            max-width: 100%;
                            max-height: 100%;
                            object-fit: contain;
                        ">
                    </div>
                </div>
                
                <!-- Product Info -->
                <div class="product-info" style="
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                ">
                    <div>
                        <h2 style="
                            font-size: 28px;
                            color: #1a202c;
                            margin-bottom: 10px;
                        ">${productName}</h2>
                        <p style="
                            color: #4a5568;
                            line-height: 1.6;
                            margin-bottom: 20px;
                        ">${productDescription}</p>
                    </div>
                    
                    <div class="product-price-section" style="
                        background: #f8fafc;
                        padding: 20px;
                        border-radius: 8px;
                    ">
                        <div class="price" style="
                            font-size: 32px;
                            font-weight: bold;
                            color: #4a7c59;
                            margin-bottom: 10px;
                        ">${productPrice}</div>
                        
                        ${stockQuantity > 0 ? `
                            <div class="stock-status" style="
                                color: #059669;
                                font-weight: 500;
                                margin-bottom: 20px;
                            ">
                                <i class="fas fa-check-circle"></i> In Stock (${stockQuantity} available)
                            </div>
                        ` : `
                            <div class="stock-status" style="
                                color: #dc2626;
                                font-weight: 500;
                                margin-bottom: 20px;
                            ">
                                <i class="fas fa-times-circle"></i> Out of Stock
                            </div>
                        `}
                        
                        <div class="product-actions" style="
                            display: flex;
                            gap: 15px;
                            flex-wrap: wrap;
                        ">
                            <button class="add-to-cart-btn" style="
                                flex: 1;
                                padding: 15px 30px;
                                background: linear-gradient(135deg, #4a7c59 0%, #3a6548 100%);
                                color: white;
                                border: none;
                                border-radius: 8px;
                                font-size: 16px;
                                font-weight: 600;
                                cursor: pointer;
                                transition: all 0.3s ease;
                                min-width: 200px;
                            " data-id="${productId}" 
                               data-name="${productName}" 
                               data-price="${productActualPrice}"
                               data-image="${productImageUrl}"
                               data-stock="${stockQuantity}"
                               ${stockQuantity === 0 ? 'disabled' : ''}>
                                ${stockQuantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                            </button>
                            
                            <button class="wishlist-btn" style="
                                padding: 15px 20px;
                                background: white;
                                border: 2px solid #e5e7eb;
                                border-radius: 8px;
                                color: #4b5563;
                                font-size: 16px;
                                font-weight: 600;
                                cursor: pointer;
                                transition: all 0.3s ease;
                            ">
                                <i class="far fa-heart"></i> Wishlist
                            </button>
                        </div>
                    </div>
                    
                    <div class="product-features" style="
                        padding: 20px;
                        background: #f8fafc;
                        border-radius: 8px;
                    ">
                        <h3 style="
                            font-size: 18px;
                            color: #1a202c;
                            margin-bottom: 15px;
                        ">Product Features</h3>
                        <ul style="
                            list-style: none;
                            padding: 0;
                            margin: 0;
                        ">
                            <li style="
                                padding: 8px 0;
                                color: #4b5563;
                                display: flex;
                                align-items: center;
                                gap: 10px;
                            ">
                                <i class="fas fa-check" style="color: #4a7c59;"></i>
                                Premium quality ingredients
                            </li>
                            <li style="
                                padding: 8px 0;
                                color: #4b5563;
                                display: flex;
                                align-items: center;
                                gap: 10px;
                            ">
                                <i class="fas fa-check" style="color: #4a7c59;"></i>
                                Suitable for all skin types
                            </li>
                            <li style="
                                padding: 8px 0;
                                color: #4b5563;
                                display: flex;
                                align-items: center;
                                gap: 10px;
                            ">
                                <i class="fas fa-check" style="color: #4a7c59;"></i>
                                100% satisfaction guarantee
                            </li>
                            
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Show modal
    productModal.style.display = 'flex';
    
    // Add event listeners
    const closeBtn = productModal.querySelector('.close-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            productModal.style.display = 'none';
        });
    }
    
    // Close modal when clicking outside
    productModal.addEventListener('click', (e) => {
        if (e.target === productModal) {
            productModal.style.display = 'none';
        }
    });
    
    // Add to cart functionality in modal
    const modalAddToCartBtn = productModal.querySelector('.add-to-cart-btn');
    if (modalAddToCartBtn) {
        modalAddToCartBtn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            const name = this.getAttribute('data-name');
            const price = parseFloat(this.getAttribute('data-price'));
            const image = this.getAttribute('data-image');
            const stock = parseInt(this.getAttribute('data-stock'));
            
            addToCart(id, name, price, image, stock);
            
            // Visual feedback
            this.innerHTML = '<i class="fas fa-check"></i> Added!';
            this.style.backgroundColor = '#3a6548';
            
            setTimeout(() => {
                productModal.style.display = 'none';
            }, 1000);
        });
    }
    
    // Wishlist functionality in modal
    const wishlistBtn = productModal.querySelector('.wishlist-btn');
    if (wishlistBtn) {
        wishlistBtn.addEventListener('click', function() {
            const icon = this.querySelector('i');
            if (icon.classList.contains('far')) {
                icon.classList.remove('far');
                icon.classList.add('fas');
                icon.style.color = '#e74c3c';
                showNotification('Added to wishlist!', 'success');
            } else {
                icon.classList.remove('fas');
                icon.classList.add('far');
                icon.style.color = '#4b5563';
                showNotification('Removed from wishlist', 'info');
            }
        });
    }
    
    console.log('✅ Product detail modal opened');
}

function filterLocalProducts(products) {
    const category = categoryFilter ? categoryFilter.value : 'all';
    const skinType = skinTypeFilter ? skinTypeFilter.value : 'all';
    const priceRange = priceFilter ? priceFilter.value : 'all';
    const searchTerm = productSearch ? productSearch.value.toLowerCase() : '';
    
    return products.filter(product => {
        if (category !== 'all' && product.category !== category) return false;
        if (skinType !== 'all' && !product.skinType.includes(skinType)) return false;
        if (priceRange !== 'all') {
            if (priceRange === 'under20' && product.price >= 20) return false;
            if (priceRange === '20to40' && (product.price < 20 || product.price > 40)) return false;
            if (priceRange === 'over40' && product.price <= 40) return false;
        }
        if (searchTerm && !product.name.toLowerCase().includes(searchTerm) && 
            !product.description.toLowerCase().includes(searchTerm)) return false;
        return true;
    });
}

function displayFallbackProducts(filteredProducts, page) {
    currentPage = page;
    const startIndex = (page - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
    
    if (catalogGrid) {
        catalogGrid.innerHTML = '';
        
        if (paginatedProducts.length === 0) {
            catalogGrid.innerHTML = '<p class="no-products">No products found matching your criteria.</p>';
            if (pagination) pagination.innerHTML = '';
            return;
        }
        
        paginatedProducts.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            
            const saleClass = product.originalPrice ? 'sale' : '';
            const badgeHTML = product.badge ? `<div class="product-badge">${product.badge}</div>` : '';
            const originalPriceHTML = product.originalPrice ? `<span class="original-price">£${product.originalPrice.toFixed(2)}</span>` : '';
            const stockStatus = product.stockQuantity === 0 ? 
                '<div class="out-of-stock-badge">Out of Stock</div>' : 
                (product.stockQuantity < 5 ? `<div class="low-stock-badge">Low Stock</div>` : '');
            
            productCard.innerHTML = `
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}">
                    ${badgeHTML}
                    ${stockStatus}
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p>${product.description}</p>
                    <p class="price ${saleClass}">£${product.price.toFixed(2)} ${originalPriceHTML}</p>
                    ${product.stockQuantity ? `<p class="stock-info">${product.stockQuantity} in stock</p>` : ''}
                    <div class="product-actions">
                        <button class="cta-button small add-to-cart" 
                            data-id="${product.id}" 
                            data-name="${product.name}" 
                            data-price="${product.price}" 
                            data-image="${product.image}"
                            data-stock="${product.stockQuantity}"
                            ${product.stockQuantity === 0 ? 'disabled' : ''}>
                            ${product.stockQuantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                        <button class="wishlist"><i class="far fa-heart"></i></button>
                    </div>
                </div>
            `;
            
            catalogGrid.appendChild(productCard);
        });
        
        attachProductEventListeners();
        updatePagination(filteredProducts.length, page);
    }
}

// ==================== FIXED FEATURED PRODUCTS FUNCTION ====================
async function displayFeaturedProducts() {
    console.log('⭐ Loading featured products (local mode)...');
    displayFeaturedProductsDirectly(products.slice(0, 4));
}

function displayFeaturedProductsDirectly(featuredProducts) {
    const featuredContainer = document.querySelector('.collections');
    if (!featuredContainer) {
        console.log('❌ Featured container not found');
        return;
    }
    
    // Clear and create grid
    featuredContainer.innerHTML = '<h2 class="section-title">Featured Collections</h2>';
    
    if (!featuredProducts || featuredProducts.length === 0) {
        featuredContainer.innerHTML += `
            <div style="text-align: center; padding: 40px;">
                <p>No featured products available.</p>
                <a href="#" class="btn catalog-link">Browse All Products</a>
            </div>
        `;
        return;
    }
    
    const featuredGrid = document.createElement('div');
    featuredGrid.className = 'product-grid';
    
    // Add each product
    featuredProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        
        // Handle missing properties safely
        const productImage = product.image || 'image curology.jpeg';
        const productName = product.name || 'Product';
        const productDescription = product.description || 'No description available';
        const productPrice = product.price || 0;
        const productId = product.id || product._id || Date.now();
        const badge = product.badge || '';
        const stockQuantity = product.stockQuantity || product.stock || 10;
        const isOutOfStock = product.inStock === false || stockQuantity === 0;
        
        const badgeHTML = badge ? `<div class="product-badge">${badge}</div>` : '';
        const stockStatus = isOutOfStock ? 
            '<div class="out-of-stock-badge">Out of Stock</div>' : 
            (stockQuantity < 5 ? `<div class="low-stock-badge">Low Stock</div>` : '');
        
        productCard.innerHTML = `
            <div class="product-image">
                <img src="${productImage}" alt="${productName}" onerror="this.src='image curology.jpeg'">
                ${badgeHTML}
                ${stockStatus}
            </div>
            <div class="product-info">
                <h3>${productName}</h3>
                <p>${productDescription.substring(0, 80)}${productDescription.length > 80 ? '...' : ''}</p>
                <p class="price">€${productPrice.toFixed(2)}</p>
                ${stockQuantity ? `<p class="stock-info">${stockQuantity} in stock</p>` : ''}
                <div class="product-actions">
                    <button class="cta-button small add-to-cart" 
                        data-id="${productId}" 
                        data-name="${productName}" 
                        data-price="${productPrice}" 
                        data-image="${productImage}"
                        data-stock="${stockQuantity}"
                        ${isOutOfStock ? 'disabled' : ''}>
                        ${isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                    <button class="wishlist"><i class="far fa-heart"></i></button>
                </div>
            </div>
        `;
        
        featuredGrid.appendChild(productCard);
    });
    
    featuredContainer.appendChild(featuredGrid);
    
    // Re-attach event listeners
    setTimeout(() => {
        attachProductEventListeners();
    }, 100);
}

// ==================== CORE FUNCTIONS ====================
function initCatalog() {
    displayProducts();
    setupFilters();
}

async function displayProducts(productsToDisplay = null, page = 1) {
    try {
        let productsData;
        
        if (productsToDisplay) {
            productsData = productsToDisplay;
        } else {
            productsData = await dataSync.syncProducts(getCurrentFilters());
        }
        
        currentPage = page;
        const startIndex = (page - 1) * productsPerPage;
        const endIndex = startIndex + productsPerPage;
        const paginatedProducts = productsData.slice(startIndex, endIndex);
        
        if (catalogGrid) {
            catalogGrid.innerHTML = '';
            
            if (paginatedProducts.length === 0) {
                catalogGrid.innerHTML = '<p class="no-products">No products found matching your criteria.</p>';
                if (pagination) pagination.innerHTML = '';
                return;
            }
            
            paginatedProducts.forEach(product => {
                const productCard = document.createElement('div');
                productCard.className = 'product-card';
                
                const saleClass = product.originalPrice ? 'sale' : '';
                const badgeHTML = product.badge ? `<div class="product-badge">${product.badge}</div>` : '';
                const originalPriceHTML = product.originalPrice ? `<span class="original-price">£${product.originalPrice.toFixed(2)}</span>` : '';
                const stockStatus = product.stockQuantity === 0 ? 
                    '<div class="out-of-stock-badge">Out of Stock</div>' : 
                    (product.stockQuantity < 5 ? `<div class="low-stock-badge">Low Stock</div>` : '');
                
                productCard.innerHTML = `
                    <div class="product-image">
                        <img src="${product.image}" alt="${product.name}">
                        ${badgeHTML}
                        ${stockStatus}
                    </div>
                    <div class="product-info">
                        <h3>${product.name}</h3>
                        <p>${product.description}</p>
                        <p class="price ${saleClass}">£${product.price.toFixed(2)} ${originalPriceHTML}</p>
                        ${product.stockQuantity ? `<p class="stock-info">${product.stockQuantity} in stock</p>` : ''}
                        <div class="product-actions">
                            <button class="cta-button small add-to-cart" 
                                data-id="${product.id}" 
                                data-name="${product.name}" 
                                data-price="${product.price}" 
                                data-image="${product.image}"
                                data-stock="${product.stockQuantity}"
                                ${product.stockQuantity === 0 ? 'disabled' : ''}>
                                ${product.stockQuantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                            </button>
                            <button class="wishlist"><i class="far fa-heart"></i></button>
                        </div>
                    </div>
                `;
                
                catalogGrid.appendChild(productCard);
            });
            
            // Call both functions
            attachProductEventListeners();
            
            updatePagination(productsData.length, page);
        }
        
    } catch (error) {
        console.error('Error displaying products:', error);
        const cachedProducts = dataSync.getCachedProducts();
        const filteredProducts = filterLocalProducts(cachedProducts);
        displayFallbackProducts(filteredProducts, page);
    }
}

function updatePagination(totalProducts, currentPage) {
    const totalPages = Math.ceil(totalProducts / productsPerPage);
    
    if (pagination) {
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }
        
        let paginationHTML = '';
        
        if (currentPage > 1) {
            paginationHTML += `<button class="pagination-btn" data-page="${currentPage - 1}">Previous</button>`;
        }
        
        for (let i = 1; i <= totalPages; i++) {
            if (i === currentPage) {
                paginationHTML += `<button class="pagination-btn active" data-page="${i}">${i}</button>`;
            } else {
                paginationHTML += `<button class="pagination-btn" data-page="${i}">${i}</button>`;
            }
        }
        
        if (currentPage < totalPages) {
            paginationHTML += `<button class="pagination-btn" data-page="${currentPage + 1}">Next</button>`;
        }
        
        pagination.innerHTML = paginationHTML;
        
        document.querySelectorAll('.pagination-btn').forEach(button => {
    button.addEventListener('click', async function() {
        const page = parseInt(this.getAttribute('data-page'));
        const filters = getCurrentFilters();
        const filteredProducts = await dataSync.syncProducts(filters); // ← USE API
        displayProducts(filteredProducts, page);
    });
});
    }
}

function setupFilters() {
    if (categoryFilter) categoryFilter.addEventListener('change', applyFilters);
    if (skinTypeFilter) skinTypeFilter.addEventListener('change', applyFilters);
    if (priceFilter) priceFilter.addEventListener('change', applyFilters);
    if (productSearch) productSearch.addEventListener('input', applyFilters);
}

async function applyFilters() {
    showLoading();
    try {
        const filters = getCurrentFilters();
        const filteredProducts = await dataSync.syncProducts(filters);
        displayProducts(filteredProducts, 1);
    } catch (error) {
        console.error('Error applying filters:', error);
        const cachedProducts = dataSync.getCachedProducts();
        const filteredProducts = filterLocalProducts(cachedProducts);
        displayProducts(filteredProducts, 1);
    } finally {
        hideLoading();
    }
}

function filterProducts() {
    const category = categoryFilter ? categoryFilter.value : 'all';
    const skinType = skinTypeFilter ? skinTypeFilter.value : 'all';
    const priceRange = priceFilter ? priceFilter.value : 'all';
    const searchTerm = productSearch ? productSearch.value.toLowerCase() : '';
    
    return products.filter(product => {
        if (category !== 'all' && product.category !== category) return false;
        if (skinType !== 'all' && !product.skinType.includes(skinType)) return false;
        if (priceRange !== 'all') {
            if (priceRange === 'under20' && product.price >= 20) return false;
            if (priceRange === '20to40' && (product.price < 20 || product.price > 40)) return false;
            if (priceRange === 'over40' && product.price <= 40) return false;
        }
        if (searchTerm && !product.name.toLowerCase().includes(searchTerm) && 
            !product.description.toLowerCase().includes(searchTerm)) return false;
        return true;
    });
}

function updateOrderSummary(subtotal, total) {
    const orderSubtotal = document.getElementById('orderSubtotal');
    const orderTotal = document.getElementById('orderTotal');
    const orderItems = document.getElementById('orderItems');
    
    if (orderSubtotal) orderSubtotal.textContent = `£${subtotal.toFixed(2)}`;
    if (orderTotal) orderTotal.textContent = `£${total.toFixed(2)}`;
    
    if (orderItems) {
        let orderItemsHTML = '';
        const cart = cartManager.getCart();
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            orderItemsHTML += `
                <div class="order-summary-item">
                    <div>
                        <h4>${item.name}</h4>
                        <p>Qty: ${item.quantity}</p>
                    </div>
                    <span>€${itemTotal.toFixed(2)}</span>
                </div>
            `;
        });
        orderItems.innerHTML = orderItemsHTML;
    }
}

// ==================== NAVIGATION ====================
function setupNavigation() {
    if (cartLink) {
        cartLink.addEventListener('click', function(e) {
            e.preventDefault();
            showCartPage();
        });
    }

    homeLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            showMainPage();
        });
    });

    catalogLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const linkText = link.textContent.trim();
            
            if (linkText.includes('Explore Collections') || linkText.includes('Explore Collection')) {
                if (pageStateManager.getCurrentPage() === 'home') {
                    document.querySelector('.collections').scrollIntoView({ behavior: 'smooth' });
                } else {
                    showMainPage();
                    setTimeout(() => {
                        document.querySelector('.collections').scrollIntoView({ behavior: 'smooth' });
                    }, 500);
                }
            } else {
                showCatalogPage();
            }
        });
    });

    document.querySelectorAll('a[href="#contact"]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            scrollToContact();
        });
    });

    document.querySelectorAll('a[href="#about"]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            scrollToAbout();
        });
    });

    document.querySelectorAll('a[href="#"]').forEach(link => {
        if (link.textContent.includes('Shipping Policy')) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                showTermsPage('shipping');
            });
        }
        if (link.textContent.includes('Returns & Exchanges')) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                showTermsPage('returns');
            });
        }
    });

    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });

        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
            });
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.nav-links') && !e.target.closest('.hamburger')) {
                navLinks.classList.remove('active');
            }
        });
    }
}

function scrollToContact() {
    if (pageStateManager.getCurrentPage() === 'home') {
        const contactSection = document.querySelector('.contact-section, [id="contact"]');
        if (contactSection) {
            contactSection.scrollIntoView({ behavior: 'smooth' });
        }
    } else {
        showMainPage();
    }
}

function scrollToAbout() {
    if (pageStateManager.getCurrentPage() === 'home') {
        const aboutSection = document.querySelector('.about-section, [id="about"]');
        if (aboutSection) {
            aboutSection.scrollIntoView({ behavior: 'smooth' });
        }
    } else {
        showMainPage();
    }
}

function setupHomePageCartButtons() {
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            const productName = this.getAttribute('data-name');
            const productPrice = parseFloat(this.getAttribute('data-price'));
            const productImage = this.getAttribute('data-image');
            const stockQuantity = parseInt(this.getAttribute('data-stock') || '999');
            
            addToCart(productId, productName, productPrice, productImage, stockQuantity);
            
            const clickedButton = this;
            clickedButton.textContent = 'Added!';
            clickedButton.style.backgroundColor = '#3a6548';
            setTimeout(() => {
                clickedButton.textContent = 'Add to Cart';
                clickedButton.style.backgroundColor = '#4a7c59';
            }, 1500);
        });
    });
    
    document.querySelectorAll('.wishlist').forEach(button => {
        button.addEventListener('click', function() {
            const icon = this.querySelector('i');
            if (icon.classList.contains('far')) {
                icon.classList.remove('far');
                icon.classList.add('fas');
                icon.style.color = '#e74c3c';
            } else {
                icon.classList.remove('fas');
                icon.classList.add('far');
                icon.style.color = '#777';
            }
        });
    });
}

// ==================== PAGE MANAGEMENT ====================
function showMainPage() {
    if (mainContent) mainContent.style.display = 'block';
    if (catalogPage) catalogPage.style.display = 'none';
    if (cartPage) cartPage.style.display = 'none';
    if (paymentPage) paymentPage.style.display = 'none';
    if (successMessage) successMessage.style.display = 'none';
    if (productDetailPage) productDetailPage.style.display = 'none';
    if (termsPage) termsPage.style.display = 'none';
    pageStateManager.setCurrentPage('home');
    
    setTimeout(setupContactForm, 100);
    window.history.pushState({ page: 'home' }, '', '/');
}

function showCatalogPage() {
    if (mainContent) mainContent.style.display = 'none';
    if (catalogPage) catalogPage.style.display = 'block';
    if (cartPage) cartPage.style.display = 'none';
    if (paymentPage) paymentPage.style.display = 'none';
    if (successMessage) successMessage.style.display = 'none';
    if (productDetailPage) productDetailPage.style.display = 'none';
    if (termsPage) termsPage.style.display = 'none';
    pageStateManager.setCurrentPage('catalog');
    initCatalog();
    window.history.pushState({ page: 'catalog' }, '', '/products');
}

function showCartPage() {
    if (mainContent) mainContent.style.display = 'none';
    if (catalogPage) catalogPage.style.display = 'none';
    if (cartPage) cartPage.style.display = 'block';
    if (paymentPage) paymentPage.style.display = 'none';
    if (successMessage) successMessage.style.display = 'none';
    if (productDetailPage) productDetailPage.style.display = 'none';
    if (termsPage) termsPage.style.display = 'none';
    pageStateManager.setCurrentPage('cart');
    window.history.pushState({ page: 'cart' }, '', '/cart');
}

function showPaymentPage() {
    
     if (stripePayment) {
        stripePayment = null; // Reset Stripe
    }
    setTimeout(() => {
        initializeStripePayment(); // Reinitialize
    }, 100);

    if (mainContent) mainContent.style.display = 'none';
    if (catalogPage) catalogPage.style.display = 'none';
    if (cartPage) cartPage.style.display = 'none';
    if (paymentPage) paymentPage.style.display = 'block';
    if (successMessage) successMessage.style.display = 'none';
    if (productDetailPage) productDetailPage.style.display = 'none';
    if (termsPage) termsPage.style.display = 'none';
    pageStateManager.setCurrentPage('payment');
    
    updateOrderSummary(cartManager.getSubtotal(), cartManager.getSubtotal());
    
    setTimeout(() => {
        if (typeof Stripe !== 'undefined' && stripePayment === null) {
            initializeStripePayment();
        } else if (stripePayment === null) {
            const checkStripe = setInterval(() => {
                if (typeof Stripe !== 'undefined') {
                    initializeStripePayment();
                    clearInterval(checkStripe);
                }
            }, 100);
        }
    }, 100);
}

function showSuccessMessage() {
    if (mainContent) mainContent.style.display = 'none';
    if (catalogPage) catalogPage.style.display = 'none';
    if (cartPage) cartPage.style.display = 'none';
    if (paymentPage) paymentPage.style.display = 'none';
    if (successMessage) successMessage.style.display = 'block';
    if (productDetailPage) productDetailPage.style.display = 'none';
    if (termsPage) termsPage.style.display = 'none';
    pageStateManager.setCurrentPage('success');
    
    const orderId = 'RB-' + new Date().getFullYear() + '-' + Math.random().toString(36).substr(2, 8).toUpperCase();
    
    const orderIdElement = document.getElementById('dynamicOrderId');
    if (orderIdElement) {
        orderIdElement.textContent = orderId;
    }
}

// ==================== TERMS PAGE FUNCTION ====================
function showTermsPage(type = 'shipping') {
    if (mainContent) mainContent.style.display = 'none';
    if (catalogPage) catalogPage.style.display = 'none';
    if (cartPage) cartPage.style.display = 'none';
    if (paymentPage) paymentPage.style.display = 'none';
    if (successMessage) successMessage.style.display = 'none';
    if (productDetailPage) productDetailPage.style.display = 'none';
    if (termsPage) termsPage.style.display = 'block';
    
    pageStateManager.setCurrentPage('terms');
    
    const termsContent = document.getElementById('termsContent');
    if (termsContent) {
        if (type === 'shipping') {
            termsContent.innerHTML = `
                <h2>Shipping Policy</h2>
                <div class="terms-content">
                    <h3>Delivery Times</h3>
                    <p>We aim to process and ship all orders within 1-2 business days. Standard shipping typically takes 3-5 business days.</p>
                    
                    <h3>Shipping Rates</h3>
                    <ul>
                        <li>Standard Shipping: €4.99 (Free on orders over €50)</li>
                        <li>Express Shipping: €9.99 (2-3 business days)</li>
                        <li>Next Day Delivery: €14.99 (Order before 2pm)</li>
                    </ul>
                    
                    <h3>International Shipping</h3>
                    <p>We currently ship to most European countries. International shipping rates and delivery times vary by location.</p>
                    
                    <h3>Order Tracking</h3>
                    <p>You will receive a tracking number via email once your order has been shipped.</p>
                </div>
            `;
        } else if (type === 'returns') {
            termsContent.innerHTML = `
                <h2>Returns & Exchanges</h2>
                <div class="terms-content">
                    <h3>Return Policy</h3>
                    <p>We offer a 30-day return policy from the date of delivery. Items must be unused, unopened, and in their original packaging.</p>
                    
                    <h3>How to Return</h3>
                    <ol>
                        <li>Contact our customer service team at support@roibeauty.com</li>
                        <li>We'll provide you with a return authorization and shipping label</li>
                        <li>Package your items securely and attach the return label</li>
                        <li>Drop off at your nearest post office</li>
                    </ol>
                    
                    <h3>Refund Processing</h3>
                    <p>Refunds will be processed within 5-7 business days after we receive your return. The original shipping cost is non-refundable.</p>
                    
                    <h3>Exchanges</h3>
                    <p>We're happy to exchange items for a different product or size. Please contact us within 14 days of delivery.</p>
                    
                    <h3>Damaged or Defective Items</h3>
                    <p>If you receive a damaged or defective product, please contact us immediately at support@roibeauty.com with photos of the issue.</p>
                </div>
            `;
        }
        
        const backButton = document.createElement('button');
        backButton.className = 'btn back-btn';
        backButton.innerHTML = '<i class="fas fa-arrow-left"></i> Back to Previous Page';
        backButton.style.marginTop = '20px';
        backButton.addEventListener('click', () => {
            const previousPage = pageStateManager.getCurrentPage();
            if (previousPage === 'catalog') {
                showCatalogPage();
            } else if (previousPage === 'cart') {
                showCartPage();
            } else {
                showMainPage();
            }
        });
        
        termsContent.appendChild(backButton);
    }
}

// ==================== EVENT LISTENERS ====================
const profileBtn = document.getElementById('profileBtn');
const profileModal = document.getElementById('profileModal');

if (profileBtn && profileModal) {
    profileBtn.addEventListener('click', (e) => {
        e.preventDefault();
        profileModal.style.display = 'flex';
        if (authService.isLoggedIn()) {
            authService.showUserProfile();
        } else {
            authService.showAuthForms();
        }
    });
}

if (checkoutBtn) {
    checkoutBtn.addEventListener('click', function() {
        if (!authService.isLoggedIn()) {
            showNotification('Please log in to proceed with checkout.', 'error');
            profileModal.style.display = 'flex';
            authService.showAuthForms();
            document.querySelector('[data-tab="login"]').click();
            return;
        }
        showPaymentPage();
    });
}

function setupContactForm() {
    const contactForm = document.querySelector('.contact-form form');
    if (contactForm) {
        console.log('✅ Contact form found, setting up event listener');
        
        // Make sure form is visible
        contactForm.style.display = 'block';
        
        // Remove any existing form and replace with fresh one
        const parent = contactForm.parentElement;
        const newForm = contactForm.cloneNode(true);
        parent.replaceChild(newForm, contactForm);
        
        // Get fresh reference
        const freshContactForm = document.querySelector('.contact-form form');
        
        freshContactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('📧 Contact form submitted');
            authService.handleContactForm();
        });
        
        // Make sure all inputs are visible
        const inputs = freshContactForm.querySelectorAll('input, textarea, button');
        inputs.forEach(input => {
            input.style.display = 'block';
            input.style.width = '100%';
            input.style.marginBottom = '15px';
        });
        
    } else {
        console.log('❌ Contact form not found on this page');
        // Try to create it if it doesn't exist
        createContactFormIfMissing();
    }
}

// Add this function to create contact form if missing:
function createContactFormIfMissing() {
    const contactSection = document.querySelector('.contact-section, #contact');
    if (!contactSection) return;
    
    // Check if form already exists
    if (contactSection.querySelector('.contact-form')) return;
    
    const contactFormHTML = `
        <div class="contact-form">
            <h2>Get in Touch</h2>
            <p>Have questions? Send us a message!</p>
            <form>
                <div class="form-group">
                    <input type="text" id="contactName" placeholder="Your Name" required>
                </div>
                <div class="form-group">
                    <input type="email" id="contactEmail" placeholder="Your Email" required>
                </div>
                <div class="form-group">
                    <textarea id="contactMessage" placeholder="Your Message" rows="5" required></textarea>
                </div>
                <button type="submit" id="contactBtn" class="btn">Send Message</button>
            </form>
        </div>
    `;
    
    contactSection.innerHTML += contactFormHTML;
    
    // Set up the new form
    setTimeout(() => {
        setupContactForm();
    }, 100);
}

// ==================== UTILITY FUNCTIONS ====================
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `auth-message ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        padding: 12px 20px;
        border-radius: 5px;
        font-weight: 500;
        max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

function showLoading() {
    document.body.style.cursor = 'wait';
}

function hideLoading() {
    document.body.style.cursor = 'default';
}

// ==================== UPDATE initApp to ensure product cards work ====================
function initApp() {
    console.log('🚀 Initializing RoiBeautyEssence...');
    
    authService.updateUI();
    setupNavigation();
    
    // Remove setupHomePageCartButtons() call - it's redundant
    // setupHomePageCartButtons(); // REMOVE THIS LINE
    
    updateCart();
    
    // Load featured products
    if (document.querySelector('.collections')) {
        displayFeaturedProducts();
    }
    
    const savedPage = pageStateManager.getCurrentPage();
    if (savedPage === 'catalog') {
        showCatalogPage();
    } else if (savedPage === 'cart') {
        showCartPage();
    } else if (savedPage === 'payment') {
        showPaymentPage();
    } else {
        showMainPage();
    }
    
    console.log('✅ RoiBeautyEssence initialized successfully');
    console.log('📊 Cart items loaded:', cartManager.getCart().length);
}

// ==================== EMERGENCY FALLBACK ====================
function ensureProductsAlwaysAvailable() {
    const hasCachedProducts = localStorage.getItem('roibeauty_cachedProducts');
    const hasFallbackProducts = products && products.length > 0;
    
    if (!hasCachedProducts && hasFallbackProducts) {
        console.log('⚠️ No cached products found, caching fallback products');
        localStorage.setItem('roibeauty_cachedProducts', JSON.stringify(products));
    }
}

document.addEventListener('DOMContentLoaded', function() {
    ensureProductsAlwaysAvailable();
    initApp();
});

// Handle browser back/forward buttons
window.addEventListener('popstate', function(event) {
    const state = event.state;
    if (!state || !state.page) {
        showMainPage();
        return;
    }
    
    switch(state.page) {
        case 'catalog':
            showCatalogPage();
            break;
        case 'cart':
            showCartPage();
            break;
        case 'payment':
            showPaymentPage();
            break;
        default:
            showMainPage();
    }
});

// Add this function to convert all € to £ on page load
function convertCurrencyToPounds() {
    // Function to recursively replace text in nodes
    function replaceTextInNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            // Replace € with £ in text nodes
            node.textContent = node.textContent.replace(/€/g, '£');
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            // Process child nodes
            node.childNodes.forEach(child => replaceTextInNode(child));
        }
    }
    
    // Start from body and replace all occurrences
    replaceTextInNode(document.body);
}

// Call it when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    convertCurrencyToPounds();
});