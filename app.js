// --- Configuration (Pega aquí tus URLs de Power Automate) ---
const FLOW_REGISTER_URL = "https://defaulte9f79ab3916f42a1b5f9b4a1f6a005.a0.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/1e58f2780ef449dfbd9e99214777d549/triggers/manual/paths/invoke?api-version=1";
const FLOW_LOGIN_URL = "https://defaulte9f79ab3916f42a1b5f9b4a1f6a005.a0.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/3c6016458c2843afb5091b6e1b0db33e/triggers/manual/paths/invoke?api-version=1";
const FLOW_FETCH_DATA_URL = "https://defaulte9f79ab3916f42a1b5f9b4a1f6a005.a0.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/c1f37f25565f4d24bca4da0a75c8ce67/triggers/manual/paths/invoke?api-version=1";
const FLOW_SAVE_EMPLOYEE_URL = "https://defaulte9f79ab3916f42a1b5f9b4a1f6a005.a0.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/92f4023f477248a38a1c48ad6e9daa93/triggers/manual/paths/invoke?api-version=1";
const FLOW_SEND_PAYROLL_URL = "https://defaulte9f79ab3916f42a1b5f9b4a1f6a005.a0.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/0ef16f7a85f54fcfaab7d494c333e1a9/triggers/manual/paths/invoke?api-version=1";

// --- Session & State ---
let currentSession = JSON.parse(localStorage.getItem('currentSession')) || null;
let employees = [];
let payrollHistory = {};
let employer = { name: '', company: '', ruc: '' };

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    initDate();
    
    if (currentSession) {
        showApp();
    } else {
        showLogin();
    }
});

function showLogin() {
    document.getElementById('login-overlay').style.display = 'flex';
    document.querySelector('.app-container').style.display = 'none';
}

function showApp() {
    document.getElementById('login-overlay').style.display = 'none';
    document.querySelector('.app-container').style.display = 'flex';
    
    // Cargar datos de la empresa actual
    employer = currentSession.employer;
    loadEmployerData();
    
    // Cargar datos específicos de esta empresa desde Microsoft (Simulado o Real)
    loadDataFromMicrosoft();
}

// --- Login & Register Events ---
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const ruc = document.getElementById('login-ruc').value;
    const pin = document.getElementById('login-pin').value;

    if (FLOW_LOGIN_URL === "URL_LOGIN_AQUI") {
        alert("Primero debes configurar el Flujo de Login en Microsoft.");
        return;
    }

    try {
        const response = await fetch(FLOW_LOGIN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ruc, pin })
        });

        if (response.ok) {
            const data = await response.json();
            currentSession = {
                ruc: ruc,
                employer: { 
                    name: data.NombreCEO, 
                    company: data.NombreEmpresa, 
                    ruc: ruc 
                }
            };
            localStorage.setItem('currentSession', JSON.stringify(currentSession));
            showApp();
        } else {
            alert("RUC o PIN incorrectos en Microsoft.");
        }
    } catch (err) {
        alert("Error de conexión con Microsoft.");
    }
});

document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const ruc = document.getElementById('reg-ruc').value;
    const name = document.getElementById('reg-company').value;
    const ceo = document.getElementById('reg-ceo').value;
    const pin = document.getElementById('reg-pin').value;

    try {
        const response = await fetch(FLOW_REGISTER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ruc, name, ceo, pin })
        });

        if (response.ok) {
            alert("¡Empresa registrada en Microsoft! Ya puedes iniciar sesión.");
            closeModal(document.getElementById('register-modal'));
        }
    } catch (err) {
        alert("Error al registrar en Microsoft.");
    }
});

async function loadDataFromMicrosoft() {
    if (FLOW_FETCH_DATA_URL === "URL_CARGAR_DATOS_AQUI") return;

    try {
        const response = await fetch(FLOW_FETCH_DATA_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ruc: currentSession.ruc })
        });
        
        const data = await response.json();
        employees = data.empleados || [];
        payrollHistory = data.roles || {};
        
        renderEmployees();
        renderDashboard();
    } catch (err) {
        console.error("Error cargando datos:", err);
    }
}

function initDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('es-ES', options);
}

// --- Navigation ---
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const sectionId = item.getAttribute('data-section');
        
        // Update UI
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
        document.getElementById(sectionId).classList.add('active');
        
        // Update title
        document.getElementById('section-title').textContent = item.querySelector('span').textContent;

        if (sectionId === 'generator') renderGeneratorList();
        if (sectionId === 'dashboard') renderDashboard();
    });
});

// --- Employer Management ---
function loadEmployerData() {
    document.getElementById('employer-name').value = employer.name;
    document.getElementById('company-name').value = employer.company;
    document.getElementById('company-ruc').value = employer.ruc;
}

document.getElementById('employer-form').addEventListener('submit', (e) => {
    e.preventDefault();
    employer = {
        name: document.getElementById('employer-name').value,
        company: document.getElementById('company-name').value,
        ruc: document.getElementById('company-ruc').value
    };
    localStorage.setItem('employer', JSON.stringify(employer));
    alert('Datos del empleador guardados correctamente.');
});

// --- Employee Management ---
const employeeModal = document.getElementById('employee-modal');
const employeeForm = document.getElementById('employee-form');

document.getElementById('add-employee-btn').addEventListener('click', () => {
    employeeForm.reset();
    document.getElementById('edit-index').value = '';
    document.getElementById('modal-title').textContent = 'Nuevo Empleado';
    toggleBankDetails('Transferencia');
    openModal(employeeModal);
});

document.getElementById('emp-payment').addEventListener('change', (e) => {
    toggleBankDetails(e.target.value);
});

function toggleBankDetails(method) {
    const bankSection = document.getElementById('bank-details');
    bankSection.style.display = method === 'Transferencia' ? 'block' : 'none';
}

employeeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const editIndex = document.getElementById('edit-index').value;
    
    const employeeData = {
        id: document.getElementById('emp-id').value,
        names: document.getElementById('emp-names').value,
        email: document.getElementById('emp-email').value,
        paymentMethod: document.getElementById('emp-payment').value,
        bank: document.getElementById('emp-bank').value,
        account: document.getElementById('emp-account').value,
        accountType: document.getElementById('emp-account-type').value,
    };

    if (editIndex !== '') {
        employees[editIndex] = employeeData;
    } else {
        employees.push(employeeData);
    }

    // Guardar en Microsoft SharePoint
    if (FLOW_SAVE_EMPLOYEE_URL !== "URL_GUARDAR_EMPLEADO_AQUI") {
        fetch(FLOW_SAVE_EMPLOYEE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ruc: currentSession.ruc, ...employeeData })
        });
    }

    localStorage.setItem(`employees_${currentSession.ruc}`, JSON.stringify(employees));
    renderEmployees();
    closeModal(employeeModal);
});

// Logout logic
document.getElementById('logout-btn').addEventListener('click', (e) => {
    e.preventDefault();
    if (confirm('¿Deseas cerrar sesión?')) {
        localStorage.removeItem('currentSession');
        location.reload();
    }
});

function renderEmployees() {
    const list = document.getElementById('employees-list');
    list.innerHTML = '';
    
    employees.forEach((emp, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${emp.id}</td>
            <td>${emp.names}</td>
            <td>${emp.paymentMethod}</td>
            <td>
                <button class="action-btn edit" onclick="editEmployee(${index})"><i data-lucide="edit-3"></i></button>
                <button class="action-btn delete" onclick="deleteEmployee(${index})"><i data-lucide="trash-2"></i></button>
            </td>
        `;
        list.appendChild(tr);
    });
    lucide.createIcons();
}

window.editEmployee = (index) => {
    const emp = employees[index];
    document.getElementById('edit-index').value = index;
    document.getElementById('modal-title').textContent = 'Editar Empleado';
    document.getElementById('emp-id').value = emp.id;
    document.getElementById('emp-names').value = emp.names;
    document.getElementById('emp-email').value = emp.email || '';
    document.getElementById('emp-payment').value = emp.paymentMethod;
    document.getElementById('emp-bank').value = emp.bank || '';
    document.getElementById('emp-account').value = emp.account || '';
    document.getElementById('emp-account-type').value = emp.accountType || 'Ahorro';
    
    toggleBankDetails(emp.paymentMethod);
    openModal(employeeModal);
};

window.deleteEmployee = (index) => {
    if (confirm('¿Estás seguro de eliminar a este empleado?')) {
        employees.splice(index, 1);
        localStorage.setItem('employees', JSON.stringify(employees));
        renderEmployees();
    }
};

// --- Generator Logic ---
const payrollModal = document.getElementById('payroll-modal');
const payrollForm = document.getElementById('payroll-config-form');
const copyModal = document.getElementById('copy-modal');

function renderGeneratorList() {
    const list = document.getElementById('generator-list');
    const month = document.getElementById('payroll-month').value;
    list.innerHTML = '';
    
    employees.forEach((emp) => {
        const key = `${emp.id}_${month}`;
        const config = payrollHistory[key] || { salary: 0, iess: 0, deductions: [], net: 0 };
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="checkbox" class="emp-select" data-id="${emp.id}"></td>
            <td>${emp.names}</td>
            <td>$${config.salary.toFixed(2)}</td>
            <td>$${config.iess.toFixed(2)}</td>
            <td><strong>$${config.net.toFixed(2)}</strong></td>
            <td>
                <button class="action-btn config" onclick="openPayrollConfig('${emp.id}')"><i data-lucide="settings"></i></button>
                <button class="action-btn" onclick="downloadSinglePDF('${emp.id}')" ${config.net === 0 ? 'disabled' : ''}><i data-lucide="download"></i></button>
            </td>
            <td>
                <button class="action-btn" onclick="sendEmailPayroll('${emp.id}')" ${config.net === 0 ? 'disabled' : ''} title="Enviar por correo">
                    <i data-lucide="mail"></i>
                </button>
            </td>
        `;
        list.appendChild(tr);
    });
    
    updateBulkButton();
    lucide.createIcons();
}

window.openPayrollConfig = (empId) => {
    const emp = employees.find(e => e.id === empId);
    const month = document.getElementById('payroll-month').value;
    const currentKey = `${empId}_${month}`;
    
    document.getElementById('config-emp-id').value = empId;
    document.getElementById('config-emp-name').textContent = `Empleado: ${emp.names}`;
    document.getElementById('config-period').textContent = `Periodo: ${getFormattedMonth(month)}`;
    
    // Check for previous month
    const prevMonth = getPreviousMonth(month);
    const prevKey = `${empId}_${prevMonth}`;
    
    if (!payrollHistory[currentKey] && payrollHistory[prevKey]) {
        openModal(copyModal);
        
        const handleCopy = (shouldCopy) => {
            if (shouldCopy) {
                const prevData = payrollHistory[prevKey];
                loadPayrollForm(prevData);
            } else {
                loadPayrollForm({ salary: 0, iess: 0, deductions: [] });
            }
            closeModal(copyModal);
            openModal(payrollModal);
            // Remove listeners to avoid accumulation
            document.getElementById('copy-yes').replaceWith(document.getElementById('copy-yes').cloneNode(true));
            document.getElementById('copy-no').replaceWith(document.getElementById('copy-no').cloneNode(true));
        };

        document.getElementById('copy-yes').addEventListener('click', () => handleCopy(true));
        document.getElementById('copy-no').addEventListener('click', () => handleCopy(false));
    } else {
        const currentData = payrollHistory[currentKey] || { salary: 0, iess: 0, deductions: [] };
        loadPayrollForm(currentData);
        openModal(payrollModal);
    }
};

function loadPayrollForm(data) {
    document.getElementById('config-salary').value = data.salary || '';
    document.getElementById('config-iess').value = (data.iess || 0).toFixed(2);
    
    const dedList = document.getElementById('deductions-list');
    dedList.innerHTML = '';
    (data.deductions || []).forEach(d => addDeductionRow(d.name, d.amount));
    
    updateNetTotal();
}

document.getElementById('config-salary').addEventListener('input', (e) => {
    const salary = parseFloat(e.target.value) || 0;
    const iess = salary * 0.0945;
    document.getElementById('config-iess').value = iess.toFixed(2);
    updateNetTotal();
});

document.getElementById('add-deduction-row').addEventListener('click', () => {
    addDeductionRow('', 0);
});

function addDeductionRow(name = '', amount = 0) {
    const row = document.createElement('div');
    row.className = 'deduction-row';
    row.innerHTML = `
        <input type="text" placeholder="Concepto" class="ded-name" value="${name}">
        <input type="number" placeholder="Valor" step="0.01" class="ded-amount" value="${amount}">
        <button type="button" class="action-btn delete" onclick="this.parentElement.remove(); updateNetTotal();"><i data-lucide="minus-circle"></i></button>
    `;
    document.getElementById('deductions-list').appendChild(row);
    lucide.createIcons();
    
    row.querySelector('.ded-amount').addEventListener('input', updateNetTotal);
}

function updateNetTotal() {
    const salary = parseFloat(document.getElementById('config-salary').value) || 0;
    const iess = parseFloat(document.getElementById('config-iess').value) || 0;
    
    let otherDeductions = 0;
    document.querySelectorAll('.deduction-row').forEach(row => {
        otherDeductions += parseFloat(row.querySelector('.ded-amount').value) || 0;
    });
    
    const net = salary - iess - otherDeductions;
    document.getElementById('config-net-total').textContent = `$${net.toFixed(2)}`;
}

payrollForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const empId = document.getElementById('config-emp-id').value;
    const month = document.getElementById('payroll-month').value;
    const key = `${empId}_${month}`;
    
    const deductions = [];
    document.querySelectorAll('.deduction-row').forEach(row => {
        deductions.push({
            name: row.querySelector('.ded-name').value,
            amount: parseFloat(row.querySelector('.ded-amount').value) || 0
        });
    });

    payrollHistory[key] = {
        salary: parseFloat(document.getElementById('config-salary').value) || 0,
        iess: parseFloat(document.getElementById('config-iess').value) || 0,
        deductions: deductions,
        net: parseFloat(document.getElementById('config-net-total').textContent.replace('$', ''))
    };

    localStorage.setItem('payrollHistory', JSON.stringify(payrollHistory));
    renderGeneratorList();
    closeModal(payrollModal);
});

// --- Bulk Actions ---
document.getElementById('select-all-employees').addEventListener('change', (e) => {
    document.querySelectorAll('.emp-select').forEach(cb => cb.checked = e.target.checked);
    updateBulkButton();
});

document.addEventListener('change', (e) => {
    if (e.target.classList.contains('emp-select')) updateBulkButton();
});

function updateBulkButton() {
    const selected = document.querySelectorAll('.emp-select:checked').length;
    const btn = document.getElementById('generate-bulk-btn');
    btn.disabled = selected === 0;
    btn.innerHTML = `<i data-lucide="download"></i> Descargar ${selected} Roles`;
    lucide.createIcons();
}

document.getElementById('generate-bulk-btn').addEventListener('click', async () => {
    const selectedIds = Array.from(document.querySelectorAll('.emp-select:checked')).map(cb => cb.getAttribute('data-id'));
    const month = document.getElementById('payroll-month').value;
    
    for (const empId of selectedIds) {
        await generatePDF(empId, month);
    }
});

window.downloadSinglePDF = (empId) => {
    const month = document.getElementById('payroll-month').value;
    generatePDF(empId, month);
};

// --- PDF Generation ---
async function generatePDF(empId, month) {
    const emp = employees.find(e => e.id === empId);
    const key = `${empId}_${month}`;
    const data = payrollHistory[key];
    
    if (!data) return;

    const template = document.getElementById('pdf-template');
    template.style.display = 'block';
    
    const [start, end] = getMonthRange(month);

    template.innerHTML = `
        <div class="pdf-container">
            <div class="pdf-header">
                <div class="pdf-company-info">
                    <h1>${employer.company || 'EMPRESA'}</h1>
                    <p><strong>RUC:</strong> ${employer.ruc || '0000000000001'}</p>
                    <p><strong>Representante:</strong> ${employer.name || 'GERENTE'}</p>
                </div>
                <div class="pdf-meta">
                    <p>Fecha: ${new Date().toLocaleDateString()}</p>
                    <p><strong>ROL DE PAGO</strong></p>
                </div>
            </div>

            <div class="pdf-grid">
                <div>
                    <p><strong>CEDULA:</strong> ${emp.id}</p>
                    <p><strong>NOMBRE EMPLEADO:</strong> ${emp.names}</p>
                    <p><strong>PERIODO DE PAGO:</strong> DEL ${start} AL ${end}</p>
                </div>
                <div>
                    <p><strong>DIAS TRABAJADOS:</strong> ${getDaysInMonth(month)}</p>
                    <p><strong>FECHA INGRESO:</strong> -</p>
                    <p><strong>CARGO:</strong> EMPLEADO</p>
                </div>
            </div>

            <table class="pdf-table">
                <thead>
                    <tr>
                        <th colspan="2">INGRESOS</th>
                        <th colspan="2">DESCUENTOS</th>
                    </tr>
                    <tr>
                        <th>CONCEPTO</th>
                        <th>VALOR</th>
                        <th>CONCEPTO</th>
                        <th>VALOR</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>SUELDO BÁSICO</td>
                        <td>$${data.salary.toFixed(2)}</td>
                        <td>IESS (9.45%)</td>
                        <td>$${data.iess.toFixed(2)}</td>
                    </tr>
                    ${renderPdfDeductions(data.deductions)}
                </tbody>
            </table>

            <div class="pdf-summary">
                <div class="pdf-row"><span>TOTAL INGRESOS:</span> <span>$${data.salary.toFixed(2)}</span></div>
                <div class="pdf-row"><span>TOTAL DESCUENTOS:</span> <span>$${(data.iess + data.deductions.reduce((s,d)=>s+d.amount,0)).toFixed(2)}</span></div>
                <div class="pdf-total">
                    <div class="pdf-row"><span>NETO A PAGAR:</span> <span>$${data.net.toFixed(2)}</span></div>
                </div>
            </div>

            <div class="pdf-footer">
                <p>ACEPTO Y ESTOY DE ACUERDO CON TODOS LOS VALORES DETALLADOS EN ESTA BOLETA DE PAGO.</p>
                <div class="pdf-signature">
                    <p>RECIBI CONFORME</p>
                    <p>C.I. ${emp.id}</p>
                </div>
                
                <div class="pdf-bank-info">
                    <p><strong>FORMA DE PAGO:</strong> ${emp.paymentMethod}</p>
                    ${emp.paymentMethod === 'Transferencia' ? `
                        <p><strong>BANCO:</strong> ${emp.bank}</p>
                        <p><strong>TIPO CUENTA:</strong> ${emp.accountType}</p>
                        <p><strong>CUENTA No:</strong> ${emp.account}</p>
                    ` : ''}
                </div>
            </div>
        </div>
    `;

    const opt = {
        margin: 10,
        filename: `Rol_${emp.names.replace(/\s+/g, '_')}_${month}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    await html2pdf().set(opt).from(template).save();
    template.style.display = 'none';
}

function renderPdfDeductions(deductions) {
    let html = '';
    // We fill rows to balance the table if needed
    const count = Math.max(deductions.length, 0);
    for(let i=0; i<count; i++) {
        html += `<tr><td></td><td></td><td>${deductions[i].name}</td><td>$${deductions[i].amount.toFixed(2)}</td></tr>`;
    }
    return html;
}

// --- Dashboard ---
function renderDashboard() {
    document.getElementById('stat-employees-count').textContent = employees.length;
    
    const month = document.getElementById('payroll-month').value;
    let count = 0;
    let total = 0;
    
    Object.keys(payrollHistory).forEach(key => {
        if (key.endsWith(month)) {
            count++;
            total += payrollHistory[key].net;
        }
    });
    
    document.getElementById('stat-last-month-rolls').textContent = count;
    document.getElementById('stat-total-payroll').textContent = `$${total.toFixed(2)}`;
}

// --- Utils ---
function openModal(modal) { modal.classList.add('active'); }
function closeModal(modal) { 
    modal.classList.remove('active'); 
}

document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    });
});

function getFormattedMonth(monthStr) {
    const [year, month] = monthStr.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
}

function getPreviousMonth(monthStr) {
    const [year, month] = monthStr.split('-').map(Number);
    const date = new Date(year, month - 2);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthRange(monthStr) {
    const [year, month] = monthStr.split('-').map(Number);
    const lastDay = new Date(year, month, 0).getDate();
    return [`1/${month}/${year}`, `${lastDay}/${month}/${year}`];
}

function getDaysInMonth(monthStr) {
    const [year, month] = monthStr.split('-').map(Number);
    return new Date(year, month, 0).getDate();
}

// --- Power Automate Integration ---
window.sendEmailPayroll = async (empId) => {
    const emp = employees.find(e => e.id === empId);
    const month = document.getElementById('payroll-month').value;
    const key = `${empId}_${month}`;
    const data = payrollHistory[key];

    if (!data) {
        alert('Primero debes configurar el rol de pago.');
        return;
    }

    if (!emp.email) {
        alert('El empleado no tiene un correo registrado.');
        return;
    }

    if (POWER_AUTOMATE_URL === "TU_URL_DE_POWER_AUTOMATE_AQUI") {
        alert('Debes pegar la URL de tu flujo de Power Automate en el archivo app.js.');
        return;
    }

    try {
        const btn = event.currentTarget;
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<i data-lucide="loader-2" class="spin"></i>';
        lucide.createIcons();
        btn.disabled = true;

        // 1. Generar el PDF como Base64
        const template = await preparePdfTemplate(empId, month);
        const pdfOutput = await html2pdf().set({
            margin: 10,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }).from(template).outputPdf('datauristring');

        const base64Pdf = pdfOutput.split(',')[1];

        // 2. Preparar el paquete de datos para Microsoft
        const payload = {
            to: emp.email,
            subject: `Rol de Pago - ${getFormattedMonth(month)} - ${employer.company}`,
            body: `Hola ${emp.names},<br><br>Adjuntamos tu rol de pago correspondiente al periodo ${getFormattedMonth(month)}.<br><br>Saludos,<br>${employer.name}`,
            fileName: `Rol_Pago_${emp.names.replace(/\s+/g, '_')}.pdf`,
            fileContent: base64Pdf,
            ruc: employer.ruc,
            cedula: emp.id,
            mes: month,
            sueldo: data.salary,
            iess: data.iess,
            neto: data.net
        };

        // 3. Enviar a Power Automate
        const response = await fetch(POWER_AUTOMATE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert(`¡Nómina enviada correctamente a ${emp.email} vía Microsoft!`);
        } else {
            throw new Error('Error en la respuesta del servidor');
        }
        
        btn.innerHTML = originalHtml;
        btn.disabled = false;
        lucide.createIcons();

    } catch (error) {
        console.error('Error:', error);
        alert('Hubo un problema al enviar el correo a través de Microsoft.');
        btn.disabled = false;
    }
};

async function preparePdfTemplate(empId, month) {
    const emp = employees.find(e => e.id === empId);
    const data = payrollHistory[`${empId}_${month}`];
    const [start, end] = getMonthRange(month);
    const template = document.getElementById('pdf-template');
    
    template.style.display = 'block';
    template.innerHTML = `
        <div class="pdf-container">
            <div class="pdf-header">
                <div class="pdf-company-info">
                    <h1>${employer.company || 'EMPRESA'}</h1>
                    <p><strong>RUC:</strong> ${employer.ruc || '0000000000001'}</p>
                    <p><strong>Representante:</strong> ${employer.name || 'GERENTE'}</p>
                </div>
                <div class="pdf-meta">
                    <p>Fecha: ${new Date().toLocaleDateString()}</p>
                    <p><strong>ROL DE PAGO</strong></p>
                </div>
            </div>
            <div class="pdf-grid">
                <div>
                    <p><strong>CEDULA:</strong> ${emp.id}</p>
                    <p><strong>NOMBRE EMPLEADO:</strong> ${emp.names}</p>
                    <p><strong>PERIODO DE PAGO:</strong> DEL ${start} AL ${end}</p>
                </div>
                <div>
                    <p><strong>DIAS TRABAJADOS:</strong> ${getDaysInMonth(month)}</p>
                    <p><strong>CARGO:</strong> EMPLEADO</p>
                </div>
            </div>
            <table class="pdf-table">
                <thead>
                    <tr>
                        <th colspan="2">INGRESOS</th>
                        <th colspan="2">DESCUENTOS</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>SUELDO BÁSICO</td>
                        <td>$${data.salary.toFixed(2)}</td>
                        <td>IESS (9.45%)</td>
                        <td>$${data.iess.toFixed(2)}</td>
                    </tr>
                    ${renderPdfDeductions(data.deductions)}
                </tbody>
            </table>
            <div class="pdf-summary">
                <div class="pdf-total">
                    <div class="pdf-row"><span>NETO A PAGAR:</span> <span>$${data.net.toFixed(2)}</span></div>
                </div>
            </div>
            <div class="pdf-footer">
                <p>ACEPTO Y ESTOY DE ACUERDO CON TODOS LOS VALORES DETALLADOS EN ESTA BOLETA DE PAGO.</p>
                <div class="pdf-signature">
                    <p>RECIBI CONFORME</p>
                    <p>C.I. ${emp.id}</p>
                </div>
            </div>
        </div>
    `;
    return template;
}
