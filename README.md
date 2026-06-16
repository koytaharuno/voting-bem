# VotingBEM - Smart Contract Voting Ketua BEM

Implementasi ini dibuat dari dokumen perencanaan proyek `Sistem Voting Ketua BEM Berbasis Smart Contract Blockchain`.

## Struktur Project

```text
contracts/VotingBEM.sol          Smart contract utama Solidity
frontend/index.html              Dashboard Web3 untuk admin, pemilih, hasil, dan audit event
frontend/app.js                  Integrasi MetaMask + ethers.js
frontend/styles.css              Tampilan dashboard
frontend/abi/VotingBEM.json      ABI contract untuk frontend
frontend/vendor/ethers.min.js
frontend/vendor/ethers.LICENSE.txt
docs/PROSEDUR_REMIX.md           Langkah compile, deploy, testnet, dan Etherscan
docs/SKENARIO_UJI.md             Skenario uji normal dan abnormal
docs/ARSITEKTUR.md               Aktor, fase, struktur data, dan keamanan
scripts/contoh-data-pengujian.json
```

## Cara Pakai di Remix

1. Buka `https://remix.ethereum.org/`.
2. Buat file `VotingBEM.sol`.
3. Salin isi `contracts/VotingBEM.sol`.
4. Compile dengan Solidity `0.8.20` atau `0.8.x`.
5. Deploy dengan constructor:

```text
Pemilihan Ketua BEM Primakara 2026
```

6. Ikuti urutan:
   `tambahCalon` -> `daftarkanPemilih` / `daftarkanPemilihBatch` -> `mulaiPemilihan` -> `berikanSuara` -> `akhiriPemilihan` -> `getPemenang`.

Panduan detail ada di `docs/PROSEDUR_REMIX.md`.

## Cara Pakai Frontend

Jalankan server statis dari folder project:

```bash
python3 -m http.server 5173 --directory frontend
```

Buka:

```text
http://localhost:5173
```

Alur frontend:

1. Hubungkan MetaMask.
2. Masukkan alamat contract hasil deploy.
3. Klik **Muat Contract**.
4. Admin menambah calon dan pemilih saat fase `Persiapan`.
5. Admin memulai pemilihan.
6. Pemilih terdaftar mengirim suara.
7. Admin mengakhiri pemilihan.
8. Hasil dan event audit dapat dibaca dari dashboard.

## Troubleshooting Frontend

Kolom **Alamat Contract** harus diisi dengan alamat smart contract `VotingBEM` hasil deploy, bukan alamat wallet admin.

Contoh yang benar:

```text
Alamat contract dari panel Deployed Contracts Remix atau hash deploy Etherscan
```

Contoh yang salah:

```text
Alamat wallet admin/deployer
```

Jika contract dideploy di **Remix VM**, frontend MetaMask tidak bisa membacanya karena Remix VM hanya jaringan lokal internal Remix. Untuk frontend ini, deploy contract lewat **Injected Provider - MetaMask** ke Sepolia/Holesky, lalu masukkan alamat contract testnet tersebut.

## Catatan Testnet

Frontend otomatis membuat tautan transaksi untuk:

- Ethereum Mainnet
- Sepolia
- Holesky

Untuk demo sesuai dokumen, gunakan Sepolia atau Holesky agar transaksi bisa diaudit lewat Etherscan.
