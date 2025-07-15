/**
 * Archivo JavaScript para el formulario de registro
 * Maneja la lógica específica del formulario de registro
 */

$(document).ready(function() {
    // Funcion para mostrar y ocultar contraseña
    function togglePassword(inputId, iconId) {
        const passwordInput = document.getElementById(inputId);
        const toggleIcon = document.getElementById(iconId);

        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleIcon.classList.remove('fa-eye');
            toggleIcon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            toggleIcon.classList.remove('fa-eye-slash');
            toggleIcon.classList.add('fa-eye');
        }
    }

    $('.toggle-password').on('click', function() {
        const targetInput = $(this).closest('.password-container').find('input').attr('id');
        const iconId = $(this).find('i').attr('id');
        togglePassword(targetInput, iconId);
    });

    $("#registroForm").on('submit', function(event) {
        event.preventDefault();

        const password = $("#password").val();
        const confirmPassword = $("#confirm-password").val();
        const email = $("#email").val();

        if (password !== confirmPassword) {
            showToast('error', "Las contraseñas no coinciden. Por favor, inténtelo de nuevo.");
            return;
        }

        const formData = new FormData(this);

        $.ajax({
            url: '/registro/nuevo',
            method: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                if (response.success) {
                    window.location.href = response.redirectUrl;
                } else if (response.error) {
                    if (response.error.includes("ya está registrado")) {
                        showToast('warning', "El correo ya se encuentra registrado.");
                    } else {
                        showToast('error', response.error);
                    }
                }
            },
            error: function(xhr) {
                let errorMessage = "Error al procesar el registro.";

                try {
                    const jsonResponse = JSON.parse(xhr.responseText);
                    if (jsonResponse && jsonResponse.error) {
                        errorMessage = jsonResponse.error;
                        if (errorMessage.includes("ya está registrado")) {
                            showToast('warning', "El correo ya se encuentra registrado.");
                        } else {
                            showToast('error', errorMessage);
                        }
                    }
                } catch (e) {
                    if (xhr.responseJSON && xhr.responseJSON.error) {
                        errorMessage = xhr.responseJSON.error;
                        if (errorMessage.includes("ya está registrado")) {
                            showToast('warning', "El correo ya se encuentra registrado.");
                        } else {
                            showToast('error', errorMessage);
                        }
                    } else {
                        showToast('error', errorMessage);
                    }
                }
            }
        });
    });
});

function showToast(type, message = "Mensaje genérico...") {
    $(`#toast-${type} .toast-message span`).text(message);
    $(`#toast-${type}`).css('display', 'block');
    setTimeout(function() {
        closeToast(type);
    }, 20000);
}

function closeToast(type) {
    $(`#toast-${type}`).css('display', 'none');
}