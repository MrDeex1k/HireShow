// Skrypt do obsługi edycji profilu artysty

document.addEventListener('DOMContentLoaded', function() {
    // Sprawdź czy użytkownik jest zalogowany i czy to artysta
    checkAuth();
    
    // Załaduj aktualne dane artysty
    loadArtistData();
    
    // Obsługa formularza
    const form = document.getElementById('edit-profile-form');
    form.addEventListener('submit', handleFormSubmit);

    // Obsługa zdjęć
    setupPhotoManager();
});

function checkAuth() {
    const userData = localStorage.getItem('userData');
    const authToken = localStorage.getItem('authToken');
    
    if (!userData || !authToken) {
        window.location.href = 'login.html';
        return;
    }
    
    const user = JSON.parse(userData);
    
    // Sprawdź czy to faktycznie artysta
    if (user.role !== 'artist') {
        window.location.href = 'login.html';
        return;
    }
}

async function loadArtistData() {
    try {
        // Pokazuj inne loading dla ładowania danych
        showLoadingData(true);
        
        const userData = JSON.parse(localStorage.getItem('userData'));
        const authToken = localStorage.getItem('authToken');
        
        // Pobierz dane artysty z API
        const response = await fetch(`/api/artists/by-user/${userData.user_id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            populateForm(data.artist);
        } else {
            showMessage('Nie udało się załadować danych profilu', 'error');
        }
    } catch (error) {
        console.error('Błąd podczas ładowania danych:', error);
        showMessage('Wystąpił błąd podczas ładowania danych', 'error');
    } finally {
        showLoadingData(false);
    }
}

function populateForm(artistData) {
    // Wypełnij podstawowe dane
    document.getElementById('first_name').value = artistData.first_name || '';
    document.getElementById('last_name').value = artistData.last_name || '';
    document.getElementById('phone').value = artistData.phone || '';
    document.getElementById('residence').value = artistData.residence || '';
    document.getElementById('country').value = artistData.country || '';
    document.getElementById('artist_type').value = artistData.artist_type || '';
    document.getElementById('age').value = artistData.age ?? '';
    document.getElementById('height').value = artistData.height ?? '';
    document.getElementById('weight').value = artistData.weight ?? '';
    document.getElementById('hip').value = artistData.hip ?? '';
    document.getElementById('waist').value = artistData.waist ?? '';
    document.getElementById('cage').value = artistData.cage ?? '';
    document.getElementById('shoe_size').value = artistData.shoe_size ?? '';
    document.getElementById('clothes_size').value = artistData.clothes_size ?? '';
    document.getElementById('eyes_color').value = artistData.eyes_color || '';
    document.getElementById('hair_color').value = artistData.hair_color || '';
    document.getElementById('experience_info').value = artistData.experience_info || '';
    document.getElementById('bio').value = artistData.bio || '';
    document.getElementById('online_reach').value = artistData.online_reach || '';
    document.getElementById('short_video').value = artistData.short_video || '';
    
    // Wypełnij zdjęcia w gridzie
    renderExistingPhotos(artistData.photos || []);
    
    // Parsuj i wypełnij linki social media
    if (artistData.social_media_links) {
        try {
            const socialMedia = JSON.parse(artistData.social_media_links);
            document.getElementById('instagram').value = socialMedia.instagram || '';
            document.getElementById('tiktok').value = socialMedia.tiktok || '';
            document.getElementById('facebook').value = socialMedia.facebook || '';
            document.getElementById('youtube').value = socialMedia.youtube || '';
            // twitter usunięty z formularza
        } catch (error) {
            console.error('Błąd podczas parsowania social media links:', error);
        }
    }
}

function setupPhotoManager() {
    const pickBtn = document.getElementById('pick-photos-btn');
    const input = document.getElementById('photos-input');
    const grid = document.getElementById('photos-grid');
    const err = document.getElementById('photos-error');
    const form = document.getElementById('edit-profile-form');

    if (!pickBtn || !input || !grid) return;

    let uploading = false;
    let newPhotos = []; // bieżąca paczka wybranych do uploadu (klient)

    function setSaveDisabled(disabled) {
        const saveBtn = form.querySelector('button[type="submit"]');
        if (saveBtn) saveBtn.disabled = disabled;
    }

    function showErr(message) {
        err.textContent = message;
        err.style.display = 'block';
    }
    function hideErr() { err.style.display = 'none'; }

    pickBtn.addEventListener('click', () => input.click());
    input.addEventListener('change', async () => {
        hideErr();
        const files = Array.from(input.files || []);
        const userData = JSON.parse(localStorage.getItem('userData'));
        const token = localStorage.getItem('authToken');
        if (!userData || !token) { showErr('Musisz być zalogowany.'); return; }
        if (files.length === 0) return;
        // Walidacja po stronie klienta (wstępna)
        const allowed = ['image/jpeg', 'image/png'];
        for (const f of files) {
            if (!allowed.includes(f.type)) { showErr('Dozwolone są tylko JPG/PNG'); return; }
            if (f.size > 5 * 1024 * 1024) { showErr('Plik zbyt duży (max 5MB)'); return; }
        }
        // Wyślij multipart do /api/artists/photos z JWT
        const apiUrl = '/api/artists/photos';
        const fd = new FormData();
        files.forEach(file => fd.append('photos', file));
        try {
            uploading = true;
            setSaveDisabled(true);
            const resp = await fetch(apiUrl, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: fd });
            const data = await resp.json();
            if (!resp.ok) { showErr(data.error || 'Błąd podczas uploadu zdjęć'); return; }
            // Dodaj do grida nowo dodane zdjęcia
            const normalized = (data.photos || []).map(p => ({ photo_id: p.photo_id, photo_path: p.photo_path, position: p.position, is_primary: p.is_primary }));
            appendPhotosToGrid(normalized);
        } catch (e) {
            showErr('Błąd sieci podczas uploadu');
        } finally {
            uploading = false;
            setSaveDisabled(false);
            input.value = '';
        }
    });

    // Drag&drop sortowania istniejących zdjęć
    grid.addEventListener('dragstart', (e) => {
        const cell = e.target.closest('.photo-item');
        if (!cell) return;
        cell.classList.add('dragging');
        e.dataTransfer.setData('text/plain', cell.dataset.photoId);
    });
    grid.addEventListener('dragend', (e) => {
        const cell = e.target.closest('.photo-item');
        if (cell) cell.classList.remove('dragging');
    });
    grid.addEventListener('dragover', (e) => e.preventDefault());
    grid.addEventListener('drop', async (e) => {
        e.preventDefault();
        const fromId = e.dataTransfer.getData('text/plain');
        const toCell = e.target.closest('.photo-item');
        if (!fromId || !toCell) return;
        const toId = toCell.dataset.photoId;
        if (fromId === toId) return;
        // Reorder w DOM
        const cells = Array.from(grid.querySelectorAll('.photo-item'));
        const fromIdx = cells.findIndex(c => c.dataset.photoId === fromId);
        const toIdx = cells.findIndex(c => c.dataset.photoId === toId);
        if (fromIdx < 0 || toIdx < 0) return;
        const moved = cells[fromIdx];
        if (toIdx > fromIdx) {
            grid.insertBefore(moved, cells[toIdx].nextSibling);
        } else {
            grid.insertBefore(moved, cells[toIdx]);
        }
        // Wyślij nową kolejność do API
        const token = localStorage.getItem('authToken');
        const newOrder = Array.from(grid.querySelectorAll('.photo-item')).map(c => c.dataset.photoId);
        try {
            setSaveDisabled(true);
            const resp = await fetch('/api/artists/photos/order', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ order: newOrder })
            });
            if (!resp.ok) {
                const data = await resp.json();
                alert(data.error || 'Błąd zapisu kolejności');
            }
        } finally {
            setSaveDisabled(false);
        }
    });
}

function renderExistingPhotos(photos) {
    const grid = document.getElementById('photos-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const normalized = (photos || []).map(p => ({ photo_id: p.photo_id || p.photo_id, photo_path: p.photo_path || p, position: p.position || 0, is_primary: p.is_primary || false }));
    appendPhotosToGrid(normalized);
}

function appendPhotosToGrid(photos) {
    const grid = document.getElementById('photos-grid');
    photos.forEach((p, i) => {
        const cell = document.createElement('div');
        cell.className = 'photo-item';
        cell.draggable = true;
        cell.dataset.photoId = String(p.photo_id);
        const img = document.createElement('img');
        img.src = p.photo_path;
        img.alt = 'Zdjęcie artysty';
        cell.appendChild(img);
        const idx = document.createElement('span');
        idx.className = 'photo-index';
        idx.textContent = String(i + 1);
        cell.appendChild(idx);
        const remove = document.createElement('button');
        remove.className = 'photo-remove';
        remove.type = 'button';
        remove.textContent = '×';
        remove.addEventListener('click', () => deletePhoto(p.photo_id, cell));
        cell.appendChild(remove);
        grid.appendChild(cell);
    });
}

async function deletePhoto(photoId, cellEl) {
    const token = localStorage.getItem('authToken');
    if (!confirm('Na pewno usunąć to zdjęcie?')) return;
    try {
        const resp = await fetch(`/api/artists/photos/${photoId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        const data = await resp.json();
        if (!resp.ok) { alert(data.error || 'Błąd usuwania'); return; }
        if (cellEl && cellEl.parentNode) cellEl.parentNode.removeChild(cellEl);
    } catch (e) {
        alert('Błąd sieci podczas usuwania');
    }
}

async function handleFormSubmit(event) {
    event.preventDefault();
    
    // Walidacja formularza
    if (!validateForm()) {
        return;
    }
    
    try {
        showLoading(true);
        
        const userData = JSON.parse(localStorage.getItem('userData'));
        const authToken = localStorage.getItem('authToken');
        
        // Ustaw tekst dla zapisywania
        const spinner = document.getElementById('loading-spinner');
        const loadingText = spinner.querySelector('p');
        loadingText.textContent = 'Zapisywanie zmian...';
        
        // Przygotuj dane do wysłania
        const formData = prepareFormData();
        formData.user_id = userData.user_id;
        // Walidacja i ewentualna zmiana hasła po zapisie profilu
        const newPassword = document.getElementById('new_password').value.trim();
        const confirmNewPassword = document.getElementById('confirm_new_password').value.trim();
        if ((newPassword && !confirmNewPassword) || (!newPassword && confirmNewPassword)) {
            showMessage('Uzupełnij oba pola: Nowe hasło oraz Powtórz nowe hasło', 'error');
            return;
        }
        if (newPassword || confirmNewPassword) {
            if (newPassword.length < 8) {
                showMessage('Nowe hasło musi mieć co najmniej 8 znaków', 'error');
                return;
            }
            if (newPassword !== confirmNewPassword) {
                showMessage('Nowe hasła nie są identyczne', 'error');
                return;
            }
        }
        
        // Wyślij dane do API
        const response = await fetch('/api/artists/update', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showMessage('Profil został pomyślnie zaktualizowany!', 'success');
            // Jeśli było podane nowe hasło – zmień je teraz
            if (newPassword) {
                const passResp = await fetch('/api/users/update-password', {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        user_id: userData.user_id,
                        old_password: document.getElementById('password').value,
                        new_password: newPassword
                    })
                });
                const passData = await passResp.json();
                if (!passResp.ok) {
                    showMessage(passData.error || 'Nie udało się zmienić hasła', 'error');
                    return;
                }
            }
            // Opcjonalnie: przekieruj z powrotem do profilu po 2 sekundach
            setTimeout(() => {
                window.location.href = 'my_account_artist.html';
            }, 2000);
        } else {
            showMessage(result.error || 'Wystąpił błąd podczas aktualizacji profilu', 'error');
        }
    } catch (error) {
        console.error('Błąd podczas aktualizacji profilu:', error);
        showMessage('Wystąpił błąd podczas aktualizacji profilu', 'error');
    } finally {
        showLoading(false);
    }
}

function prepareFormData() {
    const formData = {
        password: document.getElementById('password').value,
        first_name: document.getElementById('first_name').value,
        last_name: document.getElementById('last_name').value,
        phone: document.getElementById('phone').value,
        residence: document.getElementById('residence').value,
        country: document.getElementById('country').value,
        artist_type: document.getElementById('artist_type').value,
        age: document.getElementById('age').value ? parseInt(document.getElementById('age').value) : undefined,
        height: document.getElementById('height').value ? parseInt(document.getElementById('height').value) : undefined,
        weight: document.getElementById('weight').value ? parseInt(document.getElementById('weight').value) : undefined,
        hip: document.getElementById('hip').value ? parseInt(document.getElementById('hip').value) : undefined,
        waist: document.getElementById('waist').value ? parseInt(document.getElementById('waist').value) : undefined,
        cage: document.getElementById('cage').value ? parseInt(document.getElementById('cage').value) : undefined,
        shoe_size: document.getElementById('shoe_size').value ? parseInt(document.getElementById('shoe_size').value) : undefined,
        clothes_size: document.getElementById('clothes_size').value ? parseInt(document.getElementById('clothes_size').value) : undefined,
        eyes_color: document.getElementById('eyes_color').value,
        hair_color: document.getElementById('hair_color').value,
        experience_info: document.getElementById('experience_info').value,
        bio: document.getElementById('bio').value,
        short_video: document.getElementById('short_video').value,
        photo_1: document.getElementById('photo_1').value,
        photo_2: document.getElementById('photo_2').value,
        photo_3: document.getElementById('photo_3').value,
        photo_4: document.getElementById('photo_4').value,
        photo_5: document.getElementById('photo_5').value
    };
    
    // Konwertuj online_reach na liczbę
    const onlineReach = document.getElementById('online_reach').value;
    if (onlineReach) {
        formData.online_reach = parseInt(onlineReach);
    }
    
    // Przygotuj social media links jako JSON
    const socialMedia = {};
    const instagram = document.getElementById('instagram').value.trim();
    const tiktok = document.getElementById('tiktok').value.trim();
    const facebook = document.getElementById('facebook').value.trim();
    const youtube = document.getElementById('youtube').value.trim();
    // twitter usunięty z formularza
    
    if (instagram) socialMedia.instagram = instagram;
    if (tiktok) socialMedia.tiktok = tiktok;
    if (facebook) socialMedia.facebook = facebook;
    if (youtube) socialMedia.youtube = youtube;
    // twitter usunięty z formularza
    
    if (Object.keys(socialMedia).length > 0) {
        formData.social_media_links = JSON.stringify(socialMedia);
    }
    
    return formData;
}

function validateForm() {
    let isValid = true;
    const errors = [];
    
    // Sprawdź wymagane pola
    const requiredFields = [
        { id: 'first_name', name: 'Imię' },
        { id: 'last_name', name: 'Nazwisko' },
        { id: 'artist_type', name: 'Typ artysty' },
        { id: 'password', name: 'Hasło' }
    ];
    
    requiredFields.forEach(field => {
        const element = document.getElementById(field.id);
        const value = element.value.trim();
        
        if (!value) {
            markFieldAsInvalid(element, `${field.name} jest wymagane`);
            errors.push(`${field.name} jest wymagane`);
            isValid = false;
        } else {
            markFieldAsValid(element);
        }
    });
    
    // Walidacja URL-i
    const urlFields = ['short_video', 'photo_1', 'photo_2', 'photo_3', 'photo_4', 'photo_5'];
    urlFields.forEach(fieldId => {
        const element = document.getElementById(fieldId);
        const value = element.value.trim();
        
        if (value && !isValidUrl(value)) {
            markFieldAsInvalid(element, 'Nieprawidłowy format URL');
            errors.push(`${fieldId} - nieprawidłowy format URL`);
            isValid = false;
        } else if (value) {
            markFieldAsValid(element);
        }
    });
    
    // Walidacja numeru telefonu
    const phoneElement = document.getElementById('phone');
    const phoneValue = phoneElement.value.trim();
    if (phoneValue && !isValidPhone(phoneValue)) {
        markFieldAsInvalid(phoneElement, 'Nieprawidłowy format numeru telefonu');
        errors.push('Nieprawidłowy format numeru telefonu');
        isValid = false;
    } else if (phoneValue) {
        markFieldAsValid(phoneElement);
    }
    
    // Walidacja zasięgu online
    const onlineReachElement = document.getElementById('online_reach');
    const onlineReachValue = onlineReachElement.value.trim();
    if (onlineReachValue && (isNaN(onlineReachValue) || parseInt(onlineReachValue) < 0)) {
        markFieldAsInvalid(onlineReachElement, 'Zasięg online musi być liczbą większą lub równą 0');
        errors.push('Zasięg online musi być liczbą większą lub równą 0');
        isValid = false;
    } else if (onlineReachValue) {
        markFieldAsValid(onlineReachElement);
    }
    
    if (!isValid) {
        showMessage('Sprawdź poprawność wprowadzonych danych:\n' + errors.join('\n'), 'error');
    }
    
    return isValid;
}

function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

function isValidPhone(phone) {
    // Podstawowa walidacja numeru telefonu (cyfry, spacje, myślniki, plus)
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{7,15}$/;
    return phoneRegex.test(phone);
}

function markFieldAsInvalid(element, message) {
    element.classList.remove('valid');
    element.classList.add('invalid');
    
    // Usuń poprzednie komunikaty błędów
    const existingError = element.parentNode.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Dodaj nowy komunikat błędu
    const errorElement = document.createElement('span');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    element.parentNode.appendChild(errorElement);
}

function markFieldAsValid(element) {
    element.classList.remove('invalid');
    element.classList.add('valid');
    
    // Usuń komunikat błędu
    const existingError = element.parentNode.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
}

function showMessage(message, type) {
    // Usuń poprzednie komunikaty
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    // Utwórz nowy komunikat
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.textContent = message;
    
    // Wstaw komunikat przed formularzem
    const form = document.getElementById('edit-profile-form');
    form.parentNode.insertBefore(messageElement, form);
    
    // Automatycznie usuń komunikat po 5 sekundach
    setTimeout(() => {
        if (messageElement.parentNode) {
            messageElement.remove();
        }
    }, 5000);
    
    // Przewiń do komunikatu
    messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function showLoading(show) {
    const spinner = document.getElementById('loading-spinner');
    if (show) {
        spinner.style.display = 'flex';
    } else {
        spinner.style.display = 'none';
    }
}

function showLoadingData(show) {
    const spinner = document.getElementById('loading-spinner');
    const loadingText = spinner.querySelector('p');
    
    if (show) {
        loadingText.textContent = 'Ładowanie danych...';
        spinner.style.display = 'flex';
    } else {
        spinner.style.display = 'none';
    }
}

// Dodaj nasłuchiwanie na zmiany w polach formularza w celu usunięcia stylów walidacji
document.addEventListener('DOMContentLoaded', function() {
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            this.classList.remove('invalid', 'valid');
            const errorMessage = this.parentNode.querySelector('.error-message');
            if (errorMessage) {
                errorMessage.remove();
            }
        });
    });
});
