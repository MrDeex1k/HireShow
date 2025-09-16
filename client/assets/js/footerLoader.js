async function loadFooter() {
    try {
        const currentPath = window.location.pathname;
        let footerPath;
        if (currentPath.includes('/views/')) {
            footerPath = '../components/footer.html';
        } else {
            footerPath = 'components/footer.html';
        }
        
        const response = await fetch(footerPath);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const footerHTML = await response.text();
        const footerContainer = document.getElementById('footer-container');
        
        if (footerContainer) {
            footerContainer.innerHTML = footerHTML;
            
            loadFooterCSS();
        } else {
            console.error('Footer container not found');
        }
    } catch (error) {
        console.error('Error loading footer:', error);
        
        const footerContainer = document.getElementById('footer-container');
        if (footerContainer) {
            footerContainer.innerHTML = `
                <footer class="footer">
                    <div class="footer-content">
                        <div class="footer-section">
                            <h3>Hire Show</h3>
                            <p>Platforma łącząca artystów z klientami</p>
                        </div>
                    </div>
                    <div class="footer-bottom">
                        <p>&copy; 2025 Hire Show. Wszystkie prawa zastrzeżone.</p>
                    </div>
                </footer>
            `;
            loadFooterCSS();
        }
    }
}

function loadFooterCSS() {
    if (document.querySelector('link[href*="footer.css"]')) {
        return;
    }
    
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    
    const currentPath = window.location.pathname;
    if (currentPath.includes('/views/')) {
        link.href = '../assets/css/footer.css';
    } else {
        link.href = 'assets/css/footer.css';
    }
    
    document.head.appendChild(link);
}

document.addEventListener('DOMContentLoaded', function() {
    loadFooter();
});
