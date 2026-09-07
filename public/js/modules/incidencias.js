/**
 * Módulo de Control de Incidencias (Kanban / Tabla y Flujo de Aprobación)
 */

class IncidenciasModule {
    constructor() {
        this.incidencias = [];
        this.currentView = 'kanban'; // 'kanban' | 'tabla'
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadData();
        
        // Escuchar eventos real-time desde WebSocket (client.js)
        window.addEventListener('incidencia_creada', (e) => {
            this.handleRealtimeNueva(e.detail);
        });

        window.addEventListener('incidencia_actualizada', (e) => {
            this.handleRealtimeEstatus(e.detail);
        });
    }

    bindEvents() {
        // Alternar entre Kanban y Tabla
        document.querySelectorAll('.segmented-toggle .toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.segmented-toggle .toggle-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentView = e.target.dataset.subview;
                this.render();
            });
        });

        // Formulario de Nueva Incidencia Modal
        const form = document.getElementById('form-incidencia');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitNuevaIncidencia();
            });
        }
    }

    async loadData() {
        try {
            const res = await fetch('/api/incidencias');
            const data = await res.json();
            if (data.success) {
                this.incidencias = data.data;
                this.render();
            }
        } catch (err) {
            console.error('Error al cargar incidencias:', err);
        }
    }

    render() {
        this.updateStats();
        
        const kanbanEl = document.getElementById('kanban-container');
        const tableEl = document.getElementById('table-container');

        if (this.currentView === 'kanban') {
            kanbanEl.classList.remove('hidden');
            tableEl.classList.add('hidden');
            this.renderKanban();
        } else {
            kanbanEl.classList.add('hidden');
            tableEl.classList.remove('hidden');
            this.renderTable();
        }
    }

    updateStats() {
        const pending = this.incidencias.filter(i => i.estatus === 'PENDIENTE').length;
        const approved = this.incidencias.filter(i => i.estatus === 'APROBADO').length;
        const rejected = this.incidencias.filter(i => i.estatus === 'RECHAZADO').length;

        document.getElementById('stat-pendientes').textContent = pending;
        document.getElementById('stat-aprobadas').textContent = approved;
        document.getElementById('count-pending').textContent = pending;
        document.getElementById('count-approved').textContent = approved;
        document.getElementById('count-rejected').textContent = rejected;
        
        const badgeEl = document.getElementById('badge-incidencias');
        if (badgeEl) badgeEl.textContent = pending;
    }

    renderKanban() {
        const pendingCol = document.getElementById('cards-pending');
        const approvedCol = document.getElementById('cards-approved');
        const rejectedCol = document.getElementById('cards-rejected');

        pendingCol.innerHTML = '';
        approvedCol.innerHTML = '';
        rejectedCol.innerHTML = '';

        this.incidencias.forEach(inc => {
            const card = this.createKanbanCard(inc);
            if (inc.estatus === 'PENDIENTE') pendingCol.appendChild(card);
            else if (inc.estatus === 'APROBADO') approvedCol.appendChild(card);
            else if (inc.estatus === 'RECHAZADO') rejectedCol.appendChild(card);
        });

        // Animaciones GSAP para las cards al renderizar
        if (typeof gsap !== 'undefined') {
            gsap.from('.kanban-card', {
                opacity: 0,
                y: 15,
                stagger: 0.05,
                duration: 0.35,
                ease: 'power2.out'
            });
        }
    }

    createKanbanCard(inc) {
        const div = document.createElement('div');
        div.className = 'kanban-card';
        div.id = `card-inc-${inc.id}`;

        const badgeClass = inc.tipo.toLowerCase().includes('vaca') ? 'badge-vacaciones' : (inc.tipo.toLowerCase().includes('permi') ? 'badge-permiso' : 'badge-falta');

        div.innerHTML = `
            <div class="card-header">
                <span class="card-badge ${badgeClass}">${inc.tipo}</span>
                <span class="card-id">#${inc.id}</span>
            </div>
            <h4 class="card-title">${inc.colaborador_nombre}</h4>
            <div class="card-meta">
                <span>📅 ${inc.fecha_inicio} a ${inc.fecha_fin} (${inc.dias_totales} día${inc.dias_totales > 1 ? 's' : ''})</span>
                <span>💬 ${inc.motivo}</span>
                <span>👤 Líder: ${inc.lider_nombre}</span>
            </div>
            ${inc.estatus === 'PENDIENTE' ? `
                <div class="card-actions">
                    <button class="btn btn-sm btn-approve" onclick="incidenciasMod.aprobar(${inc.id})">✓ Aprobar</button>
                    <button class="btn btn-sm btn-reject" onclick="incidenciasMod.rechazar(${inc.id})">✕ Rechazar</button>
                </div>
            ` : `
                <div class="card-meta" style="margin-top: 8px; border-top: 1px dashed var(--border-glass); padding-top: 6px;">
                    <span style="color: ${inc.estatus === 'APROBADO' ? 'var(--status-approved)' : 'var(--status-rejected)'}; font-weight: 600;">
                        Estatus: ${inc.estatus}
                    </span>
                </div>
            `}
        `;

        return div;
    }

    renderTable() {
        const tbody = document.getElementById('incidencias-table-body');
        tbody.innerHTML = '';

        this.incidencias.forEach(inc => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>#${inc.id}</td>
                <td><strong>${inc.tipo}</strong></td>
                <td>${inc.fecha_inicio} al ${inc.fecha_fin}</td>
                <td>${inc.dias_totales}</td>
                <td>${inc.motivo}</td>
                <td>${inc.lider_nombre}</td>
                <td>
                    <span class="pill ${inc.estatus === 'APROBADO' ? 'pill-success' : (inc.estatus === 'PENDIENTE' ? 'pill-warning' : '')}" style="${inc.estatus === 'RECHAZADO' ? 'background: rgba(239,68,68,0.15); color: var(--status-rejected);' : ''}">
                        ${inc.estatus}
                    </span>
                </td>
                <td>
                    ${inc.estatus === 'PENDIENTE' ? `
                        <button class="btn btn-sm btn-approve" onclick="incidenciasMod.aprobar(${inc.id})">Aprobar</button>
                        <button class="btn btn-sm btn-reject" onclick="incidenciasMod.rechazar(${inc.id})">Rechazar</button>
                    ` : '<span style="color: var(--text-dim);">-</span>'}
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    submitNuevaIncidencia() {
        const tipo = document.getElementById('inc-tipo').value;
        const inicio = document.getElementById('inc-inicio').value;
        const fin = document.getElementById('inc-fin').value;
        const motivo = document.getElementById('inc-motivo').value;

        if (!inicio || !fin || !motivo) return;

        const date1 = new Date(inicio);
        const date2 = new Date(fin);
        const diffDays = Math.ceil(Math.abs(date2 - date1) / (1000 * 60 * 60 * 24)) + 1;

        const payload = {
            colaborador_id: 'EMP001',
            colaborador_nombre: 'Ana Martínez',
            lider_id: 'LID01',
            lider_nombre: 'Carlos Mendoza',
            tipo,
            fecha_inicio: inicio,
            fecha_fin: fin,
            dias_totales: diffDays,
            motivo
        };

        // Emitir por WebSocket vía clientSocket
        if (window.clientSocket) {
            window.clientSocket.solicitarIncidencia(payload);
        }

        // Cerrar modal y limpiar
        document.getElementById('modal-incidencia').classList.remove('active');
        document.getElementById('form-incidencia').reset();
    }

    aprobar(id) {
        if (window.clientSocket) {
            window.clientSocket.aprobarRechazarIncidencia(id, 'APROBADO', 'Solicitud autorizada por el líder.');
        }
    }

    rechazar(id) {
        if (window.clientSocket) {
            window.clientSocket.aprobarRechazarIncidencia(id, 'RECHAZADO', 'No hay disponibilidad de cobertura para esas fechas.');
        }
    }

    handleRealtimeNueva(nueva) {
        const exists = this.incidencias.find(i => i.id === nueva.id);
        if (!exists) {
            this.incidencias.unshift(nueva);
            this.render();
        }
    }

    handleRealtimeEstatus(actualizada) {
        const idx = this.incidencias.findIndex(i => i.id === actualizada.id);
        if (idx !== -1) {
            this.incidencias[idx] = actualizada;
            this.render();
        }
    }
}

window.incidenciasMod = new IncidenciasModule();
