// File: frontend/js/pages/admin/DashboardView.js

// Variabel global untuk menyimpan instance grafik agar tidak duplikat saat pindah tab
let chartDemografi = null;
let chartStatus = null;

export function renderDashboardView(container, ALL_DATA) {
    const total = ALL_DATA.length;
    const countHadirSelesai = ALL_DATA.filter(p => ['HADIR', 'SELESAI_FULL'].includes(p.status_peserta)).length;
    const countConfirmed = ALL_DATA.filter(p => p.status_peserta === 'CONFIRMED').length;
    const countWaiting = ALL_DATA.filter(p => p.status_peserta === 'WAITING_LIST').length;
    const countBatal = ALL_DATA.filter(p => p.status_peserta === 'BATAL').length;
    const countDapatSesi = ALL_DATA.filter(p => p.status_peserta === 'DAPAT_SESI').length;
    
    // Demografi Kampus
    const countITB = ALL_DATA.filter(p => (p.asal_univ || '').toLowerCase().includes('institut teknologi bandung')).length;
    const countNonITB = total - countITB;
    const pctITB = total === 0 ? 0 : Math.round((countITB / total) * 100);

    // [FIX BUG] Demografi Kebutuhan Sesi secara Spesifik
    const countCV = ALL_DATA.filter(p => p.harapan_sesi === 'CV Review').length;
    const countKarier = ALL_DATA.filter(p => p.harapan_sesi === 'Konsultasi Karier').length;
    const countKeduanya = ALL_DATA.filter(p => p.harapan_sesi === 'Keduanya').length;
    
    const pctCV = total === 0 ? 0 : Math.round((countCV / total) * 100);
    const pctKarier = total === 0 ? 0 : Math.round((countKarier / total) * 100);
    const pctKeduanya = total === 0 ? 0 : Math.round((countKeduanya / total) * 100);

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

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <div class="bg-white p-6 rounded-[20px] shadow-elegant border border-gray-100 flex flex-col h-full">
                    <h3 class="font-bold text-brand-navy mb-2 flex items-center gap-2"><i class="ph ph-student text-brand-pink text-xl"></i> Demografi Kampus</h3>
                    <div class="flex-grow relative w-full h-48 flex items-center justify-center">
                        ${total === 0 ? '<p class="text-gray-400 text-sm">Belum ada data</p>' : '<canvas id="chartDemografi"></canvas>'}
                    </div>
                </div>

                <div class="bg-white p-6 rounded-[20px] shadow-elegant border border-gray-100 flex flex-col h-full lg:col-span-2">
                    <h3 class="font-bold text-brand-navy mb-2 flex items-center gap-2"><i class="ph ph-chart-bar text-brand-pink text-xl"></i> Distribusi Status Peserta</h3>
                    <div class="flex-grow relative w-full h-48 flex items-center justify-center">
                        ${total === 0 ? '<p class="text-gray-400 text-sm">Belum ada data</p>' : '<canvas id="chartStatus"></canvas>'}
                    </div>
                </div>

            </div>

            <div class="bg-white p-6 rounded-[20px] shadow-elegant border border-gray-100">
                <h3 class="font-bold text-brand-navy mb-6 flex items-center gap-2"><i class="ph ph-target text-brand-pink text-xl"></i> Harapan Sesi Peserta (Kebutuhan)</h3>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <div class="flex justify-between text-sm mb-1 font-semibold text-gray-700"><span>CV Review</span><span>${pctCV}% (${countCV})</span></div>
                        <div class="w-full bg-gray-100 rounded-full h-3"><div class="bg-brand-pink h-3 rounded-full" style="width: ${pctCV}%"></div></div>
                    </div>
                    <div>
                        <div class="flex justify-between text-sm mb-1 font-semibold text-gray-700"><span>Konsultasi Karier</span><span>${pctKarier}% (${countKarier})</span></div>
                        <div class="w-full bg-gray-100 rounded-full h-3"><div class="bg-brand-blue h-3 rounded-full" style="width: ${pctKarier}%"></div></div>
                    </div>
                    <div>
                        <div class="flex justify-between text-sm mb-1 font-semibold text-gray-700"><span>Keduanya</span><span>${pctKeduanya}% (${countKeduanya})</span></div>
                        <div class="w-full bg-gray-100 rounded-full h-3"><div class="bg-brand-gold h-3 rounded-full" style="width: ${pctKeduanya}%"></div></div>
                    </div>
                </div>
            </div>

        </div>
    `;

    // Render Grafik setelah DOM siap
    if (total > 0) {
        setTimeout(() => {
            renderCharts(countITB, countNonITB, countDapatSesi, countWaiting, countConfirmed, countHadirSelesai, countBatal);
        }, 100);
    }
}

function renderCharts(countITB, countNonITB, countDapatSesi, countWaiting, countConfirmed, countHadirSelesai, countBatal) {
    // Hapus instance lama jika ada
    if (chartDemografi) chartDemografi.destroy();
    if (chartStatus) chartStatus.destroy();

    // 1. Chart Demografi (Doughnut)
    const ctxDemo = document.getElementById('chartDemografi');
    if (ctxDemo) {
        chartDemografi = new Chart(ctxDemo, {
            type: 'doughnut',
            data: {
                labels: ['Mahasiswa ITB', 'Kampus Lain'],
                datasets: [{
                    data: [countITB, countNonITB],
                    backgroundColor: ['#27548A', '#DDA853'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { usePointStyle: true, boxWidth: 8, font: { family: 'Inter', size: 11 } } }
                },
                cutout: '70%'
            }
        });
    }

    // 2. Chart Status (Bar)
    const ctxStatus = document.getElementById('chartStatus');
    if (ctxStatus) {
        chartStatus = new Chart(ctxStatus, {
            type: 'bar',
            data: {
                labels: ['Dapat Sesi', 'Waiting List', 'Confirmed', 'Hadir/Selesai', 'Batal'],
                datasets: [{
                    label: 'Jumlah Peserta',
                    data: [countDapatSesi, countWaiting, countConfirmed, countHadirSelesai, countBatal],
                    backgroundColor: [
                        '#93C5FD', // Blue light
                        '#FCA5A5', // Red light
                        '#FCD34D', // Gold light
                        '#183B4E', // Navy
                        '#D1D5DB'  // Gray
                    ],
                    borderRadius: 6,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1, font: { family: 'Inter' } }, grid: { borderDash: [4, 4] } },
                    x: { ticks: { font: { family: 'Inter', size: 11 } }, grid: { display: false } }
                }
            }
        });
    }
}