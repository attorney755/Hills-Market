// Main Application Controller
class MarketPlaceApp {
    constructor() {
        this.currentUser = null;
        this.currentPage = 'home';
        this.products = [];
        this.categories = [];
        
        // API configuration
        this.apiBaseUrls = [
            '/api',  // Same domain - for production
            'http://127.0.0.1:5000/api'  // Local development
        ];
        this.currentApiUrl = this.apiBaseUrls[0]; // Use same domain in production
        
        this.init();
    }
    

    async init() {
        await this.testApiConnection();
        this.setupEventListeners();
        this.checkAuthStatus();
        this.showPage('home');
        this.loadCategories();
        this.loadFeaturedProducts();
    }

    async testApiConnection() {
    console.log('🔍 Testing API connection...');
    
    for (const apiUrl of this.apiBaseUrls) {
        try {
            console.log(`Trying API URL: ${apiUrl}`);
            const response = await fetch(`${apiUrl}/health`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                mode: 'cors',
                credentials: 'omit'
            });
            
            if (response.ok) {
                this.currentApiUrl = apiUrl;
                console.log(`✅ API connection successful using: ${apiUrl}`);
                
                // Load products immediately after successful connection
                setTimeout(() => {
                    this.loadFeaturedProducts();
                    if (this.currentPage === 'products') {
                        this.productsManager.loadAllProducts(true);
                    }
                }, 1000);
                
                return;
            }
        } catch (error) {
            console.log(`❌ Failed with ${apiUrl}:`, error.message);
            continue;
        }
    }
    
    console.error('❌ All API connection attempts failed');
    this.showToast('Cannot connect to server. Please make sure the backend is running.', 'error');
}

    performSearch(searchTerm) {
    if (!searchTerm.trim()) {
        this.showPage('home');
        return;
    }
    
    this.showPage('products');
    
    const productsSearchInput = document.getElementById('search-input');
    if (productsSearchInput) {
        productsSearchInput.value = searchTerm;
    }
    
    setTimeout(() => {
        this.productsManager.loadAllProducts(true);
    }, 100);
}
clearSearch() {
    const navSearchInput = document.getElementById('nav-search-input');
    const productsSearchInput = document.getElementById('search-input');
    const mobileSearchInput = document.getElementById('mobile-search-input');
    
    if (navSearchInput) navSearchInput.value = '';
    if (productsSearchInput) productsSearchInput.value = '';
    if (mobileSearchInput) mobileSearchInput.value = '';
    
    // Return to home when search is cleared
    if (this.currentPage === 'products') {
        this.showPage('home');
    }
}


showMobileSearch() {
    const mobileSearchOverlay = document.getElementById('mobile-search-overlay');
    const mobileSearchInput = document.getElementById('mobile-search-input');
    
    if (mobileSearchOverlay) {
        mobileSearchOverlay.classList.add('active');
        if (mobileSearchInput) {
            mobileSearchInput.focus();
        }
    }
}

hideMobileSearch() {
    const mobileSearchOverlay = document.getElementById('mobile-search-overlay');
    const mobileSearchInput = document.getElementById('mobile-search-input');
    
    if (mobileSearchOverlay) {
        mobileSearchOverlay.classList.remove('active');
        if (mobileSearchInput) {
            mobileSearchInput.value = '';
        }
    }
}

performMobileSearch(searchTerm) {
    this.hideMobileSearch();
    
    if (!searchTerm.trim()) {
        this.showPage('home');
        return;
    }
    
    this.showPage('products');
    
    const productsSearchInput = document.getElementById('search-input');
    const navSearchInput = document.getElementById('nav-search-input');
    
    if (productsSearchInput) productsSearchInput.value = searchTerm;
    if (navSearchInput) navSearchInput.value = searchTerm;
    
    setTimeout(() => {
        this.productsManager.loadAllProducts(true);
    }, 100);
}

    setupEventListeners() {
    // Navigation - Fix hash routing
    document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const href = e.target.getAttribute('href');
        const page = href.substring(1);
        
        if (page === 'products') {
            this.clearSearch();
        }
        
        this.showPage(page);
        window.history.pushState(null, null, href);
    });
});

    // Also handle browser back/forward buttons
    window.addEventListener('popstate', (e) => {
        const page = window.location.hash.substring(1) || 'home';
        this.showPage(page);
    });

    // Auth buttons
    document.getElementById('login-btn').addEventListener('click', () => this.showModal('login-modal'));
    document.getElementById('register-btn').addEventListener('click', () => this.showModal('register-modal'));
    
    // Modal controls
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal').classList.remove('active');
        });
    });

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    // Auth modal switching
    document.getElementById('show-register').addEventListener('click', (e) => {
        e.preventDefault();
        this.hideModal('login-modal');
        this.showModal('register-modal');
    });

    document.getElementById('show-login').addEventListener('click', (e) => {
        e.preventDefault();
        this.hideModal('register-modal');
        this.showModal('login-modal');
    });

    // Hero buttons
    document.getElementById('browse-products-btn').addEventListener('click', () => {
        this.showPage('products');
    });

    document.getElementById('post-product-hero').addEventListener('click', () => {
        if (this.currentUser) {
            this.productsManager.showProductForm();
        } else {
            this.showToast('Please login to post products', 'warning');
            this.showModal('login-modal');
        }
    });

    // Coffee button
    document.getElementById('coffee-btn').addEventListener('click', () => {
        const info = document.getElementById('coffee-info');
        info.style.display = info.style.display === 'none' ? 'block' : 'none';
    });

    // Mobile menu toggle
    document.getElementById('nav-toggle').addEventListener('click', () => {
        document.getElementById('nav-menu').classList.toggle('active');
    });

    // Navigation search
    // Navigation search - BOTH input and button
// Mobile search functionality
const mobileSearchIcon = document.getElementById('mobile-search-icon');
if (mobileSearchIcon) {
    mobileSearchIcon.addEventListener('click', () => {
        this.showMobileSearch();
    });
}

const mobileSearchClose = document.getElementById('mobile-search-close');
if (mobileSearchClose) {
    mobileSearchClose.addEventListener('click', () => {
        this.hideMobileSearch();
    });
}

const mobileSearchInput = document.getElementById('mobile-search-input');
const mobileSearchBtn = document.getElementById('mobile-search-btn');

if (mobileSearchInput) {
    mobileSearchInput.addEventListener('input', (e) => {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.performMobileSearch(e.target.value);
        }, 500);
    });
    
    mobileSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            this.performMobileSearch(e.target.value);
        }
    });
}

if (mobileSearchBtn) {
    mobileSearchBtn.addEventListener('click', () => {
        const searchValue = mobileSearchInput?.value || '';
        this.performMobileSearch(searchValue);
    });
}

const navSearchInput = document.getElementById('nav-search-input');
const navSearchBtn = document.getElementById('nav-search-btn');

if (navSearchInput) {
    navSearchInput.addEventListener('input', (e) => {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.performSearch(e.target.value);
        }, 500);
    });
    
    navSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            this.performSearch(e.target.value);
        }
    });
}

if (navSearchBtn) {
    navSearchBtn.addEventListener('click', () => {
        const searchValue = navSearchInput?.value || '';
        this.performSearch(searchValue);
    });
}

    // Post product from navigation
    const postProductNav = document.getElementById('post-product-nav');
    if (postProductNav) {
        postProductNav.addEventListener('click', (e) => {
            e.preventDefault();
            if (this.currentUser) {
                this.productsManager.showProductForm();
            } else {
                this.showToast('Please login to post products', 'warning');
                this.showModal('login-modal');
            }
        });
    }

    // Contact form
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleContactForm();
        });
    }

    // Admin navigation
    document.addEventListener('click', (e) => {
        if (e.target.getAttribute('href') === '#admin' || 
            e.target.closest('[href="#admin"]')) {
            e.preventDefault();
            this.showPage('admin');
        }
    });

    // Handle initial page load from URL hash
    const initialPage = window.location.hash.substring(1) || 'home';
    this.showPage(initialPage);
}

showPage(page) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    // Show target section
    const targetSection = document.getElementById(page);
    if (targetSection) {
        targetSection.classList.add('active');
        this.currentPage = page;

        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${page}`) {
                link.classList.add('active');
            }
        });

        // Close mobile menu
        document.getElementById('nav-menu').classList.remove('active');

        // Load page-specific content
        this.loadPageContent(page);
    } else {
        console.error(`Section with id '${page}' not found`);
        // Fallback to home if section doesn't exist
        this.showPage('home');
    }
}

    loadPageContent(page) {
    console.log('Loading page:', page);
    switch (page) {
        case 'products':
            this.productsManager.loadAllProducts(true);
            break;
        case 'my-products':
            if (this.currentUser) {
                this.productsManager.loadUserProducts();
            } else {
                this.showToast('Please login to view your products', 'warning');
                this.showPage('home');
            }
            break;
        case 'notifications':
            if (this.currentUser) {
                this.notificationsManager.loadNotifications();
            } else {
                this.showToast('Please login to view notifications', 'warning');
                this.showPage('home');
            }
            break;
        case 'admin':
            if (this.currentUser && this.currentUser.is_admin) {
                this.adminManager.loadAdminDashboard();
            } else {
                this.showToast('Admin access required', 'error');
                this.showPage('home');
            }
            break;
        case 'about':
        case 'contact':
            // Static pages, no additional loading needed
            break;
    }
}

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    }

    showLoading() {
        const spinner = document.getElementById('loading-spinner');
        if (spinner) {
            spinner.classList.add('active');
        }
    }

    hideLoading() {
        const spinner = document.getElementById('loading-spinner');
        if (spinner) {
            spinner.classList.remove('active');
        }
    }

    showToast(message, type = 'success') {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'success' ? 'check-circle' : 
                    type === 'error' ? 'exclamation-triangle' : 
                    type === 'warning' ? 'exclamation-circle' : 'info-circle';
        
        toast.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
        `;
        toastContainer.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 5000);
    }

   async apiCall(endpoint, options = {}) {
    const url = `${this.currentApiUrl}${endpoint}`;
    
    // Create config with defaults
    const config = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        mode: 'cors',
        credentials: 'omit',
        ...options
    };

    // Merge headers properly (options.headers should override defaults)
    config.headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    // Handle request body for non-GET requests
    if (config.method !== 'GET' && options.body) {
        config.body = JSON.stringify(options.body);
    }

    console.log('🔍 Making API call:', {
        url,
        method: config.method,
        headers: config.headers,
        body: config.body ? JSON.parse(config.body) : 'No body'
    });

    try {
        const response = await fetch(url, config);
        console.log('🔍 API Response:', {
            status: response.status,
            statusText: response.statusText,
            url: response.url
        });

        if (response.status === 401) {
            this.logout();
            throw new Error('Authentication required. Please login again.');
        }

        const text = await response.text();
        console.log('🔍 Response text:', text);
        
        let data;
        try {
            data = text ? JSON.parse(text) : {};
        } catch (e) {
            console.error('❌ JSON parse error:', e, 'Response text:', text);
            throw new Error('Invalid response from server');
        }

        if (!response.ok) {
            console.error('❌ API Error:', data);
            throw new Error(data.message || `Request failed with status ${response.status}`);
        }

        console.log('✅ API call successful');
        return data;
    } catch (error) {
        console.error('❌ API Call failed:', {
            error: error.message,
            url,
            config: {
                method: config.method,
                headers: config.headers,
                hasBody: !!config.body
            }
        });
        
        if (error.message.includes('Failed to fetch')) {
            this.showToast('Cannot connect to server. Please check if the backend is running.', 'error');
        } else if (error.message !== 'Authentication required. Please login again.') {
            this.showToast(error.message, 'error');
        }
        throw error;
    }
}

   async handleContactForm() {
    const formData = {
        name: document.getElementById('contact-name').value,
        email: document.getElementById('contact-email').value,
        subject: document.getElementById('contact-subject').value,
        message: document.getElementById('contact-message').value
    };

    // Validate required fields
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
        this.showToast('Please fill in all fields', 'error');
        return;
    }

    try {
        this.showLoading();
        
        const data = await this.apiCall('/contact/send-message', {
            method: 'POST',
            body: formData
        });

        this.showToast('Thank you! Your message has been sent successfully.', 'success');
        document.getElementById('contact-form').reset();
        
    } catch (error) {
        console.error('Failed to send contact message:', error);
        // Error message is already shown by apiCall
    } finally {
        this.hideLoading();
    }
}

    setCurrentUser(user) {
        this.currentUser = user;
        this.updateUI();
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('authToken');
        this.updateUI();
        this.showPage('home');
        this.showToast('Logged out successfully');
    }

    updateUI() {
        const navAuth = document.getElementById('nav-auth');
        const navUser = document.getElementById('nav-user');
        const usernameSpan = document.getElementById('username');
        const adminItems = document.querySelectorAll('.admin-only');

        if (this.currentUser) {
            // User is logged in
            if (navAuth) navAuth.style.display = 'none';
            if (navUser) navUser.style.display = 'flex';
            if (usernameSpan) usernameSpan.textContent = this.currentUser.username;

            // Show/hide admin items
            adminItems.forEach(item => {
                if (item) item.style.display = this.currentUser.is_admin ? 'flex' : 'none';
            });

            console.log('User logged in:', this.currentUser);

        } else {
            // User is not logged in
            if (navAuth) navAuth.style.display = 'flex';
            if (navUser) navUser.style.display = 'none';
            adminItems.forEach(item => {
                if (item) item.style.display = 'none';
            });
            
            console.log('User not logged in');
        }
    }

    async loadCategories() {
        try {
            const data = await this.apiCall('/categories/');
            this.categories = data.categories;
            this.productsManager.renderCategoryFilters();
        } catch (error) {
            console.error('Failed to load categories:', error);
        }
    }

    async loadFeaturedProducts() {
    try {
        console.log('🔄 Loading featured products...');
        const data = await this.apiCall('/products/?per_page=6');
        console.log('📦 Featured products data:', data);
        
        if (data.products && data.products.length > 0) {
            this.productsManager.renderProducts(data.products, 'featured-products');
        } else {
            this.showNoProductsMessage('featured-products');
        }
    } catch (error) {
        console.error('❌ Failed to load featured products:', error);
        this.showNoProductsMessage('featured-products', true);
    }
}

showNoProductsMessage(containerId, isError = false) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="no-products" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                <i class="fas ${isError ? 'fa-exclamation-triangle' : 'fa-box-open'} fa-3x" 
                   style="color: ${isError ? '#f59e0b' : '#9ca3af'}; margin-bottom: 1rem;"></i>
                <h3>${isError ? 'Connection Issue' : 'No products found'}</h3>
                <p>${isError ? 'Cannot load products. Please check your connection.' : 'Try adjusting your search criteria or check back later'}</p>
                ${isError ? `<button class="btn btn-primary" onclick="location.reload()">
                    <i class="fas fa-redo"></i> Refresh Page
                </button>` : ''}
            </div>
        `;
    }
}

    checkAuthStatus() {
        this.authManager.checkAuthStatus();
    }
}

// Authentication Management
class AuthManager {
    constructor(app) {
        this.app = app;
        this.token = localStorage.getItem('authToken');
        this.setupAuthForms();
    }

    setupAuthForms() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleLogin();
            });
        }

        // Register form
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleRegister();
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }

        // Add first product button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'add-first-product-btn' || e.target.closest('#add-first-product-btn')) {
                e.preventDefault();
                if (this.app.currentUser) {
                    this.app.productsManager.showProductForm();
                } else {
                    this.app.showToast('Please login to add products', 'warning');
                    this.app.showModal('login-modal');
                }
            }
        });
    }

    async handleLogin() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        if (!email || !password) {
            this.app.showToast('Please fill in all fields', 'error');
            return;
        }

        try {
            this.app.showLoading();
            const data = await this.app.apiCall('/auth/login', {
                method: 'POST',
                body: { email, password }
            });

            this.setAuthToken(data.token);
            this.app.setCurrentUser(data.user);
            this.updateUI();
            this.app.hideModal('login-modal');
            this.app.showToast('Login successful! Welcome back!');

            // Clear form
            document.getElementById('login-form').reset();

            // Load notification badge
            this.loadNotificationBadge();

        } catch (error) {
            console.error('Login failed:', error);
        } finally {
            this.app.hideLoading();
        }
    }

    async handleRegister() {
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        if (!username || !email || !password) {
            this.app.showToast('Please fill in all fields', 'error');
            return;
        }

        if (password.length < 6) {
            this.app.showToast('Password must be at least 6 characters', 'error');
            return;
        }

        try {
            this.app.showLoading();
            const data = await this.app.apiCall('/auth/register', {
                method: 'POST',
                body: { username, email, password }
            });

            this.setAuthToken(data.token);
            this.app.setCurrentUser(data.user);
            this.updateUI();
            this.app.hideModal('register-modal');
            this.app.showToast('Registration successful! Welcome to MarketPlace!');

            // Clear form
            document.getElementById('register-form').reset();

            // Load notification badge
            this.loadNotificationBadge();

        } catch (error) {
            console.error('Registration failed:', error);
        } finally {
            this.app.hideLoading();
        }
    }

    setAuthToken(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
    }

    getAuthHeaders() {
        return this.token ? { 'Authorization': `Bearer ${this.token}` } : {};
    }

    async checkAuthStatus() {
        if (!this.token) {
            this.updateUI();
            return;
        }

        try {
            const data = await this.app.apiCall('/auth/me', {
                headers: this.getAuthHeaders()
            });
            this.app.setCurrentUser(data.user);
            this.updateUI();
            this.loadNotificationBadge();
        } catch (error) {
            console.error('Auth check failed:', error);
            this.logout();
        }
    }

    logout() {
        this.token = null;
        this.app.setCurrentUser(null);
        localStorage.removeItem('authToken');
        this.updateUI();
        this.app.showPage('home');
        this.app.showToast('Logged out successfully');
    }

    updateUI() {
        this.app.updateUI();
    }

    async loadNotificationBadge() {
        if (!this.app.currentUser) return;

        try {
            const data = await this.app.apiCall('/notifications/', {
                headers: this.getAuthHeaders()
            });
            const badge = document.getElementById('notification-badge');
            if (badge && data.unread_count > 0) {
                badge.textContent = data.unread_count;
                badge.style.display = 'flex';
            } else if (badge) {
                badge.style.display = 'none';
            }
        } catch (error) {
            console.error('Failed to load notifications:', error);
        }
    }
}

// Products Management
class ProductsManager {
    constructor(app) {
        this.app = app;
        this.currentPage = 1;
        this.hasMore = true;
        this.uploadedImages = [];
        this.imageUploadInitialized = false;
        this.setupProductsEvents();
    }

    setupProductsEvents() {
        // Search functionality
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => {
                    this.loadAllProducts(true);
                }, 500);
            });
        }
        // Search button
        const searchBtn = document.getElementById('search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.loadAllProducts(true);
            });
        }
        // Category filter
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => {
                this.loadAllProducts(true);
            });
        }
        // Load more button
        const loadMoreBtn = document.getElementById('load-more-btn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                this.loadAllProducts(false);
            });
        }
        // Add product buttons
        const addProductBtn = document.getElementById('add-product-btn');
        if (addProductBtn) {
            addProductBtn.addEventListener('click', () => {
                this.showProductForm();
            });
        }
        // Product form
        const productForm = document.getElementById('product-form');
        if (productForm) {
            productForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleProductSubmit();
            });
        }
        const cancelProductBtn = document.getElementById('cancel-product-btn');
        if (cancelProductBtn) {
            cancelProductBtn.addEventListener('click', () => {
                this.app.hideModal('product-form-modal');
                this.resetImageUpload();
            });
        }
    }

    setupImageUpload() {
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('product-images-input');
        const uploadContainer = document.getElementById('image-upload-container');
        if (!uploadArea || !fileInput) return;
        // Remove existing event listeners by cloning and replacing
        const newUploadArea = uploadArea.cloneNode(true);
        const newFileInput = fileInput.cloneNode(true);

        uploadArea.parentNode.replaceChild(newUploadArea, uploadArea);
        fileInput.parentNode.replaceChild(newFileInput, fileInput);
        // Click to upload
        newUploadArea.addEventListener('click', () => {
            newFileInput.click();
        });
        // File selection
        newFileInput.addEventListener('change', (e) => {
            this.handleFileSelection(e.target.files);
            // Reset the file input to allow selecting the same file again
            e.target.value = '';
        });
        // Drag and drop
        newUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadContainer.classList.add('drag-over');
        });
        newUploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadContainer.classList.remove('drag-over');
        });
        newUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadContainer.classList.remove('drag-over');
            this.handleFileSelection(e.dataTransfer.files);
        });
    }

    async handleFileSelection(files) {
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        for (let file of files) {
            // Validate file type
            if (!allowedTypes.includes(file.type)) {
                this.app.showToast('Invalid file type. Please upload images only.', 'error');
                continue;
            }
            // Validate file size
            if (file.size > maxSize) {
                this.app.showToast(`File ${file.name} is too large. Max 5MB.`, 'error');
                continue;
            }
            await this.uploadImage(file);
        }
    }

    async uploadImage(file) {
        console.log('📤 Starting image upload for file:', file.name, file.size, file.type);

        const formData = new FormData();
        formData.append('image', file);
        try {
            this.app.showLoading();

            const uploadUrl = `${this.app.currentApiUrl}/products/upload-image`;
            console.log('🔍 Uploading to:', uploadUrl);

            const response = await fetch(uploadUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.app.authManager.token}`
                },
                body: formData
            });
            console.log('📨 Upload response status:', response.status);

            const data = await response.json();
            console.log('📨 Upload response data:', data);
            if (!response.ok) {
                throw new Error(data.message || `Upload failed with status ${response.status}`);
            }
            this.uploadedImages.push(data.image_url);
            this.renderImagePreview(file, data.image_url);
            this.app.showToast('Image uploaded successfully!');

            console.log('✅ Image uploaded successfully. URL:', data.image_url);
            console.log('📸 Current uploaded images:', this.uploadedImages);
        } catch (error) {
            console.error('❌ Image upload failed:', error);
            this.app.showToast(error.message || 'Failed to upload image', 'error');
        } finally {
            this.app.hideLoading();
        }
    }

    renderImagePreview(file, imageUrl) {
        const preview = document.getElementById('image-preview');
        if (!preview) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            previewItem.innerHTML = `
                <img src="${e.target.result}" alt="Preview">
                <button type="button" class="remove-btn" data-image-url="${imageUrl}">
                    <i class="fas fa-times"></i>
                </button>
            `;

            preview.appendChild(previewItem);
            // Add remove functionality
            previewItem.querySelector('.remove-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeImage(imageUrl, previewItem);
            });
        };
        reader.readAsDataURL(file);
    }

    removeImage(imageUrl, previewElement) {
        this.uploadedImages = this.uploadedImages.filter(url => url !== imageUrl);
        previewElement.remove();
        this.app.showToast('Image removed');
    }

    resetImageUpload() {
        this.uploadedImages = [];
        const preview = document.getElementById('image-preview');
        if (preview) preview.innerHTML = '';

        const fileInput = document.getElementById('product-images-input');
        if (fileInput) {
            fileInput.value = '';
            // Create a new file input to completely reset it
            const newFileInput = fileInput.cloneNode(true);
            fileInput.parentNode.replaceChild(newFileInput, fileInput);

            // Re-attach event listener to the new file input
            newFileInput.addEventListener('change', (e) => {
                this.handleFileSelection(e.target.files);
            });
        }
    }

    renderCategoryFilters() {
        const categoryFilter = document.getElementById('category-filter');
        const productCategory = document.getElementById('product-category');

        if (!categoryFilter || !productCategory) return;
        const options = this.app.categories.map(category =>
            `<option value="${category.id}">${category.name}</option>`
        ).join('');

        if (categoryFilter) {
            categoryFilter.innerHTML = '<option value="">All Categories</option>' + options;
        }
        if (productCategory) {
            productCategory.innerHTML = '<option value="">Select Category</option>' + options;
        }
    }

    async loadFeaturedProducts() {
        try {
            const data = await this.app.apiCall('/products/?per_page=6');
            this.renderProducts(data.products, 'featured-products');
        } catch (error) {
            console.error('Failed to load featured products:', error);
        }
    }

    async loadAllProducts(reset = false) {
    if (reset) {
        this.currentPage = 1;
        this.hasMore = true;
    }
    if (!this.hasMore) return;
    
    try {
        this.app.showLoading();

        let search = '';
        const productsSearchInput = document.getElementById('search-input');
        const navSearchInput = document.getElementById('nav-search-input');
        const mobileSearchInput = document.getElementById('mobile-search-input');
        
        if (productsSearchInput && productsSearchInput.value) {
            search = productsSearchInput.value;
        } else if (navSearchInput && navSearchInput.value) {
            search = navSearchInput.value;
            if (productsSearchInput) productsSearchInput.value = search;
        } else if (mobileSearchInput && mobileSearchInput.value) {
            search = mobileSearchInput.value;
            if (productsSearchInput) productsSearchInput.value = search;
            if (navSearchInput) navSearchInput.value = search;
        }

        const categoryId = document.getElementById('category-filter')?.value || '';

        let url = `/products/?page=${this.currentPage}&per_page=12`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        if (categoryId) url += `&category_id=${categoryId}`;
        
        const data = await this.app.apiCall(url);

        if (reset) {
            this.renderProducts(data.products, 'all-products');
        } else {
            this.appendProducts(data.products, 'all-products');
        }
        
        this.hasMore = data.current_page < data.pages;
        const loadMore = document.getElementById('load-more');
        if (loadMore) {
            loadMore.style.display = this.hasMore ? 'block' : 'none';
        }

        this.currentPage++;
    } catch (error) {
        console.error('Failed to load products:', error);
    } finally {
        this.app.hideLoading();
    }
}

    renderProducts(products, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        if (products.length === 0) {
            container.innerHTML = `
                <div class="no-products">
                    <i class="fas fa-box-open fa-3x"></i>
                    <h3>No products found</h3>
                    <p>Try adjusting your search criteria or check back later</p>
                </div>
            `;
            return;
        }
        container.innerHTML = products.map(product => this.createProductCard(product)).join('');

        // Add click events to product cards
        container.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', () => {
                const productId = card.dataset.productId;
                this.showProductDetails(productId);
            });
        });
    }

    appendProducts(products, containerId) {
        const container = document.getElementById(containerId);
        if (!container || products.length === 0) return;
        const newCards = products.map(product => this.createProductCard(product)).join('');
        container.innerHTML += newCards;

        // Add click events to new product cards
        container.querySelectorAll('.product-card:not(.click-bound)').forEach(card => {
            card.classList.add('click-bound');
            card.addEventListener('click', () => {
                const productId = card.dataset.productId;
                this.showProductDetails(productId);
            });
        });
    }

    renderUserProducts(products) {
        const container = document.getElementById('my-products-container');
        const tableBody = document.getElementById('my-products-tbody');
        const noProductsMessage = document.getElementById('no-products-message');
        if (!container || !tableBody || !noProductsMessage) return;
        if (products.length === 0) {
            tableBody.innerHTML = '';
            noProductsMessage.style.display = 'block';
            return;
        }
        noProductsMessage.style.display = 'none';
        tableBody.innerHTML = products.map(product => {
            // Get first image or placeholder
            let imageHtml;
            if (product.image_urls && product.image_urls.length > 0) {
                const imageUrl = product.image_urls[0].startsWith('/uploads/')
                    ? `http://127.0.0.1:5000${product.image_urls[0]}`
                    : product.image_urls[0];
                imageHtml = `<img src="${imageUrl}" alt="${product.name}" class="product-table-image"
                             onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.style.display='flex';">`;
            } else {
                imageHtml = '<div class="product-image-placeholder"><i class="fas fa-image"></i></div>';
            }
            // Determine status badge
            let statusBadge = 'active';
            let statusText = 'Active';
            if (!product.is_active) {
                statusBadge = 'inactive';
                statusText = 'Inactive';
            } else if (product.is_sold) {
                statusBadge = 'sold';
                statusText = 'Sold';
            }
            // Format price
            const price = product.price_display || 'Contact for price';
            return `
                <tr>
                    <td>
                        <div style="position: relative;">
                            ${imageHtml}
                            <div class="product-image-placeholder" style="display: none;">
                                <i class="fas fa-image"></i>
                            </div>
                        </div>
                    </td>
                    <td class="product-name-cell">
                        <div class="product-name">${this.escapeHtml(product.name)}</div>
                        <div class="product-description">${this.escapeHtml(product.description)}</div>
                    </td>
                    <td>${product.category_name || 'Uncategorized'}</td>
                    <td class="price-cell">${price}</td>
                    <td>
                        <span class="status-badge ${statusBadge}">${statusText}</span>
                    </td>
                    <td>${new Date(product.created_at).toLocaleDateString()}</td>
                    <td>
                        <div class="table-actions">
                            <button class="btn-table btn-table-edit edit-product-btn"
                                    data-product-id="${product.id}"
                                    title="Edit Product">
                                <i class="fas fa-edit"></i>Edit
                            </button>
                            <button class="btn-table btn-table-view view-product-btn"
                                    data-product-id="${product.id}"
                                    title="View Details">
                                <i class="fas fa-eye"></i>View
                            </button>
                            <button class="btn-table btn-table-delete delete-product-btn"
                                    data-product-id="${product.id}"
                                    title="Delete Product">
                                <i class="fas fa-trash"></i>Delete
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        // Add event listeners for action buttons
        tableBody.querySelectorAll('.edit-product-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = btn.dataset.productId;
                this.showProductForm(productId);
            });
        });
        tableBody.querySelectorAll('.view-product-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = btn.dataset.productId;
                this.showProductDetails(productId);
            });
        });
        tableBody.querySelectorAll('.delete-product-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = btn.dataset.productId;
                this.deleteProduct(productId);
            });
        });
        // Make entire row clickable for view details
        tableBody.querySelectorAll('tr').forEach(row => {
            row.addEventListener('click', (e) => {
                // Only trigger if not clicking on action buttons
                if (!e.target.closest('.table-actions')) {
                    const productId = row.querySelector('.edit-product-btn')?.dataset.productId;
                    if (productId) {
                        this.showProductDetails(productId);
                    }
                }
            });
        });
    }

    createProductCard(product) {
        console.log('🖼️ Product data for card:', product);

        // Handle image URLs properly
        let imageUrl;
        if (product.image_urls && product.image_urls.length > 0) {
            imageUrl = product.image_urls[0];
            // Ensure the URL is properly formatted
            if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
                if (imageUrl.startsWith('/uploads/')) {
                    imageUrl = `http://127.0.0.1:5000${imageUrl}`;
                } else {
                    imageUrl = `http://127.0.0.1:5000/uploads/${imageUrl}`;
                }
            }
        } else {
            // Use a local placeholder instead of external service
            imageUrl = '/static/images/placeholder.jpg';
        }

        // Use price_display for RWF formatting
        const price = product.price_display || 'Contact for price';

        return `
            <div class="product-card" data-product-id="${product.id}">
                <div class="product-image-container">
                    <img src="${imageUrl}" alt="${product.name}" class="product-image"
                         onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.style.display='block';">
                    <div class="image-placeholder" style="display: none;">
                        <i class="fas fa-image fa-2x"></i>
                        <p>No Image Available</p>
                    </div>
                </div>
                <div class="product-content">
                    <h3 class="product-title">${this.escapeHtml(product.name)}</h3>
                    <p class="product-description">${this.escapeHtml(product.description)}</p>
                    <div class="product-price">${price}</div>
                    <div class="product-meta">
                        <span class="category">${product.category_name || 'Uncategorized'}</span>
                        <span class="date">${new Date(product.created_at).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
        `;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    createUserProductCard(product) {
        // Same image logic as createProductCard
        let imageUrl;
        if (product.image_urls && product.image_urls.length > 0) {
            imageUrl = product.image_urls[0];
            if (imageUrl.startsWith('/uploads/')) {
                imageUrl = `http://127.0.0.1:5000${imageUrl}`;
            }
        } else {
            // Use local placeholder
            imageUrl = '/static/images/placeholder.jpg';
        }

        const price = product.price_display || 'Contact for price';
        const statusBadge = product.is_active ?
            '<span class="status-badge active">Active</span>' :
            '<span class="status-badge inactive">Inactive</span>';
        return `
            <div class="product-card" data-product-id="${product.id}">
                <div class="product-image-container">
                    <img src="${imageUrl}" alt="${product.name}" class="product-image"
                         onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div class="image-placeholder" style="display: none;">
                        <i class="fas fa-image fa-2x"></i>
                        <p>No Image Available</p>
                    </div>
                </div>
                <div class="product-content">
                    <div class="product-header">
                        <h3 class="product-title">${product.name}</h3>
                        ${statusBadge}
                    </div>
                    <p class="product-description">${product.description}</p>
                    <div class="product-price">${price}</div>
                    <div class="product-meta">
                        <span>${product.category_name || 'Uncategorized'}</span>
                        <span>${new Date(product.created_at).toLocaleDateString()}</span>
                    </div>
                    <div class="product-actions">
                        <button class="btn btn-outline edit-product-btn" data-product-id="${product.id}">
                            <i class="fas fa-edit"></i>Edit
                        </button>
                        <button class="btn btn-outline delete-product-btn" data-product-id="${product.id}">
                            <i class="fas fa-trash"></i>Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    async showProductDetails(productId) {
        try {
            this.app.showLoading();
            const data = await this.app.apiCall(`/products/${productId}`);
            this.renderProductModal(data.product);
            this.app.showModal('product-modal');
        } catch (error) {
            console.error('Failed to load product details:', error);
        } finally {
            this.app.hideLoading();
        }
    }

   renderProductModal(product) {
    const modalContent = document.getElementById('product-modal-content');
    const modalTitle = document.getElementById('product-modal-title');

    if (!modalContent || !modalTitle) return;

    modalTitle.textContent = product.name;

    // Handle images with proper URLs
    let imagesHtml = '';
    let thumbnailsHtml = '';
    let imageIndicatorsHtml = '';
    
    if (product.image_urls && product.image_urls.length > 0) {
        // Create main images
        imagesHtml = product.image_urls.map((url, index) => {
            // Convert relative URLs to absolute
            if (url.startsWith('/uploads/')) {
                url = `http://127.0.0.1:5000${url}`;
            }
            const activeStyle = index === 0 ? '' : 'style="display: none;"';
            return `
                <img src="${url}" alt="${product.name}" class="product-modal-image" 
                     data-index="${index}" ${activeStyle}
                     onerror="this.onerror=null; this.style.display='none';">
                <div class="image-placeholder" style="display: none;" data-index="${index}">
                    <i class="fas fa-image fa-3x"></i>
                    <p>Image Not Available</p>
                </div>`;
        }).join('');

        // Create navigation buttons and indicators if multiple images
        if (product.image_urls.length > 1) {
            imageIndicatorsHtml = product.image_urls.map((_, index) => `
                <button class="image-indicator ${index === 0 ? 'active' : ''}" 
                        data-index="${index}"></button>
            `).join('');

            // Create thumbnails
            thumbnailsHtml = product.image_urls.map((url, index) => {
                if (url.startsWith('/uploads/')) {
                    url = `http://127.0.0.1:5000${url}`;
                }
                return `
                    <img src="${url}" alt="Thumbnail ${index + 1}" 
                         class="thumbnail ${index === 0 ? 'active' : ''}"
                         data-index="${index}"
                         onerror="this.style.display='none'">`;
            }).join('');

            imagesHtml = `
                <div class="product-modal-images">
                    ${imagesHtml}
                    
                    <div class="image-navigation">
                        <button class="nav-btn prev-btn" id="prev-image">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <button class="nav-btn next-btn" id="next-image">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                    
                    <div class="image-indicators">
                        ${imageIndicatorsHtml}
                    </div>
                </div>
                
                <div class="image-thumbnails">
                    ${thumbnailsHtml}
                </div>
            `;
        } else {
            // Single image - no navigation
            imagesHtml = `
                <div class="product-modal-images">
                    ${imagesHtml}
                </div>
            `;
        }
    } else {
        imagesHtml = `
            <div class="product-modal-images">
                <div class="image-placeholder">
                    <i class="fas fa-image fa-3x"></i>
                    <p>No Images Available</p>
                </div>
            </div>`;
    }

    // Format price
    let price;
    if (product.price_display) {
        price = product.price_display;
    } else if (product.price) {
        price = `RWF ${parseInt(product.price).toLocaleString()}`;
    } else {
        price = 'Contact for price';
    }

    // In renderProductModal method, use this for the details section:
modalContent.innerHTML = `
    ${imagesHtml}
    <div class="product-modal-details">
        <div class="product-modal-price">${price}</div>
        
        <div class="product-description-box">
            <h4><i class="fas fa-info-circle"></i>Product Description</h4>
            <p>${product.description}</p>
        </div>
        
        <div class="contact-info-box">
            <h4><i class="fas fa-phone-alt"></i>Contact Information</h4>
            <p>${product.contact_info}</p>
        </div>
        
        <div class="product-meta-grid">
            <div class="meta-item">
                <strong>Category</strong>
                <span>${product.category_name || 'Uncategorized'}</span>
            </div>
            <div class="meta-item">
                <strong>Seller</strong>
                <span>${product.seller_username || 'Unknown'}</span>
            </div>

             <div class="meta-item">
            <strong>Location</strong>
                 <span>${product.location || 'Not specified'}</span>
             </div>
            <div class="meta-item">
                <strong>Posted</strong>
                <span>${new Date(product.created_at).toLocaleDateString()}</span>
            </div>
        </div>
    </div>
`;

    // Add image navigation functionality
    if (product.image_urls && product.image_urls.length > 1) {
        this.setupImageNavigation(product.image_urls.length);
    }
}

setupImageNavigation(totalImages) {
    let currentImageIndex = 0;
    
    const showImage = (index) => {
        // Hide all images and placeholders
        document.querySelectorAll('.product-modal-image, .image-placeholder').forEach(el => {
            el.style.display = 'none';
        });
        
        // Show selected image
        const selectedImage = document.querySelector(`.product-modal-image[data-index="${index}"]`);
        const selectedPlaceholder = document.querySelector(`.image-placeholder[data-index="${index}"]`);
        
        // Check if image loaded successfully, otherwise show placeholder
        if (selectedImage && selectedImage.complete && selectedImage.naturalHeight !== 0) {
            selectedImage.style.display = 'block';
        } else if (selectedPlaceholder) {
            selectedPlaceholder.style.display = 'flex';
        } else if (selectedImage) {
            selectedImage.style.display = 'block';
        }
        
        // Update indicators
        document.querySelectorAll('.image-indicator').forEach((indicator, i) => {
            indicator.classList.toggle('active', i === index);
        });
        
        // Update thumbnails
        document.querySelectorAll('.thumbnail').forEach((thumbnail, i) => {
            thumbnail.classList.toggle('active', i === index);
        });
        
        // Update navigation buttons
        const prevBtn = document.getElementById('prev-image');
        const nextBtn = document.getElementById('next-image');
        
        if (prevBtn) prevBtn.disabled = index === 0;
        if (nextBtn) nextBtn.disabled = index === totalImages - 1;
        
        currentImageIndex = index;
    };

    // Previous button
    const prevBtn = document.getElementById('prev-image');
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentImageIndex > 0) {
                showImage(currentImageIndex - 1);
            }
        });
    }

    // Next button
    const nextBtn = document.getElementById('next-image');
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentImageIndex < totalImages - 1) {
                showImage(currentImageIndex + 1);
            }
        });
    }

    // Indicators
    document.querySelectorAll('.image-indicator').forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            showImage(index);
        });
    });

    // Thumbnails
    document.querySelectorAll('.thumbnail').forEach((thumbnail, index) => {
        thumbnail.addEventListener('click', () => {
            showImage(index);
        });
    });

    // Keyboard navigation
    const handleKeydown = (e) => {
        if (e.key === 'ArrowLeft' && currentImageIndex > 0) {
            showImage(currentImageIndex - 1);
        } else if (e.key === 'ArrowRight' && currentImageIndex < totalImages - 1) {
            showImage(currentImageIndex + 1);
        }
    };
    
    document.addEventListener('keydown', handleKeydown);
    
    // Clean up event listener when modal closes
    const modal = document.getElementById('product-modal');
    const originalClose = modal.querySelector('.modal-close').onclick;
    modal.querySelector('.modal-close').onclick = function() {
        document.removeEventListener('keydown', handleKeydown);
        if (originalClose) originalClose.call(this);
    };
}
    showProductForm(productId = null) {
        if (!this.app.currentUser) {
            this.app.showToast('Please login to add products', 'warning');
            this.app.showModal('login-modal');
            return;
        }
        const form = document.getElementById('product-form');
        const title = document.getElementById('product-form-title');
        if (!form || !title) return;
        // Reset form and images
        form.reset();
        this.resetImageUpload();

        if (productId) {
            title.textContent = 'Edit Product';
            this.loadProductForEdit(productId);
        } else {
            title.textContent = 'Add New Product';
            document.getElementById('product-id').value = '';
        }
        // Initialize image upload only once
        if (!this.imageUploadInitialized) {
            this.setupImageUpload();
            this.imageUploadInitialized = true;
        }

        this.app.showModal('product-form-modal');
    }

    async loadUserProducts() {
    try {
        this.app.showLoading();
        const data = await this.app.apiCall('/products/my-products', {
            headers: this.app.authManager.getAuthHeaders()
        });
        this.renderUserProducts(data.products);
    } catch (error) {
        console.error('Failed to load user products:', error);
        this.app.showToast('Failed to load your products', 'error');
    } finally {
        this.app.hideLoading();
    }
}

    async loadProductForEdit(productId) {
        try {
            this.app.showLoading();
            const data = await this.app.apiCall(`/products/${productId}`);
            const product = data.product;
            document.getElementById('product-id').value = product.id;
            document.getElementById('product-name').value = product.name;
            document.getElementById('product-category').value = product.category_id;
            document.getElementById('product-price').value = product.price || '';
            document.getElementById('product-description').value = product.description;
            document.getElementById('product-contact').value = product.contact_info;
            document.getElementById('product-location').value = product.location || ''; // NEW
            // Load existing images
            this.uploadedImages = product.image_urls || [];
            this.renderExistingImages(product.image_urls);
        } catch (error) {
            console.error('Failed to load product for edit:', error);
        } finally {
            this.app.hideLoading();
        }
    }

    renderExistingImages(imageUrls) {
        const preview = document.getElementById('image-preview');
        if (!preview || !imageUrls) return;
        preview.innerHTML = imageUrls.map(url => `
            <div class="preview-item">
                <img src="http://localhost:5000${url}" alt="Existing image">
                <button type="button" class="remove-btn" data-image-url="${url}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
        // Add remove functionality to existing images
        preview.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const imageUrl = btn.dataset.imageUrl;
                this.removeImage(imageUrl, btn.closest('.preview-item'));
            });
        });
    }

    async handleProductSubmit() {
        const productId = document.getElementById('product-id').value;
        const isEdit = !!productId;
        const productData = {
            name: document.getElementById('product-name').value,
            category_id: parseInt(document.getElementById('product-category').value),
            description: document.getElementById('product-description').value,
            contact_info: document.getElementById('product-contact').value,
            location: document.getElementById('product-location').value, // NEW FIELD
            image_urls: this.uploadedImages
            
        };
         // Handle price
    const price = document.getElementById('product-price').value;
    if (price) {
        productData.price = parseFloat(price);
    }
    
    console.log('📦 Product data to submit:', productData); // Check if location is here
        console.log('📦 Uploaded images array:', this.uploadedImages);

        // Validate required fields
         if (!productData.name || !productData.category_id || !productData.description || 
        !productData.contact_info || !productData.location) { // ADD LOCATION HERE
        this.app.showToast('Please fill in all required fields', 'error');
        return;
    }
        // Validate at least one image
        if (this.uploadedImages.length === 0) {
            this.app.showToast('Please upload at least one image for your product', 'error');
            return;
        }
        try {
            this.app.showLoading();

            // Get auth headers
            const authHeaders = this.app.authManager.getAuthHeaders();

            let data;
            if (isEdit) {
                data = await this.app.apiCall(`/products/${productId}`, {
                    method: 'PUT',
                    headers: authHeaders,
                    body: productData
                });
            } else {
                data = await this.app.apiCall('/products/', {
                    method: 'POST',
                    headers: authHeaders,
                    body: productData
                });
            }
            console.log('✅ Product saved successfully:', data);

            this.app.hideModal('product-form-modal');
            this.app.showToast(`Product ${isEdit ? 'updated' : 'created'} successfully!`);
            // Clear form
            this.resetImageUpload();
            document.getElementById('product-form').reset();
            // Refresh relevant views
            if (this.app.currentPage === 'my-products') {
                this.loadUserProducts();
            }
            if (this.app.currentPage === 'products') {
                this.loadAllProducts(true);
            }
            if (this.app.currentPage === 'home') {
                this.loadFeaturedProducts();
            }
        } catch (error) {
            console.error('❌ Failed to save product:', error);
        } finally {
            this.app.hideLoading();
        }
    }

    async deleteProduct(productId) {
        if (!confirm('Are you sure you want to permanently delete this product? This action cannot be undone and all images will be deleted.')) return;
        try {
            this.app.showLoading();
            const result = await this.app.apiCall(`/products/${productId}`, {
                method: 'DELETE',
                headers: this.app.authManager.getAuthHeaders()
            });
            this.app.showToast('Product permanently deleted!');

            // Refresh the view
            if (this.app.currentPage === 'my-products') {
                this.loadUserProducts();
            }
            if (this.app.currentPage === 'products') {
                this.loadAllProducts(true);
            }
        } catch (error) {
            console.error('Failed to delete product:', error);
            this.app.showToast(error.message || 'Failed to delete product', 'error');
        } finally {
            this.app.hideLoading();
        }
    }
}

// Admin Management
class AdminManager {
    constructor(app) {
        this.app = app;
        this.setupAdminEvents();
    }

    setupAdminEvents() {
        // Tab switching
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-btn')) {
                const tab = e.target.dataset.tab;
                this.switchTab(tab);
            }
        });
    }

    switchTab(tabName) {
        console.log('Switching to tab:', tabName);
        
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab panes
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.toggle('active', pane.id === `${tabName}-tab`);
        });

        // Load tab content
        this.loadTabContent(tabName);
    }

    async loadAdminDashboard() {
        console.log('Loading admin dashboard...');
        await this.loadStats();
        this.switchTab('users');
    }

    async loadStats() {
        try {
            const data = await this.app.apiCall('/admin/dashboard/stats', {
                headers: this.app.authManager.getAuthHeaders()
            });
            this.renderStats(data.stats);
        } catch (error) {
            console.error('Failed to load admin stats:', error);
            this.renderStatsError();
        }
    }

    renderStats(stats) {
        const statsContainer = document.getElementById('admin-stats');
        if (!statsContainer) return;

        statsContainer.innerHTML = `
            <div class="stat-card">
                <div class="stat-number">${stats.total_users || 0}</div>
                <div class="stat-label">Total Users</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.total_products || 0}</div>
                <div class="stat-label">Total Products</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.active_products || 0}</div>
                <div class="stat-label">Active Products</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.total_categories || 0}</div>
                <div class="stat-label">Categories</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.new_users_week || 0}</div>
                <div class="stat-label">New Users (Week)</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.new_products_week || 0}</div>
                <div class="stat-label">New Products (Week)</div>
            </div>
        `;
    }

    renderStatsError() {
        const statsContainer = document.getElementById('admin-stats');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="no-products">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Failed to load statistics</h3>
                    <p>Please check your connection and try again</p>
                </div>
            `;
        }
    }

    async loadTabContent(tabName) {
        console.log('Loading tab content:', tabName);
        switch (tabName) {
            case 'users':
                await this.loadUsers();
                break;
            case 'products-admin':
                await this.loadAdminProducts();
                break;
            case 'categories':
                await this.loadCategoriesManagement();
                break;
            case 'broadcast':
                this.loadBroadcastForm();
                break;
        }
    }

    async loadUsers() {
        try {
            const data = await this.app.apiCall('/admin/users', {
                headers: this.app.authManager.getAuthHeaders()
            });
            this.renderUsers(data.users);
        } catch (error) {
            console.error('Failed to load users:', error);
            this.renderUsersError();
        }
    }

    renderUsers(users) {
        const container = document.getElementById('users-tab');
        if (!container) return;

        if (!users || users.length === 0) {
            container.innerHTML = `
                <div class="no-products">
                    <i class="fas fa-users"></i>
                    <h3>No users found</h3>
                    <p>There are no registered users yet</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="admin-table-container">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Status</th>
                            <th>Joined</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map(user => `
                            <tr>
                                <td>${user.username}</td>
                                <td>${user.email}</td>
                                <td>
                                    <span class="status-badge ${user.is_active ? 'active' : 'inactive'}">
                                        ${user.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td>${new Date(user.created_at).toLocaleDateString()}</td>
                                <td>
                                    <div class="action-buttons">
                                        <button class="btn btn-sm btn-outline toggle-user-btn" 
                                                data-user-id="${user.id}" 
                                                data-current-status="${user.is_active}">
                                            ${user.is_active ? 'Deactivate' : 'Activate'}
                                        </button>
                                        <button class="btn btn-sm btn-danger delete-user-btn" 
                                                data-user-id="${user.id}"
                                                data-username="${user.username}">
                                            <i class="fas fa-trash"></i>Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        // Add event listeners for toggle buttons
        container.querySelectorAll('.toggle-user-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const userId = btn.dataset.userId;
                await this.toggleUserStatus(userId);
            });
        });

        // Add event listeners for delete buttons
        container.querySelectorAll('.delete-user-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const userId = btn.dataset.userId;
                const username = btn.dataset.username;
                await this.deleteUser(userId, username);
            });
        });
    }

    async deleteUser(userId, username) {
        if (!confirm(`Are you sure you want to permanently delete user "${username}"? This will also delete all their products and cannot be undone!`)) return;

        try {
            this.app.showLoading();
            await this.app.apiCall(`/admin/users/${userId}`, {
                method: 'DELETE',
                headers: this.app.authManager.getAuthHeaders()
            });

            this.app.showToast('User deleted successfully!');
            this.loadUsers(); // Refresh the list

        } catch (error) {
            console.error('Failed to delete user:', error);
            this.app.showToast(error.message || 'Failed to delete user', 'error');
        } finally {
            this.app.hideLoading();
        }
    }

    renderUsersError() {
        const container = document.getElementById('users-tab');
        if (container) {
            container.innerHTML = `
                <div class="no-products">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Failed to load users</h3>
                    <p>Please check your connection and try again</p>
                </div>
            `;
        }
    }

    async toggleUserStatus(userId) {
        try {
            this.app.showLoading();
            await this.app.apiCall(`/admin/users/${userId}/toggle-active`, {
                method: 'PUT',
                headers: this.app.authManager.getAuthHeaders()
            });
            this.app.showToast('User status updated successfully!');
            this.loadUsers(); // Refresh the list
        } catch (error) {
            console.error('Failed to toggle user status:', error);
        } finally {
            this.app.hideLoading();
        }
    }

    async loadAdminProducts() {
        try {
            const data = await this.app.apiCall('/admin/products', {
                headers: this.app.authManager.getAuthHeaders()
            });
            this.renderAdminProducts(data.products);
        } catch (error) {
            console.error('Failed to load admin products:', error);
            this.renderAdminProductsError();
        }
    }

    renderAdminProducts(products) {
        const container = document.getElementById('products-admin-tab');
        if (!container) return;

        if (!products || products.length === 0) {
            container.innerHTML = `
                <div class="no-products">
                    <i class="fas fa-box-open"></i>
                    <h3>No products found</h3>
                    <p>There are no products in the system yet</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="admin-table-container">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Image</th>
                            <th>Name</th>
                            <th>Seller</th>
                            <th>Price</th>
                            <th>Status</th>
                            <th>Posted</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${products.map(product => {
                            // Get first image or placeholder
                            let imageUrl = '/static/images/placeholder.jpg';
                            if (product.image_urls && product.image_urls.length > 0) {
                                imageUrl = product.image_urls[0];
                                if (imageUrl.startsWith('/uploads/')) {
                                    imageUrl = `http://127.0.0.1:5000${imageUrl}`;
                                }
                            }
                            
                            const price = product.price ? `$${product.price}` : 'Contact';
                            const status = product.is_active ? 'Active' : 'Inactive';
                            
                            return `
                                <tr>
                                    <td>
                                        <div class="product-image-small">
                                            <img src="${imageUrl}" alt="${product.name}" 
                                                 onerror="this.src='/static/images/placeholder.jpg'">
                                        </div>
                                    </td>
                                    <td>${product.name}</td>
                                    <td>${product.seller_username || 'Unknown'}</td>
                                    <td>${price}</td>
                                    <td>
                                        <span class="status-badge ${product.is_active ? 'active' : 'inactive'}">
                                            ${status}
                                        </span>
                                    </td>
                                    <td>${new Date(product.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <div class="action-buttons">
                                            <button class="btn btn-sm btn-outline toggle-product-btn" 
                                                    data-product-id="${product.id}" 
                                                    data-current-status="${product.is_active}">
                                                ${product.is_active ? 'Deactivate' : 'Activate'}
                                            </button>
                                            <button class="btn btn-sm btn-danger delete-product-admin-btn" 
                                                    data-product-id="${product.id}"
                                                    data-product-name="${product.name}">
                                                <i class="fas fa-trash"></i>Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;

        // Add event listeners for toggle buttons
        container.querySelectorAll('.toggle-product-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const productId = btn.dataset.productId;
                await this.toggleProductStatus(productId);
            });
        });

        // Add event listeners for delete buttons
        container.querySelectorAll('.delete-product-admin-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const productId = btn.dataset.productId;
                const productName = btn.dataset.productName;
                await this.deleteProductAdmin(productId, productName);
            });
        });
    }

    renderAdminProductsError() {
        const container = document.getElementById('products-admin-tab');
        if (container) {
            container.innerHTML = `
                <div class="no-products">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Failed to load products</h3>
                    <p>Please check your connection and try again</p>
                </div>
            `;
        }
    }

    async toggleProductStatus(productId) {
        try {
            this.app.showLoading();
            await this.app.apiCall(`/admin/products/${productId}/toggle-active`, {
                method: 'PUT',
                headers: this.app.authManager.getAuthHeaders()
            });
            this.app.showToast('Product status updated successfully!');
            this.loadAdminProducts(); // Refresh the list
        } catch (error) {
            console.error('Failed to toggle product status:', error);
        } finally {
            this.app.hideLoading();
        }
    }

    async deleteProductAdmin(productId, productName) {
        if (!confirm(`Are you sure you want to permanently delete "${productName}"? This action cannot be undone and all images will be deleted!`)) return;

        try {
            this.app.showLoading();
            await this.app.apiCall(`/admin/products/${productId}`, {
                method: 'DELETE',
                headers: this.app.authManager.getAuthHeaders()
            });

            this.app.showToast('Product permanently deleted!');
            this.loadAdminProducts(); // Refresh the list

        } catch (error) {
            console.error('Failed to delete product:', error);
            this.app.showToast(error.message || 'Failed to delete product', 'error');
        } finally {
            this.app.hideLoading();
        }
    }

    loadBroadcastForm() {
        const container = document.getElementById('broadcast-tab');
        if (!container) return;

        container.innerHTML = `
            <div class="broadcast-form">
                <h3>Send Notification to All Users</h3>
                <p class="help-text">This message will be sent to all registered users as a notification.</p>
                <form id="broadcast-form">
                    <div class="form-group">
                        <label>Message *</label>
                        <textarea id="broadcast-message" rows="4" 
                                  placeholder="Enter your notification message..." required></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-bullhorn"></i>Send Broadcast
                    </button>
                </form>
            </div>
        `;

        // Re-attach event listener
        const broadcastForm = document.getElementById('broadcast-form');
        if (broadcastForm) {
            broadcastForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleBroadcast();
            });
        }
    }

    async handleBroadcast() {
        const message = document.getElementById('broadcast-message').value;

        if (!message.trim()) {
            this.app.showToast('Please enter a message', 'error');
            return;
        }

        try {
            this.app.showLoading();
            await this.app.apiCall('/notifications/broadcast', {
                method: 'POST',
                headers: this.app.authManager.getAuthHeaders(),
                body: { message }
            });
            
            this.app.showToast('Notification sent to all users!');
            document.getElementById('broadcast-form').reset();

        } catch (error) {
            console.error('Failed to send broadcast:', error);
        } finally {
            this.app.hideLoading();
        }
    }

    async loadCategoriesManagement() {
        try {
            const data = await this.app.apiCall('/categories/');
            this.renderCategoriesManagement(data.categories);
        } catch (error) {
            console.error('Failed to load categories:', error);
            this.renderCategoriesError();
        }
    }

    renderCategoriesManagement(categories) {
        const container = document.getElementById('categories-tab');
        if (!container) return;

        container.innerHTML = `
            <div class="categories-management">
                <div class="add-category-form">
                    <h3>Add New Category</h3>
                    <form id="add-category-form">
                        <div class="form-group">
                            <label>Category Name *</label>
                            <input type="text" id="new-category-name" placeholder="Enter category name" required>
                        </div>
                        <div class="form-group">
                            <label>Description</label>
                            <textarea id="new-category-description" placeholder="Category description (optional)" rows="2"></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-plus"></i>Add Category
                        </button>
                    </form>
                </div>
                
                <div class="categories-list">
                    <h3>Existing Categories</h3>
                    ${categories && categories.length > 0 ? `
                        <div class="categories-grid">
                            ${categories.map(category => `
                                <div class="category-card">
                                    <h4>${category.name}</h4>
                                    <p>${category.description || 'No description'}</p>
                                    <button class="btn btn-sm btn-outline delete-category-btn" 
                                            data-category-id="${category.id}">
                                        <i class="fas fa-trash"></i>Delete
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <div class="no-products">
                            <i class="fas fa-tags"></i>
                            <h3>No categories yet</h3>
                            <p>Start by adding your first category</p>
                        </div>
                    `}
                </div>
            </div>
        `;

        // Add event listeners
        const addCategoryForm = document.getElementById('add-category-form');
        if (addCategoryForm) {
            addCategoryForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleAddCategory();
            });
        }

        container.querySelectorAll('.delete-category-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const categoryId = btn.dataset.categoryId;
                await this.deleteCategory(categoryId);
            });
        });
    }

    renderCategoriesError() {
        const container = document.getElementById('categories-tab');
        if (container) {
            container.innerHTML = `
                <div class="no-products">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Failed to load categories</h3>
                    <p>Please check your connection and try again</p>
                </div>
            `;
        }
    }

    async handleAddCategory() {
        const name = document.getElementById('new-category-name').value;
        const description = document.getElementById('new-category-description').value;

        if (!name.trim()) {
            this.app.showToast('Please enter a category name', 'error');
            return;
        }

        try {
            this.app.showLoading();
            await this.app.apiCall('/admin/categories', {
                method: 'POST',
                headers: this.app.authManager.getAuthHeaders(),
                body: { name, description }
            });
            
            this.app.showToast('Category added successfully!');
            document.getElementById('add-category-form').reset();
            this.loadCategoriesManagement(); // Refresh the list

        } catch (error) {
            console.error('Failed to add category:', error);
        } finally {
            this.app.hideLoading();
        }
    }

    async deleteCategory(categoryId) {
        if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) return;

        try {
            this.app.showLoading();
            await this.app.apiCall(`/admin/categories/${categoryId}`, {
                method: 'DELETE',
                headers: this.app.authManager.getAuthHeaders()
            });
            
            this.app.showToast('Category deleted successfully!');
            this.loadCategoriesManagement(); // Refresh the list

        } catch (error) {
            console.error('Failed to delete category:', error);
        } finally {
            this.app.hideLoading();
        }
    }
}

// Notifications Manager
class NotificationsManager {
    constructor(app) {
        this.app = app;
        this.setupNotificationsEvents();
    }

    setupNotificationsEvents() {
        document.addEventListener('click', (e) => {
            if (e.target.id === 'mark-all-read-btn' || e.target.closest('#mark-all-read-btn')) {
                this.markAllAsRead();
            }
        });
    }

    async loadNotifications() {
        try {
            const data = await this.app.apiCall('/notifications/', {
                headers: this.app.authManager.getAuthHeaders()
            });
            this.renderNotifications(data.notifications);
        } catch (error) {
            console.error('Failed to load notifications:', error);
            this.renderNotificationsError();
        }
    }

    renderNotifications(notifications) {
        const container = document.getElementById('notifications-list');
        if (!container) return;
        
        if (!notifications || notifications.length === 0) {
            container.innerHTML = `
                <div class="no-notifications">
                    <i class="fas fa-bell-slash fa-3x"></i>
                    <h3>No notifications</h3>
                    <p>You're all caught up!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = notifications.map(notification => `
            <div class="notification-item ${notification.is_read ? '' : 'unread'}">
                <div class="notification-content">
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-time">
                        ${new Date(notification.created_at).toLocaleString()}
                        ${notification.is_admin_notification ? ' • Admin' : ''}
                    </div>
                </div>
                ${!notification.is_read ? `
                    <button class="btn btn-sm btn-outline mark-read-btn" data-notification-id="${notification.id}">
                        Mark Read
                    </button>
                ` : ''}
            </div>
        `).join('');

        // Add event listeners for mark read buttons
        container.querySelectorAll('.mark-read-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const notificationId = btn.dataset.notificationId;
                await this.markAsRead(notificationId);
            });
        });
    }

    renderNotificationsError() {
        const container = document.getElementById('notifications-list');
        if (container) {
            container.innerHTML = `
                <div class="no-notifications">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Failed to load notifications</h3>
                    <p>Please check your connection and try again</p>
                </div>
            `;
        }
    }

    async markAsRead(notificationId) {
        try {
            await this.app.apiCall(`/notifications/${notificationId}/read`, {
                method: 'PUT',
                headers: this.app.authManager.getAuthHeaders()
            });
            this.app.showToast('Notification marked as read');
            this.loadNotifications(); // Refresh the list
            this.app.authManager.loadNotificationBadge(); // Update badge
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    }

    async markAllAsRead() {
        try {
            await this.app.apiCall('/notifications/read-all', {
                method: 'PUT',
                headers: this.app.authManager.getAuthHeaders()
            });
            this.app.showToast('All notifications marked as read');
            this.loadNotifications(); // Refresh the list
            this.app.authManager.loadNotificationBadge(); // Update badge
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    const app = new MarketPlaceApp();
    window.app = app;
    
    // Initialize managers
    app.authManager = new AuthManager(app);
    app.productsManager = new ProductsManager(app);
    app.adminManager = new AdminManager(app);
    app.notificationsManager = new NotificationsManager(app);
    
    console.log('🚀 MarketPlace App Initialized');
});

// ===== SCROLL TO TOP FUNCTIONALITY =====
class ScrollToTop {
    constructor() {
        this.button = document.getElementById('scrollToTop');
        this.scrollThreshold = 300; // Show button after scrolling 300px
        this.init();
    }

    init() {
        if (!this.button) return;

        // Add scroll event listener
        window.addEventListener('scroll', () => {
            this.toggleVisibility();
        });

        // Add click event listener
        this.button.addEventListener('click', () => {
            this.scrollToTop();
        });

        // Initial check
        this.toggleVisibility();
    }

    toggleVisibility() {
        if (window.scrollY > this.scrollThreshold) {
            this.button.classList.add('visible');
        } else {
            this.button.classList.remove('visible');
        }
    }

    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
}

// Initialize scroll to top when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ScrollToTop();
});