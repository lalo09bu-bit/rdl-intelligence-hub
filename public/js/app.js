/**
 * RDL Intelligence Hub - Main Application Entry Point & Login Controller
 * Splash Screen flotante con destellos verdes, control de roles y Metas Ponderadas (100%)
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Iniciando RDL Intelligence Hub...');
    
    // Iniciar Animación de Carga Splash Screen
    runSplashScreenAnimation(() => {
        // Al terminar el Splash, mostrar Pantalla de Login
        document.getElementById('login-modal').classList.add('active');
    });
});

/**
 * Animación Splash Screen con GSAP (Logo flotante RDL + Barra de progreso)
 */
function runSplashScreenAnimation(onCompleteCallback) {
    const splash = document.getElementById('splash-screen');
    const progressBar = document.getElementById('splash-progress');
    const statusText = document.getElementById('splash-status-text');

    const steps = [
        { pct: 25, text: 'Inicializando motor RDL Intelligence Hub...' },
        { pct: 55, text: 'Estableciendo WebSocket en puerto 9060...' },
        { pct: 85, text: 'Cargando esquema SQLite, metas ponderadas (100%) y vacaciones...' },
        { pct: 100, text: '¡Plataforma RDL lista!' }
    ];

    let currentStep = 0;

    const interval = setInterval(() => {
        if (currentStep < steps.length) {
            const step = steps[currentStep];
            if (progressBar) progressBar.style.width = `${step.pct}%`;
            if (statusText) statusText.textContent = step.text;
            currentStep++;
        } else {
            clearInterval(interval);
            setTimeout(() => {
                if (typeof gsap !== 'undefined') {
                    gsap.to(splash, {
                        opacity: 0,
                        duration: 0.6,
                        onComplete: () => {
                            splash.style.display = 'none';
                            if (onCompleteCallback) onCompleteCallback();
                        }
                    });
                } else {
                    splash.style.display = 'none';
                    if (onCompleteCallback) onCompleteCallback();
                }
            }, 400);
        }
    }, 450);
}

/**
 * Controlador de Inicio de Sesión y Gestión de Permisos por Rol
 */
class LoginModule {
    constructor() {
        this.users = [];
        this.init();
    }

    init() {
        this.loadUsers();
        
        // Escuchar nuevo usuario remoto vía Socket.io
        window.addEventListener('rdl_usuario_creado', (e) => {
            this.loadUsers();
        });

        // Formulario de creación de usuario
        document.getElementById('form-create-user')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nombre = document.getElementById('nu-nombre').value.trim();
            const rol = document.getElementById('nu-rol').value;
            const puesto = document.getElementById('nu-puesto').value.trim();
            const email = document.getElementById('nu-email').value.trim();
            const dias_vacaciones_totales = parseInt(document.getElementById('nu-vacaciones').value, 10) || 12;

            try {
                const res = await fetch('/api/usuarios', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre, rol, puesto, email, dias_vacaciones_totales })
                });

                const data = await res.json();
                if (data.success) {
                    document.getElementById('modal-create-user').classList.remove('active');
                    e.target.reset();
                    window.currentUser = data.data;
                    this.onLoginSuccess(data.data);
                } else {
                    alert(data.error || 'Error al crear perfil');
                }
            } catch (err) {
                console.error('Error al crear perfil:', err);
            }
        });
    }

    switchTab(tab) {
        const btnProfiles = document.getElementById('tab-btn-profiles');
        const btnEmail = document.getElementById('tab-btn-email');
        const viewProfiles = document.getElementById('login-profiles-view');
        const viewEmail = document.getElementById('login-email-view');

        if (tab === 'profiles') {
            if (btnProfiles) btnProfiles.classList.add('active');
            if (btnEmail) btnEmail.classList.remove('active');
            if (viewProfiles) viewProfiles.classList.remove('hidden');
            if (viewEmail) viewEmail.classList.add('hidden');
        } else {
            if (btnProfiles) btnProfiles.classList.remove('active');
            if (btnEmail) btnEmail.classList.add('active');
            if (viewProfiles) viewProfiles.classList.add('hidden');
            if (viewEmail) viewEmail.classList.remove('hidden');
        }
    }

    async handleEmailLogin(e) {
        e.preventDefault();
        const email = document.getElementById('login-input-email').value.trim();
        if (!email) return;

        await this.selectUserByEmail(email);
    }

    async loadUsers() {
        try {
            const res = await fetch('/api/usuarios');
            const data = await res.json();
            if (data.success && data.data) {
                this.users = data.data;
                this.renderRolesGrid(data.data);
            }
        } catch (err) {
            console.error('Error cargando usuarios:', err);
        }
    }

    renderRolesGrid(users) {
        const container = document.getElementById('roles-container');
        if (!container) return;

        container.innerHTML = users.map(user => {
            let badgeClass = 'badge-jr';
            let roleLabel = 'Abogada JR';
            if (user.rol === 'RH' || user.rol === 'ADMIN_RH') { badgeClass = 'badge-rh'; roleLabel = 'Recursos Humanos (RH)'; }
            else if (user.rol === 'ADMIN') { badgeClass = 'badge-admin'; roleLabel = 'Administrador'; }
            else if (user.rol === 'ABOGADA_SR') { badgeClass = 'badge-sr'; roleLabel = 'Abogada SR'; }

            const initials = user.avatar || user.nombre.split(' ').map(n => n[0]).join('').substring(0, 2);

            return `
                <div class="role-card" onclick="loginMod.selectUserByEmail('${user.email}')">
                    <div class="role-avatar ${user.rol.toLowerCase()}-avatar">${initials}</div>
                    <div class="role-info">
                        <h3>${user.nombre}</h3>
                        <span class="role-badge ${badgeClass}">${roleLabel}</span>
                        <p class="role-desc">${user.puesto} - ${user.departamento || 'RDL'}</p>
                    </div>
                </div>
            `;
        }).join('');
    }

    async selectUserByEmail(email) {
        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await res.json();
            if (data.success) {
                window.currentUser = data.user;
                this.onLoginSuccess(data.user);
            } else {
                alert(data.error || 'Correo electrónico no encontrado en el sistema.');
            }
        } catch (err) {
            console.error('Error al iniciar sesión:', err);
        }
    }

    async selectRole(rolName) {
        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rol: rolName })
            });

            const data = await res.json();
            if (data.success) {
                window.currentUser = data.user;
                this.onLoginSuccess(data.user);
            }
        } catch (err) {
            console.error('Error al iniciar sesión:', err);
        }
    }

    onLoginSuccess(user) {
        // Ocultar modal de login
        document.getElementById('login-modal').classList.remove('active');

        // Mostrar Plataforma Principal con animación GSAP
        const mainApp = document.getElementById('main-app-layout');
        mainApp.classList.remove('hidden');

        if (typeof gsap !== 'undefined') {
            gsap.fromTo(mainApp,
                { opacity: 0, scale: 0.98 },
                { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out' }
            );
        }

        // Actualizar Header
        document.getElementById('current-user-name').textContent = user.nombre;
        const roleBadge = document.getElementById('current-user-role-badge');
        roleBadge.textContent = user.puesto;

        // Renderizar Ficha del Empleado & Metas (Panel Izquierdo)
        if (window.empleadoMod) {
            window.empleadoMod.renderProfile(user);
        }

        // Cargar Metas Ponderadas (100%)
        if (window.metasMod) {
            window.metasMod.loadUserMetas(user.id);
        }

        // Cargar Muro Estilo Facebook (Panel Central)
        if (window.feedMod) {
            window.feedMod.loadFeed();
        }

        // Habilitar botón de administración de metas para Admin, Abogada SR y Recursos Humanos (RH)
        const isManager = user.rol === 'ADMIN' || user.rol === 'ABOGADA_SR' || user.rol === 'RH' || user.rol === 'ADMIN_RH';
        const btnAdminMetas = document.getElementById('btn-admin-manage-metas');
        if (btnAdminMetas) {
            if (isManager) {
                btnAdminMetas.classList.remove('hidden');
            } else {
                btnAdminMetas.classList.add('hidden');
            }
        }

        // Ajustar Permisos de Publicación según el Rol
        const composerCard = document.getElementById('post-composer-card');
        const jrNotice = document.getElementById('jr-notice-card');
        const avatarSm = document.getElementById('composer-user-avatar');

        const initials = user.nombre.split(' ').map(n => n[0]).join('').substring(0, 2);
        if (avatarSm) avatarSm.textContent = initials;

        if (isManager) {
            if (composerCard) composerCard.classList.remove('hidden');
            if (jrNotice) jrNotice.classList.add('hidden');
        } else {
            if (composerCard) composerCard.classList.add('hidden');
            if (jrNotice) jrNotice.classList.remove('hidden');
        }

        // Registrar usuario en Socket.io
        if (window.clientSocket && window.clientSocket.socket) {
            window.clientSocket.socket.emit('join_room', user);
            window.clientSocket.showToast(`Bienvenida, ${user.nombre} (${user.rol})`, 'success');
        }
    }

    async logout() {
        window.currentUser = null;
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch (e) {
            console.warn('Aviso al cerrar sesión:', e);
        }
        window.location.href = '/login';
    }
}

window.loginMod = new LoginModule();

// Escuchar actualización remota de vacaciones
window.addEventListener('rdl_vacaciones_actualizadas', (e) => {
    const updatedUser = e.detail;
    if (window.currentUser && window.currentUser.id === updatedUser.id) {
        window.currentUser = updatedUser;
        if (window.empleadoMod) {
            window.empleadoMod.renderProfile(updatedUser);
        }
    }
});

// Evento para abrir modal de configuración de red IP
document.getElementById('btn-network-config')?.addEventListener('click', () => {
    document.getElementById('modal-network').classList.add('active');
    fetch('/api/health')
        .then(r => r.json())
        .then(data => {
            const list = document.getElementById('local-ips-list');
            if (list && data.localIPs) {
                list.innerHTML = data.localIPs.map(ip => `<li><code>http://${ip}:9060</code></li>`).join('');
            }
        });
});
