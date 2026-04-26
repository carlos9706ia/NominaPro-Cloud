# Instrucciones Avanzadas: Base de Datos y Hosting Microsoft

## 1. Configuración de Listas en SharePoint
Crea estas 3 listas en un sitio de SharePoint:
- **Empresas**: Columnas `RUC` (Title), `NombreEmpresa`, `NombreCEO`, `PIN`.
- **Empleados**: Columnas `Cedula` (Title), `NombreCompleto`, `Email`, `EmpresaRUC`, `FormaPago`, `Banco`, `Cuenta`, `TipoCuenta`.
- **RolesGenerados**: Columnas `ID_Rol` (Title), `EmpleadoCedula`, `EmpresaRUC`, `Mes`, `Sueldo`, `IESS`, `Neto`.

## 2. Flujo de Registro de Empresa
1.  Nuevo Flujo HTTP en Power Automate.
2.  JSON Payload: `{ "name": "string", "ruc": "string", "ceo": "string", "pin": "string" }`.
3.  Acción: **SharePoint - Crear elemento** en la lista "Empresas".
4.  Acción: **Respuesta** (Código 200).
5.  Copia la URL y pégala en `app.js`.

## 3. Flujo de Inicio de Sesión (Login)
1.  Nuevo Flujo HTTP.
2.  JSON Payload: `{ "ruc": "string", "pin": "string" }`.
3.  Acción: **SharePoint - Obtener elementos** (Get items).
    - Usar Filtro (OData): `Title eq '@{triggerBody()?['ruc']}' and PIN eq '@{triggerBody()?['pin']}'`.
4.  Acción: **Condición**.
    - Si el resultado de "Obtener elementos" no está vacío:
        - **Respuesta**: Código 200 con los datos de la empresa.
    - Si está vacío:
        - **Respuesta**: Código 401 (Error de acceso).

## 4. Hosting en Microsoft Azure
1.  Crea una cuenta gratuita en [portal.azure.com](https://portal.azure.com).
2.  Busca **Static Web Apps**.
3.  Haz clic en **Crear**.
4.  Selecciona tu suscripción y un nombre para la app.
5.  En "Deployment details", selecciona GitHub (esto automatiza las actualizaciones).
6.  Azure te dará una URL pública segura para tu sistema de roles.

---
**Nota:** El archivo `app.js` ya está preparado para recibir estas URLs.
