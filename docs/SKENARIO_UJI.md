# Skenario Uji VotingBEM

## Data Contoh

Nama pemilihan:

```text
Pemilihan Ketua BEM Primakara 2026
```

Calon:

| ID | Nama | Visi-Misi |
| --- | --- | --- |
| 0 | Calon 01 | Mewujudkan BEM yang transparan, responsif, dan kolaboratif. |
| 1 | Calon 02 | Menguatkan advokasi mahasiswa dan digitalisasi layanan organisasi. |

## Uji Normal

| No | Aksi | Aktor | Hasil yang Diharapkan |
| --- | --- | --- | --- |
| 1 | Deploy contract | Admin | `admin` berisi alamat deployer dan status `Persiapan`. |
| 2 | Tambah 2 calon | Admin | `getJumlahCalon()` bernilai `2`. |
| 3 | Daftarkan pemilih | Admin | `getJumlahPemilihTerdaftar()` bertambah. |
| 4 | Mulai pemilihan | Admin | Status berubah menjadi `Berjalan`. |
| 5 | Berikan suara | Pemilih terdaftar | `totalSuaraMasuk()` bertambah dan event `SuaraDiberikan` tercatat. |
| 6 | Akhiri pemilihan | Admin | Status berubah menjadi `Selesai`. |
| 7 | Lihat pemenang | Semua aktor | `getPemenang()` mengembalikan hasil akhir. |

## Uji Abnormal

| No | Aksi | Hasil yang Diharapkan |
| --- | --- | --- |
| 1 | Non-admin memanggil `tambahCalon` | Gagal dengan pesan admin. |
| 2 | Pemilih tidak terdaftar memanggil `berikanSuara` | Gagal dengan pesan tidak terdaftar. |
| 3 | Pemilih yang sama memilih dua kali | Gagal dengan pesan sudah memilih. |
| 4 | Admin menambah calon setelah pemilihan berjalan | Gagal karena fase tidak valid. |
| 5 | Pemilih memilih setelah pemilihan selesai | Gagal karena fase tidak valid. |

## Checklist Demo

- Contract berhasil compile di Remix.
- Contract berhasil deploy di Remix-VM.
- Minimal 2 calon berhasil ditambahkan.
- Minimal 2 alamat pemilih berhasil didaftarkan.
- Satu pemilih berhasil memberikan suara.
- Percobaan double-voting gagal.
- Percobaan akses admin dari akun biasa gagal.
- Hasil akhir dan event transaksi dapat ditampilkan.
- Alamat contract atau hash transaksi dapat dicari di Etherscan testnet.
