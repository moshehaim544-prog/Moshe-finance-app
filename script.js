// Initialize Icons
lucide.createIcons();

// Data Storage Logic
let assets = JSON.parse(localStorage.getItem('erp_assets')) || [
    { id: '1', name: 'קרן השתלמות', balance: 125000, company: 'אלטשולר שחם', type: 'Pension' },
    { id: '2', name: 'קופת גמל להשקעה', balance: 42000, company: 'הראל', type: 'Savings' },
    { id: '3', name: 'חשבון עובר ושב', balance: 18500, company: 'בנק לאומי', type: 'Cash' },
    { id: '4', name: 'קרן פנסיה', balance: 280000, company: 'מנורה', type: 'Pension' }
];

const policies = [
    { name: 'ביטוח בריאות פרטי', company: 'הראל', premium: 250, status: 'פעיל' },
    { name: 'ביטוח חיים (ריסק)', company: 'מגדל', premium: 85, status: 'פעיל' },
    { name: 'ביטוח רכב (מקיף)', company: 'הפניקס', premium: 420, status: 'פעיל' },
    { name: 'זכאות סל הריון', company: 'כללית פלטינום', premium: 0, status: 'זכאי' }
];

let mainChart;

function init() {
    renderAssets();
    renderPolicies();
    updateKPIs();
    renderChart();
}

function updateKPIs() {
    const totalBalance = assets.reduce((s, a) => s + a.balance, 0);
    const totalPremium = policies.reduce((s, p) => s + p.premium, 0);
    
    document.getElementById('kpi-assets').innerText = `₪${totalBalance.toLocaleString()}`;
    document.getElementById('kpi-insurance').innerText = `₪${totalPremium.toLocaleString()}`;
    document.getElementById('kpi-count').innerText = assets.length;
}

function renderAssets() {
    const container = document.getElementById('asset-ledger');
    container.innerHTML = assets.map((asset, index) => `
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 bg-white/50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-colors gap-4">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                    <i data-lucide="${getIcon(asset.type)}"></i>
                </div>
                <div>
                    <p class="font-bold text-slate-800 text-base">${asset.name}</p>
                    <p class="text-xs text-slate-400">${asset.company}</p>
                </div>
            </div>
            <div class="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                <div class="text-left font-mono font-bold text-slate-900 text-lg">₪${asset.balance.toLocaleString()}</div>
                <button onclick="deleteAsset(${index})" class="p-2 text-slate-300 hover:text-red-500 transition-colors">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
        </div>
    `).join('');
    lucide.createIcons();
}

function getIcon(type) {
    switch(type) {
        case 'Pension': return 'landmark';
        case 'Savings': return 'pie-chart';
        case 'Cash': return 'wallet';
        default: return 'coins';
    }
}

function renderPolicies() {
    const table = document.getElementById('policy-table');
    table.innerHTML = policies.map(p => `
        <tr class="hover:bg-slate-50/50 transition-colors">
            <td class="px-4 py-4 font-bold text-slate-700">${p.name}</td>
            <td class="px-4 py-4 text-slate-500">${p.company}</td>
            <td class="px-4 py-4 font-mono font-bold text-slate-800">₪${p.premium}</td>
            <td class="px-4 py-4">
                <span class="px-3 py-1 rounded-full text-[10px] font-bold ${p.status === 'פעיל' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}">
                    ${p.status}
                </span>
            </td>
        </tr>
    `).join('');
}

function renderChart() {
    const ctx = document.getElementById('mainChart').getContext('2d');
    if (mainChart) mainChart.destroy();
    
    mainChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: assets.map(a => a.name),
            datasets: [{
                data: assets.map(a => a.balance),
                backgroundColor: ['#2563eb', '#6366f1', '#818cf8', '#94a3b8', '#cbd5e1'],
                hoverOffset: 20,
                borderWidth: 0,
                borderRadius: 4
            }]
        },
        options: {
            cutout: '78%',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            animation: {
                animateScale: true,
                animateRotate: true
            }
        }
    });
}

function addAsset() {
    const name = prompt("שם הנכס:");
    const balance = parseInt(prompt("סכום בצבירה:"));
    const company = prompt("שם המוסד הפיננסי:");
    
    if(name && balance) {
        assets.push({ id: Date.now().toString(), name, balance, company: company || 'כללי', type: 'Savings' });
        localStorage.setItem('erp_assets', JSON.stringify(assets));
        init();
    }
}

function deleteAsset(index) {
    if(confirm("האם למחוק נכס זה מהרשימה?")) {
        assets.splice(index, 1);
        localStorage.setItem('erp_assets', JSON.stringify(assets));
        init();
    }
}

// Start
init();
