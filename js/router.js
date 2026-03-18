// File: frontend/js/router.js
import { ROUTES } from './constants.js';
import { renderLandingPage } from './pages/LandingPage.js';
import { renderAdminPage } from './pages/AdminPage.js';
import { renderDisplayPage } from './pages/DisplayPage.js'; // Import Halaman Baru

export function initRouter() {
    const path = window.location.hash;
    const appContainer = document.getElementById('app');
    appContainer.innerHTML = '';

    if (path.includes(ROUTES.ADMIN)) {
        renderAdminPage(appContainer);
    } else if (path.includes(ROUTES.DISPLAY)) {
        renderDisplayPage(appContainer); // Panggil Halaman Display
    } else {
        renderLandingPage(appContainer);
    }
}

window.addEventListener('hashchange', initRouter);