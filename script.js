lucide.createIcons();

// ניהול נתונים דינמי
let assets = [
    { id: 1, name: 'פנסיה - מיטב דש', company: 'מיטב', balance: 85000, fee: '1.5%', liquid: '1.1.2063' },
    { id: 2, name: 'קרן השתלמות', company: 'הראל', balance: 62000, fee: '0.7%', liquid: '1.6.2027' }
];

let insurances = [
    { id: 1, type: 'בריאות', provider: 'כללית פלטינום', cost: 180, marketAvg: 160, status: 'יקר מהשוק' },
    { id: 2, type: 'חיים', provider: 'מגדל', cost: 120, marketAvg: 95, status: 'פעיל' }
];

let pieChart;

function updateAll() {
    renderAssets();
    renderInsurances();
    updateKPIs();
    updateCompound();
    renderPie();
}

function updateKPIs() {
    const totalA = assets.reduce((s, a) => s + Number(a.balance), 0);
    const totalI = insurances.reduce((s, i) => s + Number(i.cost), 0);
    document.getElementById('sum-assets').innerText = `₪${totalA.toLocaleString()}`;
    document.getElementById('sum-insurance').innerText = `₪${totalI.toLocaleString()}`;
}

function renderAssets() {
    const body = document.getElementById('asset-body');
    body.innerHTML = assets.map((a, index) => `
        <tr class="hover:bg-white/5 transition">
            <td class="py-4 px-2"><input type="text" value="${a.name}" onchange="editItem('asset', ${index}, 'name', this.value)"></td>
            <td class="py-4 px-2 text-slate-400">${a.company}</td>
            <td class="py-4 px-2 font-mono font-bold text-cyan-400">₪<input type="number" class="w-24" value="${a.balance}" onchange="editItem('asset', ${index}, 'balance', this.value)"></td>
            <td class="py-4 px-2 text-emerald-400 font-bold">${a.fee}</td>
            <td class="py-4 px-2 text-slate-500 text-xs">${a.liquid}</td>
            <td class="py-4 px-2 text-center text-red-500 cursor-pointer" onclick="deleteItem('asset', ${index})"><i data-lucide="trash-2" class="w-4 h-4 mx-auto"></i></td>
        </tr>
    `).join('');
    lucide.createIcons();
}

function renderInsurances() {
    const body = document.getElementById('insurance-body');
    body.innerHTML = insurances.map((i, index) => `
        <tr class="hover:bg-white/5 transition">
            <td class="py-4 px-2 font-bold">${i.type}</td>
            <td class="py-4 px-2 text-slate-400">${i.provider}</td>
            <td class="py-4 px-2 font-mono font-bold text-orange-400 text-lg">₪<input type="number" class="w-16" value="${i.cost}" onchange="editItem('insurance', ${index}, 'cost', this.value)"></td>
            <td class="py-4 px-2 text-slate-500 font-mono italic">₪${i.marketAvg}</td>
            <td class="py-4 px-2 text-center"><span class="${i.cost > i.marketAvg ? 'badge-warning' : 'badge-active'}">${i.status}</span></td>
            <td class="py-4 px-2 text-center cursor-pointer" onclick="deleteItem('insurance', ${index})"><i data-lucide="trash-2" class="w-4 h-4 mx-auto text-red-500"></i></td>
        </tr>
    `).join('');
    lucide.createIcons();
}

function renderPie() {
    const ctx = document.getElementById('pieChart').getContext('2d');
    if (pieChart) pieChart.destroy();
    pieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: assets.map(a => a.name),
            datasets: [{
                data: assets.map(a => a.balance),
                backgroundColor: ['#06B6D4', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { color: '#94A3B8' } } }
        }
    });
}

// לוגיקה לעריכה והוספה
window.editItem = (type, index, key, value) => {
    if (type === 'asset') assets[index][key] = value;
    else insurances[index][key] = value;
    updateAll();
};

window.addRow = (type) => {
    if (type === 'asset') assets.push({ name: 'נכס חדש', company: 'ספק', balance: 0, fee: '0%', liquid: '-' });
    else insurances.push({ type: 'ביטוח', provider: 'ספק', cost: 0, marketAvg: 100, status: 'פעיל' });
    updateAll();
};

window.deleteItem = (type, index) => {
    if (type === 'asset') assets.splice(index, 1);
    else insurances.splice(index, 1);
    updateAll();
};

// סימולטור ריבית דריבית
function updateCompound() {
    const monthly = Number(document.getElementById('input-monthly').value);
    const yieldRate = Number(document.getElementById('input-yield').value) / 100;
    
    document.getElementById('val-monthly').innerText = `₪${monthly}`;
    document.getElementById('val-yield').innerText = `${(yieldRate*100).toFixed(0)}%`;
    
    // חישוב מקורב ל-20 שנה
    let total = assets.reduce((s, a) => s + Number(a.balance), 0);
    for(let i=0; i<20*12; i++) {
        total = (total + monthly) * (1 + yieldRate/12);
    }
    document.getElementById('compound-result').innerText = `₪${Math.round(total).toLocaleString()}`;
}

document.getElementById('input-monthly').addEventListener('input', updateCompound);
document.getElementById('input-yield').addEventListener('input', updateCompound);

// התחלה
updateAll();
