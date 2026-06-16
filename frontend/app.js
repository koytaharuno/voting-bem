import * as ethers from "./vendor/ethers.min.js";

const state = {
  abi: null,
  provider: null,
  signer: null,
  contract: null,
  contractAddress: "",
  account: "",
  admin: "",
  chainId: "",
  candidates: [],
  status: null,
};

const els = {
  networkPill: document.querySelector("#networkPill"),
  phasePill: document.querySelector("#phasePill"),
  rolePill: document.querySelector("#rolePill"),
  contractAddress: document.querySelector("#contractAddress"),
  connectWalletButton: document.querySelector("#connectWalletButton"),
  loadContractButton: document.querySelector("#loadContractButton"),
  refreshButton: document.querySelector("#refreshButton"),
  accountValue: document.querySelector("#accountValue"),
  adminValue: document.querySelector("#adminValue"),
  electionNameValue: document.querySelector("#electionNameValue"),
  candidateCount: document.querySelector("#candidateCount"),
  voterCount: document.querySelector("#voterCount"),
  voteCount: document.querySelector("#voteCount"),
  voterState: document.querySelector("#voterState"),
  candidateForm: document.querySelector("#candidateForm"),
  candidateName: document.querySelector("#candidateName"),
  candidateVision: document.querySelector("#candidateVision"),
  voterForm: document.querySelector("#voterForm"),
  voterAddresses: document.querySelector("#voterAddresses"),
  startElectionButton: document.querySelector("#startElectionButton"),
  endElectionButton: document.querySelector("#endElectionButton"),
  voteCandidateList: document.querySelector("#voteCandidateList"),
  submitVoteButton: document.querySelector("#submitVoteButton"),
  resultList: document.querySelector("#resultList"),
  winnerBadge: document.querySelector("#winnerBadge"),
  loadEventsButton: document.querySelector("#loadEventsButton"),
  eventList: document.querySelector("#eventList"),
  toast: document.querySelector("#toast"),
};

const STATUS_LABELS = ["Persiapan", "Berjalan", "Selesai"];
const EXPLORERS = {
  "1": "https://etherscan.io",
  "11155111": "https://sepolia.etherscan.io",
  "17000": "https://holesky.etherscan.io",
};

init();

async function init() {
  els.contractAddress.value = localStorage.getItem("votingbem.contractAddress") || "";
  setEmptyState();

  try {
    const response = await fetch("./abi/VotingBEM.json");
    state.abi = await response.json();
  } catch (error) {
    notify("ABI contract gagal dimuat. Jalankan frontend melalui server lokal.");
    console.error(error);
  } finally {
    setActionState();
  }

  bindEvents();
}

function bindEvents() {
  els.connectWalletButton.addEventListener("click", connectWallet);
  els.loadContractButton.addEventListener("click", loadContractFromInput);
  els.refreshButton.addEventListener("click", refreshContractData);
  els.candidateForm.addEventListener("submit", handleAddCandidate);
  els.voterForm.addEventListener("submit", handleRegisterVoters);
  els.startElectionButton.addEventListener("click", () => sendTransaction("mulaiPemilihan"));
  els.endElectionButton.addEventListener("click", () => sendTransaction("akhiriPemilihan"));
  els.submitVoteButton.addEventListener("click", handleVote);
  els.loadEventsButton.addEventListener("click", loadEvents);

  if (window.ethereum) {
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", () => window.location.reload());
  }
}

function setEmptyState() {
  els.voteCandidateList.innerHTML = `<div class="empty-state">Belum ada data calon.</div>`;
  els.resultList.innerHTML = `<div class="empty-state">Hasil belum dimuat.</div>`;
  els.eventList.innerHTML = `<div class="empty-state">Event belum dimuat.</div>`;
  setActionState();
}

async function connectWallet() {
  if (!window.ethereum) {
    notify("MetaMask belum terdeteksi di browser ini.");
    return;
  }

  try {
    await window.ethereum.request({ method: "eth_requestAccounts" });
    state.provider = new ethers.BrowserProvider(window.ethereum);
    state.signer = await state.provider.getSigner();
    state.account = await state.signer.getAddress();
    const network = await state.provider.getNetwork();
    state.chainId = network.chainId.toString();

    els.accountValue.textContent = formatAddress(state.account);
    els.networkPill.textContent = `Jaringan: ${network.name || "Chain"} (${state.chainId})`;
    notify("Wallet terhubung.");

    if (state.contractAddress) {
      await attachContract(state.contractAddress);
    }

    setActionState();
  } catch (error) {
    handleError(error);
  }
}

async function handleAccountsChanged(accounts) {
  state.account = accounts?.[0] || "";
  els.accountValue.textContent = state.account ? formatAddress(state.account) : "-";

  if (state.provider) {
    state.signer = await state.provider.getSigner();
  }

  if (state.contractAddress) {
    await attachContract(state.contractAddress);
  }
}

async function loadContractFromInput() {
  const address = els.contractAddress.value.trim();
  if (!ethers.isAddress(address)) {
    notify("Alamat contract tidak valid.");
    return;
  }

  await attachContract(address);
}

async function attachContract(address) {
  if (!state.abi) {
    notify("ABI belum siap.");
    return;
  }

  if (!window.ethereum) {
    notify("MetaMask belum terdeteksi di browser ini.");
    return;
  }

  if (!state.provider) {
    state.provider = new ethers.BrowserProvider(window.ethereum);
  }

  if (!state.signer) {
    state.signer = await state.provider.getSigner();
  }

  const code = await state.provider.getCode(address);
  if (code === "0x") {
    notify("Address ini bukan smart contract di jaringan MetaMask aktif. Pastikan memakai alamat contract, bukan alamat wallet admin.");
    return;
  }

  const nextContract = new ethers.Contract(address, state.abi, state.signer);
  try {
    await nextContract.admin();
  } catch (error) {
    console.error(error);
    notify("Contract ditemukan, tapi tidak cocok dengan ABI VotingBEM.");
    return;
  }

  state.contractAddress = address;
  state.contract = nextContract;
  localStorage.setItem("votingbem.contractAddress", address);

  try {
    await refreshContractData({ rethrow: true });
    notify("Contract VotingBEM berhasil dimuat.");
  } catch (error) {
    handleError(error);
  }
}

async function refreshContractData(options = {}) {
  if (!state.contract) {
    setActionState();
    return;
  }

  try {
    const [
      admin,
      namaPemilihan,
      statusSaatIni,
      daftarCalon,
      totalSuaraMasuk,
      jumlahPemilih,
    ] = await Promise.all([
      state.contract.admin(),
      state.contract.namaPemilihan(),
      state.contract.statusSaatIni(),
      state.contract.getSemuaCalon(),
      state.contract.totalSuaraMasuk(),
      state.contract.getJumlahPemilihTerdaftar(),
    ]);

    state.admin = admin;
    state.status = Number(statusSaatIni);
    state.candidates = daftarCalon.map(normalizeCandidate);

    els.adminValue.textContent = formatAddress(admin);
    els.electionNameValue.textContent = namaPemilihan;
    els.phasePill.textContent = `Fase: ${STATUS_LABELS[state.status] ?? "-"}`;
    els.candidateCount.textContent = state.candidates.length.toString();
    els.voterCount.textContent = jumlahPemilih.toString();
    els.voteCount.textContent = totalSuaraMasuk.toString();

    await renderVoterState();
    renderCandidates();
    renderResults(Number(totalSuaraMasuk));
    await renderWinner();
    setActionState();
  } catch (error) {
    if (options.rethrow) {
      throw error;
    }

    handleError(error);
  }
}

async function renderVoterState() {
  if (!state.account || !state.contract) {
    els.voterState.textContent = "Wallet belum terhubung.";
    return;
  }

  const pemilih = await state.contract.dataPemilih(state.account);
  if (!pemilih.terdaftar) {
    els.voterState.textContent = "Akun aktif belum terdaftar sebagai pemilih.";
    return;
  }

  if (pemilih.sudahMemilih) {
    const calonId = Number(pemilih.pilihanCalonId);
    els.voterState.textContent = `Akun aktif sudah memilih calon ID ${calonId}.`;
    return;
  }

  els.voterState.textContent = "Akun aktif terdaftar dan belum memilih.";
}

function renderCandidates() {
  if (state.candidates.length === 0) {
    els.voteCandidateList.innerHTML = `<div class="empty-state">Belum ada data calon.</div>`;
    return;
  }

  els.voteCandidateList.innerHTML = state.candidates
    .map(
      (candidate) => `
        <label class="candidate-option">
          <input type="radio" name="candidateId" value="${candidate.id}" />
          <span>
            <strong>#${candidate.id} ${escapeHtml(candidate.nama)}</strong>
            <p>${escapeHtml(candidate.visiMisi)}</p>
          </span>
        </label>
      `,
    )
    .join("");
}

function renderResults(totalVotes) {
  if (state.candidates.length === 0) {
    els.resultList.innerHTML = `<div class="empty-state">Hasil belum tersedia.</div>`;
    return;
  }

  els.resultList.innerHTML = state.candidates
    .map((candidate) => {
      const percentage = totalVotes === 0 ? 0 : Math.round((candidate.jumlahSuara / totalVotes) * 100);
      return `
        <article class="result-item">
          <div class="result-row">
            <strong class="result-title">#${candidate.id} ${escapeHtml(candidate.nama)}</strong>
            <span class="vote-number">${candidate.jumlahSuara} suara (${percentage}%)</span>
          </div>
          <div class="progress-track" aria-hidden="true">
            <div class="progress-bar" style="width: ${percentage}%"></div>
          </div>
        </article>
      `;
    })
    .join("");
}

async function renderWinner() {
  els.winnerBadge.textContent = "-";

  if (!state.contract || state.status !== 2 || state.candidates.length === 0) {
    return;
  }

  try {
    const winner = await state.contract.getPemenang();
    const label = winner.seri ? "Hasil seri" : `Pemenang: ${winner.nama}`;
    els.winnerBadge.textContent = `${label} (${winner.jumlahSuara} suara)`;
  } catch (error) {
    console.warn(error);
  }
}

async function handleAddCandidate(event) {
  event.preventDefault();

  const nama = els.candidateName.value.trim();
  const visiMisi = els.candidateVision.value.trim();

  if (!nama || !visiMisi) {
    notify("Nama dan visi-misi calon wajib diisi.");
    return;
  }

  await sendTransaction("tambahCalon", [nama, visiMisi], () => {
    els.candidateForm.reset();
  });
}

async function handleRegisterVoters(event) {
  event.preventDefault();

  const addresses = parseAddresses(els.voterAddresses.value);
  if (addresses.length === 0) {
    notify("Masukkan minimal 1 alamat wallet yang valid.");
    return;
  }

  const method = addresses.length === 1 ? "daftarkanPemilih" : "daftarkanPemilihBatch";
  const args = addresses.length === 1 ? [addresses[0]] : [addresses];

  await sendTransaction(method, args, () => {
    els.voterForm.reset();
  });
}

async function handleVote() {
  const selected = document.querySelector('input[name="candidateId"]:checked');
  if (!selected) {
    notify("Pilih salah satu calon terlebih dahulu.");
    return;
  }

  await sendTransaction("berikanSuara", [BigInt(selected.value)]);
}

async function sendTransaction(method, args = [], afterSuccess = null) {
  if (!state.contract) {
    notify("Muat contract terlebih dahulu.");
    return;
  }

  try {
    setBusy(true);
    const tx = await state.contract[method](...args);
    notify(`Transaksi dikirim: ${formatAddress(tx.hash)}`);
    await tx.wait();
    notify("Transaksi berhasil dikonfirmasi.");

    if (afterSuccess) {
      afterSuccess();
    }

    await refreshContractData();
    await loadEvents();
  } catch (error) {
    handleError(error);
  } finally {
    setBusy(false);
  }
}

async function loadEvents() {
  if (!state.contract) {
    notify("Muat contract terlebih dahulu.");
    return;
  }

  try {
    const filters = [
      state.contract.filters.CalonDitambahkan(),
      state.contract.filters.PemilihDidaftarkan(),
      state.contract.filters.PemilihBatchDidaftarkan(),
      state.contract.filters.PemilihanDimulai(),
      state.contract.filters.SuaraDiberikan(),
      state.contract.filters.PemilihanSelesai(),
    ];

    const chunks = await Promise.all(filters.map((filter) => state.contract.queryFilter(filter, 0, "latest")));
    const events = chunks.flat().sort((a, b) => Number(a.blockNumber - b.blockNumber));

    if (events.length === 0) {
      els.eventList.innerHTML = `<div class="empty-state">Belum ada event contract.</div>`;
      return;
    }

    els.eventList.innerHTML = events
      .slice(-18)
      .reverse()
      .map(renderEvent)
      .join("");
  } catch (error) {
    handleError(error);
  }
}

function renderEvent(event) {
  const txUrl = getTransactionUrl(event.transactionHash);
  const eventName = event.fragment?.name || "Event";
  const values = event.args ? Array.from(event.args).map(formatEventArg).join(" | ") : "";
  const link = txUrl
    ? `<a href="${txUrl}" target="_blank" rel="noreferrer">${event.transactionHash}</a>`
    : `<p>${event.transactionHash}</p>`;

  return `
    <article class="event-item">
      <strong>${escapeHtml(eventName)}</strong>
      <p>Block ${event.blockNumber}${values ? ` | ${escapeHtml(values)}` : ""}</p>
      ${link}
    </article>
  `;
}

function setActionState() {
  const hasContract = Boolean(state.contract);
  const isAdmin = hasContract && state.account && state.admin && state.account.toLowerCase() === state.admin.toLowerCase();
  const isPreparation = state.status === 0;
  const isRunning = state.status === 1;

  els.rolePill.textContent = `Role: ${isAdmin ? "Admin" : state.account ? "Pemilih" : "-"}`;

  els.connectWalletButton.disabled = false;
  els.loadContractButton.disabled = !state.abi;
  els.refreshButton.disabled = !hasContract;
  els.loadEventsButton.disabled = !hasContract;
  els.submitVoteButton.disabled = !hasContract || !isRunning;
  els.startElectionButton.disabled = !isAdmin || !isPreparation;
  els.endElectionButton.disabled = !isAdmin || !isRunning;
  setFormDisabled(els.candidateForm, !isAdmin || !isPreparation);
  setFormDisabled(els.voterForm, !isAdmin || !isPreparation);
}

function setFormDisabled(form, disabled) {
  for (const control of form.querySelectorAll("input, textarea, button")) {
    control.disabled = disabled;
  }
}

function setBusy(isBusy) {
  for (const button of document.querySelectorAll("button")) {
    button.disabled = isBusy || button.disabled;
  }

  if (!isBusy) {
    setActionState();
  }
}

function normalizeCandidate(candidate) {
  return {
    id: Number(candidate.id),
    nama: candidate.nama,
    visiMisi: candidate.visiMisi,
    jumlahSuara: Number(candidate.jumlahSuara),
  };
}

function parseAddresses(raw) {
  return raw
    .split(/[\s,;]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, index, array) => ethers.isAddress(item) && array.indexOf(item) === index);
}

function getTransactionUrl(hash) {
  const baseUrl = EXPLORERS[state.chainId];
  return baseUrl ? `${baseUrl}/tx/${hash}` : "";
}

function formatAddress(address) {
  if (!address) {
    return "-";
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatEventArg(value) {
  if (typeof value === "bigint") {
    return value.toString();
  }

  return String(value);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function handleError(error) {
  console.error(error);
  const message =
    error?.shortMessage ||
    error?.reason ||
    error?.data?.message ||
    error?.message ||
    "Terjadi kesalahan transaksi.";
  notify(message);
}

function notify(message) {
  els.toast.textContent = message;
  els.toast.classList.add("is-visible");
  window.clearTimeout(notify.timeoutId);
  notify.timeoutId = window.setTimeout(() => {
    els.toast.classList.remove("is-visible");
  }, 3600);
}
