// File: frontend/js/services/apiService.js
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants.js';

export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function getSystemConfig() {
    try {
        const { data, error } = await supabase.from('pengaturan_sistem').select('*');
        if (error) throw error;
        const config = {};
        data.forEach(item => { config[item.kunci] = item.nilai; });
        return config;
    } catch (err) { console.error("Error fetching system config:", err); return null; }
}

export async function getWhatsAppTemplate(templateKey) {
    try {
        const { data, error } = await supabase.from('pengaturan_sistem').select('nilai').eq('kunci', templateKey).single();
        if (error) throw error;
        return data.nilai;
    } catch (err) { console.error(`Error fetching WA template for key ${templateKey}:`, err); return null; }
}

export async function generateWhatsAppLink(templateKey, participantData) {
    try {
        const template = await getWhatsAppTemplate(templateKey);
        if (!template) return '#'; // Fallback jika template tidak ditemukan

        let message = template;
        // [FIX] Konversi literal '\\n' (dua karakter) dari DB menjadi karakter newline '\n' (satu karakter) asli.
        // encodeURIComponent akan menangani konversi '\n' ke '%0A' dan emoji secara otomatis.
        message = message.replace(/\\n/g, '\n');
        // Ganti placeholder dengan data peserta
        message = message.replace(/{{nama_lengkap}}/g, participantData.nama_lengkap || '');
        message = message.replace(/{{jadwal_hari}}/g, participantData.jadwal_hari || '');
        message = message.replace(/{{jadwal_sesi}}/g, participantData.jadwal_sesi || '');
        message = message.replace(/{{psikolog_bertugas}}/g, participantData.psikolog_bertugas || 'Psikolog');
        message = message.replace(/{{feedback_url}}/g, `https://bit.ly/FeedbackKonselingKarierTKTApril2026`);

        const waNumber = participantData.nomor_wa.startsWith('0') ? '62' + participantData.nomor_wa.substring(1) : participantData.nomor_wa;
        const encodedMessage = encodeURIComponent(message);
        return `https://wa.me/${waNumber}?text=${encodedMessage}`;
    } catch (err) { return null; }
}

export function subscribeToPesertaChanges(callback) {
    const channel = supabase.channel('peserta_changes');
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'peserta_konseling' }, payload => {
        console.log('Change received!', payload);
        callback();
    }).subscribe();
    return channel;
}

export async function submitRegistration(participantData) {
    try {
        // 0. Cek Duplikasi Email dan Nomor WA
        const { data: existingParticipant, error: checkError } = await supabase
            .from('peserta_konseling')
            .select('id')
            .eq('email', participantData.email)
            .eq('nomor_wa', participantData.nomor_wa)
            .limit(1);
        
        if (checkError) throw checkError;
        if (existingParticipant && existingParticipant.length > 0) {
            return { success: false, message: "Email dan Nomor WhatsApp ini sudah terdaftar." };
        }

        // 1. Ambil semua config sistem untuk daftar psikolog
        const { data: configData, error: configError } = await supabase.from('pengaturan_sistem').select('*');
        if (configError) throw configError;
        const config = {};
        configData.forEach(item => { config[item.kunci] = item.nilai; });

        // 2. Tentukan daftar psikolog yang bertugas pada hari yang dipilih
        let psikologListKey;
        if (participantData.jadwal_hari === config.tanggal_kegiatan_1) {
            psikologListKey = 'psikolog_list_1';
        } else if (participantData.jadwal_hari === config.tanggal_kegiatan_2) {
            psikologListKey = 'psikolog_list_2';
        }

        if (!psikologListKey || !config[psikologListKey]) {
            throw new Error("Jadwal psikolog untuk hari yang dipilih tidak ditemukan.");
        }
        const allPsikologsForDay = JSON.parse(config[psikologListKey]);

        // 3. Ambil semua slot yang sudah terisi pada hari dan sesi yang dipilih
        const { data: existingData, error: countError } = await supabase
            .from('peserta_konseling')
            .select('psikolog_bertugas')
            .eq('jadwal_hari', participantData.jadwal_hari)
            .eq('jadwal_sesi', participantData.jadwal_sesi)
            .in('status_peserta', ['DAPAT_SESI', 'CONFIRMED', 'HADIR', 'SELESAI_FULL']);
        if (countError) throw countError;
        const takenPsikologs = existingData.map(p => p.psikolog_bertugas);

        // 4. Logika Auto-Assign Baru
        let assignedPsikolog = null;
        const isPreferenceChosen = participantData.psikolog_pilihan && participantData.psikolog_pilihan !== 'Siapa saja (Rekomendasi)';

        // Prioritas 1: Cek apakah psikolog pilihan tersedia
        if (isPreferenceChosen) {
            if (!takenPsikologs.includes(participantData.psikolog_pilihan)) {
                assignedPsikolog = participantData.psikolog_pilihan;
            }
        }
        
        // Prioritas 2: Jika pilihan tidak tersedia atau tidak memilih, cari slot kosong lain
        if (!assignedPsikolog) {
            const availablePsikologs = allPsikologsForDay.filter(p => !takenPsikologs.includes(p));
            if (availablePsikologs.length > 0) {
                assignedPsikolog = availablePsikologs[0]; // Ambil slot kosong pertama yang tersedia
            }
        }

        // 5. Finalisasi data untuk dimasukkan ke DB
        let finalData = { ...participantData };
        if (assignedPsikolog) {
            finalData.status_peserta = 'DAPAT_SESI';
            finalData.psikolog_bertugas = assignedPsikolog;
        } else {
            // Prioritas 3: Jika semua slot penuh, masuk Waiting List
            finalData.status_peserta = 'WAITING_LIST';
            finalData.psikolog_bertugas = null;
        }

        const { error: insertError } = await supabase.from('peserta_konseling').insert([finalData]);
        if (insertError) throw insertError;
        
        return { success: true, status: finalData.status_peserta, hari: finalData.jadwal_hari, sesi: finalData.jadwal_sesi };
    } catch (err) { 
        console.error("Error dalam submitRegistration:", err);
        return { success: false, message: err.message }; 
    }
}

export async function getSemuaPeserta() {
    try {
        const { data, error } = await supabase
            .from('peserta_konseling')
            .select('*')
            .order('created_at', { ascending: true });
        if (error) throw error;
        return data;
    } catch (err) { console.error(err); return []; }
}

export async function toggleStatusPendaftaran(status) {
    try {
        const { error } = await supabase.from('pengaturan_sistem').update({ nilai: status }).eq('kunci', 'status_pendaftaran');
        if (error) throw error;
        return true;
    } catch (err) { return false; }
}

// UPDATE LOGIKA: Warisan Slot Psikolog saat Auto Promo
export async function updateStatusPesertaDenganAutoPromo(id, statusBaru, hari, sesi) {
    try {
        const { data: currP, error: currErr } = await supabase
            .from('peserta_konseling')
            .select('psikolog_bertugas')
            .eq('id', id).single();
        if (currErr) throw currErr;
        
        const freedPsikolog = currP.psikolog_bertugas;

        const { error: updateError } = await supabase
            .from('peserta_konseling')
            .update({ 
                status_peserta: statusBaru,
                psikolog_bertugas: statusBaru === 'BATAL' ? null : freedPsikolog 
            })
            .eq('id', id);
        if (updateError) throw updateError;

        // Logika Auto-Promo dihapus sesuai permintaan
        return { success: true, dipromosikan: null };
    } catch (err) {
        console.error(err);
        return { success: false, message: err.message || "Terjadi kesalahan saat update status." };
    }
}

export async function submitFeedback(feedbackData) {
    try {
        // 1. Validasi: Cari peserta berdasarkan email dan nomor WA
        const { data: participant, error: findError } = await supabase
            .from('peserta_konseling')
            .select('id, status_peserta')
            .eq('email', feedbackData.email_pengisi)
            .eq('nomor_wa', feedbackData.nomor_wa_pengisi)
            .single();

        if (findError || !participant) {
            return { success: false, message: "Data Anda tidak ditemukan. Pastikan email dan nomor WhatsApp sesuai dengan yang Anda daftarkan." };
        }

        // 2. Validasi: Pastikan status peserta adalah 'HADIR'
        if (participant.status_peserta !== 'HADIR') {
            if (participant.status_peserta === 'SELESAI_FULL') {
                return { success: false, message: "Anda sudah pernah mengisi feedback sebelumnya." };
            }
            return { success: false, message: "Anda hanya dapat mengisi feedback setelah sesi konseling Anda berstatus HADIR." };
        }

        // 3. Siapkan data untuk dimasukkan ke tabel feedback
        const feedbackInsertData = {
            peserta_id: participant.id,
            nama_pengisi: feedbackData.nama_pengisi,
            email_pengisi: feedbackData.email_pengisi,
            nomor_wa_pengisi: feedbackData.nomor_wa_pengisi,
            rating_kepuasan: parseInt(feedbackData.rating_kepuasan),
            rating_materi: parseInt(feedbackData.rating_materi),
            rating_pemahaman_karir: parseInt(feedbackData.rating_pemahaman_karir),
            rating_fasilitator: parseInt(feedbackData.rating_fasilitator),
            rating_motivasi: parseInt(feedbackData.rating_motivasi),
            info_sumber: feedbackData.info_sumber,
            info_sumber_lain: feedbackData.info_sumber_lain || null,
            durasi_sesi: feedbackData.durasi_sesi,
            aspek_lain: feedbackData.aspek_lain || null,
            rencana_ikut_lagi: feedbackData.rencana_ikut_lagi,
            saran_feedback: feedbackData.saran_feedback || null,
        };

        // 4. Masukkan data feedback dan update status peserta dalam satu transaksi
        const { error: insertFeedbackError } = await supabase.from('peserta_feedback').insert([feedbackInsertData]);
        if (insertFeedbackError) throw insertFeedbackError;

        const { error: updateStatusError } = await supabase.from('peserta_konseling').update({ status_peserta: 'SELESAI_FULL' }).eq('id', participant.id);
        if (updateStatusError) throw updateStatusError;

        return { success: true };

    } catch (err) {
        console.error("Error submitting feedback:", err);
        return { success: false, message: "Terjadi kesalahan pada sistem. Silakan coba lagi nanti." };
    }
}

// ==========================================
// FUNGSI KHUSUS PINDAH JADWAL
// ==========================================
export async function ubahJadwalPeserta(idPeserta, hariBaru, sesiBaru, psikologBaru, hariLama, sesiLama, psikologLama) {
    try {
        // Pindahkan peserta ke jadwal baru
        const { error } = await supabase
            .from('peserta_konseling')
            .update({
                jadwal_hari: hariBaru,
                jadwal_sesi: sesiBaru,
                psikolog_bertugas: psikologBaru,
                status_peserta: 'DAPAT_SESI' // Reset status jadi dapat sesi agar admin bisa konfirmasi ulang
            })
            .eq('id', idPeserta);
            
        if (error) throw error;

        // Logika Auto-Promo warisan slot dihapus sesuai permintaan
        return { success: true, dipromosikan: null };
    } catch (err) {
        console.error(err);
        return { success: false, message: err.message };
    }
}