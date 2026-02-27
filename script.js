lucide.createIcons();

// Data State
let assets = JSON.parse(localStorage.getItem('wg_assets')) || [
    { id: 1, name: 'פנסיה', balance: 180000, fee: 1.5, activeInSim: true },
    { id: 2, name: 'עו"ש', balance: 45000, fee: 0, activeInSim: false }
];

let insurances = JSON.parse(localStorage.getItem('wg_insurances')) || [
    { id: 1, name: 'בריאות', cost: 180, avg: 150 },
    { id: 2, name: 'חיים', cost: 90, avg: 110 }
];

let budget = JSON.parse(localStorage.getItem('wg_budget')) || [
    { month: 'ינואר', income: 18500, expense: 12000 },
    { month: 'פברואר', income: 18500, expense: 10500 }
];

let charts = {};

function updateDashboard() {
    save();
    renderAll();
    
    const totalA = assets.reduce((s, a) => s + Number(a.balance), 0);
    const totalI = insurances.reduce((s, i) => s + Number(i.cost), 0);
    const avgFlow = budget.length ? budget.reduce((s, b) => s + (b.income - b.expense), 0) / budget.length : 0;
    
    document.getElementById('sum-assets').innerText = formatILS(totalA);
    document.getElementById('sum-insurance').innerText = formatILS(totalI);
    document.getElementById('avg-flow').innerText = formatILS(avgFlow);
    
    runSimulator(totalA);
    updateCharts();
}

// Simulator Logic (Selective)
function runSimulator(currentTotal) {
    const monthly = Number(document.getElementById('sim-monthly').value);
    const yieldRate = Number(document.getElementById('sim-yield').value) / 100;
    const years = Number(document.getElementById('sim-years').value);
    
    // Only start with balance of checked assets
    let startingBalance = assets
        .filter(a => a.activeInSim)
        .reduce((s, a) => s + Number(a.balance), 0);
        
    let total = startingBalance;
    const history = [];
    
    for(let i=0; i <= years; i++) {
        history.push(total);
        total = (total + (monthly * 12)) * (1 + yieldRate);
    }
    
    const final = history[history.length - 1];
    document.getElementById('sim-result').innerText = formatILS(final);
    document.getElementById('growth-kpi').innerText = formatILS(final);
    
    updateGrowthChart(history);
}

// Rendering Logic
function renderAll() {
    // Assets Table
    document.getElementById('asset-body').innerHTML = assets.map((a, i) => `
        <tr>
            <td class="py-3 font-bold text-white"><input type="text" value="${a.name}" class="bg-transparent border-none w-20 text-xs" onchange="edit('a',${i},'name',this.value)"></td>
            <td>₪<input type="number" value="${a.balance}" class="bg-transparent border-none w-20 text-xs font-mono text-cyan-400" onchange="edit('a',${i},'balance',this.value)"></td>
            <td><input type="number" step="0.1" value="${a.fee}" class="bg-transparent border-none w-10 text-xs ${a.fee > 1 ? 'text-red-400' : 'text-emerald-400'}" onchange="edit('a',${i},'fee',this.value)">%</td>
            <td class="text-[9px] italic opacity-60">${a.fee > 1 ? 'דמי ניהול גבוהים! כדאי להתמקח' : 'דמי ניהול תקינים'}</td>
            <td><button onclick="remove('a',${i})" class="text-red-900">✕</button></td>
        </tr>
    `).join('');

    // Insurance Table
    document.getElementById('insurance-body').innerHTML = insurances.map((ins, i) => `
        <tr>
            <td class="py-3 font-bold text-white"><input type="text" value="${ins.name}" class="bg-transparent border-none w-20 text-xs" onchange="edit('i',${i},'name',this.value)"></td>
            <td>₪<input type="number" value="${ins.cost}" class="bg-transparent border-none w-16 text-xs text-orange-400" onchange="edit('i',${i},'cost',this.value)"></td>
            <td class="opacity-40">₪<input type="number" value="${ins.avg}" class="bg-transparent border-none w-16 text-xs" onchange="edit('i',${i},'avg',this.value)"></td>
            <td><span class="px-2 py-0.5 rounded-full ${ins.cost > ins.avg ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}">${ins.cost > ins.avg ? 'גבוה' : 'תקין'}</span></td>
            <td><button onclick="remove('i',${i})" class="text-red-900">✕</button></td>
        </tr>
    `).join('');

    // Budget List
    document.getElementById('budget-list').innerHTML = budget.map((b, i) => `
        <div class="bg-[#111827] p-3 rounded-xl border border-gray-800 text-[11px] relative group">
            <div class="flex justify-between font-bold mb-2">
                <input type="text" value="${b.month}" class="bg-transparent border-none w-16" onchange="edit('b',${i},'month',this.value)">
                <button onclick="remove('b',${i})" class="opacity-0 group-hover:opacity-100 text-red-500 transition">✕</button>
            </div>
            <div class="flex justify-between mb-1"><span>הכנסה:</span><input type="number" value="${b.income}" class="bg-transparent text-emerald-400 w-16 text-left" onchange="edit('b',${i},'income',this.value)"></div>
            <div class="flex justify-between"><span>הוצאה:</span><input type="number" value="${b.expense}" class="bg-transparent text-red-400 w-16 text-left" onchange="edit('b',${i},'expense',this.value)"></div>
        </div>
    `).join('');

    // Selectors for Sim
    document.getElementById('asset-selectors').innerHTML = '<p class="text-slate-500 mb-2">כלול בסימולטור:</p>' + assets.map((a, i) => `
        <label class="flex items-center gap-2 cursor-pointer hover:text-white transition">
            <input type="checkbox" ${a.activeInSim ? 'checked' : ''} onchange="edit('a',${i},'activeInSim',this.checked)" class="accent-cyan-400">
            ${a.name}
        </label>
    `).join('');
}

// Chart Helpers
function updateCharts() {
    // Pie Chart
    const ctxPie = document.getElementById('pieChart').getContext('2d');
    if(charts.pie) charts.pie.destroy();
    charts.pie = new Chart(ctxPie, {
        type: 'doughnut',
        data: {
            labels: assets.map(a => a.name),
            datasets: [{ data: assets.map(a => a.balance), backgroundColor: ['#22d3ee', '#10b981', '#f59e0b', '#6366f1', '#ec4899'], borderWidth: 0 }]
        },
        options: { plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', boxWidth: 10, font: { size: 10 } } } }, cutout: '75%' }
    });

    // Budget Line Chart
    const ctxBud = document.getElementById('budgetChart').getContext('2d');
    if(charts.bud) charts.bud.destroy();
    charts.bud = new Chart(ctxBud, {
        type: 'line',
        data: {
            labels: budget.map(b => b.month),
            datasets: [
                { label: 'הכנסות', data: budget.map(b => b.income), borderColor: '#10b981', tension: 0.3 },
                { label: 'הוצאות', data: budget.map(b => b.expense), borderColor: '#ef4444', tension: 0.3 }
            ]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            scales: { 
                y: { grid: { color: '#1f2937' }, ticks: { color: '#64748b' } },
                x: { grid: { display: false }, ticks: { color: '#64748b' } }
            },
            plugins: { legend: { labels: { color: '#f8fafc' } } }
        }
    });
}

function updateGrowthChart(history) {
    const ctxG = document.getElementById('growthChart').getContext('2d');
    if(charts.growth) charts.growth.destroy();
    charts.growth = new Chart(ctxG, {
        type: 'line',
        data: {
            labels: history.map((_, i) => i),
            datasets: [{ data: history, borderColor: '#22d3ee', fill: true, backgroundColor: 'rgba(34,211,238,0.05)', tension: 0.4, pointRadius: 0 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }
    });
}

// Global Actions
window.edit = (t, i, k, v) => {
    if(t === 'a') assets[i][k] = v;
    else if(t === 'i') insurances[i][k] = v;
    else if(t === 'b') budget[i][k] = v;
    updateDashboard();
};

window.addItem = (t) => {
    if(t === 'asset') assets.push({id: Date.now(), name: 'נכס חדש', balance: 0, fee: 1, activeInSim: true});
    else insurances.push({id: Date.now(), name: 'ביטוח חדש', cost: 0, avg: 100});
    updateDashboard();
};

window.addMonth = () => {
    budget.push({ month: 'חודש...', income: 0, expense: 0 });
    updateDashboard();
};

window.remove = (t, i) => {
    if(t === 'a') assets.splice(i, 1);
    else if(t === 'i') insurances.splice(i, 1);
    else if(t === 'b') budget.splice(i, 1);
    updateDashboard();
};

// Utils
function formatILS(num) { return '₪' + Math.round(num).toLocaleString(); }
function save() {
    localStorage.setItem('wg_assets', JSON.stringify(assets));
    localStorage.setItem('wg_insurances', JSON.stringify(insurances));
    localStorage.setItem('wg_budget', JSON.stringify(budget));
}

// Export Fixed
window.exportToPDF = async () => {
    const { jsPDF } = window.jspdf;
    const element = document.getElementById('export-container');
    const canvas = await html2canvas(element, { backgroundColor: '#0B0F19', scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF('l', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save("WealthGuard_Report.pdf");
};

window.exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(assets), "Assets");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(insurances), "Insurance");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(budget), "Budget");
    XLSX.writeFile(wb, "WealthGuard_Full_Report.xlsx");
};

// Init
updateDashboard();
