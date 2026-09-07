/**
 * RDL Intelligence Hub - Módulo de Metas Ponderadas (Pesos = 100%, KPIs, Avances)
 * Sincronización en tiempo real vía WebSocket (Socket.io) y control de Administrador
 */

class MetasModule {
    constructor() {
        this.currentUserId = null;
        this.managingUserId = null;
        this.metas = [];
        this.stats = {
            total_metas: 0,
            suma_pesos: 0,
            avance_ponderado_global: 0,
            ponderacion_completa: false
        };
        this.init();
    }

    init() {
        // Escuchar eventos de metas remotas vía Socket.io
        window.addEventListener('rdl_metas_actualizadas', (e) => {
            const detail = e.detail;
            if (this.currentUserId && detail.usuario_id === this.currentUserId) {
                this.loadUserMetas(this.currentUserId);
            }
            if (this.managingUserId && detail.usuario_id === this.managingUserId) {
                this.loadAdminMetas(this.managingUserId);
            }
        });
    }

    async loadUserMetas(usuarioId) {
        this.currentUserId = usuarioId;
        try {
            const res = await fetch(`/api/metas/${usuarioId}`);
            const data = await res.json();
            if (data.success) {
                this.metas = data.data || [];
                this.stats = data.stats || {};
                this.renderUserMetas();
            }
        } catch (err) {
            console.error('Error al cargar metas del usuario:', err);
        }
    }

    renderUserMetas() {
        const container = document.getElementById('metas-list-container');
        if (!container) return;

        // 1. Actualizar Badge de Conteo
        const badgeCount = document.getElementById('metas-count-badge');
        if (badgeCount) {
            badgeCount.textContent = `${this.metas.length} ${this.metas.length === 1 ? 'Meta' : 'Metas'}`;
        }

        // 2. Actualizar Desempeño Global Ponderado
        const scoreEl = document.getElementById('emp-weighted-score');
        if (scoreEl) {
            scoreEl.textContent = `${this.stats.avance_ponderado_global || 0}%`;
        }

        // 3. Actualizar Balance de Pesos (Regla del 100%)
        const weightsTotalEl = document.getElementById('emp-total-weights');
        const weightBarEl = document.getElementById('weight-balance-bar');
        const weightMsgEl = document.getElementById('weight-status-msg');

        const sumaPesos = this.stats.suma_pesos || 0;
        if (weightsTotalEl) {
            weightsTotalEl.textContent = `${sumaPesos}% / 100%`;
        }

        if (weightBarEl) {
            const barWidth = Math.min(100, sumaPesos);
            weightBarEl.style.width = `${barWidth}%`;

            if (this.stats.ponderacion_completa || Math.abs(sumaPesos - 100) < 0.5) {
                weightBarEl.style.background = 'linear-gradient(90deg, #10b981, #00e676)';
                if (weightMsgEl) {
                    weightMsgEl.innerHTML = '🟢 <span style="color: var(--accent-green-bright); font-weight: 600;">Ponderación óptima (100%)</span>';
                }
            } else if (sumaPesos < 100) {
                const faltante = Math.round((100 - sumaPesos) * 100) / 100;
                weightBarEl.style.background = 'linear-gradient(90deg, #f59e0b, #fbbf24)';
                if (weightMsgEl) {
                    weightMsgEl.innerHTML = `🟡 <span style="color: #fbbf24;">Faltan ${faltante}% para completar el 100%</span>`;
                }
            } else {
                const exceso = Math.round((sumaPesos - 100) * 100) / 100;
                weightBarEl.style.background = 'linear-gradient(90deg, #ef4444, #f87171)';
                if (weightMsgEl) {
                    weightMsgEl.innerHTML = `🔴 <span style="color: #f87171;">Excede por ${exceso}% (Total: ${sumaPesos}%)</span>`;
                }
            }
        }

        // 4. Renderizar Tarjetas de Metas Individuales
        container.innerHTML = '';
        if (this.metas.length === 0) {
            container.innerHTML = '<p style="font-size: 0.8rem; color: var(--text-dim); text-align: center; padding: 14px 0;">No hay metas asignadas a este perfil.</p>';
            return;
        }

        this.metas.forEach(meta => {
            const card = document.createElement('div');
            card.className = 'meta-item-card floating-element';
            card.id = `meta-card-${meta.id}`;

            let catColor = '#60a5fa';
            if (meta.categoria === 'Desempeño') catColor = '#34d399';
            else if (meta.categoria === 'Capacitación') catColor = '#fbbf24';
            else if (meta.categoria === 'OKR') catColor = '#c084fc';

            const statusBadge = meta.porcentaje_avance >= 100 
                ? '<span class="status-pill status-completed">✅ Completada</span>'
                : meta.porcentaje_avance > 0 
                    ? '<span class="status-pill status-progress">⏳ En Progreso</span>'
                    : '<span class="status-pill status-pending">⚪ Por Iniciar</span>';

            card.innerHTML = `
                <div class="meta-item-header">
                    <div>
                        <span class="meta-cat-pill" style="color: ${catColor}; border-color: ${catColor}44; background: ${catColor}15;">${meta.categoria || 'Caso Legal'}</span>
                        <h4 class="meta-item-title">${meta.titulo}</h4>
                    </div>
                    <div style="text-align: right;">
                        <span class="meta-weight-badge">⚖️ Peso: <strong>${meta.peso}%</strong></span>
                    </div>
                </div>

                <p class="meta-item-desc">${meta.descripcion || ''}</p>

                <!-- Indicador Tangible / KPI -->
                <div class="meta-kpi-chip">
                    <span class="kpi-icon">🎯</span>
                    <span class="kpi-text"><strong>Indicador:</strong> ${meta.indicador || 'Cumplimiento de objetivos'}</span>
                </div>

                <!-- Barra de Avance y Controles -->
                <div class="meta-progress-section">
                    <div class="meta-progress-labels">
                        <span>Avance Reportado:</span>
                        <strong id="meta-pct-val-${meta.id}" style="color: var(--accent-green-bright);">${meta.porcentaje_avance}%</strong>
                    </div>
                    <div class="meta-progress-bar">
                        <div class="meta-progress-fill" id="meta-bar-fill-${meta.id}" style="width: ${meta.porcentaje_avance}%;"></div>
                    </div>
                </div>

                <!-- Control de Avance Interactivo -->
                <div class="meta-slider-row">
                    <label style="font-size: 0.72rem; color: var(--text-dim);">Actualizar Avance:</label>
                    <input type="range" min="0" max="100" step="5" value="${meta.porcentaje_avance}" 
                        class="meta-slider" 
                        oninput="metasMod.onSliderInput(${meta.id}, this.value)"
                        onchange="metasMod.onSliderChange(${meta.id}, this.value)">
                </div>

                <div class="meta-item-footer">
                    <span style="font-size: 0.72rem; color: var(--text-dim);">📅 Límite: ${meta.fecha_limite || '2026-12-31'}</span>
                    ${statusBadge}
                </div>
            `;

            container.appendChild(card);
        });

        if (typeof gsap !== 'undefined') {
            gsap.from('.meta-item-card', {
                opacity: 0,
                y: 12,
                stagger: 0.06,
                duration: 0.35,
                ease: 'power2.out'
            });
        }
    }

    onSliderInput(metaId, value) {
        const valEl = document.getElementById(`meta-pct-val-${metaId}`);
        const barEl = document.getElementById(`meta-bar-fill-${metaId}`);
        if (valEl) valEl.textContent = `${value}%`;
        if (barEl) barEl.style.width = `${value}%`;
    }

    async onSliderChange(metaId, value) {
        try {
            const res = await fetch(`/api/metas/${metaId}/avance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ porcentaje_avance: parseFloat(value) })
            });
            const data = await res.json();
            if (data.success) {
                if (window.clientSocket) {
                    window.clientSocket.showToast('Progreso de meta actualizado.', 'success');
                }
                // Recargar metas y recalcular promedio global
                if (this.currentUserId) {
                    this.loadUserMetas(this.currentUserId);
                }
            }
        } catch (err) {
            console.error('Error al actualizar avance de meta:', err);
        }
    }

    // ============================================================
    // PANEL ADMINISTRADOR PARA GESTIONAR METAS
    // ============================================================

    async openAdminModal() {
        const modal = document.getElementById('modal-gestionar-metas');
        if (!modal) return;

        modal.classList.add('active');

        // Cargar lista de usuarios en el selector
        await this.populateUserSelect();

        // Cargar metas del usuario seleccionado por defecto
        const select = document.getElementById('gm-select-user');
        if (select && select.value) {
            this.managingUserId = parseInt(select.value, 10);
            this.loadAdminMetas(this.managingUserId);
        }
    }

    closeAdminModal() {
        const modal = document.getElementById('modal-gestionar-metas');
        if (modal) modal.classList.remove('active');
    }

    async populateUserSelect() {
        const select = document.getElementById('gm-select-user');
        if (!select) return;

        try {
            const res = await fetch('/api/usuarios');
            const data = await res.json();
            if (data.success && data.data) {
                select.innerHTML = data.data.map(u => `
                    <option value="${u.id}">${u.nombre} (${u.rol} - ${u.puesto})</option>
                `).join('');

                // Seleccionar al usuario actual o el primero
                if (this.currentUserId) {
                    select.value = this.currentUserId;
                }
            }
        } catch (err) {
            console.error('Error al poblar selector de usuarios:', err);
        }
    }

    onSelectUserToManage(userId) {
        this.managingUserId = parseInt(userId, 10);
        this.loadAdminMetas(this.managingUserId);
    }

    async loadAdminMetas(userId) {
        try {
            const res = await fetch(`/api/metas/${userId}`);
            const data = await res.json();
            if (data.success) {
                this.renderAdminMetasTable(data.data || [], data.stats || {});
            }
        } catch (err) {
            console.error('Error cargando metas en admin:', err);
        }
    }

    renderAdminMetasTable(metas, stats) {
        const tbody = document.getElementById('admin-metas-table-body');
        const weightBadge = document.getElementById('gm-weight-total-badge');
        const weightBar = document.getElementById('gm-weight-bar');
        const weightFeedback = document.getElementById('gm-weight-feedback');
        const overallScoreEl = document.getElementById('gm-overall-score');

        const sumaPesos = stats.suma_pesos || 0;

        // Actualizar barra de ponderación en modal
        if (weightBadge) weightBadge.textContent = `${sumaPesos}% / 100%`;
        if (overallScoreEl) overallScoreEl.textContent = `${stats.avance_ponderado_global || 0}%`;

        if (weightBar) {
            weightBar.style.width = `${Math.min(100, sumaPesos)}%`;
            if (stats.ponderacion_completa || Math.abs(sumaPesos - 100) < 0.5) {
                weightBar.style.background = 'linear-gradient(90deg, #10b981, #00e676)';
                if (weightBadge) {
                    weightBadge.className = 'badge-weight-ok';
                    weightBadge.style.background = 'rgba(16, 185, 129, 0.2)';
                    weightBadge.style.color = 'var(--accent-green-bright)';
                }
                if (weightFeedback) weightFeedback.textContent = '✅ Ponderación óptima completa (100%)';
            } else if (sumaPesos < 100) {
                const faltante = Math.round((100 - sumaPesos) * 100) / 100;
                weightBar.style.background = 'linear-gradient(90deg, #f59e0b, #fbbf24)';
                if (weightBadge) {
                    weightBadge.className = 'badge-weight-warn';
                    weightBadge.style.background = 'rgba(245, 158, 11, 0.2)';
                    weightBadge.style.color = '#fbbf24';
                }
                if (weightFeedback) weightFeedback.textContent = `⚠️ Faltan ${faltante}% para completar el 100% de ponderación.`;
            } else {
                const exceso = Math.round((sumaPesos - 100) * 100) / 100;
                weightBar.style.background = 'linear-gradient(90deg, #ef4444, #f87171)';
                if (weightBadge) {
                    weightBadge.className = 'badge-weight-err';
                    weightBadge.style.background = 'rgba(239, 68, 68, 0.2)';
                    weightBadge.style.color = '#f87171';
                }
                if (weightFeedback) weightFeedback.textContent = `🚨 La suma de pesos excede el 100% por ${exceso}%. Ajusta los porcentajes.`;
            }
        }

        // Renderizar Filas de la Tabla
        if (!tbody) return;
        tbody.innerHTML = '';

        if (metas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-dim); padding: 18px;">No hay metas registradas para este perfil. Asigna una arriba.</td></tr>';
            return;
        }

        metas.forEach(meta => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <strong>${meta.titulo}</strong>
                    <div style="font-size: 0.72rem; color: var(--accent-green-bright); margin-top: 2px;">🎯 ${meta.indicador || 'KPI no especificado'}</div>
                    <div style="font-size: 0.7rem; color: var(--text-dim);">${meta.descripcion || ''}</div>
                </td>
                <td style="width: 90px;">
                    <input type="number" value="${meta.peso}" min="1" max="100" step="0.5" 
                        class="table-inline-input" 
                        onchange="metasMod.handleUpdateMetaField(${meta.id}, 'peso', this.value)">
                </td>
                <td style="width: 90px;">
                    <input type="number" value="${meta.porcentaje_avance}" min="0" max="100" step="1" 
                        class="table-inline-input" 
                        onchange="metasMod.handleUpdateMetaField(${meta.id}, 'porcentaje_avance', this.value)">
                </td>
                <td style="width: 100px;">
                    <span style="font-size: 0.72rem; color: var(--text-muted);">${meta.estatus}</span>
                </td>
                <td style="width: 60px; text-align: center;">
                    <button class="btn btn-ghost btn-sm" style="color: #f87171; padding: 4px 8px;" onclick="metasMod.handleDeleteMeta(${meta.id})" title="Eliminar Meta">
                        🗑️
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    async handleAddMeta(e) {
        e.preventDefault();
        const userId = this.managingUserId || this.currentUserId;
        if (!userId) {
            alert('Por favor selecciona una colaboradora primero.');
            return;
        }

        const titulo = document.getElementById('gm-meta-titulo').value.trim();
        const descripcion = document.getElementById('gm-meta-descripcion').value.trim();
        const indicador = document.getElementById('gm-meta-indicador').value.trim();
        const categoria = document.getElementById('gm-meta-categoria').value;
        const peso = parseFloat(document.getElementById('gm-meta-peso').value) || 25;
        const porcentaje_avance = parseFloat(document.getElementById('gm-meta-avance').value) || 0;
        const fecha_limite = document.getElementById('gm-meta-fecha').value || '2026-12-31';

        try {
            const res = await fetch('/api/metas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    usuario_id: userId,
                    titulo,
                    descripcion,
                    indicador,
                    categoria,
                    peso,
                    porcentaje_avance,
                    fecha_limite
                })
            });

            const data = await res.json();
            if (data.success) {
                if (window.clientSocket) {
                    window.clientSocket.showToast('Meta asignada y ponderada con éxito.', 'success');
                }
                e.target.reset();
                // Recargar metas
                this.loadAdminMetas(userId);
                if (this.currentUserId === userId) {
                    this.loadUserMetas(userId);
                }
            } else {
                alert(data.error || 'Error al asignar meta.');
            }
        } catch (err) {
            console.error('Error al agregar meta:', err);
        }
    }

    async handleUpdateMetaField(metaId, field, value) {
        const payload = {};
        payload[field] = parseFloat(value) || value;

        try {
            const res = await fetch(`/api/metas/${metaId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data.success) {
                if (window.clientSocket) {
                    window.clientSocket.showToast('Meta actualizada.', 'success');
                }
                if (this.managingUserId) this.loadAdminMetas(this.managingUserId);
                if (this.currentUserId) this.loadUserMetas(this.currentUserId);
            }
        } catch (err) {
            console.error('Error al actualizar campo de meta:', err);
        }
    }

    async handleDeleteMeta(metaId) {
        if (!confirm('¿Estás segura de eliminar esta meta? Se recalculará la ponderación del 100%.')) return;

        try {
            const res = await fetch(`/api/metas/${metaId}`, {
                method: 'DELETE'
            });

            const data = await res.json();
            if (data.success) {
                if (window.clientSocket) {
                    window.clientSocket.showToast('Meta eliminada.', 'success');
                }
                if (this.managingUserId) this.loadAdminMetas(this.managingUserId);
                if (this.currentUserId) this.loadUserMetas(this.currentUserId);
            }
        } catch (err) {
            console.error('Error al eliminar meta:', err);
        }
    }
}

window.metasMod = new MetasModule();
