// File: frontend/js/router.js
import { ROUTES } from './constants.js';
import { renderLandingPage } from './pages/LandingPage.js';
import { renderAdminPage } from './pages/AdminPage.js';
import { renderDisplayPage, destroyDisplayPage } from './pages/DisplayPage.js';
import { renderFeedbackPage } from './pages/FeedbackPage.js';

export function initRouter() {
    const path = window.location.hash;
    const appContainer = document.getElementById('app');
    appContainer.innerHTML = '';

    // Cleanup function from previous page, if it exists
    if (window.currentPageCleanup) {
        window.currentPageCleanup();
        window.currentPageCleanup = null;
    }

    if (path.includes(ROUTES.ADMIN)) {
        renderAdminPage(appContainer);
    } else if (path.includes(ROUTES.DISPLAY)) {
        renderDisplayPage(appContainer);
        window.currentPageCleanup = destroyDisplayPage; // Set cleanup for this page
    } else if (path.includes(ROUTES.FEEDBACK)) {
        renderFeedbackPage(appContainer);
    } else {
        renderLandingPage(appContainer);
    }
}

window.addEventListener('hashchange', initRouter);