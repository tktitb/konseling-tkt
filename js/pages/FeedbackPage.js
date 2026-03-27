// File: frontend/js/pages/FeedbackPage.js
import { submitFeedback } from '../services/apiService.js';
import { validateForm } from '../utils/validation.js';

export async function renderFeedbackPage(container) {
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
                    <img src="assets/images/logo-white.png" alt="Logo Acara" class="h-12 mx-auto mb-4 relative z-10">
                    <h1 class="text-3xl md:text-4xl font-bold text-white relative z-10 tracking-tight">Feedback Konseling Karier</h1>
                    <p class="text-brand-base/80 text-sm md:text-base max-w-2xl mx-auto relative z-10 font-light mt-4">
                        Terima kasih atas partisipasi Anda. Masukan Anda sangat berharga untuk membantu kami meningkatkan kualitas acara di masa mendatang.
                    </p>
                </div>

                <div class="p-8 sm:p-12 relative z-10">
                    <form id="form-feedback" class="space-y-8" novalidate>
                        
                        <!-- Validation Section -->
                        <div class="space-y-6 p-6 bg-brand-base/50 rounded-2xl border border-gray-200">
                            <h3 class="text-lg font-bold text-brand-blue flex items-center gap-2"><i class="ph ph-user-circle-check"></i> Validasi Data Peserta</h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label class="${labelClass}">Nama Lengkap ${reqAsterisk}</label>
                                    <input type="text" name="nama_pengisi" required placeholder="Nama yang Anda daftarkan" class="${inputClass}">
                                </div>
                                <div>
                                    <label class="${labelClass}">Alamat Email ${reqAsterisk}</label>
                                    <input type="email" name="email_pengisi" required placeholder="Email yang Anda daftarkan" class="${inputClass}">
                                </div>
                                <div class="col-span-1 md:col-span-2">
                                    <label class="${labelClass}">Nomor WhatsApp ${reqAsterisk}</label>
                                    <input type="tel" name="nomor_wa_pengisi" required placeholder="Nomor WA yang Anda daftarkan" class="${inputClass}">
                                    <div class="error-message text-red-500 text-xs mt-1"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Rating Questions -->
                        <div class="space-y-6">
                            ${createRatingQuestion('rating_kepuasan', 'Seberapa puas Anda dengan sesi Konseling Karier yang Anda ikuti?', 'Sangat Tidak Puas', 'Sangat Puas')}
                            ${createRatingQuestion('rating_materi', 'Bagaimana pendapat Anda mengenai materi yang disampaikan?', 'Sangat Kurang', 'Sangat Baik')}
                            ${createRatingQuestion('rating_pemahaman_karir', 'Apakah sesi ini membantu Anda memahami lebih lanjut mengenai karier?', 'Sangat Tidak Membantu', 'Sangat Membantu')}
                            ${createRatingQuestion('rating_fasilitator', 'Bagaimana kualitas fasilitator/konselor yang memandu sesi?', 'Sangat Kurang', 'Sangat Baik')}
                            ${createRatingQuestion('rating_motivasi', 'Apakah Anda merasa termotivasi setelah mengikuti sesi ini?', 'Sangat Tidak Terdorong', 'Sangat Terdorong')}
                        </div>

                        <!-- Other Questions -->
                        <div class="space-y-6">
                            <div>
                                <label class="${labelClass}">Bagaimana Anda mengetahui informasi mengenai TKT ITB April 2025? ${reqAsterisk}</label>
                                <select name="info_sumber" required class="${inputClass} appearance-none cursor-pointer">
                                    <option value="" disabled selected>Pilih sumber informasi...</option>
                                    <option value="Media Sosial ITB Career Center">Media Sosial ITB Career Center</option>
                                    <option value="Website ITB Career Center">Website ITB Career Center</option>
                                    <option value="Rekomendasi Teman">Rekomendasi Teman</option>
                                    <option value="Email Pemberitahuan">Email Pemberitahuan</option>
                                    <option value="Yang lain">Yang lain...</option>
                                </select>
                                <div class="error-message text-red-500 text-xs mt-1"></div>
                                <input type="text" name="info_sumber_lain" placeholder="Sebutkan sumber lain" class="${inputClass} mt-2 hidden" disabled>
                            </div>

                            <div>
                                <label class="${labelClass}">Menurut Anda, apakah durasi sesi konseling karier sudah cukup? ${reqAsterisk}</label>
                                <div class="flex flex-col sm:flex-row gap-4">${createRadioGroup('durasi_sesi', ['Terlalu Pendek', 'Cukup', 'Terlalu Lama'])}</div>
                                <div class="error-message text-red-500 text-xs mt-1"></div>
                            </div>

                            <div>
                                <label class="${labelClass}">Apakah ada aspek lain yang ingin Anda tambahkan atau bahas di masa mendatang?</label>
                                <textarea name="aspek_lain" rows="3" placeholder="Contoh: Sesi praktik wawancara, bedah portofolio, dll." class="${inputClass} resize-y"></textarea>
                            </div>

                            <div>
                                <label class="${labelClass}">Apakah Anda berencana untuk mengikuti acara serupa di masa mendatang? ${reqAsterisk}</label>
                                <div class="flex flex-col sm:flex-row gap-4">${createRadioGroup('rencana_ikut_lagi', ['Ya', 'Tidak', 'Mungkin'])}</div>
                                <div class="error-message text-red-500 text-xs mt-1"></div>
                            </div>

                             <div>
                                <label class="${labelClass}">Apakah ada saran atau feedback untuk penyelenggaraan konseling karier di TKT ITB mendatang?</label>
                                <textarea name="saran_feedback" rows="3" placeholder="Saran Anda sangat kami hargai." class="${inputClass} resize-y"></textarea>
                            </div>
                        </div>

                        <div class="pt-8 mt-4">
                            <button type="submit" id="btn-submit-feedback" class="w-full bg-brand-pink hover:bg-brand-pinkdark text-white font-bold py-4 px-8 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-[0_8px_24px_rgba(255,90,141,0.3)] hover:shadow-[0_12px_32px_rgba(255,90,141,0.4)] hover:-translate-y-1 tracking-wide text-lg">
                                <span>Kirim Feedback</span> <i class="ph ph-paper-plane-right text-2xl"></i>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        <div id="toast-container" class="fixed top-5 right-5 z-[100] space-y-2"></div>
    `;

    setupFeedbackFormInteractions();
}

function createRatingQuestion(name, question, labelMin, labelMax) {
    return `
        <div class="p-6 rounded-2xl border border-gray-200 bg-white">
            <label class="block text-sm font-semibold text-brand-navy mb-4" for="${name}">${question} <span class="text-brand-pink font-bold ml-1">*</span></label>
            <div class="flex items-center justify-center gap-3 star-rating-group" data-name="${name}">
                ${[1, 2, 3, 4, 5].map(value => `
                    <label class="cursor-pointer group">
                        <input type="radio" name="${name}" value="${value}" class="sr-only" required>
                        <i class="ph-fill ph-star text-4xl text-gray-300 group-hover:text-yellow-400 transition-colors"></i>
                    </label>
                `).join('')}
            </div>
            <div class="flex justify-between text-xs text-gray-500 mt-2 px-2">
                <span>${labelMin}</span>
                <span>${labelMax}</span>
            </div>
            <div class="error-message text-red-500 text-xs mt-1 text-center"></div>
        </div>
    `;
}

function createRadioGroup(name, options) {
    return options.map(option => `
        <label class="flex items-center gap-3 cursor-pointer group">
            <input type="radio" name="${name}" value="${option}" required class="w-5 h-5 text-brand-gold focus:ring-brand-gold border-gray-300">
            <span class="text-brand-text font-medium group-hover:text-brand-gold transition-colors">${option}</span>
        </label>
    `).join('');
}

function setupFeedbackFormInteractions() {
    // Star rating interaction
    document.querySelectorAll(".star-rating-group").forEach(group => {
        const stars = group.querySelectorAll('label i');
        const radios = group.querySelectorAll('input[type="radio"]');

        const updateStars = (rating) => {
            stars.forEach((star, index) => {
                star.classList.toggle('text-yellow-400', index < rating);
                star.classList.toggle('text-gray-300', index >= rating);
            });
        };

        group.addEventListener('mouseover', (e) => {
            const label = e.target.closest('label');
            if (!label) return;
            const hoverValue = label.querySelector('input').value;
            updateStars(hoverValue);
        });

        group.addEventListener('mouseout', () => {
            const checkedRadio = group.querySelector('input[type="radio"]:checked');
            const currentValue = checkedRadio ? checkedRadio.value : 0;
            updateStars(currentValue);
        });

        radios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                updateStars(e.target.value);
            });
        });
    });

    // "Yang lain" source info interaction (already good)
    const infoSumberSelect = document.querySelector('select[name="info_sumber"]');
    const infoSumberLainInput = document.querySelector('input[name="info_sumber_lain"]');
    infoSumberSelect.addEventListener('change', (e) => {
        if (e.target.value === 'Yang lain') {
            infoSumberLainInput.classList.remove('hidden');
            infoSumberLainInput.disabled = false;
            infoSumberLainInput.required = true;
        } else {
            infoSumberLainInput.classList.add('hidden');
            infoSumberLainInput.disabled = true;
            infoSumberLainInput.required = false;
        }
    });

    // Form submission
    const form = document.getElementById('form-feedback');
    form.addEventListener('submit', handleFeedbackSubmit);
}

async function handleFeedbackSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const btnSubmit = document.getElementById('btn-submit-feedback');
    const originalBtnContent = btnSubmit.innerHTML;

    if (!validateForm(form)) {
        showToast("Mohon perbaiki isian Anda pada kolom yang ditandai.", "error");
        return;
    }

    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `<i class="ph ph-spinner animate-spin text-2xl"></i><span>Mengirim Feedback...</span>`;

    const formData = new FormData(form);
    const dataObject = {};
    formData.forEach((value, key) => {
        dataObject[key] = value;
    });

    const result = await submitFeedback(dataObject);

    if (result.success) {
        document.querySelector('.w-full.max-w-3xl').innerHTML = `
            <div class="bg-brand-surface rounded-[24px] shadow-elegant border border-white/80 p-10 sm:p-12 text-center">
                <div class="bg-brand-base text-brand-pink w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
                    <i class="ph ph-heart text-5xl"></i>
                </div>
                <h2 class="text-3xl font-bold text-brand-navy mb-3">Terima Kasih!</h2>
                <p class="text-brand-navy/70 mb-8 text-base max-w-sm mx-auto">Feedback Anda telah berhasil kami terima. Kontribusi Anda sangat berarti untuk kami.</p>
                <a href="#/" class="inline-flex items-center gap-2 mt-2 text-brand-blue font-semibold hover:text-brand-pink transition-colors">
                    <i class="ph ph-arrow-left"></i> Kembali ke Halaman Utama
                </a>
            </div>
        `;
    } else {
        showToast(result.message || "Terjadi kesalahan. Silakan coba lagi.", 'error');
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = originalBtnContent;
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
