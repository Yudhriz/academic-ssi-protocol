# Alur Autentikasi SIOPv2 (Self-Issued OpenID Provider v2)
Dokumen ini mendefinisikan protokol SSO desentralisasi antara Portal Ujian PMB (Verifier) dan Mobile Wallet (Holder) guna mencegah penyalahgunaan akses dan memastikan keabsahan kredensial.

Protokol ini secara ketat mengikuti spesifikasi **Self-Issued OpenID Provider v2 (SIOPv2)** di mana Wallet bertindak secara mandiri sebagai *Identity Provider* (IdP) yang dikontrol langsung oleh pengguna tanpa perantara server pusat.

## Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor M as Calon Mahasiswa
    participant W as Mobile Wallet (SIOP)
    participant E as Portal Ujian PMB (Verifier)
    participant B as Sepolia Blockchain (ERC-1056)

    M->>E: Klik "Login via SSI"
    E->>E: Generate Nonce acak & State
    E-->>W: Tampilkan QR Code (OIDC Auth Request + Nonce)
    M->>W: Scan QR Code
    W->>W: Ekstrak Nonce & Ambil VC dari Secure Storage
    W->>W: Create Verifiable Presentation (VP) memuat VC
    W->>W: Sign VP + Nonce menjadi JWT (ES256K) dengan Private Key
    W->>E: HTTP POST /api/verify (SIOP Response berupa JWT)
    
    rect rgb(240, 248, 255)
        Note over E,B: Fase Keamanan (Zero Trust Middleware)
        E->>E: Ekstrak JWT & Validasi expiration time (exp)
        E->>E: Validasi audience (aud) claim
        E->>E: Cek kesesuaian Nonce dengan Database
        E->>B: 1. Resolve DID Holder (Ambil Public Key Mahasiswa)
        E->>E: Verifikasi Signature Holder pada VP (Proof of Possession)
        E->>B: 2. Resolve DID Issuer (Ambil Public Key Institusi)
        E->>E: Verifikasi Signature Issuer pada VC (Proof of Issuance)
        E->>B: 3. Cek credentialStatus (EthereumRevocationList)
    end
    
    alt Signature, Nonce & Status Valid
        E-->>M: Berikan Session Access / JWT Web2
    else Invalid / Revoked / Replay Attack
        E-->>M: Akses Ditolak (401 Unauthorized)
    end
```

## Mekanisme Pencegahan Replay Attack
*Replay Attack* adalah serangan di mana peretas menyadap respons JWT dari jaringan dan mencoba mengirimkannya kembali di masa depan untuk melakukan login ilegal. Sistem ini mencegahnya melalui alur parameter `nonce`:

1. **Pembuatan Nonce**: Portal Ujian PMB (Verifier) men-generate `nonce` kriptografis satu kali pakai (*one-time string*) yang unik untuk setiap permintaan login dan menyimpannya di cache/database dengan masa berlaku sangat singkat (misal: 2 menit).

2. **Keterikatan Tanda Tangan (Cryptographic Binding)**: Wallet WAJIB memasukkan *nonce* tersebut ke dalam payload *Verifiable Presentation* (VP) sebelum ditandatangani oleh *private key* pengguna menjadi JWT.

3. **Validasi Ketat**: Saat Verifier menerima JWT, middleware akan mengekstrak `nonce`, mencocokkannya dengan database, dan **segera menghapus (invalidate)** `nonce` tersebut. Jika peretas mengirim ulang JWT yang sama, Verifier otomatis menolak akses karena *nonce* telah hangus.

## Validasi Keamanan Tambahan (Multi-Layer Verification)
Selain perlindungan *nonce*, *Zero Trust Middleware* pada Verifier juga mengeksekusi lapis keamanan berikut sebelum memberikan akses sesi:

1. **Audience Validation (`aud`)**: Memastikan bahwa JWT otentikasi tersebut memang ditujukan secara spesifik untuk *client_id* Portal Ujian PMB, mencegah token disalahgunakan di sistem kampus lain.

2. **Expiration Validation (`exp`)**: Mencegah penggunaan token otentikasi setelah batas waktu respons berakhir.

3. **Credential Expiration Check**: Memastikan atribut `expirationDate` yang tertanam di dalam *Verifiable Credential* (VC) masih berlaku (misalnya, masa PMB belum berakhir).

4. **DID Resolution & Revocation Check**: Memastikan kunci publik yang digunakan untuk memverifikasi tanda tangan adalah versi terbaru dari *registry on-chain*, dan mengekstrak status kredensial (*EthereumRevocationList*) untuk memastikan identitas belum dibekukan atau dicabut oleh institusi.