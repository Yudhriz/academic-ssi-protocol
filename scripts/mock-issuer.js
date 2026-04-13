require('dotenv').config();
const { createJWT, SimpleSigner } = require('did-jwt');
const crypto = require('crypto');

const cleanPrivateKey = (key) => key.replace(/^0x/, '');

/**
 * TAHAP 1: KAMPUS (ISSUER) MENERBITKAN VERIFIABLE CREDENTIAL (VC)
 * Sesuai W3C Verifiable Credentials Blueprint PMB.
 */
async function createVC(studentData = {}) {
    const issuerPrivateKey = cleanPrivateKey(process.env.ISSUER_PRIVATE_KEY);
    const signer = SimpleSigner(issuerPrivateKey);
    
    const issuerDid = `did:ethr:sepolia:${process.env.ISSUER_ADDRESS}`;
    const studentDid = `did:ethr:sepolia:${process.env.STUDENT_ADDRESS}`;
    const statusRegistryDid = `did:ethr:sepolia:${process.env.ISSUER_ADDRESS}`; 
    
    const credentialId = crypto.randomUUID();
    const nowMs = Date.now();
    const issuanceDateISO = new Date(nowMs).toISOString();
    const expirationDateISO = new Date(new Date().getFullYear(), 7, 31, 23, 59, 59).toISOString();
    
    const vcPayload = {
        iss: issuerDid,
        sub: studentDid,
        jti: `urn:uuid:${credentialId}`,
        nbf: Math.floor(nowMs / 1000),
        vc: {
            "@context": [
                "https://www.w3.org/2018/credentials/v1",
                "https://pmb.nurulfikri.ac.id/credentials/v1"
            ],
            "id": `urn:uuid:${credentialId}`,
            "type": [
                "VerifiableCredential",
                "PMBIdentityCredential"
            ],
            "issuer": {
                "id": issuerDid
            },
            "issuanceDate": issuanceDateISO,
            "expirationDate": expirationDateISO,
            "credentialStatus": {
                "id": `${statusRegistryDid}#${credentialId}`,
                "type": "EthereumRevocationList"
            },
            "credentialSubject": {
                "id": studentDid,
                "nomorPendaftaran": studentData.nomorPendaftaran || "PMB-2026-099",
                "namaLengkap": studentData.namaLengkap || "Calon Mahasiswa",
                "programStudi": studentData.programStudi || "TI"
            }
        }
    };

    return await createJWT(vcPayload, { issuer: issuerDid, signer }, { alg: 'ES256K' });
}

/**
 * TAHAP 2: MAHASISWA (HOLDER) MEMBUAT VERIFIABLE PRESENTATION (VP)
 * Sesuai Blueprint SIOPv2 STT Terpadu Nurul Fikri.
 */
async function generateCredential(scenarioOptions = {}) {
    // 1. Dapatkan VC yang sudah ditandatangani Kampus
    const vcJwt = await createVC(scenarioOptions.customStudentData);

    // 2. Persiapkan VP oleh Mahasiswa
    const studentPrivateKey = cleanPrivateKey(process.env.STUDENT_PRIVATE_KEY);
    const signer = SimpleSigner(studentPrivateKey);
    const studentDid = `did:ethr:sepolia:${process.env.STUDENT_ADDRESS}`;
    const now = Math.floor(Date.now() / 1000);

    // Payload VP sesuai Blueprint SIOPv2
    const defaultVpPayload = {
        iss: studentDid,
        sub: studentDid, // Memastikan ini adalah Self-Issued Token
        aud: "https://pmb.nurulfikri.ac.id",
        iat: now,
        exp: now + 3600, // Validasi waktu aktif challenge
        nonce: scenarioOptions.nonce || `challenge-nonce-${Date.now()}`,
        vp: {
            "@context": [
                "https://www.w3.org/2018/credentials/v1"
            ],
            "type": [
                "VerifiablePresentation"
            ],
            "verifiableCredential": [
                vcJwt // Injeksi string JWT VC ke dalam array
            ]
        }
    };

    // Override untuk keperluan testing (misal: simulasi token kedaluwarsa)
    const finalPayload = { ...defaultVpPayload, ...scenarioOptions.overridePayload };

    // Tandatangani VP menggunakan key Mahasiswa
    const vpJwt = await createJWT(finalPayload, { issuer: studentDid, signer }, { alg: 'ES256K' });
    
    return { jwt: vpJwt, payload: finalPayload };
}

// Eksekusi mandiri dari terminal untuk memvalidasi output JSON
if (require.main === module) {
    console.log('=== MOCK ISSUER: GENERATING BLUEPRINT-COMPLIANT VP ===\n');
    
    generateCredential()
        .then(result => {
            console.log('✅ Verifiable Presentation (VP) Terbuat.');
            console.log('🔍 Decoded VP Payload:\n', JSON.stringify(result.payload, null, 2));
        })
        .catch(error => {
            console.error('❌ Gagal menggenerate credential:', error.message);
        });
}

module.exports = { generateCredential, createVC };