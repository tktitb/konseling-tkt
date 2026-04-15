// File: frontend/js/pages/admin/TableView.js

// State Internal Tabel
let currentPage = 1;
const itemsPerPage = 10;
let searchQuery = '';
let filterStatus = 'ALL';
let sortCol = 'created_at';
let sortDir = 'asc';
let currentRenderId = 0; 
let searchTimeout = null;

export function renderTableView(container, ALL_DATA, CONFIG, buatLinkWA) {
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
                            <th class="px-6 py-4 font-bold cursor-pointer hover:text-brand-pink transition-colors group" onclick="window.sortDataTabel('nama_lengkap')">
                                Nama Peserta <i id="sort-icon-nama_lengkap" class="ph ph-caret-up-down text-gray-400 group-hover:text-brand-pink ml-1 inline-block"></i>
                            </th>
                            <th class="px-6 py-4 font-bold cursor-pointer hover:text-brand-pink transition-colors group" onclick="window.sortDataTabel('jadwal_hari')">
                                Jadwal & Psikolog <i id="sort-icon-jadwal_hari" class="ph ph-caret-up-down text-gray-400 group-hover:text-brand-pink ml-1 inline-block"></i>
                            </th>
                            <th class="px-6 py-4 font-bold cursor-pointer hover:text-brand-pink transition-colors group text-center" onclick="window.sortDataTabel('status_peserta')">
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

    // Pasang fungsi global untuk tombol sort dan pagination (karena dipanggil dari HTML string)
    window.sortDataTabel = (column) => {
        if (sortCol === column) {
            sortDir = sortDir === 'asc' ? 'desc' : 'asc';
        } else {
            sortCol = column;
            sortDir = 'asc';
        }
        updateTableRows(ALL_DATA, buatLinkWA);
    };

    window.ubahPageTabel = (dir) => { 
        currentPage += dir; 
        updateTableRows(ALL_DATA, buatLinkWA); 
    };

    // Event Listener Input & Filter
    document.getElementById('search-input').addEventListener('input', (e) => { 
        searchQuery = e.target.value; 
        currentPage = 1; 
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => { updateTableRows(ALL_DATA, buatLinkWA); }, 300); 
    });

    document.getElementById('filter-status').addEventListener('change', (e) => { 
        filterStatus = e.target.value; 
        currentPage = 1; 
        updateTableRows(ALL_DATA, buatLinkWA); 
    });

    updateTableRows(ALL_DATA, buatLinkWA);
}

function updateTableRows(ALL_DATA, buatLinkWA) {
    const tbody = document.getElementById('table-body');
    const pagination = document.getElementById('pagination-controls');
    if (!tbody || !pagination) return;

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
            <button onclick="window.ubahPageTabel(-1)" class="px-5 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-brand-navy hover:bg-gray-50 transition-colors shadow-sm ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}" ${currentPage === 1 ? 'disabled' : ''}>Prev</button>
            <button onclick="window.ubahPageTabel(1)" class="px-5 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-brand-navy hover:bg-gray-50 transition-colors shadow-sm ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}" ${currentPage === totalPages ? 'disabled' : ''}>Next</button>
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

            window.showConfirmationModal(id, namaPeserta, statusBaru, hari, sesi, originalStatus, e.target);
        });
    });
}