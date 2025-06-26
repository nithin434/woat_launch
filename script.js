// Configuration Management
let API_BASE_URL = '';
let currentSession = null;
let statusInterval = null;

// Initialize application
function initializeApp() {
    updateTime();
    setInterval(updateTime, 1000);
    
    checkRoute();
}

// Update time display
function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    const timeDisplay = document.getElementById('timeDisplay');
    if (timeDisplay) {
        timeDisplay.textContent = timeString;
    }
}

// Route checking and initialization
function checkRoute() {
    // Check for hash-based routing or URL parameters
    const hash = window.location.hash;
    const urlParams = new URLSearchParams(window.location.search);
    
    if (hash === '#nithin_edit_server_url' || urlParams.get('page') === 'nithin_edit_server_url') {
        showUrlEditPage();
        return;
    }
    
    // Normal page initialization
    document.addEventListener('DOMContentLoaded', () => {
        loadSavedConfig();
        if (API_BASE_URL) {
            testConnection();
            // Hide config notice if URL is configured
            const configNotice = document.getElementById('configNotice');
            if (configNotice) {
                configNotice.style.display = 'none';
            }
        } else {
            showConfigNotice();
        }
        
        // Initialize form handlers
        initializeFormHandlers();
        initializeFileUpload();
        
        // Listen for hash changes
        window.addEventListener('hashchange', () => {
            if (window.location.hash === '#nithin_edit_server_url') {
                showUrlEditPage();
            }
        });
    });
}

// Show configuration notice
function showConfigNotice() {
    const configNotice = document.getElementById('configNotice');
    if (configNotice) {
        configNotice.style.display = 'block';
    }
    showMessage('Please configure your backend URL first. Click the "Configure Server" button above or use the links in the footer.', 'warning');
}

// URL Edit Page
function showUrlEditPage() {
    document.body.className = 'url-edit-only';
    document.body.innerHTML = `
        <div class="time-display" id="timeDisplay"></div>
        <div class="url-edit-card">
            <h1>Server Configuration</h1>
            <p style="margin-bottom: 24px; color: #6b7280; font-size: 14px;">Configure your backend server URL to connect the control panel</p>
            
            <div class="input-group">
                <span class="input-icon">🌐</span>
                <input type="url" id="serverUrl" placeholder="https://your-backend-url.com" value="">
            </div>
            
            <button class="btn btn-primary btn-large" onclick="saveServerUrl()">Save Configuration</button>
            
            <div style="margin-top: 20px;">
                <button class="btn btn-success" onclick="goToMainPage()">
                    Go to Main Panel
                </button>
            </div>
            
            <div id="urlStatus" style="margin-top: 16px; font-weight: 500;"></div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <h3 style="margin-bottom: 12px; color: #374151; font-size: 1.1rem;">How to access this page:</h3>
                <div style="background: #f9fafb; padding: 16px; border-radius: 8px; text-align: left;">
                    <p style="margin-bottom: 8px; font-size: 13px; color: #6b7280;">Method 1 (Hash): Add <code style="background: #e5e7eb; padding: 2px 6px; border-radius: 4px;">#nithin_edit_server_url</code> to your URL</p>
                    <p style="margin-bottom: 8px; font-size: 13px; color: #6b7280;">Method 2 (Query): Add <code style="background: #e5e7eb; padding: 2px 6px; border-radius: 4px;">?page=nithin_edit_server_url</code> to your URL</p>
                    <p style="font-size: 13px; color: #6b7280;">Example: <code style="background: #e5e7eb; padding: 2px 6px; border-radius: 4px;">https://nithin434.github.io/woat_launch/#nithin_edit_server_url</code></p>
                </div>
            </div>
        </div>
    `;
    
    // Load existing URL
    const savedUrl = localStorage.getItem('backendUrl');
    if (savedUrl) {
        document.getElementById('serverUrl').value = savedUrl;
    }
    
    updateTime();
    setInterval(updateTime, 1000);
}

function saveServerUrl() {
    const url = document.getElementById('serverUrl').value.trim();
    if (!url) {
        document.getElementById('urlStatus').innerHTML = '<span style="color: #ef4444;">Please enter a valid URL</span>';
        return;
    }

    const cleanUrl = url.replace(/\/$/, '');
    localStorage.setItem('backendUrl', cleanUrl);
    
    document.getElementById('urlStatus').innerHTML = '<span style="color: #10b981;">Configuration saved successfully!</span>';
    
    setTimeout(() => {
        document.getElementById('urlStatus').innerHTML = '<span style="color: #6b7280;">Ready to use the main panel</span>';
    }, 2000);
}

function goToMainPage() {
    // Remove hash or query parameter and reload
    window.location.href = window.location.origin + window.location.pathname;
}

// Configuration Management
function loadSavedConfig() {
    const savedUrl = localStorage.getItem('backendUrl');
    if (savedUrl) {
        API_BASE_URL = savedUrl;
        const backendElement = document.getElementById('currentBackend');
        if (backendElement) {
            backendElement.textContent = savedUrl;
        }
    }
}

// Connection Testing
async function testConnection() {
    const indicator = document.getElementById('connectionIndicator');
    const status = document.getElementById('connectionStatus');
    
    if (!API_BASE_URL) {
        indicator?.classList.remove('connected');
        if (status) status.textContent = 'No backend URL configured';
        return;
    }

    if (status) status.textContent = 'Testing connection...';
    indicator?.classList.remove('connected');

    try {
        const response = await fetch(`${API_BASE_URL}/health`, {
            method: 'GET',
            mode: 'cors'
        });

        if (response.ok) {
            const data = await response.json();
            indicator?.classList.add('connected');
            if (status) status.textContent = `Connected (${data.activeBots || 0} active bots)`;
            showMessage('Backend connection established successfully', 'success');
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (error) {
        indicator?.classList.remove('connected');
        if (status) status.textContent = `Connection failed: ${error.message}`;
        showMessage(`Cannot connect to backend: ${error.message}`, 'error');
    }
}

// Form Handlers
function initializeFormHandlers() {
    const authForm = document.getElementById('authForm');
    if (authForm) {
        authForm.addEventListener('submit', handleAuthentication);
    }
}

async function handleAuthentication(e) {
    e.preventDefault();
    
    if (!API_BASE_URL) {
        showMessage('Please configure backend URL first. Visit /nithin_edit_server_url', 'error');
        return;
    }

    const uniqueId = document.getElementById('uniqueId').value;
    const secretKey = document.getElementById('secretKey').value;

    try {
        const response = await fetch(`${API_BASE_URL}/verify-session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            mode: 'cors',
            body: JSON.stringify({ uniqueId, secretKey })
        });

        const result = await response.json();
        
        if (result.success) {
            currentSession = { uniqueId, secretKey };
            document.getElementById('sessionId').textContent = uniqueId;
            document.getElementById('authSection').style.display = 'none';
            document.getElementById('botControls').style.display = 'block';
            showMessage(result.message, 'success');
            startStatusUpdates();
        } else {
            showMessage(result.message, 'error');
        }
    } catch (error) {
        showMessage('Connection error: ' + error.message, 'error');
    }
}

// Bot Control Functions
async function startWhatsApp() {
    if (!currentSession || !API_BASE_URL) return;

    const formData = new FormData();
    formData.append('uniqueId', currentSession.uniqueId);
    formData.append('personality', document.getElementById('whatsappPersonality').value);
    formData.append('contacts', document.getElementById('contacts').value);
    formData.append('excludeContacts', document.getElementById('excludeContacts').value);

    try {
        const response = await fetch(`${API_BASE_URL}/start-whatsapp`, {
            method: 'POST',
            mode: 'cors',
            body: formData
        });

        const result = await response.json();
        showMessage(result.message, result.success ? 'success' : 'error');
    } catch (error) {
        showMessage('Error starting WhatsApp bot: ' + error.message, 'error');
    }
}

async function startInstagram() {
    if (!currentSession || !API_BASE_URL) return;

    const cookiesFile = document.getElementById('cookiesFile').files[0];
    if (!cookiesFile) {
        showMessage('Please select a cookies file', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('uniqueId', currentSession.uniqueId);
    formData.append('personality', document.getElementById('instagramPersonality').value);
    formData.append('users', document.getElementById('users').value);
    formData.append('cookies', cookiesFile);

    try {
        const response = await fetch(`${API_BASE_URL}/start-instagram`, {
            method: 'POST',
            mode: 'cors',
            body: formData
        });

        const result = await response.json();
        showMessage(result.message, result.success ? 'success' : 'error');
    } catch (error) {
        showMessage('Error starting Instagram bot: ' + error.message, 'error');
    }
}

async function stopBot(botType) {
    if (!currentSession || !API_BASE_URL) return;

    try {
        const response = await fetch(`${API_BASE_URL}/stop-bot`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            mode: 'cors',
            body: JSON.stringify({ 
                uniqueId: currentSession.uniqueId, 
                botType: botType 
            })
        });

        const result = await response.json();
        showMessage(result.message, result.success ? 'success' : 'error');
    } catch (error) {
        showMessage(`Error stopping ${botType} bot: ` + error.message, 'error');
    }
}

async function removeSession() {
    if (!currentSession || !API_BASE_URL) return;

    if (!confirm('Are you sure you want to remove this session? This will stop all bots and delete session data.')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/remove-session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            mode: 'cors',
            body: JSON.stringify({ uniqueId: currentSession.uniqueId })
        });

        const result = await response.json();
        
        if (result.success) {
            showMessage(result.message, 'success');
            setTimeout(() => {
                location.reload();
            }, 2000);
        } else {
            showMessage(result.message, 'error');
        }
    } catch (error) {
        showMessage('Error removing session: ' + error.message, 'error');
    }
}

// Status Updates
function startStatusUpdates() {
    if (statusInterval) clearInterval(statusInterval);
    
    statusInterval = setInterval(async () => {
        if (!currentSession || !API_BASE_URL) return;

        // Update WhatsApp status
        try {
            const whatsappResponse = await fetch(`${API_BASE_URL}/bot-status/${currentSession.uniqueId}/whatsapp`, { mode: 'cors' });
            const whatsappData = await whatsappResponse.json();
            
            const whatsappStatus = document.getElementById('whatsappStatus');
            if (whatsappStatus) {
                whatsappStatus.className = `status-indicator ${whatsappData.running ? 'status-running' : 'status-stopped'}`;
            }
            
            const whatsappLogs = document.getElementById('whatsappLogs');
            if (whatsappLogs) {
                whatsappLogs.textContent = whatsappData.logs || 'No logs available';
                whatsappLogs.scrollTop = whatsappLogs.scrollHeight;
            }
        } catch (error) {
            const whatsappStatus = document.getElementById('whatsappStatus');
            if (whatsappStatus) {
                whatsappStatus.className = 'status-indicator status-unknown';
            }
        }

        // Update Instagram status
        try {
            const instagramResponse = await fetch(`${API_BASE_URL}/bot-status/${currentSession.uniqueId}/instagram`, { mode: 'cors' });
            const instagramData = await instagramResponse.json();
            
            const instagramStatus = document.getElementById('instagramStatus');
            if (instagramStatus) {
                instagramStatus.className = `status-indicator ${instagramData.running ? 'status-running' : 'status-stopped'}`;
            }
            
            const instagramLogs = document.getElementById('instagramLogs');
            if (instagramLogs) {
                instagramLogs.textContent = instagramData.logs || 'No logs available';
                instagramLogs.scrollTop = instagramLogs.scrollHeight;
            }
        } catch (error) {
            const instagramStatus = document.getElementById('instagramStatus');
            if (instagramStatus) {
                instagramStatus.className = 'status-indicator status-unknown';
            }
        }
    }, 3000);
}       
// if (files.length > 0) {
//                document.getElementById('cookiesFile').files = files;
// // File Upload Handling                updateFileName(document.getElementById('cookiesFile'));
function initializeFileUpload() {
    const fileUpload = document.querySelector('.file-upload');
    
if (fileUpload) {
    fileUpload.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUpload.classList.add('dragover');
    });
    
    fileUpload.addEventListener('dragleave', () => {
        fileUpload.classList.remove('dragover');
    });
    
    const updateFileName = (input) => {
        const fileName = document.getElementById('fileName');
        if (fileName) {
            fileName.textContent = input.files[0] ? input.files[0].name : 'Click to select cookies.json file';
        }
    };
        fileUpload.addEventListener('drop', (e) => {
            e.preventDefault();
            fileUpload.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                document.getElementById('cookiesFile').files = files;
                updateFileName(document.getElementById('cookiesFile'));
            }
        });
    }
}

// Message Display
function showMessage(message, type) {
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    const container = document.querySelector('.container');
    if (container) {
        container.insertBefore(messageDiv, container.firstChild);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }
}

// Cleanup
window.addEventListener('beforeunload', () => {
    if (statusInterval) {
        clearInterval(statusInterval);
    }
});

// Initialize the application
initializeApp();
