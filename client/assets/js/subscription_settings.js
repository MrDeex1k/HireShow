document.addEventListener('DOMContentLoaded', function() {
    // Sprawdź czy użytkownik jest zalogowany
    const userData = localStorage.getItem('userData');
    const authToken = localStorage.getItem('authToken');
    
    if (!userData || !authToken) {
        window.location.href = 'login.html';
        return;
    }
    
    const user = JSON.parse(userData);
    
    // Sprawdź czy to faktycznie klient
    if (user.role !== 'client') {
        window.location.href = 'login.html';
        return;
    }

    // Załaduj informacje o aktualnej subskrypcji
    loadCurrentSubscription(user);
    
    // Obsługa wylogowania
    document.getElementById('logout-btn').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        window.location.href = 'login.html';
    });

    // Delegacja wyboru planów
    document.querySelectorAll('.select-plan-btn[data-plan]').forEach(btn => {
        btn.addEventListener('click', () => selectPlan(btn.getAttribute('data-plan')));
    });
});

function loadCurrentSubscription(user) {
    const currentPlan = user.subscription_type || 'free';
    const planNames = {
        'free': 'Free',
        'standard': 'Standard',
        'premium': 'Premium',
        'enterprise': 'Enterprise'
    };

    const planDescriptions = {
        'free': 'Plan darmowy z podstawowymi funkcjami',
        'standard': 'Plan standardowy z rozszerzonymi możliwościami',
        'premium': 'Plan premium z pełnym dostępem',
        'enterprise': 'Plan enterprise dla dużych organizacji'
    };

    document.getElementById('current-plan-name').textContent = planNames[currentPlan];
    document.getElementById('current-plan-description').textContent = planDescriptions[currentPlan];

    // Aktualizuj przyciski planów
    updatePlanButtons(currentPlan);

    // Pokaż sekcje płatności jeśli plan jest płatny
    if (currentPlan !== 'free') {
        document.getElementById('billing-section').style.display = 'block';
        document.getElementById('payment-methods').style.display = 'block';
        document.getElementById('cancel-subscription').style.display = 'inline-block';
        document.getElementById('next-billing').style.display = 'inline';
        document.getElementById('next-billing-date').textContent = getNextBillingDate();
    }
}

function updatePlanButtons(currentPlan) {
    const plans = document.querySelectorAll('.plan-card');
    plans.forEach(plan => {
        const planType = plan.dataset.plan;
        const button = plan.querySelector('.btn');
        
        if (planType === currentPlan) {
            button.textContent = 'Aktualny plan';
            button.classList.remove('btn-primary');
            button.classList.add('btn-secondary');
            button.disabled = true;
        } else {
            button.disabled = false;
            button.classList.remove('btn-secondary');
            button.classList.add('btn-primary');
            
            if (planType === 'enterprise') {
                button.textContent = 'Skontaktuj się';
            } else {
                button.textContent = `Wybierz ${planType.charAt(0).toUpperCase() + planType.slice(1)}`;
            }
        }
    });
}

function selectPlan(planType) {
    const plans = {
        'basic': {
            name: 'Plan Basic',
            price: '19 zł/miesiąc',
            features: ['Wszystko z planu darmowego', '20 zapytań miesięcznie', 'Dostęp do Social Mediów artystów']
        },
        'premium': {
            name: 'Plan Premium', 
            price: '39 zł/miesiąc',
            features: ['Wszystko z planu Basic', 'Dostęp do profili Premium', 'Bezpośredni kontakt z artystami']
        }
    };

    const plan = plans[planType];
    if (plan && confirm(`Czy na pewno chcesz zmienić plan na ${plan.name} (${plan.price})?`)) {
        // Tutaj będzie logika zmiany planu
        console.log(`Zmiana planu na: ${planType}`);
        
        // Tymczasowo - pokaż komunikat
        alert(`Plan zostanie zmieniony na ${plan.name}. Przekierowanie do płatności...`);
        
        // Tutaj można dodać przekierowanie do systemu płatności
    }
}

function contactSales() {
    alert('Skontaktuj się z nami pod adresem: enterprise@hireshow.pl lub telefon: +48 123 456 789');
}

function getNextBillingDate() {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return nextMonth.toLocaleDateString('pl-PL');
}

// Obsługa anulowania subskrypcji
document.getElementById('cancel-subscription').addEventListener('click', function() {
    if (confirm('Czy na pewno chcesz anulować subskrypcję? Utracisz dostęp do funkcji premium.')) {
        // Tutaj będzie logika anulowania subskrypcji
        console.log('Anulowanie subskrypcji');
        alert('Subskrypcja została anulowana. Funkcje premium będą dostępne do końca okresu rozliczeniowego.');
    }
});


