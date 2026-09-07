/**
 * RDL Intelligence Hub - Muro Corporativo Estilo Facebook
 */

class FeedModule {
    constructor() {
        this.posts = [];
        this.init();
    }

    init() {
        this.bindEvents();

        window.addEventListener('rdl_nuevo_post', (e) => {
            this.handleNuevoPost(e.detail);
        });

        window.addEventListener('rdl_like_actualizado', (e) => {
            this.handleLikeActualizado(e.detail);
        });
    }

    bindEvents() {
        const form = document.getElementById('form-create-post');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitPost();
            });
        }
    }

    async loadFeed() {
        try {
            const res = await fetch('/api/feed');
            const data = await res.json();
            if (data.success) {
                this.posts = data.data;
                this.render();
            }
        } catch (err) {
            console.error('Error al cargar muro Facebook RDL:', err);
        }
    }

    render() {
        const container = document.getElementById('feed-stream-container');
        if (!container) return;

        container.innerHTML = '';

        if (this.posts.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 40px;">No hay publicaciones en el muro en este momento.</p>';
            return;
        }

        this.posts.forEach(post => {
            const card = document.createElement('div');
            card.className = 'glass-card feed-card';
            card.id = `feed-post-${post.id}`;

            const initials = post.autor_nombre.split(' ').map(n => n[0]).join('').substring(0, 2);

            card.innerHTML = `
                <div class="post-author-bar">
                    <div class="post-author-avatar">${initials}</div>
                    <div class="post-author-meta">
                        <span class="post-author-name">${post.autor_nombre}</span>
                        <span class="post-time">${post.autor_rol} • ${new Date(post.fecha_creacion).toLocaleDateString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <span class="role-badge badge-sr" style="margin-left: auto;">${post.categoria}</span>
                </div>
                
                ${post.titulo ? `<h3 class="post-title">${post.titulo}</h3>` : ''}
                <p class="post-body">${post.contenido}</p>

                <div class="post-interactions">
                    <button class="btn-like" onclick="feedMod.darLike(${post.id})">
                        👍 Me Gusta (<span id="like-count-${post.id}">${post.likes_count}</span>)
                    </button>
                    <span class="comments-count">💬 ${post.comentarios_count || 0} Comentarios</span>
                </div>
            `;

            container.appendChild(card);
        });

        if (typeof gsap !== 'undefined') {
            gsap.from('.feed-card', {
                opacity: 0,
                y: 20,
                stagger: 0.08,
                duration: 0.45,
                ease: 'power2.out'
            });
        }
    }

    async submitPost() {
        const user = window.currentUser;
        if (!user) return;

        // Validar permisos en frontend
        if (user.rol !== 'ADMIN' && user.rol !== 'ABOGADA_SR') {
            alert('Solo Administradores y Abogadas SR pueden publicar en el Muro.');
            return;
        }

        const titulo = document.getElementById('post-titulo').value;
        const contenido = document.getElementById('post-contenido').value;
        const categoria = document.getElementById('post-categoria').value;

        if (!contenido) return;

        const payload = {
            autor_id: user.id,
            autor_nombre: user.nombre,
            autor_rol: user.rol,
            autor_avatar: user.avatar,
            titulo,
            contenido,
            categoria
        };

        try {
            const res = await fetch('/api/feed', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                document.getElementById('form-create-post').reset();
            }
        } catch (err) {
            console.error('Error al publicar post:', err);
        }
    }

    async darLike(postID) {
        try {
            const res = await fetch(`/api/feed/${postID}/like`, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                const countEl = document.getElementById(`like-count-${postID}`);
                if (countEl) countEl.textContent = data.data.likes_count;
            }
        } catch (err) {
            console.error('Error al dar like:', err);
        }
    }

    handleNuevoPost(post) {
        const exists = this.posts.find(p => p.id === post.id);
        if (!exists) {
            this.posts.unshift(post);
            this.render();
        }
    }

    handleLikeActualizado(data) {
        const idx = this.posts.findIndex(p => p.id === data.id);
        if (idx !== -1) {
            this.posts[idx].likes_count = data.likes_count;
            const countEl = document.getElementById(`like-count-${data.id}`);
            if (countEl) countEl.textContent = data.likes_count;
        }
    }
}

window.feedMod = new FeedModule();
