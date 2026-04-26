// --- Funciones de Emergencia (Globales) ---
window.openRegisterModal = (e) => {
    if (e) e.preventDefault();
    const modal = document.getElementById('register-modal');
    if (modal) modal.style.display = 'flex';
};

window.openEmployeeModal = () => {
    const modal = document.getElementById('employee-modal');
    if (modal) {
        modal.style.display = 'flex';
        toggleBankFields(); // Asegurar estado inicial correcto
    }
};

window.toggleBankFields = () => {
    const payment = document.getElementById('emp-payment').value;
    const bankFields = document.getElementById('bank-fields');
    if (bankFields) {
        bankFields.style.display = (payment === 'Transferencia') ? 'grid' : 'none';
    }
};

window.openEmployerModal = () => {
    const modal = document.getElementById('employer-modal');
    if (modal) modal.style.display = 'flex';
};

window.addExtraRow = (listId) => {
    const list = document.getElementById(listId);
    const div = document.createElement('div');
    div.className = 'extra-row';
    div.style = 'display: flex; gap: 0.5rem; margin-bottom: 0.5rem;';
    div.innerHTML = `
        <input type="text" placeholder="Descripción" class="extra-desc" style="flex: 2; padding: 0.5rem; border: 1px solid #ddd; border-radius: 5px;">
        <input type="number" placeholder="0.00" class="extra-val" step="0.01" style="flex: 1; padding: 0.5rem; border: 1px solid #ddd; border-radius: 5px;">
        <button type="button" class="btn btn-small btn-danger" onclick="this.parentElement.remove()" style="padding: 0.5rem;"><i data-lucide="trash-2"></i></button>
    `;
    list.appendChild(div);
    lucide.createIcons();
};

window.closeAllModals = () => {
    document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
};

// --- Configuration (URLs con Firma de Seguridad) ---
const FLOW_REGISTER_URL = "https://defaulte9f79ab3916f42a1b5f9b4a1f6a005.a0.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/9ccaf784e77a414ab9b032ae8ad7d450/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=T14nJ8Ua92IMSXenhegGsk-O4K3pKwQNIZiJYP1crQM";
const FLOW_LOGIN_URL = "https://defaulte9f79ab3916f42a1b5f9b4a1f6a005.a0.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/3c6016458c2843afb5091b6e1b0db33e/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=CGe27Evn1LUONCnyq53oPTRwjdecJ-H3vZMtX9842go";
const FLOW_FETCH_DATA_URL = "https://defaulte9f79ab3916f42a1b5f9b4a1f6a005.a0.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/c1f37f25565f4d24bca4da0a75c8ce67/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=tZ3nHj2huyoMFsznm5zseNflMkf7RYak_SZHj8yKPAc";
const FLOW_SAVE_EMPLOYEE_URL = "https://defaulte9f79ab3916f42a1b5f9b4a1f6a005.a0.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/92f4023f477248a38a1c48ad6e9daa93/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=cBEZ7UO_0f0KU5-2nt88BqSzhnS38cSX7qd-Fu_giIk";
const FLOW_SEND_PAYROLL_URL = "https://defaulte9f79ab3916f42a1b5f9b4a1f6a005.a0.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/0ef16f7a85f54fcfaab7d494c333e1a9/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=1ptS3PLYkNAlxx-jXZYQtWnQoe_J6Pvu-deV4-DI3T0";

// --- Session & State ---
const persistentEmployer = JSON.parse(localStorage.getItem('persistentEmployer')) || null;
let currentSession = JSON.parse(localStorage.getItem('currentSession')) || null;

// Si hay sesión pero no empleador, intentamos recuperar de persistencia
if (currentSession && persistentEmployer) {
    currentSession = { ...currentSession, ...persistentEmployer };
}

let employees = [];
let payrollHistory = {};
let employer = persistentEmployer || { name: '', company: '', ruc: '' };

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    initDate();
    initEventListeners();
    updateSignatureStatus(); // Verificar firma al cargar

    if (currentSession) {
        showApp();
        // Llenar campos de configuración con lo que tenemos
        if (employer.company) document.getElementById('company-name').value = employer.company;
        if (employer.ruc) document.getElementById('company-ruc').value = employer.ruc;
        if (employer.name) document.getElementById('company-owner').value = employer.name;
    } else {
        showLogin();
    }
});

function initEventListeners() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);

    const registerForm = document.getElementById('register-form');
    if (registerForm) registerForm.onsubmit = handleRegister;

    const employeeForm = document.getElementById('employee-form');
    if (employeeForm) employeeForm.onsubmit = handleSaveEmployee;

    const payrollForm = document.getElementById('payroll-form');
    if (payrollForm) payrollForm.onsubmit = handlePayrollSubmit;

    const employerForm = document.getElementById('employer-form');
    if (employerForm) employerForm.onsubmit = handleEmployerUpdate;

    const bulkBtn = document.getElementById('bulk-generate-btn');
    if(bulkBtn) bulkBtn.onclick = handleBulkGenerate;

    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.onclick = window.closeAllModals;
    });

    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = item.getAttribute('data-section');
            if (sectionId) switchSection(sectionId, item);
        });
    });

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);

    const monthInput = document.getElementById('payroll-month');
    if (monthInput) monthInput.addEventListener('change', renderGeneratorList);
}

function showLogin() {
    document.getElementById('login-overlay').style.display = 'flex';
    document.querySelector('.app-container').style.display = 'none';
}

function showApp() {
    document.getElementById('login-overlay').style.display = 'none';
    document.querySelector('.app-container').style.display = 'flex';
    employer = currentSession.employer;

    const dispCompany = document.getElementById('display-company');
    if (dispCompany) dispCompany.textContent = employer.company;

    const dispCeo = document.getElementById('display-ceo');
    if (dispCeo) dispCeo.textContent = employer.name;

    loadDataFromMicrosoft();
}

// --- Auth Handlers ---
async function handleLogin(e) {
    e.preventDefault();
    const ruc = document.getElementById('login-ruc').value;
    const pin = document.getElementById('login-pin').value;

    try {
        const response = await fetch(FLOW_LOGIN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ruc, pin })
        });

        const text = await response.text(); // Leemos como texto primero
        if (response.ok) {
            try {
                const data = JSON.parse(text);
                if (data && (data.Title || data.RUC)) {
                    const empData = {
                        name: data.NombreCEO || data.ceo || 'CEO',
                        company: data.NombreEmpresa || data.name || 'Empresa',
                        ruc: data.Title || data.ruc
                    };
                    
                    currentSession = { ruc: ruc, employer: empData };
                    
                    // Recuperar p12 de persistencia si coincide el RUC
                    if (persistentEmployer && persistentEmployer.ruc === ruc) {
                        currentSession = { ...currentSession, ...persistentEmployer };
                        employer = { ...empData, ...persistentEmployer };
                    } else {
                        employer = empData;
                    }

                    localStorage.setItem('currentSession', JSON.stringify(currentSession));
                    showApp();
                } else {
                    alert("RUC o PIN incorrectos (No se encontró la empresa en SharePoint).");
                }
            } catch (jsonErr) {
                alert("Microsoft envió una respuesta vacía. Revisa el historial del flujo de Login.");
            }
        } else {
            alert("Error de Microsoft (" + response.status + "): " + text);
        }
    } catch (err) {
        alert("Error de conexión: " + err.message);
    }
}

async function handleRegister(e) {
    if (e) e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerText;
    btn.innerText = "Registrando...";
    btn.disabled = true;

    const payload = {
        ruc: document.getElementById('reg-ruc').value,
        name: document.getElementById('reg-company').value,
        ceo: document.getElementById('reg-ceo').value,
        pin: document.getElementById('reg-pin').value
    };

    try {
        const response = await fetch(FLOW_REGISTER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert("¡EMPRESA REGISTRADA CON ÉXITO! Ya puedes iniciar sesión.");
            window.closeAllModals();
        } else {
            alert("Error de Microsoft: " + response.status);
        }
    } catch (err) {
        alert("Error crítico: " + err.message);
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

async function handleEmployerUpdate(e) {
    if(e) e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.innerText = "Guardando...";

    const p12File = document.getElementById('p12-file').files[0];
    let p12Base64 = currentSession.p12 || "";
    
    if (p12File) {
        p12Base64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(p12File);
        });
    }

    const updatedData = {
        name: document.getElementById('company-owner').value,
        company: document.getElementById('company-name').value,
        ruc: document.getElementById('company-ruc').value,
        p12: p12Base64,
        p12Pass: document.getElementById('p12-password').value || currentSession.p12Pass
    };

    // Actualizar sesión local y persistencia
    currentSession = { ...currentSession, ...updatedData };
    localStorage.setItem('currentSession', JSON.stringify(currentSession));
    localStorage.setItem('persistentEmployer', JSON.stringify(updatedData)); // Guardado permanente
    employer = updatedData;
    
    alert("Configuración actualizada con éxito.");
    btn.innerText = "Guardar Cambios";
    updateSignatureStatus();
    renderDashboard();
}

function updateSignatureStatus() {
    const fileLabel = document.querySelector('label[for="p12-file"]') || { innerText: '' };
    const statusEl = document.getElementById('p12-status');
    
    if (currentSession && currentSession.p12) {
        if (!statusEl) {
            const span = document.createElement('span');
            span.id = 'p12-status';
            span.innerHTML = ' <strong style="color: var(--success);">✅ Certificado Cargado</strong>';
            document.querySelector('label[for="p12-file"]')?.appendChild(span);
        }
        if (document.getElementById('p12-password')) {
            document.getElementById('p12-password').placeholder = "•••••••• (Contraseña guardada)";
        }
    }
}

async function handleSaveEmployee(e) {
    if (e) e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerText;
    btn.innerText = "Guardando...";
    btn.disabled = true;

    const payload = {
        names: document.getElementById('emp-names').value,
        id: document.getElementById('emp-id').value,
        email: document.getElementById('emp-email').value,
        paymentMethod: document.getElementById('emp-payment').value,
        bank: document.getElementById('emp-bank').value,
        accountType: document.getElementById('emp-account-type').value,
        account: document.getElementById('emp-account-number').value,
        ruc: currentSession.ruc
    };

    try {
        const response = await fetch(FLOW_SAVE_EMPLOYEE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert("¡Empleado guardado con éxito!");
            window.closeAllModals();
            loadDataFromMicrosoft(); // Recargar la lista
        } else {
            alert("Error al guardar empleado (Microsoft " + response.status + ").");
        }
    } catch (err) {
        alert("Error de conexión: " + err.message);
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

// --- Data Fetching & Rendering ---
async function loadDataFromMicrosoft() {
    try {
        const response = await fetch(FLOW_FETCH_DATA_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ruc: currentSession.ruc })
        });

        const data = await response.json();
        employees = data.empleados || [];

        payrollHistory = {};
        if (data.roles) {
            data.roles.forEach(role => {
                const key = `${role.EmpleadoCedula}_${role.Mes}`;
                payrollHistory[key] = {
                    salary: role.Sueldo,
                    iess: role.IESS,
                    net: role.Neto,
                    deductions: []
                };
            });
        }

        renderEmployees();
        renderDashboard();
        renderGeneratorList();
        
        // Cargar datos en la sección de configuración
        if (employer) {
            if(document.getElementById('company-name')) document.getElementById('company-name').value = employer.company || '';
            if(document.getElementById('company-ruc')) document.getElementById('company-ruc').value = employer.ruc || '';
            if(document.getElementById('company-owner')) document.getElementById('company-owner').value = employer.name || '';
            updateSignatureStatus();
        }
    } catch (err) {
        console.error("Error cargando datos:", err);
    }
}

function switchSection(sectionId, navItem) {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    navItem.classList.add('active');
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    const section = document.getElementById(sectionId);
    if (section) section.classList.add('active');

    const title = document.getElementById('section-title');
    if (title) title.textContent = navItem.querySelector('span').textContent;

    if (sectionId === 'generator') renderGeneratorList();
    if (sectionId === 'dashboard') renderDashboard();
}

function logout(e) {
    if(e) e.preventDefault();
    localStorage.removeItem('currentSession');
    // Mantenemos 'persistentEmployer' intacto
    location.reload();
}

function renderEmployees() {
    const list = document.getElementById('employees-table-body');
    if(!list) return;
    list.innerHTML = '';
    employees.forEach((emp) => {
        const tr = document.createElement('tr');
        const id = emp.Title || emp.id;
        tr.innerHTML = `
            <td>${emp.NombreCompleto || emp.names || 'N/A'}</td>
            <td>${id}</td>
            <td>${emp.Email || emp.email || '-'}</td>
            <td>${emp.FormaPago || emp.paymentMethod || '-'}</td>
            <td>
                <button class="action-btn edit" onclick="editEmployee('${id}')"><i data-lucide="edit"></i></button>
            </td>
        `;
        list.appendChild(tr);
    });
    lucide.createIcons();
}

window.editEmployee = (id) => {
    const emp = employees.find(e => (e.Title || e.id) === id);
    if (!emp) return;

    document.getElementById('modal-title').textContent = "Editar Empleado";
    document.getElementById('edit-index').value = id;
    document.getElementById('emp-names').value = emp.NombreCompleto || emp.names || '';
    document.getElementById('emp-id').value = id;
    document.getElementById('emp-email').value = emp.Email || emp.email || '';
    document.getElementById('emp-payment').value = emp.FormaPago || emp.paymentMethod || 'Efectivo';
    document.getElementById('emp-bank').value = emp.Banco || emp.bank || '';
    document.getElementById('emp-account-type').value = emp.TipoCuenta || emp.accountType || 'Ahorros';
    document.getElementById('emp-account-number').value = emp.Cuenta || emp.account || '';
    
    window.openEmployeeModal();
};

function renderGeneratorList() {
    const list = document.getElementById('generator-list');
    if (!list) return;
    const month = document.getElementById('payroll-month').value;
    list.innerHTML = '';

    if (!month) return;

    employees.forEach((emp) => {
        const id = emp.Title || emp.id;
        const key = `${id}_${month}`;
        const config = payrollHistory[key] || { salary: 0, iess: 0, net: 0 };

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="checkbox" class="emp-select" data-id="${id}"></td>
            <td>${emp.NombreCompleto || emp.names}</td>
            <td>$${config.salary.toFixed(2)}</td>
            <td>$${config.iess.toFixed(2)}</td>
            <td><strong>$${config.net.toFixed(2)}</strong></td>
            <td>
                <button class="action-btn config" title="Configurar Sueldo" onclick="openPayrollConfig('${id}')"><i data-lucide="settings"></i></button>
            </td>
            <td>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="action-btn" title="Previsualizar" onclick="previewPayroll('${id}')" style="color: var(--secondary);"><i data-lucide="eye"></i></button>
                    <button class="action-btn" title="Descargar PDF" onclick="sendPayroll('${id}')" ${config.net === 0 ? 'disabled' : ''} style="color: var(--primary);"><i data-lucide="download"></i></button>
                    <button class="action-btn" title="Re-enviar por Correo" onclick="sendPayrollEmail('${id}')" ${config.net === 0 ? 'disabled' : ''} style="color: var(--success);"><i data-lucide="refresh-cw"></i></button>
                </div>
            </td>
        `;
        list.appendChild(tr);
    });
    lucide.createIcons();
}

window.openPayrollConfig = (empId) => {
    const emp = employees.find(e => (e.Title || e.id) === empId);
    if (!emp) return;

    document.getElementById('payroll-emp-id-hidden').value = empId;
    document.getElementById('payroll-emp-name').textContent = emp.NombreCompleto || emp.names;
    document.getElementById('payroll-emp-id-display').textContent = "ID: " + (emp.Title || emp.id);
    document.getElementById('income-list').innerHTML = '';
    document.getElementById('deduction-list').innerHTML = '';

    const modal = document.getElementById('payroll-modal');
    if (modal) modal.style.display = 'flex';
};

function handlePayrollSubmit(e) {
    e.preventDefault();
    const empId = document.getElementById('payroll-emp-id-hidden').value;
    const baseSalary = parseFloat(document.getElementById('base-salary').value);
    const month = document.getElementById('payroll-month').value;

    let extraIncome = 0;
    document.querySelectorAll('#income-list .extra-row').forEach(row => {
        extraIncome += parseFloat(row.querySelector('.extra-val').value) || 0;
    });

    let extraDeductions = 0;
    document.querySelectorAll('#deduction-list .extra-row').forEach(row => {
        extraDeductions += parseFloat(row.querySelector('.extra-val').value) || 0;
    });

    const iess = (baseSalary + extraIncome) * 0.0945;
    const net = (baseSalary + extraIncome) - iess - extraDeductions;

    payrollHistory[`${empId}_${month}`] = {
        salary: baseSalary,
        extraIncome: extraIncome,
        extraDeductions: extraDeductions,
        iess: iess,
        net: net
    };

    window.closeAllModals();
    renderGeneratorList();
}

async function handleBulkGenerate() {
    const selected = document.querySelectorAll('.emp-select:checked');
    if (selected.length === 0) {
        alert("Por favor, selecciona al menos un empleado.");
        return;
    }

    if (confirm(`¿Deseas GENERAR y ENVIAR automáticamente ${selected.length} roles de pago?`)) {
        // Mostrar aviso de carga masivo
        const loader = document.createElement('div');
        loader.id = 'bulk-loader';
        loader.innerHTML = `
            <div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:10000;display:flex;flex-direction:column;align-items:center;justify-content:center;color:white;font-family:sans-serif;">
                <div class="spinner" style="border:4px solid rgba(255,255,255,0.3);border-top:4px solid #fff;border-radius:50%;width:40px;height:40px;animation:spin 1s linear infinite;margin-bottom:20px;"></div>
                <h2 id="bulk-status">Generando y Firmando Roles...</h2>
                <p id="bulk-counter">Procesando 0 de ${selected.length}</p>
            </div>
            <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
        `;
        document.body.appendChild(loader);

        let count = 0;
        for (const cb of selected) {
            count++;
            document.getElementById('bulk-counter').innerText = `Procesando ${count} de ${selected.length}`;
            const empId = cb.getAttribute('data-id');
            await sendPayrollEmail(empId, true); // Envío automático
        }
        
        document.body.removeChild(loader);
        alert("✅ Todos los roles han sido generados y enviados.");
    }
}

async function sendPayrollEmail(empId, silent = false) {
    const emp = employees.find(e => (e.Title || e.id) === empId);
    const month = document.getElementById('payroll-month').value;
    const data = payrollHistory[`${empId}_${month}`];

    if (!data || data.net === 0) {
        if (!silent) alert("Primero configura el sueldo del empleado.");
        return;
    }

    const email = emp.Email || emp.email || emp.Correo || emp.CorreoElectronico || "";
    if (!email) {
        if (!silent) alert(`❌ El empleado ${emp.NombreCompleto || emp.names || emp.Title} no tiene un correo configurado.`);
        return;
    }

    try {
        // 1. Detección robusta de la librería jsPDF
        const jsPDFLib = (window.jspdf && window.jspdf.jsPDF) ? window.jspdf.jsPDF : window.jsPDF;
        if (!jsPDFLib) throw new Error("La librería de PDF no se cargó correctamente. Por favor, refresca la página.");
        
        const doc = new jsPDFLib();
        const pageWidth = doc.internal.pageSize.getWidth();
        
        // --- Encabezado ---
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text(currentSession.name || "EMPRESA", 15, 20);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(`RUC: ${currentSession.ruc || ""}`, 15, 26);
        doc.text(`REPRESENTANTE: ${currentSession.company || ""}`, 15, 31);
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("ROL DE PAGO INDIVIDUAL", pageWidth - 15, 20, { align: "right" });
        doc.setFontSize(12);
        doc.text(`MES DE ${month}`, pageWidth - 15, 26, { align: "right" });
        
        doc.setLineWidth(0.5);
        doc.line(15, 36, pageWidth - 15, 36);
        
        // --- Datos Empleado ---
        doc.setFontSize(11);
        doc.text("DATOS DEL EMPLEADO", 15, 45);
        doc.setFontSize(9);
        doc.text(`NOMBRES: ${emp.NombreCompleto || emp.names}`, 15, 52);
        doc.text(`CÉDULA: ${emp.Cedula || emp.id}`, 15, 57);
        doc.text(`PERIODO: desde 01/${month} al 30/${month}`, 15, 62);
        doc.text(`DÍAS TRABAJADOS: ${data.days || 30}`, 15, 67);
        
        // --- Tabla Ingresos ---
        doc.autoTable({
            startY: 72,
            head: [['DESCRIPCIÓN DE INGRESOS', 'VALOR']],
            body: [
                ['Sueldo Unificado', data.baseSalary.toFixed(2)],
                ...(data.extrasIn || []).map(x => [x.desc, x.val.toFixed(2)]),
                [{ content: 'TOTAL INGRESOS', styles: { fontStyle: 'bold' } }, { content: data.totalIn.toFixed(2), styles: { fontStyle: 'bold' } }]
            ],
            theme: 'striped',
            headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
            margin: { left: 15, right: 15 }
        });
        
        // --- Tabla Egresos ---
        doc.autoTable({
            startY: doc.lastAutoTable.finalY + 10,
            head: [['DESCRIPCIÓN DE DESCUENTOS', 'VALOR']],
            body: [
                ['Aporte Personal IESS (9.45%)', (data.baseSalary * 0.0945).toFixed(2)],
                ...(data.extrasOut || []).map(x => [x.desc, x.val.toFixed(2)]),
                [{ content: 'TOTAL DESCUENTOS', styles: { fontStyle: 'bold' } }, { content: data.totalOut.toFixed(2), styles: { fontStyle: 'bold' } }]
            ],
            theme: 'striped',
            headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
            margin: { left: 15, right: 15 }
        });
        
        // --- Totales Finales ---
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(10);
        doc.text("NETO A RECIBIR", 15, finalY);
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text(`$${data.net.toFixed(2)}`, 15, finalY + 8);
        
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(`FORMA DE PAGO: ${emp.MetodoPago || "TRANSFERENCIA"}`, 15, finalY + 15);
        doc.text(`BANCO/CUENTA: ${emp.Banco || ""} | ${emp.TipoCuenta || ""} | ${emp.NumeroCuenta || ""}`, 15, finalY + 20);
        
        // --- Firmas ---
        doc.text("Firma del Empleador", 15, finalY + 30);
        doc.text("Firma del Empleado", 15, finalY + 35);
        
        const pdfBlob = doc.output('blob');

        // 2. Firmar el PDF (Con protección)
        let finalPdfBlob = pdfBlob;
        try {
            finalPdfBlob = await signPDF(pdfBlob);
        } catch (e) {
            console.warn("Firma falló, enviando original:", e);
        }
        
        // 3. Convertir a Base64 para enviar
        const reader = new FileReader();
        const base64Pdf = await new Promise(resolve => {
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(finalPdfBlob);
        });

        // 4. Enviar a Power Automate
        const emailLimpio = email.trim();
        const payload = {
            to: emailLimpio,
            To: emailLimpio,
            email: emailLimpio,
            Email: emailLimpio,
            correo: emailLimpio,
            subject: `Rol de Pago - ${month} - ${emp.NombreCompleto || "Empleado"}`,
            body: `Se adjunta el rol de pago correspondiente al mes de ${month}.`,
            names: emp.NombreCompleto || emp.names || "Empleado",
            month: month,
            ruc: currentSession.ruc,
            empId: empId,
            fileName: `Rol_${empId}_${month}.pdf`,
            fileContent: base64Pdf
        };

        console.log("🚀 Enviando Payload Final Blindado...");

        const response = await fetch(FLOW_SEND_PAYROLL_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            if (!silent) alert(`✅ Rol firmado y enviado con éxito a ${emp.Email || emp.email}`);
        } else {
            const errText = await response.text();
            console.error("Error Flow:", errText);
            if (!silent) alert(`❌ Error de Microsoft (${response.status}): El correo no se envió.`);
        }
    } catch (err) {
        console.error("Error crítico en proceso:", err);
        if (!silent) alert("❌ Error crítico: No se pudo generar o enviar el PDF. Revisa tu conexión.");
    }
}

async function signPDF(pdfBlob) {
    if (!currentSession.p12 || !currentSession.p12Pass) return pdfBlob;

    try {
        const pdfBytes = await pdfBlob.arrayBuffer();
        const { PDFDocument, rgb, StandardFonts } = PDFLib;
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const { width, height } = firstPage.getSize();
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        // 1. Generar Código QR
        const qrData = `FIRMADO POR: ${employer.name}\nEMPRESA: ${employer.company}\nRUC: ${employer.ruc}\nFECHA: ${new Date().toISOString()}`;
        const qrBase64 = await QRCode.toDataURL(qrData, { margin: 1, width: 100 });
        const qrImage = await pdfDoc.embedPng(qrBase64);

        // 2. Estampar cuadro visual (DISEÑO UNIFICADO)
        const boxW = 220; 
        const boxH = 42;
        const x = width - boxW - 40; 
        const y = 60; 
        const blueCol = rgb(0.05, 0.25, 0.5);

        // A. Fondo total blanco
        firstPage.drawRectangle({
            x, y, width: boxW, height: boxH,
            color: rgb(1, 1, 1),
        });

        // B. Franja azul lateral (Sólida)
        firstPage.drawRectangle({
            x: x, y: y, width: 22, height: boxH,
            color: blueCol,
        });

        // C. Marco exterior (Una sola línea para todos los bordes)
        firstPage.drawRectangle({
            x, y, width: boxW, height: boxH,
            borderColor: blueCol,
            borderWidth: 1.5,
        });
        
        // D. Texto Vertical "FIRMADO" (Centrado)
        firstPage.drawText("FIRMADO", {
            x: x + 8, y: y + 8, size: 7, color: rgb(1, 1, 1), rotate: { angle: 90, type: 'degrees' }, font: fontBold
        });

        // E. Textos de la Firma (Subidos un poquito para centrado perfecto)
        firstPage.drawText("FIRMADO ELECTRÓNICAMENTE", {
            x: x + 30, y: y + 30, size: 8.5, color: blueCol, font: fontBold
        });

        const infoText = `Firmante: ${employer.name}\nFecha: ${new Date().toLocaleString()}\nEntidad: NominaPro Cloud`;
        firstPage.drawText(infoText, {
            x: x + 30, y: y + 13, size: 7, color: rgb(0.2, 0.2, 0.2), lineHeight: 9
        });

        // F. QR (Alineado a la derecha)
        firstPage.drawImage(qrImage, {
            x: x + boxW - 35, y: y + 6, width: 30, height: 30
        });

        const signedPdfBytes = await pdfDoc.save({ useObjectStreams: false });
        return new Blob([signedPdfBytes], { type: 'application/pdf' });
    } catch (err) {
        console.error("Error crítico firma:", err);
        throw err;
    }
}

window.toggleSelectAll = (source) => {
    document.querySelectorAll('.emp-select').forEach(cb => cb.checked = source.checked);
};

window.previewPayroll = (empId) => {
    const emp = employees.find(e => (e.Title || e.id) === empId);
    const month = document.getElementById('payroll-month').value;
    const data = payrollHistory[`${empId}_${month}`];

    if (!data || data.net === 0) {
        alert("Primero configura el sueldo del empleado.");
        return;
    }

    fillPdfTemplate(emp, data, month);
    const template = document.getElementById('pdf-template');
    template.style.left = '0';
    template.style.display = 'block';
};

async function initDate() {
    const now = new Date();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const monthStr = `${now.getFullYear()}-${month}`;
    const input = document.getElementById('payroll-month');
    if (input) {
        input.value = monthStr;
        // Forzamos un renderizado inicial si ya hay sesión
        if (currentSession) renderGeneratorList();
    }
}

async function sendPayroll(empId) {
    const emp = employees.find(e => (e.Title || e.id) === empId);
    const month = document.getElementById('payroll-month').value;
    const data = payrollHistory[`${empId}_${month}`];

    try {
        // 1. Detección robusta de la librería jsPDF
        const jsPDFLib = (window.jspdf && window.jspdf.jsPDF) ? window.jspdf.jsPDF : window.jsPDF;
        if (!jsPDFLib) throw new Error("La librería de PDF no se cargó correctamente. Por favor, refresca la página.");

        const doc = new jsPDFLib();
        const pageWidth = doc.internal.pageSize.getWidth();
        
        // --- Encabezado ---
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text(currentSession.name || "EMPRESA", 15, 20);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(`RUC: ${currentSession.ruc || ""}`, 15, 26);
        doc.text(`REPRESENTANTE: ${currentSession.company || ""}`, 15, 31);
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("ROL DE PAGO INDIVIDUAL", pageWidth - 15, 20, { align: "right" });
        doc.setFontSize(12);
        doc.text(`MES DE ${month}`, pageWidth - 15, 26, { align: "right" });
        
        doc.setLineWidth(0.5);
        doc.line(15, 36, pageWidth - 15, 36);
        
        // --- Datos Empleado ---
        doc.setFontSize(11);
        doc.text("DATOS DEL EMPLEADO", 15, 45);
        doc.setFontSize(9);
        doc.text(`NOMBRES: ${emp.NombreCompleto || emp.names}`, 15, 52);
        doc.text(`CÉDULA: ${emp.Cedula || emp.id}`, 15, 57);
        doc.text(`PERIODO: desde 01/${month} al 30/${month}`, 15, 62);
        doc.text(`DÍAS TRABAJADOS: ${data.days || 30}`, 15, 67);
        
        // --- Tablas ---
        doc.autoTable({
            startY: 72,
            head: [['DESCRIPCIÓN DE INGRESOS', 'VALOR']],
            body: [
                ['Sueldo Unificado', data.baseSalary.toFixed(2)],
                ...(data.extrasIn || []).map(x => [x.desc, x.val.toFixed(2)]),
                [{ content: 'TOTAL INGRESOS', styles: { fontStyle: 'bold' } }, { content: data.totalIn.toFixed(2), styles: { fontStyle: 'bold' } }]
            ],
            theme: 'striped',
            headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
            margin: { left: 15, right: 15 }
        });
        
        doc.autoTable({
            startY: doc.lastAutoTable.finalY + 10,
            head: [['DESCRIPCIÓN DE DESCUENTOS', 'VALOR']],
            body: [
                ['Aporte Personal IESS (9.45%)', (data.baseSalary * 0.0945).toFixed(2)],
                ...(data.extrasOut || []).map(x => [x.desc, x.val.toFixed(2)]),
                [{ content: 'TOTAL DESCUENTOS', styles: { fontStyle: 'bold' } }, { content: data.totalOut.toFixed(2), styles: { fontStyle: 'bold' } }]
            ],
            theme: 'striped',
            headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
            margin: { left: 15, right: 15 }
        });
        
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(10);
        doc.text("NETO A RECIBIR", 15, finalY);
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text(`$${data.net.toFixed(2)}`, 15, finalY + 8);
        
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(`FORMA DE PAGO: ${emp.MetodoPago || "TRANSFERENCIA"}`, 15, finalY + 15);
        doc.text(`BANCO/CUENTA: ${emp.Banco || ""} | ${emp.TipoCuenta || ""} | ${emp.NumeroCuenta || ""}`, 15, finalY + 20);
        
        doc.text("Firma del Empleador", 15, finalY + 30);
        doc.text("Firma del Empleado", 15, finalY + 35);
        
        const pdfBlob = doc.output('blob');
        
        let finalPdfBlob = pdfBlob;
        try {
            finalPdfBlob = await signPDF(pdfBlob);
        } catch (e) {
            console.warn("Firma falló, descargando original.");
        }
        
        const url = URL.createObjectURL(finalPdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Rol_${empId}_${month}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
    } catch (err) {
        console.error("Error descarga:", err);
        alert(`❌ Error al generar el PDF: ${err.message}`);
    }
}

function fillPdfTemplate(emp, data, month) {
    // Cálculo de fechas del mes
    const [year, monthNum] = month.split('-');
    const lastDay = new Date(year, monthNum, 0).getDate();
    const dateRange = `desde: 01/${monthNum}/${year} al ${lastDay}/${monthNum}/${year}`;
    
    // Sello de tiempo generación
    const now = new Date();
    const timestamp = now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    document.getElementById('pdf-company-name').textContent = employer.company;
    document.getElementById('pdf-ruc').textContent = employer.ruc;
    document.getElementById('pdf-owner').textContent = employer.name;
    document.getElementById('pdf-period').textContent = `MES DE ${month}`;
    document.getElementById('pdf-date-range').textContent = dateRange;
    document.getElementById('pdf-days').textContent = lastDay; 
    document.getElementById('pdf-generation-time').textContent = timestamp;
    
    document.getElementById('pdf-emp-name').textContent = emp.NombreCompleto || emp.names;
    document.getElementById('pdf-emp-id').textContent = emp.Title || emp.id;
    document.getElementById('pdf-salary').textContent = data.salary.toFixed(2);
    document.getElementById('pdf-iess').textContent = data.iess.toFixed(2);
    document.getElementById('pdf-other-deductions').textContent = (data.extraDeductions || 0).toFixed(2);
    document.getElementById('pdf-total-income').textContent = (data.salary + (data.extraIncome || 0)).toFixed(2);
    document.getElementById('pdf-total-deductions').textContent = (data.iess + (data.extraDeductions || 0)).toFixed(2);
    document.getElementById('pdf-net-pay').textContent = `$${data.net.toFixed(2)}`;
    
    const method = emp.FormaPago || emp.paymentMethod || 'EFECTIVO';
    document.getElementById('pdf-payment-method').textContent = method.toUpperCase();

    const bankRow = document.getElementById('pdf-bank-row');
    const bankInfo = document.getElementById('pdf-bank-info');
    if (method.toUpperCase().includes('TRANSFERENCIA')) {
        bankRow.style.display = 'block';
        const bank = emp.Banco || emp.bank || '---';
        const type = emp.TipoCuenta || emp.accountType || '---';
        const acc = emp.Cuenta || emp.account || '---';
        bankInfo.textContent = `${bank} | ${type} | ${acc}`;
    } else {
        bankRow.style.display = 'none';
    }
}

function renderDashboard() {
    const el = document.getElementById('stat-employees');
    if (el) el.textContent = employees.length;
}

function initDate() {
    const el = document.getElementById('current-date');
    if (el) el.textContent = new Date().toLocaleDateString();
}
