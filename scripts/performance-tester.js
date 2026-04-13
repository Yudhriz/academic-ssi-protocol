require('dotenv').config();
const { verifyJWT } = require('did-jwt');
const { Resolver } = require('did-resolver');
const { getResolver } = require('ethr-did-resolver');
const { generateCredential } = require('./mock-issuer');
const { ethers } = require('ethers');

// Inisialisasi Provider & Resolver
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

// Konfigurasi Resolver untuk Sepolia (Membaca Registry ERC-1056 uPort)
const ethrResolver = getResolver({ 
    networks: [{ name: "sepolia", provider: provider, registry: "0x03d5003bf0e79C5F5223588F347ebA39AfbC3818" }] 
});
const resolver = new Resolver(ethrResolver);

// Database sederhana di memori untuk mitigasi Replay Attack (Skenario 2)
const usedNonces = new Set();

/**
 * FUNGSI VERIFIER UTAMA (Sistem PMB)
 * Melakukan Two-Step Verification: VP (Holder) -> VC (Issuer)
 */
async function verifyLogin(vpJwtToken, expectedNonce) {
    const t0 = performance.now();
    try {
        // 1. Cek Mitigasi Replay Attack (Nonce Challenge)
        if (usedNonces.has(expectedNonce)) {
            throw new Error("Replay Attack Detected: Nonce (tantangan) sudah pernah digunakan.");
        }

        // 2. VERIFIKASI LAPISAN 1: Verifiable Presentation (VP)
        // Memvalidasi Signature Mahasiswa, Audience (Target Sistem PMB), dan Expired Time
        const vpVerification = await verifyJWT(vpJwtToken, {
            resolver,
            audience: "https://pmb.nurulfikri.ac.id"
        });

        const vpPayload = vpVerification.payload;

        // Pastikan format VP sesuai standar (memuat array verifiableCredential)
        if (!vpPayload.vp || !Array.isArray(vpPayload.vp.verifiableCredential) || vpPayload.vp.verifiableCredential.length === 0) {
            throw new Error("Format Invalid: Tidak ditemukan Verifiable Credential di dalam Verifiable Presentation.");
        }

        // 3. VERIFIKASI LAPISAN 2: Verifiable Credential (VC)
        // Ekstrak VC dari dalam VP dan validasi Signature Issuer (Kampus)
        const vcJwtToken = vpPayload.vp.verifiableCredential[0];
        
        const vcVerification = await verifyJWT(vcJwtToken, {
            resolver
        });

        // Ekstrak data mahasiswa yang sudah terjamin keasliannya
        const studentData = vcVerification.payload.vc.credentialSubject;

        // 4. Tandai nonce telah digunakan (Login Sukses)
        usedNonces.add(expectedNonce);
        
        const t1 = performance.now();
        return { 
            success: true, 
            latency: (t1 - t0).toFixed(2), 
            studentDid: vpPayload.sub,
            data: studentData 
        };

    } catch (error) {
        const t1 = performance.now();
        return { success: false, latency: (t1 - t0).toFixed(2), error: error.message };
    }
}

/**
 * FUNGSI EKSEKUSI SKENARIO PENGUJIAN BLACK-BOX
 */
async function runTests() {
    console.log('=== MEMULAI BLACK-BOX SECURITY & LATENCY TEST ===');
    console.log('Mode: Two-Step Verification (VP & VC)\n');

    // Skenario 1: Login Valid (Happy Path)
    console.log('▶ Skenario 1: Login Valid');
    const validNonce = "nonce-valid-001";
    const { jwt: validJwt } = await generateCredential({ nonce: validNonce });
    const res1 = await verifyLogin(validJwt, validNonce);
    console.log(`  Ekspektasi: Berhasil | Hasil: ${res1.success ? 'Berhasil ✅' : 'Gagal ❌'} | Latency: ${res1.latency} ms`);
    if(res1.success) console.log(`  Data Terenkripsi Diterima: ${res1.data.namaLengkap} - ${res1.data.nomorPendaftaran}\n`);

    // Skenario 2: Replay Attack / Nonce Bekas
    console.log('▶ Skenario 2: Replay Attack (Menggunakan Token Bekas Skenario 1)');
    const res2 = await verifyLogin(validJwt, validNonce);
    console.log(`  Ekspektasi: Gagal    | Hasil: ${!res2.success ? 'Ditolak ✅' : 'Lolos ❌'} | Alasan: ${res2.error}\n`);

    // Skenario 3: Kredensial Kedaluwarsa
    console.log('▶ Skenario 3: Kredensial Kedaluwarsa (Expired Token)');
    const expNonce = "nonce-exp-002";
    const pastTime = Math.floor(Date.now() / 1000) - 86400; // Mundurkan waktu 1 hari
    const { jwt: expJwt } = await generateCredential({ 
        nonce: expNonce, 
        overridePayload: { exp: pastTime } 
    });
    const res3 = await verifyLogin(expJwt, expNonce);
    console.log(`  Ekspektasi: Gagal    | Hasil: ${!res3.success ? 'Ditolak ✅' : 'Lolos ❌'} | Alasan: ${res3.error}\n`);

    // Skenario 4: Invalid Signature / Payload Dimanipulasi
    console.log('▶ Skenario 4: Invalid Signature (Manipulasi Payload VP)');
    const manipNonce = "nonce-manip-003";
    const { jwt: originalJwt } = await generateCredential({ nonce: manipNonce });
    
    // Simulasi Hacker mencegat JWT VP dan memanipulasi Audience
    const parts = originalJwt.split('.');
    // Gunakan base64url agar kompatibel dengan Node.js versi terbaru
    const fakePayloadObj = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
    
    // Hacker mencoba mengubah target audience portal login
    fakePayloadObj.aud = "https://portal-phishing-hacker.com"; 
    
    const fakePayloadBase64 = Buffer.from(JSON.stringify(fakePayloadObj)).toString('base64url');
    const tamperedJwt = `${parts[0]}.${fakePayloadBase64}.${parts[2]}`; // Gabungkan kembali

    const res4 = await verifyLogin(tamperedJwt, manipNonce);
    console.log(`  Ekspektasi: Gagal    | Hasil: ${!res4.success ? 'Ditolak ✅' : 'Lolos ❌'} | Alasan: ${res4.error}\n`);

    console.log('✅ Semua Skenario Pengujian Selesai Dieksekusi.');
}

runTests();