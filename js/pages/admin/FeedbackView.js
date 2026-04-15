// File: frontend/js/pages/admin/FeedbackView.js

let chartSumber = null;
let chartDurasi = null;
let chartRencana = null;

export function renderFeedbackView(container, FEEDBACK_DATA) {
    if (!FEEDBACK_DATA || FEEDBACK_DATA.length === 0) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-gray-400">
                <i class="ph ph-star-half text-6xl mb-4"></i>
                <p>Belum ada data feedback yang masuk dari peserta.</p>
            </div>`;
        return;
    }

    const total = FEEDBACK_DATA.length;

    // Kalkulasi Rata-rata Rating
    const avgKepuasan = (FEEDBACK_DATA.reduce((acc, curr) => acc + curr.rating_kepuasan, 0) / total).toFixed(1);
    const avgMateri = (FEEDBACK_DATA.reduce((acc, curr) => acc + curr.rating_materi, 0) / total).toFixed(1);
    const avgPemahaman = (FEEDBACK_DATA.reduce((acc, curr) => acc + curr.rating_pemahaman_karir, 0) / total).toFixed(1);
    const avgFasilitator = (FEEDBACK_DATA.reduce((acc, curr) => acc + curr.rating_fasilitator, 0) / total).toFixed(1);

    // Agregasi Data untuk Grafik
    const sumberCount = {};
    const durasiCount = { 'Terlalu Pendek': 0, 'Cukup': 0, 'Terlalu Lama': 0 };
    const rencanaCount = { 'Ya': 0, 'Mungkin': 0, 'Tidak': 0 };

    FEEDBACK_DATA.forEach(fb => {
        // Sumber Info
        const sumber = fb.info_sumber === 'Yang lain' ? 'Lainnya' : fb.info_sumber;
        sumberCount[sumber] = (sumberCount[sumber] || 0) + 1;
        // Durasi & Rencana
        if (durasiCount[fb.durasi_sesi] !== undefined) durasiCount[fb.durasi_sesi]++;
        if (rencanaCount[fb.rencana_ikut_lagi] !== undefined) rencanaCount[fb.rencana_ikut_lagi]++;
    });

    container.innerHTML = `
        <div class="space-y-6 animate-fade-in-up">
            
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div class="bg-gradient-to-br from-brand-navy to-brand-blue p-5 rounded-2xl shadow-elegant text-white flex flex-col items-center justify-center text-center">
                    <p class="text-white/70 text-xs font-semibold uppercase tracking-widest mb-2">Kepuasan Umum</p>
                    <div class="flex items-center gap-2"><i class="ph-fill ph-star text-brand-gold text-3xl"></i><span class="text-4xl font-black">${avgKepuasan}</span><span class="text-sm mt-2">/5</span></div>
                </div>
                <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                    <p class="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-2">Materi Sesi</p>
                    <div class="flex items-center gap-2"><i class="ph-fill ph-book-open text-brand-pink text-3xl"></i><span class="text-4xl font-black text-brand-navy">${avgMateri}</span></div>
                </div>
                <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                    <p class="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-2">Pemahaman Karier</p>
                    <div class="flex items-center gap-2"><i class="ph-fill ph-lightbulb text-brand-gold text-3xl"></i><span class="text-4xl font-black text-brand-navy">${avgPemahaman}</span></div>
                </div>
                <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                    <p class="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-2">Kualitas Psikolog</p>
                    <div class="flex items-center gap-2"><i class="ph-fill ph-user-focus text-brand-blue text-3xl"></i><span class="text-4xl font-black text-brand-navy">${avgFasilitator}</span></div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="bg-white p-6 rounded-[20px] shadow-elegant border border-gray-100">
                    <h3 class="font-bold text-brand-navy mb-4 text-sm"><i class="ph ph-megaphone text-brand-pink"></i> Sumber Informasi</h3>
                    <div class="relative w-full h-48"><canvas id="chartSumber"></canvas></div>
                </div>
                <div class="bg-white p-6 rounded-[20px] shadow-elegant border border-gray-100">
                    <h3 class="font-bold text-brand-navy mb-4 text-sm"><i class="ph ph-hourglass-medium text-brand-pink"></i> Opini Durasi Sesi</h3>
                    <div class="relative w-full h-48"><canvas id="chartDurasi"></canvas></div>
                </div>
                <div class="bg-white p-6 rounded-[20px] shadow-elegant border border-gray-100">
                    <h3 class="font-bold text-brand-navy mb-4 text-sm"><i class="ph ph-calendar-plus text-brand-pink"></i> Rencana Ikut Lagi</h3>
                    <div class="relative w-full h-48"><canvas id="chartRencana"></canvas></div>
                </div>
            </div>

            <div class="bg-white rounded-[24px] shadow-elegant border border-gray-100 overflow-hidden mt-6">
                <div class="p-5 border-b border-gray-100 bg-gray-50/50">
                    <h3 class="font-bold text-brand-navy text-lg"><i class="ph ph-chats text-brand-pink"></i> Testimoni, Aspek Lain & Saran</h3>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-brand-navy text-white text-xs uppercase tracking-wider">
                                <th class="px-6 py-4 font-bold w-1/4">Peserta & Sesi</th>
                                <th class="px-6 py-4 font-bold w-1/3">Aspek Lain yg Ingin Dibahas</th>
                                <th class="px-6 py-4 font-bold w-1/3">Saran & Feedback</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100 text-sm">
                            ${FEEDBACK_DATA.map(fb => `
                                <tr class="hover:bg-brand-base/40 transition-colors">
                                    <td class="px-6 py-4 align-top">
                                        <p class="font-bold text-brand-navy">${fb.nama_pengisi}</p>
                                        <p class="text-[10px] text-brand-pink mt-1 bg-brand-pink/10 inline-block px-1.5 py-0.5 rounded">${fb.peserta_konseling?.jadwal_hari || '-'} | ${fb.peserta_konseling?.jadwal_sesi || '-'}</p>
                                        <p class="text-xs text-gray-500 mt-1">${fb.peserta_konseling?.psikolog_bertugas || '-'}</p>
                                    </td>
                                    <td class="px-6 py-4 align-top text-gray-600 italic whitespace-normal min-w-[250px]">"${fb.aspek_lain || 'Tidak ada tanggapan'}"</td>
                                    <td class="px-6 py-4 align-top text-gray-600 italic whitespace-normal min-w-[250px]">"${fb.saran_feedback || 'Tidak ada tanggapan'}"</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    `;

    setTimeout(() => {
        renderFeedbackCharts(sumberCount, durasiCount, rencanaCount);
    }, 100);
}

function renderFeedbackCharts(sumberCount, durasiCount, rencanaCount) {
    if (chartSumber) chartSumber.destroy();
    if (chartDurasi) chartDurasi.destroy();
    if (chartRencana) chartRencana.destroy();

    const ctxSumber = document.getElementById('chartSumber');
    if (ctxSumber) {
        chartSumber = new Chart(ctxSumber, {
            type: 'doughnut',
            data: {
                labels: Object.keys(sumberCount),
                datasets: [{ data: Object.values(sumberCount), backgroundColor: ['#FF5A8D', '#27548A', '#DDA853', '#183B4E', '#9CA3AF'], borderWidth: 0 }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } }, cutout: '60%' }
        });
    }

    const ctxDurasi = document.getElementById('chartDurasi');
    if (ctxDurasi) {
        chartDurasi = new Chart(ctxDurasi, {
            type: 'bar',
            data: {
                labels: Object.keys(durasiCount),
                datasets: [{ label: 'Peserta', data: Object.values(durasiCount), backgroundColor: ['#FCA5A5', '#34D399', '#93C5FD'], borderRadius: 4 }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } }, x: { grid: { display: false } } } }
        });
    }

    const ctxRencana = document.getElementById('chartRencana');
    if (ctxRencana) {
        chartRencana = new Chart(ctxRencana, {
            type: 'pie',
            data: {
                labels: Object.keys(rencanaCount),
                datasets: [{ data: Object.values(rencanaCount), backgroundColor: ['#34D399', '#D1D5DB', '#FCA5A5'], borderWidth: 0 }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } } } }
        });
    }
}