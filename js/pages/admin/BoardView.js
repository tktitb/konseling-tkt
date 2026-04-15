// File: frontend/js/pages/admin/BoardView.js

export function renderBoardView(container, ALL_DATA, CONFIG, buatLinkWA) {
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
                // Mengambil SEMUA peserta di slot ini (Bisa > 1 jika dipaksa Admin)
                let penghuniList = ALL_DATA.filter(p => p.jadwal_hari === day && p.psikolog_bertugas === namaPsikolog && p.jadwal_sesi === sesi && !['WAITING_LIST', 'BATAL'].includes(p.status_peserta));

                if (penghuniList.length > 0) {
                    html += `<div class="flex flex-col gap-2 h-full">`; // Wrapper untuk tumpukan kartu
                    
                    for (const penghuni of penghuniList) {
                        let badgeColor = penghuni.status_peserta === 'CONFIRMED' ? 'text-green-700 bg-green-100 border-green-200' : 
                                         ['HADIR', 'SELESAI_FULL'].includes(penghuni.status_peserta) ? 'text-brand-base bg-brand-navy border-brand-navy' : 
                                         'text-brand-blue bg-blue-50 border-blue-200';
                        
                        const waLink = buatLinkWA('wa_template_konfirmasi_sesi', penghuni);
                        let feedbackButtonHTML = '';
                        if (penghuni.status_peserta === 'HADIR') {
                            const feedbackWaLink = buatLinkWA('wa_template_minta_feedback', penghuni);
                            feedbackButtonHTML = `
                                <a href="${feedbackWaLink}" target="_blank" class="w-7 h-7 flex items-center justify-center bg-brand-blue hover:bg-brand-navy text-white rounded-lg font-bold shadow-sm transition-transform hover:scale-105" title="Minta Feedback">
                                    <i class="ph ph-chat-centered-text text-sm"></i>
                                </a>
                            `;
                        }

                        html += `
                            <div class="bg-white p-3 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between hover:border-brand-pink transition-colors group relative">
                                <div>
                                    <div class="flex justify-between items-start mb-2">
                                        <span class="inline-block px-1.5 py-0.5 text-[9px] font-bold rounded border ${badgeColor}">${penghuni.status_peserta.replace('_', ' ')}</span>
                                        <div class="flex items-center gap-1">
                                            <a href="${waLink}" target="_blank" class="w-7 h-7 flex items-center justify-center bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold shadow-sm transition-transform hover:scale-105" title="Chat WA">
                                                <i class="ph ph-whatsapp-logo text-sm"></i> 
                                            </a>
                                            ${feedbackButtonHTML}
                                        </div>
                                    </div>
                                    <p class="text-[10px] font-bold text-gray-400 mb-0.5"><i class="ph ph-clock"></i> ${sesi}</p>
                                    <p class="font-bold text-brand-navy text-xs leading-tight mb-1 truncate cursor-pointer hover:text-brand-pink" onclick="window.bukaDetail('${penghuni.id}')">${penghuni.nama_lengkap}</p>
                                </div>
                            </div>
                        `;
                    }
                    html += `</div>`;
                } else {
                    html += `
                        <div class="bg-white/50 p-3.5 rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-center opacity-60 h-full">
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