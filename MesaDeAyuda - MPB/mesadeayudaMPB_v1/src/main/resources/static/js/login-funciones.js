/**
 * Archivo JavaScript unificado para las páginas de login y recordar contraseña
 * Maneja la lógica para mostrar los toast modals
 */

$(document).ready(function() {
    const urlParams = new URLSearchParams(window.location.search);
    const currentPath = window.location.pathname;
    
    if (currentPath === '/login') {
        handleLoginPageModals(urlParams);
    }
    
    if (currentPath === '/registro/recordar') {
        handleRecordarPageModals(urlParams);
    }
});

/**
 * Maneja los modales para la página de login
 * @param {URLSearchParams} urlParams - Parámetros de la URL
 */
function handleLoginPageModals(urlParams) {
    if (urlParams.get('registroExitoso') === 'true') {
        showToast('success');
    }
    
    if (urlParams.get('error') === '') {
        showToast('warning');
    }
    
    if (urlParams.get('logout') === '') {
        showToast('info');
    }
    
    if (urlParams.get('correoEnviado') === 'true') {
        showToastRecoverySuccess();
    }
    
    if (urlParams.get('contrasenaActualizada') === 'true') {
        showToastPasswordUpdated();
    }
    
    if (urlParams.get('error') === 'token_invalido') {
        showToastTokenError('El enlace de recuperación no es válido o ha expirado');
    }
    
    if (urlParams.get('error') === 'token_expirado') {
        showToastTokenError('El enlace de recuperación ha expirado. Por favor, solicita uno nuevo');
    }
}

/**
 * Maneja los modales para la página de recordar contraseña
 * @param {URLSearchParams} urlParams - Parámetros de la URL
 */
function handleRecordarPageModals(urlParams) {
    if (urlParams.get('error') === 'correo_no_registrado') {
        showToast('warning');
    }
    
    if (urlParams.get('error') === 'server_error') {
        showToast('error');
    }
    
    if (urlParams.get('error') === 'true') {
        showToast('error');
    }
}

/**
 * Muestra un toast modal del tipo especificado
 * @param {string} type - Tipo de toast (error, success, warning, info)
 */
function showToast(type) {
    const toastElement = $(`#toast-${type}`);
    if (toastElement.length) {
        toastElement.css('display', 'block');
        
        setTimeout(function() {
            closeToast(type);
        }, 50000000);
    }
}

/**
 * Muestra el toast de éxito específico para recuperación de contraseña
 */
function showToastRecoverySuccess() {
    const toastElement = $('#toast-recovery-success');
    if (toastElement.length) {
        toastElement.css('display', 'block');
        
        setTimeout(function() {
            closeToast('recovery-success');
        }, 7000);
    }
}

/**
 * Cierra un toast modal del tipo especificado
 * @param {string} type - Tipo de toast
 */
function closeToast(type) {
    $(`#toast-${type}`).css('display', 'none');
}