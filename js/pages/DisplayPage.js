// File: frontend/js/pages/DisplayPage.js
import { getSemuaPeserta, getSystemConfig, subscribeToPesertaChanges } from '../services/apiService.js';

let ALL_DATA = [];
let CONFIG = {};
let clockInterval;
let realtimeSubscription; // Variabel untuk menyimpan langganan Realtime
let selectedDisplayDay = ''; // Hari yang sedang ditampilkan

export async function renderDisplayPage(container) {
    container.innerHTML = `
        <div class="flex flex-col h-screen w-full bg-[#0B1A26] text-white overflow-hidden font-sans relative z-0">
            <div class="absolute top-0 left-0 w-[500px] h-[500px] bg-brand-navy rounded-full blur-[120px] opacity-60 -z-10 -translate-x-1/2 -translate-y-1/2"></div>
            <div class="absolute bottom-0 right-0 w-[600px] h-[600px] bg-brand-pink/20 rounded-full blur-[150px] opacity-40 -z-10 translate-x-1/3 translate-y-1/3"></div>

            <header class="flex justify-between items-end px-10 py-6 border-b border-white/10 shrink-0 bg-[#0B1A26]/80 backdrop-blur-md z-10">
                <div class="flex items-center gap-6">
                    <!-- Ganti dengan path logo Anda -->
                    <img src="assets/images/logo-white.png" alt="Logo" class="h-10">
                    <div>
                        <h1 class="text-4xl font-black tracking-wide text-white">Status <span class="text-brand-gold">Konseling</span></h1>
                        <div class="relative mt-2">
                            <select id="day-selector" class="bg-brand-navy border border-brand-gold/50 text-white text-sm font-semibold rounded-lg focus:ring-brand-pink focus:border-brand-pink block w-full p-2.5 pr-8 appearance-none cursor-pointer">
                                <option value="" disabled selected>Pilih Hari...</option>
                            </select>
                            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
                                <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                            </div>
                        </div>
                        <p class="text-brand-pink font-semibold tracking-widest uppercase text-sm mt-2" id="tanggal-hari-ini">Memuat Jadwal...</p>

                    </div>
                </div>
                <div class="text-right flex flex-col items-end">
                    <div class="text-5xl font-black text-white tracking-tighter tabular-nums drop-shadow-lg flex items-center gap-2" id="live-clock">
                        00:00:00
                    </div>
                    <p class="text-gray-400 font-medium tracking-widest text-sm mt-1 uppercase flex items-center gap-2" title="Data diperbarui otomatis setiap 5 menit">
                        <i class="ph ph-arrows-clockwise text-brand-blue" id="sync-icon"></i> Real-time Update
                    </p>
                </div>
            </header>

            <main class="flex-1 p-8 overflow-hidden z-10" id="display-content">
                <div class="col-span-5 flex flex-col items-center justify-center h-full">
                    <i class="ph ph-spinner animate-spin text-6xl text-brand-gold mb-4"></i>
                    <p class="text-xl text-gray-400 font-medium">Menarik data dari database...</p>
                </div>
            </main>
            
            <footer class="py-4 text-center border-t border-white/5 bg-[#0B1A26]/80 text-gray-500 text-sm tracking-widest uppercase shrink-0 flex justify-between px-10">
                <span>Institut Teknologi Bandung Career Center</span>
                <span id="last-update-text">Pembaruan Terakhir: -</span>
            </footer>
        </div>
    `;

    // 1. Mulai Jam Digital
    jalankanJamLokal();

    // 2. Ambil Konfigurasi Sistem
    CONFIG = await getSystemConfig();

    // 3. Populate Day Selector
    const daySelector = document.getElementById('day-selector');
    let firstDayValue = '';
    Object.keys(CONFIG).forEach(key => {
        if (key.startsWith('tanggal_kegiatan_')) {
            const dayValue = CONFIG[key];
            const option = document.createElement('option');
            option.value = dayValue;
            option.innerText = dayValue;
            daySelector.appendChild(option);
            if (!firstDayValue) firstDayValue = dayValue; // Set first day as default
        }
    });

    if (firstDayValue) {
        daySelector.value = firstDayValue;
        selectedDisplayDay = firstDayValue;
    }

    // 4. Attach Event Listener for Day Selector
    daySelector.addEventListener('change', (e) => {
        selectedDisplayDay = e.target.value;
        muatUlangLayar();
    });

    // 5. Inisialisasi Tampilan Awal
    await muatUlangLayar();

    // 6. Supabase Realtime Subscription
    if (realtimeSubscription) {
        supabase.removeChannel(realtimeSubscription); // Hapus langganan lama jika ada
    }
    realtimeSubscription = subscribeToPesertaChanges(async () => {
        console.log("Realtime update received! Re-rendering display.");
        const syncIcon = document.getElementById('sync-icon');
        if (syncIcon) {
            syncIcon.classList.add('animate-spin');
            setTimeout(() => syncIcon.classList.remove('animate-spin'), 1000); // Putar sebentar
        }
        await muatUlangLayar();
    });
}

async function muatUlangLayar() {
    if (!selectedDisplayDay) {
        const content = document.getElementById('display-content');
        content.innerHTML = `<div class="flex flex-col items-center justify-center h-full text-gray-400"><i class="ph ph-info text-6xl mb-4"></i><p>Pilih hari kegiatan untuk menampilkan jadwal.</p></div>`;
        return;
    }

    ALL_DATA = await getSemuaPeserta();
    const content = document.getElementById('display-content');
    const headerTanggal = document.getElementById('tanggal-hari-ini'); // Ini adalah elemen <p> di header
    const lastUpdate = document.getElementById('last-update-text');
    
    // Gunakan selectedDisplayDay yang sudah diatur dari dropdown
    if (headerTanggal) headerTanggal.innerText = `Jadwal: ${selectedDisplayDay}`;

    // Catat waktu update terakhir di footer
    if (lastUpdate) lastUpdate.innerText = `Update Terakhir: ${new Date().toLocaleTimeString('id-ID', { hour12: false })}`;

    // [DIUBAH] Tentukan daftar psikolog yang akan dirender berdasarkan selectedDisplayDay
    const hariAktif = selectedDisplayDay;
    let psikologListKey;
    if (hariAktif === CONFIG.tanggal_kegiatan_1) {
        psikologListKey = 'psikolog_list_1';
    } else if (hariAktif === CONFIG.tanggal_kegiatan_2) {
        psikologListKey = 'psikolog_list_2';
    }
    const psikologListForDay = (psikologListKey && CONFIG[psikologListKey]) ? JSON.parse(CONFIG[psikologListKey]) : []; // Ensure it's an array

    let html = '';
    const sesiList = ["09.00-09.45", "09.50-10.35", "10.40-11.25", "11.30-12.15", "13.15-14.00", "14.05-14.50", "14.55-15.40"];

    // Start building the grid HTML
    // Grid columns: 1 auto column for session times, then N columns for N psikologs
    html += `<div class="grid grid-cols-[auto_repeat(${psikologListForDay.length},_minmax(0,_1fr))] gap-2 h-full w-full overflow-auto pb-4">`;

    // Header row for Psikologs
    html += `<div class="sticky top-0 left-0 bg-[#0B1A26] z-20 p-2"></div>`; // Empty top-left cell
    psikologListForDay.forEach(namaPsikolog => {
        html += `
            <div class="sticky top-0 bg-[#0B1A26] z-20 text-center p-2">
                <p class="font-bold text-sm text-brand-gold leading-tight">${namaPsikolog.split(',')[0]}</p>
                <p class="text-xs text-gray-400">${namaPsikolog.split(',')[1] || ''}</p>
            </div>
        `;
    });

    // Content rows for each session
    sesiList.forEach(sesi => {
        html += `
            <div class="sticky left-0 bg-[#0B1A26] z-20 text-right pr-2 py-2 flex items-center justify-end">
                <p class="font-bold text-sm text-gray-300">${sesi}</p>
            </div>
        `;
        psikologListForDay.forEach(namaPsikolog => {
            const peserta = ALL_DATA.find(p =>
                p.jadwal_hari === hariAktif &&
                p.jadwal_sesi === sesi &&
                p.psikolog_bertugas === namaPsikolog &&
                !['WAITING_LIST', 'BATAL'].includes(p.status_peserta)
            );

            let cardContent = '';
            let cardClass = 'bg-white/5 border border-white/10';

            if (peserta) {
                const status = peserta.status_peserta;
                let statusColor = 'text-gray-300';
                let statusBg = 'bg-gray-700';

                if (status === 'HADIR') {
                    statusColor = 'text-green-400';
                    statusBg = 'bg-green-700';
                    cardClass = 'bg-gradient-to-br from-brand-gold/20 to-transparent border-brand-gold/30 shadow-lg';
                } else if (status === 'CONFIRMED') {
                    statusColor = 'text-blue-400';
                    statusBg = 'bg-blue-700';
                    cardClass = 'bg-gradient-to-br from-brand-blue/20 to-transparent border-brand-blue/30 shadow-md';
                }

                cardContent = `
                    <p class="font-bold text-white text-sm leading-tight truncate">${sensorNama(peserta.nama_lengkap)}</p>
                    <span class="text-xs ${statusColor} ${statusBg} px-1 rounded-md mt-1 inline-block">${status.replace('_', ' ')}</span>
                `;
            } else {
                cardContent = `
                    <p class="text-xs text-gray-500">Kosong</p>
                `;
                cardClass = 'bg-white/5 border border-dashed border-white/10 opacity-50';
            }

            html += `
                <div class="p-2 rounded-lg text-center flex flex-col items-center justify-center h-20 ${cardClass} transition-all duration-300">
                    ${cardContent}
                </div>
            `;
        });
    });

    html += `</div>`; // Close grid
    if (content) content.innerHTML = html;
}

// Fungsi Sensor Nama demi Privasi Layar Publik (Budi Santoso -> Budi S***)
function sensorNama(namaLengkap) {
    if (!namaLengkap) return '';
    const parts = namaLengkap.split(' ');
    if (parts.length === 1) return parts[0];
    const first = parts[0];
    const second = parts[1];
    return `${first} ${second.charAt(0)}***`;
}

// Fungsi Jam Live
function jalankanJamLokal() {
    if(clockInterval) clearInterval(clockInterval);
    const renderClock = () => {
        const el = document.getElementById('live-clock');
        if(!el) return;
        const now = new Date();
        el.innerText = now.toLocaleTimeString('id-ID', { hour12: false });
    };
    clockInterval = setInterval(renderClock, 1000);
    renderClock();
}

// Pastikan untuk menghentikan interval saat halaman tidak lagi dirender
export function destroyDisplayPage() {
    if (clockInterval) {
        clearInterval(clockInterval);
        clockInterval = null;
    }
    if (realtimeSubscription) {
        supabase.removeChannel(realtimeSubscription);
        realtimeSubscription = null;
    }
}