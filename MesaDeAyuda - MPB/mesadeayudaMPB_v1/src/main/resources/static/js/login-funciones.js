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

function showToast(type) {
    const toastElement = $(`#toast-${type}`);
    if (toastElement.length) {
        toastElement.css('display', 'block');
        
        setTimeout(function() {
            closeToast(type);
        }, 50000000);
    }
}

function showToastRecoverySuccess() {
    const toastElement = $('#toast-recovery-success');
    if (toastElement.length) {
        toastElement.css('display', 'block');
        
        setTimeout(function() {
            closeToast('recovery-success');
        }, 7000);
    }
}

function closeToast(type) {
    $(`#toast-${type}`).css('display', 'none');
}