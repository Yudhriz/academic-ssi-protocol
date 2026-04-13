# Arsitektur Ekosistem SSI - PMB STT Terpadu Nurul Fikri

Dokumen ini mendefinisikan High-Level Architecture (HLA) dari implementasi Self-Sovereign Identity (SSI) pada studi kasus Penerimaan Mahasiswa Baru (PMB). Arsitektur mengadopsi model Trust Triangle yang didukung oleh Decentralized Public Key Infrastructure (DPKI) berbasis Decentralized Identifier (DID).

Ekosistem dirancang untuk memungkinkan proses autentikasi dan verifikasi identitas akademik tanpa ketergantungan pada otoritas identitas terpusat, melalui mekanisme trust establishment berbasis blockchain.

---

## Komponen Ekosistem (Trust Triangle)

### 1. Issuer (Institusi STT Terpadu Nurul Fikri)

- **Peran:** Entitas institusi yang bertindak sebagai penerbit resmi kredensial akademik digital.
- **Issuer Agent:** Sistem Backend PMB berfungsi sebagai agen teknis yang mengelola proses penerbitan kredensial dan operasi kriptografi atas nama institusi.
- **Tugas:**
  - Memverifikasi berkas pendaftaran secara konvensional.
  - Menghasilkan Verifiable Credential (VC) dalam format JSON-LD.
  - Menandatangani kredensial menggunakan private key institusi.
  - Mendistribusikan VC kepada calon mahasiswa.

- **Identitas Digital:** Menggunakan Decentralized Identifier (did:ethr) yang dikontrol oleh institusi dan diregistrasikan melalui jaringan Ethereum Sepolia.

---

### 2. Holder (Calon Mahasiswa)

- **Peran:** Entitas individu pemilik identitas digital yang menyimpan dan mengontrol kredensial secara self-sovereign.
- **Wallet Application:** Perangkat lunak (digital wallet) di sisi pengguna yang bertindak sebagai agen pengelola identitas.
- **Tugas:**
  - Wallet secara otomatis menghasilkan pasangan kunci kriptografi (keypair) secara lokal pada perangkat pengguna.
  - Menyimpan Verifiable Credential di dalam secure storage (penyimpanan aman) perangkat.
  - Menghasilkan dan menandatangani Verifiable Presentation (VP) sebagai respons terhadap permintaan autentikasi dari Verifier.

---

### 3. Verifier (Portal Ujian PMB)

- **Peran:** Sistem layanan yang membutuhkan verifikasi identitas sebelum memberikan akses.
- **Tugas:**
  - Menghasilkan authentication request SIOPv2 berupa challenge/nonce.
  - Menerima SIOPv2 Response (JWT) dari wallet pengguna.
  - Mengekstrak DID dari respons autentikasi.
  - Melakukan DID Resolution untuk memperoleh public key terbaru.
  - Memverifikasi tanda tangan kriptografi dan status validitas kredensial.

---

### 4. Trust Layer (Ethereum Sepolia – ERC-1056)

- **Peran:** Verifiable Data Registry yang berfungsi sebagai sumber kebenaran terdesentralisasi.
- **Tugas:**
  - Mengimplementasikan smart contract ERC-1056 (Ethereum Lightweight Identity).
  - Menyimpan metadata identitas dan riwayat perubahan kunci.
  - Mendukung proses DID Resolution tanpa integrasi API terpusat.
  - Memungkinkan key rotation dan revocation secara on-chain.

Blockchain digunakan sebagai lapisan kepercayaan publik yang memungkinkan verifikasi identitas dilakukan secara independen tanpa kebutuhan komunikasi langsung antar sistem.