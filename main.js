// Variables y Clases
let activeVehicles = JSON.parse(localStorage.getItem('activeVehicles')) || [];
let history = JSON.parse(localStorage.getItem('history')) || [];

class Vehicle {
    constructor(id, originalPlate, type, entryDate, entryTime) {
        this.id = id;
        this.originalPlate = originalPlate;
        this.type = type;
        this.entryDate = entryDate;
        this.entryTime = entryTime;
        this.exitDate = null;
        this.exitTime = null;
        this.totalMinutes = null;
        this.hoursCharged = null;
        this.amountCharged = null;
    }
}

// Persistencia de datos
function persistData() {
    localStorage.setItem('activeVehicles', JSON.stringify(activeVehicles));
    localStorage.setItem('history', JSON.stringify(history));
}

// Renderizado de la tabla
function renderTable() {
    const tableBody = document.querySelector('#tablaVehiculos tbody');
    tableBody.innerHTML = '';

    const plateCount = {};

    activeVehicles.forEach(vehicle => {
        const plate = vehicle.originalPlate;
        if (plateCount[plate]) {
            plateCount[plate]++;
        } else {
            plateCount[plate] = 1;
        }

        let displayPlate = plate;
        if (plateCount[plate] > 1) {
            displayPlate += `(${plateCount[plate]})`;
        }

        const tr = document.createElement('tr');

        const tdPlate = document.createElement('td');
        tdPlate.textContent = displayPlate;
        tr.appendChild(tdPlate);

        const tdEntryTime = document.createElement('td');
        tdEntryTime.textContent = vehicle.entryTime;
        tr.appendChild(tdEntryTime);

        const tdType = document.createElement('td');
        tdType.textContent = vehicle.type;
        tr.appendChild(tdType);

        const tdExit = document.createElement('td');
        const btnExit = document.createElement('button');
        btnExit.textContent = 'FIN';
        btnExit.classList.add('exit');
        btnExit.setAttribute('data-id', vehicle.id);
        tdExit.appendChild(btnExit);
        tr.appendChild(tdExit);

        tableBody.appendChild(tr);
    });
}

// Resumen
function renderSummary() {
    const totalVehiclesEl = document.getElementById('totalVehicles');
    const totalChargedEl = document.getElementById('totalCharged');

    const totalVehicles = activeVehicles.length + history.length;
    totalVehiclesEl.textContent = totalVehicles;

    const totalCharged = history.reduce((sum, vehicle) => {
        return sum + (vehicle.amountCharged || 0);
    }, 0);

    totalChargedEl.textContent = totalCharged.toLocaleString();
}

// Reseteo diario
function resetDailyStorage() {
    activeVehicles = [];
    history = [];
    localStorage.removeItem('activeVehicles');
    localStorage.removeItem('history');
    localStorage.setItem('lastResetDate', new Date().toLocaleDateString());

    console.log('LocalStorage reseteado a medianoche');

    renderTable();
    renderSummary();
}

function checkAndReset() {
    const today = new Date().toLocaleDateString();
    const lastReset = localStorage.getItem('lastResetDate');
    if (lastReset !== today) {
        resetDailyStorage();
    }
}

function scheduleMidnightReset() {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const msUntilMidnight = midnight - now;

    setTimeout(() => {
        resetDailyStorage();
        scheduleMidnightReset();
    }, msUntilMidnight);
}

// Función segura para parsear números
function safeNumber(value) {
    if (!value) return 0;
    return parseFloat(value.toString().replace(',', '.')) || 0;
}

// Init de la App
function init() {
    document.addEventListener('DOMContentLoaded', () => {
        const tableBody = document.querySelector('#tablaVehiculos tbody');
        const btnGetIntoCar = document.getElementById('btnIngresar');
        const entryModal = document.getElementById('entryModal');
        const plateInput = document.getElementById('plateInput');
        const typeSelect = document.getElementById('typeSelect');
        const cancelEntry = document.getElementById('cancelEntry');
        const confirmEntry = document.getElementById('confirmEntry');

        const exitModal = document.getElementById('exitModal');
        const exitInfo = document.getElementById('exitInfo');
        const exitCharge = document.getElementById('exitCharge');
        const cancelExit = document.getElementById('cancelExit');
        const confirmExit = document.getElementById('confirmExit');

        checkAndReset();
        scheduleMidnightReset();

        renderTable();
        renderSummary();

        // Ingresar vehículo
        btnGetIntoCar.addEventListener('click', () => {
            plateInput.value = '';
            typeSelect.value = '';
            entryModal.style.display = 'flex';
        });

        cancelEntry.addEventListener('click', () => {
            entryModal.style.display = 'none';
        });

        confirmEntry.addEventListener('click', () => {
            const plate = plateInput.value.trim();
            const type = typeSelect.value;

            if (!plate) return alert('Debes ingresar una patente');
            if (!type) return alert('Debes seleccionar un tipo de vehículo');

            let finalPlate = plate;
            const samePlates = activeVehicles.filter(v => v.originalPlate.startsWith(finalPlate));
            if (samePlates.length > 0) {
                finalPlate += `(${samePlates.length + 1})`;
            }

            const now = new Date();
            const entryDate = now.toLocaleDateString();
            const entryTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const vehicle = new Vehicle(Date.now(), finalPlate, type, entryDate, entryTime);

            activeVehicles.push(vehicle);
            persistData();
            renderTable();
            renderSummary();

            entryModal.style.display = 'none';
        });

        // Salida vehículo
        tableBody.addEventListener('click', (event) => {
            const button = event.target.closest('button.exit');
            if (!button) return;

            const vehicleId = button.getAttribute('data-id');
            const vehicleIndex = activeVehicles.findIndex(v => v.id == vehicleId);

            if (vehicleIndex === -1) {
                alert('Vehículo no encontrado');
                return;
            }

            const vehicle = activeVehicles[vehicleIndex];

            exitModal.style.display = 'flex';

            const now = new Date();
            vehicle.exitDate = now.toLocaleDateString();
            vehicle.exitTime = now.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});

            // Parseo seguro de fechas
            const [day, month, year] = vehicle.entryDate.split('/');
            const [hour, minute] = vehicle.entryTime.split(':');
            const entryDateTime = new Date(year, month - 1, day, safeNumber(hour), safeNumber(minute));

            const diffMs = now - entryDateTime;
            vehicle.totalMinutes = Math.ceil(diffMs / 60000);

            const minutesPerTurn = 60;
            const tolerance = 10;
            vehicle.hoursCharged = Math.ceil((vehicle.totalMinutes - tolerance) / minutesPerTurn);
            if (vehicle.hoursCharged < 1) vehicle.hoursCharged = 1;

            const rates = { 'Car/SUV': 2500, 'Pickup': 3000, 'Motorcycle': 1000 };
            vehicle.amountCharged = vehicle.hoursCharged * (rates[vehicle.type] || 0);

            exitInfo.innerHTML = `
                El Vehículo con Patente <b>${vehicle.originalPlate}</b> <br>
                Ingresó a las <b>${vehicle.entryTime}</b> <br>
                Salió a las <b>${vehicle.exitTime}</b> <br>
                Tiempo total Estacionado: <b>${vehicle.totalMinutes} minutos</b> <br>
                Horas cobradas: <b>${vehicle.hoursCharged}</b>.
            `;

            exitCharge.innerHTML = `
                Monto a Pagar: <b>$${vehicle.amountCharged.toLocaleString()}</b>
            `;

            cancelExit.onclick = () => { exitModal.style.display = 'none'; };

            confirmExit.onclick = () => {
                history.push(vehicle);
                activeVehicles.splice(vehicleIndex, 1);
                persistData();
                renderTable();
                renderSummary();
                exitModal.style.display = 'none';
            };
        });

    });
}

init();
