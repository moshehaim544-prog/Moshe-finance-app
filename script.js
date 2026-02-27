lucide.createIcons();

let assets = [
    { name: 'פנסיה - מיטב', company: 'מיטב דש', balance: 180000, fee: '1.2%', liquid: '2063' },
    { name: 'השתלמות - הראל', company: 'הראל', balance: 65000, fee: '0.8%', liquid: '2027' }
];

let insurances = [
    { type: 'בריאות פלטינום', provider: 'כללית', cost: 185, avg: 155, status: 'יקר מהממוצע' },
    { type: 'חיים (ריסק)', provider: 'הפניקס', cost: 95, avg: 110, status: 'תקין' }
];

let pieChart;

function update() {
    render();
    updateCharts();
    const totalA = assets.reduce((s, a) => s + Number(a.balance), 0);
    const totalI = insurances.reduce((s, i) => s + Number(i.cost), 0);
    document.getElementById('sum-assets').innerText = `₪${totalA.toLocaleString()}`;
    document.getElementById('sum-insurance').innerText = `₪${totalI.toLocaleString()}`;
    calculateCompound();
}

function render() {
    document.getElementById('asset-body').innerHTML = assets.map((a, i) => `
        <tr class="hover:bg-white/5 transition">
            <td class="py-5 font-bold text-white"><input type="text" value="${a.name}" onchange="edit('a',${i},'name',this.value)"></td>
            <td class="text-slate-500">${a.company}</td>
            <td class="font-mono text-cyan-400 font-bold text-lg">₪<input type="number" class="w-24" value="${a.balance}" onchange="edit('a',${i},'balance',this.value)"></td>
            <td class="text-emerald-400 font-bold">${a.fee}</td>
            <td class="text-slate-600 text-xs italic">${a.liquid}</td>
            <td class="text-center"><button onclick="del('a',${i})" class="text-red-900 hover:text-red-500">🗑</button></td>
        </tr>
    `).join('');

    document.getElementById('insurance-body').innerHTML = insurances.map((ins, i) => `
        <tr class="hover:bg-white/5 transition text-sm">
            <td class="py-5 font-bold text-white">${ins.type}</td>
            <td class="text-slate-500">${ins.provider}</td>
            <td class="font-mono text-orange-400 font-bold">₪<input type="number" class="w-16" value="${ins.cost}" onchange="edit('i',${i},'cost',this.value)"></td>
            <td class="text-slate-600 italic font-mono uppercase">₪${ins.avg}</td>
            <td class="text-center"><span class="${ins.cost > ins.avg ? 'badge-warn' : 'badge-pro'}">${ins.status}</span></td>
            <td class="text-center"><button onclick="del('i',${i})" class="text-red-900">🗑</button></td>
        </tr>
    `).join('');
}

function updateCharts() {
    const ctx = document.getElementById('pieChart').getContext('2d');
    if (pieChart) pieChart.destroy();
    pieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: assets.map(a => a.name),
            datasets: [{ data: assets.map(a => a.balance), backgroundColor: ['#06B6D4', '#10B981', '#F59E0B', '#8B5CF6'], borderWidth: 0 }]
        },
        options: { plugins: { legend: { display: false } }, maintainAspectRatio: false }
    });
}

function calculateCompound() {
    const monthly = Number(document.getElementById('input-monthly').value);
    const yRate = Number(document.getElementById('input-yield').value) / 100;
    document.getElementById('val-monthly').innerText = `₪${monthly}`;
    document.getElementById('val-yield').innerText = `${yRate*100}%`;
    let total = assets.reduce((s, a) => s + Number(a.balance), 0);
    for(let i=0; i<20*12; i++) total = (total + monthly) * (1 + yRate/12);
    document.getElementById('compound-result').innerText = `₪${Math.round(total).toLocaleString()}`;
}

window.edit = (t, i, k, v) => { t === 'a' ? assets[i][k] = v : insurances[i][k] = v; update(); };
window.addRow = (t) => { t === 'a' ? assets.push({name:'חדש',company:'-',balance:0,fee:'0%',liquid:'-'}) : insurances.push({type:'חדש',provider:'-',cost:0,avg:100,status:'פעיל'}); update(); };
window.del = (t, i) => { t === 'a' ? assets.splice(i, 1) : insurances.splice(i, 1); update(); };

document.getElementById('input-monthly').addEventListener('input', calculateCompound);
document.getElementById('input-yield').addEventListener('input', calculateCompound);

update();
