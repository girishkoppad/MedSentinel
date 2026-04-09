// Main JavaScript for MedSentinel

const API_BASE = window.location.origin + '/api';

// Search functionality
function goToSearchFlow() {
    const query = document.getElementById('searchInput').value.trim();
    const url = query ? '/search-flow.html?condition=' + encodeURIComponent(query) : '/search-flow.html';
    window.location.href = url;
}

async function searchHospitals() {
    const query = document.getElementById('searchInput').value;
    if (query) {
        window.location.href = '/hospitals.html?search=' + encodeURIComponent(query);
    }
}

function quickSearch(category) {
    window.location.href = '/search-flow.html?condition=' + encodeURIComponent(category);
}

// Location functionality
function showLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                alert(`Your location: ${position.coords.latitude}, ${position.coords.longitude}`);
            },
            (error) => {
                alert('Location access denied. Please enable location services.');
            }
        );
    } else {
        alert('Geolocation is not supported by your browser.');
    }
}

// Chat functionality
function openChat() {
    const chatWindow = window.open('', 'MedSentinel Chat', 'width=400,height=600');
    chatWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>MedSentinel AI Chat</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        </head>
        <body class="bg-gray-50 font-['Inter']">
            <div class="h-screen flex flex-col">
                <div class="bg-blue-700 text-white p-4">
                    <h2 class="text-xl font-bold">MedSentinel AI Assistant</h2>
                    <p class="text-sm opacity-90">How can I help you today?</p>
                </div>
                <div class="flex-1 p-4 overflow-y-auto space-y-4">
                    <div class="bg-white p-4 rounded-lg shadow-sm">
                        <p class="text-sm">Hello! I can help you with:</p>
                        <ul class="mt-2 text-sm space-y-1">
                            <li>• Finding hospitals near you</li>
                            <li>• Checking scheme eligibility</li>
                            <li>• Comparing treatment costs</li>
                            <li>• Booking consultations</li>
                        </ul>
                    </div>
                </div>
                <div class="p-4 border-t">
                    <div class="flex gap-2">
                        <input type="text" placeholder="Type your message..." class="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                        <button class="bg-blue-700 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-800">Send</button>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `);
}

// Load schemes on homepage
async function loadHomeSchemes() {
    try {
        const response = await fetch(`${API_BASE}/schemes`);
        const schemes = await response.json();
        
        const grid = document.getElementById('schemesGrid');
        if (grid) {
            grid.innerHTML = schemes.slice(0, 3).map((s, index) => {
                const colors = [
                    { from: 'from-blue-600', to: 'to-blue-700', badge: 'bg-blue-500' },
                    { from: 'from-purple-600', to: 'to-purple-700', badge: 'bg-purple-500' },
                    { from: 'from-green-600', to: 'to-green-700', badge: 'bg-green-500' }
                ];
                const color = colors[index];
                
                return `
                <div class="group bg-gradient-to-br ${color.from} ${color.to} text-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 relative overflow-hidden">
                    <!-- Decorative Background -->
                    <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                    <div class="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
                    
                    <div class="relative z-10">
                        <div class="flex items-center justify-between mb-4">
                            <span class="${color.badge} text-white text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wide">${s.type}</span>
                            <span class="material-symbols-outlined text-white/80 text-3xl">verified</span>
                        </div>
                        <h3 class="text-2xl font-bold mb-3 leading-tight">${s.name}</h3>
                        <p class="text-white/90 text-sm mb-6 leading-relaxed">${s.description}</p>
                        
                        <!-- Coverage Badge -->
                        <div class="bg-white/20 backdrop-blur-sm rounded-xl p-3 mb-6 border border-white/30">
                            <div class="text-xs text-white/80 mb-1">Coverage</div>
                            <div class="text-lg font-bold">${s.coverage}</div>
                        </div>
                        
                        <a href="/schemes.html" class="inline-flex items-center space-x-2 bg-white text-gray-900 px-6 py-3 rounded-xl font-bold hover:shadow-xl transition-all group-hover:scale-105">
                            <span>Learn More</span>
                            <span class="material-symbols-outlined text-lg">arrow_forward</span>
                        </a>
                    </div>
                </div>
            `}).join('');
        }
    } catch (error) {
        console.error('Error loading schemes:', error);
    }
}

// Load hospitals on homepage
async function loadHomeHospitals() {
    try {
        const response = await fetch(`${API_BASE}/hospitals`);
        const hospitals = await response.json();
        
        // Hospital placeholder images from Unsplash
        const hospitalImages = [
            'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&h=300&fit=crop',
            'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=400&h=300&fit=crop',
            'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=400&h=300&fit=crop'
        ];
        
        const grid = document.getElementById('hospitalsGrid');
        if (grid) {
            grid.innerHTML = hospitals.slice(0, 3).map((h, index) => `
                <div class="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-blue-200 hover:-translate-y-2">
                    <div class="h-48 bg-gradient-to-br from-blue-100 to-blue-200 relative overflow-hidden">
                        <img src="${hospitalImages[index]}" alt="${h.name}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" onerror="this.src='https://via.placeholder.com/400x300/3b82f6/ffffff?text=Hospital'">
                        <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                        <div class="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold text-green-600 flex items-center gap-1 shadow-lg">
                            <span class="material-symbols-outlined text-sm">star</span> ${h.rating}
                        </div>
                    </div>
                    <div class="p-6">
                        <h3 class="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">${h.name}</h3>
                        <div class="space-y-2.5 mb-6">
                            <div class="flex items-center gap-2 text-gray-600 text-sm">
                                <span class="material-symbols-outlined text-base text-blue-600">location_on</span>
                                <span>${h.location}</span>
                            </div>
                            <div class="flex items-center gap-2 text-gray-600 text-sm">
                                <span class="material-symbols-outlined text-base text-green-600">payments</span>
                                <span>Starting at <span class="font-bold text-gray-900">${h.cost_range}</span></span>
                            </div>
                        </div>
                        <div class="flex flex-wrap gap-2 mb-6">
                            ${h.schemes.split(',').slice(0, 2).map(s => `
                                <span class="text-xs font-semibold px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">${s.trim()}</span>
                            `).join('')}
                        </div>
                        <a href="/hospital-details.html?id=${h.id}" class="block w-full py-3.5 text-center rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold hover:shadow-lg hover:scale-105 transition-all">View Details →</a>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading hospitals:', error);
    }
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

function init() {
    // Load data for homepage
    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
        loadHomeSchemes();
        loadHomeHospitals();
    }
    
    // Add enter key support for search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchHospitals();
            }
        });
    }
}
