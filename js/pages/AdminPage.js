// File: frontend/js/pages/AdminPage.js
import { getSemuaPeserta, getSystemConfig, toggleStatusPendaftaran, updateStatusPesertaDenganAutoPromo, ubahJadwalPeserta } from '../services/apiService.js';

// ==========================================
// STATE GLOBAL ADMIN
// ==========================================
let ALL_DATA = [];
let CONFIG = {};
let CURRENT_TAB = 'analytics'; 

// State Table
let currentPage = 1;
const itemsPerPage = 10;
let searchQuery = '';
let filterStatus = 'ALL';
let sortCol = 'created_at';
let sortDir = 'asc';

// State untuk mencegah Race Condition dan Spam API pada Search
let currentRenderId = 0; 
let searchTimeout = null;

export async function renderAdminPage(container) {
    container.innerHTML = `
        <div id="admin-layout" class="flex h-screen bg-brand-surface w-full overflow-hidden font-sans group">
            <div id="mobile-menu-overlay" class="fixed inset-0 bg-black/60 z-30 hidden md:hidden"></div>

            <aside id="admin-sidebar" class="w-64 bg-brand-navy text-white flex flex-col absolute md:relative inset-y-0 left-0 transform -translate-x-full md:translate-x-0 transition-all duration-300 ease-in-out shadow-2xl z-40 group-[.sidebar-collapsed]:w-20">
                <div class="p-6 border-b border-white/10 text-center relative overflow-hidden h-[93px] flex flex-col justify-center">
                    <div class="absolute top-0 right-0 w-20 h-20 bg-brand-gold rounded-full blur-2xl opacity-20"></div>
                    <div class="absolute bottom-0 left-0 w-20 h-20 bg-brand-pink rounded-full blur-2xl opacity-20"></div>
                    <img src="assets/images/logo-white.png" alt="Logo" class="h-10 mx-auto mb-2 relative z-10 transition-all duration-300 group-[.sidebar-collapsed]:h-8 group-[.sidebar-collapsed]:mb-0">
                    <p class="text-xs text-brand-base/60 relative z-10 transition-opacity duration-200 group-[.sidebar-collapsed]:opacity-0 group-[.sidebar-collapsed]:h-0">Admin Command Center</p>
                </div>
                <nav class="flex-1 p-4 space-y-2 overflow-y-auto">
                    <button id="nav-analytics" class="w-full flex items-center gap-3 bg-white/10 px-4 py-3 rounded-xl text-brand-gold font-medium transition-colors group-[.sidebar-collapsed]:justify-center">
                        <i class="ph ph-chart-polar text-xl"></i> <span class="transition-opacity duration-200 group-[.sidebar-collapsed]:opacity-0 group-[.sidebar-collapsed]:hidden">Dashboard Analitik</span>
                    </button>
                    <button id="nav-board" class="w-full flex items-center gap-3 hover:bg-white/5 px-4 py-3 rounded-xl text-white/70 hover:text-white transition-colors group-[.sidebar-collapsed]:justify-center">
                        <i class="ph ph-kanban text-xl"></i> <span class="transition-opacity duration-200 group-[.sidebar-collapsed]:opacity-0 group-[.sidebar-collapsed]:hidden">Papan Jadwal</span>
                    </button>
                    <button id="nav-table" class="w-full flex items-center gap-3 hover:bg-white/5 px-4 py-3 rounded-xl text-white/70 hover:text-white transition-colors group-[.sidebar-collapsed]:justify-center">
                        <i class="ph ph-table text-xl"></i> <span class="transition-opacity duration-200 group-[.sidebar-collapsed]:opacity-0 group-[.sidebar-collapsed]:hidden">Master Data</span>
                    </button>
                    <div class="pt-4 mt-4 border-t border-white/10">
                        <a href="#/display" target="_blank" class="flex items-center gap-3 hover:bg-white/5 px-4 py-3 rounded-xl text-brand-blue hover:text-brand-pink transition-colors bg-white/5 group-[.sidebar-collapsed]:justify-center">
                            <i class="ph ph-monitor-play text-xl"></i> <span class="transition-opacity duration-200 group-[.sidebar-collapsed]:opacity-0 group-[.sidebar-collapsed]:hidden">Buka Layar Booth</span>
                        </a>
                    </div>
                </nav>
                <div class="p-4 border-t border-white/10 hidden md:block">
                    <button id="desktop-toggle-sidebar" class="w-full flex items-center gap-3 hover:bg-white/5 px-4 py-3 rounded-xl text-white/70 hover:text-white transition-colors group-[.sidebar-collapsed]:justify-center">
                        <i id="desktop-toggle-icon" class="ph ph-caret-double-left text-xl"></i> <span class="text-sm transition-opacity duration-200 group-[.sidebar-collapsed]:opacity-0 group-[.sidebar-collapsed]:hidden">Ciutkan</span>
                    </button>
                </div>
            </aside>

            <main class="flex-1 flex flex-col h-full overflow-hidden bg-brand-base relative">
                
                <header class="bg-white px-4 md:px-8 py-4 border-b border-gray-200 flex justify-between items-center shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] z-10 shrink-0">
                    <button id="hamburger-btn" class="md:hidden p-2 text-brand-navy text-2xl">
                        <i class="ph ph-list"></i>
                    </button>
                    <div>
                        <h1 class="text-xl md:text-2xl font-bold text-brand-navy" id="header-title">Dashboard Analitik</h1>
                        <p class="text-sm text-gray-500" id="header-desc">Ringkasan statistik dan performa pendaftaran sesi.</p>
                    </div>
                    <div class="flex items-center gap-3 bg-gray-50 p-2 rounded-xl border border-gray-200 shadow-inner">
                        <span class="text-sm font-semibold text-brand-navy" id="status-text">Form:</span>
                        <button id="btn-toggle-form" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-pink focus:ring-offset-1">
                            <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow"></span>
                        </button>
                    </div>
                </header>

                <div id="loading-admin" class="absolute inset-0 flex items-center justify-center bg-brand-base/80 z-50 backdrop-blur-sm transition-opacity duration-300">
                    <div class="flex flex-col items-center gap-3 bg-white p-6 rounded-2xl shadow-elegant">
                        <i class="ph ph-spinner animate-spin text-4xl text-brand-pink"></i>
                        <p class="font-bold text-brand-navy tracking-wide">Sinkronisasi Data...</p>
                    </div>
                </div>

                <div id="admin-content" class="flex-1 overflow-auto p-6 md:p-8 scroll-smooth">
                    </div>
            </main>

            <div id="detail-modal" class="fixed inset-0 bg-brand-navy/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4 opacity-0 transition-opacity duration-300">
                <div class="bg-white rounded-[24px] shadow-2xl w-full max-w-2xl overflow-hidden scale-95 transition-transform duration-300 transform" id="detail-modal-card">
                    <div class="bg-brand-navy p-6 flex justify-between items-center text-white relative overflow-hidden">
                        <div class="absolute right-0 top-0 w-32 h-32 bg-brand-gold/20 rounded-full blur-2xl -translate-y-10"></div>
                        <h3 class="text-xl font-bold relative z-10 flex items-center gap-2"><i class="ph ph-identification-card text-brand-pink"></i> Profil Peserta</h3>
                        <button id="close-modal" class="text-white/70 hover:text-white text-2xl relative z-10 transition-transform hover:rotate-90"><i class="ph ph-x"></i></button>
                    </div>
                    <div id="modal-body" class="p-8 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 text-sm">
                        </div>
                </div>
            </div>

            <div id="confirm-status-modal" class="fixed inset-0 bg-brand-navy/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4 opacity-0 transition-opacity duration-300">
                <div class="bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden scale-95 transition-transform duration-300 transform" id="confirm-status-modal-card">
                    <div class="bg-brand-navy p-6 flex justify-between items-center text-white relative overflow-hidden">
                        <div class="absolute right-0 top-0 w-32 h-32 bg-brand-gold/20 rounded-full blur-2xl -translate-y-10"></div>
                        <h3 class="text-xl font-bold relative z-10 flex items-center gap-2"><i class="ph ph-warning-circle text-brand-gold"></i> Konfirmasi Perubahan Status</h3>
                        <button id="close-confirm-status-modal" class="text-white/70 hover:text-white text-2xl relative z-10 transition-transform hover:rotate-90"><i class="ph ph-x"></i></button>
                    </div>
                    <div class="p-8 text-center">
                        <p class="text-brand-navy text-lg font-semibold mb-6" id="confirm-status-message">Anda yakin ingin mengubah status peserta ini?</p>
                        <div class="flex justify-center gap-4">
                            <button id="confirm-status-yes" class="px-6 py-3 bg-brand-pink hover:bg-brand-pinkdark text-white rounded-xl font-bold transition-colors shadow-md">Ya, Ubah Status</button>
                            <button id="confirm-status-no" class="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-brand-navy rounded-xl font-bold transition-colors shadow-md">Tidak, Kembali</button>
                        </div>
                    </div>
                </div>
            </div>

            <div id="reschedule-modal" class="fixed inset-0 bg-brand-navy/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4 opacity-0 transition-opacity duration-300">
                <div class="bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden scale-95 transition-transform duration-300 transform" id="reschedule-modal-card">
                    <div class="bg-brand-blue p-6 flex justify-between items-center text-white relative overflow-hidden">
                        <div class="absolute right-0 top-0 w-32 h-32 bg-brand-pink/20 rounded-full blur-2xl -translate-y-10"></div>
                        <h3 class="text-xl font-bold relative z-10 flex items-center gap-2"><i class="ph ph-calendar-edit text-brand-gold"></i> Pindah Jadwal</h3>
                        <button onclick="window.tutupModalReschedule()" class="text-white/70 hover:text-white text-2xl relative z-10 transition-transform hover:rotate-90"><i class="ph ph-x"></i></button>
                    </div>
                    <div class="p-8">
                        <p class="text-sm text-gray-500 mb-4">Pilih jadwal kosong yang tersedia untuk <strong id="reschedule-nama" class="text-brand-navy"></strong>:</p>
                        <select id="reschedule-select" class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-pink outline-none text-sm text-brand-navy font-medium mb-6">
                        </select>
                        <input type="hidden" id="reschedule-id">
                        <button onclick="window.submitReschedule()" class="w-full px-6 py-3 bg-brand-gold hover:bg-yellow-600 text-white rounded-xl font-bold transition-colors shadow-md flex justify-center items-center gap-2"><i class="ph ph-check-circle"></i> Simpan Jadwal Baru</button>
                    </div>
                </div>
            </div>

            <div id="toast-container" class="fixed top-5 right-5 z-[100] space-y-2">
            </div>
        </div>
    `;

    await initAdminData();
}

async function initAdminData() {
    document.getElementById('loading-admin').classList.remove('hidden');
    
    // Trik Cepat: Tarik data sekali di awal, simpan di RAM lokal
    CONFIG = await getSystemConfig();
    await fetchData();

    // Setup Toggle Form Buka/Tutup
    let isBuka = CONFIG?.status_pendaftaran === 'buka';
    const btnToggle = document.getElementById('btn-toggle-form');
    const statusText = document.getElementById('status-text');

    const updateToggleUI = () => {
        if (isBuka) {
            btnToggle.classList.replace('bg-gray-300', 'bg-brand-pink');
            btnToggle.classList.add('bg-brand-pink');
            btnToggle.querySelector('span').classList.replace('translate-x-1', 'translate-x-6');
            statusText.innerHTML = 'Form: <span class="text-brand-pink font-bold">BUKA</span>';
        } else {
            btnToggle.classList.replace('bg-brand-pink', 'bg-gray-300');
            btnToggle.classList.add('bg-gray-300');
            btnToggle.querySelector('span').classList.replace('translate-x-6', 'translate-x-1');
            statusText.innerHTML = 'Form: <span class="text-gray-500 font-bold">TUTUP</span>';
        }
    };
    btnToggle.querySelector('span').classList.add('translate-x-1'); // init
    updateToggleUI();

    btnToggle.addEventListener('click', async () => {
        isBuka = !isBuka;
        updateToggleUI();
        await toggleStatusPendaftaran(isBuka ? 'buka' : 'tutup');
    });

    // Setup Tab Navigation
    document.getElementById('nav-analytics').addEventListener('click', (e) => switchTab('analytics', e.currentTarget));
    document.getElementById('nav-board').addEventListener('click', (e) => switchTab('board', e.currentTarget));
    document.getElementById('nav-table').addEventListener('click', (e) => switchTab('table', e.currentTarget));

    // Setup Modal Close
    document.getElementById('close-modal').addEventListener('click', closeModal);

    // Setup Confirmation Modal Close
    document.getElementById('close-confirm-status-modal').addEventListener('click', closeConfirmStatusModal);
    document.getElementById('confirm-status-no').addEventListener('click', closeConfirmStatusModal);

    // Setup Mobile Menu
    const sidebar = document.getElementById('admin-sidebar');
    const overlay = document.getElementById('mobile-menu-overlay');
    const hamburgerBtn = document.getElementById('hamburger-btn');

    const closeMenu = () => {
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('hidden');
    };

    hamburgerBtn.addEventListener('click', () => {
        sidebar.classList.remove('-translate-x-full');
        overlay.classList.remove('hidden');
    });
    overlay.addEventListener('click', closeMenu);

    // Setup Desktop Sidebar Toggle
    const layout = document.getElementById('admin-layout');
    const desktopToggleBtn = document.getElementById('desktop-toggle-sidebar');
    const desktopToggleIcon = document.getElementById('desktop-toggle-icon');
    const desktopToggleText = desktopToggleBtn.querySelector('span');

    desktopToggleBtn.addEventListener('click', () => {
        layout.classList.toggle('sidebar-collapsed');
        const isCollapsed = layout.classList.contains('sidebar-collapsed');
        desktopToggleIcon.className = `ph ${isCollapsed ? 'ph-caret-double-right' : 'ph-caret-double-left'} text-xl`;
        desktopToggleText.innerText = isCollapsed ? 'Lebarkan' : 'Ciutkan';
    });

    document.getElementById('loading-admin').classList.add('hidden');
    renderCurrentTab();
}

async function fetchData() {
    ALL_DATA = await getSemuaPeserta();
}

// [BARU] FUNGSI MEMORI SAKTI: Merakit Link WA secara Synchronous (0 loading)
function buatLinkWA(templateKey, participantData) {
    let template = CONFIG[templateKey] || '';
    if (!template) return '#';
    
    let message = template.replace(/\\n/g, '\n');
    message = message.replace(/{{nama_lengkap}}/g, participantData.nama_lengkap || '');
    message = message.replace(/{{jadwal_hari}}/g, participantData.jadwal_hari || '');
    message = message.replace(/{{jadwal_sesi}}/g, participantData.jadwal_sesi || '');
    message = message.replace(/{{psikolog_bertugas}}/g, participantData.psikolog_bertugas || 'Psikolog');
    message = message.replace(/{{feedback_url}}/g, `https://bit.ly/FeedbackKonselingKarierTKTApril2026`);

    const waNumber = participantData.nomor_wa.startsWith('0') ? '62' + participantData.nomor_wa.substring(1) : participantData.nomor_wa;
    return `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
}

function switchTab(tabName, btnElement) {
    CURRENT_TAB = tabName;
    
    const titles = {
        'analytics': { title: 'Dashboard Analitik', desc: 'Ringkasan statistik dan performa pendaftaran sesi.' },
        'board': { title: 'Papan Jadwal Sesi', desc: 'Pantau ketersediaan Psikolog secara real-time.' },
        'table': { title: 'Master Data Peserta', desc: 'Kelola seluruh data peserta dengan filter dan sorting.' }
    };
    
    document.getElementById('header-title').innerText = titles[tabName].title;
    document.getElementById('header-desc').innerText = titles[tabName].desc;
    
    // Reset Sidebar Styles
    const navs = ['nav-analytics', 'nav-board', 'nav-table'];
    navs.forEach(id => {
        document.getElementById(id).className = "w-full flex items-center gap-3 hover:bg-white/5 px-4 py-3 rounded-xl text-white/70 hover:text-white transition-colors group-[.sidebar-collapsed]:justify-center";
    });
    
    // Set Active
    btnElement.className = "w-full flex items-center gap-3 bg-white/10 px-4 py-3 rounded-xl text-brand-gold font-bold shadow-inner transition-colors group-[.sidebar-collapsed]:justify-center";
    
    renderCurrentTab();
}

function renderCurrentTab() {
    const container = document.getElementById('admin-content');
    // Karena kita tidak butuh nunggu API di setiap tab lagi, kita bisa langsung render!
    if (CURRENT_TAB === 'analytics') renderAnalyticsView(container);
    else if (CURRENT_TAB === 'board') renderBoardView(container);
    else if (CURRENT_TAB === 'table') renderTableView(container);
}

// ==========================================================
// 1. ANALYTICS VIEW
// ==========================================================
function renderAnalyticsView(container) {
    const total = ALL_DATA.length;
    const countHadirSelesai = ALL_DATA.filter(p => ['HADIR', 'SELESAI_FULL'].includes(p.status_peserta)).length;
    const countConfirmed = ALL_DATA.filter(p => p.status_peserta === 'CONFIRMED').length;
    const countWaiting = ALL_DATA.filter(p => p.status_peserta === 'WAITING_LIST').length;
    
    const countITB = ALL_DATA.filter(p => (p.asal_univ || '').toLowerCase().includes('institut teknologi bandung')).length;
    const pctITB = total === 0 ? 0 : Math.round((countITB / total) * 100);
    const countCV = ALL_DATA.filter(p => (p.harapan_sesi || '').includes('CV Review')).length;
    const pctCV = total === 0 ? 0 : Math.round((countCV / total) * 100);

    container.innerHTML = `
        <div class="space-y-6 animate-fade-in-up">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div class="bg-white p-6 rounded-[20px] shadow-elegant border border-gray-100 relative overflow-hidden group">
                    <div class="absolute right-0 top-0 w-24 h-24 bg-blue-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
                    <p class="text-gray-500 text-sm font-semibold mb-1 uppercase tracking-wider">Total Pendaftar</p>
                    <h3 class="text-4xl font-black text-brand-navy">${total}</h3>
                    <p class="text-xs text-gray-400 mt-2"><i class="ph ph-users"></i> Seluruh data masuk</p>
                </div>
                <div class="bg-white p-6 rounded-[20px] shadow-elegant border border-gray-100 relative overflow-hidden group">
                    <div class="absolute right-0 top-0 w-24 h-24 bg-brand-gold/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
                    <p class="text-gray-500 text-sm font-semibold mb-1 uppercase tracking-wider">Terkonfirmasi</p>
                    <h3 class="text-4xl font-black text-brand-gold">${countConfirmed}</h3>
                    <p class="text-xs text-gray-400 mt-2"><i class="ph ph-thumbs-up"></i> Siap hadir di lokasi</p>
                </div>
                <div class="bg-brand-navy p-6 rounded-[20px] shadow-elegant border border-brand-navy relative overflow-hidden group text-white">
                    <div class="absolute right-0 top-0 w-24 h-24 bg-white/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
                    <p class="text-white/60 text-sm font-semibold mb-1 uppercase tracking-wider">Kehadiran & Selesai</p>
                    <h3 class="text-4xl font-black text-white">${countHadirSelesai}</h3>
                    <p class="text-xs text-brand-pink mt-2 font-medium"><i class="ph ph-check-circle"></i> Sesi berjalan/selesai</p>
                </div>
                <div class="bg-white p-6 rounded-[20px] shadow-elegant border border-red-100 relative overflow-hidden group">
                    <div class="absolute right-0 top-0 w-24 h-24 bg-red-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
                    <p class="text-red-400 text-sm font-semibold mb-1 uppercase tracking-wider">Waiting List</p>
                    <h3 class="text-4xl font-black text-red-500">${countWaiting}</h3>
                    <p class="text-xs text-gray-400 mt-2"><i class="ph ph-hourglass-high"></i> Antrean prioritas</p>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="bg-white p-6 rounded-[20px] shadow-elegant border border-gray-100">
                    <h3 class="font-bold text-brand-navy mb-6 flex items-center gap-2"><i class="ph ph-student text-brand-pink text-xl"></i> Demografi Kampus</h3>
                    <div class="mb-4">
                        <div class="flex justify-between text-sm mb-1 font-semibold text-gray-700"><span>Mahasiswa ITB</span><span>${pctITB}%</span></div>
                        <div class="w-full bg-gray-100 rounded-full h-2.5"><div class="bg-brand-blue h-2.5 rounded-full" style="width: ${pctITB}%"></div></div>
                    </div>
                    <div>
                        <div class="flex justify-between text-sm mb-1 font-semibold text-gray-700"><span>Kampus Lain</span><span>${100 - pctITB}%</span></div>
                        <div class="w-full bg-gray-100 rounded-full h-2.5"><div class="bg-brand-gold h-2.5 rounded-full" style="width: ${100 - pctITB}%"></div></div>
                    </div>
                </div>

                <div class="bg-white p-6 rounded-[20px] shadow-elegant border border-gray-100">
                    <h3 class="font-bold text-brand-navy mb-6 flex items-center gap-2"><i class="ph ph-target text-brand-pink text-xl"></i> Kebutuhan Sesi (Harapan)</h3>
                    <div class="mb-4">
                        <div class="flex justify-between text-sm mb-1 font-semibold text-gray-700"><span>Fokus CV Review / Keduanya</span><span>${pctCV}%</span></div>
                        <div class="w-full bg-gray-100 rounded-full h-2.5"><div class="bg-brand-pink h-2.5 rounded-full" style="width: ${pctCV}%"></div></div>
                    </div>
                    <div>
                        <div class="flex justify-between text-sm mb-1 font-semibold text-gray-700"><span>Fokus Konsultasi Karier</span><span>${100 - pctCV}%</span></div>
                        <div class="w-full bg-gray-100 rounded-full h-2.5"><div class="bg-brand-navy h-2.5 rounded-full" style="width: ${100 - pctCV}%"></div></div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ==========================================================
// 2. BOARD VIEW (Dibuat Super Cepat)
// ==========================================================
function renderBoardView(container) {
    const days = [...new Set(ALL_DATA.map(p => p.jadwal_hari))].filter(Boolean);
    
    if (days.length === 0) {
        container.innerHTML = `<div class="flex flex-col items-center justify-center h-full text-gray-400"><i class="ph ph-calendar-blank text-6xl mb-4"></i><p>Belum ada data pendaftar untuk ditampilkan di Papan Jadwal.</p></div>`;
        return;
    }

    let html = `<div class="space-y-10 animate-fade-in-up">`;
    const sesiList = ["09.00-09.45", "09.50-10.35", "10.40-11.25", "11.30-12.15", "13.15-14.00", "14.05-14.50", "14.55-15.40"];

    for (const day of days) {
        html += `<div class="bg-white rounded-[24px] shadow-elegant border border-gray-100 p-8">
                    <h2 class="text-2xl font-black text-brand-navy border-b-2 border-brand-pink inline-block pb-2 mb-8"><i class="ph ph-calendar-check text-brand-pink"></i> Jadwal: ${day}</h2>
                    <div class="space-y-8">`;
        
        let psikologListKey;
        if (day === CONFIG.tanggal_kegiatan_1) psikologListKey = 'psikolog_list_1';
        else if (day === CONFIG.tanggal_kegiatan_2) psikologListKey = 'psikolog_list_2';
        
        const psikologListForDay = (psikologListKey && CONFIG[psikologListKey]) ? JSON.parse(CONFIG[psikologListKey]) : [];
        let noPsikolog = 1;

        for (const namaPsikolog of psikologListForDay) {
            html += `
                <div class="bg-[#FDF8EE] rounded-2xl p-6 border border-brand-gold/20 shadow-sm relative overflow-hidden">
                    <div class="absolute left-0 top-0 w-2 h-full bg-brand-gold"></div>
                    <h3 class="font-bold text-brand-navy text-lg mb-4 flex items-center gap-2 pl-2">
                        <i class="ph ph-user-focus text-brand-gold text-2xl"></i> ${noPsikolog}. ${namaPsikolog}
                    </h3>
                    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
            `;
            noPsikolog++;

            for (const sesi of sesiList) {
                let penghuni = ALL_DATA.find(p => p.jadwal_hari === day && p.psikolog_bertugas === namaPsikolog && p.jadwal_sesi === sesi && !['WAITING_LIST', 'BATAL'].includes(p.status_peserta));

                if (penghuni) {
                    let badgeColor = penghuni.status_peserta === 'CONFIRMED' ? 'text-green-700 bg-green-100 border-green-200' : 
                                     ['HADIR', 'SELESAI_FULL'].includes(penghuni.status_peserta) ? 'text-brand-base bg-brand-navy border-brand-navy' : 
                                     'text-brand-blue bg-blue-50 border-blue-200';
                    
                    // MEMANGGIL FUNGSI SYNC LOKAL (Super Cepat)
                    const waLink = buatLinkWA('wa_template_konfirmasi_sesi', penghuni);

                    let feedbackButtonHTML = '';
                    if (penghuni.status_peserta === 'HADIR') {
                        const feedbackWaLink = buatLinkWA('wa_template_minta_feedback', penghuni);
                        feedbackButtonHTML = `
                            <a href="${feedbackWaLink}" target="_blank" class="w-9 h-9 flex items-center justify-center bg-brand-blue hover:bg-brand-navy text-white rounded-xl font-bold shadow-sm transition-transform hover:scale-105" title="Minta Feedback">
                                <i class="ph ph-chat-centered-text text-lg"></i>
                            </a>
                        `;
                    }

                    html += `
                        <div class="bg-white p-3.5 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between hover:border-brand-pink transition-colors group relative">
                            <div>
                                <div class="flex justify-between items-start mb-2">
                                    <span class="inline-block px-1.5 py-0.5 text-[10px] font-bold rounded border ${badgeColor}">${penghuni.status_peserta.replace('_', ' ')}</span>
                                    <div class="flex items-center gap-1">
                                        <a href="${waLink}" target="_blank" class="w-9 h-9 flex items-center justify-center bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold shadow-sm transition-transform hover:scale-105" title="Chat WA">
                                            <i class="ph ph-whatsapp-logo text-lg"></i> 
                                        </a>
                                        ${feedbackButtonHTML}
                                    </div>
                                </div>
                                <p class="text-[11px] font-bold text-gray-400 mb-0.5"><i class="ph ph-clock"></i> ${sesi}</p>
                                <p class="font-bold text-brand-navy text-sm leading-tight mb-1 truncate cursor-pointer hover:text-brand-pink" onclick="window.bukaDetail('${penghuni.id}')">${penghuni.nama_lengkap}</p>
                            </div>
                        </div>
                    `;
                } else {
                    html += `
                        <div class="bg-white/50 p-3.5 rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-center opacity-60">
                            <p class="text-[11px] font-bold text-gray-400 mb-1"><i class="ph ph-clock"></i> ${sesi}</p>
                            <p class="text-xs text-gray-500 font-medium">Slot Kosong</p>
                        </div>
                    `;
                }
            }
            html += `</div></div>`;
        }
        html += `</div></div>`;
    }
    html += `</div>`;
    container.innerHTML = html;
}

// ==========================================================
// 3. MASTER TABLE VIEW
// ==========================================================
window.sortData = (column) => {
    if (sortCol === column) {
        sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    } else {
        sortCol = column;
        sortDir = 'asc';
    }
    updateTableRows();
};

function renderTableView(container) {
    container.innerHTML = `
        <div class="bg-white rounded-[24px] shadow-elegant border border-gray-100 overflow-hidden flex flex-col h-full animate-fade-in-up">
            <div class="p-5 border-b border-gray-100 flex flex-wrap gap-4 justify-between bg-gray-50/50 items-center">
                <div class="relative w-full md:w-72">
                    <i class="ph ph-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>
                    <input type="text" id="search-input" placeholder="Cari nama peserta..." value="${searchQuery}"
                        class="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand-pink focus:ring-2 focus:ring-brand-pink/20 outline-none text-sm font-medium transition-all">
                </div>
                <div class="flex gap-2">
                    <select id="filter-status" class="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold outline-none focus:border-brand-pink cursor-pointer bg-white">
                        <option value="ALL" ${filterStatus === 'ALL' ? 'selected' : ''}>📋 Semua Status</option>
                        <option value="DAPAT_SESI" ${filterStatus === 'DAPAT_SESI' ? 'selected' : ''}>Dapat Sesi (Belum Konfirmasi)</option>
                        <option value="WAITING_LIST" ${filterStatus === 'WAITING_LIST' ? 'selected' : ''}>Waiting List (Antre)</option>
                        <option value="CONFIRMED" ${filterStatus === 'CONFIRMED' ? 'selected' : ''}>Confirmed (Siap Hadir)</option>
                        <option value="HADIR" ${filterStatus === 'HADIR' ? 'selected' : ''}>📍 Hadir (Sesi Berjalan)</option>
                        <option value="SELESAI_FULL" ${filterStatus === 'SELESAI_FULL' ? 'selected' : ''}>🏁 Selesai (Feedback)</option>
                        <option value="BATAL" ${filterStatus === 'BATAL' ? 'selected' : ''}>Batal / Ditolak</option>
                    </select>
                </div>
            </div>

            <div class="overflow-x-auto flex-1">
                <table class="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                        <tr class="bg-brand-navy text-white text-xs uppercase tracking-wider select-none">
                            <th class="px-5 py-4 font-bold text-center w-12">No.</th>
                            <th class="px-6 py-4 font-bold cursor-pointer hover:text-brand-pink transition-colors group" onclick="window.sortData('nama_lengkap')">
                                Nama Peserta <i id="sort-icon-nama_lengkap" class="ph ph-caret-up-down text-gray-400 group-hover:text-brand-pink ml-1 inline-block"></i>
                            </th>
                            <th class="px-6 py-4 font-bold cursor-pointer hover:text-brand-pink transition-colors group" onclick="window.sortData('jadwal_hari')">
                                Jadwal & Psikolog <i id="sort-icon-jadwal_hari" class="ph ph-caret-up-down text-gray-400 group-hover:text-brand-pink ml-1 inline-block"></i>
                            </th>
                            <th class="px-6 py-4 font-bold cursor-pointer hover:text-brand-pink transition-colors group text-center" onclick="window.sortData('status_peserta')">
                                Status <i id="sort-icon-status_peserta" class="ph ph-caret-up-down text-gray-400 group-hover:text-brand-pink ml-1 inline-block"></i>
                            </th>
                            <th class="px-6 py-4 font-bold text-center">Aksi Cepat</th>
                        </tr>
                    </thead>
                    <tbody id="table-body" class="divide-y divide-gray-100 text-sm">
                        </tbody>
                </table>
            </div>
            
            <div class="p-5 border-t border-gray-100 flex justify-between items-center bg-gray-50/80" id="pagination-controls"></div>
        </div>
    `;

    document.getElementById('search-input').addEventListener('input', (e) => { 
        searchQuery = e.target.value; 
        currentPage = 1; 
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => { updateTableRows(); }, 300); 
    });

    document.getElementById('filter-status').addEventListener('change', (e) => { filterStatus = e.target.value; currentPage = 1; updateTableRows(); });

    updateTableRows();
}

function updateTableRows() {
    const tbody = document.getElementById('table-body');
    const pagination = document.getElementById('pagination-controls');

    const renderId = ++currentRenderId;

    let filteredData = ALL_DATA.filter(p => {
        const namaLengkap = p.nama_lengkap || '';
        const matchSearch = namaLengkap.toLowerCase().includes(searchQuery.toLowerCase().trim());
        const matchStatus = filterStatus === 'ALL' || p.status_peserta === filterStatus;
        return matchSearch && matchStatus;
    });

    filteredData.sort((a, b) => {
        let valA = a[sortCol] || '';
        let valB = b[sortCol] || '';
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        
        if (valA < valB) return sortDir === 'asc' ? -1 : 1;
        if (valA > valB) return sortDir === 'asc' ? 1 : -1;
        return 0;
    });

    const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    let rowsHTML = '';
    if (paginatedData.length === 0) {
        rowsHTML = `<tr><td colspan="5" class="px-6 py-12 text-center text-gray-400"><i class="ph ph-magnifying-glass text-4xl mb-2"></i><br>Data tidak ditemukan.</td></tr>`;
    } else {
        for (const [index, p] of paginatedData.entries()) {
            if (renderId !== currentRenderId) return; 

            const absoluteIndex = startIndex + index + 1;

            let badgeClass = 'bg-gray-100 text-gray-700';
            if (p.status_peserta === 'DAPAT_SESI') badgeClass = 'bg-blue-50 text-blue-700 border border-blue-200';
            if (p.status_peserta === 'WAITING_LIST') badgeClass = 'bg-yellow-50 text-yellow-700 border border-yellow-200';
            if (p.status_peserta === 'CONFIRMED') badgeClass = 'bg-green-50 text-green-700 border border-green-200';
            if (p.status_peserta === 'BATAL') badgeClass = 'bg-red-50 text-red-700 border border-red-200';
            if (['HADIR', 'SELESAI_FULL'].includes(p.status_peserta)) badgeClass = 'bg-brand-navy text-brand-base border border-brand-navy';
            
            // FUNGSI MEMORY LOKAL, NOL LOADING
            const waLink = buatLinkWA(p.status_peserta === 'WAITING_LIST' ? 'wa_template_waiting_list' : 'wa_template_konfirmasi_sesi', p) || '#'; 

            rowsHTML += `
                <tr class="hover:bg-brand-base/40 transition-colors group">
                    <td class="px-5 py-4 text-center font-bold text-gray-400 group-hover:text-brand-pink">${absoluteIndex}</td>
                    <td class="px-6 py-4">
                        <p class="font-bold text-brand-navy text-base">${p.nama_lengkap}</p>
                        <p class="text-xs text-gray-500 font-medium tracking-wide">${p.nomor_wa}</p>
                    </td>
                    <td class="px-6 py-4">
                        <p class="font-bold text-brand-navy text-xs mb-0.5">${p.jadwal_hari}</p>
                        <p class="text-brand-pink font-bold text-[11px] bg-brand-pink/10 inline-block px-1.5 py-0.5 rounded">
                            <i class="ph ph-clock"></i> ${p.jadwal_sesi} 
                            <span class="text-brand-blue ml-1">(${p.psikolog_bertugas || 'Antre'})</span>
                        </p>
                    </td>
                    <td class="px-6 py-4 text-center">
                        <span class="inline-block px-3 py-1 rounded text-[10px] font-black uppercase tracking-wider ${badgeClass}">${p.status_peserta.replace('_', ' ')}</span>
                    </td>
                    <td class="px-6 py-4">
                        <div class="flex items-center justify-center gap-2">
                            <button onclick="window.bukaDetail('${p.id}')" class="w-9 h-9 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-brand-navy rounded-xl font-bold transition-transform hover:scale-105" title="Lihat Profil"><i class="ph ph-identification-card text-lg"></i></button>
                            
                            <button onclick="window.bukaModalReschedule('${p.id}')" class="w-9 h-9 flex items-center justify-center bg-brand-gold/10 hover:bg-brand-gold/20 text-brand-gold rounded-xl font-bold transition-transform hover:scale-105" title="Pindah Jadwal"><i class="ph ph-calendar-edit text-lg"></i></button>

                            <a href="${waLink}" target="_blank" class="w-9 h-9 flex items-center justify-center bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold shadow-sm transition-transform hover:scale-105" title="Kirim WA"><i class="ph ph-whatsapp-logo text-lg"></i></a>
                            ${p.status_peserta === 'HADIR' ? `
                                <a href="${buatLinkWA('wa_template_minta_feedback', p) || '#'}" target="_blank" class="w-9 h-9 flex items-center justify-center bg-brand-blue hover:bg-brand-navy text-white rounded-xl font-bold shadow-sm transition-transform hover:scale-105" title="Minta Feedback">
                                    <i class="ph ph-chat-centered-text text-lg"></i>
                                </a>
                            ` : ''}
                            <select class="status-selector text-[11px] bg-white border border-gray-300 rounded-xl px-2 py-2 outline-none focus:border-brand-pink cursor-pointer font-bold text-brand-navy transition-colors hover:border-gray-400"
                                data-id="${p.id}" data-hari="${p.jadwal_hari}" data-sesi="${p.jadwal_sesi}">
                                <option value="" disabled selected>Ubah Status</option>
                                <option value="CONFIRMED">✅ Confirmed</option>
                                <option value="HADIR">📍 Hadir (Hari H)</option>                                
                                <option value="BATAL">❌ Batal/Kick</option>
                            </select>
                        </div>
                    </td>
                </tr>
            `;
        }
    }
    
    if (renderId !== currentRenderId) return;

    tbody.innerHTML = rowsHTML;

    pagination.innerHTML = `
        <span class="text-sm text-gray-500 font-semibold bg-white px-4 py-2 rounded-xl border border-gray-200">Halaman <span class="text-brand-navy">${currentPage}</span> dari ${totalPages} <span class="mx-2">|</span> Total <span class="text-brand-pink">${filteredData.length}</span> Data</span>
        <div class="flex gap-2">
            <button onclick="window.ubahPage(-1)" class="px-5 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-brand-navy hover:bg-gray-50 transition-colors shadow-sm ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}" ${currentPage === 1 ? 'disabled' : ''}>Prev</button>
            <button onclick="window.ubahPage(1)" class="px-5 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-brand-navy hover:bg-gray-50 transition-colors shadow-sm ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}" ${currentPage === totalPages ? 'disabled' : ''}>Next</button>
        </div>
    `;

    ['nama_lengkap', 'jadwal_hari', 'status_peserta'].forEach(col => {
        const icon = document.getElementById(`sort-icon-${col}`);
        if (icon) {
            if (sortCol === col) icon.className = `ph ${sortDir === 'asc' ? 'ph-caret-up' : 'ph-caret-down'} text-brand-pink ml-1 inline-block`;
            else icon.className = `ph ph-caret-up-down text-gray-400 group-hover:text-brand-pink ml-1 inline-block`;
        }
    });

    document.querySelectorAll('.status-selector').forEach(sel => {
        sel.addEventListener('change', (e) => {
            const id = e.target.dataset.id;
            const hari = e.target.dataset.hari;
            const sesi = e.target.dataset.sesi;
            const statusBaru = e.target.value;
            const namaPeserta = e.target.closest('tr').querySelector('td:nth-child(2) p:first-child').innerText;
            const originalStatus = ALL_DATA.find(p => p.id === id).status_peserta;

            showConfirmationModal(id, namaPeserta, statusBaru, hari, sesi, originalStatus, e.target);
        });
    });
}

// [BARU] Fungsi untuk menampilkan modal konfirmasi perubahan status
async function showConfirmationModal(id, namaPeserta, statusBaru, hari, sesi, originalStatus, selectElement) {
    const modal = document.getElementById('confirm-status-modal');
    const card = document.getElementById('confirm-status-modal-card');
    const messageEl = document.getElementById('confirm-status-message');
    const confirmBtn = document.getElementById('confirm-status-yes');

    messageEl.innerHTML = `Anda yakin ingin mengubah status <span class="font-bold text-brand-pink">${namaPeserta}</span> menjadi <span class="font-bold text-brand-gold">${statusBaru.replace('_', ' ')}</span>?`;

    confirmBtn.replaceWith(confirmBtn.cloneNode(true));
    const newConfirmBtn = document.getElementById('confirm-status-yes');

    newConfirmBtn.addEventListener('click', async () => {
        closeConfirmStatusModal();
        selectElement.disabled = true;
        document.getElementById('loading-admin').classList.remove('hidden');
        
        const res = await updateStatusPesertaDenganAutoPromo(id, statusBaru, hari, sesi);
        if(res.success) {
            if (res.dipromosikan) showToast(`Peserta [${res.dipromosikan}] berhasil dipromosikan!`, 'success');
            else showToast(`Status berhasil diubah menjadi ${statusBaru}`, 'success');
            await initAdminData();
        } else {
            showToast("Gagal update status! Pastikan koneksi stabil.", 'error');
            selectElement.disabled = false;
            selectElement.value = originalStatus;
            document.getElementById('loading-admin').classList.add('hidden');
        }
    });

    modal.classList.remove('hidden');
    setTimeout(() => { modal.classList.remove('opacity-0'); card.classList.remove('scale-95'); }, 10);
}

function closeConfirmStatusModal() {
    const modal = document.getElementById('confirm-status-modal');
    const card = document.getElementById('confirm-status-modal-card');
    modal.classList.add('opacity-0');
    card.classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

// ==========================================================
// LOGIKA PINDAH JADWAL (Mencari Slot Kosong)
// ==========================================================
window.bukaModalReschedule = (id) => {
    const p = ALL_DATA.find(x => x.id === id);
    if(!p) return;

    document.getElementById('reschedule-nama').innerText = p.nama_lengkap;
    document.getElementById('reschedule-id').value = p.id;

    const sesiList = ["09.00-09.45", "09.50-10.35", "10.40-11.25", "11.30-12.15", "13.15-14.00", "14.05-14.50", "14.55-15.40"];
    const days = [CONFIG.tanggal_kegiatan_1, CONFIG.tanggal_kegiatan_2].filter(Boolean);
    
    let optionsHTML = '<option value="" disabled selected>Pilih Jadwal Baru yang Kosong...</option>';
    let slotKetemu = false;

    days.forEach(day => {
        const psikologListKey = day === CONFIG.tanggal_kegiatan_1 ? 'psikolog_list_1' : 'psikolog_list_2';
        const psikologList = JSON.parse(CONFIG[psikologListKey] || '[]');

        sesiList.forEach(sesi => {
            const taken = ALL_DATA.filter(x => 
                x.jadwal_hari === day && 
                x.jadwal_sesi === sesi && 
                ['DAPAT_SESI', 'CONFIRMED', 'HADIR', 'SELESAI_FULL'].includes(x.status_peserta)
            );

            if (taken.length < psikologList.length) {
                if (!(p.jadwal_hari === day && p.jadwal_sesi === sesi)) {
                    const takenPsikologs = taken.map(t => t.psikolog_bertugas);
                    const freePsikolog = psikologList.find(psi => !takenPsikologs.includes(psi));
                    
                    if(freePsikolog) {
                        const sisaSlot = psikologList.length - taken.length;
                        optionsHTML += `<option value="${day}|${sesi}|${freePsikolog}">${day} - Pukul ${sesi} (Sisa ${sisaSlot} slot)</option>`;
                        slotKetemu = true;
                    }
                }
            }
        });
    });

    if (!slotKetemu) {
        optionsHTML = '<option value="" disabled selected>Semua slot sudah penuh!</option>';
    }

    document.getElementById('reschedule-select').innerHTML = optionsHTML;

    const modal = document.getElementById('reschedule-modal');
    const card = document.getElementById('reschedule-modal-card');
    modal.classList.remove('hidden');
    setTimeout(() => { modal.classList.remove('opacity-0'); card.classList.remove('scale-95'); }, 10);
};

window.tutupModalReschedule = () => {
    const modal = document.getElementById('reschedule-modal');
    const card = document.getElementById('reschedule-modal-card');
    modal.classList.add('opacity-0');
    card.classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 300);
};

window.submitReschedule = async () => {
    const id = document.getElementById('reschedule-id').value;
    const valueData = document.getElementById('reschedule-select').value;
    
    if(!valueData) {
        showToast("Silakan pilih jadwal baru terlebih dahulu", "error");
        return;
    }

    const [hariBaru, sesiBaru, psikologBaru] = valueData.split('|');
    const pesertaLama = ALL_DATA.find(x => x.id === id);

    document.getElementById('loading-admin').classList.remove('hidden');
    
    const res = await ubahJadwalPeserta(id, hariBaru, sesiBaru, psikologBaru, pesertaLama.jadwal_hari, pesertaLama.jadwal_sesi, pesertaLama.psikolog_bertugas);
    
    if (res.success) {
        window.tutupModalReschedule();
        showToast("Jadwal peserta berhasil dipindah!", "success");
        if(res.dipromosikan) {
            alert(`SISTEM AUTO-PROMO:\nKabar baik! Karena jadwal dipindah, anak Waiting List bernama [${res.dipromosikan}] otomatis naik untuk mengisi slot lama yang baru saja kosong.`);
        }
        await initAdminData(); 
    } else {
        showToast("Gagal memindah jadwal: " + res.message, "error");
        document.getElementById('loading-admin').classList.add('hidden');
    }
};

// ==========================================================
// FUNGSI GLOBAL & MODAL DETAIL
// ==========================================================
window.ubahPage = (dir) => { currentPage += dir; updateTableRows(); };

window.bukaDetail = (id) => {
    const p = ALL_DATA.find(x => x.id === id);
    if(!p) return;

    const modal = document.getElementById('detail-modal');
    const card = document.getElementById('detail-modal-card');
    const body = document.getElementById('modal-body');

    body.innerHTML = `
        <div class="col-span-1 md:col-span-2 border-b border-gray-100 pb-4 mb-2">
            <h4 class="text-2xl font-black text-brand-navy">${p.nama_lengkap}</h4>
            <span class="inline-block px-3 py-1 mt-2 rounded text-[10px] font-black uppercase tracking-wider bg-gray-100 text-brand-navy border border-gray-200">${p.status_peserta}</span>
        </div>
        <div>
            <p class="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1"><i class="ph ph-envelope-simple"></i> Email & Kontak</p>
            <p class="font-semibold text-brand-navy text-base">${p.email}</p>
            <p class="text-sm text-gray-500">${p.nomor_wa}</p>
        </div>
        <div>
            <p class="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1"><i class="ph ph-student"></i> Status & Angkatan</p>
            <p class="font-semibold text-brand-navy text-base">${p.status_mhs}</p>
            <p class="text-sm text-gray-500">Angkatan ${p.angkatan}</p>
        </div>
        <div class="col-span-1 md:col-span-2">
            <p class="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1"><i class="ph ph-buildings"></i> Universitas & Jurusan</p>
            <p class="font-semibold text-brand-navy text-base">${p.asal_univ}</p>
            <p class="text-sm text-gray-500">${p.jurusan}</p>
        </div>
        <div class="col-span-1 md:col-span-2 flex gap-4 mt-2">
            <div class="flex-1 bg-brand-base p-4 rounded-xl border border-gray-200">
                <p class="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Kebutuhan Sesi</p>
                <p class="font-bold text-brand-pink text-sm">${p.harapan_sesi}</p>
            </div>
            <div class="flex-1 ${p.is_member_itbcc ? 'bg-[#FDF8EE] border-brand-gold/30' : 'bg-gray-50 border-gray-200'} p-4 rounded-xl border">
                <p class="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Member ITB CC</p>
                <p class="font-bold ${p.is_member_itbcc ? 'text-brand-gold' : 'text-gray-500'} text-sm">${p.is_member_itbcc ? '✅ Ya, Sudah Member' : '❌ Belum Member'}</p>
            </div>
        </div>
        <div class="col-span-1 md:col-span-2 bg-gradient-to-r from-brand-navy to-brand-blue p-5 rounded-xl text-white mt-2 shadow-inner">
            <p class="text-[11px] font-bold text-brand-pink uppercase tracking-widest mb-2 shadow-sm">Alokasi Sistem (Auto-Assign)</p>
            <div class="flex justify-between items-center">
                <div>
                    <p class="font-bold text-lg leading-tight">${p.jadwal_hari}</p>
                    <p class="text-brand-base text-sm opacity-90"><i class="ph ph-clock"></i> Pukul ${p.jadwal_sesi}</p>
                </div>
                <div class="text-right">
                    <p class="text-[10px] uppercase text-gray-300">Ditempatkan Pada:</p>
                    <p class="font-black text-brand-gold text-lg">${p.psikolog_bertugas || 'Waiting List'}</p>
                </div>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
    setTimeout(() => { modal.classList.remove('opacity-0'); card.classList.remove('scale-95'); }, 10);
};

function closeModal() {
    const modal = document.getElementById('detail-modal');
    const card = document.getElementById('detail-modal-card');
    modal.classList.add('opacity-0');
    card.classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const icon = type === 'success' ? 'ph-check-circle' : 'ph-x-circle';
    const colors = type === 'success' ? 'bg-green-500 border-green-600' : 'bg-red-500 border-red-600';

    toast.className = `flex items-center gap-3 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg border ${colors} animate-fade-in-up`;
    toast.innerHTML = `<i class="ph ${icon} text-xl"></i><span>${message}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('animate-fade-out-down');
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}