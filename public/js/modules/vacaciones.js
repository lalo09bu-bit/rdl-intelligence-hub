/**
 * RDL Intelligence Hub - Módulo de Solicitud y Aprobación de Vacaciones
 */

class VacacionesModule {
    constructor() {
        this.incidencias = [];
        this.init();
    }

    init() {
        this.bindEvents();

        window.addEventListener('rdl_nueva_incidencia', (e) => {
            this.handleNuevaIncidencia(e.detail);
        });
    }

    bindEvents() {
        const form = document.getElementById('form-solicitar-vacaciones');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitSolicitud();
            });
        }
    }

    openModal() {
        document.getElementById('modal-vacaciones').classList.add('active');
        this.loadIncidencias();
    }

    closeModal() {
        document.getElementById('modal-vacaciones').classList.remove('active');
    }

    async loadIncidencias() {
        try {
            const res = await fetch('/api/incidencias');
            const data = await res.json();
            if (data.success) {
                this.incidencias = data.data;
                this.renderTable();
            }
        } catch (err) {
            console.error('Error al cargar vacaciones:', err);
        }
    }

    renderTable() {
        const tbody = document.getElementById('vacaciones-table-body');
        if (!tbody) return;

        tbody.innerHTML = '';
        const user = window.currentUser;

        this.incidencias.forEach(inc => {
            const tr = document.createElement('tr');
            const canApprove = (user.rol === 'ADMIN' || user.rol === 'ABOGADA_SR') && inc.estatus === 'PENDIENTE' && inc.usuario_id !== user.id;

            tr.innerHTML = `
                <td><strong>${inc.usuario_nombre}</strong> (${inc.usuario_rol})</td>
                <td>${inc.tipo}</td>
                <td>${inc.dias_solicitados} día${inc.dias_solicitados > 1 ? 's' : ''}</td>
                <td>
                    <span class="role-badge ${inc.estatus === 'APROBADO' ? 'badge-jr' : (inc.estatus === 'PENDIENTE' ? 'badge-sr' : 'badge-admin')}">
                        ${inc.estatus}
                    </span>
                </td>
                <td>
                    ${canApprove ? `
                        <button class="btn btn-sm btn-primary" onclick="vacacionesMod.aprobar(${inc.id}, 'APROBADO')">Aprobar</button>
                        <button class="btn btn-sm btn-ghost" onclick="vacacionesMod.aprobar(${inc.id}, 'RECHAZADO')">Rechazar</button>
                    ` : '<span style="color: var(--text-dim); font-size: 0.75rem;">Sin acción</span>'}
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    async submitSolicitud() {
        const user = window.currentUser;
        if (!user) return;

        const inicio = document.getElementById('vac-inicio').value;
        const fin = document.getElementById('vac-fin').value;
        const motivo = document.getElementById('vac-motivo').value;

        if (!inicio || !fin || !motivo) return;

        const date1 = new Date(inicio);
        const date2 = new Date(fin);
        const diffDays = Math.ceil(Math.abs(date2 - date1) / (1000 * 60 * 60 * 24)) + 1;

        if (diffDays > user.dias_vacaciones_restantes) {
            alert(`No dispones de suficientes días libres. Tu saldo actual es de ${user.dias_vacaciones_restantes} días.`);
            return;
        }

        const payload = {
            usuario_id: user.id,
            usuario_nombre: user.nombre,
            usuario_rol: user.rol,
            tipo: 'Vacaciones',
            fecha_inicio: inicio,
            fecha_fin: fin,
            dias_solicitados: diffDays,
            motivo
        };

        try {
            const res = await fetch('/api/incidencias', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                document.getElementById('form-solicitar-vacaciones').reset();
                this.loadIncidencias();
                if (window.clientSocket) {
                    window.clientSocket.showToast('Solicitud de vacaciones enviada con éxito', 'success');
                }
            }
        } catch (err) {
            console.error('Error al enviar solicitud:', err);
        }
    }

    async aprobar(id, estatus) {
        const user = window.currentUser;
        try {
            const res = await fetch(`/api/incidencias/${id}/aprobar`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estatus, aprobado_por: user.nombre, rol_aprobador: user.rol })
            });
            const data = await res.json();
            if (data.success) {
                this.loadIncidencias();
            }
        } catch (err) {
            console.error('Error al aprobar solicitud:', err);
        }
    }

    handleNuevaIncidencia(inc) {
        this.incidencias.unshift(inc);
        this.renderTable();
    }
}

window.vacacionesMod = new VacacionesModule();
