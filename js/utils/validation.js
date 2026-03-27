// File: frontend/js/utils/validation.js

/**
 * Displays an error message for a given input element.
 * @param {HTMLElement} inputElement The input element that has an error.
 * @param {string} message The error message to display.
 */
export function displayError(inputElement, message) {
    const errorDivId = `error-${inputElement.name}`;
    const errorDiv = document.getElementById(errorDivId) || inputElement.closest('div').querySelector('.error-message');
    
    if (errorDiv) {
        errorDiv.innerText = message;
        errorDiv.classList.remove('hidden');
    }
    inputElement.classList.add('border-red-500');
}

/**
 * Clears an error message for a given input element.
 * @param {HTMLElement} inputElement The input element whose error is to be cleared.
 */
export function clearError(inputElement) {
    const errorDivId = `error-${inputElement.name}`;
    const errorDiv = document.getElementById(errorDivId) || inputElement.closest('div').querySelector('.error-message');

    if (errorDiv) {
        errorDiv.innerText = '';
        errorDiv.classList.add('hidden');
    }
    inputElement.classList.remove('border-red-500');
}

/**
 * Validates a form based on required fields and specific formats.
 * @param {HTMLFormElement} form The form element to validate.
 * @returns {boolean} True if the form is valid, false otherwise.
 */
export function validateForm(form) {
    let isValid = true;
    const requiredFields = form.querySelectorAll('[required]');

    requiredFields.forEach(input => {
        clearError(input);

        if (input.type === 'radio' && !form.querySelector(`input[name="${input.name}"]:checked`)) {
            const groupContainer = input.closest('div.flex, div.star-rating-group, div.gap-8');
            const groupErrorDiv = groupContainer.parentElement.querySelector('.error-message');
            if (groupErrorDiv) groupErrorDiv.innerText = 'Pertanyaan ini wajib diisi.';
            isValid = false;
        } else if (input.type === 'email' && !/\S+@\S+\.\S+/.test(input.value)) {
            displayError(input, 'Format email tidak valid.');
            isValid = false;
        } else if (input.type === 'tel' && !/^(08|628)\d{7,11}$/.test(input.value)) {
            displayError(input, 'Format nomor WhatsApp tidak valid (contoh: 0812...).');
            isValid = false;
        } else if (input.value.trim() === '') {
            displayError(input, 'Field ini wajib diisi.');
            isValid = false;
        }
    });

    return isValid;
}