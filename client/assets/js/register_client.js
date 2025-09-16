document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('client-form');
    const messageContainer = document.getElementById('message-container');
    const submitBtn = form.querySelector('.submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');

    // Funkcja wyświetlania komunikatów
    function showMessage(message, type = 'info') {
        messageContainer.innerHTML = `
            <div class="message ${type}">
                <span class="message-text">${message}</span>
                <button class="message-close" onclick="this.parentElement.parentElement.style.display='none'">×</button>
            </div>
        `;
        messageContainer.style.display = 'block';
        
        if (type === 'success') {
            setTimeout(() => {
                messageContainer.style.display = 'none';
            }, 5000);
        }
    }

    // Walidacja hasła
    function validatePassword() {
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm_password').value;
        
        if (password.length < 8) {
            showMessage('Hasło musi mieć minimum 8 znaków', 'error');
            return false;
        }
        
        if (password !== confirmPassword) {
            showMessage('Hasła nie są identyczne', 'error');
            return false;
        }
        
        return true;
    }

    // Walidacja NIP (jeśli podany) — tylko sprawdzenie, czy jest dokładnie 10 cyfr
    function validateNIP(nip) {
        if (!nip) return true; // NIP jest opcjonalny
        const digitsOnly = nip.replace(/\D/g, '');
        return digitsOnly.length === 10;
    }

    // Walidacja email
    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Obsługa formularza
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Pokaż loader
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline';
        submitBtn.disabled = true;
        
        try {
            // Pobierz dane z formularza
            const formData = new FormData(form);
            const email = formData.get('email');
            const password = formData.get('password');
            const clientName = formData.get('client_name');
            const clientNip = formData.get('client_nip');
            const phone = formData.get('phone');
            // Rejestracja nie zbiera już typu subskrypcji
            const termsAccepted = formData.get('terms');
            
            // Walidacja po stronie klienta
            if (!validateEmail(email)) {
                showMessage('Podaj prawidłowy adres email', 'error');
                return;
            }
            
            if (!validatePassword()) {
                return;
            }
            
            if (!clientName.trim()) {
                showMessage('Nazwa firmy jest wymagana', 'error');
                return;
            }
            
            if (clientNip && !validateNIP(clientNip)) {
                showMessage('Podany NIP jest nieprawidłowy', 'error');
                return;
            }
            
            if (!termsAccepted) {
                showMessage('Musisz zaakceptować regulamin i politykę prywatności', 'error');
                return;
            }
            
            // Rejestracja transakcyjna: user + client w 1 żądaniu (używamy istniejącego endpointu /createnew)
            console.log('Rejestracja klienta (transakcyjna)...');
            const clientResponse = await fetch('http://localhost:6677/api/clients/createnew', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password,
                    client_name: clientName.trim(),
                    client_nip: clientNip ? clientNip.replace(/\D/g, '').slice(0, 10) : undefined,
                    phone: phone && phone.trim() ? phone.trim() : undefined
                })
            });
            const clientResult = await clientResponse.json();

            if (!clientResponse.ok) {
                throw new Error(clientResult.error || 'Błąd podczas rejestracji klienta');
            }
            
            console.log('Klient zarejestrowany:', clientResult);
            
            // Sukces!
            showMessage(`
                <strong>Rejestracja zakończona pomyślnie!</strong><br>
                Twoje konto zostało utworzone i oczekuje na zatwierdzenie przez administratora.<br>
                Po akceptacji zaloguj się i przejdź do "Zarządzaj Subskrypcją", aby wybrać plan.
            `, 'success');
            
            // Wyczyść formularz
            form.reset();
            
            // Przekieruj po 3 sekundach
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 5000);
            
        } catch (error) {
            console.error('Błąd rejestracji:', error);
            showMessage(error.message || 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie.', 'error');
        } finally {
            // Ukryj loader
            btnText.style.display = 'inline';
            btnLoader.style.display = 'none';
            submitBtn.disabled = false;
        }
    });
    
    // Walidacja w czasie rzeczywistym
    document.getElementById('confirm_password').addEventListener('blur', function() {
        const password = document.getElementById('password').value;
        const confirmPassword = this.value;
        
        if (confirmPassword && password !== confirmPassword) {
            this.setCustomValidity('Hasła nie są identyczne');
            this.reportValidity();
        } else {
            this.setCustomValidity('');
        }
    });
    
    // Walidacja NIP w czasie rzeczywistym
    document.getElementById('client_nip').addEventListener('blur', function() {
        const nip = this.value;
        if (nip && !validateNIP(nip)) {
            this.setCustomValidity('Nieprawidłowy NIP');
            this.reportValidity();
        } else {
            this.setCustomValidity('');
        }
    });
    
    // Wpisywanie NIP — tylko cyfry, bez myślników, maksymalnie 10 znaków
    document.getElementById('client_nip').addEventListener('input', function() {
        let value = this.value.replace(/\D/g, '');
        if (value.length > 10) {
            value = value.substring(0, 10);
        }
        this.value = value;
    });
});
