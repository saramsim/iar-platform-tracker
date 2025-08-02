// Simulated data - gerçek API entegrasyonu için değiştirilecek
const simulatedData = {
    'usd-try': { buy: 34.25, sell: 34.35, change: 0.15 },
    'eur-try': { buy: 36.80, sell: 36.95, change: -0.08 },
    'gold-ons': { buy: 2045.50, sell: 2047.80, change: 12.30 },
    'silver-kg': { buy: 28450, sell: 28650, change: -125 },
    'quarter': { buy: 3850, sell: 3920, change: 25 },
    'ata': { buy: 15400, sell: 15600, change: 80 }
};

// Alarm sistemi
let alarms = {};

function initializeAlarms() {
    try {
        const savedAlarms = localStorage.getItem('priceAlarms');
        alarms = savedAlarms ? JSON.parse(savedAlarms) : {};
    } catch (error) {
        console.error('Alarm yükleme hatası:', error);
        alarms = {};
    }
}

function updateTime() {
    const now = new Date();
    document.getElementById('lastUpdate').textContent = 
        now.toLocaleTimeString('tr-TR');
}

function updatePriceDisplay(elementPrefix, data) {
    document.getElementById(`${elementPrefix}-buy`).textContent = 
        data.buy.toLocaleString('tr-TR');
    document.getElementById(`${elementPrefix}-sell`).textContent = 
        data.sell.toLocaleString('tr-TR');
    
    const changeElement = document.getElementById(`${elementPrefix}-change`);
    const changeSpan = changeElement.querySelector('span');
    
    if (data.change > 0) {
        changeElement.className = 'change-indicator change-positive';
        changeSpan.textContent = `📈 +${data.change.toLocaleString('tr-TR')}`;
    } else if (data.change < 0) {
        changeElement.className = 'change-indicator change-negative';
        changeSpan.textContent = `📉 ${data.change.toLocaleString('tr-TR')}`;
    } else {
        changeElement.className = 'change-indicator change-neutral';
        changeSpan.textContent = `➡️ Değişim yok`;
    }
}

// API Bağlantı Yönetimi
const API_BASE_URL = 'http://localhost:5000'; // Backend sunucu adresi
let isConnected = false;
let fallbackMode = true; // Geçici olarak fallback kullan

function updateConnectionStatus(status, message) {
    const statusDot = document.getElementById('statusDot');
    const connectionText = document.getElementById('connectionText');
    
    statusDot.className = `status-dot ${status}`;
    connectionText.textContent = message;
    
    isConnected = status === 'success';
}

function fetchRealData() {
    // Eğer fallback mode açıksa direkt simulated data kullan
    if (fallbackMode) {
        return simulateDataFetch();
    }
    
    return fetch(`${API_BASE_URL}/api/prices`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            updateConnectionStatus('success', 'Canlı Veri - Bağlı');
            fallbackMode = false;
            
            // API formatını dashboard formatına çevir
            return {
                'usd-try': data.usd_try || { buy: 0, sell: 0, change: 0 },
                'eur-try': data.eur_try || { buy: 0, sell: 0, change: 0 },
                'gold-ons': data.gold_ons || { buy: 0, sell: 0, change: 0 },
                'silver-kg': data.silver_kg || { buy: 0, sell: 0, change: 0 },
                'quarter': data.quarter || { buy: 0, sell: 0, change: 0 },
                'ata': data.ata || { buy: 0, sell: 0, change: 0 }
            };
        })
        .catch(error => {
            // Sessizce fallback'e geç
            fallbackMode = true;
            return simulateDataFetch();
        });
}

function simulateDataFetch() {
    // Gerçek API çalışmadığında fallback
    updateConnectionStatus('connecting', 'Demo Mod - GitHub Pages');
    
    // Rastgele küçük değişiklikler ekle
    Object.keys(simulatedData).forEach(key => {
        const data = simulatedData[key];
        const changePercent = (Math.random() - 0.5) * 0.02;
        
        data.buy *= (1 + changePercent);
        data.sell *= (1 + changePercent);
        data.change = data.change + (Math.random() - 0.5) * 10;
        
        if (key.includes('usd') || key.includes('eur')) {
            data.buy = Math.round(data.buy * 100) / 100;
            data.sell = Math.round(data.sell * 100) / 100;
            data.change = Math.round(data.change * 100) / 100;
        } else {
            data.buy = Math.round(data.buy);
            data.sell = Math.round(data.sell);
            data.change = Math.round(data.change);
        }
    });

    return Promise.resolve(simulatedData);
}

// API durumunu kontrol et
function checkApiConnection() {
    fetch(`${API_BASE_URL}/api/status`)
        .then(response => response.json())
        .then(data => {
            fallbackMode = false;
            console.log('✅ Backend sunucu bulundu!');
        })
        .catch(error => {
            fallbackMode = true;
            // Artık console'a hata yazma
        });
}

// Drag & Drop functionality
let draggedElement = null;

function initializeDragAndDrop() {
    const cards = document.querySelectorAll('.card');
    const grid = document.querySelector('.grid');

    cards.forEach(card => {
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragend', handleDragEnd);
    });

    grid.addEventListener('dragover', handleDragOver);
    grid.addEventListener('drop', handleDrop);
}

function handleDragStart(e) {
    draggedElement = this;
    this.classList.add('dragging');
    
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.outerHTML);
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    draggedElement = null;
}

function handleDragOver(e) {
    if (draggedElement) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        const afterElement = getDragAfterElement(this, e.clientY);
        if (afterElement == null) {
            this.appendChild(draggedElement);
        } else {
            this.insertBefore(draggedElement, afterElement);
        }
    }
}

function handleDrop(e) {
    if (draggedElement) {
        e.preventDefault();
        saveLayout();
    }
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.card:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function saveLayout() {
    const grid = document.querySelector('.grid');
    const cardIds = Array.from(grid.querySelectorAll('.card')).map(card => card.dataset.id);
    localStorage.setItem('iarDashboardLayout', JSON.stringify(cardIds));
}

function loadLayout() {
    try {
        const savedLayout = localStorage.getItem('iarDashboardLayout');
        if (!savedLayout) return;
        
        const cardIds = JSON.parse(savedLayout);
        
        // Eğer cardIds bir array değilse, temizle ve çık
        if (!Array.isArray(cardIds)) {
            localStorage.removeItem('iarDashboardLayout'); // Bozuk veriyi temizle
            return;
        }
        
        const grid = document.querySelector('.grid');
        if (!grid) return;
        
        cardIds.forEach(cardId => {
            const card = document.querySelector(`[data-id="${cardId}"]`);
            if (card) {
                grid.appendChild(card);
            }
        });
        
    } catch (error) {
        // Hata durumunda localStorage'ı temizle
        localStorage.removeItem('iarDashboardLayout');
    }
}

function toggleAlarm(currency) {
    const input = document.getElementById(`${currency}-alarm-input`);
    const btn = document.getElementById(`${currency}-alarm-btn`);
    const status = document.getElementById(`${currency}-alarm-status`);
    const targetPrice = parseFloat(input.value);

    if (!targetPrice || targetPrice <= 0) {
        alert('Lütfen geçerli bir hedef fiyat girin!');
        return;
    }

    if (!alarms) alarms = {};

    if (alarms[currency]) {
        // Alarmı kapat
        delete alarms[currency];
        btn.textContent = '🔔 Alarm';
        btn.classList.remove('active');
        status.innerHTML = '<span>⏰ Alarm kapalı</span>';
        status.classList.remove('active');
    } else {
        // Alarmı aç
        alarms[currency] = {
            targetPrice: targetPrice,
            triggered: false
        };
        btn.textContent = '🔕 Kapat';
        btn.classList.add('active');
        status.innerHTML = `<span>🔔 Hedef: ${targetPrice.toLocaleString('tr-TR')}</span>`;
        status.classList.add('active');
    }

    try {
        localStorage.setItem('priceAlarms', JSON.stringify(alarms));
    } catch (error) {
        console.error('Alarm kaydetme hatası:', error);
    }
}

function checkAlarms() {
    if (!alarms || typeof alarms !== 'object') return;
    
    Object.keys(alarms).forEach(currency => {
        const alarm = alarms[currency];
        if (!alarm || alarm.triggered) return;

        const currentPriceElement = document.getElementById(`${currency}-sell`);
        if (!currentPriceElement) return;

        const currentPriceText = currentPriceElement.textContent.replace(/[.,\s]/g, '');
        const currentPrice = parseFloat(currentPriceText);
        if (isNaN(currentPrice)) return;

        const targetPrice = alarm.targetPrice;
        
        // Fiyat hedefine ulaştı mı kontrol et
        if (currentPrice >= targetPrice) {
            showNotification(currency, currentPrice, targetPrice);
            alarm.triggered = true;
            
            // Alarm durumunu güncelle
            const btn = document.getElementById(`${currency}-alarm-btn`);
            const status = document.getElementById(`${currency}-alarm-status`);
            
            if (btn && status) {
                btn.textContent = '✅ Tetiklendi';
                btn.classList.remove('active');
                status.innerHTML = `<span>✅ Hedef ulaşıldı!</span>`;
                status.classList.remove('active');
            }
            
            try {
                localStorage.setItem('priceAlarms', JSON.stringify(alarms));
            } catch (error) {
                console.error('Alarm kaydetme hatası:', error);
            }
        }
    });
}

// Vibration feedback (destekleyen cihazlarda)
function vibrate(pattern = [100]) {
    if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
    }
}

// Alarm tetiklendiğinde vibration
function showNotification(currency, currentPrice, targetPrice) {
    // Vibration feedback
    vibrate([200, 100, 200]);
    
    // Ses çal
    playNotificationSound();
    
    // Tarayıcı bildirimi
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('💰 Fiyat Alarmı!', {
            body: `${getCurrencyName(currency)} hedef fiyata ulaştı: ${currentPrice.toLocaleString('tr-TR')}`,
            icon: 'icon-192.png',
            vibrate: [200, 100, 200],
            requireInteraction: true
        });
    }
    
    // Dashboard bildirimi
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <div class="notification-title">🔔 Fiyat Alarmı!</div>
        <div class="notification-text">
            ${getCurrencyName(currency)}<br>
            Hedef: ${targetPrice.toLocaleString('tr-TR')}<br>
            Güncel: ${currentPrice.toLocaleString('tr-TR')}
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // 5 saniye sonra kaldır
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

function getCurrencyName(currency) {
    const names = {
        'usd': 'USD/TRY',
        'eur': 'EUR/TRY',
        'gold': 'Altın ONS/USD',
        'silver': 'Gümüş KG/TRY',
        'quarter': 'Eski Çeyrek',
        'ata': 'Eski Ata'
    };
    return names[currency] || currency;
}

function playNotificationSound() {
    // Basit bir beep sesi oluştur
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
        // Ses çalma hatası - sessizce geç
    }
}

function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

function loadAlarms() {
    if (!alarms || typeof alarms !== 'object') return;
    
    Object.keys(alarms).forEach(currency => {
        const alarm = alarms[currency];
        if (!alarm) return;
        
        const input = document.getElementById(`${currency}-alarm-input`);
        const btn = document.getElementById(`${currency}-alarm-btn`);
        const status = document.getElementById(`${currency}-alarm-status`);
        
        if (input && btn && status) {
            input.value = alarm.targetPrice;
            
            if (alarm.triggered) {
                btn.textContent = '✅ Tetiklendi';
                btn.classList.remove('active');
                status.innerHTML = `<span>✅ Hedef ulaşıldı!</span>`;
                status.classList.remove('active');
            } else {
                btn.textContent = '🔕 Kapat';
                btn.classList.add('active');
                status.innerHTML = `<span>🔔 Hedef: ${alarm.targetPrice.toLocaleString('tr-TR')}</span>`;
                status.classList.add('active');
            }
        }
    });
}

async function refreshData() {
    try {
        // Önce gerçek API'yi dene, sonra fallback
        const data = await fetchRealData();
        
        updatePriceDisplay('usd', data['usd-try']);
        updatePriceDisplay('eur', data['eur-try']);
        updatePriceDisplay('gold', data['gold-ons']);
        updatePriceDisplay('silver', data['silver-kg']);
        updatePriceDisplay('quarter', data['quarter']);
        updatePriceDisplay('ata', data['ata']);
        
        updateTime();
        
        // Alarm kontrolü
        checkAlarms();
        
    } catch (error) {
        console.error('Veri çekme hatası:', error);
        updateConnectionStatus('error', 'Veri Hatası');
    }
}

// PWA Install Prompt
let deferredPrompt;
let isInstalled = false;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallPrompt();
});

function showInstallPrompt() {
    if (!isInstalled && deferredPrompt) {
        const installPrompt = document.getElementById('installPrompt');
        installPrompt.style.display = 'flex';
        
        // 10 saniye sonra otomatik gizle
        setTimeout(() => {
            installPrompt.style.display = 'none';
        }, 10000);
    }
}

function installPWA() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('PWA yüklendi');
                isInstalled = true;
            }
            deferredPrompt = null;
            document.getElementById('installPrompt').style.display = 'none';
        });
    }
}

// Otomatik yenileme (5 saniyede bir)
setInterval(refreshData, 5000);

// API durumunu kontrol et (30 saniyede bir)
setInterval(checkApiConnection, 30000);

// Sayfa yüklendiğinde
initializeAlarms(); // Alarmları ilk olarak başlat
requestNotificationPermission(); // Bildirim izni iste
loadLayout(); // Layout'u yükle
loadAlarms(); // Alarmları yükle
checkApiConnection(); // API durumunu kontrol et
refreshData(); // Veriyi çek
initializeDragAndDrop(); // Drag & drop'u başlat

// Mobil optimizasyonları
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

if (isMobile) {
    // Touch için optimizasyonlar
    document.body.style.touchAction = 'manipulation';
    
    // Zoom engelle
    document.addEventListener('gesturestart', function (e) {
        e.preventDefault();
    });
    
    // Drag & drop'u mobilde devre dışı bırak
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.draggable = false;
        card.style.cursor = 'default';
        
        // Touch feedback
        card.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.98)';
            this.style.transition = 'transform 0.1s ease';
        });
        
        card.addEventListener('touchend', function() {
            this.style.transform = '';
            this.style.transition = 'transform 0.3s ease';
        });
    });
    
    // Drag handle'ları gizle
    const dragHandles = document.querySelectorAll('.drag-handle');
    dragHandles.forEach(handle => {
        handle.style.display = 'none';
    });
}

// Zaman güncellemeyi başlat
setInterval(updateTime, 1000);
updateTime();

// Service Worker kaydı (PWA için) - sadece HTTPS'de çalışır
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    // Basit service worker inline olarak oluştur
    const swCode = `
        self.addEventListener('install', event => {
            console.log('Service Worker installed');
            self.skipWaiting();
        });
        
        self.addEventListener('activate', event => {
            console.log('Service Worker activated');
        });
        
        self.addEventListener('fetch', event => {
            // Basic cache strategy - sadece network
            event.respondWith(fetch(event.request));
        });
    `;
    
    const blob = new Blob([swCode], { type: 'application/javascript' });
    const swUrl = URL.createObjectURL(blob);
    
    navigator.serviceWorker.register(swUrl)
        .then(registration => {
            console.log('Service Worker kayıtlı');
        })
        .catch(error => {
            // Service Worker hatasını sessizce geç
        });
}
