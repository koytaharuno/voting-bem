# Prosedur Implementasi Remix IDE

Dokumen ini mengikuti alur pada proposal proyek Voting BEM berbasis smart contract Ethereum.

## 1. Buat Contract Baru

1. Buka `https://remix.ethereum.org/`.
2. Pada tab **File Explorer**, buat file baru bernama `VotingBEM.sol`.
3. Salin isi file `contracts/VotingBEM.sol` ke editor Remix.

## 2. Compile Solidity

1. Buka tab **Solidity Compiler**.
2. Gunakan compiler `0.8.20` atau versi `0.8.x` yang lebih baru.
3. Klik **Compile VotingBEM.sol**.
4. Pastikan tidak ada error berwarna merah.

## 3. Deploy Lokal di Remix-VM

1. Buka tab **Deploy & Run Transactions**.
2. Pilih environment **Remix VM (Shanghai)**.
3. Isi constructor `_namaPemilihan`, contoh:

```text
Pemilihan Ketua BEM Primakara 2026
```

4. Klik **Deploy**.

## 4. Pengujian Fungsi Admin

Gunakan akun deployer sebagai admin.

1. Jalankan `tambahCalon("Calon 01", "Visi-misi calon pertama")`.
2. Jalankan `tambahCalon("Calon 02", "Visi-misi calon kedua")`.
3. Jalankan `daftarkanPemilih(alamatMahasiswa)` untuk satu pemilih.
4. Jalankan `daftarkanPemilihBatch([alamat1, alamat2, alamat3])` untuk banyak pemilih.
5. Periksa `getJumlahCalon()` dan `getJumlahPemilihTerdaftar()`.
6. Jalankan `mulaiPemilihan()`.

Setelah `mulaiPemilihan()`, fungsi pendaftaran calon dan pemilih akan tertolak karena status sudah berubah dari `Persiapan` menjadi `Berjalan`.

## 5. Pengujian Fungsi Pemilih

1. Ganti akun Remix ke wallet mahasiswa yang sudah didaftarkan.
2. Jalankan `berikanSuara(calonId)`, contoh `berikanSuara(0)`.
3. Periksa `getSemuaCalon()` dan `totalSuaraMasuk()`.

## 6. Pengujian Batasan Keamanan

1. Coba pilih dua kali dari akun yang sama. Transaksi kedua harus gagal.
2. Coba memilih dari akun yang belum didaftarkan. Transaksi harus gagal.
3. Coba memanggil `tambahCalon` dari akun non-admin. Transaksi harus gagal.
4. Coba memanggil `berikanSuara` sebelum `mulaiPemilihan`. Transaksi harus gagal.
5. Coba memanggil `berikanSuara` setelah `akhiriPemilihan`. Transaksi harus gagal.

## 7. Deploy ke Testnet Sepolia atau Holesky

1. Hubungkan MetaMask ke jaringan Sepolia atau Holesky.
2. Pastikan wallet admin memiliki saldo test ETH dari faucet.
3. Di Remix, pilih **Injected Provider - MetaMask**.
4. Klik **Deploy** dan konfirmasi transaksi di MetaMask.
5. Simpan alamat contract hasil deploy.

## 8. Audit di Etherscan

1. Buka `https://sepolia.etherscan.io/` atau `https://holesky.etherscan.io/`.
2. Cari alamat contract atau hash transaksi.
3. Catat transaksi deploy, penambahan calon, pendaftaran pemilih, transaksi voting, dan penutupan pemilihan.
