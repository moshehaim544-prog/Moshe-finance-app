lucide.createIcons();

// --- STATE MANAGEMENT ---
let data = JSON.parse(localStorage.getItem('moshe_finance_v1')) || {
    assets: [
        { name: "פנסיה הראל", amount: 280000, fee: "0.22%" },
        { name: "השתלמות אלטשולר", amount: 115000, fee: "0.5%" },
        { name: "עובר ושב", amount: 45000, fee: "0%" }
    ],
    budget: {
        "2026-02": {
            income: [{ desc: "משכורת Allot", amount: 22000 }],
            expense: [{ desc: "משכנתא", amount: 6500 }, { desc: "רכב", amount: 1200 }]
        }
    }
};

let currentMonth = "2026-02";
let assetChart;

// --- TAB SWITCHER ---
function switchTab(tabId, el) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-link').forEach(l => l.classList.remove('active'));
    document.getElementById(`tab-${tabId}`).classList.add('active');
    el.classList.add('active');
    
    if(tabId === 'assets') renderAssets();
    if(tabId === 'budget') renderBudget();
}

// --- ASSETS LOGIC ---
function renderAssets() {
    const list = document.getElementById('asset-list');
    list.innerHTML = '';
    let total = 0;
    
    data.assets.forEach((asset, index) => {
        total += asset.amount;
        list.innerHTML += `
            <div class="item-card">
                <div>
                    <p class="font-bold text-sm text-slate-800">${asset.name}</p>
                    <p class="text-[10px] text-slate-400">דמי ניהול: ${asset.fee}</p>
                </div>
                <div class="flex items-center gap-4">
                    <p class="font-mono font-bold text-slate-900">₪${asset.amount.toLocaleString()}</p>
                    <button onclick="deleteAsset(${index})" class="text-slate-300 hover:text-red-500"><i data-lucide="trash-2" size="14"></i></button>
                </div>
            </div>`;
    });
    document.getElementById('net-worth-display').innerText = `₪ ${total.toLocaleString()}`;
    lucide.createIcons();
    updateChart();
    save();
}

function addAsset() {
    const name = prompt("שם הנכס:");
    const amount = parseInt(prompt("סכום:"));
    if(name && amount) {
        data.assets.push({ name, amount, fee: "0.5%" });
        renderAssets();
    }
}

function deleteAsset(index) {
    if(confirm("למחוק נכס זה?")) {
        data.assets.splice(index, 1);
        renderAssets();
    }
}

// --- BUDGET (CASHFLOW) LOGIC ---
function renderBudget() {
    const selector = document.getElementById('month-selector');
    selector.innerHTML = Object.keys(data.budget).sort().reverse()
        .map(m => `<option value="${m}" ${m===currentMonth?'selected':''}>${m}</option>`).join('');
    
    const monthData = data.budget[currentMonth];
    const incList = document.getElementById('income-list');
    const expList = document.getElementById('expense-list');
    
    let ti = 0, te = 0;
    
    incList.innerHTML = monthData.income.map((item, i) => {
        ti += item.amount;
        return `<div class="flex justify-between items-center bg-white p-3 rounded-xl border border-green-100 text-sm">
            <span>${item.desc}</span> <b class="text-green-700">₪${item.amount.toLocaleString()}</b>
            <button onclick="deleteBudgetItem('income', ${i})" class="text-slate-300">×</button>
        </div>`;
    }).join('');
    
    expList.innerHTML = monthData.expense.map((item, i) => {
        te += item.amount;
        return `<div class="flex justify-between items-center bg-white p-3 rounded-xl border border-red-100 text-sm">
            <span>${item.desc}</span> <b class="text-red-700">₪${item.amount.toLocaleString()}</b>
            <button onclick="deleteBudgetItem('expense', ${i})" class="text-slate-300">×</button>
        </div>`;
    }).join('');

    document.getElementById('total-income').innerText = `₪ ${ti.toLocaleString()}`;
    document.getElementById('total-expense').innerText = `₪ ${te.toLocaleString()}`;
    save();
}

function addBudgetItem(type) {
    const desc = prompt("תיאור:");
    const amount = parseInt(prompt("סכום:"));
    if(desc && amount) {
        data.budget[currentMonth][type].push({ desc, amount });
        renderBudget();
    }
}

function deleteBudgetItem(type, index) {
    data.budget[currentMonth][type].splice(index, 1);
    renderBudget();
}

function addNewMonth() {
    const m = prompt("הכנס חודש (YYYY-MM):", "2026-03");
    if(m && !data.budget[m]) {
        data.budget[m] = { income: [], expense: [] };
        currentMonth = m;
        renderBudget();
    }
}

function loadBudgetMonth() {
    currentMonth = document.getElementById('month-selector').value;
    renderBudget();
}

// --- SIMULATOR ---
function runSimulation() {
    const monthly = parseFloat(document.getElementById('sim-monthly').value);
    const annualReturn = parseFloat(document.getElementById('sim-return').value) / 100;
    const years = parseInt(document.getElementById('sim-years').value);
    
    let total = 0, principal = 0;
    for (let i = 0; i < years * 12; i++) {
        total = (total + monthly) * (1 + annualReturn / 12);
        principal += monthly;
    }
    
    const profit = total - principal;
    const afterTax = total - (profit * 0.25);
    
    document.getElementById('sim-result').classList.remove('hidden');
    document.getElementById('sim-total-value').innerText = `₪ ${Math.round(afterTax).toLocaleString()}`;
}

// --- HELPERS & EXPORT ---
function save() { localStorage.setItem('moshe_finance_v1', JSON.stringify(data)); }

function updateChart() {
    const ctx = document.getElementById('assetChart').getContext('2d');
    if(assetChart) assetChart.destroy();
    assetChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.assets.map(a => a.name),
            datasets: [{ 
                data: data.assets.map(a => a.amount), 
                backgroundColor: ['#0f172a', '#3b82f6', '#8b5cf6', '#6366f1'],
                borderWidth: 5,
                borderColor: '#ffffff'
            }]
        },
        options: { cutout: '80%', plugins: { legend: { display: false } }, maintainAspectRatio: false }
    });
}

function exportToExcel() {
    const rows = [["Type", "Description", "Amount"]];
    data.assets.forEach(a => rows.push(["Asset", a.name, a.amount]));
    data.budget[currentMonth].income.forEach(i => rows.push(["Income", i.desc, i.amount]));
    data.budget[currentMonth].expense.forEach(e => rows.push(["Expense", e.desc, e.amount]));
    
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Finance_Report");
    XLSX.writeFile(wb, `Moshe_Finance_${currentMonth}.xlsx`);
}

function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text(`Finance Report - Moshe Haim - ${currentMonth}`, 10, 10);
    const body = data.assets.map(a => [a.name, a.amount.toLocaleString()]);
    doc.autoTable({ head: [['Asset', 'Balance']], body: body, startY: 20 });
    doc.save(`Finance_${currentMonth}.pdf`);
}

window.onload = () => { renderAssets(); };
