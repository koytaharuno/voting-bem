# Arsitektur Sistem VotingBEM

## Aktor

| Aktor | Hak Akses |
| --- | --- |
| Admin/KPU | Deploy contract, menambah calon, mendaftarkan pemilih, memulai pemilihan, mengakhiri pemilihan. |
| Pemilih/Mahasiswa | Memberikan satu suara jika alamat wallet sudah terdaftar. |
| Publik/Auditor | Membaca data calon, jumlah suara, status pemilihan, pemenang, dan event transaksi. |

## Fase Pemilihan

```mermaid
flowchart LR
  A["Persiapan"] -->|"mulaiPemilihan()"| B["Berjalan"]
  B -->|"akhiriPemilihan()"| C["Selesai"]
```

## Struktur Data Contract

| Data | Tipe | Fungsi |
| --- | --- | --- |
| `Calon` | Struct | Menyimpan ID, nama, visi-misi, dan jumlah suara. |
| `Pemilih` | Struct | Menyimpan status terdaftar, status sudah memilih, pilihan, dan timestamp. |
| `dataPemilih` | Mapping | Validasi hak pilih per alamat wallet. |
| `daftarCalon` | Array | Penyimpanan seluruh kandidat. |
| `alamatPemilihTerdaftar` | Array | Audit jumlah dan daftar alamat pemilih sah. |

## Keamanan yang Diterapkan

| Mekanisme | Implementasi |
| --- | --- |
| Access control | Modifier `hanyaAdmin`. |
| One person one vote | Mapping `dataPemilih` dan flag `sudahMemilih`. |
| Fase terkunci | Modifier `hanyaStatus`. |
| Integritas hasil | Suara disimpan di state blockchain dan tidak dapat diubah manual. |
| Audit transaksi | Event `CalonDitambahkan`, `PemilihDidaftarkan`, `SuaraDiberikan`, `PemilihanDimulai`, dan `PemilihanSelesai`. |

## Alur Program

1. Admin deploy contract dengan nama pemilihan.
2. Admin menambahkan minimal 2 calon.
3. Admin mendaftarkan wallet mahasiswa.
4. Admin memulai pemilihan.
5. Pemilih terdaftar memberikan suara satu kali.
6. Admin mengakhiri pemilihan.
7. Semua pihak membaca rekapitulasi hasil dan event transaksi.
