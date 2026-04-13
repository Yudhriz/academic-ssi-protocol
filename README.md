# Academic SSI Protocol - PMB STT Terpadu Nurul Fikri

Repositori ini merupakan bagian dari penelitian skripsi berjudul **"PERANCANGAN PROTOKOL SELF-SOVEREIGN IDENTITY BERBASIS BLOCKCHAIN UNTUK SIVITAS AKADEMIK DI STT TERPADU NURUL FIKRI"**.

Fokus utama dari sub-proyek ini adalah melakukan pengujian protokol (Protocol Research) dan Quality Assurance (QA) terhadap implementasi *Self-Sovereign Identity* dengan standar W3C Verifiable Credentials dan SIOPv2.

## 📂 Struktur Proyek

```text
.
├── docs/                   # Dokumentasi Teknis & Spesifikasi Protokol
│   ├── architecture.md     # Arsitektur sistem secara makro
│   ├── integration-spec.md # Spesifikasi integrasi antar komponen
│   ├── siop-flow.md        # Alur login SIOPv2
│   └── vc-schema.md        # Definisi skema JSON-LD untuk kredensial
├── scripts/                # Skrip Otomasi & Pengujian
│   ├── gas-tracker.js      # Pengukuran biaya gas blockchain
│   ├── mock-issuer.js      # Simulator Issuer (Kampus) & Holder (Mahasiswa)
│   └── performance-tester.js # Uji Black-Box (Latensi & Keamanan)
├── .env                    # Konfigurasi Private (Keys, RPC URL)
└── README.md
```

## 🏗️ Alur Protokol (Two-Step Generation)
Protokol ini memisahkan tanggung jawab antara entitas Kampus dan Mahasiswa untuk menjamin *Zero-Trust*:

1. **Tahap 1 (VC Generation)**: Kampus (Issuer) menandatangani data mahasiswa menjadi Verifiable Credential (VC) menggunakan algoritma `ES256K`.
2. **Tahap 2 (VP Generation)**: Mahasiswa (Holder) membungkus VC tersebut ke dalam Verifiable Presentation (VP), menambahkan `nonce` untuk keamanan, dan menandatanganinya sebagai bukti kepemilikan.
3. **Verification**: Sistem PMB (Verifier) memverifikasi dua tingkat tanda tangan digital melalui Registry **ERC-1056** di Sepolia.

## 🏗️ Arsitektur Protokol
Protokol ini mengimplementasikan alur **Two-Step Generation**:
1. **Issuer (Kampus):** Menerbitkan Verifiable Credential (VC) bertanda tangan digital (ES256K).
2. **Holder (Mahasiswa):** Membungkus VC ke dalam Verifiable Presentation (VP) dan menandatanganinya sebagai bukti kepemilikan (Proof of Possession) saat login.
3. **Verifier (Sistem PMB):** Melakukan verifikasi dua lapis (VP Signature & VC Integrity) melalui Smart Contract Registry ERC-1056 di Ethereum Sepolia.

## 🛠️ Tech Stack
- **Environment:** Node.js v22+
- **Network:** Ethereum Sepolia Testnet
- **Registry:** ERC-1056 (uPort Identity)
- **DID Method:** `did:ethr`
- **Cryptography:** ES256K (secp256k1) & keccak256
- **Libraries:** `ethers` (v6), `did-jwt`, `ethr-did-resolver`, `did-resolver`.

## 🚀 Instalasi & Persiapan

1. Clone repositori ini:
   ```bash
   git clone https://github.com/yudhriz/academic-ssi-protocol.git
   cd academic-ssi-protocol
   ```

2. Install dependensi:
    ```bash
    npm install
    ```

3. Konfigurasi Environment:
<br>Salin .env.example menjadi .env dan isi variabel berikut:
    - RPC_URL: Endpoint provider (Infura/Alchemy) untuk Sepolia.
    - ISSUER_PRIVATE_KEY & ISSUER_ADDRESS: Identitas Kampus.
    - STUDENT_PRIVATE_KEY & STUDENT_ADDRESS: Identitas Mahasiswa.

## 📊 Skenario Pengujian (Bab IV)
Gunakan perintah berikut untuk menghasilkan data pengujian:

1. Estimasi Gas Fee (Infrastruktur)
<br>Mengukur biaya operasional registrasi identitas pada blockchain.
    ```bash
    npm run test:gas
    ```

2. Simulasi Penerbitan Kredensial
<br>Menghasilkan JWT VC & VP sesuai blueprint W3C untuk divalidasi strukturnya.
    ```bash
    npm run test:issuer
    ```

3. Uji Performa & Keamanan (Black-Box)
<br>Menjalankan 4 skenario Zero-Trust untuk mendapatkan data Latensi dan Validitas:
    - Skenario 1: Login Valid (Happy Path).
    - Skenario 2: Mitigasi Replay Attack (Nonce Verification).
    - Skenario 3: Token Expiration (Temporal Check).
    - Skenario 4: Data Integrity (Signature Verification).
    ```bash
    npm run test:perf
    ```

## 📑 Referensi Standar
- [W3C Verifiable Credentials Data Model v1.1](https://www.w3.org/TR/vc-data-model/)
- [ERC-1056: Ethereum Lightweight Identity](https://eips.ethereum.org/EIPS/eip-1056)
- [SIOPv2 (Self-Issued OpenID Provider v2)](https://openid.net/specs/openid-connect-self-issued-v2-1_0.html)
