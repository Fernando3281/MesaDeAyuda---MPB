window.showToast = function(type, message = "Mensaje genérico...") {
    const toast = document.getElementById(`toast-${type}`);
    if (!toast) return;
    
    const messageElement = toast.querySelector('.toast-message span');
    if (messageElement) {
        messageElement.textContent = message;
    }
    
    toast.style.display = 'block';
    
    if (toast.timeoutId) {
        clearTimeout(toast.timeoutId);
    }
    toast.timeoutId = setTimeout(() => {
        toast.style.display = 'none';
    }, 5000);
};

window.closeToast = function(type) {
    const toast = document.getElementById(`toast-${type}`);
    if (!toast) return;
    
    if (toast.timeoutId) {
        clearTimeout(toast.timeoutId);
    }
    
    toast.style.display = 'none';
};

document.addEventListener('DOMContentLoaded', function() {
    initializePasswordForms();
    
    document.querySelectorAll('.toast-close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const toast = this.closest('.toast-modal');
            if (toast) {
                const type = toast.id.replace('toast-', '');
                closeToast(type);
            }
        });
    });
});

function initializePasswordForms() {
    setupTogglePassword();
    setupFormValidation();
    setupPasswordPopover();
    setupRealTimeValidation();
    setupRegistrationPasswordValidation();
}

function setupTogglePassword() {
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', function() {
            const container = this.closest('.password-container, .password-container-register');
            if (!container) return;
            
            const input = container.querySelector('input');
            const icon = this.querySelector('i');
            
            if (input && icon) {
                togglePasswordVisibility(input, icon);
            }
        });
    });
}

function togglePasswordVisibility(input, icon) {
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

function setupRegistrationPasswordValidation() {
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const passwordStatusBtn = document.getElementById('statusValidationPassword');
    const confirmStatusBtn = document.getElementById('statusValidationConfirm');
    
    if (passwordInput && passwordStatusBtn) {
        passwordInput.addEventListener('input', function() {
            const password = this.value;
            updatePasswordStatus(password, passwordStatusBtn);
        });
    }
    
    if (confirmPasswordInput && confirmStatusBtn && passwordInput) {
        confirmPasswordInput.addEventListener('input', function() {
            const password = passwordInput.value;
            const confirmPassword = this.value;
            updateConfirmPasswordStatus(password, confirmPassword, confirmStatusBtn);
        });
        
        passwordInput.addEventListener('input', function() {
            const password = this.value;
            const confirmPassword = confirmPasswordInput.value;
            if (confirmPassword) {
                updateConfirmPasswordStatus(password, confirmPassword, confirmStatusBtn);
            }
        });
    }
}

function updatePasswordStatus(password, statusButton) {
    const icon = statusButton.querySelector('i');
    
    if (!password) {
        setStatusButton(statusButton, icon, 'neutral');
        return;
    }
    
    if (validatePassword(password)) {
        setStatusButton(statusButton, icon, 'valid');
    } else {
        setStatusButton(statusButton, icon, 'invalid');
    }
}

function updateConfirmPasswordStatus(originalPassword, confirmPassword, statusButton) {
    const icon = statusButton.querySelector('i');
    
    if (!confirmPassword) {
        setStatusButton(statusButton, icon, 'neutral');
        return;
    }
    
    if (originalPassword === confirmPassword && validatePassword(originalPassword)) {
        setStatusButton(statusButton, icon, 'valid');
    } else {
        setStatusButton(statusButton, icon, 'invalid');
    }
}

function setStatusButton(button, icon, status) {
    button.classList.remove('btn-success', 'btn-danger', 'btn-outline-secondary');
    icon.classList.remove('fa-minus', 'fa-circle-check', 'fa-circle-xmark');
    
    switch (status) {
        case 'valid':
            button.classList.add('btn-success');
            icon.classList.add('fa-circle-check');
            icon.classList.add('circle-check-solid');
            break;
        case 'invalid':
            button.classList.add('btn-danger'); 
            icon.classList.add('fa-circle-xmark');
            break;
        case 'neutral':
        default:
            button.classList.add('btn-outline-secondary');
            icon.classList.add('fa-minus');
            break;
    }
}

function setupRealTimeValidation() {
    const passwordInput = document.getElementById('password-change');
    const confirmPasswordInput = document.getElementById('confirmPassword-change');
    
    if (passwordInput && confirmPasswordInput) {
        function validatePasswords() {
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;

            if (confirmPassword && password !== confirmPassword) {
                confirmPasswordInput.setCustomValidity('Las contraseñas no coinciden');
            } else {
                confirmPasswordInput.setCustomValidity('');
            }
        }

        passwordInput.addEventListener('input', validatePasswords);
        confirmPasswordInput.addEventListener('input', validatePasswords);
    }
}

function setupFormValidation() {
    if (document.getElementById('registroForm')) {
        document.getElementById('registroForm').addEventListener('submit', handleRegistrationSubmit);
    }
    
    if (document.getElementById('changePasswordForm')) {
        document.getElementById('changePasswordForm').addEventListener('submit', handleChangePasswordSubmit);
    }
    
    if (document.querySelector('.form-elements-recovery')) {
        document.querySelector('.form-elements-recovery').addEventListener('submit', handleRecoverySubmit);
    }
}

function setupPasswordPopover() {
    document.querySelectorAll('.info-icon').forEach(icon => {
        icon.addEventListener('mouseenter', function() {
            const popover = this.querySelector('.popover-password');
            if (popover) popover.style.display = 'block';
        });
        
        icon.addEventListener('mouseleave', function() {
            const popover = this.querySelector('.popover-password');
            if (popover) popover.style.display = 'none';
        });
    });
}

function handleRegistrationSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const password = form.querySelector('#password').value;
    const confirmPassword = form.querySelector('#confirm-password').value;
    
    if (!validatePassword(password)) {
        showToast('error', "La contraseña no cumple con los requisitos mínimos.");
        return;
    }
    
    if (password !== confirmPassword) {
        showToast('error', "Las contraseñas no coinciden.");
        return;
    }
    
    const formData = new FormData(form);
    fetch(form.action, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            window.location.href = data.redirectUrl;
        } else {
            showToast('error', data.error || "Error en el registro");
        }
    })
    .catch(() => {
        showToast('error', "Error al procesar la solicitud");
    });
}

function handleChangePasswordSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const password = form.querySelector('#password-change').value;
    const confirmPassword = form.querySelector('#confirmPassword-change').value;
    const submitBtn = document.getElementById('submitBtn');
    const loadingMessage = document.getElementById('loadingMessage');
    const successMessage = document.getElementById('successMessage');
    
    if (!validatePassword(password)) {
        showToast('error', "La contraseña no cumple con los requisitos mínimos.");
        return;
    }
    
    if (password !== confirmPassword) {
        showToast('error', "Las contraseñas no coinciden.");
        return;
    }
    
    if (loadingMessage) loadingMessage.style.display = 'block';
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Actualizando...';
    }
    
    const formData = new FormData(form);
    
    fetch(form.action, {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (response.ok) {
            showSuccessAndClose();
        } else {
            window.location.reload();
        }
    })
    .catch(error => {
        window.location.reload();
    });
}

function handleRecoverySubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const password = form.querySelector('#password-recovery').value;
    const confirmPassword = form.querySelector('#confirmPassword-password-recovery').value;
    
    if (!validatePassword(password)) {
        showToast('error', "La contraseña no cumple con los requisitos mínimos.");
        return;
    }
    
    if (password !== confirmPassword) {
        showToast('error', "Las contraseñas no coinciden.");
        return;
    }
    
    form.submit();
}

function validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasSpecialChar = /[@$!%*?&]/.test(password);
    
    return password.length >= minLength && 
           hasUpperCase && 
           hasLowerCase && 
           hasSpecialChar;
}

function showSuccessAndClose() {
    const loadingMessage = document.getElementById('loadingMessage');
    const form = document.getElementById('changePasswordForm');
    const successMessage = document.getElementById('successMessage');
    
    if (loadingMessage) loadingMessage.style.display = 'none';
    if (form) form.style.display = 'none';
    if (successMessage) successMessage.style.display = 'block';

    let countdown = 3;
    const countdownElement = document.getElementById('countdown');

    const timer = setInterval(function () {
        countdown--;
        if (countdownElement) countdownElement.textContent = countdown;

        if (countdown <= 0) {
            clearInterval(timer);
            window.close();
            setTimeout(function () {
                window.location.href = '/usuario/perfil?contrasenaActualizada=true';
            }, 1000);
        }
    }, 1000);
}