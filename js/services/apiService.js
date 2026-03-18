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
    } catch (err) { return null; }
}

export async function submitRegistration(participantData) {
    try {
        // 1. Ambil data peserta yang sudah mengisi sesi tersebut
        const { data: existingData, error: countError } = await supabase
            .from('peserta_konseling')
            .select('psikolog_bertugas')
            .eq('jadwal_hari', participantData.jadwal_hari)
            .eq('jadwal_sesi', participantData.jadwal_sesi)
            .in('status_peserta', ['DAPAT_SESI', 'CONFIRMED', 'HADIR', 'SELESAI_FULL']);

        if (countError) throw countError;

        // 2. Logika Auto-Assign Psikolog (Cari slot yang kosong)
        const takenPsikologs = existingData.map(p => p.psikolog_bertugas);
        let assignedPsikolog = null;
        
        // Loop dari psikolog_1 sampai psikolog_5
        for (let i = 1; i <= 5; i++) {
            let key = `psikolog_${i}`;
            if (!takenPsikologs.includes(key)) {
                assignedPsikolog = key;
                break; // Ketemu slot kosong, langsung stop!
            }
        }

        let finalData = { ...participantData };
        if (assignedPsikolog) {
            finalData.status_peserta = 'DAPAT_SESI';
            finalData.psikolog_bertugas = assignedPsikolog; // Masukkan psikolog yang didapat
        } else {
            finalData.status_peserta = 'WAITING_LIST';
            finalData.psikolog_bertugas = null; // Belum dapat psikolog
        }

        const { error: insertError } = await supabase.from('peserta_konseling').insert([finalData]);
        if (insertError) throw insertError;
        
        return { success: true, status: finalData.status_peserta, hari: finalData.jadwal_hari, sesi: finalData.jadwal_sesi };
    } catch (err) { return { success: false, message: err.message }; }
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
        // A. Cek siapa psikolog peserta yang mau dibatalkan ini
        const { data: currP, error: currErr } = await supabase
            .from('peserta_konseling')
            .select('psikolog_bertugas')
            .eq('id', id).single();
        if (currErr) throw currErr;
        
        const freedPsikolog = currP.psikolog_bertugas;

        // B. Update status peserta target (Jika Batal, kosongkan slot psikolognya)
        const { error: updateError } = await supabase
            .from('peserta_konseling')
            .update({ 
                status_peserta: statusBaru,
                psikolog_bertugas: statusBaru === 'BATAL' ? null : freedPsikolog 
            })
            .eq('id', id);
        if (updateError) throw updateError;

        let dipromosikan = null;

        // C. Jika Dibatalkan dan dia punya Psikolog, wariskan psikolognya ke Waiting List!
        if (statusBaru === 'BATAL' && freedPsikolog) {
            const { data: waitingList, error: wlError } = await supabase
                .from('peserta_konseling')
                .select('id, nama_lengkap')
                .eq('jadwal_hari', hari)
                .eq('jadwal_sesi', sesi)
                .eq('status_peserta', 'WAITING_LIST')
                .order('created_at', { ascending: true })
                .limit(1);

            if (!wlError && waitingList && waitingList.length > 0) {
                dipromosikan = waitingList[0].nama_lengkap;
                await supabase
                    .from('peserta_konseling')
                    .update({ 
                        status_peserta: 'DAPAT_SESI',
                        psikolog_bertugas: freedPsikolog // Wariskan slot psikolog
                    })
                    .eq('id', waitingList[0].id);
            }
        }

        return { success: true, dipromosikan: dipromosikan };
    } catch (err) {
        console.error(err);
        return { success: false, message: err.message };
    }
}