# ☁️ Guía de Despliegue en Azure VM (Windows) - RDL Intelligence Hub

Esta guía describe los pasos necesarios para tener **RDL Intelligence Hub** encendido 24/7 en una Máquina Virtual de Windows en Azure y accesible desde cualquier computadora o teléfono móvil a través de Internet.

---

## 🚀 Paso 1: Abrir el Puerto 9060 en Azure (Network Security Group - NSG)

Por defecto, Azure bloquea todo el tráfico entrante de Internet excepto el puerto RDP (3389). Para permitir que colaboradores y evaluadores se conecten a la aplicación:

1. Inicia sesión en [portal.azure.com](https://portal.azure.com).
2. En la barra de búsqueda superior, escribe **Máquinas virtuales** (Virtual machines) y selecciona tu VM de Windows.
3. En el menú lateral izquierdo, haz clic en **Redes** (Networking).
4. Haz clic en el botón azul **Agregar regla de puerto de entrada** (Add inbound port rule).
5. Llena el formulario con los siguientes valores exactos:
   - **Source (Origen):** `Any`
   - **Source port ranges:** `*`
   - **Destination (Destino):** `Any`
   - **Service (Servicio):** `Custom`
   - **Destination port ranges (Puertos de destino):** `9060`
   - **Protocol (Protocolo):** `TCP`
   - **Action (Acción):** `Allow` (Permitir)
   - **Priority (Prioridad):** `300` (o cualquier número disponible menor a 4000)
   - **Name (Nombre):** `Allow_RDL_Hub_9060`
6. Haz clic en **Agregar** (Add). Azure tardará aproximadamente 30 segundos en aplicar la regla.

---

## 💻 Paso 2: Configurar la Máquina Virtual de Windows

Dentro de la Máquina Virtual (conectado por Escritorio Remoto / RDP):

### A. Ejecutar el script de Firewall de Windows
1. Abre la carpeta del proyecto `Desarrollo HUB RDL`.
2. Entra a la carpeta `scripts`.
3. Haz clic derecho sobre **`azure-setup-vm.ps1`** y selecciona **"Ejecutar con PowerShell como Administrador"**.
   - Esto abrirá el puerto `9060` en el Firewall de Windows Defender local.
   - Detectará automáticamente tu **IP Pública** de Azure.

### B. Iniciar el servidor 24/7 en segundo plano
Tienes dos opciones para mantener el servidor corriendo:
- **Opción Rápida (Consola visible):**  
  Haz doble clic en **`scripts\start-service-azure.bat`**. Se abrirá una ventana de comandos con el servidor activo en el puerto `9060`.
- **Opción Servicio Silencioso 24/7 (Recomendado):**  
  Haz clic derecho sobre **`scripts\install-windows-service.ps1`** y selecciona **"Ejecutar con PowerShell como Administrador"**.  
  Esto registrará el servidor en el *Programador de Tareas de Windows* (`Task Scheduler`) para que arranque solo al encender la VM y **nunca se apague**, incluso si cierras la sesión de Escritorio Remoto.

---

## 📱 Paso 3: Conexión desde Otras Computadoras y Celulares

1. Obtén la **Dirección IP Pública** de tu máquina virtual (visible en el portal de Azure en la vista *Información general* de tu VM, por ejemplo `20.120.45.89`).
2. Desde cualquier computadora, laptop, iPhone o Android con conexión a Internet:
   - Abre el navegador web (Chrome, Edge, Safari).
   - Escribe la dirección:  
     👉 **`http://<TU-IP-PUBLICA>:9060`**  
     *(Ejemplo: `http://20.120.45.89:9060`)*

---

## 🔑 Características de la Versión de Test en Azure

- **Accesos Rápidos de 1 Clic (Evaluación Inmediata):**  
  En la pantalla de acceso verás directamente los botones para entrar como:
  - 👑 **Lic. Andrés Cosmes (RH / Admin)** - Gestión de vacaciones, muro y edición de colaboradoras.
  - ⚖️ **Lic. Valeria Mendoza (Abogada Sr)** - Publicación de comunicados y KPIs.
  - 💼 **Lic. Ana Martínez (Abogada Jr)** - Ficha personal, metas y saldo de vacaciones.
- **Flujo Institucional Disponible:**  
  También puedes probar el envío de Magic Link y el Auto-Registro para correos con `@adeltaconsultores.com` o `@rdlabogados.com.mx`.
- **Experiencia Móvil y de Escritorio:**  
  - En celular se adapta verticalmente con botones táctiles y selector `[ 📰 Muro ]` / `[ 👤 Ficha ]`.
  - En computadora ofrece la vista panorámica de dos columnas con buscador `Ctrl + K`.
