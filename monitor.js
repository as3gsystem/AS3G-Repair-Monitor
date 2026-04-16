const firebaseConfig = {
    apiKey: "AIzaSyDQQ36MQMR1UvOpaoSvwRG_ZsMJttlC7VQ",
    authDomain: "alsheer.firebaseapp.com",
    projectId: "alsheer",
    storageBucket: "alsheer.firebasestorage.app",
    messagingSenderId: "138212467243",
    appId: "1:138212467243:web:0a2985296db9126e77406e",
    measurementId: "G-3XVP2VQJSJ"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
const auth = firebase.auth();

// Elements
const loader = document.getElementById('loader');
const dashboardContent = document.getElementById('dashboardContent');
const connectionStatus = document.getElementById('connectionStatus');
const loginOverlay = document.getElementById('loginOverlay');
const loginEmail = document.getElementById('loginEmail');
const loginPass = document.getElementById('loginPassword');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const linkingView = document.getElementById('linkingView');
const linkBtn = document.getElementById('linkBtn');
const monitorKeyCode = document.getElementById('monitorKeyCode');
const linkError = document.getElementById('linkError');
const cafeListView = document.getElementById('cafeListView');
const cafesListContainer = document.getElementById('cafesListContainer');
const addNewCafeBtn = document.getElementById('addNewCafeBtn');
const switchCafeBtn = document.getElementById('switchCafeBtn');
const mainNav = document.getElementById('mainNav');

let currentUnsubscribe = null;
let lastSnapData = null; // Store for tab switching

// --- TAB SWITCHING ---
window.switchTab = function (tabName) {
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.toggle('active', tab.getAttribute('onclick').includes(`'${tabName}'`));
    });
    document.querySelectorAll('.dashboard-section').forEach(sec => {
        sec.classList.remove('active');
    });
    const target = document.getElementById(`section-${tabName}`);
    if (target) target.classList.add('active');

    if (lastSnapData) renderCurrentTab(tabName);
};

// --- Notifications ---
window.showToast = function (message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';

    toast.innerHTML = `
        <i class="fa-solid ${icon}"></i>
        <div style="flex:1;">${message}</div>
    `;

    container.appendChild(toast);

    // Auto remove
    setTimeout(() => {
        toast.classList.add('toast-out');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
};

// --- Custom Confirmation Modal ---
window.openConfirmModal = function (message, onConfirm) {
    const modal = document.getElementById('confirmModal');
    const title = document.getElementById('confirmTitle');
    const yesBtn = document.getElementById('confirmYesBtn');

    if (!modal || !title || !yesBtn) return;

    title.innerText = message;
    modal.style.display = 'flex';

    // Set up confirm action
    yesBtn.onclick = () => {
        onConfirm();
        closeConfirmModal();
    };
};

window.closeConfirmModal = function () {
    const modal = document.getElementById('confirmModal');
    if (modal) modal.style.display = 'none';
};

function renderCurrentTab(tabName) {
    if (!lastSnapData) return;
    switch (tabName) {
        case 'overview':
            renderDashboard(lastSnapData);
            break;
        case 'devices':
            renderDevicesFull(lastSnapData);
            break;
        case 'reports':
            renderReports(lastSnapData);
            break;
        case 'expenses':
            renderExpensesFull(lastSnapData);
            break;
        case 'users':
            renderUsers(lastSnapData);
            break;
        case 'shifts':
            renderShifts(lastSnapData);
            break;
        case 'logs':
            renderLogs(lastSnapData);
            break;
        case 'inventory':
            renderInventory(lastSnapData);
            break;
        case 'wallets':
            renderWallets(lastSnapData);
            break;
    }
}

// --- Auth Handling ---
auth.onAuthStateChanged(user => {
    if (user) {
        if (loginOverlay) loginOverlay.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'block';
        checkUserLink(user.uid);
    } else {
        if (loginOverlay) loginOverlay.style.display = 'flex';
        if (dashboardContent) dashboardContent.style.display = 'none';
        if (mainNav) mainNav.style.display = 'none';
        if (linkingView) linkingView.style.display = 'none';
        if (cafeListView) cafeListView.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (switchCafeBtn) switchCafeBtn.style.display = 'none';
        if (connectionStatus) connectionStatus.style.display = 'none';
        if (loader) loader.style.display = 'none';
        if (currentUnsubscribe) currentUnsubscribe();
    }
});

if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
        const email = loginEmail.value.trim();
        const pass = loginPass.value.trim();
        if (!email || !pass) return;
        loginBtn.disabled = true;
        loginBtn.innerText = 'جاري التحقق...';
        if (loginError) loginError.style.display = 'none';
        try {
            await auth.signInWithEmailAndPassword(email, pass);
        } catch (err) {
            console.error("Login Error:", err);
            if (loginError) { loginError.innerText = "فشل تسجيل الدخول. تأكد من البيانات."; loginError.style.display = 'block'; }
        } finally { loginBtn.disabled = false; loginBtn.innerText = 'دخول النظام'; }
    });
}

// --- Register Handling ---
window.showRegister = function() {
    document.getElementById('loginCard').style.display = 'none';
    document.getElementById('registerCard').style.display = 'flex';
};

window.showLogin = function() {
    document.getElementById('registerCard').style.display = 'none';
    document.getElementById('loginCard').style.display = 'flex';
};

const registerBtn = document.getElementById('registerBtn');
if (registerBtn) {
    registerBtn.addEventListener('click', async () => {
        const email = document.getElementById('registerEmail').value.trim();
        const pass = document.getElementById('registerPassword').value.trim();
        const confirmPass = document.getElementById('registerConfirmPassword').value.trim();
        const registerError = document.getElementById('registerError');

        if (!email || !pass || !confirmPass) {
            registerError.innerText = "يرجى ملء جميع الحقول.";
            registerError.style.display = 'block';
            return;
        }

        if (pass !== confirmPass) {
            registerError.innerText = "كلمات المرور غير متطابقة.";
            registerError.style.display = 'block';
            return;
        }

        registerBtn.disabled = true;
        registerBtn.innerText = 'جاري إنشاء الحساب...';
        registerError.style.display = 'none';

        try {
            await auth.createUserWithEmailAndPassword(email, pass);
            showToast("تم إنشاء الحساب بنجاح!", "success");
            showLogin();
        } catch (err) {
            console.error("Register Error:", err);
            registerError.innerText = "فشل إنشاء الحساب: " + (err.message || "خطأ غير معروف");
            registerError.style.display = 'block';
        } finally {
            registerBtn.disabled = false;
            registerBtn.innerText = 'إنشاء الحساب';
        }
    });
}

if (logoutBtn) { logoutBtn.onclick = () => auth.signOut(); }

async function checkUserLink(uid) {
    if (loader) loader.style.display = 'flex';
    try {
        const querySnapshot = await db.collection("user_cafe_links").where("uid", "==", uid).get();
        if (loader) loader.style.display = 'none';
        if (querySnapshot.empty) {
            if (linkingView) linkingView.style.display = 'flex';
        } else if (querySnapshot.size === 1) {
            startMonitoring(querySnapshot.docs[0].data().monitorKey);
        } else {
            renderCafesList(querySnapshot.docs);
        }
    } catch (err) {
        console.error("Error checking user link:", err);
        if (loader) loader.style.display = 'none';
        if (err.code === 'permission-denied') {
            alert("خطأ في الصلاحيات: يرجى التأكد من ضبط قواعد الحماية (Rules) في Firestore لمشروع alsheer لتسمح بالقراءة.");
        }
    }
}

function renderCafesList(docs) {
    if (!cafesListContainer) return;
    if (cafeListView) cafeListView.style.display = 'flex';
    if (linkingView) linkingView.style.display = 'none';
    cafesListContainer.innerHTML = docs.map(doc => {
        const data = doc.data();
        return `<div class="glass-card" style="margin-bottom: 0.8rem; cursor: pointer; padding: 1.2rem; display:flex; align-items:center; gap:1rem;" onclick="startMonitoring('${data.monitorKey}')">
                <i class="fa-solid fa-store" style="color:var(--accent); font-size:1.5rem;"></i>
                <div style="flex:1; text-align:right;">
                    <div style="font-weight:bold;">${data.cafeName || 'مركز صيانة غير مسمى'}</div>
                    <div style="font-size:0.8rem; color:var(--text-secondary);">كود: ${data.monitorKey}</div>
                </div>
                <i class="fa-solid fa-chevron-left"></i>
            </div>`;
    }).join('');
}

if (addNewCafeBtn) { addNewCafeBtn.onclick = () => { cafeListView.style.display = 'none'; linkingView.style.display = 'flex'; }; }
if (switchCafeBtn) { switchCafeBtn.onclick = () => checkUserLink(auth.currentUser.uid); }

if (linkBtn) {
    linkBtn.addEventListener('click', async () => {
        const code = monitorKeyCode.value.trim().toUpperCase();
        if (!code) return;
        linkBtn.disabled = true;
        if (linkError) linkError.style.display = 'none';
        try {
            const accessDoc = await db.collection("monitor_access").doc(code).get();
            if (accessDoc.exists) {
                const accessData = accessDoc.data();
                const user = auth.currentUser;
                if (accessData.linkedTo && accessData.linkedTo !== user.uid) {
                    linkError.innerText = "هذا الكود مستخدم بالفعل."; linkError.style.display = 'block'; return;
                }
                const licenseCode = accessData.licenseCode || 'N/A';
                await db.collection("monitor_access").doc(code).update({
                    linkedTo: user.uid,
                    linkedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                await db.collection("user_cafe_links").doc(`${user.uid}_${code}`).set({
                    uid: user.uid,
                    email: user.email,
                    licenseCode: licenseCode,
                    cafeName: accessData.cafeName || 'Unnamed Repair Center',
                    monitorKey: code,
                    linkedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                startMonitoring(code);
            } else {
                linkError.innerText = "الكود غير صحيح.";
                linkError.style.display = 'block';
            }
        } catch (err) {
            console.error("Linking Error Details:", err);
            if (err.code === 'permission-denied') {
                linkError.innerText = "فشل الربط: لا توجد صلاحية (Firestore Rules).";
            } else {
                linkError.innerText = "حدث خطأ أثناء الربط. تأكد من الإنترنت.";
            }
            linkError.style.display = 'block';
        }
        finally { linkBtn.disabled = false; }
    });
}

function startMonitoring(monitorKey) {
    if (currentUnsubscribe) currentUnsubscribe();
    if (cafeListView) cafeListView.style.display = 'none';
    if (linkingView) linkingView.style.display = 'none';
    if (loader) loader.style.display = 'flex';
    localStorage.setItem('last_monitored_code', monitorKey);

    currentUnsubscribe = db.collection("cafe_snapshots").doc(monitorKey)
        .onSnapshot((doc) => {
            if (loader) loader.style.display = 'none';
            if (doc.exists) {
                lastSnapData = doc.data();
                const activeTabEl = document.querySelector('.nav-tab.active');
                if (activeTabEl) {
                    const activeTab = activeTabEl.getAttribute('onclick').match(/'([^']+)'/)[1];
                    renderCurrentTab(activeTab);
                }
                if (dashboardContent) dashboardContent.style.display = 'block';
                if (mainNav) mainNav.style.display = 'flex';
                if (connectionStatus) connectionStatus.style.display = 'flex';
                if (switchCafeBtn) switchCafeBtn.style.display = 'flex';
            }
        }, (err) => { if (loader) loader.style.display = 'none'; console.error("Monitor Error:", err); });
}

// --- RENDER FUNCTIONS ---

function renderDashboard(data) {
    document.getElementById('monitorCafeName').innerText = data.cafeName || 'Unnamed Repair Center';
    const ad = data.activationData || {};
    const displayCode = ad.code || data.licenseCode || '----';
    document.getElementById('monitorLicenseCode').innerText = `الترخيص: ${displayCode} | كود المتابعة: ${data.monitorKey}`;

    const stats = data.stats || {};
    document.getElementById('statActiveDevices').innerText = `${stats.totalDevices || 0} / ${stats.activeSessions || 0}`;
    document.getElementById('statTodayRevenue').innerText = `${stats.todayRevenue || 0} ج.م`;

    // Wallet Today Stats
    const todayAtStart = new Date().setHours(0, 0, 0, 0);
    const walletTxs = data.walletTransactions || [];
    const todayWalletDeposits = walletTxs
        .filter(t => t.timeInfo >= todayAtStart && t.type === 'deposit')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    const todayWalletWithdrawals = walletTxs
        .filter(t => t.timeInfo >= todayAtStart && t.type === 'withdraw')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    document.getElementById('statWalletDeposits').innerText = `${todayWalletDeposits} ج.م`;
    document.getElementById('statWalletWithdrawals').innerText = `${todayWalletWithdrawals} ج.م`;

    // Net Profit Calculation: (Revenue + Deposits) - (Expenses + Withdrawals)
    const netProfit = (stats.todayRevenue || 0) + todayWalletDeposits - (stats.todayExpenses || 0) - todayWalletWithdrawals;
    const netEl = document.getElementById('statNetProfit');
    netEl.innerText = `${netProfit} ج.م`;
    netEl.style.color = netProfit >= 0 ? 'var(--success)' : 'var(--danger)';
    
    if (data.lastSync) {
        const syncDate = (data.lastSync && data.lastSync.toDate) ? data.lastSync.toDate() : new Date(data.lastSync);
        document.getElementById('overviewSyncTime').innerText = `Synced at: ${syncDate.toLocaleTimeString()}`;
    }

    // Sidebar: Expenses
    const expList = document.getElementById('todayExpensesList');
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayExps = (data.expenses || []).filter(e => e.date === todayStr);
    if (todayExps.length === 0) expList.innerHTML = '<p style="font-size:0.8rem; color:var(--text-secondary);">لا توجد مصروفات</p>';
    else expList.innerHTML = todayExps.map(e => `<div style="display:flex; justify-content:space-between; font-size:0.9rem; border-bottom:1px solid rgba(255,255,255,0.02); padding:5px 0;"><span>${e.title}</span><span style="color:var(--danger); font-weight:800;">${e.amount} ج.م</span></div>`).join('');
    
    const shiftSum = document.getElementById('shiftsSummary');
    const latestShift = (data.shifts || []).sort((a, b) => (b.id || 0) - (a.id || 0))[0];
    if (!latestShift) shiftSum.innerHTML = '<p style="font-size:0.8rem; color:var(--text-secondary);">لا ورديات</p>';
    else {
        const rev = latestShift.transactions ? latestShift.transactions.sessionsRevenue : 0;
        shiftSum.innerHTML = `<div style="font-size:0.9rem;"><div>الموظف: <b>${latestShift.userName}</b></div><div>التحصيل: <span style="color:var(--success); font-weight:800;">${rev} ج.م</span></div></div>`;
    }

    renderSubscriptionInfo(data);
}

function renderWallets(data) {
    const grid = document.getElementById('walletsGrid');
    const wallets = data.wallets || [];
    if (!grid) return;

    if (wallets.length === 0) {
        grid.innerHTML = '<p style="padding:2rem; color:var(--text-secondary);">لا توجد محافظ مسجلة</p>';
    } else {
        grid.innerHTML = wallets.map(w => `
            <div class="glass-card" style="padding:1.5rem; text-align:center; border-top: 4px solid ${w.color || 'var(--accent)'}">
                <div style="display:flex; justify-content:flex-end; margin-bottom:-1rem;">
                    <button onclick="promptDeleteWallet(${w.id}, '${w.name}')" style="background:none; border:none; color:var(--danger); cursor:pointer; opacity:0.3;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.3"><i class="fa-solid fa-trash-can"></i></button>
                </div>
                <div style="font-size:2rem; color:${w.color || 'var(--accent)'}; margin-bottom:1rem;"><i class="fa-solid ${w.icon || 'fa-wallet'}"></i></div>
                <div style="font-weight:800; font-size:1.1rem; margin-bottom:0.3rem;">${w.name}</div>
                <div class="en-font" style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:1rem;">${w.number || '---'}</div>
                <div class="en-font" style="font-size:1.4rem; font-weight:800; color:white; margin-bottom:1.5rem;">${w.balance || 0} ج.م</div>
                <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px;">
                    <button class="action-btn-small" onclick="openDeposit(${w.id}, '${w.name}')" title="إيداع" style="background:rgba(16,185,129,0.1); color:var(--success); border-color:rgba(16,185,129,0.2);"><i class="fa-solid fa-arrow-down"></i></button>
                    <button class="action-btn-small" onclick="openWithdraw(${w.id}, '${w.name}')" title="سحب" style="background:rgba(239,68,68,0.1); color:var(--danger); border-color:rgba(239,68,68,0.2);"><i class="fa-solid fa-arrow-up"></i></button>
                    <button class="action-btn-small" onclick="openTransfer(${w.id}, '${w.name}')" title="تحويل" style="background:rgba(59,130,246,0.1); color:var(--primary); border-color:rgba(59,130,246,0.2);"><i class="fa-solid fa-exchange-alt"></i></button>
                </div>
            </div>
        `).join('');
    }

    const tableBody = document.getElementById('walletTransactionsTableBody');
    const transactions = (data.walletTransactions || []).sort((a, b) => (b.id || 0) - (a.id || 0)).slice(0, 50);
    if (!tableBody) return;

    if (transactions.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:2rem; color:var(--text-secondary);">لا توجد حركات مسجلة</td></tr>';
    } else {
        tableBody.innerHTML = transactions.map(t => {
            const wallet = wallets.find(w => w.id === t.walletId) || { name: 'محفظة محذوفة' };
            const isDeposit = t.type === 'deposit';
            const isTransfer = t.type === 'transfer';
            const time = t.timestamp || '--:--';
            
            let typeHtml = '';
            if (isTransfer) {
                typeHtml = `<span class="status-pill" style="background:rgba(59, 130, 246, 0.1); color:var(--primary); border:none;">تحويل</span>`;
            } else {
                typeHtml = `<span class="status-pill" style="background:${isDeposit ? 'rgba(16,185,129,0.1)' : 'rgba(239, 68, 68, 0.1)'}; color:${isDeposit ? 'var(--success)' : 'var(--danger)'}; border:none;">${isDeposit ? 'إيداع' : 'سحب'}</span>`;
            }

            let details = t.note || '';
            if (isTransfer) details = `من: ${t.fromName} <br> إلى: ${t.toName} ${details ? `<br>(${details})` : ''}`;

            return `
                <tr>
                    <td class="en-font">${time}</td>
                    <td style="font-weight:700;">${isTransfer ? '--' : wallet.name}</td>
                    <td>${typeHtml}</td>
                    <td class="en-font" style="font-weight:800; color:${isTransfer ? 'var(--primary)' : (isDeposit ? 'var(--success)' : 'var(--danger)')}">${t.amount} ج.م</td>
                    <td style="font-size:0.85rem; color:var(--text-secondary);">${details}</td>
                </tr>
            `;
        }).join('');
    }
}

function renderDevicesFull(data) {
    const list = document.getElementById('devicesFullList');
    list.innerHTML = (data.devices || []).map(device => {
        const isBusy = device.status === 'busy';
        const typeIcon = device.type === 'phone' ? 'fa-mobile-screen-button' : (device.type === 'pc' ? 'fa-desktop' : 'fa-microchip');
        return `<div class="glass-card" style="padding:1.5rem;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1rem;">
                    <div class="device-icon ${isBusy ? 'busy' : ''}"><i class="fa-solid ${typeIcon}"></i></div>
                    <div style="text-align:left;">
                        <button onclick="editDeviceModal(${device.id}, '${device.name}', '${device.type}', ${device.hourlyRate})" style="background:none; border:none; color:var(--text-secondary); cursor:pointer; margin-left:10px;"><i class="fa-solid fa-pen"></i></button>
                        <button onclick="deleteDeviceRemote(${device.id})" style="background:none; border:none; color:var(--danger); cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
                <div style="margin-bottom:1rem;"><div class="device-name">${device.name}</div><div class="session-amount" style="font-size:0.9rem; color:var(--text-secondary);">${device.hourlyRate} ج.م / تكلفة الصيانة</div></div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span class="status-pill" style="background:${isBusy ? 'rgba(0,102,255,0.1)' : 'rgba(16,185,129,0.1)'}; color:${isBusy ? 'var(--accent)' : 'var(--success)'}; border:none;">${isBusy ? 'قيد الصيانة' : 'جاهز حالياً'}</span>
                </div>
            </div>`;
    }).join('');
}

function renderExpensesFull(data) {
    const container = document.getElementById('expensesTableBody');
    if (!container) return;
    const expenses = (data.expenses || []).sort((a, b) => (b.id || 0) - (a.id || 0));
    if (expenses.length === 0) {
        container.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:2rem; color:var(--text-secondary);">لا توجد مصروفات مسجلة</td></tr>';
        return;
    }
    container.innerHTML = expenses.map(e => `<tr><td class="en-font">${e.date}</td><td style="font-weight:700;">${e.title}</td><td class="en-font" style="color:var(--danger); font-weight:800;">${e.amount} ج.م</td><td>${e.details || ''}</td></tr>`).join('');
}

// --- REPORT FILTERING ---
let reportFilters = {
    period: 'today', // today, yesterday, week, month, custom
    start: null,
    end: null,
    user: 'all'
};
let revenueChart = null;

window.setQuickFilter = function(period, btn) {
    reportFilters.period = period;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Clear custom dates
    document.getElementById('reportStartDate').value = '';
    document.getElementById('reportEndDate').value = '';
    
    if (lastSnapData) renderReports(lastSnapData);
};

function getFilteredData(data) {
    if (!data) return { sessions: [], expenses: [], walletTxs: [] };

    let sessions = data.sessions || [];
    let expenses = data.expenses || [];
    let walletTxs = data.walletTransactions || [];

    const now = new Date();
    let start, end;

    if (reportFilters.period === 'custom') {
        start = reportFilters.start ? new Date(reportFilters.start) : null;
        if (start) start.setHours(0,0,0,0);
        end = reportFilters.end ? new Date(reportFilters.end) : null;
        if (end) end.setHours(23,59,59,999);
    } else {
        start = new Date();
        start.setHours(0,0,0,0);
        end = new Date();
        end.setHours(23,59,59,999);

        if (reportFilters.period === 'yesterday') {
            start.setDate(start.getDate() - 1);
            end.setDate(end.getDate() - 1);
        } else if (reportFilters.period === 'week') {
            start.setDate(start.getDate() - 7);
        } else if (reportFilters.period === 'month') {
            start.setMonth(start.getMonth() - 1);
        } else if (reportFilters.period === 'all') {
            start = new Date(0);
        }
    }

    const filterByUser = (item) => reportFilters.user === 'all' || item.userName === reportFilters.user || item.user === reportFilters.user;
    const filterByTime = (item) => {
        const t = (item.startTime || item.timestamp || item.timeInfo || item.date);
        let itemTime;
        if (typeof t === 'string' && t.includes('-')) { // YYYY-MM-DD
            itemTime = new Date(t).getTime();
        } else {
            itemTime = new Date(t).getTime();
        }
        return (!start || itemTime >= start.getTime()) && (!end || itemTime <= end.getTime());
    };

    return {
        sessions: sessions.filter(s => filterByTime(s) && filterByUser(s)),
        expenses: expenses.filter(e => filterByTime(e) && filterByUser(e)),
        walletTxs: walletTxs.filter(t => filterByTime(t) && filterByUser(t))
    };
}

function renderReports(data) {
    const container = document.getElementById('reportsTableBody');
    if (!container) return;

    // Populate user filter if needed
    const userFilter = document.getElementById('reportUserFilter');
    if (userFilter && userFilter.options.length === 1) {
        const users = data.users || [];
        users.forEach(u => {
            const opt = document.createElement('option');
            opt.value = u.name || u.username;
            opt.innerText = u.name || u.username;
            userFilter.appendChild(opt);
        });
    }

    // Handle Custom Date Changes
    const startInput = document.getElementById('reportStartDate');
    const endInput = document.getElementById('reportEndDate');
    if (startInput && !startInput.onchange) {
        startInput.onchange = (e) => { 
            reportFilters.period = 'custom'; 
            reportFilters.start = e.target.value; 
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            renderReports(lastSnapData);
        };
        endInput.onchange = (e) => { 
            reportFilters.period = 'custom'; 
            reportFilters.end = e.target.value; 
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            renderReports(lastSnapData);
        };
        userFilter.onchange = (e) => {
            reportFilters.user = e.target.value;
            renderReports(lastSnapData);
        };
    }

    const filtered = getFilteredData(data);
    const sessions = filtered.sessions.sort((a, b) => b.id - a.id);

    // Update Stats Cards
    const totalRev = sessions.reduce((sum, s) => sum + (parseFloat(s.totalCost) || 0), 0);
    const productsRev = sessions.filter(s => s.type === 'products').reduce((sum, s) => sum + (parseFloat(s.totalCost) || 0), 0);
    const maintenanceRev = totalRev - productsRev;
    const wDep = filtered.walletTxs.filter(t => t.type === 'deposit').reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const wWid = filtered.walletTxs.filter(t => t.type === 'withdraw').reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalExp = filtered.expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const netRev = totalRev + wDep - totalExp - wWid;

    document.getElementById('repTotalSales').innerText = `${totalRev} ج.م`;
    document.getElementById('repMaintenanceRev').innerText = `${maintenanceRev} ج.م`;
    document.getElementById('repProductsRev').innerText = `${productsRev} ج.م`;
    document.getElementById('repWalletDeposits').innerText = `${wDep} ج.م`;
    document.getElementById('repWalletWithdrawals').innerText = `${wWid} ج.م`;
    document.getElementById('repTotalExpenses').innerText = `${totalExp} ج.م`;
    document.getElementById('repNetRevenue').innerText = `${netRev} ج.م`;
    document.getElementById('repOrdersCount').innerText = sessions.length;

    // Render Table
    if (sessions.length === 0) {
        container.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-secondary);">لا توجد جلسات في هذه الفترة</td></tr>';
    } else {
        container.innerHTML = sessions.map(s => {
            const device = (data.devices || []).find(d => d.id === s.deviceId) || { name: 'جهاز/قطعة محذوفة' };
            const startTime = s.startTime ? new Date(s.startTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '--';
            const endTime = s.endTime ? new Date(s.endTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : (s.status === 'active' ? 'نشط' : '--');
            return `<tr><td style="font-weight:700;">${device.name}</td><td class="en-font">${startTime}</td><td class="en-font">${endTime}</td><td>${s.type === 'open' ? 'مفتوح' : (s.type === 'products' ? 'مبيعات' : 'وقت محدد')}</td><td class="en-font" style="color:var(--success); font-weight:800;">${s.totalCost || 0} ج.م</td><td>${s.userName || 'النظام'}</td></tr>`;
        }).join('');
    }

    // Render Chart
    updateRevenueChart(data.sessions || []);
}

function updateRevenueChart(allSessions) {
    const ctx = document.getElementById('revenueGrowthChart');
    if (!ctx) return;

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        last7Days.push(d.toISOString().split('T')[0]);
    }

    const dailyRevenue = last7Days.map(day => {
        return allSessions
            .filter(s => {
                if (!s.endTime) return false;
                const endTimeStr = typeof s.endTime === 'string' ? s.endTime : new Date(s.endTime).toISOString();
                return endTimeStr.startsWith(day);
            })
            .reduce((sum, s) => sum + (parseFloat(s.totalCost) || 0), 0);
    });

    if (revenueChart) revenueChart.destroy();

    revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: last7Days.map(d => new Date(d).toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric', month: 'numeric' })),
            datasets: [{
                label: 'الإيرادات',
                data: dailyRevenue,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#3b82f6'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
                x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
            }
        }
    });
}

function renderShifts(data) {
    const container = document.getElementById('shiftsTableBody');
    if (!container) return;
    const shifts = (data.shifts || []).sort((a, b) => (b.id || 0) - (a.id || 0));
    if (shifts.length === 0) {
        container.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-secondary);">لا توجد ورديات مسجلة</td></tr>';
        return;
    }
    container.innerHTML = shifts.map(sh => {
        const start = new Date(sh.startTime).toLocaleString('ar-EG', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
        const end = sh.endTime ? new Date(sh.endTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : 'نشطة';
        const rev = sh.transactions ? sh.transactions.sessionsRevenue : 0;
        const exp = sh.transactions ? sh.transactions.expenses : 0;
        const wDep = sh.transactions ? (sh.transactions.walletDeposits || 0) : 0;
        const wWid = sh.transactions ? (sh.transactions.walletWithdrawals || 0) : 0;
        const net = rev + wDep - exp - wWid;
        return `<tr>
            <td style="font-weight:700;">${sh.userName}</td>
            <td class="en-font">${start}</td>
            <td class="en-font">${end}</td>
            <td class="en-font">${rev}</td>
            <td class="en-font" style="color:var(--success);">${wDep}</td>
            <td class="en-font" style="color:var(--danger);">${exp + wWid}</td>
            <td class="en-font" style="background:rgba(16,185,129,0.1); font-weight:800; border-radius:8px;">${net} ج.م</td>
        </tr>`;
    }).join('');
}

function renderLogs(data) {
    const container = document.getElementById('logsTableBody');
    if (!container) return;
    const logs = (data.logs || []).sort((a, b) => (b.timestamp || b.id || 0) - (a.timestamp || a.id || 0)).slice(0, 100);
    if (logs.length === 0) {
        container.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:2rem; color:var(--text-secondary);">لا توجد عمليات مسجلة</td></tr>';
        return;
    }
    container.innerHTML = logs.map(l => {
        const time = new Date(l.timestamp || l.id).toLocaleString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        return `<tr>
            <td class="en-font">${time}</td>
            <td style="font-weight:700; color:var(--accent);">${l.type || 'عملية'}</td>
            <td>${l.details || ''}</td>
            <td>${l.user || 'النظام'}</td>
        </tr>`;
    }).join('');
}

function renderUsers(data) {
    const container = document.getElementById('usersTableBody');
    if (!container) return;
    const users = data.users || [];
    if (users.length === 0) {
        container.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:2rem; color:var(--text-secondary);">لا يوجد مستخدمون حالياً</td></tr>';
        return;
    }
    container.innerHTML = users.map(u => `<tr>
        <td style="font-weight:700;">${u.name || u.username}</td>
        <td class="en-font">${u.username}</td>
        <td><span class="status-pill" style="background:rgba(255,255,255,0.05); color:var(--text-primary); border:none;">${u.role === 'admin' ? 'مدير' : 'موظف استقبال'}</span></td>
        <td><button onclick="deleteUserRemote(${u.id})" style="background:none; border:none; color:var(--danger); cursor:pointer;"><i class="fa-solid fa-user-minus"></i> حذف</button></td>
    </tr>`).join('');
}

function renderSubscriptionInfo(data) {
    const container = document.getElementById('subscriptionInfo');
    if (!container) return;
    const ad = data.activationData || {};
    // Support number from verifier.js logic
    const whatsappLink = "https://wa.me/201032543188?text=" + encodeURIComponent(`مرحباً AS3G، أود تجديد اشتراكي لمركز صيانة: ${data.cafeName || 'غير مسمى'}\nكود المتابعة: ${data.monitorKey || '---'}`);

    let statusHtml = '';
    let expiryDateStr = '----';
    let licenseCodeStr = ad.code || '----';

    if (!ad.code) {
        statusHtml = '<span style="color:var(--danger); font-weight:bold;">غير مفعل</span>';
    } else if (!ad.expiry) {
        statusHtml = '<span style="color:var(--success); font-weight:bold;">مفعل (مدى الحياة)</span>';
    } else {
        const expiryMs = (ad.expiry && ad.expiry.seconds) ? ad.expiry.seconds * 1000 : ad.expiry;
        expiryDateStr = new Date(expiryMs).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
        const now = Date.now();
        if (expiryMs < now) {
            statusHtml = '<span style="color:var(--danger); font-weight:bold;">منتهي</span>';
        } else {
            statusHtml = '<span style="color:var(--success); font-weight:bold;">مفعل</span>';
        }
    }

    container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 0.8rem;">
            <div style="display: flex; justify-content: space-between; padding-bottom: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.05);">
                <span style="color: var(--text-secondary); font-size: 0.9rem;">حالة التفعيل:</span>
                <span style="font-size: 0.9rem;">${statusHtml}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding-bottom: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.05);">
                <span style="color: var(--text-secondary); font-size: 0.9rem;">كود التفعيل:</span>
                <span class="en-font" style="font-size: 0.9rem;">${licenseCodeStr}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding-bottom: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.05);">
                <span style="color: var(--text-secondary); font-size: 0.9rem;">تاريخ الانتهاء:</span>
                <span class="en-font" style="font-size: 0.9rem; color: var(--warning);">${expiryDateStr}</span>
            </div>
            <div style="margin-top: 0.5rem;">
                <a href="${whatsappLink}" target="_blank" class="action-btn" style="width:100%; text-decoration:none; background:rgba(37,211,102,0.1); color:#25D366; border:1px solid rgba(37,211,102,0.2); justify-content:center; font-size: 0.85rem; padding: 0.6rem;">
                    <i class="fa-brands fa-whatsapp"></i> تجديد أو دعم فني
                </a>
            </div>
        </div>
    `;
}

// --- REMOTE ACTIONS ---
async function sendRemoteCommand(type, payload) {
    const user = auth.currentUser; if (!user) return;
    const mKey = localStorage.getItem('last_monitored_code'); if (!mKey) return;
    if (loader) loader.style.display = 'flex';
    const sanitized = {};
    if (payload) { Object.keys(payload).forEach(k => { if (payload[k] !== undefined && payload[k] !== null) sanitized[k] = payload[k]; }); }
    try {
        const docRef = await db.collection("commands").add({
            monitorKey: mKey, senderUid: user.uid, type, payload: sanitized, status: 'pending', timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log(`Remote Command Sent: ${type} (ID: ${docRef.id})`);

        // Listen for execution
        const unsub = docRef.onSnapshot(doc => {
            if (doc.exists && doc.data().status === 'executed') {
                unsub();
                if (loader) loader.style.display = 'none';
                console.log(`Command ${type} executed locally.`);
                // We don't alert here as individual actions often have their own alerts or UI updates
            }
        });

        // Timeout fallback for loader
        setTimeout(() => {
            unsub();
            if (loader) loader.style.display = 'none';
        }, 8000);

    } catch (err) { alert("خطأ في الاتصال بالسحاب."); if (loader) loader.style.display = 'none'; }
}

window.remoteStopSession = (sessionId, deviceId) => { if (confirm('إنهاء الجلسة؟')) sendRemoteCommand('stop_session', { sessionId, deviceId }); };
window.remoteStartSession = (deviceId, deviceName) => {
    const h = prompt(`فتح ${deviceName}\nعدد الساعات (اتركه خالياً للمفتوح):`, "");
    if (h === null) return;
    sendRemoteCommand('start_session', { deviceId, type: h ? 'limit' : 'open', limitHours: h ? parseFloat(h) : 0 });
};

window.openDeviceModal = () => {
    document.getElementById('modalTitle').innerHTML = '<i class="fa-solid fa-plus-circle"></i>   ';
    document.getElementById('editDeviceId').value = ''; document.getElementById('deviceName').value = ''; document.getElementById('deviceRate').value = '';
    document.getElementById('deviceModal').style.display = 'flex';
};
window.editDeviceModal = (id, n, t, r) => {
    document.getElementById('modalTitle').innerHTML = '<i class="fa-solid fa-pen"></i> تعديل بيانات الجهاز';
    document.getElementById('editDeviceId').value = id; document.getElementById('deviceName').value = n; document.getElementById('deviceType').value = t; document.getElementById('deviceRate').value = r;
    document.getElementById('deviceModal').style.display = 'flex';
};
window.closeDeviceModal = () => { document.getElementById('deviceModal').style.display = 'none'; };
window.saveDeviceRemote = () => {
    const id = document.getElementById('editDeviceId').value;
    const n = document.getElementById('deviceName').value.trim();
    const t = document.getElementById('deviceType').value;
    const r = document.getElementById('deviceRate').value;
    if (!n || !r) return alert('أدخل كل البيانات');
    const cmd = id ? 'update_device' : 'add_device';
    const payload = id ? { id: parseInt(id), name: n, type: t, hourlyRate: parseFloat(r) } : { name: n, type: t, hourlyRate: parseFloat(r) };
    sendRemoteCommand(cmd, payload);
    closeDeviceModal();
    alert('تم إرسال طلب تحديث الأجهزة للمحل... سيظهر التعديل فور تنفيذه.');
};
window.deleteDeviceRemote = (id) => {
    openConfirmModal('حذف الجهاز نهائياً؟', () => {
        sendRemoteCommand('delete_device', { deviceId: id });
        showToast('تم إرسال طلب الحذف... سيختفي الجهاز فور المزامنة.', 'info');
    });
};
window.filterReports = () => {
    const term = document.getElementById('reportSearch').value.toLowerCase();
    document.querySelectorAll('#reportsTableBody tr').forEach(row => {
        if (row.cells.length > 1) row.style.display = row.innerText.toLowerCase().includes(term) ? '' : 'none';
    });
};

window.openUserModal = () => {
    document.getElementById('newUsername').value = '';
    document.getElementById('newUserPass').value = '';
    document.getElementById('userRole').value = 'cashier';
    document.querySelectorAll('.perm-check').forEach(c => {
        // Reset to defaults: devices, sessions, shifts are usually checked for cashiers
        c.checked = ['devices.html', 'sessions.html', 'shifts.html'].includes(c.value);
    });
    togglePermissionsUI();
    document.getElementById('userModal').style.display = 'flex';
};
window.closeUserModal = () => { document.getElementById('userModal').style.display = 'none'; };
window.togglePermissionsUI = () => {
    const role = document.getElementById('userRole').value;
    document.getElementById('permissionsSection').style.display = (role === 'admin') ? 'none' : 'block';
};
window.saveUserRemote = () => {
    const username = document.getElementById('newUsername').value.trim();
    const pass = document.getElementById('newUserPass').value;
    const role = document.getElementById('userRole').value;
    if (!username || !pass) return showToast('أدخل كل البيانات', 'error');

    let perms = [];
    if (role === 'admin') {
        perms = ['*'];
    } else {
        document.querySelectorAll('.perm-check:checked').forEach(c => perms.push(c.value));
        if (perms.length === 0) return showToast('يجب تحديد صلاحية واحدة على الأقل للكاشير', 'error');
    }

    sendRemoteCommand('add_user', { username, password: pass, role, permissions: perms });
    closeUserModal();
    showToast('تم إرسال طلب إضافة الموظف للمحل...', 'success');
};
window.deleteUserRemote = (userId) => {
    openConfirmModal('حذف هذا الموظف نهائياً؟', () => {
        sendRemoteCommand('delete_user', { userId });
        showToast('تم إرسال طلب حذف الموظف...', 'info');
    });
};
window.filterExpenses = () => {
    const term = document.getElementById('expenseSearch').value.toLowerCase();
    document.querySelectorAll('#expensesTableBody tr').forEach(row => {
        if (row.cells.length > 1) row.style.display = row.innerText.toLowerCase().includes(term) ? '' : 'none';
    });
};

// --- Inventory Functions ---
function renderInventory(data) {
    const tableBody = document.getElementById('inventoryTableBody');
    if (!tableBody) return;
    const products = data.products || [];
    const categories = data.categories || [];

    tableBody.innerHTML = products.map(p => {
        const cat = categories.find(c => c.id == p.category) || { name: p.category === 'spare' ? 'قطع غيار' : p.category === 'accessory' ? 'إكسسوارات' : 'أخرى' };
        return `
        <tr>
            <td class="en-font">${p.name} ${p.model ? `<br><small style="color:var(--accent)">(${p.model})</small>` : ''}</td>
            <td>${cat.name}</td>
            <td class="en-font">${p.price} ج.م</td>
            <td class="en-font" style="color: ${p.stock < 5 ? 'var(--danger)' : 'inherit'}">${p.stock}</td>
            <td class="table-actions">
                <button class="action-btn-small" onclick="editProductModal('${p.id}', '${p.name.replace(/'/g, "\\'")}', '${p.price}', '${p.stock}', '${p.category}', '${(p.model || "").replace(/'/g, "\\'")}', '${(p.barcode || "").replace(/'/g, "\\'")}')" title="تعديل">
                    <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button class="action-btn-small danger" onclick="deleteProductRemote('${p.id}')" title="حذف">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        </tr>
    `;}).join('') || `<tr><td colspan="5" style="text-align:center; padding:3rem;"><div style="color:var(--text-secondary);"><i class="fa-solid fa-boxes-stacked" style="font-size:3rem; margin-bottom:1rem; opacity:0.3;"></i><h3 style="margin-bottom:0.5rem; color:white;">لا توجد منتجات مسجلة</h3><p style="font-size:0.9rem; margin-bottom:1rem;">يمكنك إضافة منتجات جديدة من هنا</p><button onclick="openProductModal()" class="action-btn" style="margin:0 auto;"><i class="fa-solid fa-plus-circle"></i> إضافة منتج</button></div></td></tr>`;

    // Also populate category select in modal if it exists
    const catSelect = document.getElementById('prodCategory');
    if (catSelect) {
        let options = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        if (options === '') {
            options = `
                <option value="spare">قطع غيار</option>
                <option value="accessory">إكسسوارات</option>
                <option value="other">أخرى</option>
            `;
        }
        catSelect.innerHTML = options;
    }
}

window.openProductModal = () => {
    document.getElementById('productModalTitle').innerHTML = '<i class="fa-solid fa-boxes-stacked"></i> إضافة منتج جديد';
    document.getElementById('editProductId').value = '';
    document.getElementById('prodName').value = '';
    document.getElementById('prodModel').value = '';
    document.getElementById('prodPrice').value = '';
    document.getElementById('prodStock').value = '';
    document.getElementById('prodBarcode').value = '';
    document.getElementById('productModal').style.display = 'flex';
};

window.editProductModal = (id, name, price, stock, cat, model, barcode) => {
    document.getElementById('productModalTitle').innerHTML = '<i class="fa-solid fa-pen"></i> تعديل بيانات المنتج';
    document.getElementById('editProductId').value = id;
    document.getElementById('prodName').value = name;
    document.getElementById('prodModel').value = model || '';
    document.getElementById('prodPrice').value = price;
    document.getElementById('prodStock').value = stock;
    document.getElementById('prodCategory').value = cat;
    document.getElementById('prodBarcode').value = barcode || '';
    document.getElementById('productModal').style.display = 'flex';
};

window.closeProductModal = () => { document.getElementById('productModal').style.display = 'none'; };

window.saveProductRemote = () => {
    const id = document.getElementById('editProductId').value;
    const name = document.getElementById('prodName').value.trim();
    const model = document.getElementById('prodModel').value.trim();
    const price = document.getElementById('prodPrice').value;
    const stock = document.getElementById('prodStock').value;
    const category = document.getElementById('prodCategory').value;
    const barcode = document.getElementById('prodBarcode').value.trim();

    if (!name || !price || !stock) return showToast('أدخل كل البيانات', 'error');

    const cmd = id ? 'update_product' : 'add_product';
    const payload = {
        name,
        model,
        price: parseFloat(price),
        stock: parseInt(stock),
        category,
        barcode
    };
    if (id) payload.id = parseInt(id);

    sendRemoteCommand(cmd, payload);
    closeProductModal();
    showToast('تم إرسال طلب التعديل للمحل...', 'success');
};

window.deleteProductRemote = (id) => {
    openConfirmModal('حذف هذا المنتج نهائياً؟', () => {
        sendRemoteCommand('delete_product', { id: id });
        showToast('تم إرسال طلب الحذف للمحل...', 'info');
    });
};

// --- Wallet Functions ---
window.closeModal = (id) => {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'none';
};

window.openAddWalletModal = () => {
    document.getElementById('addWalletForm').reset();
    document.getElementById('addWalletModal').style.display = 'flex';
};

window.handleAddWallet = (e) => {
    e.preventDefault();
    const payload = {
        name: document.getElementById('newWalletName').value,
        number: document.getElementById('newWalletNumber').value,
        balance: parseFloat(document.getElementById('newWalletBalance').value),
        color: document.getElementById('newWalletColor').value,
        icon: document.getElementById('newWalletIcon').value
    };
    sendRemoteCommand('add_wallet', payload);
    closeModal('addWalletModal');
    showToast('تم إرسال طلب إضافة المحفظة...', 'success');
};

window.openDeposit = (id, name) => {
    document.getElementById('depositWalletId').value = id;
    document.getElementById('depositWalletName').value = name;
    document.getElementById('depositAmount').value = '';
    document.getElementById('depositNote').value = '';
    document.getElementById('depositModal').style.display = 'flex';
};

window.handleDeposit = (e) => {
    e.preventDefault();
    const payload = {
        walletId: parseInt(document.getElementById('depositWalletId').value),
        amount: parseFloat(document.getElementById('depositAmount').value),
        note: document.getElementById('depositNote').value
    };
    sendRemoteCommand('wallet_deposit', payload);
    closeModal('depositModal');
    showToast('تم إرسال طلب الإيداع...', 'success');
};

window.openWithdraw = (id, name) => {
    document.getElementById('withdrawWalletId').value = id;
    document.getElementById('withdrawWalletName').value = name;
    document.getElementById('withdrawAmount').value = '';
    document.getElementById('withdrawNote').value = '';
    document.getElementById('withdrawModal').style.display = 'flex';
};

window.handleWithdraw = (e) => {
    e.preventDefault();
    const payload = {
        walletId: parseInt(document.getElementById('withdrawWalletId').value),
        amount: parseFloat(document.getElementById('withdrawAmount').value),
        note: document.getElementById('withdrawNote').value
    };
    sendRemoteCommand('wallet_withdraw', payload);
    closeModal('withdrawModal');
    showToast('تم إرسال طلب السحب...', 'success');
};

window.openTransfer = (id, name) => {
    if (!lastSnapData || !lastSnapData.wallets) return;
    document.getElementById('transferFromId').value = id;
    document.getElementById('transferFromName').value = name;
    document.getElementById('transferAmount').value = '';
    document.getElementById('transferNote').value = '';
    
    // Populate dropdown
    const select = document.getElementById('transferToId');
    select.innerHTML = '<option value="" disabled selected>اختر المحفظة المستقبلة...</option>';
    lastSnapData.wallets.filter(w => w.id !== id).forEach(w => {
        select.innerHTML += `<option value="${w.id}">${w.name} (المتاح: ${w.balance} ج.م)</option>`;
    });

    document.getElementById('transferModal').style.display = 'flex';
};

window.handleTransfer = (e) => {
    e.preventDefault();
    const payload = {
        fromId: parseInt(document.getElementById('transferFromId').value),
        toId: parseInt(document.getElementById('transferToId').value),
        amount: parseFloat(document.getElementById('transferAmount').value),
        note: document.getElementById('transferNote').value
    };
    sendRemoteCommand('wallet_transfer', payload);
    closeModal('transferModal');
    showToast('تم إرسال طلب التحويل...', 'success');
};

window.promptDeleteWallet = (id, name) => {
    openConfirmModal(`هل أنت متأكد من حذف محفظة "${name}" نهائياً من المحل؟`, () => {
        sendRemoteCommand('delete_wallet', { id });
        showToast('تم إرسال طلب حذف المحفظة...', 'info');
    });
};
