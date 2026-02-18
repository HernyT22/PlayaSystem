// Variables y Clases
let activeVehicles = JSON.parse(localStorage.getItem('activeVehicles')) || [];
let history = JSON.parse(localStorage.getItem('history')) || [];

class Vehicle {
    constructor(id, originalPlate, type, entryTimestamp) {
        this.id = id;
        this.originalPlate = originalPlate;
        this.type = type;
        this.entryTimestamp = entryTimestamp; // guardamos timestamp en ms
        this.exitTimestamp = null;
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
        const entryTimeString = new Date(vehicle.entryTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        tdEntryTime.textContent = entryTimeString;
        tr.appendChild(tdEntryTime);

        const tdType = document.createElement('td');
        tdType.textContent = vehicle.type;
        tr.appendChild(tdType);

        const tdAction = document.createElement('td');

        const btnExit = document.createElement('button');
        btnExit.textContent = 'FIN';
        btnExit.classList.add('exit');
        btnExit.setAttribute('data-id', vehicle.id);
      

        const btnCancel = document.createElement('button');
        btnCancel.textContent = '✕';
        btnCancel.classList.add('cancel');
        btnCancel.setAttribute('data-id', vehicle.id);

        tdAction.appendChild(btnExit);
        tdAction.appendChild(btnCancel);
        
        tr.appendChild(tdAction);

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

        const cancelModal = document.getElementById('cancelModal');
        const cancelInfo = document.getElementById('cancelInfo');
        const cancelNo = document.getElementById('cancelCancel');
        const cancelYes = document.getElementById('confirmCancel');

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

            const now = Date.now();
            const vehicle = new Vehicle(Date.now(), finalPlate, type, now);

            activeVehicles.push(vehicle);
            persistData();
            renderTable();
            renderSummary();

            entryModal.style.display = 'none';
        });

       

        
        tableBody.addEventListener('click', (event) => {

            //Cancelar vehiculo
            const buttonCancel = event.target.closest('button.cancel');
            if(buttonCancel){
                const vehicleId = buttonCancel.getAttribute('data-id');
                const vehicleIndex = activeVehicles.findIndex(v => v.id == vehicleId);

                const vehicle = activeVehicles[vehicleIndex];

                 cancelInfo.innerHTML = `
                                        ¿Seguro que querés cancelar el vehículo 
                                        <b>${vehicle.originalPlate}</b>?
                                    `;
            
                cancelModal.classList.add('show');

                cancelNo.onclick = () => {
                    cancelModal.classList.remove('show');
                };

                cancelYes.onclick = () =>{
                    activeVehicles.splice(vehicleIndex, 1);
                    persistData();
                    renderTable();
                    renderSummary();
                    cancelModal.classList.remove('show');
                };

                return;
            }
            
            // Salida vehículo
            const buttonSalir = event.target.closest('button.exit');
            if (!buttonSalir) return;

            const vehicleId = buttonSalir.getAttribute('data-id');
            const vehicleIndex = activeVehicles.findIndex(v => v.id == vehicleId);

            const vehicle = activeVehicles[vehicleIndex];
            exitModal.style.display = 'flex';

            const now = Date.now();
            vehicle.exitTimestamp = now;

            // Cálculo seguro de minutos
            const diffMs = vehicle.exitTimestamp - vehicle.entryTimestamp;
            vehicle.totalMinutes = Math.ceil(diffMs / 60000);

            const minutesPerTurn = 60;
            const tolerance = 10;
            vehicle.hoursCharged = Math.ceil((vehicle.totalMinutes - tolerance) / minutesPerTurn);
            if (vehicle.hoursCharged < 1) vehicle.hoursCharged = 1;

            const rates = { 'Car/SUV': 2500, 'Pickup': 3000, 'Motorcycle': 1000 };
            vehicle.amountCharged = vehicle.hoursCharged * (rates[vehicle.type] || 0);

            const entryTimeString = new Date(vehicle.entryTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const exitTimeString = new Date(vehicle.exitTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            exitInfo.innerHTML = `
                El Vehículo con Patente <b>${vehicle.originalPlate}</b> <br>
                Ingresó a las <b>${entryTimeString}</b> <br>
                Salió a las <b>${exitTimeString}</b> <br>
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
