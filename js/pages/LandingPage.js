// File: frontend/js/pages/LandingPage.js
import { getSystemConfig, submitRegistration } from '../services/apiService.js';

export async function renderLandingPage(container) {
    // 1. Tampilkan Loading State Estetik
    container.innerHTML = `
        <div class="flex-grow flex items-center justify-center">
            <div class="flex flex-col items-center gap-3">
                <i class="ph ph-circle-notch animate-spin text-5xl text-brand-pink"></i>
                <p class="text-brand-navy font-medium animate-pulse tracking-wide">Menyiapkan form pendaftaran...</p>
            </div>
        </div>
    `;

    // 2. Ambil Pengaturan dari Database (Key-Value)
    const config = await getSystemConfig();

    // Jika gagal ambil config atau status bukan buka
    if (!config || config.status_pendaftaran !== 'buka') {
        container.innerHTML = `
            <div class="flex-grow flex items-center justify-center p-6">
                <div class="max-w-md w-full text-center bg-brand-surface p-10 rounded-3xl shadow-elegant border border-white/60">
                    <div class="bg-red-50 text-brand-pink w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i class="ph ph-lock-key text-4xl"></i>
                    </div>
                    <h2 class="text-2xl font-bold text-brand-navy mb-3">Pendaftaran Ditutup</h2>
                    <p class="text-brand-navy/70 leading-relaxed">Mohon maaf, pendaftaran sesi konseling karier saat ini sedang tidak dibuka.</p>
                </div>
            </div>
        `;
        return;
    }

    // Ekstrak data tanggal dari config untuk Dropdown (Bisa dinamis lebih dari 2 hari)
    let opsiTanggalHTML = '<option value="" disabled selected>Pilih Hari & Tanggal...</option>';
    Object.keys(config).forEach(key => {
        if (key.startsWith('tanggal_kegiatan_')) {
            opsiTanggalHTML += `<option value="${config[key]}">${config[key]}</option>`;
        }
    });

    // 3. Render Form UI (Super Premium Design)
    const reqAsterisk = `<span class="text-brand-pink font-bold ml-1">*</span>`;
    const inputClass = "w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-pink focus:ring-4 focus:ring-brand-pink/10 outline-none transition-all text-brand-text bg-gray-50/50 focus:bg-white text-sm hover:border-brand-blue/30";
    const labelClass = "block text-sm font-semibold text-brand-navy mb-2";

    container.innerHTML = `
        <div class="w-full max-w-3xl mx-auto py-12 px-4 sm:px-6 animate-fade-in-up">
            <div class="bg-brand-surface rounded-[24px] shadow-elegant border border-white/80 overflow-hidden relative">
                
                <div class="absolute top-0 right-0 w-64 h-64 bg-brand-gold rounded-full blur-[100px] opacity-10 pointer-events-none"></div>
                <div class="absolute bottom-0 left-0 w-64 h-64 bg-brand-pink rounded-full blur-[100px] opacity-10 pointer-events-none"></div>

                <div class="bg-brand-navy px-8 py-12 text-center relative overflow-hidden">
                    <div class="absolute inset-0 opacity-5 bg-[url('assets/images/pattern.svg')]"></div>
                    <!-- Ganti dengan path logo Anda -->
                    <img src="assets/images/logo-white.png" alt="Logo Acara" class="h-12 mx-auto mb-4 relative z-10">
                    <h1 class="text-3xl md:text-4xl font-bold text-white relative z-10 tracking-tight">Formulir Pendaftaran Konseling</h1>
                    <p class="text-brand-base/80 text-sm md:text-base max-w-lg mx-auto relative z-10 font-light mt-2">Dapatkan sesi khusus evaluasi CV dan konsultasi perjalanan karier Anda.</p>
                </div>

                <div class="p-8 sm:p-12 relative z-10">
                    <form id="form-pendaftaran" class="space-y-6" novalidate>
                        
                        <div class="space-y-6 pb-6 border-b border-gray-100">
                            <h3 class="text-lg font-bold text-brand-blue flex items-center gap-2"><i class="ph ph-user-circle"></i> Informasi Pribadi</h3>
                            
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div class="col-span-1 md:col-span-2">
                                    <label class="${labelClass}">Nama Lengkap ${reqAsterisk}</label>
                                    <input type="text" name="nama_lengkap" required placeholder="Sesuai kartu identitas" class="${inputClass}">
                                </div>

                                <div>
                                    <label class="${labelClass}">Alamat Email ${reqAsterisk}</label>
                                    <input type="email" name="email" required placeholder="contoh@email.com" class="${inputClass}">
                                </div>

                                <div>
                                    <label class="${labelClass}">Nomor WhatsApp ${reqAsterisk}</label>
                                    <input type="tel" name="nomor_wa" required placeholder="081234567890" class="${inputClass}">
                                </div>
                            </div>
                        </div>

                        <div class="space-y-6 pb-6 border-b border-gray-100">
                            <h3 class="text-lg font-bold text-brand-blue flex items-center gap-2"><i class="ph ph-graduation-cap"></i> Latar Belakang Pendidikan</h3>
                            
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label class="${labelClass}">Status Kemahasiswaan ${reqAsterisk}</label>
                                    <div class="relative">
                                        <select name="status_mhs" required class="${inputClass} appearance-none cursor-pointer">
                                            <option value="" disabled selected>Pilih Status...</option>
                                            <option value="Mahasiswa Aktif ITB">Mahasiswa Aktif ITB</option>
                                            <option value="Calon Wisudawan April ITB 2025">Calon Wisudawan April ITB 2025</option>
                                            <option value="Mahasiswa Aktif Non ITB">Mahasiswa Aktif Non ITB</option>
                                            <option value="Calon Wisudawan Non ITB 2025">Calon Wisudawan Non ITB 2025</option>
                                            <option value="Alumni ITB">Alumni ITB</option>
                                            <option value="Alumni Non ITB">Alumni Non ITB</option>
                                        </select>
                                        <i class="ph ph-caret-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                                    </div>
                                </div>

                                <div>
                                    <label class="${labelClass}">Asal Universitas ${reqAsterisk}</label>
                                    <div class="relative">
                                        <select id="asal_univ_select" name="asal_univ_select" required class="${inputClass} appearance-none cursor-pointer">
                                            <option value="" disabled selected>Pilih Universitas...</option>
                                            <option value="Institut Teknologi Bandung">Institut Teknologi Bandung</option>
                                            <option value="Yang lain">Yang lain...</option>
                                        </select>
                                        <i class="ph ph-caret-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                                    </div>
                                    <div id="asal_univ_lain_container" class="mt-3 hidden animate-fade-in-up">
                                        <input type="text" id="asal_univ_lain" name="asal_univ_lain" placeholder="Ketik nama universitas Anda..." class="${inputClass}">
                                    </div>
                                </div>

                                <div>
                                    <label class="${labelClass}">Program Studi / Jurusan ${reqAsterisk}</label>
                                    <input type="text" name="jurusan" required placeholder="Contoh: Teknik Informatika" class="${inputClass}">
                                </div>

                                <div>
                                    <label class="${labelClass}">Tahun Angkatan ${reqAsterisk}</label>
                                    <input type="number" name="angkatan" required placeholder="Contoh: 2021" min="2010" max="2026" class="${inputClass}">
                                </div>

                                <div class="col-span-1 md:col-span-2 bg-gradient-to-br from-[#FDF8EE] to-white p-6 rounded-2xl border border-brand-gold/30 shadow-sm">
                                    <label class="block text-sm font-semibold text-brand-navy mb-4">Apakah Anda sudah menjadi Member di ITB Career Center? ${reqAsterisk}</label>
                                    <div class="flex gap-8">
                                        <label class="flex items-center gap-3 cursor-pointer group">
                                            <input type="radio" name="is_member_itbcc" value="true" required class="w-5 h-5 text-brand-gold focus:ring-brand-gold border-gray-300">
                                            <span class="text-brand-text font-medium group-hover:text-brand-gold transition-colors">Ya, Sudah</span>
                                        </label>
                                        <label class="flex items-center gap-3 cursor-pointer group">
                                            <input type="radio" name="is_member_itbcc" value="false" class="w-5 h-5 text-brand-gold focus:ring-brand-gold border-gray-300">
                                            <span class="text-brand-text font-medium group-hover:text-brand-gold transition-colors">Belum</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="space-y-6">
                            <h3 class="text-lg font-bold text-brand-blue flex items-center gap-2"><i class="ph ph-calendar-check"></i> Pemilihan Sesi Konseling</h3>
                            
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label class="${labelClass}">Pilihan Jadwal (Hari, Tanggal) ${reqAsterisk}</label>
                                    <div class="relative">
                                        <select name="jadwal_hari" required class="${inputClass} appearance-none cursor-pointer">
                                            ${opsiTanggalHTML}
                                        </select>
                                        <i class="ph ph-calendar-blank absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                                    </div>
                                </div>

                                <div>
                                    <label class="${labelClass}">Pilihan Sesi (Pukul) ${reqAsterisk}</label>
                                    <div class="relative">
                                        <select name="jadwal_sesi" required class="${inputClass} appearance-none cursor-pointer">
                                            <option value="" disabled selected>Pilih Jam Sesi...</option>
                                            <option value="09.00-09.45">09.00 - 09.45</option>
                                            <option value="09.50-10.35">09.50 - 10.35</option>
                                            <option value="10.40-11.25">10.40 - 11.25</option>
                                            <option value="11.30-12.15">11.30 - 12.15</option>
                                            <option value="13.15-14.00">13.15 - 14.00</option>
                                            <option value="14.05-14.50">14.05 - 14.50</option>
                                            <option value="14.55-15.40">14.55 - 15.40</option>
                                        </select>
                                        <i class="ph ph-clock absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                                    </div>
                                </div>

                                <div class="col-span-1 md:col-span-2">
                                    <label class="${labelClass}">Harapan untuk Sesi Ini ${reqAsterisk}</label>
                                    <div class="relative">
                                        <select name="harapan_sesi" required class="${inputClass} appearance-none cursor-pointer">
                                            <option value="" disabled selected>Pilih Harapan...</option>
                                            <option value="Konsultasi Karier">Konsultasi Karier</option>
                                            <option value="CV Review">CV Review</option>
                                            <option value="Keduanya">Keduanya</option>
                                        </select>
                                        <i class="ph ph-target absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="pt-8 mt-4">
                            <button type="submit" id="btn-submit" 
                                class="w-full bg-brand-pink hover:bg-brand-pinkdark text-white font-bold py-4 px-8 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-[0_8px_24px_rgba(255,90,141,0.3)] hover:shadow-[0_12px_32px_rgba(255,90,141,0.4)] hover:-translate-y-1 tracking-wide text-lg">
                                <span>Kirim Formulir Pendaftaran</span>
                                <i class="ph ph-paper-plane-right text-2xl"></i>
                            </button>
                            <p class="text-center text-xs text-gray-400 mt-4"><i class="ph ph-lock-key"></i> Data Anda tersimpan aman dengan enkripsi cloud.</p>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Toast Notification Container -->
        <div id="toast-container" class="fixed top-5 right-5 z-[100] space-y-2">
        </div>
    `;

    // 4. Attach Event Listeners
    setupFormInteractions();
}

/**
 * Logika Interaksi UI Form (Menampilkan text box 'Yang lain' & Handle Submit)
 */
function setupFormInteractions() {
    const form = document.getElementById('form-pendaftaran');
    const univSelect = document.getElementById('asal_univ_select');
    const univLainContainer = document.getElementById('asal_univ_lain_container');
    const univLainInput = document.getElementById('asal_univ_lain');

    // Toggle logic untuk "Asal Universitas"
    univSelect.addEventListener('change', (e) => {
        if (e.target.value === 'Yang lain') {
            univLainContainer.classList.remove('hidden');
            univLainInput.setAttribute('required', 'true');
            univLainInput.focus();
        } else {
            univLainContainer.classList.add('hidden');
            univLainInput.removeAttribute('required');
            univLainInput.value = '';
        }
    });

    // Handle Submit
    form.addEventListener('submit', handleFormSubmit);
}

/**
 * Logika Penanganan Data (Kirim ke Backend)
 */
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const btnSubmit = document.getElementById('btn-submit');
    const originalBtnContent = btnSubmit.innerHTML;
    
    // Animasi Loading di Tombol
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `<i class="ph ph-spinner animate-spin text-2xl"></i><span>Memproses Jadwal...</span>`;
    btnSubmit.classList.replace('bg-brand-pink', 'bg-gray-400');
    btnSubmit.classList.remove('hover:-translate-y-1', 'hover:bg-brand-pinkdark', 'shadow-[0_8px_24px_rgba(255,90,141,0.3)]');

    const formData = new FormData(form);
    
    // Handle logika Asal Universitas
    let asalUnivFinal = formData.get('asal_univ_select');
    if (asalUnivFinal === 'Yang lain') {
        asalUnivFinal = formData.get('asal_univ_lain');
    }

    const dataObject = {
        nama_lengkap: formData.get('nama_lengkap'),
        email: formData.get('email'),
        nomor_wa: formData.get('nomor_wa'),
        status_mhs: formData.get('status_mhs'),
        asal_univ: asalUnivFinal,
        is_member_itbcc: formData.get('is_member_itbcc') === 'true',
        jurusan: formData.get('jurusan'),
        angkatan: formData.get('angkatan'),
        harapan_sesi: formData.get('harapan_sesi'),
        jadwal_hari: formData.get('jadwal_hari'),
        jadwal_sesi: formData.get('jadwal_sesi')
    };

    // Tembak ke API
    const result = await submitRegistration(dataObject);

    if (result.success) {
        // Render Tampilan Sukses yang Elegan
        const container = document.getElementById('app');
        
        let statusMessage = result.status === 'DAPAT_SESI' 
            ? `<div class="bg-gradient-to-r from-[#FDF8EE] to-white text-brand-navy p-6 rounded-2xl mb-8 border border-brand-gold/40 shadow-sm relative overflow-hidden">
                 <div class="absolute right-0 top-0 w-20 h-20 bg-brand-gold/10 rounded-bl-full pointer-events-none"></div>
                 <p class="font-bold flex items-center justify-center gap-2 text-brand-gold text-lg mb-2"><i class="ph ph-check-circle text-3xl"></i> Selamat! Slot Tersedia.</p>
                 <p class="text-sm leading-relaxed text-center">Anda berhasil mengamankan slot pada:<br><strong class="text-brand-pink text-base block mt-2">${result.hari} | Pukul ${result.sesi}</strong></p>
                 <p class="text-xs text-center mt-4 text-gray-500">*Panitia akan segera mengirimkan konfirmasi via WhatsApp.</p>
               </div>`
            : `<div class="bg-gradient-to-r from-gray-50 to-white text-brand-navy p-6 rounded-2xl mb-8 border border-gray-200 shadow-sm">
                 <p class="font-bold flex items-center justify-center gap-2 text-brand-navy text-lg mb-2"><i class="ph ph-hourglass-high text-3xl"></i> Kuota Sesi Penuh (Waiting List)</p>
                 <p class="text-sm leading-relaxed text-center">Mohon maaf, kuota untuk jadwal <strong>${result.hari} pukul ${result.sesi}</strong> saat ini sudah mencapai batas maksimal.</p>
                 <div class="mt-4 p-3 bg-brand-navy/5 rounded-xl text-xs text-brand-navy/80 text-center">
                    Namun jangan khawatir, jika ada peserta yang batal atau slot kosong di sesi lain, Anda berada di antrean prioritas kami.
                 </div>
               </div>`;

        container.innerHTML = `
            <div class="flex-grow flex items-center justify-center p-6 animate-fade-in-up w-full">
                <div class="max-w-lg w-full text-center bg-brand-surface p-10 sm:p-12 rounded-[24px] shadow-elegant border border-white/60">
                    <div class="bg-brand-base text-brand-pink w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
                        <i class="ph ph-confetti text-5xl"></i>
                    </div>
                    <h2 class="text-3xl font-bold text-brand-navy mb-3">Formulir Terkirim!</h2>
                    <p class="text-brand-navy/60 mb-8 text-sm max-w-sm mx-auto">Terima kasih, ${dataObject.nama_lengkap}. Data diri Anda telah tercatat dengan aman di database kami.</p>
                    ${statusMessage}
                    <button onclick="window.location.reload()" class="inline-flex items-center gap-2 mt-2 text-brand-blue font-semibold hover:text-brand-pink transition-colors">
                        <i class="ph ph-arrow-left"></i> Kembali ke Halaman Utama
                    </button>
                </div>
            </div>
        `;
    } else {
        showToast("Terjadi kesalahan sistem: " + result.message, 'error');
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = originalBtnContent;
        btnSubmit.classList.replace('bg-gray-400', 'bg-brand-pink');
        btnSubmit.classList.add('hover:-translate-y-1', 'hover:bg-brand-pinkdark', 'shadow-[0_8px_24px_rgba(255,90,141,0.3)]');
    }
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const icon = type === 'success' ? 'ph-check-circle' : 'ph-x-circle';
    const colors = type === 'success' 
        ? 'bg-green-500 border-green-600' 
        : 'bg-red-500 border-red-600';

    toast.className = `flex items-center gap-3 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg border ${colors} animate-fade-in-up`;
    toast.innerHTML = `
        <i class="ph ${icon} text-xl"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('animate-fade-out-down');
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}