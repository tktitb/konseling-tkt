// File: frontend/js/pages/AdminPage.js

import { getSemuaPeserta, getSystemConfig, toggleStatusPendaftaran, updateStatusPesertaDenganAutoPromo, ubahJadwalPeserta, getSemuaFeedback } from '../services/apiService.js';

// Import Views yang sudah kita pecah agar modular & rapi
import { renderDashboardView } from './admin/DashboardView.js';
import { renderBoardView } from './admin/BoardView.js';
import { renderTableView } from './admin/TableView.js';
import { renderFeedbackView } from './admin/FeedbackView.js';

// ==========================================
// STATE GLOBAL ADMIN
// ==========================================
let ALL_DATA = [];
let CONFIG = {};
let FEEDBACK_DATA = [];
let CURRENT_TAB = 'analytics'; // 'analytics', 'board', 'table', 'feedback'

export async function renderAdminPage(container) {
    container.innerHTML = `
        <div id="admin-layout" class="flex h-screen bg-brand-surface w-full overflow-hidden font-sans group">
            <div id="mobile-menu-overlay" class="fixed inset-0 bg-black/60 z-30 hidden md:hidden"></div>

            <aside id="admin-sidebar" class="w-64 bg-brand-navy text-white flex flex-col absolute md:relative inset-y-0 left-0 transform -translate-x-full md:translate-x-0 transition-all duration-300 ease-in-out shadow-2xl z-40 group-[.sidebar-collapsed]:w-20 z-50">
                <div class="p-6 border-b border-white/10 text-center relative overflow-hidden h-[93px] flex flex-col justify-center shrink-0">
                    <div class="absolute top-0 right-0 w-20 h-20 bg-brand-gold rounded-full blur-2xl opacity-20"></div>
                    <div class="absolute bottom-0 left-0 w-20 h-20 bg-brand-pink rounded-full blur-2xl opacity-20"></div>
                    <img src="assets/images/logo-white.png" alt="Logo" class="h-10 mx-auto mb-2 relative z-10 transition-all duration-300 group-[.sidebar-collapsed]:h-8 group-[.sidebar-collapsed]:mb-0">
                    <p class="text-xs text-brand-base/60 relative z-10 transition-opacity duration-200 group-[.sidebar-collapsed]:opacity-0 group-[.sidebar-collapsed]:h-0">Admin Command Center</p>
                </div>
                <nav class="flex-1 p-4 space-y-2 overflow-y-auto">
                    <button id="nav-analytics" class="w-full flex items-center gap-3 bg-white/10 px-4 py-3 rounded-xl text-brand-gold font-medium transition-colors group-[.sidebar-collapsed]:justify-center">
                        <i class="ph ph-chart-polar text-xl"></i> <span class="transition-opacity duration-200 group-[.sidebar-collapsed]:opacity-0 group-[.sidebar-collapsed]:hidden whitespace-nowrap">Dashboard Analitik</span>
                    </button>
                    <button id="nav-board" class="w-full flex items-center gap-3 hover:bg-white/5 px-4 py-3 rounded-xl text-white/70 hover:text-white transition-colors group-[.sidebar-collapsed]:justify-center">
                        <i class="ph ph-kanban text-xl"></i> <span class="transition-opacity duration-200 group-[.sidebar-collapsed]:opacity-0 group-[.sidebar-collapsed]:hidden whitespace-nowrap">Papan Jadwal</span>
                    </button>
                    <button id="nav-table" class="w-full flex items-center gap-3 hover:bg-white/5 px-4 py-3 rounded-xl text-white/70 hover:text-white transition-colors group-[.sidebar-collapsed]:justify-center">
                        <i class="ph ph-table text-xl"></i> <span class="transition-opacity duration-200 group-[.sidebar-collapsed]:opacity-0 group-[.sidebar-collapsed]:hidden whitespace-nowrap">Master Data</span>
                    </button>
                    <button id="nav-feedback" class="w-full flex items-center gap-3 hover:bg-white/5 px-4 py-3 rounded-xl text-white/70 hover:text-white transition-colors group-[.sidebar-collapsed]:justify-center">
                        <i class="ph ph-star-half text-xl"></i> <span class="transition-opacity duration-200 group-[.sidebar-collapsed]:opacity-0 group-[.sidebar-collapsed]:hidden whitespace-nowrap">Data Feedback</span>
                    </button>
                    <div class="pt-4 mt-4 border-t border-white/10">
                        <a href="#/display" target="_blank" class="flex items-center gap-3 hover:bg-white/5 px-4 py-3 rounded-xl text-brand-blue hover:text-brand-pink transition-colors bg-white/5 group-[.sidebar-collapsed]:justify-center">
                            <i class="ph ph-monitor-play text-xl"></i> <span class="transition-opacity duration-200 group-[.sidebar-collapsed]:opacity-0 group-[.sidebar-collapsed]:hidden whitespace-nowrap">Buka Layar Booth</span>
                        </a>
                    </div>
                </nav>
                <div class="p-4 border-t border-white/10 hidden md:block shrink-0">
                    <button id="desktop-toggle-sidebar" class="w-full flex items-center gap-3 hover:bg-white/5 px-4 py-3 rounded-xl text-white/70 hover:text-white transition-colors group-[.sidebar-collapsed]:justify-center">
                        <i id="desktop-toggle-icon" class="ph ph-caret-double-left text-xl"></i> <span class="text-sm transition-opacity duration-200 group-[.sidebar-collapsed]:opacity-0 group-[.sidebar-collapsed]:hidden">Ciutkan</span>
                    </button>
                </div>
            </aside>

            <main class="flex-1 flex flex-col h-full overflow-hidden bg-brand-base relative z-10">
                
                <header class="bg-white px-4 md:px-8 py-4 border-b border-gray-200 flex justify-between items-center shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] z-20 shrink-0">
                    <button id="hamburger-btn" class="md:hidden p-2 text-brand-navy text-2xl">
                        <i class="ph ph-list"></i>
                    </button>
                    <div>
                        <h1 class="text-xl md:text-2xl font-bold text-brand-navy truncate" id="header-title">Dashboard Analitik</h1>
                        <p class="text-sm text-gray-500 hidden sm:block truncate" id="header-desc">Ringkasan statistik dan performa pendaftaran sesi.</p>
                    </div>
                    
                    <div class="flex items-center gap-2 sm:gap-4 shrink-0">
                        <button id="btn-refresh-data" class="flex items-center justify-center h-10 px-3 sm:px-4 bg-white hover:bg-brand-surface text-brand-navy rounded-xl border border-gray-200 shadow-sm transition-all focus:ring-2 focus:ring-brand-pink focus:outline-none group" title="Tarik Data Terbaru">
                            <i class="ph ph-arrows-clockwise text-lg group-hover:rotate-180 transition-transform duration-500" id="refresh-icon"></i>
                            <span class="text-sm font-bold hidden sm:block sm:ml-2">Refresh</span>
                        </button>
                        
                        <div class="flex items-center gap-2 sm:gap-3 bg-gray-50 p-2 rounded-xl border border-gray-200 shadow-inner">
                            <span class="text-sm font-semibold text-brand-navy hidden lg:inline" id="status-text">Form:</span>
                            <button id="btn-toggle-form" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-pink focus:ring-offset-1">
                                <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow"></span>
                            </button>
                        </div>
                    </div>
                </header>

                <div id="loading-admin" class="absolute inset-0 flex items-center justify-center bg-brand-base/80 z-50 backdrop-blur-sm transition-opacity duration-300">
                    <div class="flex flex-col items-center gap-3 bg-white p-6 rounded-2xl shadow-elegant">
                        <i class="ph ph-spinner animate-spin text-4xl text-brand-pink"></i>
                        <p class="font-bold text-brand-navy tracking-wide">Sinkronisasi Data...</p>
                    </div>
                </div>

                <div id="admin-content" class="flex-1 overflow-auto p-6 md:p-8 scroll-smooth pb-20">
                </div>
            </main>

            <div id="detail-modal" class="fixed inset-0 bg-brand-navy/60 backdrop-blur-sm z-[100] hidden flex items-center justify-center p-4 opacity-0 transition-opacity duration-300">
                <div class="bg-white rounded-[24px] shadow-2xl w-full max-w-2xl overflow-hidden scale-95 transition-transform duration-300 transform max-h-[90vh] flex flex-col" id="detail-modal-card">
                    <div class="bg-brand-navy p-6 flex justify-between items-center text-white relative overflow-hidden shrink-0">
                        <div class="absolute right-0 top-0 w-32 h-32 bg-brand-gold/20 rounded-full blur-2xl -translate-y-10"></div>
                        <h3 class="text-xl font-bold relative z-10 flex items-center gap-2"><i class="ph ph-identification-card text-brand-pink"></i> Profil Peserta</h3>
                        <button onclick="window.tutupDetail()" class="text-white/70 hover:text-white text-2xl relative z-10 transition-transform hover:rotate-90"><i class="ph ph-x"></i></button>
                    </div>
                    <div id="modal-body" class="p-8 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 text-sm overflow-y-auto">
                    </div>
                </div>
            </div>

            <div id="confirm-status-modal" class="fixed inset-0 bg-brand-navy/60 backdrop-blur-sm z-[100] hidden flex items-center justify-center p-4 opacity-0 transition-opacity duration-300">
                <div class="bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden scale-95 transition-transform duration-300 transform" id="confirm-status-modal-card">
                    <div class="bg-brand-navy p-6 flex justify-between items-center text-white relative overflow-hidden">
                        <div class="absolute right-0 top-0 w-32 h-32 bg-brand-gold/20 rounded-full blur-2xl -translate-y-10"></div>
                        <h3 class="text-xl font-bold relative z-10 flex items-center gap-2"><i class="ph ph-warning-circle text-brand-gold"></i> Konfirmasi Perubahan Status</h3>
                        <button onclick="window.closeConfirmStatusModal()" class="text-white/70 hover:text-white text-2xl relative z-10 transition-transform hover:rotate-90"><i class="ph ph-x"></i></button>
                    </div>
                    <div class="p-8 text-center">
                        <p class="text-brand-navy text-lg font-semibold mb-6" id="confirm-status-message">Anda yakin ingin mengubah status peserta ini?</p>
                        <div class="flex justify-center gap-4">
                            <button id="confirm-status-yes" class="px-6 py-3 bg-brand-pink hover:bg-brand-pinkdark text-white rounded-xl font-bold transition-colors shadow-md">Ya, Ubah Status</button>
                            <button onclick="window.closeConfirmStatusModal()" class="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-brand-navy rounded-xl font-bold transition-colors shadow-md">Tidak, Kembali</button>
                        </div>
                    </div>
                </div>
            </div>

            <div id="reschedule-modal" class="fixed inset-0 bg-brand-navy/60 backdrop-blur-sm z-[100] hidden flex items-center justify-center p-4 opacity-0 transition-opacity duration-300">
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

            <div id="toast-container" class="fixed top-5 right-5 z-[110] space-y-2 pointer-events-none"></div>
        </div>
    `;

    await initAdminData();
}

async function initAdminData() {
    document.getElementById('loading-admin').classList.remove('hidden');
    
    // Tarik data sekaligus di awal
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
            statusText.innerHTML = '<span class="text-brand-pink font-bold">BUKA</span>';
        } else {
            btnToggle.classList.replace('bg-brand-pink', 'bg-gray-300');
            btnToggle.classList.add('bg-gray-300');
            btnToggle.querySelector('span').classList.replace('translate-x-6', 'translate-x-1');
            statusText.innerHTML = '<span class="text-gray-500 font-bold">TUTUP</span>';
        }
    };
    btnToggle.querySelector('span').classList.add('translate-x-1');
    updateToggleUI();

    btnToggle.addEventListener('click', async () => {
        isBuka = !isBuka;
        updateToggleUI();
        await toggleStatusPendaftaran(isBuka ? 'buka' : 'tutup');
    });

    // Setup Tombol Refresh Manual
    const btnRefresh = document.getElementById('btn-refresh-data');
    const refreshIcon = document.getElementById('refresh-icon');
    btnRefresh.addEventListener('click', async () => {
        refreshIcon.classList.add('animate-spin');
        window.showToast("Menarik data terbaru...", "info");
        await fetchData(); 
        renderCurrentTab(); 
        refreshIcon.classList.remove('animate-spin');
        window.showToast("Data berhasil diperbarui!", "success");
    });

    // Setup Tab Navigation
    document.getElementById('nav-analytics').addEventListener('click', (e) => switchTab('analytics', e.currentTarget));
    document.getElementById('nav-board').addEventListener('click', (e) => switchTab('board', e.currentTarget));
    document.getElementById('nav-table').addEventListener('click', (e) => switchTab('table', e.currentTarget));
    document.getElementById('nav-feedback').addEventListener('click', (e) => switchTab('feedback', e.currentTarget)); // Tab Baru

    // Setup Mobile Menu
    const sidebar = document.getElementById('admin-sidebar');
    const overlay = document.getElementById('mobile-menu-overlay');
    const hamburgerBtn = document.getElementById('hamburger-btn');

    const closeMenu = () => { sidebar.classList.add('-translate-x-full'); overlay.classList.add('hidden'); };
    hamburgerBtn.addEventListener('click', () => { sidebar.classList.remove('-translate-x-full'); overlay.classList.remove('hidden'); });
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
    FEEDBACK_DATA = await getSemuaFeedback();
}

// Fungsi Bantuan Sinkron Merakit Link WA (Akan dipassing ke View lain)
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
        'table': { title: 'Master Data Peserta', desc: 'Kelola seluruh data peserta dengan filter dan sorting.' },
        'feedback': { title: 'Analitik & Testimoni', desc: 'Pantau tingkat kepuasan dan pesan dari peserta.' }
    };
    
    document.getElementById('header-title').innerText = titles[tabName].title;
    document.getElementById('header-desc').innerText = titles[tabName].desc;
    
    const navs = ['nav-analytics', 'nav-board', 'nav-table', 'nav-feedback'];
    navs.forEach(id => {
        document.getElementById(id).className = "w-full flex items-center gap-3 hover:bg-white/5 px-4 py-3 rounded-xl text-white/70 hover:text-white transition-colors group-[.sidebar-collapsed]:justify-center";
    });
    
    btnElement.className = "w-full flex items-center gap-3 bg-white/10 px-4 py-3 rounded-xl text-brand-gold font-bold shadow-inner transition-colors group-[.sidebar-collapsed]:justify-center";
    renderCurrentTab();
}

function renderCurrentTab() {
    const container = document.getElementById('admin-content');
    if (CURRENT_TAB === 'analytics') renderDashboardView(container, ALL_DATA);
    else if (CURRENT_TAB === 'board') renderBoardView(container, ALL_DATA, CONFIG, buatLinkWA);
    else if (CURRENT_TAB === 'table') renderTableView(container, ALL_DATA, CONFIG, buatLinkWA);
    else if (CURRENT_TAB === 'feedback') renderFeedbackView(container, FEEDBACK_DATA);
}

// ==========================================================
// FUNGSI MODAL & GLOBAL BINDING (Di-bind ke window agar bisa dipanggil dari HTML string di View)
// ==========================================================

window.showToast = function(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    
    let icon = 'ph-info';
    let colors = 'bg-blue-500 border-blue-600'; 
    if (type === 'success') { icon = 'ph-check-circle'; colors = 'bg-green-500 border-green-600'; } 
    else if (type === 'error') { icon = 'ph-x-circle'; colors = 'bg-red-500 border-red-600'; }

    toast.className = `flex items-center gap-3 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg border ${colors} animate-fade-in-up pointer-events-auto`;
    toast.innerHTML = `<i class="ph ${icon} text-xl"></i><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.classList.add('animate-fade-out-down'); setTimeout(() => toast.remove(), 500); }, 4000);
};

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
            <p class="font-semibold text-brand-navy text-base break-all">${p.email}</p>
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
        <div class="col-span-1 md:col-span-2 flex flex-col sm:flex-row gap-4 mt-2">
            <div class="flex-1 bg-brand-base p-4 rounded-xl border border-gray-200">
                <p class="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Kebutuhan Sesi</p>
                <p class="font-bold text-brand-pink text-sm">${p.harapan_sesi}</p>
                ${p.detail_harapan ? `<p class="text-xs text-gray-500 mt-2 border-t border-gray-200 pt-2 italic">"${p.detail_harapan}"</p>` : ''}
            </div>
            <div class="flex-1 ${p.is_member_itbcc ? 'bg-[#FDF8EE] border-brand-gold/30' : 'bg-gray-50 border-gray-200'} p-4 rounded-xl border">
                <p class="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Member ITB CC</p>
                <p class="font-bold ${p.is_member_itbcc ? 'text-brand-gold' : 'text-gray-500'} text-sm">${p.is_member_itbcc ? '✅ Ya, Sudah Member' : '❌ Belum Member'}</p>
            </div>
        </div>
        <div class="col-span-1 md:col-span-2 bg-gradient-to-r from-brand-navy to-brand-blue p-5 rounded-xl text-white mt-2 shadow-inner">
            <p class="text-[11px] font-bold text-brand-pink uppercase tracking-widest mb-2 shadow-sm">Alokasi Sistem</p>
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

window.tutupDetail = () => {
    const modal = document.getElementById('detail-modal');
    const card = document.getElementById('detail-modal-card');
    modal.classList.add('opacity-0');
    card.classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 300);
};

window.showConfirmationModal = async (id, namaPeserta, statusBaru, hari, sesi, originalStatus, selectElement) => {
    const modal = document.getElementById('confirm-status-modal');
    const card = document.getElementById('confirm-status-modal-card');
    const messageEl = document.getElementById('confirm-status-message');
    const confirmBtn = document.getElementById('confirm-status-yes');

    messageEl.innerHTML = `Anda yakin ingin mengubah status <span class="font-bold text-brand-pink">${namaPeserta}</span> menjadi <span class="font-bold text-brand-gold">${statusBaru.replace('_', ' ')}</span>?`;

    confirmBtn.replaceWith(confirmBtn.cloneNode(true));
    const newConfirmBtn = document.getElementById('confirm-status-yes');

    newConfirmBtn.addEventListener('click', async () => {
        window.closeConfirmStatusModal();
        selectElement.disabled = true;
        document.getElementById('loading-admin').classList.remove('hidden');
        
        const res = await updateStatusPesertaDenganAutoPromo(id, statusBaru, hari, sesi);
        if(res.success) {
            window.showToast(`Status berhasil diubah menjadi ${statusBaru}`, 'success');
            await initAdminData(); 
        } else {
            window.showToast(res.message, 'error'); 
            selectElement.disabled = false;
            selectElement.value = originalStatus;
            document.getElementById('loading-admin').classList.add('hidden');
        }
    });

    modal.classList.remove('hidden');
    setTimeout(() => { modal.classList.remove('opacity-0'); card.classList.remove('scale-95'); }, 10);
};

window.closeConfirmStatusModal = () => {
    const modal = document.getElementById('confirm-status-modal');
    const card = document.getElementById('confirm-status-modal-card');
    modal.classList.add('opacity-0');
    card.classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 300);
};

window.bukaModalReschedule = (id) => {
    const p = ALL_DATA.find(x => x.id === id);
    if(!p) return;

    document.getElementById('reschedule-nama').innerText = p.nama_lengkap;
    document.getElementById('reschedule-id').value = p.id;

    const sesiList = ["09.00-09.45", "09.50-10.35", "10.40-11.25", "11.30-12.15", "13.15-14.00", "14.05-14.50", "14.55-15.40"];
    const days = [CONFIG.tanggal_kegiatan_1, CONFIG.tanggal_kegiatan_2].filter(Boolean);
    let optionsHTML = '<option value="" disabled selected>Pilih Jadwal & Psikolog Baru...</option>';

    days.forEach(day => {
        const psikologListKey = day === CONFIG.tanggal_kegiatan_1 ? 'psikolog_list_1' : 'psikolog_list_2';
        const psikologList = JSON.parse(CONFIG[psikologListKey] || '[]');

        sesiList.forEach(sesi => {
            const taken = ALL_DATA.filter(x => x.jadwal_hari === day && x.jadwal_sesi === sesi && ['DAPAT_SESI', 'CONFIRMED', 'HADIR', 'SELESAI_FULL'].includes(x.status_peserta));

            psikologList.forEach(psi => {
                if (!(p.jadwal_hari === day && p.jadwal_sesi === sesi && p.psikolog_bertugas === psi)) {
                    const countInSlot = taken.filter(t => t.psikolog_bertugas === psi).length;
                    const statusText = countInSlot === 0 ? '🟢 Kosong' : `🔴 Terisi (${countInSlot} org)`;
                    optionsHTML += `<option value="${day}|${sesi}|${psi}">${day} | Pukul ${sesi} | ${psi} - ${statusText}</option>`;
                }
            });
        });
    });

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
    
    if(!valueData) { window.showToast("Silakan pilih jadwal baru terlebih dahulu", "error"); return; }

    const [hariBaru, sesiBaru, psikologBaru] = valueData.split('|');
    const pesertaLama = ALL_DATA.find(x => x.id === id);

    document.getElementById('loading-admin').classList.remove('hidden');
    const res = await ubahJadwalPeserta(id, hariBaru, sesiBaru, psikologBaru, pesertaLama.jadwal_hari, pesertaLama.jadwal_sesi, pesertaLama.psikolog_bertugas);
    
    if (res.success) {
        window.tutupModalReschedule();
        window.showToast("Jadwal peserta berhasil dipindah!", "success");
        await initAdminData(); 
    } else {
        window.showToast("Gagal memindah jadwal: " + res.message, "error");
        document.getElementById('loading-admin').classList.add('hidden');
    }
};