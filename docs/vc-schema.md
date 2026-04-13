# Skema Verifiable Credential (VC) - Data Akademik PMB
Dokumen ini mendefinisikan struktur data JSON-LD untuk Kredensial Calon Mahasiswa berdasarkan standar *W3C Verifiable Credentials Data Model v1.1*.

Skema ini mengikuti prinsip minimal disclosure, di mana hanya atribut akademik yang benar-benar diperlukan untuk proses autentikasi PMB yang disertakan dalam kredensial, guna menjaga privasi pemilik identitas secara maksimal.

## Format Baku Kredensial
Backend WAJIB men- *generate* struktur JSON berikut sebelum melakukan proses penandatanganan (pembentukan JWT).

```json
{
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://pmb.nurulfikri.ac.id/credentials/v1"
  ],
  "id": "urn:uuid:<UUID_V4>",
  "type": [
    "VerifiableCredential",
    "PMBIdentityCredential"
  ],
  "issuer": {
    "id": "did:ethr:sepolia:<WALLET_ADDRESS_KAMPUS>"
  },
  "issuanceDate": "2026-04-08T00:00:00Z",
  "expirationDate": "2026-08-31T23:59:59Z",
  "credentialStatus": {
    "id": "did:ethr:sepolia:<STATUS_REGISTRY>#<UUID_V4>",
    "type": "EthereumRevocationList"
  },
  "credentialSubject": {
    "id": "did:ethr:sepolia:<WALLET_ADDRESS_MAHASISWA>",
    "nomorPendaftaran": "<STRING>",
    "namaLengkap": "<STRING>",
    "programStudi": "<STRING_KODE_PRODI>"
  }
}
```

## Kamus Data Atribut Akademik
 **#**  | **Properti**                         | **Tipe Data** | **Deskripsi & Aturan Sistem**                                                                                                      
--------|--------------------------------------|---------------|-------------------------------------------------------------------------------------------------------------------------------------
 **1**  | `@context`                           | Array         | **[Wajib W3C]** URL referensi kamus JSON-LD. Elemen pertama mutlak `https://www.w3.org/2018/credentials/v1`.                              
 **2**  | `type`                               | Array         | **[Wajib W3C]** Kategori kredensial. Mutlak mengandung `"VerifiableCredential"` dan klasifikasi kampus (misal: `"PMBIdentityCredential"`).  
 **3**  | `id`                                 | String        | Identifier unik dokumen menggunakan `UUID v4`.                                                                                        
 **4**  | `issuer.id`                          | String        | DID resmi institusi STT NF (`did:ethr`).                                                                                              
 **5**  | `issuanceDate`                       | String        | Waktu diterbitkannya status calon mahasiswa (ISO 8601 UTC).                                                                         
 **6**  | `expirationDate`                     | String        | Batas akhir masa berlakunya status PMB (sangat krusial untuk mencegah penggunaan identitas kadaluarsa).          
 **7**  | `credentialStatus`                   | Object        | Referensi status kredensial yang digunakan Verifier untuk melakukan pengecekan revocation secara on-chain melalui DID Registry berbasis ERC-1056.                      
 **8**  | `credentialSubject.id`               | String        | DID milik calon mahasiswa yang me-request kredensial.                                                                               
 **9**  | `credentialSubject.nomorPendaftaran` | String        | Nomor referensi unik pendaftaran di sistem PMB.                                                                                     
 **10** | `credentialSubject.namaLengkap`      | String        | Nama calon mahasiswa sesuai KTP/Ijazah sebelumnya.  
 **11** | `credentialSubject.programStudi`     | String        | Kode atau nama program studi yang dituju.                                                                                

## Catatan Interoperabilitas

Skema kredensial ini dirancang agar kompatibel dengan ekosistem Self-Sovereign Identity berbasis Ethereum DID (`did:ethr`) serta dapat diverifikasi menggunakan library standar seperti `did-jwt` dan `ethr-did-resolver` tanpa kebutuhan modifikasi protokol inti.
