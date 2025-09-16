document.addEventListener('DOMContentLoaded', function() {
    const userRegistrationSection = document.getElementById('user-registration-section');
    const artistTypeSelection = document.getElementById('artist-type-selection');
    const userRegistrationForm = document.getElementById('user-registration-form');
    const userErrorMessage = document.getElementById('user-error-message');

    // Funkcja do wyświetlania komunikatów błędów
    function showError(message) {
        userErrorMessage.textContent = message;
        userErrorMessage.style.display = 'block';
        userErrorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function hideError() {
        userErrorMessage.style.display = 'none';
    }

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

    // Walidacja hasła
    function validatePassword(password, confirmPassword) {
        if (password !== confirmPassword) {
            showError('Hasła nie są identyczne!');
            return false;
        }
        
        if (password.length < 6) {
            showError('Hasło musi mieć co najmniej 6 znaków!');
            return false;
        }
        
        return true;
    }

    // Obsługa wysłania formularza rejestracji użytkownika
    userRegistrationForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        hideError();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        // Podstawowa walidacja
        if (!email || !password || !confirmPassword) {
            showError('Wszystkie pola są wymagane!');
            return;
        }

        // Walidacja formatu email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showError('Wprowadź prawidłowy adres email!');
            return;
        }

        // Walidacja hasła
        if (!validatePassword(password, confirmPassword)) {
            return;
        }

        try {
            // Dezaktywuj przycisk podczas rejestracji
            const submitBtn = userRegistrationForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Rejestrowanie...';

            // Zapisz dane tymczasowo i przejdź do wyboru typu artysty
            localStorage.setItem('temp_user_email', email);
            localStorage.setItem('temp_user_password', password);
            userRegistrationSection.style.display = 'none';
            artistTypeSelection.style.display = 'block';

        } catch (error) {
            // Błąd został już obsłużony w funkcji registerUser
        } finally {
            // Przywróć przycisk
            const submitBtn = userRegistrationForm.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });

    // Obsługa wyboru typu artysty
    const artistTypeButtons = document.querySelectorAll('.artist-type-btn');
    artistTypeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const artistType = this.getAttribute('data-type');
            
            // Zapisz typ artysty w localStorage
            localStorage.setItem('temp_artist_type', artistType);
            
            // Przejdź do formularza szczegółów artysty
            window.location.href = 'register_form_artist.html';
        });
    });

    // Ukryj błąd gdy użytkownik zaczyna pisać
    document.getElementById('email').addEventListener('input', hideError);
    document.getElementById('password').addEventListener('input', hideError);
    document.getElementById('confirm-password').addEventListener('input', hideError);

    // Sprawdź czy użytkownik wrócił z poprzedniej strony
    const tempUserEmail = localStorage.getItem('temp_user_email');
    const tempArtistType = localStorage.getItem('temp_artist_type');
    
    if (tempUserEmail && !tempArtistType) {
        // Użytkownik wrócił po rejestracji użytkownika, ale przed wyborem typu
        userRegistrationSection.style.display = 'none';
        artistTypeSelection.style.display = 'block';
    }
});
