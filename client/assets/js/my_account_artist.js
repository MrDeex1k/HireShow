
document.addEventListener('DOMContentLoaded', function() {
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
    
    // Wyświetl imię użytkownika jeśli dostępne
    if (user.first_name) {
        document.getElementById('user-name').textContent = user.first_name;
    } else if (user.email) {
        document.getElementById('user-name').textContent = user.email.split('@')[0];
    }
    
    // Obsługa wylogowania
    document.getElementById('logout-btn').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        window.location.href = 'login.html';
    });
});


