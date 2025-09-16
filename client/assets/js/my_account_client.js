// Sprawdź czy użytkownik jest zalogowany
document.addEventListener('DOMContentLoaded', function() {
    const userData = localStorage.getItem('userData');
    const authToken = localStorage.getItem('authToken');
    
    if (!userData || !authToken) 
    {
        window.location.href = 'login.html';
        return;
    }
    
    const user = JSON.parse(userData);
    
    // Sprawdź czy to faktycznie klient
    if (user.role !== 'client') 
    {
        window.location.href = 'login.html';
        return;
    }
    
    // Wyświetl imię użytkownika jeśli dostępne
    if (user.client_name) 
    {
        document.getElementById('user-name').textContent = user.client_name;
    } else if (user.email) 
    {
        document.getElementById('user-name').textContent = user.email.split('@')[0];
    }
    
    // Ulubieni artyści
    const favSection = document.getElementById('favorites-section');
    const favList = document.getElementById('favorites-list');
    const favEmpty = document.getElementById('favorites-empty');
    document.getElementById('view-favorites').addEventListener('click', async function(e) {
        e.preventDefault();
        favSection.style.display = 'block';
        await loadFavorites();
    });
    document.getElementById('hide-favorites').addEventListener('click', function() {
        favSection.style.display = 'none';
    });

    async function loadFavorites() {
        try {
            const protocol = window.location.protocol;
            const hostname = window.location.hostname;
            const apiBase = (hostname === 'localhost' || hostname === '127.0.0.1') ? `${protocol}//localhost:6677/api` : `${protocol}//${hostname}/api`;
            const token = localStorage.getItem('authToken');
            const resp = await fetch(`${apiBase}/clients/favorites`, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await resp.json();
            if (!resp.ok) throw new Error(data.error || 'Błąd pobierania ulubionych');
            const artists = data.artists || [];
            favEmpty.style.display = artists.length ? 'none' : 'block';
            favList.innerHTML = artists.map(a => `
                <div class="artist-card">
                    <div class="artist-photo">
                        <img src="${a.photo || '../assets/images/placeholder-avatar.jpg'}" alt="${a.name}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjZjhmOWZhIi8+CjxjaXJjbGUgY3g9IjUwIiBjeT0iMzciIHI9IjEyIiBmaWxsPSIjZGVlMmU2Ii8+CjxwYXRoIGQ9Im0zMCA1OGMwLTExIDktMjAgMjAtMjBzMjAgOSAyMCAyMHYxNWgtNDB6IiBmaWxsPSIjZGVlMmU2Ii8+Cjwvc3ZnPg=='">
                    </div>
                    <div class="artist-info">
                        <h4>${a.name}</h4>
                        <p class="artist-type">${a.type}</p>
                        <p class="artist-location">${a.location || ''}</p>
                        <p class="artist-experience">Doświadczenie: ${'●'.repeat(a.experience || 0)}${'○'.repeat(5 - (a.experience || 0))}</p>
                        <div class="artist-actions">
                            <button class="btn btn-secondary btn-small" onclick="window.location.href='finded_artist_profile.html?id=${a.artist_id}'">Profil</button>
                            <button class="btn btn-danger btn-small" onclick="removeFavorite(${a.artist_id})">Usuń</button>
                        </div>
                    </div>
                </div>
            `).join('');
        } catch (e) {
            favList.innerHTML = '';
            favEmpty.style.display = 'block';
        }
    }

    window.removeFavorite = async function(artistId) {
        try {
            const protocol = window.location.protocol;
            const hostname = window.location.hostname;
            const apiBase = (hostname === 'localhost' || hostname === '127.0.0.1') ? `${protocol}//localhost:6677/api` : `${protocol}//${hostname}/api`;
            const token = localStorage.getItem('authToken');
            const resp = await fetch(`${apiBase}/clients/favorites/${artistId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            const data = await resp.json();
            if (!resp.ok) throw new Error(data.error || 'Błąd usuwania');
            await loadFavorites();
        } catch (e) {
            alert(e.message || 'Błąd usuwania ulubionego');
        }
    }

    // Obsługa wylogowania
    document.getElementById('logout-btn').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        window.location.href = 'login.html';
    });
});


