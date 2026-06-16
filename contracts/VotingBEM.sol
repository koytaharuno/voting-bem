// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title VotingBEM
/// @notice Smart contract pemilihan Ketua BEM dengan fase persiapan, voting, dan rekapitulasi.
contract VotingBEM {
    enum StatusPemilihan {
        Persiapan,
        Berjalan,
        Selesai
    }

    struct Calon {
        uint256 id;
        string nama;
        string visiMisi;
        uint256 jumlahSuara;
    }

    struct Pemilih {
        bool terdaftar;
        bool sudahMemilih;
        uint256 pilihanCalonId;
        uint256 timestampMemilih;
    }

    address public immutable admin;
    string public namaPemilihan;
    StatusPemilihan public statusSaatIni;
    uint256 public totalSuaraMasuk;

    Calon[] private daftarCalon;
    mapping(address => Pemilih) public dataPemilih;
    address[] private alamatPemilihTerdaftar;

    event CalonDitambahkan(uint256 indexed id, string nama, string visiMisi);
    event PemilihDidaftarkan(address indexed pemilih);
    event PemilihBatchDidaftarkan(uint256 jumlahPemilih);
    event PemilihanDimulai(uint256 timestamp);
    event PemilihanSelesai(uint256 timestamp);
    event SuaraDiberikan(address indexed pemilih, uint256 indexed calonId, uint256 timestamp);

    modifier hanyaAdmin() {
        require(msg.sender == admin, "Hanya admin yang dapat melakukan tindakan ini.");
        _;
    }

    modifier hanyaStatus(StatusPemilihan statusYangDibutuhkan) {
        require(statusSaatIni == statusYangDibutuhkan, "Tindakan tidak valid pada fase saat ini.");
        _;
    }

    modifier alamatValid(address alamat) {
        require(alamat != address(0), "Alamat tidak boleh address(0).");
        _;
    }

    constructor(string memory _namaPemilihan) {
        require(bytes(_namaPemilihan).length > 0, "Nama pemilihan wajib diisi.");

        admin = msg.sender;
        namaPemilihan = _namaPemilihan;
        statusSaatIni = StatusPemilihan.Persiapan;
    }

    function tambahCalon(
        string memory _nama,
        string memory _visiMisi
    ) external hanyaAdmin hanyaStatus(StatusPemilihan.Persiapan) {
        require(bytes(_nama).length > 0, "Nama calon wajib diisi.");
        require(bytes(_visiMisi).length > 0, "Visi-misi calon wajib diisi.");

        uint256 calonId = daftarCalon.length;
        daftarCalon.push(Calon(calonId, _nama, _visiMisi, 0));

        emit CalonDitambahkan(calonId, _nama, _visiMisi);
    }

    function daftarkanPemilih(
        address _pemilih
    ) public hanyaAdmin hanyaStatus(StatusPemilihan.Persiapan) alamatValid(_pemilih) {
        require(!dataPemilih[_pemilih].terdaftar, "Pemilih sudah terdaftar.");

        dataPemilih[_pemilih] = Pemilih({
            terdaftar: true,
            sudahMemilih: false,
            pilihanCalonId: 0,
            timestampMemilih: 0
        });
        alamatPemilihTerdaftar.push(_pemilih);

        emit PemilihDidaftarkan(_pemilih);
    }

    function daftarkanPemilihBatch(
        address[] calldata _daftarPemilih
    ) external hanyaAdmin hanyaStatus(StatusPemilihan.Persiapan) {
        require(_daftarPemilih.length > 0, "Daftar pemilih tidak boleh kosong.");

        for (uint256 i = 0; i < _daftarPemilih.length; i++) {
            daftarkanPemilih(_daftarPemilih[i]);
        }

        emit PemilihBatchDidaftarkan(_daftarPemilih.length);
    }

    function mulaiPemilihan() external hanyaAdmin hanyaStatus(StatusPemilihan.Persiapan) {
        require(daftarCalon.length >= 2, "Pemilihan minimal membutuhkan 2 calon.");
        require(alamatPemilihTerdaftar.length > 0, "Minimal 1 pemilih harus terdaftar.");

        statusSaatIni = StatusPemilihan.Berjalan;

        emit PemilihanDimulai(block.timestamp);
    }

    function berikanSuara(uint256 _calonId) external hanyaStatus(StatusPemilihan.Berjalan) {
        Pemilih storage pemilih = dataPemilih[msg.sender];

        require(pemilih.terdaftar, "Anda tidak terdaftar sebagai pemilih.");
        require(!pemilih.sudahMemilih, "Anda sudah memberikan hak suara.");
        require(_calonId < daftarCalon.length, "ID calon tidak valid.");

        pemilih.sudahMemilih = true;
        pemilih.pilihanCalonId = _calonId;
        pemilih.timestampMemilih = block.timestamp;

        daftarCalon[_calonId].jumlahSuara += 1;
        totalSuaraMasuk += 1;

        emit SuaraDiberikan(msg.sender, _calonId, block.timestamp);
    }

    function akhiriPemilihan() external hanyaAdmin hanyaStatus(StatusPemilihan.Berjalan) {
        statusSaatIni = StatusPemilihan.Selesai;

        emit PemilihanSelesai(block.timestamp);
    }

    function getCalon(uint256 _calonId) external view returns (Calon memory) {
        require(_calonId < daftarCalon.length, "ID calon tidak valid.");
        return daftarCalon[_calonId];
    }

    function getSemuaCalon() external view returns (Calon[] memory) {
        return daftarCalon;
    }

    function getJumlahCalon() external view returns (uint256) {
        return daftarCalon.length;
    }

    function getJumlahPemilihTerdaftar() external view returns (uint256) {
        return alamatPemilihTerdaftar.length;
    }

    function getAlamatPemilihTerdaftar() external view returns (address[] memory) {
        return alamatPemilihTerdaftar;
    }

    function getStatusLabel() external view returns (string memory) {
        if (statusSaatIni == StatusPemilihan.Persiapan) {
            return "Persiapan";
        }

        if (statusSaatIni == StatusPemilihan.Berjalan) {
            return "Berjalan";
        }

        return "Selesai";
    }

    function getPemenang()
        external
        view
        hanyaStatus(StatusPemilihan.Selesai)
        returns (
            uint256 id,
            string memory nama,
            string memory visiMisi,
            uint256 jumlahSuara,
            bool seri
        )
    {
        require(daftarCalon.length > 0, "Belum ada calon.");

        uint256 idPemenang = 0;
        bool hasilSeri = false;

        for (uint256 i = 1; i < daftarCalon.length; i++) {
            if (daftarCalon[i].jumlahSuara > daftarCalon[idPemenang].jumlahSuara) {
                idPemenang = i;
                hasilSeri = false;
            } else if (daftarCalon[i].jumlahSuara == daftarCalon[idPemenang].jumlahSuara) {
                hasilSeri = true;
            }
        }

        Calon memory calonMenang = daftarCalon[idPemenang];

        return (
            calonMenang.id,
            calonMenang.nama,
            calonMenang.visiMisi,
            calonMenang.jumlahSuara,
            hasilSeri
        );
    }
}
