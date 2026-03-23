// File: frontend/js/pages/DisplayPage.js
import { getSemuaPeserta, getSystemConfig } from '../services/apiService.js';

let ALL_DATA = [];
let CONFIG = {};
let clockInterval;
let syncInterval; // Variabel untuk menyimpan interval Auto-Sync

export async function renderDisplayPage(container) {
    container.innerHTML = `
        <div class="flex flex-col h-screen w-full bg-[#0B1A26] text-white overflow-hidden font-sans relative z-0">
            <div class="absolute top-0 left-0 w-[500px] h-[500px] bg-brand-navy rounded-full blur-[120px] opacity-60 -z-10 -translate-x-1/2 -translate-y-1/2"></div>
            <div class="absolute bottom-0 right-0 w-[600px] h-[600px] bg-brand-pink/20 rounded-full blur-[150px] opacity-40 -z-10 translate-x-1/3 translate-y-1/3"></div>

            <header class="flex justify-between items-end px-10 py-6 border-b border-white/10 shrink-0 bg-[#0B1A26]/80 backdrop-blur-md z-10">
                <div class="flex items-center gap-6">
                    <!-- Ganti dengan path logo Anda -->
                    <img src="assets/images/logo-white.png" alt="Logo" class="h-12">
                    <div>
                        <h1 class="text-4xl font-black tracking-wide text-white">Status <span class="text-brand-gold">Konseling</span></h1>
                        <p class="text-brand-pink font-semibold tracking-widest uppercase text-sm" id="tanggal-hari-ini">Memuat Jadwal...</p>
                    </div>
                </div>
                <div class="text-right flex flex-col items-end">
                    <div class="text-5xl font-black text-white tracking-tighter tabular-nums drop-shadow-lg flex items-center gap-2" id="live-clock">
                        00:00:00
                    </div>
                    <p class="text-gray-400 font-medium tracking-widest text-sm mt-1 uppercase flex items-center gap-2" title="Data diperbarui otomatis setiap 5 menit">
                        <i class="ph ph-arrows-clockwise text-brand-blue" id="sync-icon"></i> Auto-Sync (5 Menit)
                    </p>
                </div>
            </header>

            <main class="flex-1 p-8 grid grid-cols-5 gap-6 overflow-hidden z-10" id="display-grid">
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

    // 2. Ambil Data Awal (Pertama kali buka)
    CONFIG = await getSystemConfig();
    await muatUlangLayar();

    // 3. LOGIKA SILENT POLLING (Auto-Sync Setiap 5 Menit)
    // 5 menit = 5 * 60 * 1000 = 300000 milidetik
    if (syncInterval) clearInterval(syncInterval);
    syncInterval = setInterval(async () => {
        // Putar ikon sync sebentar agar panitia tahu sistem sedang menarik data
        const syncIcon = document.getElementById('sync-icon');
        if (syncIcon) syncIcon.classList.add('animate-spin');
        
        await muatUlangLayar(); // Ambil data baru secara senyap
        
        if (syncIcon) syncIcon.classList.remove('animate-spin');
    }, 300000); // <-- Bos bisa ganti angka ini misal jadi 60000 kalau mau 1 menit sekali
}

async function muatUlangLayar() {
    ALL_DATA = await getSemuaPeserta();
    const grid = document.getElementById('display-grid');
    const headerTanggal = document.getElementById('tanggal-hari-ini');
    const lastUpdate = document.getElementById('last-update-text');
    
    // Asumsi kita tampilkan data untuk hari paling awal yang ada pendaftarnya
    const hariAktif = [...new Set(ALL_DATA.map(p => p.jadwal_hari))].filter(Boolean)[0] || "Belum ada jadwal hari ini";
    if (headerTanggal) headerTanggal.innerText = `Jadwal: ${hariAktif}`;
    
    // Catat waktu update terakhir di footer
    const now = new Date();
    if (lastUpdate) lastUpdate.innerText = `Update Terakhir: ${now.toLocaleTimeString('id-ID', { hour12: false })}`;

    let html = '';
    
    // Render 5 Kolom Psikolog
    for (let i = 1; i <= 5; i++) {
        let keyPsikolog = `psikolog_${i}`;
        let namaPsikolog = CONFIG[keyPsikolog] || `Psikolog ${i}`;
        
        // Cari peserta yang sedang "HADIR" atau "CONFIRMED"
        let pesertaPsikologIni = ALL_DATA.filter(p => 
            p.psikolog_bertugas === keyPsikolog && 
            p.jadwal_hari === hariAktif &&
            ['CONFIRMED', 'HADIR', 'SELESAI_FULL'].includes(p.status_peserta)
        ).sort((a, b) => a.jadwal_sesi.localeCompare(b.jadwal_sesi));

        // Pisahkan yang sedang di dalam (HADIR) dan yang antre (CONFIRMED)
        let sedangBerlangsung = pesertaPsikologIni.find(p => p.status_peserta === 'HADIR');
        let daftarAntrean = pesertaPsikologIni.filter(p => p.status_peserta === 'CONFIRMED').slice(0, 3); // Tampilkan maks 3 antrean berikutnya

        html += `
            <div class="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col h-full relative overflow-hidden backdrop-blur-sm shadow-xl">
                
                <div class="mb-6 text-center border-b border-white/10 pb-4">
                    <div class="w-16 h-16 mx-auto bg-brand-navy border-2 border-brand-gold/50 rounded-full flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(221,168,83,0.2)]">
                        <i class="ph ph-user-focus text-2xl text-brand-gold"></i>
                    </div>
                    <h2 class="text-xl font-bold text-white leading-tight">${namaPsikolog}</h2>
                    <p class="text-xs text-gray-400 mt-1 uppercase tracking-widest">Bilik ${i}</p>
                </div>

                <div class="flex-1">
                    <h3 class="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-3"><i class="ph ph-record text-red-500 animate-pulse"></i> Sedang Konseling</h3>
                    ${sedangBerlangsung ? `
                        <div class="bg-gradient-to-br from-brand-gold/20 to-transparent border border-brand-gold/30 rounded-2xl p-4 shadow-lg animate-fade-in-up">
                            <p class="text-2xl font-black text-brand-gold truncate" title="${sedangBerlangsung.nama_lengkap}">${sensorNama(sedangBerlangsung.nama_lengkap)}</p>
                            <div class="flex justify-between items-center mt-2">
                                <p class="text-sm font-bold text-white bg-white/10 px-2 py-1 rounded inline-block"><i class="ph ph-clock text-brand-gold"></i> ${sedangBerlangsung.jadwal_sesi}</p>
                                <span class="text-xs font-bold text-green-400 uppercase tracking-wider bg-green-400/10 px-2 py-1 rounded border border-green-400/30">Di Dalam</span>
                            </div>
                        </div>
                    ` : `
                        <div class="bg-white/5 border border-dashed border-white/20 rounded-2xl p-4 flex flex-col items-center justify-center h-28 opacity-50">
                            <i class="ph ph-coffee text-3xl text-gray-400 mb-2"></i>
                            <p class="text-sm font-medium text-gray-400">Bilik Kosong</p>
                        </div>
                    `}
                </div>

                <div class="mt-6 pt-5 border-t border-white/10">
                    <h3 class="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-3"><i class="ph ph-list-numbers text-brand-blue"></i> Antrean Selanjutnya</h3>
                    <div class="space-y-2">
                        ${daftarAntrean.length > 0 ? daftarAntrean.map((p, index) => `
                            <div class="bg-black/20 rounded-xl p-3 border border-white/5 flex justify-between items-center animate-fade-in-up" style="animation-delay: ${index * 100}ms">
                                <div>
                                    <p class="font-bold text-white text-sm truncate w-32" title="${p.nama_lengkap}">${sensorNama(p.nama_lengkap)}</p>
                                    <p class="text-[10px] text-gray-400 mt-0.5">${p.asal_univ.substring(0, 15)}...</p>
                                </div>
                                <span class="text-xs font-bold text-brand-pink bg-brand-pink/10 px-2 py-1 rounded border border-brand-pink/20">${p.jadwal_sesi}</span>
                            </div>
                        `).join('') : `
                            <p class="text-xs text-gray-500 text-center py-2 italic">Belum ada antrean</p>
                        `}
                    </div>
                </div>
            </div>
        `;
    }
    
    if (grid) grid.innerHTML = html;
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