lucide.createIcons();

let assets = JSON.parse(localStorage.getItem('assets')) || [
    { name: 'פנסיה', company: 'מיטב', balance: 180000, fee: '1.2' },
    { name: 'השתלמות', company: 'הראל', balance: 65000, fee: '0.8' }
];

let insurances = JSON.parse(localStorage.getItem('insurances')) || [
    { type: 'בריאות', provider: 'כללית', cost: 185, marketAvg: 155 },
    { type: 'חיים', provider: 'מגדל', cost: 95, marketAvg: 110 }
];

let charts = {};

function init() {
    renderTables();
    updateDashboard();
}

function updateDashboard() {
    const totalA = assets.reduce((s, a) => s + Number(a.balance), 0);
    const totalI = insurances.reduce((s, i) => s + Number(i.cost), 0);
    
    document.getElementById('sum-assets').innerText = `₪${totalA.toLocaleString()}`;
    document.getElementById('sum-insurance').innerText = `₪${totalI.toLocaleString()}`;
    
    calculateCompound();
    updateCharts(totalA);
    localStorage.setItem('assets', JSON.stringify(assets));
    localStorage.setItem('insurances', JSON.stringify(insurances));
}

function renderTables() {
    // Assets Table
    document.getElementById('asset-body').innerHTML = assets.map((a, i) => `
        <tr class="border-b border-gray-800/50 hover:bg-white/[0.02]">
            <td class="py-4"><input type="text" value="${a.name}" class="bg-transparent border-none focus:ring-0 w-32 font-bold" onchange="edit('a',${i},'name',this.value)"></td>
            <td><input type="text" value="${a.company}" class="bg-transparent border-none text-slate-500 w-24" onchange="edit('a',${i},'company',this.value)"></td>
            <td class="font-mono text-cyan-400">₪<input type="number" value="${a.balance}" class="bg-transparent border-none w-24 font-bold" onchange="edit('a',${i},'balance',this.value)"></td>
            <td><input type="text" value="${a.fee}" class="bg-transparent border-none text-emerald-400 w-12" onchange="edit('a',${i},'fee',this.value)">%</td>
            <td class="text-center"><button onclick="remove('a',${i})" class="text-red-900 hover:text-red-500 transition">🗑</button></td>
        </tr>
    `).join('');

    // Insurance Table
    document.getElementById('insurance-body').innerHTML = insurances.map((ins, i) => {
        const isExpensive = Number(ins.cost) > Number(ins.marketAvg);
        return `
        <tr class="border-b border-gray-800/50 hover:bg-white/[0.02]">
            <td class="py-4 font-bold"><input type="text" value="${ins.type}" class="bg-transparent border-none w-32" onchange="edit('i',${i},'type',this.value)"></td>
            <td><input type="text" value="${ins.provider}" class="bg-transparent border-none text-slate-500 w-24" onchange="edit('i',${i},'provider',this.value)"></td>
            <td class="font-mono text-orange-400 font-bold">₪<input type="number" value="${ins.cost}" class="bg-transparent border-none w-20 font-bold" onchange="edit('i',${i},'cost',this.value)"></td>
            <td class="font-mono text-slate-600 italic">₪<input type="number" value="${ins.marketAvg}" class="bg-transparent border-none w-20" onchange="edit('i',${i},'marketAvg',this.value)"></td>
            <td class="text-center">
                <span class="${isExpensive ? 'text-orange-500 bg-orange-500/10' : 'text-emerald-500 bg-emerald-500/10'} px-3 py-1 rounded-full text-[10px] font-bold">
                    ${isExpensive ? 'יקר מהממוצע' : 'תקין'}
                </span>
            </td>
            <td class="text-center"><button onclick="remove('i',${i})" class="text-red-900 hover:text-red-500">🗑</button></td>
        </tr>`;
    }).join('');
    lucide.createIcons();
}

function calculateCompound() {
    const monthly = Number(document.getElementById('input-monthly').value);
    const rate = Number(document.getElementById('input-yield').value) / 100;
    const years = Number(document.getElementById('input-years').value);
    
    let total = assets.reduce((s, a) => s + Number(a.balance), 0);
    const dataPoints = [];
    
    for(let i=0; i <= years; i++) {
        dataPoints.push(Math.round(total));
        total = (total + monthly * 12) * (1 + rate);
    }
    
    document.getElementById('compound-result').innerText = `₪${dataPoints[dataPoints.length-1].toLocaleString()}`;
    document.getElementById('growth-kpi').innerText = `₪${(dataPoints[dataPoints.length-1] / 1000).toFixed(0)}K`;
    updateLineChart(dataPoints);
}

function updateCharts(totalA) {
    const ctxPie = document.getElementById('pieChart').getContext('2d');
    if(charts.pie) charts.pie.destroy();
    charts.pie = new Chart(ctxPie, {
        type: 'doughnut',
        data: {
            labels: assets.map(a => a.name),
            datasets: [{ data: assets.map(a => a.balance), backgroundColor: ['#22d3ee', '#10b981', '#f59e0b', '#6366f1'], borderWidth: 0 }]
        },
        options: { plugins: { legend: { display: false } }, cutout: '70%' }
    });
}

function updateLineChart(dataPoints) {
    const ctxLine = document.getElementById('growthChart').getContext('2d');
    if(charts.line) charts.line.destroy();
    charts.line = new Chart(ctxLine, {
        type: 'line',
        data: {
            labels: dataPoints.map((_, i) => i),
            datasets: [{ data: dataPoints, borderColor: '#22d3ee', fill: true, backgroundColor: 'rgba(34,211,238,0.1)', tension: 0.4 }]
        },
        options: { plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }
    });
}

// Global actions
window.edit = (t, i, k, v) => { t === 'a' ? assets[i][k] = v : insurances[i][k] = v; updateDashboard(); if(k==='cost'||k==='marketAvg') renderTables(); };
window.addItem = (t) => { 
    if(t === 'asset') assets.push({name:'נכס חדש', company:'גוף', balance:0, fee:'0'});
    else insurances.push({type:'ביטוח חדש', provider:'חברה', cost:0, marketAvg:100});
    renderTables(); updateDashboard(); 
};
window.remove = (t, i) => { t === 'a' ? assets.splice(i, 1) : insurances.splice(i, 1); renderTables(); updateDashboard(); };

// Export Logic
window.exportToPDF = () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("WealthGuard - Financial Report", 10, 10);
    doc.save("Report.pdf");
};

window.exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(assets);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Assets");
    XLSX.writeFile(wb, "WealthGuard_Data.xlsx");
};

document.querySelectorAll('input').forEach(inp => inp.addEventListener('input', updateDashboard));

init();
