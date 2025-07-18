/**
 * Maneja la visualización del popover de contraseña
 */
function setupPasswordPopover() {
    const passwordInfoIcon = document.querySelector('.password-info-icon');
    const passwordPopover = document.querySelector('.password-popover');

    if (passwordInfoIcon && passwordPopover) {
        passwordInfoIcon.addEventListener('mouseenter', function () {
            passwordPopover.style.display = 'block';
        });

        passwordInfoIcon.addEventListener('mouseleave', function () {
            passwordPopover.style.display = 'none';
        });
    }
}

/**
 * Muestra el modal de confirmación de envío de correo
 */
function showEmailSentModal() {
    const modal = document.getElementById('emailSentModal');
    if (modal) {
        modal.style.display = 'block';
        
        // Cerrar automáticamente después de 5 segundos
        setTimeout(() => {
            closeModal('emailSentModal');
        }, 5000);
    }
}

/**
 * Muestra el modal de confirmación de cambio de contraseña
 */
function showPasswordChangedModal() {
    const modal = document.getElementById('passwordChangedModal');
    if (modal) {
        modal.style.display = 'block';
        
        // Cerrar automáticamente después de 5 segundos
        setTimeout(() => {
            closeModal('passwordChangedModal');
        }, 5000);
    }
}

/**
 * Cierra un modal específico
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Solicita cambio de contraseña mediante AJAX
 */
function solicitarCambioContrasena() {
    const token = document.querySelector('meta[name="_csrf"]').getAttribute('content');
    const header = document.querySelector('meta[name="_csrf_header"]').getAttribute('content');

    const button = document.querySelector('.toggle-password');
    const icon = button.querySelector('i');
    const originalIcon = icon.className;

    icon.className = 'fa-solid fa-spinner fa-spin';
    button.disabled = true;

    fetch('/usuario/solicitar-cambio-contrasena', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            [header]: token  // Incluir el token CSRF en el header
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showEmailSentModal();
        } else {
            showMessage('Error: ' + (data.error || 'No se pudo procesar la solicitud'), 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showMessage('Error al procesar la solicitud. Por favor, inténtalo de nuevo.', 'error');
    })
    .finally(() => {
        // Restaurar botón
        icon.className = originalIcon;
        button.disabled = false;
    });
}

/**
 * Muestra mensajes de respuesta al usuario
 */
function showMessage(message, type) {
    const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
    const alertHtml = `
        <div class="alert ${alertClass} alert-dismissible fade show" role="alert" style="margin-bottom: 1rem;">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;

    const container = document.querySelector('.profile-card') || document.querySelector('main') || document.body;
    container.insertAdjacentHTML('afterbegin', alertHtml);

    // Auto-hide después de 5 segundos
    setTimeout(() => {
        const alert = document.querySelector('.alert');
        if (alert) {
            alert.remove();
        }
    }, 5000);
}

function checkUrlForMessages() {
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.has('contrasenaActualizada')) {
        showPasswordChangedModal();
    }

    if (urlParams.has('error')) {
        const error = urlParams.get('error');
        let message = 'Ha ocurrido un error.';

        switch (error) {
            case 'token_invalido':
                message = 'El enlace de cambio de contraseña no es válido.';
                break;
            case 'token_expirado':
                message = 'El enlace de cambio de contraseña ha expirado.';
                break;
        }

        showMessage(message, 'error');
    }

    if (urlParams.has('contrasenaActualizada') || urlParams.has('error')) {
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
    }
}

function initPerfilFunctions() {
    setupPasswordPopover();
    checkUrlForMessages();
    
    document.querySelectorAll('.modal-close').forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    });
}

// Hover para el popover de cambio de contraseña
document.addEventListener('DOMContentLoaded', function() {
    const togglePassword = document.querySelector('.toggle-password');
    const popover = document.querySelector('.password-change-popover');
    
    if (togglePassword && popover) {
        togglePassword.addEventListener('mouseenter', function() {
            popover.style.display = 'block';
        });
        
        togglePassword.addEventListener('mouseleave', function() {
            popover.style.display = 'none';
        });
        
        // También manejar el hover sobre el popover mismo
        popover.addEventListener('mouseenter', function() {
            popover.style.display = 'block';
        });
        
        popover.addEventListener('mouseleave', function() {
            popover.style.display = 'none';
        });
    }
});

document.addEventListener('DOMContentLoaded', initPerfilFunctions);