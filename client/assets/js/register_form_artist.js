document.addEventListener('DOMContentLoaded', function() {
    const artistForm = document.getElementById('artist-form');
    const artistErrorMessage = document.getElementById('artist-error-message');
    const formTitle = document.getElementById('form-title');
    const pickPhotosBtn = document.getElementById('pick-photos-btn');
    const photosInput = document.getElementById('photos-input');
    const photosGrid = document.getElementById('photos-grid');
    const photosError = document.getElementById('photos-error');

    // Sprawdź dane w localStorage (nowy flow dopuszcza brak temp_user_id)
    const tempUserId = localStorage.getItem('temp_user_id');
    const tempArtistType = localStorage.getItem('temp_artist_type');
    const tempUserEmail = localStorage.getItem('temp_user_email');
    const tempUserPassword = localStorage.getItem('temp_user_password');
    if (!tempArtistType) {
        alert('Brak wybranego typu artysty. Wróć do wyboru.');
        window.location.href = 'register_artist_choose.html';
        return;
    }

    // Ustaw tytuł formularza na podstawie wybranego typu artysty
    const artistTypeNames = {
        'influencer': 'INFLUENCER',
        'actor': 'ACTOR',
        'model': 'MODEL'
    };
    formTitle.textContent = `Formularz Artysty - ${artistTypeNames[tempArtistType] || tempArtistType.toUpperCase()}`;

    // Funkcja do wyświetlania komunikatów błędów
    function showError(message) {
        artistErrorMessage.textContent = message;
        artistErrorMessage.style.display = 'block';
        artistErrorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Funkcja do ukrywania komunikatów błędów
    function hideError() {
        artistErrorMessage.style.display = 'none';
    }

    function showPhotosError(message) {
        if (!photosError) return;
        photosError.textContent = message;
        photosError.style.display = 'block';
        photosError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    function hidePhotosError() { if (photosError) photosError.style.display = 'none'; }

    // Funkcja do automatycznego wykrywania protokołu API
    function getApiBaseUrl() {
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        
        // W środowisku deweloperskim używamy localhost:6677
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return `${protocol}//localhost:6677/api`;
        }
        
        // W produkcji używamy tej samej domeny co frontend
        return `${protocol}//${hostname}/api`;
    }

    // Funkcja do stworzenia linków social media w formacie JSON
    function createSocialMediaLinks() {
        const socialLinks = {};
        
        const instagram = document.getElementById('instagram').value.trim();
        const tiktok = document.getElementById('tiktok').value.trim();
        const facebook = document.getElementById('facebook').value.trim();
        const youtube = document.getElementById('youtube').value.trim();

        if (instagram) socialLinks.instagram = instagram;
        if (tiktok) socialLinks.tiktok = tiktok;
        if (facebook) socialLinks.facebook = facebook;
        if (youtube) socialLinks.youtube = youtube;

        return Object.keys(socialLinks).length > 0 ? JSON.stringify(socialLinks) : null;
    }

    // Zarządzanie wybranymi zdjęciami
    const selectedPhotos = [];

    function refreshPhotosGrid() {
        if (!photosGrid) return;
        photosGrid.innerHTML = '';
        selectedPhotos.forEach((item, index) => {
            const cell = document.createElement('div');
            cell.className = 'photo-item';
            cell.draggable = true;
            cell.dataset.index = String(index);
            const img = document.createElement('img');
            img.src = item.previewUrl;
            img.alt = `Zdjęcie ${index + 1}`;
            cell.appendChild(img);
            const idx = document.createElement('span');
            idx.className = 'photo-index';
            idx.textContent = String(index + 1);
            cell.appendChild(idx);
            const removeBtn = document.createElement('button');
            removeBtn.className = 'photo-remove';
            removeBtn.type = 'button';
            removeBtn.textContent = '×';
            removeBtn.addEventListener('click', () => {
                URL.revokeObjectURL(item.previewUrl);
                selectedPhotos.splice(index, 1);
                refreshPhotosGrid();
            });
            cell.appendChild(removeBtn);
            cell.addEventListener('dragstart', (e) => {
                cell.classList.add('dragging');
                e.dataTransfer.setData('text/plain', String(index));
            });
            cell.addEventListener('dragend', () => {
                cell.classList.remove('dragging');
            });
            cell.addEventListener('dragover', (e) => { e.preventDefault(); });
            cell.addEventListener('drop', (e) => {
                e.preventDefault();
                const from = parseInt(e.dataTransfer.getData('text/plain'), 10);
                const to = index;
                if (!Number.isNaN(from) && from !== to) {
                    const [moved] = selectedPhotos.splice(from, 1);
                    selectedPhotos.splice(to, 0, moved);
                    refreshPhotosGrid();
                }
            });
            photosGrid.appendChild(cell);
        });
    }

    if (pickPhotosBtn && photosInput) {
        pickPhotosBtn.addEventListener('click', () => photosInput.click());
        photosInput.addEventListener('change', () => {
            hidePhotosError();
            const files = Array.from(photosInput.files || []);
            for (const file of files) {
                if (!['image/jpeg', 'image/png'].includes(file.type)) {
                    showPhotosError('Dozwolone są tylko pliki JPG/PNG');
                    continue;
                }
                if (selectedPhotos.length >= 5) {
                    showPhotosError('Możesz dodać maksymalnie 5 zdjęć');
                    break;
                }
                selectedPhotos.push({ file, previewUrl: URL.createObjectURL(file) });
            }
            photosInput.value = '';
            refreshPhotosGrid();
        });
    }

    // Funkcja rejestracji artysty – bez zdjęć (upload zdjęć po zalogowaniu z JWT)
    async function registerArtist(artistData) {
        const apiBaseUrl = getApiBaseUrl();
        
        try {
            let response;
            if (!tempUserId && tempUserEmail && tempUserPassword) {
                response = await fetch(`${apiBaseUrl}/artists/createnew`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: tempUserEmail,
                        password: tempUserPassword,
                        artist_type: artistData.artist_type,
                        first_name: artistData.first_name,
                        last_name: artistData.last_name,
                        phone: artistData.phone,
                        residence: artistData.residence,
                        country: artistData.country,
                        experience_info: artistData.experience_info,
                        // opcjonalne pola
                        age: artistData.age,
                        height: artistData.height,
                        weight: artistData.weight,
                        hip: artistData.hip,
                        waist: artistData.waist,
                        cage: artistData.cage,
                        shoe_size: artistData.shoe_size,
                        clothes_size: artistData.clothes_size,
                        eyes_color: artistData.eyes_color,
                        hair_color: artistData.hair_color,
                        social_media_links: artistData.social_media_links,
                        online_reach: artistData.online_reach,
                        bio: artistData.bio,
                        short_video: artistData.short_video,
                    })
                });
            } else {
                response = await fetch(`${apiBaseUrl}/artists/createnew`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(artistData)
                });
            }

            const data = await response.json();

            if (response.ok) {
                // Po utworzeniu artysty – jeśli wybrano zdjęcia, doślij je teraz bez JWT
                const createdArtistId = data.artistId || data.artist_id;
                if (createdArtistId && selectedPhotos.length > 0) {
                    const order = selectedPhotos.map((_, i) => i).join(',');
                    const fd = new FormData();
                    fd.append('artist_id', String(createdArtistId));
                    fd.append('photo_order', order);
                    selectedPhotos.forEach(({ file }) => fd.append('photos', file));
                    const uploadResp = await fetch(`${apiBaseUrl}/artists/photos/registration`, {
                        method: 'POST',
                        body: fd,
                    });
                    const uploadData = await uploadResp.json();
                    if (!uploadResp.ok) {
                        throw { status: uploadResp.status, data: uploadData };
                    }
                }

                localStorage.removeItem('temp_user_id');
                localStorage.removeItem('temp_artist_type');
                localStorage.removeItem('temp_user_email');
                localStorage.removeItem('temp_user_password');
                alert('Rejestracja zakończona! Jeśli dodałeś zdjęcia, konto trafiło do weryfikacji.');
                window.location.href = 'waiting_approval.html';
                return data;
            } else {
                throw { status: response.status, data: data };
            }
        } catch (error) {
            if (error.status) {
                // Błędy HTTP z serwera
                switch (error.status) {
                    case 400:
                        showError('Błędne dane artysty. Sprawdź wymagane pola.');
                        break;
                    case 404:
                        showError('Nie znaleziono użytkownika. Rozpocznij rejestrację od nowa.');
                        // Wyczyść localStorage i przekieruj
                        localStorage.removeItem('temp_user_id');
                        localStorage.removeItem('temp_artist_type');
                        localStorage.removeItem('temp_user_email');
                        localStorage.removeItem('temp_user_password');
                        setTimeout(() => {
                            window.location.href = 'register_artist_choose.html';
                        }, 3000);
                        break;
                    case 409:
                        showError('Artysta z tym użytkownikiem już istnieje.');
                        break;
                    case 500:
                        showError('Błąd serwera. Spróbuj ponownie później.');
                        break;
                    default:
                        showError('Wystąpił błąd podczas rejestracji artysty. Spróbuj ponownie.');
                }
            } else {
                // Błędy sieciowe lub inne
                console.error('Błąd rejestracji artysty:', error);
                showError('Problemy z połączeniem. Sprawdź połączenie internetowe.');
            }
            throw error;
        }
    }

    // Obsługa wysłania formularza
    artistForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        hideError();

        // Pobierz dane z formularza (nie mylić z FormData do requestu)
        const formData = new FormData(artistForm);
        
        // Przygotuj dane artysty - wymagane pola (przeglądarka zapewnia że nie są puste)
        const artistData = {
            user_id: tempUserId ? parseInt(tempUserId) : undefined,
            first_name: formData.get('first_name').trim(),
            last_name: formData.get('last_name').trim(),
            phone: formData.get('phone').trim(),
            residence: formData.get('residence').trim(),
            country: formData.get('country').trim(),
            artist_type: tempArtistType
        };

        // Dodaj opcjonalne pola tylko jeśli nie są puste
        const age = formData.get('age');
        const height = formData.get('height');
        const weight = formData.get('weight');
        const hip = formData.get('hip');
        const waist = formData.get('waist');
        const cage = formData.get('cage');
        const shoe_size = formData.get('shoe_size');
        const clothes_size = formData.get('clothes_size');
        const eyes_color = document.getElementById('eyes_color') ? document.getElementById('eyes_color').value.trim() : '';
        const hair_color = document.getElementById('hair_color') ? document.getElementById('hair_color').value.trim() : '';

        if (age) artistData.age = parseInt(age);
        if (height) artistData.height = parseInt(height);
        if (weight) artistData.weight = parseInt(weight);
        if (hip) artistData.hip = parseInt(hip);
        if (waist) artistData.waist = parseInt(waist);
        if (cage) artistData.cage = parseInt(cage);
        if (shoe_size) artistData.shoe_size = parseInt(shoe_size);
        if (clothes_size) artistData.clothes_size = parseInt(clothes_size);
        if (eyes_color) artistData.eyes_color = eyes_color;
        if (hair_color) artistData.hair_color = hair_color;

        const experienceInfo = formData.get('experience_info')?.trim();
        if (!experienceInfo) {
            showError('Pole experience_info jest wymagane.');
            return;
        }
        if (experienceInfo.length > 255) {
            showError('experience_info nie może mieć więcej niż 255 znaków.');
            return;
        }
        artistData.experience_info = experienceInfo;

        const socialLinks = createSocialMediaLinks();
        if (socialLinks) artistData.social_media_links = socialLinks;

        const onlineReach = parseInt(formData.get('online_reach'));
        if (onlineReach && onlineReach > 0) artistData.online_reach = onlineReach;

        const bioElem = document.getElementById('bio');
        const bio = bioElem ? bioElem.value.trim() : '';
        if (bio) artistData.bio = bio;

        const shortVideoElem = document.getElementById('short_video');
        const shortVideo = shortVideoElem ? shortVideoElem.value.trim() : '';
        if (shortVideo) artistData.short_video = shortVideo;

        try {
            // Dezaktywuj przycisk podczas rejestracji
            const submitBtn = artistForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Rejestrowanie...';

            await registerArtist(artistData);

        } catch (error) {
            // Błąd został już obsłużony w funkcji registerArtist
        } finally {
            // Przywróć przycisk
            const submitBtn = artistForm.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });

    // Ukryj błąd gdy użytkownik zaczyna pisać w wymaganych polach
    document.getElementById('first_name').addEventListener('input', hideError);
    document.getElementById('last_name').addEventListener('input', hideError);
    document.getElementById('phone').addEventListener('input', hideError);
    document.getElementById('residence').addEventListener('input', hideError);
    document.getElementById('country').addEventListener('input', hideError);
});
