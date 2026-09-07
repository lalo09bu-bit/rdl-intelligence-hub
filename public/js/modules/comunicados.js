/**
 * Módulo de Comunicación Interna (Feed de Anuncios y Notificaciones Push/Desktop)
 */

class ComunicadosModule {
    constructor() {
        this.comunicados = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadData();

        window.addEventListener('comunicado_recibido', (e) => {
            this.handleRealtimeComunicado(e.detail);
        });
    }

    bindEvents() {
        const form = document.getElementById('form-comunicado');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitComunicado();
            });
        }
    }

    async loadData() {
        try {
            const res = await fetch('/api/comunicados');
            const data = await res.json();
            if (data.success) {
                this.comunicados = data.data;
                this.render();
            }
        } catch (err) {
            console.error('Error al cargar comunicados:', err);
        }
    }

    render() {
        const container = document.getElementById('comunicados-feed-container');
        if (!container) return;

        container.innerHTML = '';

        if (this.comunicados.length === 0) {
            container.innerHTML = '<p class="text-muted">No hay comunicados oficiales en este momento.</p>';
            return;
        }

        this.comunicados.forEach(com => {
            const card = document.createElement('div');
            card.className = 'glass-card comunicado-card';
            card.id = `comunicado-${com.id}`;

            const badgeColor = com.prioridad === 'URGENTE' ? 'rgba(239, 68, 68, 0.2); color: var(--status-rejected)' : (com.prioridad === 'IMPORTANTE' ? 'rgba(245, 158, 11, 0.2); color: var(--status-pending)' : 'rgba(6, 182, 212, 0.2); color: var(--primary-cyan)');

            card.innerHTML = `
                <div class="comunicado-header">
                    <span class="comunicado-category">${com.categoria}</span>
                    <span class="pill" style="background: ${badgeColor}; font-size: 0.72rem;">${com.prioridad}</span>
                </div>
                <h3 class="comunicado-title">${com.titulo}</h3>
                <p class="comunicado-content">${com.contenido}</p>
                <div class="comunicado-footer">
                    <span>✍️ Publicado por: <strong>${com.autor}</strong></span>
                    <span>🕒 ${new Date(com.fecha_publicacion).toLocaleDateString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            `;

            container.appendChild(card);
        });

        // Animación GSAP de entrada para las tarjetas del feed
        if (typeof gsap !== 'undefined') {
            gsap.from('.comunicado-card', {
                opacity: 0,
                y: 20,
                stagger: 0.08,
                duration: 0.4,
                ease: 'power2.out'
            });
        }
    }

    async submitComunicado() {
        const titulo = document.getElementById('com-titulo').value;
        const categoria = document.getElementById('com-categoria').value;
        const prioridad = document.getElementById('com-prioridad').value;
        const contenido = document.getElementById('com-contenido').value;
        const popup = document.getElementById('com-popup').checked;

        if (!titulo || !contenido) return;

        const payload = {
            titulo,
            contenido,
            categoria,
            prioridad,
            autor: 'Dirección RH',
            popup_nativo: popup ? 1 : 0
        };

        try {
            const res = await fetch('/api/comunicados', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                document.getElementById('form-comunicado').reset();
            }
        } catch (err) {
            console.error('Error al emitir comunicado:', err);
        }
    }

    handleRealtimeComunicado(nuevoCom) {
        const exists = this.comunicados.find(c => c.id === nuevoCom.id);
        if (!exists) {
            this.comunicados.unshift(nuevoCom);
            this.render();
        }
    }
}

window.comunicadosMod = new ComunicadosModule();
