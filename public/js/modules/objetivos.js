/**
 * Módulo de Registro de Objetivos (Estilo BUK / OKRs & KPIs)
 * Gráficas Radiales SVG + Barras animadas con GSAP
 */

class ObjetivosModule {
    constructor() {
        this.objetivos = [];
        this.init();
    }

    init() {
        this.loadData();

        window.addEventListener('objetivo_actualizado', (e) => {
            this.handleRealtimeActualizacion(e.detail);
        });
    }

    async loadData() {
        try {
            const res = await fetch('/api/objetivos');
            const data = await res.json();
            if (data.success) {
                this.objetivos = data.data;
                this.render();
            }
        } catch (err) {
            console.error('Error al cargar objetivos:', err);
        }
    }

    render() {
        const container = document.getElementById('objetivos-grid-container');
        if (!container) return;

        container.innerHTML = '';

        let sumaPorcentajes = 0;

        this.objetivos.forEach(obj => {
            sumaPorcentajes += obj.porcentaje_avance;
            const card = this.createObjetivoCard(obj);
            container.appendChild(card);
        });

        // Actualizar Medidor Global en el Banner Superior
        const promedioGlobal = this.objetivos.length > 0 ? Math.round(sumaPorcentajes / this.objetivos.length) : 0;
        this.animateOverallGauge(promedioGlobal);

        // Animar Barras e Indicadores Radiales Individuales con GSAP
        this.animateCards();
    }

    createObjetivoCard(obj) {
        const div = document.createElement('div');
        div.className = 'glass-card objetivo-card';
        div.id = `objetivo-card-${obj.id}`;

        const strokeDashOffset = 251.2 - (251.2 * obj.porcentaje_avance / 100);

        div.innerHTML = `
            <div class="obj-progress-header">
                <div>
                    <span class="pill pill-warning" style="font-size: 0.72rem; margin-bottom: 4px; display: inline-block;">${obj.categoria}</span>
                    <h3 style="font-size: 1.1rem; font-weight: 700;">${obj.titulo}</h3>
                </div>
                <!-- Radial Gauge SVG -->
                <div style="position: relative; width: 64px; height: 64px;">
                    <svg class="radial-gauge" viewBox="0 0 100 100">
                        <circle class="gauge-bg" cx="50" cy="50" r="40"/>
                        <circle class="gauge-fill obj-gauge-fill" id="gauge-fill-${obj.id}" cx="50" cy="50" r="40" stroke-dasharray="251.2" stroke-dashoffset="${strokeDashOffset}"/>
                    </svg>
                    <div class="gauge-center-text">
                        <span class="gauge-percent" id="gauge-text-${obj.id}">${obj.porcentaje_avance}%</span>
                    </div>
                </div>
            </div>

            <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.4;">${obj.descripcion}</p>

            <!-- Barra de Avance Animated -->
            <div>
                <div style="display: flex; justify-content: space-between; font-size: 0.78rem; color: var(--text-muted); margin-bottom: 6px;">
                    <span>Avance: <strong id="val-actual-${obj.id}">${obj.valor_actual}</strong> / ${obj.valor_meta} ${obj.unidad_medida}</span>
                    <span id="pct-label-${obj.id}" style="color: var(--primary-cyan); font-weight: 700;">${obj.porcentaje_avance}%</span>
                </div>
                <div class="obj-bar-bg">
                    <div class="obj-bar-fill" id="bar-fill-${obj.id}" style="width: ${obj.porcentaje_avance}%;"></div>
                </div>
            </div>

            <!-- Controles Interactivos para Simular Avance BUK -->
            <div style="display: flex; align-items: center; gap: 10px; border-top: 1px solid var(--border-glass); padding-top: 12px; margin-top: 4px;">
                <label style="font-size: 0.75rem; color: var(--text-dim);">Actualizar Valor:</label>
                <input type="range" min="0" max="${obj.valor_meta}" value="${obj.valor_actual}" class="slider-control" id="slider-${obj.id}" onchange="objetivosMod.cambiarAvance(${obj.id}, this.value)" style="flex-grow: 1;">
            </div>
        `;

        return div;
    }

    animateCards() {
        if (typeof gsap !== 'undefined') {
            gsap.from('.objetivo-card', {
                opacity: 0,
                scale: 0.95,
                y: 20,
                stagger: 0.1,
                duration: 0.5,
                ease: 'back.out(1.4)'
            });
        }
    }

    animateOverallGauge(percent) {
        const circle = document.getElementById('overall-gauge-circle');
        const text = document.getElementById('overall-percent');

        if (!circle || !text) return;

        const offset = 251.2 - (251.2 * percent / 100);

        if (typeof gsap !== 'undefined') {
            gsap.to(circle, {
                strokeDashoffset: offset,
                duration: 1.2,
                ease: 'power2.out'
            });

            const objCounter = { val: 0 };
            gsap.to(objCounter, {
                val: percent,
                duration: 1.2,
                onUpdate: () => {
                    text.textContent = `${Math.round(objCounter.val)}%`;
                }
            });
        } else {
            circle.style.strokeDashoffset = offset;
            text.textContent = `${percent}%`;
        }
    }

    cambiarAvance(id, nuevoValor) {
        if (window.clientSocket) {
            window.clientSocket.actualizarProgresoObjetivo(id, nuevoValor);
        }
    }

    handleRealtimeActualizacion(actualizado) {
        const idx = this.objetivos.findIndex(o => o.id === actualizado.id);
        if (idx !== -1) {
            this.objetivos[idx] = actualizado;

            // Re-animar individualmente con GSAP
            const circle = document.getElementById(`gauge-fill-${actualizado.id}`);
            const text = document.getElementById(`gauge-text-${actualizado.id}`);
            const bar = document.getElementById(`bar-fill-${actualizado.id}`);
            const valLabel = document.getElementById(`val-actual-${actualizado.id}`);
            const pctLabel = document.getElementById(`pct-label-${actualizado.id}`);

            const offset = 251.2 - (251.2 * actualizado.porcentaje_avance / 100);

            if (circle && text && bar) {
                if (typeof gsap !== 'undefined') {
                    gsap.to(circle, { strokeDashoffset: offset, duration: 0.8, ease: 'power2.out' });
                    gsap.to(bar, { width: `${actualizado.porcentaje_avance}%`, duration: 0.8, ease: 'power2.out' });
                    text.textContent = `${actualizado.porcentaje_avance}%`;
                    if (pctLabel) pctLabel.textContent = `${actualizado.porcentaje_avance}%`;
                    if (valLabel) valLabel.textContent = actualizado.valor_actual;
                } else {
                    circle.style.strokeDashoffset = offset;
                    bar.style.width = `${actualizado.porcentaje_avance}%`;
                    text.textContent = `${actualizado.porcentaje_avance}%`;
                    if (valLabel) valLabel.textContent = actualizado.valor_actual;
                }
            }

            // Recalcular medidor global
            const suma = this.objetivos.reduce((acc, curr) => acc + curr.porcentaje_avance, 0);
            const promedio = Math.round(suma / this.objetivos.length);
            this.animateOverallGauge(promedio);
        }
    }
}

window.objetivosMod = new ObjetivosModule();
