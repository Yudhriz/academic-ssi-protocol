# Spesifikasi Integrasi Teknis & Dependensi Tim (System Integration Blueprint)
Dokumen ini adalah kontrak kerja sama teknis antara Arsitek Protokol, Pengembang Backend, dan Pengembang Mobile untuk memastikan interoperabilitas, keamanan, dan kepatuhan terhadap standar W3C & Ethereum.

## 1. Aturan Kriptografi Dasar
Agar komponen dapat saling berkomunikasi, seluruh tim **WAJIB** menerapkan standar algoritma berikut:
- **Hashing:** `keccak256` (SHA-3 standar Ethereum).
- **Digital Signature:** `ES256K` (secp256k1). Semua proses penandatanganan dan verifikasi harus menggunakan format JWS (JSON Web Signature) yang kompatibel dengan library `did-jwt`. Dilarang keras menggunakan algoritma RSA atau secp256r1.
- **DID Method:** `did:ethr:sepolia:<ADDRESS>` untuk entitas on-chain (Issuer & Holder).

## 2. Parameter Smart Contract (Trust Layer)
- **Jaringan:** Ethereum Sepolia Testnet
- **Standar Kontrak:** ERC-1056 (Ethereum Decentralized Identifier)
- **Contract Address Registry:** `[AKAN_DIISI_SETELAH_DEPLOY_OLEH_BACKEND]`
*(Catatan: Contract address ini digunakan oleh komponen DID Resolver untuk melakukan verifikasi identitas dan status kredensial secara on-chain)*.
- **RPC URL Provider:** Gunakan Infura / Alchemy (Konfigurasi via file `.env`).

## 3. Spesifikasi Library Wajib
Tim dilarang mengimplementasikan fungsi kriptografi dari nol (*scratch*). Gunakan *library* tersertifikasi berikut:

### Backend (Node.js) & Portal Verifier
**A. Library Inti:**
- `ethers` (v6): Untuk interaksi dengan RPC dan *address checksumming*.
- `did-jwt`: Untuk membuat dan memverifikasi token JWT berbasis DID.
- `ethr-did-resolver`: *Middleware* wajib untuk menyelesaikan dokumen `did:ethr` dari blockchain Sepolia secara *on-the-fly*.
- `ethr-did`: Untuk abstraksi pembuatan identitas Issuer di sisi server.

**B. Manajemen Kunci Institusi (Sangat Rahasia):**
- *Private Key* Institusi pengeluar kredensial (Issuer) dilarang di-*hardcode* di dalam kode.
- Wajib disimpan dalam *Environment Variables* terenkripsi atau *Key Management Service* (KMS).

### Mobile Wallet (React Native / Flutter)
**A. Library Inti:**
- *React Native:* Gunakan `@sphereon/ssi-sdk` atau kombinasi `ethers` + `react-native-get-random-values` untuk manajemen *keypair*.
- *Flutter:* Gunakan `web3dart` dan library ECDSA yang mendukung kurva secp256k1.

**B. Manajemen Kunci Pengguna (Zero Trust Storage):**
- Kunci privat (`Private Key`) mahasiswa WAJIB disimpan menggunakan `Encrypted Shared Preferences` (Android) atau `Keychain` (iOS).
- **Dilarang keras menyimpannya dalam bentuk *plaintext* di *local storage* atau *AsyncStorage*.**


## 4. Format SIOPv2 Response Payload
JWT yang dikirim oleh Mobile Wallet ke Endpoint Verifier (`POST /api/verify`) harus mengikuti struktur *Verifiable Presentation* (VP) berikut sebelum ditandatangani oleh *Private Key* mahasiswa:
```json
{
  "iss": "did:ethr:sepolia:<WALLET_MAHASISWA>",
  "sub": "did:ethr:sepolia:<WALLET_MAHASISWA>",
  "aud": "https://pmb.nurulfikri.ac.id",
  "iat": 1712600000,
  "exp": 1712610000, 
  "nonce": "<CHALLENGE_DARI_VERIFIER_DB>",
  "vp": {
    "@context": [
      "https://www.w3.org/2018/credentials/v1"
    ],
    "type": [
      "VerifiablePresentation"
    ],
    "verifiableCredential": [
      "<JWT_CREDENTIAL_DARI_ISSUER_YANG_BERISI_VC>"
    ]
  }
}
```

## Catatan Integrasi Payload:

1. Atribut `aud` (Audience) menggunakan URL verifier untuk memastikan JWT hanya ditujukan ke sistem PMB.
2. Atribut `sub` dan `iss` menggunakan DID yang sama (karena ini adalah *Self-Issued provider*).
3. Array `verifiableCredential` memuat string JWT asli yang sebelumnya diterbitkan dan ditandatangani oleh kampus. Wallet **tidak boleh** mengubah isi JWT tersebut untuk menjaga integritas *Proof of Issuance*.