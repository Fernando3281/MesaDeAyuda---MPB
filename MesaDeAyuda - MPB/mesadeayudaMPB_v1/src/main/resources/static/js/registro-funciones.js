//Para mostrar los modals del formulario de registro
$("#registroForm").on('submit', function (event) {
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
        success: function (response) {
            if (response.success) {
                window.location.href = response.redirectUrl;
            } else if (response.error) {
                // Si el error es que el correo ya está registrado, muestra el modal amarillo
                if (response.error.includes("ya está registrado")) {
                    // Cambia el mensaje a "El correo ya se encuentra registrado"
                    showToast('warning', "El correo ya se encuentra registrado.");
                } else {
                    showToast('error', response.error);
                }
            }
        },
        error: function (xhr) {
            let errorMessage = "Error al procesar el registro.";

            // Intenta parsear la respuesta JSON
            try {
                const jsonResponse = JSON.parse(xhr.responseText);
                if (jsonResponse && jsonResponse.error) {
                    errorMessage = jsonResponse.error;
                    // Si el error es que el correo ya está registrado, muestra el modal amarillo
                    if (errorMessage.includes("ya está registrado")) {
                        // Cambia el mensaje a "El correo ya se encuentra registrado"
                        showToast('warning', "El correo ya se encuentra registrado.");
                    } else {
                        showToast('error', errorMessage);
                    }
                }
            } catch (e) {
                // Si no es JSON, verifica si xhr.responseJSON existe
                if (xhr.responseJSON && xhr.responseJSON.error) {
                    errorMessage = xhr.responseJSON.error;
                    // Si el error es que el correo ya está registrado, muestra el modal amarillo
                    if (errorMessage.includes("ya está registrado")) {
                        // Cambia el mensaje a "El correo ya se encuentra registrado"
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

// Función para mostrar toast con mensaje dinámico
function showToast(type, message) {
    // Actualiza el mensaje en el toast
    $(`#toast-${type} .toast-message span`).text(message);

    // Muestra el toast
    $(`#toast-${type}`).css('display', 'block');

    // Cierra automáticamente después de 5 segundos
    setTimeout(function () {
        closeToast(type);
    }, 20000);
}

function closeToast(type) {
    $(`#toast-${type}`).css('display', 'none');
}