// --- Funciones de Emergencia (Globales) ---
window.openRegisterModal = (e) => {
    if(e) e.preventDefault();
    const modal = document.getElementById('register-modal');
    if(modal) modal.style.display = 'flex';
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
let currentSession = JSON.parse(localStorage.getItem('currentSession')) || null;
let employees = [];
let payrollHistory = {};
let employer = { name: '', company: '', ruc: '' };

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    initDate();
    initEventListeners();
    
    if (currentSession) {
        showApp();
    } else {
        showLogin();
    }
});

function initEventListeners() {
    const loginForm = document.getElementById('login-form');
    if(loginForm) loginForm.addEventListener('submit', handleLogin);
    
    const registerForm = document.getElementById('register-form');
    if(registerForm) registerForm.onsubmit = handleRegister;

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
    if(logoutBtn) logoutBtn.addEventListener('click', logout);

    const monthInput = document.getElementById('payroll-month');
    if(monthInput) monthInput.addEventListener('change', renderGeneratorList);
}

function showLogin() {
    document.getElementById('login-overlay').style.display = 'flex';
    document.querySelector('.app-container').style.display = 'none';
}

function showApp() {
    document.getElementById('login-overlay').style.display = 'none';
    document.querySelector('.app-container').style.display = 'flex';
    employer = currentSession.employer;
    const disp = document.getElementById('display-company');
    if(disp) disp.textContent = employer.company;
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

        if (response.ok) {
            const data = await response.json();
            if (data && data.Title) {
                currentSession = {
                    ruc: ruc,
                    employer: { 
                        name: data.NombreCEO, 
                        company: data.NombreEmpresa, 
                        ruc: data.Title 
                    }
                };
                localStorage.setItem('currentSession', JSON.stringify(currentSession));
                showApp();
            } else {
                alert("RUC o PIN incorrectos.");
            }
        } else {
            alert("Error de Login (Microsoft " + response.status + ").");
        }
    } catch (err) {
        alert("Error de conexión: " + err.message);
    }
}

async function handleRegister(e) {
    if(e) e.preventDefault();
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
            alert("Error de Microsoft: " + response.status + ". Revisa si el flujo tiene el paso de 'Respuesta'.");
        }
    } catch (err) {
        alert("Error crítico: " + err.message);
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
    } catch (err) {
        console.error("Error cargando datos:", err);
    }
}

function switchSection(sectionId, navItem) {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    navItem.classList.add('active');
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    const section = document.getElementById(sectionId);
    if(section) section.classList.add('active');
    
    const title = document.getElementById('section-title');
    if(title) title.textContent = navItem.querySelector('span').textContent;

    if (sectionId === 'generator') renderGeneratorList();
    if (sectionId === 'dashboard') renderDashboard();
}

function logout(e) {
    e.preventDefault();
    if (confirm('¿Cerrar sesión?')) {
        localStorage.removeItem('currentSession');
        location.reload();
    }
}

function renderEmployees() {
    const list = document.getElementById('employees-table-body');
    if(!list) return;
    list.innerHTML = '';
    employees.forEach((emp) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${emp.NombreCompleto || emp.names || 'N/A'}</td>
            <td>${emp.Title || emp.id}</td>
            <td>${emp.Email || emp.email || '-'}</td>
            <td>${emp.FormaPago || emp.paymentMethod || '-'}</td>
            <td>
                <button class="action-btn edit" onclick="alert('Función en desarrollo')"><i data-lucide="edit"></i></button>
            </td>
        `;
        list.appendChild(tr);
    });
    lucide.createIcons();
}

function renderGeneratorList() {
    const list = document.getElementById('generator-list');
    if(!list) return;
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
                <button class="action-btn config" onclick="openPayrollConfig('${id}')"><i data-lucide="settings"></i></button>
            </td>
            <td>
                <button class="action-btn" onclick="sendPayroll('${id}')" ${config.net === 0 ? 'disabled' : ''}><i data-lucide="mail"></i></button>
            </td>
        `;
        list.appendChild(tr);
    });
    lucide.createIcons();
}

window.openPayrollConfig = (empId) => {
    const salary = prompt("Ingrese el Sueldo Base:", "460");
    if (salary) {
        const s = parseFloat(salary);
        const iess = s * 0.0945;
        const net = s - iess;
        const month = document.getElementById('payroll-month').value;
        payrollHistory[`${empId}_${month}`] = { salary: s, iess: iess, net: net };
        renderGeneratorList();
    }
};

async function sendPayroll(empId) {
    const emp = employees.find(e => (e.Title || e.id) === empId);
    const month = document.getElementById('payroll-month').value;
    const data = payrollHistory[`${empId}_${month}`];

    const template = document.getElementById('pdf-template');
    fillPdfTemplate(emp, data, month);
    template.style.display = 'block';
    
    const pdfOutput = await html2pdf().set({
        margin: 10,
        filename: 'rol.pdf',
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(template).outputPdf('datauristring');
    
    const base64Pdf = pdfOutput.split(',')[1];
    template.style.display = 'none';

    const payload = {
        to: emp.Email || emp.email,
        subject: `Rol de Pago - ${month} - ${employer.company}`,
        body: `Adjunto su rol de pago de ${month}.`,
        fileName: `Rol_${empId}_${month}.pdf`,
        fileContent: base64Pdf,
        ruc: currentSession.ruc,
        cedula: empId,
        mes: month,
        sueldo: data.salary,
        iess: data.iess,
        neto: data.net
    };

    try {
        const response = await fetch(FLOW_SEND_PAYROLL_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) alert("Rol enviado y guardado con éxito.");
    } catch (err) {
        alert("Error al enviar.");
    }
}

function fillPdfTemplate(emp, data, month) {
    document.getElementById('pdf-company-name').textContent = employer.company;
    document.getElementById('pdf-ruc').textContent = employer.ruc;
    document.getElementById('pdf-owner').textContent = employer.name;
    document.getElementById('pdf-period').textContent = `MES DE ${month}`;
    document.getElementById('pdf-emp-name').textContent = emp.NombreCompleto || emp.names;
    document.getElementById('pdf-emp-id').textContent = emp.Title || emp.id;
    document.getElementById('pdf-salary').textContent = data.salary.toFixed(2);
    document.getElementById('pdf-iess').textContent = data.iess.toFixed(2);
    document.getElementById('pdf-total-income').textContent = data.salary.toFixed(2);
    document.getElementById('pdf-total-deductions').textContent = data.iess.toFixed(2);
    document.getElementById('pdf-net-pay').textContent = `$${data.net.toFixed(2)}`;
}

function renderDashboard() {
    const el = document.getElementById('stat-employees');
    if(el) el.textContent = employees.length;
}

function initDate() {
    const el = document.getElementById('current-date');
    if(el) el.textContent = new Date().toLocaleDateString();
}
