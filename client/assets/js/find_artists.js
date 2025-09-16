document.addEventListener('DOMContentLoaded', function() {
    // Sprawdź czy użytkownik jest zalogowany
    const userData = localStorage.getItem('userData');
    const authToken = localStorage.getItem('authToken');
    
    if (!userData || !authToken) {
        window.location.href = 'login.html';
        return;
    }
    
    const user = JSON.parse(userData);
    window.currentUserRole = user.role;
    
    // Sprawdź rolę: dopuszczamy client i admin
    if (user.role !== 'client' && user.role !== 'admin') {
        window.location.href = 'login.html';
        return;
    }

    // Dostosuj link powrotu w nagłówku w zależności od roli
    const backLink = document.querySelector('nav.auth-nav a[href="my_account_client.html"]');
    if (backLink) {
        backLink.classList.add('back-to-panel');
        if (user.role === 'admin') {
            backLink.setAttribute('href', 'admin_panel.html');
            backLink.textContent = 'Powrót do panelu admina';
        }
    }
    
    // Obsługa wylogowania
    document.getElementById('logout-btn').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        window.location.href = 'login.html';
    });

    // Obsługa wyszukiwania
    document.getElementById('search-btn').addEventListener('click', performSearch);
    document.getElementById('clear-filters').addEventListener('click', clearFilters);

    // Pokaż/ukryj dodatkowe filtry
    const toggleBtn = document.getElementById('toggle-more-filters');
    const moreFilters = document.getElementById('more-filters');
    if (toggleBtn && moreFilters) {
        toggleBtn.addEventListener('click', () => {
            const show = moreFilters.style.display === 'none' || moreFilters.style.display === '';
            moreFilters.style.display = show ? 'block' : 'none';
            toggleBtn.textContent = show ? 'Ukryj dodatkowe filtry' : 'Pokaż więcej filtrów';
        });
    }

    // Załaduj początkowe wyniki
    performSearch();

    // Obsługa kropek doświadczenia
    const dots = document.querySelectorAll('.experience-dots .dot');
    dots.forEach(dot => {
        dot.addEventListener('click', function() {
            const value = this.dataset.value;
            document.getElementById('experience').value = value;
            
            // Zaznacz wybrane kropki
            dots.forEach(d => {
                d.classList.remove('selected');
                if (d.dataset.value <= value) {
                    d.classList.add('selected');
                }
            });
            performSearch();
        });
    });
});

function getApiBaseUrl() {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return `${protocol}//localhost:6677/api`;
    }
    return `${protocol}//${hostname}/api`;
}

async function performSearch() {
    const params = new URLSearchParams();
    const artistType = document.getElementById('artist-type').value;
    const experience = document.getElementById('experience').value;
    const location = document.getElementById('location').value.trim();
    const ageMin = document.getElementById('age-min')?.value;
    const ageMax = document.getElementById('age-max')?.value;
    const heightMin = document.getElementById('height-min')?.value;
    const heightMax = document.getElementById('height-max')?.value;
    const weightMin = document.getElementById('weight-min')?.value;
    const weightMax = document.getElementById('weight-max')?.value;
    const hipMin = document.getElementById('hip-min')?.value;
    const hipMax = document.getElementById('hip-max')?.value;
    const waistMin = document.getElementById('waist-min')?.value;
    const waistMax = document.getElementById('waist-max')?.value;
    const cageMin = document.getElementById('cage-min')?.value;
    const cageMax = document.getElementById('cage-max')?.value;
    const shoeSizeMin = document.getElementById('shoe-size-min')?.value;
    const shoeSizeMax = document.getElementById('shoe-size-max')?.value;
    const clothesSizeMin = document.getElementById('clothes-size-min')?.value;
    const clothesSizeMax = document.getElementById('clothes-size-max')?.value;
    const onlineReachMin = document.getElementById('online-reach-min')?.value;
    const onlineReachMax = document.getElementById('online-reach-max')?.value;

    if (artistType) params.append('artist_type', artistType);
    if (experience && experience !== '0') params.append('experience_min', experience);
    if (location) params.append('location', location);
    if (ageMin) params.append('age_min', ageMin);
    if (ageMax) params.append('age_max', ageMax);
    if (heightMin) params.append('height_min', heightMin);
    if (heightMax) params.append('height_max', heightMax);
    if (weightMin) params.append('weight_min', weightMin);
    if (weightMax) params.append('weight_max', weightMax);
    if (hipMin) params.append('hip_min', hipMin);
    if (hipMax) params.append('hip_max', hipMax);
    if (waistMin) params.append('waist_min', waistMin);
    if (waistMax) params.append('waist_max', waistMax);
    if (cageMin) params.append('cage_min', cageMin);
    if (cageMax) params.append('cage_max', cageMax);
    if (shoeSizeMin) params.append('shoe_size_min', shoeSizeMin);
    if (shoeSizeMax) params.append('shoe_size_max', shoeSizeMax);
    if (clothesSizeMin) params.append('clothes_size_min', clothesSizeMin);
    if (clothesSizeMax) params.append('clothes_size_max', clothesSizeMax);
    if (onlineReachMin) params.append('online_reach_min', onlineReachMin);
    if (onlineReachMax) params.append('online_reach_max', onlineReachMax);

    const grid = document.getElementById('artists-grid');
    const countElement = document.getElementById('results-count');
    const noResults = document.getElementById('no-results');
    grid.innerHTML = '<div class="loading">Ładowanie wyników...</div>';
    countElement.textContent = 'Wyszukiwanie...';
    noResults.style.display = 'none';

    try {
        const apiBaseUrl = getApiBaseUrl();
        const token = localStorage.getItem('authToken');
        const resp = await fetch(`${apiBaseUrl}/artists/search?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        const data = await resp.json();
        if (!resp.ok) {
            throw new Error(data && data.error ? data.error : 'Błąd wyszukiwania');
        }
        displayResults(data.artists || []);
    } catch (e) {
        console.error('Błąd wyszukiwania:', e);
        grid.innerHTML = '';
        noResults.style.display = 'block';
        countElement.textContent = 'Znaleziono 0 artystów';
    }
}

function clearFilters() {
    document.getElementById('artist-type').value = '';
    document.getElementById('experience').value = '0';
    document.querySelectorAll('.experience-dots .dot').forEach(d => d.classList.remove('selected'));
    document.getElementById('location').value = '';
    const ids = ['age-min','age-max','height-min','height-max','weight-min','weight-max','hip-min','hip-max','waist-min','waist-max','cage-min','cage-max','shoe-size-min','shoe-size-max','clothes-size-min','clothes-size-max','online-reach-min','online-reach-max'];
    ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    
    performSearch();
}

// mock removed – używamy real API

function displayResults(artists) {
    const grid = document.getElementById('artists-grid');
    const countElement = document.getElementById('results-count');
    const noResults = document.getElementById('no-results');

    if (artists.length === 0) {
        grid.style.display = 'none';
        noResults.style.display = 'block';
        countElement.textContent = 'Znaleziono 0 artystów';
        return;
    }

    grid.style.display = 'grid';
    noResults.style.display = 'none';
    countElement.textContent = `Znaleziono ${artists.length} artystów`;

    grid.innerHTML = artists.map(artist => {
        if (artist.blur) {
            return `
                <div class="artist-card premium-card" data-artist-id="${artist.artist_id}">
                    <div class="artist-photo">
                        <img src="${artist.photo || '../assets/images/placeholder-avatar.jpg'}" alt="Artysta Premium" class="blurred" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjZjhmOWZhIi8+CjxjaXJjbGUgY3g9IjUwIiBjeT0iMzciIHI9IjEyIiBmaWxsPSIjZGVlMmU2Ii8+CjxwYXRoIGQ9Im0zMCA1OGMwLTExIDktMjAgMjAtMjBzMjAgOSAyMCAyMHYxNWgtNDB6IiBmaWxsPSIjZGVlMmU2Ii8+Cjwvc3ZnPg=='">
                        <div class="premium-badge">PREMIUM</div>
                    </div>
                    <div class="artist-info">
                        <h4>Artysta Premium</h4>
                        <p class="artist-type">${artist.type}</p>
                        <p class="artist-location">${artist.location || ''}</p>
                        <p class="artist-experience">Doświadczenie: ${'●'.repeat(artist.experience || 0)}${'○'.repeat(5 - (artist.experience || 0))}</p>
                    </div>
                    <div class="premium-overlay">
                        <button class="btn btn-premium" onclick="goToSubscription()">ZARZĄDZAJ SUBSKRYPCJĄ</button>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="artist-card">
                    <div class="artist-photo">
                        <img src="${artist.photo || '../assets/images/placeholder-avatar.jpg'}" alt="${artist.name}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjZjhmOWZhIi8+CjxjaXJjbGUgY3g9IjUwIiBjeT0iMzciIHI9IjEyIiBmaWxsPSIjZGVlMmU2Ii8+CjxwYXRoIGQ9Im0zMCA1OGMwLTExIDktMjAgMjAtMjBzMjAgOSAyMCAyMHYxNWgtNDB6IiBmaWxsPSIjZGVlMmU2Ii8+Cjwvc3ZnPg=='">
                    </div>
                    <div class="artist-info">
                        <h4>${artist.name}</h4>
                        <p class="artist-type">${artist.type}</p>
                        <p class="artist-location">${artist.location || ''}</p>
                        <p class="artist-experience">Doświadczenie: ${'●'.repeat(artist.experience || 0)}${'○'.repeat(5 - (artist.experience || 0))}</p>
                        <div class="artist-actions">
                            <button class="btn btn-primary btn-small" onclick="contactArtist(${artist.artist_id})">Kontakt</button>
                            <button class="btn btn-secondary btn-small" onclick="viewProfile(${artist.artist_id})">Profil</button>
                            ${window.currentUserRole === 'client' ? `<button class="btn btn-secondary btn-small" onclick="addFavorite(${artist.artist_id}, this)">Ulubione</button>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }
    }).join('');
}

function contactArtist(artistId) {
    alert(`Funkcja kontaktu z artystą ID: ${artistId} będzie dostępna wkrótce`);
}

function viewProfile(artistId) {
    window.location.href = `finded_artist_profile.html?id=${artistId}`;
}

async function addFavorite(artistId, btn) {
    try {
        if (window.currentUserRole !== 'client') return;
        const apiBaseUrl = getApiBaseUrl();
        const token = localStorage.getItem('authToken');
        const resp = await fetch(`${apiBaseUrl}/clients/favorites`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ artist_id: artistId })
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || 'Błąd dodawania do ulubionych');
        if (btn) {
            btn.textContent = 'Dodano';
            btn.disabled = true;
        }
    } catch (e) {
        alert(e.message || 'Błąd dodawania do ulubionych');
    }
}

function goToSubscription() {
    window.location.href = 'subscription_settings.html';
}
