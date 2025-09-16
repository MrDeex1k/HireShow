let currentUserId = null;
let currentArtistId = null;

// Sprawdź czy użytkownik jest zalogowany
document.addEventListener('DOMContentLoaded', function() {
    const userData = localStorage.getItem('userData');
    const authToken = localStorage.getItem('authToken');
    
    if (!userData || !authToken) {
        window.location.href = 'login.html';
        return;
    }
    
    const user = JSON.parse(userData);
    
    // Sprawdź czy to faktycznie administrator
    if (user.role !== 'admin') {
        // Przekieruj na odpowiednią stronę na podstawie roli
        if (user.role === 'artist') {
            window.location.href = 'my_account_artist.html';
        } else if (user.role === 'client') {
            window.location.href = 'my_account_client.html';
        } else {
            window.location.href = 'login.html';
        }
        return;
    }
    
    // Wyświetl imię użytkownika jeśli dostępne
    if (user.email) {
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
            userNameElement.textContent = user.email.split('@')[0];
        }
    }
    
    // Obsługa przycisków
    setupEventListeners();

    hideAllModals();
});

function hideAllModals() {
    const userModal = document.getElementById('user-details-modal');
    
    if (userModal) {
        userModal.style.setProperty('display', 'none', 'important');
        console.log('User modal ukryty');
    }
    
    currentUserId = null;
    currentArtistId = null;
}

function setupEventListeners() {
    const logoutBtn = document.getElementById('logout-btn');
    const managePendingBtn = document.getElementById('manage-pending-btn');
    const manageRejectedBtn = document.getElementById('manage-rejected-btn');
    const backToMainBtn = document.getElementById('back-to-main');
    const backToMainRejectedBtn = document.getElementById('back-to-main-rejected');
    const approveBtn = document.getElementById('approve-user');
    const rejectBtn = document.getElementById('reject-user');
    const reactivateBtn = document.getElementById('reactivate-user');

    if (!logoutBtn || !managePendingBtn || !manageRejectedBtn || !backToMainBtn || !backToMainRejectedBtn || !approveBtn || !rejectBtn || !reactivateBtn) {
        console.error('Niektóre elementy nie zostały znalezione');
        return;
    }
    
    // Obsługa wylogowania
    logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        window.location.href = 'login.html';
    });

    // Obsługa zarządzania oczekującymi
    managePendingBtn.addEventListener('click', function() {
        showPendingUsersSection();
    });

    // Obsługa zarządzania odrzuconymi
    manageRejectedBtn.addEventListener('click', function() {
        showRejectedUsersSection();
    });

    // Powrót do panelu głównego
    backToMainBtn.addEventListener('click', function() {
        hidePendingUsersSection();
    });

    // Powrót do panelu głównego z sekcji odrzuconych
    backToMainRejectedBtn.addEventListener('click', function() {
        hideRejectedUsersSection();
    });

    // Zamykanie modali klawiszem Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            hideAllModals();
        }
    });

    // Zatwierdzenie użytkownika
    approveBtn.addEventListener('click', function() {
        if (currentUserId) {
            approveUser(currentUserId);
        }
    });

    // Odrzucenie użytkownika
    rejectBtn.addEventListener('click', function() {
        if (currentUserId) {
            if (confirm('Czy na pewno chcesz odrzucić tego użytkownika?')) {
                rejectUser(currentUserId);
            }
        }
    });

    // Reaktywacja użytkownika
    reactivateBtn.addEventListener('click', function() {
        if (currentUserId) {
            if (confirm('Czy na pewno chcesz reaktywować tego użytkownika? Zostanie przeniesiony do oczekujących.')) {
                reactivateUser(currentUserId);
            }
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            hideAllModals();
        }
    });
}

function showPendingUsersSection() {
    document.querySelector('.account-sections').style.display = 'none';
    document.getElementById('pending-users-section').style.display = 'block';
    loadPendingUsers();
}

function hidePendingUsersSection() {
    document.querySelector('.account-sections').style.display = 'grid';
    document.getElementById('pending-users-section').style.display = 'none';
}

function showRejectedUsersSection() {
    document.querySelector('.account-sections').style.display = 'none';
    document.getElementById('rejected-users-section').style.display = 'block';
    loadRejectedUsers();
}

function hideRejectedUsersSection() {
    document.querySelector('.account-sections').style.display = 'grid';
    document.getElementById('rejected-users-section').style.display = 'none';
}

async function loadPendingUsers() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/users/pending', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            displayPendingUsers(data.users);
        } else {
            console.error('Błąd podczas pobierania oczekujących użytkowników');
        }
    } catch (error) {
        console.error('Błąd:', error);
    }
}

async function loadRejectedUsers() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/users/rejected', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            displayRejectedUsers(data.users);
        } else {
            console.error('Błąd podczas pobierania odrzuconych użytkowników');
        }
    } catch (error) {
        console.error('Błąd:', error);
    }
}

function displayRejectedUsers(users) {
    const container = document.getElementById('rejected-users-list');
    container.innerHTML = '';

    if (users.length === 0) {
        container.innerHTML = '<p class="empty-state">Brak odrzuconych użytkowników.</p>';
        return;
    }

    users.forEach(user => {
        const userCard = document.createElement('div');
        userCard.className = 'user-card rejected-user-card';
        userCard.innerHTML = `
            <div class="user-basic-info">
                <h3>USER_ID: ${user.user_id}</h3>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Rola:</strong> ${user.role}</p>
                <p><strong>Data rejestracji:</strong> ${new Date(user.created_at).toLocaleDateString('pl-PL')}</p>
                <p><strong>Data odrzucenia:</strong> ${new Date(user.updated_at).toLocaleDateString('pl-PL')}</p>
                <div class="status-badge rejected">ODRZUCONY</div>
            </div>
        `;
        
        userCard.addEventListener('click', function() {
            showUserDetails(user.user_id, 'rejected');
        });

        container.appendChild(userCard);
    });
}

function displayPendingUsers(users) {
    const container = document.getElementById('pending-users-list');
    container.innerHTML = '';

    if (users.length === 0) {
        container.innerHTML = '<p>Brak użytkowników oczekujących na zatwierdzenie.</p>';
        return;
    }

    users.forEach(user => {
        const userCard = document.createElement('div');
        userCard.className = 'user-card';
        userCard.innerHTML = `
            <div class="user-basic-info">
                <h3>USER_ID: ${user.user_id}</h3>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Rola:</strong> ${user.role}</p>
                <p><strong>Data rejestracji:</strong> ${new Date(user.created_at).toLocaleDateString('pl-PL')}</p>
            </div>
        `;
        
        userCard.addEventListener('click', function() {
            showUserDetails(user.user_id);
        });

        container.appendChild(userCard);
    });
}

async function showUserDetails(userId, userType = 'pending') {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`/api/users/${userId}/details`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            displayUserDetails(data.user, userType);
            currentUserId = userId;
            document.getElementById('user-details-modal').style.display = 'block';
        } else {
            console.error('Błąd podczas pobierania szczegółów użytkownika');
        }
    } catch (error) {
        console.error('Błąd:', error);
    }
}

function displayUserDetails(user, userType = 'pending') {
    const container = document.getElementById('user-details-content');
    
    let content = `
        <div class="user-details">
            <h3>Podstawowe informacje</h3>
            <p><strong>User ID:</strong> ${user.user_id}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Rola:</strong> ${user.role}</p>
            <p><strong>Status zatwierdzenia:</strong> ${user.is_approved}</p>
            <p><strong>Telefon:</strong> ${user.phone || 'Nie podano'}</p>
            <p><strong>Data rejestracji:</strong> ${new Date(user.created_at).toLocaleDateString('pl-PL')}</p>
            ${user.updated_at ? `<p><strong>Ostatnia aktualizacja:</strong> ${new Date(user.updated_at).toLocaleDateString('pl-PL')}</p>` : ''}
    `;

    // Ustawienia przycisków na podstawie typu użytkownika
    const approveBtn = document.getElementById('approve-user');
    const rejectBtn = document.getElementById('reject-user');
    const reactivateBtn = document.getElementById('reactivate-user');

    if (userType === 'rejected') {
        approveBtn.style.display = 'none';
        rejectBtn.style.display = 'none';
        reactivateBtn.style.display = 'inline-block';
    } else {
        approveBtn.style.display = 'inline-block';
        rejectBtn.style.display = 'inline-block';
        reactivateBtn.style.display = 'none';
    }

    if (user.relatedData) {
        if (user.role === 'artist') {
            content += `
                <h3>Dane artysty</h3>
                <p><strong>Artist ID:</strong> ${user.relatedData.artist_id || 'Nie przypisano'}</p>
                <p><strong>Imię:</strong> ${user.relatedData.first_name || 'Nie podano'}</p>
                <p><strong>Nazwisko:</strong> ${user.relatedData.last_name || 'Nie podano'}</p>
                <p><strong>Typ artysty:</strong> ${user.relatedData.artist_type || 'Nie podano'}</p>
                <p><strong>Miejsce zamieszkania:</strong> ${user.relatedData.residence || 'Nie podano'}</p>
                <p><strong>Kraj:</strong> ${user.relatedData.country || 'Nie podano'}</p>
                <p><strong>Wiek:</strong> ${user.relatedData.age ?? 'Nie podano'}</p>
                <p><strong>Wzrost (cm):</strong> ${user.relatedData.height ?? 'Nie podano'}</p>
                <p><strong>Waga (kg):</strong> ${user.relatedData.weight ?? 'Nie podano'}</p>
                <p><strong>Biodra (cm):</strong> ${user.relatedData.hip ?? 'Nie podano'}</p>
                <p><strong>Talia (cm):</strong> ${user.relatedData.waist ?? 'Nie podano'}</p>
                <p><strong>Klatka piersiowa (cm):</strong> ${user.relatedData.cage ?? 'Nie podano'}</p>
                <p><strong>Rozmiar buta (EU):</strong> ${user.relatedData.shoe_size ?? 'Nie podano'}</p>
                <p><strong>Rozmiar ubrań:</strong> ${user.relatedData.clothes_size ?? 'Nie podano'}</p>
                <p><strong>Kolor oczu:</strong> ${user.relatedData.eyes_color || 'Nie podano'}</p>
                <p><strong>Kolor włosów:</strong> ${user.relatedData.hair_color || 'Nie podano'}</p>
                <p><strong>Doświadczenie (opis):</strong> ${user.relatedData.experience_info || 'Nie podano'}</p>
                <p><strong>Doświadczenie (poziom 1-5):</strong> <span id="exp-level-value">${user.relatedData.experience_level ?? 'Nie ustawiono'}</span></p>
                <div class="experience-level-controls">
                    <label for="exp-level-select"><strong>Ustaw poziom doświadczenia</strong></label>
                    <select id="exp-level-select">
                        <option value="">– wybierz –</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                    </select>
                    <div id="exp-error" class="field-error-msg" style="display:none;">Ustaw poziom doświadczenia (1-5) przed akceptacją.</div>
                </div>
                <p><strong>Zasięg online:</strong> ${user.relatedData.online_reach || 'Nie podano'}</p>
                <p><strong>Bio:</strong> ${user.relatedData.bio || 'Nie podano'}</p>
                <div class="premium-toggle">
                    <span><strong>Czy Premium?</strong></span>
                    <div class="premium-controls">
                        <label class="toggle-switch">
                            <input type="checkbox" id="premium-toggle" ${user.relatedData.popularity_premium ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                        <span class="premium-status" id="premium-status">${user.relatedData.popularity_premium ? 'TAK' : 'NIE'}</span>
                    </div>
                </div>
                ${user.relatedData.short_video ? `<p><strong>Krótkie wideo:</strong> <a href="${user.relatedData.short_video}" target="_blank">Zobacz wideo</a></p>` : ''}
                ${user.relatedData.social_media_links ? `<p><strong>Social media:</strong> ${user.relatedData.social_media_links}</p>` : ''}
            `;
            
            if (user.relatedData.photos && user.relatedData.photos.length > 0) {
                content += '<h3>Zdjęcia</h3><div class="photos-gallery">';
                user.relatedData.photos.forEach(photo => {
                    const p = typeof photo === 'string' ? photo : (photo.photo_path || '');
                    content += `<img src="${p}" alt="Zdjęcie artysty" class="artist-photo">`;
                });
                content += '</div>';
            }
        } else if (user.role === 'client') {
            content += `
                <h3>Dane klienta</h3>
                <p><strong>Client ID:</strong> ${user.relatedData.client_id || 'Nie przypisano'}</p>
                <p><strong>Nazwa firmy:</strong> ${user.relatedData.client_name || 'Nie podano'}</p>
                <p><strong>NIP:</strong> ${user.relatedData.client_nip || 'Nie podano'}</p>
                <!-- Subskrypcja wybierana jest po akceptacji konta; dane planu nie są prezentowane w oczekujących -->
            `;
        }
    } else {
        content += `
            <h3>Dodatkowe dane</h3>
            <p style="color: #888; font-style: italic;">Brak dodatkowych danych dla użytkownika o roli ${user.role}</p>
        `;
    }

    content += '</div>';
    container.innerHTML = content;
    
    // Dodaj event listener dla suwaka premium (tylko dla artystów)
    if (user.role === 'artist' && user.relatedData) {
        const premiumToggle = document.getElementById('premium-toggle');
        if (premiumToggle) {
            premiumToggle.addEventListener('change', function() {
                updatePremiumStatus(user.relatedData.artist_id, this.checked);
            });
        }

        const expSelect = document.getElementById('exp-level-select');
        const expValue = document.getElementById('exp-level-value');
        if (expSelect) {
            expSelect.value = user.relatedData.experience_level ? String(user.relatedData.experience_level) : '';
            expSelect.addEventListener('change', function() {
                const err = document.getElementById('exp-error');
                expSelect.classList.remove('field-error');
                if (err) err.style.display = 'none';
            });
        }
        currentArtistId = user.relatedData.artist_id || null;
    }
    
    // Dodaj event listenery dla zamykania modali
    const modal = document.getElementById('user-details-modal');
    const closeButton = modal.querySelector('.close');
    
    // Event listener dla przycisku X
    if (closeButton) {
        closeButton.addEventListener('click', function() {
            hideAllModals();
        });
    }
    
    // Event listener dla kliknięcia na tło modala
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            hideAllModals();
        }
    });
}

async function updatePremiumStatus(artistId, isPremium) {
    try {
        console.log('Attempting to update premium status:', { artistId, isPremium });
        
        const token = localStorage.getItem('authToken');
        const response = await fetch(`/api/artists/premium-status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                artist_id: artistId,
                popularity_premium: isPremium
            })
        });

        console.log('Response status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('Success response:', data);
            
            // Aktualizuj tekst statusu
            const statusElement = document.getElementById('premium-status');
            if (statusElement) {
                statusElement.textContent = isPremium ? 'TAK' : 'NIE';
                statusElement.style.color = isPremium ? '#007bff' : '#666';
            }
            
            console.log(`Status Premium zaktualizowany: ${isPremium ? 'TAK' : 'NIE'}`);
        } else {
            const errorData = await response.json();
            console.error('Error response:', errorData);
            console.error('Full response:', response);
            
            // Przywróć poprzedni stan suwaka
            const premiumToggle = document.getElementById('premium-toggle');
            if (premiumToggle) {
                premiumToggle.checked = !isPremium;
            }
            alert('Błąd podczas aktualizacji statusu Premium: ' + (errorData.error || 'Nieznany błąd'));
        }
    } catch (error) {
        console.error('Network or other error:', error);
        
        // Przywróć poprzedni stan suwaka
        const premiumToggle = document.getElementById('premium-toggle');
        if (premiumToggle) {
            premiumToggle.checked = !isPremium;
        }
        alert('Błąd podczas aktualizacji statusu Premium: ' + error.message);
    }
}

async function updateExperienceLevel(artistId, level) {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`/api/artists/experience-level`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ artist_id: artistId, experience_level: level })
        });
        if (!response.ok) {
            const err = await response.json();
            alert('Błąd podczas zapisu experience_level: ' + (err.error || 'Nieznany błąd'));
            return false;
        }
        return true;
    } catch (error) {
        console.error('Error updating experience level', error);
        alert('Problem z aktualizacją experience_level');
        return false;
    }
}

async function approveUser(userId) {
    try {
        // Jeśli ustawiono poziom doświadczenia, zapisz go przed akceptacją
        const expSelect = document.getElementById('exp-level-select');
        if (expSelect && currentArtistId) {
            const val = parseInt(expSelect.value, 10);
            if (Number.isNaN(val) || val < 1 || val > 5) {
                const err = document.getElementById('exp-error');
                expSelect.classList.add('field-error');
                if (err) err.style.display = 'block';
                return;
            }
            const ok = await updateExperienceLevel(currentArtistId, val);
            if (!ok) {
                alert('Nie udało się zapisać poziomu doświadczenia. Spróbuj ponownie.');
                return;
            }
            const expValueElem = document.getElementById('exp-level-value');
            if (expValueElem) {
                expValueElem.textContent = String(val);
            }
        }
        const token = localStorage.getItem('authToken');
        const response = await fetch(`/api/users/${userId}/approval`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                action: 'approve'
            })
        });

        if (response.ok) {
            alert('Użytkownik został zatwierdzony');
            hideAllModals();
            loadPendingUsers(); // Odśwież listę
        } else {
            alert('Błąd podczas zatwierdzania użytkownika');
        }
    } catch (error) {
        console.error('Błąd:', error);
        alert('Błąd podczas zatwierdzania użytkownika');
    }
}

async function rejectUser(userId) {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`/api/users/${userId}/approval`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                action: 'reject'
            })
        });

        if (response.ok) {
            alert('Użytkownik został odrzucony');
            hideAllModals();
            loadPendingUsers(); // Odśwież listę
        } else {
            alert('Błąd podczas odrzucania użytkownika');
        }
    } catch (error) {
        console.error('Błąd:', error);
        alert('Błąd podczas odrzucania użytkownika');
    }
}

async function reactivateUser(userId) {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`/api/users/${userId}/approval`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                action: 'reactivate'
            })
        });

        if (response.ok) {
            alert('Użytkownik został reaktywowany i przeniesiony do oczekujących');
            hideAllModals();
            loadRejectedUsers(); // Odśwież listę odrzuconych
        } else {
            alert('Błąd podczas reaktywacji użytkownika');
        }
    } catch (error) {
        console.error('Błąd:', error);
        alert('Błąd podczas reaktywacji użytkownika');
    }
}
