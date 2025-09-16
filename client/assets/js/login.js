document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Funkcja do ukrywania komunikatów błędów
    function hideError() {
        errorMessage.style.display = 'none';
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

    // Funkcja logowania użytkownika
    async function loginUser(email, password) {
        const apiBaseUrl = getApiBaseUrl();
        
        try {
            const response = await fetch(`${apiBaseUrl}/users/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    email: email, 
                    password: password 
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Sukces - zapisz token i dane użytkownika
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userData', JSON.stringify(data.user));
                
                // Przekieruj na podstawie roli użytkownika
                switch (data.user.role) {
                    case 'artist':
                        window.location.href = 'my_account_artist.html';
                        break;
                    case 'client':
                        window.location.href = 'my_account_client.html';
                        break;
                    case 'admin':
                        window.location.href = 'admin_panel.html';
                        break;
                    default:
                        // Fallback na stronę główną dla nieznanych ról
                        window.location.href = '../index.html';
                }
                return data;
            } else {
                // Obsługa błędów na podstawie statusu HTTP
                throw { status: response.status, data: data };
            }
        } catch (error) {
            if (error.status) {
                // Błędy HTTP z serwera
                switch (error.status) {
                    case 400:
                        showError('WPROWADŹ DANE!');
                        break;
                    case 401:
                        showError('Dane nieprawidłowe :(');
                        break;
                    case 403:
                        // Status 403 może zawierać dane użytkownika z informacją o statusie zatwierdzenia
                        if (error.data && error.data.user && error.data.user.is_approved) {
                            if (error.data.user.is_approved === 'WAITING') {
                                window.location.href = 'waiting_approval.html';
                                return;
                            } else if (error.data.user.is_approved === 'NO') {
                                window.location.href = 'denied_approval.html';
                                return;
                            }
                        }
                        // Fallback jeśli nie ma danych użytkownika
                        showError('Konto nie zostało jeszcze zatwierdzone lub zostało odrzucone.');
                        break;
                    case 404:
                        // Przekieruj na stronę 404
                        window.location.href = '404.html';
                        break;
                    default:
                        showError('Wystąpił błąd podczas logowania. Spróbuj ponownie.');
                }
            } else {
                // Błędy sieciowe lub inne
                console.error('Błąd logowania:', error);
                showError('Problemy z połączeniem. Sprawdź połączenie internetowe.');
            }
            throw error;
        }
    }

    // Obsługa wysłania formularza
    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        hideError();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        // Podstawowa walidacja
        if (!email || !password) {
            showError('WPROWADŹ DANE!');
            return;
        }

        // Walidacja formatu email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showError('Wprowadź prawidłowy adres email!');
            return;
        }

        try {
            // Dezaktywuj przycisk podczas logowania
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Logowanie...';

            await loginUser(email, password);

        } catch (error) {
            // Błąd został już obsłużony w funkcji loginUser
        } finally {
            // Przywróć przycisk
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Zaloguj się';
        }
    });

    // Ukryj błąd gdy użytkownik zaczyna pisać
    document.getElementById('email').addEventListener('input', hideError);
    document.getElementById('password').addEventListener('input', hideError);
});
