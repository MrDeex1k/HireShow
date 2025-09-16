document.addEventListener('DOMContentLoaded', async function() {
    // Sprawdź czy użytkownik jest zalogowany
    const userData = localStorage.getItem('userData');
    const authToken = localStorage.getItem('authToken');

    if (!userData || !authToken) {
        window.location.href = 'login.html';
        return;
    }

    const user = JSON.parse(userData);

    // Dopuszczamy klienta i admina
    if (user.role !== 'client' && user.role !== 'admin') {
        window.location.href = 'login.html';
        return;
    }

    // Dostosuj link powrotu i akcje dla admina/klienta + dodaj klasę stylującą
    const backLink = document.querySelector('nav.auth-nav a[href="my_account_client.html"]');
    if (backLink) {
        backLink.classList.add('back-to-panel');
        if (user.role === 'admin') {
            backLink.setAttribute('href', 'admin_panel.html');
            backLink.textContent = 'Powrót do panelu admina';
            const favBtn = document.querySelector('.profile-actions .btn.btn-secondary');
            if (favBtn) favBtn.style.display = 'none';
        } else {
            backLink.textContent = 'Powrót do panelu';
        }
    }

    function setContactRow(id, value) {
        const el = document.getElementById(id);
        if (!el) return;
        const row = el.closest('.contact-item');
        const hasValue = value !== undefined && value !== null && String(value).trim() !== '';
        if (hasValue) {
            el.textContent = String(value).trim();
            if (row) row.style.display = 'flex';
        } else {
            if (row) row.style.display = 'none';
        }
    }

    const PLATFORM_CONFIG = {
        instagram: { icon: 'IG_logo.png', label: 'Instagram', domains: ['instagram.com','www.instagram.com'], profileUrl: (h) => `https://instagram.com/${h.replace(/^@/, '')}` },
        tiktok: { icon: 'TikTok_logo.png', label: 'TikTok', domains: ['tiktok.com','www.tiktok.com'], profileUrl: (h) => `https://tiktok.com/@${h.replace(/^@/, '')}` },
        facebook: { icon: 'Facebook_logo.png', label: 'Facebook', domains: ['facebook.com','www.facebook.com','m.facebook.com'], profileUrl: (h) => `https://facebook.com/${h.replace(/^@/, '')}` },
        youtube: { icon: 'YouTube_logo.webp', label: 'YouTube', domains: ['youtube.com','www.youtube.com','youtu.be'], profileUrl: (h) => `https://www.youtube.com/@${h.replace(/^@/, '')}` },
    };

    function extractHandleFromUrl(urlStr) {
        try {
            const u = new URL(urlStr);
            const parts = u.pathname.split('/').filter(Boolean);
            if (parts.length > 0) {
                let handle = parts[0];
                return handle.replace(/^@/, '').replace(/\/$/, '');
            }
            return '';
        } catch (_) {
            return '';
        }
    }

    function parseSocialLinks(raw) {
        if (!raw) return {};
        let obj = null;
        try {
            obj = JSON.parse(raw);
            if (typeof obj === 'string') {
                obj = JSON.parse(obj);
            }
        } catch (_) {
            obj = null;
        }
        const out = {};
        if (obj && typeof obj === 'object') {
            for (const key of Object.keys(PLATFORM_CONFIG)) {
                const alt = key === 'youtube' ? 'yt' : key;
                const val = obj[key] || obj[alt] || obj[(key === 'youtube' ? 'YouTube' : key.charAt(0).toUpperCase() + key.slice(1))];
                if (val) out[key] = String(val);
            }
        } else {
            const text = String(raw);
            for (const [key, cfg] of Object.entries(PLATFORM_CONFIG)) {
                // URL do platformy
                const domainsAlternation = cfg.domains.map(d => d.replace(/\./g, '\\.')).join('|');
                const urlRe = new RegExp(`https?:\\/\\/(?:www\\.)?(?:${domainsAlternation})\\/[^\\s)]+`, 'i');
                const urlMatch = text.match(urlRe);
                if (urlMatch && !out[key]) {
                    out[key] = urlMatch[0];
                    continue;
                }
                // Pary platforma:handle np. instagram: nick
                const alias = key === 'instagram' ? 'ig' : key === 'facebook' ? 'fb' : key === 'youtube' ? 'yt' : key;
                const pairRe = new RegExp(`(?:${key}|${alias})\\s*[:=]\\s*(@?[a-zA-Z0-9_.-]+)`, 'i');
                const pair = text.match(pairRe);
                if (pair && !out[key]) {
                    out[key] = pair[1];
                }
            }
        }
        return out;
    }

    // Obsługa wylogowania
    document.getElementById('logout-btn').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        window.location.href = 'login.html';
    });

    // Podmień fallback na obrazku profilowym
    const profileImg = document.getElementById('profile-photo');
    if (profileImg) {
        profileImg.addEventListener('error', () => {
            profileImg.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZjhmOWZhIi8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9Ijc0IiByPSIyNCIgZmlsbD0iI2RlZTJlNiIvPgo8cGF0aCBkPSJtNjAgMTE2YzAtMjIgMTgtNDAgNDAtNDBzNDAgMTggNDAgNDB2MzBoLTgweiIgZmlsbD0iI2RlZTJlNiIvPgo8L3N2Zz4=';
        });
    }

    // Wczytaj szczegóły artysty
    const params = new URLSearchParams(window.location.search);
    const artistId = params.get('id');
    if (!artistId) return;

    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const apiBase = (hostname === 'localhost' || hostname === '127.0.0.1') ? `${protocol}//localhost:6677/api` : `${protocol}//${hostname}/api`;
    try {
        const resp = await fetch(`${apiBase}/artists/details/${artistId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || 'Błąd pobierania profilu');
        const a = data.artist;

        // Header
        document.getElementById('artist-name').textContent = `${a.first_name || ''} ${a.last_name || ''}`.trim();
        document.getElementById('artist-type').textContent = a.artist_type || '';
        document.getElementById('artist-type-badge').textContent = a.artist_type || '';
        document.getElementById('artist-location').textContent = `📍 ${a.residence || a.country || ''}`;
        document.getElementById('artist-reach').textContent = `🌐 Zasięg online: ${a.online_reach || 0}`;
        document.getElementById('artist-experience').textContent = `Doświadczenie: ${'●'.repeat(a.experience_level || 0)}${'○'.repeat(5 - (a.experience_level || 0))} (${a.experience_level || 0}/5)`;
        const primary = (a.photos || []).find(p => p.is_primary) || (a.photos || [])[0];
        if (primary && primary.photo_path) {
            document.getElementById('profile-photo').src = primary.photo_path;
        }

        // Bio
        document.getElementById('artist-bio').textContent = a.bio || '';

        // Doświadczenie zawodowe z kolumny experience_info
        (function renderExperience() {
            const expWrap = document.querySelector('.experience-content');
            if (!expWrap) return;
            const info = a.experience_info;
            if (info && String(info).trim() !== '') {
                expWrap.innerHTML = '';
                const p = document.createElement('p');
                p.textContent = String(info);
                expWrap.appendChild(p);
            } else {
                const section = expWrap.closest('.profile-section');
                if (section) section.style.display = 'none';
            }
        })();

        // Galeria zdjęć
        (function renderGallery() {
            const gallery = document.getElementById('photo-gallery');
            if (!gallery) return;
            const photos = Array.isArray(a.photos) ? a.photos : [];
            if (photos.length === 0) {
                const section = gallery.closest('.profile-section');
                if (section) section.style.display = 'none';
                return;
            }
            gallery.innerHTML = '';
            photos.forEach(p => {
                if (!p || !p.photo_path) return;
                const wrap = document.createElement('div');
                wrap.className = 'photo-item';
                const img = document.createElement('img');
                img.src = p.photo_path;
                img.alt = 'Zdjęcie artysty';
                img.onerror = function () {
                    img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDIwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIxNTAiIGZpbGw9IiNmOGY5ZmEiLz48Y2lyY2xlIGN4PSI5OCIgey5jeT0iNTUiIHI9IjIwIiBmaWxsPSIjZGVlMmU2Ii8+PHBhdGggZD0ibTQwIDExMWMwLTE2IDEyLTI4IDI4LTI4czI4IDEyIDI4IDI4djEwaC02MHoiIGZpbGw9IiNkZWUyZTYiLz48L3N2Zz4=';
                };
                wrap.appendChild(img);
                if (p.is_primary) {
                    const badge = document.createElement('div');
                    badge.className = 'primary-badge';
                    badge.textContent = 'Główne';
                    wrap.appendChild(badge);
                }
                gallery.appendChild(wrap);
            });
        })();

        // Lightbox z nawigacją (galeria i zdjęcie profilowe)
        (function enableLightbox() {
            const overlayId = 'lightbox-overlay';
            let galleryImgs = [];
            let currentIndex = -1;

            function buildOverlay() {
                let overlay = document.getElementById(overlayId);
                if (overlay) return overlay;
                overlay = document.createElement('div');
                overlay.id = overlayId;
                overlay.className = 'lightbox-overlay';
                const img = document.createElement('img');
                overlay.appendChild(img);

                const nav = document.createElement('div');
                nav.className = 'lightbox-nav';
                const prev = document.createElement('button');
                prev.className = 'lightbox-btn lightbox-prev';
                prev.innerHTML = '&#10094;';
                const next = document.createElement('button');
                next.className = 'lightbox-btn lightbox-next';
                next.innerHTML = '&#10095;';
                nav.appendChild(prev);
                nav.appendChild(next);
                overlay.appendChild(nav);

                document.body.appendChild(overlay);

                overlay.addEventListener('click', (e) => {
                    if (e.target === overlay) closeOverlay();
                });
                prev.addEventListener('click', (e) => { e.stopPropagation(); showRelative(-1); });
                next.addEventListener('click', (e) => { e.stopPropagation(); showRelative(1); });
                document.addEventListener('keydown', keyHandler);
                return overlay;
            }

            function openLightboxByIndex(index) {
                if (index < 0 || index >= galleryImgs.length) return;
                currentIndex = index;
                const overlay = buildOverlay();
                const img = overlay.querySelector('img');
                img.src = galleryImgs[currentIndex].src;
            }

            function closeOverlay() {
                const o = document.getElementById(overlayId);
                if (o) o.remove();
                document.removeEventListener('keydown', keyHandler);
                currentIndex = -1;
            }

            function showRelative(delta) {
                if (currentIndex === -1) return;
                currentIndex = (currentIndex + delta + galleryImgs.length) % galleryImgs.length;
                const o = document.getElementById(overlayId);
                if (!o) return;
                o.querySelector('img').src = galleryImgs[currentIndex].src;
            }

            function keyHandler(e) {
                if (e.key === 'Escape') return closeOverlay();
                if (e.key === 'ArrowRight') return showRelative(1);
                if (e.key === 'ArrowLeft') return showRelative(-1);
            }

            galleryImgs = Array.from(document.querySelectorAll('.photo-item img'));
            galleryImgs.forEach((img, i) => {
                img.addEventListener('click', () => openLightboxByIndex(i));
            });
            const profileImgEl = document.getElementById('profile-photo');
            if (profileImgEl) {
                galleryImgs.unshift(profileImgEl);
                profileImgEl.addEventListener('click', () => openLightboxByIndex(0));
            }
        })();

        // Atrybuty
        const setText = (id, val, unit='') => { const el = document.getElementById(id); if (el) el.textContent = (val || val===0) ? `${val}${unit}` : '-'; };
        setText('attr-age', a.age, '');
        setText('attr-height', a.height, ' cm');
        setText('attr-weight', a.weight, ' kg');
        setText('attr-hip', a.hip, ' cm');
        setText('attr-waist', a.waist, ' cm');
        setText('attr-cage', a.cage, ' cm');
        setText('attr-shoe', a.shoe_size, '');
        setText('attr-clothes', a.clothes_size, '');
        setText('attr-eyes', a.eyes_color, '');
        setText('attr-hair', a.hair_color, '');

        // Social media – parsowanie i wyświetlanie z ikonami
        const socialWrap = document.getElementById('social-links');
        if (socialWrap) {
            socialWrap.innerHTML = '';
            const parsed = parseSocialLinks(a.social_media_links);
            const entries = Object.entries(parsed).filter(([k, v]) => v && String(v).trim() !== '');
            for (const [key, val] of entries) {
                const cfg = PLATFORM_CONFIG[key];
                if (!cfg) continue;
                let handle = String(val).trim();
                if (/^https?:\/\//i.test(handle)) {
                    const domainMatch = cfg.domains.some(d => handle.includes(d));
                    if (!domainMatch) continue;
                    handle = extractHandleFromUrl(handle) || handle;
                }
                const url = /^https?:\/\//i.test(val) ? String(val).trim() : cfg.profileUrl(handle);
                const item = document.createElement('a');
                item.href = url;
                item.target = '_blank';
                item.rel = 'noopener noreferrer';
                item.style.display = 'inline-flex';
                item.style.alignItems = 'center';
                item.style.marginRight = '12px';
                const img = document.createElement('img');
                img.src = `../assets/images/${cfg.icon}`;
                img.alt = cfg.label;
                img.style.width = '20px';
                img.style.height = '20px';
                img.style.marginRight = '6px';
                const span = document.createElement('span');
                span.textContent = handle.replace(/^@/, '');
                item.appendChild(img);
                item.appendChild(span);
                socialWrap.appendChild(item);
            }
            if (socialWrap.children.length === 0) {
                const section = socialWrap.closest('.profile-section');
                if (section) section.style.display = 'none';
            }
        }

        // Informacje kontaktowe (email, telefon, miejsce) z ukrywaniem pustych wierszy
        try {
            const userResp = await fetch(`${apiBase.replace('/api','')}/api/users/${a.user_id}`);
            const userDataResp = await userResp.json();
            if (userResp.ok && userDataResp && userDataResp.user) {
                const u = userDataResp.user;
                setContactRow('contact-email', u.email);
                setContactRow('contact-phone', u.phone);
                setContactRow('contact-residence', a.residence || a.country || '');
            } else {
                setContactRow('contact-email', '');
                setContactRow('contact-phone', '');
                setContactRow('contact-residence', a.residence || a.country || '');
            }
        } catch (_) {
            setContactRow('contact-email', '');
            setContactRow('contact-phone', '');
            setContactRow('contact-residence', a.residence || a.country || '');
        }
    } catch (e) {
        console.error('Błąd profilu artysty:', e);
    }
});

document.getElementById('contact-btn')?.addEventListener('click', () => {
    alert('Funkcja kontaktu będzie dostępna wkrótce. W przyszłości tutaj będzie formularz kontaktowy.');
});

document.getElementById('favorite-btn')?.addEventListener('click', async () => {
    try {
        const token = localStorage.getItem('authToken');
        const params = new URLSearchParams(window.location.search);
        const artistId = params.get('id');
        if (!artistId) return alert('Brak identyfikatora artysty');
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        const apiBase = (hostname === 'localhost' || hostname === '127.0.0.1') ? `${protocol}//localhost:6677/api` : `${protocol}//${hostname}/api`;
        const resp = await fetch(`${apiBase}/clients/favorites`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ artist_id: artistId })
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || 'Błąd dodawania do ulubionych');
        alert('Dodano do ulubionych');
    } catch (e) {
        alert(e.message || 'Błąd dodawania do ulubionych');
    }
});


