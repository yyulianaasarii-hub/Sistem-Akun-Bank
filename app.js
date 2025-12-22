// Generate nomor rekening
function generateRek() {
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

// LocalStorage helper
const load = key => JSON.parse(localStorage.getItem(key)) || [];
const save = (key, data) => localStorage.setItem(key, JSON.stringify(data));

// CLASS
class User {
    constructor(username, password, role = "user") {
        this.username = username;
        this.password = password;
        this.role = role;
    }
    // ENCAPSULATION
    checkPassword(input) {
        return this.password === input;
    }
}

class Account {
    constructor(name = "", type = "", balance = 0, owner = "") {
        this.accountNumber = this.accountNumber || generateRek();
        this.name = name;
        this.type = type;
        this.balance = balance;
        this.owner = owner;
        this.history = this.history || [];
    }

    // ENCAPSULATION
    deposit(amount) {
        this.balance += amount;
        this.history.push({
            type: "deposit",
            amount,
            date: new Date()
        });
    }

    withdraw(amount) {
        if (amount > this.balance) return false;
        this.balance -= amount;
        this.history.push({
            type: "withdraw",
            amount,
            date: new Date()
        });
        return true;
    }
}

// DATA INIT
let users = load("users").map(u => Object.assign(new User(), u));
let accounts = load("accounts");
let logged = JSON.parse(localStorage.getItem("logged")) || null;

// Default admin
if (!users.find(u => u.username === "admin")) {
    users.push(new User("admin", "admin123", "admin"));
    save("users", users);
}

// AUTH
function login() {
    const u = document.getElementById("login-username").value.trim();
    const p = document.getElementById("login-password").value;

    // Admin login
    const admin = users.find(x =>
        x.username === u &&
        x.password === p &&
        x.role === "admin"
    );

    if (admin) {
        logged = admin;
        save("logged", logged);
        showDashboard();
        return;
    }

    //USER LOGIN (VERSI BARU)
    const user = users.find(x =>
        x.username === u &&
        x.role === "user" &&
        x.checkPassword(p)
    );

    if (!user) {
        alert("Username atau password user salah!");
        return;
    }

    logged = {
        username: user.username,
        role: "user"
    };

    save("logged", logged);
    showDashboard();
}

// EVENT LOGIN
document.getElementById("btn-login").onclick = login;

function logout() {
    localStorage.removeItem("logged");
    location.reload();
}

// DASHBOARD
function showDashboard() {
    document.getElementById("login-page").classList.add("hidden");
    document.getElementById("dashboard").classList.remove("hidden");

    if (logged.role !== "admin") {
        document.getElementById("menu-add-account").style.display = "none";
    }

    showPage("home");
    updateUI();
}

function showPage(id) {
    document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
    document.getElementById(id).classList.remove("hidden");
}

// FORMAT MATA UANG DALAM RUPIAH
function formatRp(n) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR"
    }).format(n);
}

// UI RENDER
function updateDashboard() {
    const myAcc = logged.role === "admin"
        ? accounts
        : accounts.filter(a => a.owner === logged.username);

    document.getElementById("total-saldo").textContent =
        formatRp(myAcc.reduce((a, b) => a + b.balance, 0));
    document.getElementById("total-akun").textContent =
        myAcc.length;
    document.getElementById("total-transaksi").textContent =
        myAcc.reduce((a, b) => a + b.history.length, 0);
}

function renderAccounts() {
    const list = document.getElementById("account-list");
    if (!list) return;

    const myAcc = logged.role === "admin"
        ? accounts
        : accounts.filter(a => a.owner === logged.username);

    list.innerHTML = myAcc.map(a => `
        <tr>
            <td>${a.accountNumber}</td>
            <td>${a.name}</td>
            <td>${a.type}</td>
            <td>${formatRp(a.balance)}</td>
            <td>${a.owner}</td>
            <td>
                <button onclick="editAccount('${a.accountNumber}')">Edit</button>
                <button onclick="deleteAccount('${a.accountNumber}')" class="danger">Hapus</button>
            </td>
        </tr>
    `).join("");
}

function renderTransactions() {
    const list = document.getElementById("transaction-list");
    if (!list) return;

    let trx = [];
    const myAcc = logged.role === "admin"
        ? accounts
        : accounts.filter(a => a.owner === logged.username);

    myAcc.forEach(a =>
        a.history.forEach(h => trx.push({ ...h, account: a.accountNumber }))
    );

    const filter = document.getElementById("filter-transaksi").value;
    if (filter !== "all") trx = trx.filter(t => t.type === filter);

    list.innerHTML = trx.map(t => `
        <li class="${t.type}">
            <strong>${t.account}</strong><br>
            ${t.type.toUpperCase()} — ${formatRp(t.amount)}<br>
            <small>${new Date(t.date).toLocaleString()}</small>
        </li>
    `).join("");
}

document.getElementById("filter-transaksi").onchange = renderTransactions;

// ACCOUNT CRUD
document.getElementById("btn-add-account").onclick = function () {
    if (logged.role !== "admin") return alert("Akses ditolak");

    const name = document.getElementById("new-account-user").value;
    const type = document.getElementById("new-account-type").value;
    const saldo = parseInt(document.getElementById("new-account-saldo").value) || 0;

    if (!name) return alert("Nama wajib diisi");

    const password = document.getElementById("new-account-password").value;
    if (!password) return alert("Password user wajib diisi");

    // Buat USER login
    const user = new User(name, password, "user");
    users.push(user);
    save("users", users);

    // Buat REKENING
    const acc = new Account(name, type, saldo, name);
    accounts.push(acc);
    save("accounts", accounts);

    alert(`Akun berhasil dibuat
    Username: ${name}
    No Rekening: ${acc.accountNumber}`);

    alert("Akun dibuat\nNo Rek: " + acc.accountNumber);
    updateUI();
};

function editAccount(rek) {
    const acc = accounts.find(a => a.accountNumber === rek);
    if (!acc) return;

    const name = prompt("Nama baru", acc.name);
    if (!name) return;

    acc.name = name;
    save("accounts", accounts);
    updateUI();
}

function deleteAccount(rek) {
    if (!confirm("Hapus akun ini?")) return;
    accounts = accounts.filter(a => a.accountNumber !== rek);
    save("accounts", accounts);
    updateUI();
}

// POLYMORPHISM
function depositMoney(rek, amount) {
    const acc = accounts.find(a => a.accountNumber === rek);
    if (!acc) return alert("Rekening tidak ditemukan");

    if (logged.role !== "admin" && acc.owner !== logged.username)
        return alert("Akses ditolak");

    acc.deposit(amount);
    save("accounts", accounts);
    updateUI();
}

function withdrawMoney(rek, amount) {
    const acc = accounts.find(a => a.accountNumber === rek);
    if (!acc) return alert("Rekening tidak ditemukan");

    if (logged.role !== "admin" && acc.owner !== logged.username)
        return alert("Akses ditolak");

    if (!acc.withdraw(amount))
        return alert("Saldo tidak cukup");

    save("accounts", accounts);
    updateUI();
}

document.getElementById("btn-deposit").onclick = () => {
    const rek = document.getElementById("cash-account-deposit").value;
    const amt = parseInt(document.getElementById("cash-amount-deposit").value);
    if (amt > 0) depositMoney(rek, amt);
};

document.getElementById("btn-withdraw").onclick = () => {
    const rek = document.getElementById("cash-account-withdraw").value;
    const amt = parseInt(document.getElementById("cash-amount-withdraw").value);
    if (amt > 0) withdrawMoney(rek, amt);
};

document.getElementById("btn-transfer").onclick = () => {
    const from = document.getElementById("transfer-from").value;
    const to = document.getElementById("transfer-to").value;
    const amt = parseInt(document.getElementById("transfer-amount").value);
    if (!amt || amt <= 0) return;

    const a = accounts.find(x => x.accountNumber === from);
    const b = accounts.find(x => x.accountNumber === to);

    if (!a || !b || from === to || a.balance < amt)
        return alert("Transfer gagal");

    a.balance -= amt;
    b.balance += amt;

    a.history.push({ type: "transfer_out", amount: amt, date: new Date() });
    b.history.push({ type: "transfer_in", amount: amt, date: new Date() });

    save("accounts", accounts);
    updateUI();
};

// DROPDOWN
function renderCashDropdown() {
    const myAcc = logged.role === "admin"
        ? accounts
        : accounts.filter(a => a.owner === logged.username);

    const opt = myAcc.map(a =>
        `<option value="${a.accountNumber}">${a.name} (${a.accountNumber})</option>`
    ).join("");

    document.getElementById("cash-account-deposit").innerHTML = opt;
    document.getElementById("cash-account-withdraw").innerHTML = opt;
}

function renderTransferDropdown() {
    const fromOpt = (logged.role === "admin" ? accounts : accounts.filter(a => a.owner === logged.username))
        .map(a => `<option value="${a.accountNumber}">${a.name}</option>`).join("");

    const toOpt = accounts
        .map(a => `<option value="${a.accountNumber}">${a.name}</option>`).join("");

    document.getElementById("transfer-from").innerHTML = fromOpt;
    document.getElementById("transfer-to").innerHTML = toOpt;
}

// UPDATE UI 
function updateUI() {
    // 🔥 revive object method dari LocalStorage
    accounts = accounts.map(a => Object.assign(new Account(), a));

    updateDashboard();
    renderAccounts();
    renderTransactions();
    renderCashDropdown();
    renderTransferDropdown();
}

// AUTO LOGIN
if (logged) showDashboard();