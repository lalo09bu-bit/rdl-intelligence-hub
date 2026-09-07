# Guía de Interconexión en Tiempo Real Multi-Computadora
## RDL Intelligence Hub - Plataforma Corporativa

Esta guía explica paso a paso cómo conectar **múltiples computadoras** (Administración, Abogadas SR y Abogadas JR) para que toda la información (muro estilo Facebook, avisos legales, saldo de vacaciones y metas) se **sincronice en tiempo real** a **cero costo**.

---

## 🏢 Escenario 1: Computadoras en la Misma Oficina (Red Local Wi-Fi / Ethernet)

Si todas las computadoras están conectadas a la misma red de la oficina:

### Paso 1: Identificar la Computadora Principal (Nodo Servidor RDL)
1. Elige la computadora de la oficina que actuará como **Servidor Principal** (por ejemplo, la de la Administración o Dirección).
2. Abre la aplicación haciendo doble clic en **`RDL Intelligence Hub`** en tu Escritorio.
3. En la parte superior derecha de la pantalla, haz clic en la etiqueta **`🌐 Red RDL Activa`**.
4. Se abrirá una ventana emergente donde verás la **Dirección IP de esa computadora** (ejemplo: `192.168.1.74`).

### Paso 2: Conectar las demás Computadoras del Equipo
1. En cualquier otra computadora de la oficina (Abogada SR o JR), abre la aplicación **`RDL Intelligence Hub`**.
2. En el Header superior, haz clic en **`🌐 Red RDL Activa`**.
3. En la casilla que dice **"IP del Nodo Servidor RDL"**, escribe la IP de la Computadora Principal (por ejemplo: `192.168.1.74`).
4. Haz clic en **"Vincular y Conectar en Tiempo Real"**.

> ✅ **¡Listo!** A partir de este momento, las aplicaciones quedan vinculadas en tiempo real vía **Socket.io WebSockets**. Cualquier publicación en el muro, reacción de "Me Gusta", comentario o aprobación de vacaciones que ocurra en una máquina se reflejará al instante en las demás computadoras.

---

## 🏠 Escenario 2: Computadoras en Casas / Home Office / Diferentes Sucursales

Si alguna abogada trabaja desde su casa o fuera de la oficina:

1. **Instalar Tailscale (100% Gratuito y Cifrado):**
   - Descarga e instala **[Tailscale](https://tailscale.com)** en la Computadora Principal y en las computadoras remotas (es gratuito para hasta 100 dispositivos).
   - Tailscale asignará una dirección IP segura de red privada (ejemplo: `100.80.120.15`).

2. **Vincular en la Aplicación:**
   - En las computadoras de casa, abre **RDL Intelligence Hub**, haz clic en **`🌐 Red RDL Activa`** e ingresa la IP de Tailscale (`100.80.120.15`).
   - La comunicación viajará de forma 100% segura con cifrado militar de extremo a extremo **sin pagar servidores externos ni licencias cloud**.

---

## ⚡ ¿Cómo Comprobar la Sincronización en Tiempo Real?

1. En la **Computadora A (Admin/SR)**, publica un nuevo aviso en el Muro RDL.
2. En la **Computadora B (Abogada JR)**, verás aparecer el nuevo aviso automáticamente en pantalla con sonido y notificación emergente **sin necesidad de refrescar**.
3. Haz clic en **👍 Me Gusta** en la Computadora B; el contador se actualizará instantáneamente en la Computadora A.
