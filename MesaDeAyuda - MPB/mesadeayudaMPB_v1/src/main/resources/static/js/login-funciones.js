/**
 * Archivo JavaScript para la página de login
 * Maneja la lógica para mostrar los toast modals
 */

$(document).ready(function() {
    // Verificar si hay parámetros en la URL
    const urlParams = new URLSearchParams(window.location.search);
    
    // Mostrar toast según los parámetros
    if (urlParams.get('registroExitoso') === 'true') {
        showToast('success');
    }
    
    if (urlParams.get('error') === '') {
        showToast('warning');
    }
    
    if (urlParams.get('logout') === '') {
        showToast('info');
    }
});

/**
 * Muestra un toast modal del tipo especificado
 * @param {string} type - Tipo de toast (error, success, warning, info)
 */
function showToast(type) {
    $(`#toast-${type}`).css('display', 'block');
    
    // Cierra automáticamente después de 5 segundos
    setTimeout(function() {
        closeToast(type);
    }, 80000);
}

/**
 * Cierra un toast modal del tipo especificado
 * @param {string} type - Tipo de toast (error, success, warning, info)
 */
function closeToast(type) {
    $(`#toast-${type}`).css('display', 'none');
}