/**
 * Clase para gestionar la visualización de imágenes en los tickets
 * Permite cargar, navegar y mostrar imágenes adjuntas a los tickets
 */
class ImageViewer {
    constructor() {
        this.currentIndex = 0;
        this.images = [];
        this.viewer = document.getElementById('imageViewer');
        if (!this.viewer) {
            console.error('Elemento imageViewer no encontrado en el DOM');
            return;
        }
        this.initEventListeners();
    }

    initEventListeners() {
        // Navegación con teclado
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Cerrar al hacer clic fuera
        this.viewer.addEventListener('click', (e) => {
            if (e.target === this.viewer)
                this.close();
        });
    }

    async loadImages(ticketId) {
        if (!ticketId) {
            console.error('ID de ticket no proporcionado');
            this.showError('ID de ticket no válido');
            return;
        }

        try {
            this.viewer.classList.add('loading');
            console.log(`Cargando imágenes para el ticket: ${ticketId}`);

            // Primero obtenemos la información de las imágenes (no los bytes)
            const response = await fetch(`/tickets/imagenes/${ticketId}`);
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const imageInfoList = await response.json();
            console.log(`Imágenes obtenidas: ${imageInfoList ? imageInfoList.length : 0}`);

            if (!imageInfoList || imageInfoList.length === 0) {
                return this.showEmptyState();
            }

            // Guardamos la información de las imágenes
            this.images = imageInfoList;
            this.currentIndex = 0; // Reiniciar al índice 0
            this.renderThumbnails();
            this.updateDisplay();
            this.showViewer();
        } catch (error) {
            console.error('Error cargando imágenes:', error);
            this.showError(error.message);
        } finally {
            this.viewer.classList.remove('loading');
        }
    }

    renderThumbnails() {
        const container = document.getElementById('thumbnailContainer');
        if (!container) {
            console.error('Contenedor de miniaturas no encontrado');
            return;
        }

        container.innerHTML = '';

        this.images.forEach((image, index) => {
            const thumb = document.createElement('div');
            thumb.className = `thumbnail ${index === 0 ? 'active' : ''}`;
            thumb.innerHTML = `
                <img src="/imagenes/ver/${image.id}" 
                     alt="${image.nombre}" 
                     class="thumbnail-image"
                     data-index="${index}">
                <div class="thumbnail-name">${image.nombre}</div>
            `;

            thumb.onclick = () => this.jumpToImage(index);
            container.appendChild(thumb);
        });

        console.log(`${this.images.length} miniaturas renderizadas`);
    }

    updateDisplay() {
        const mainImage = document.getElementById('currentImage');
        const counter = document.getElementById('imageCounter');

        if (!mainImage || !counter) {
            console.error('Elementos de visualización no encontrados');
            return;
        }

        if (this.images.length > 0) {
            const currentImage = this.images[this.currentIndex];
            // Cargar la imagen actual a través de la URL
            mainImage.src = `/imagenes/ver/${currentImage.id}`;
            counter.textContent = `${this.currentIndex + 1}/${this.images.length}`;

            // Actualizar miniaturas activas
            document.querySelectorAll('.thumbnail').forEach((thumb, idx) => {
                thumb.classList.toggle('active', idx === this.currentIndex);
            });

            console.log(`Mostrando imagen ${this.currentIndex + 1} de ${this.images.length}`);
        }
    }

    jumpToImage(index) {
        if (index < 0 || index >= this.images.length) {
            console.error(`Índice fuera de rango: ${index}`);
            return;
        }

        this.currentIndex = index;
        this.updateDisplay();
    }

    navigate(direction) {
        this.currentIndex = (this.currentIndex + direction + this.images.length) % this.images.length;
        this.updateDisplay();
    }

    showViewer() {
        if (!this.viewer)
            return;

        this.viewer.classList.add('active');
        document.body.style.overflow = 'hidden';
        console.log('Visor de imágenes activado');
    }

    close() {
        if (!this.viewer)
            return;

        this.viewer.classList.remove('active');
        document.body.style.overflow = 'auto';
        console.log('Visor de imágenes cerrado');
    }

    showEmptyState() {
        console.log('No hay imágenes disponibles');
        alert('No hay imágenes disponibles para este ticket.');
    }

    showError(message) {
        console.error(`Error en el visor de imágenes: ${message}`);
        alert('Error al cargar las imágenes: ' + message);
    }

    handleKeyboard(e) {
        if (!this.viewer || !this.viewer.classList.contains('active'))
            return;

        switch (e.key) {
            case 'ArrowLeft':
                this.navigate(-1);
                break;
            case 'ArrowRight':
                this.navigate(1);
                break;
            case 'Escape':
                this.close();
                break;
        }
    }
}

// Crear una instancia global del visor para que esté disponible
let imageViewer;

// Inicialización cuando el DOM está cargado
document.addEventListener('DOMContentLoaded', function () {
    console.log('Inicializando ImageViewer...');
    imageViewer = new ImageViewer();
});

/**
 * Función para mostrar el visor de imágenes para un ticket específico
 * @param {number} ticketId - ID del ticket
 */
function showImageViewer(ticketId) {
    console.log(`Función showImageViewer llamada con ID: ${ticketId}`);
    if (!imageViewer) {
        console.error('ImageViewer no inicializado');
        imageViewer = new ImageViewer();
    }
    imageViewer.loadImages(ticketId);
}

/**
 * Función para cerrar el visor de imágenes
 */
function closeViewer() {
    if (imageViewer) {
        imageViewer.close();
    }
}

/**
 * Función para cambiar a la siguiente o anterior imagen
 * @param {number} direction - Dirección del cambio (-1 para anterior, 1 para siguiente)
 */
function changeImage(direction) {
    if (imageViewer) {
        imageViewer.navigate(direction);
    }
}

/*Funcion para cambiar de paneles*/
document.addEventListener('DOMContentLoaded', function () {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(button => {
        button.addEventListener('click', function () {
            const targetTab = this.getAttribute('data-tab');

            // Remove active class from all buttons and panes
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));

            // Add active class to the clicked button and corresponding pane
            this.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });
});

/*Funcion para mostrar y ocultar el Popover*/
document.addEventListener('DOMContentLoaded', function () {
    let popover = document.createElement('div');
    popover.className = 'popover';
    document.body.appendChild(popover);

    let hideTimeout = null;

    function showPopover(event) {
        const button = event.currentTarget;
        const message = button.getAttribute('data-popover');

        popover.textContent = message;
        clearTimeout(hideTimeout);
        popover.style.display = 'block';

        const rect = button.getBoundingClientRect();
        const popoverHeight = popover.offsetHeight;
        const popoverWidth = popover.offsetWidth;
        const leftPosition = rect.left + (rect.width / 2) - (popoverWidth / 2);

        popover.style.top = `${rect.top + window.scrollY - popoverHeight - 10}px`;
        popover.style.left = `${Math.max(10, leftPosition)}px`;
    }

    function hidePopover() {
        hideTimeout = setTimeout(() => {
            popover.style.display = 'none';
        }, 50);
    }

    document.querySelectorAll('.popover-btn').forEach(button => {
        button.addEventListener('mouseenter', showPopover);
        button.addEventListener('mouseleave', hidePopover);
    });

    popover.addEventListener('mouseenter', () => clearTimeout(hideTimeout));
    popover.addEventListener('mouseleave', hidePopover);
});

// Función para cambiar el tipo de respuesta (Pública/Interna)
function toggleResponseType() {
    const button = document.getElementById('responseType');
    const hiddenInput = document.getElementById('esNotaInterna');
    if (button.textContent === 'Respuesta Pública') {
        button.textContent = 'Nota Interna';
        hiddenInput.value = 'true';
    } else {
        button.textContent = 'Respuesta Pública';
        hiddenInput.value = 'false';
    }
}

// Función para habilitar o deshabilitar el botón según la selección
function habilitarBoton() {
    const selectPrioridad = document.getElementById('prioridadSelect');
    const btnActualizarPrioridad = document.getElementById('btnActualizarPrioridad');

    // Habilitar el botón si el valor seleccionado no es "Sin Asignar"
    if (selectPrioridad.value !== "Sin Asignar") {
        btnActualizarPrioridad.disabled = false;
    } else {
        btnActualizarPrioridad.disabled = true;
    }
}

// Función para abrir el modal de asignar prioridad
function openPrioridadModal() {
    const modalOverlay = document.getElementById('prioridadModalOverlay');
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // Evita el scroll en el fondo
}

// Función para cerrar el modal de asignar prioridad
function closePrioridadModal() {
    const modalOverlay = document.getElementById('prioridadModalOverlay');
    modalOverlay.classList.remove('active');
    document.body.style.overflow = 'auto'; // Restaura el scroll
}

// Asignar eventos a los botones
document.addEventListener('DOMContentLoaded', function () {
    // Botón para abrir el modal
    const asignarPrioridadBtn = document.querySelector('[onclick="openPrioridadModal()"]');
    if (asignarPrioridadBtn) {
        asignarPrioridadBtn.addEventListener('click', openPrioridadModal);
    }

    // Botón para cerrar el modal
    const closeModalBtn = document.getElementById('closePrioridadModalBtn');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closePrioridadModal);
    }

    // Cerrar el modal al hacer clic fuera del contenido
    const modalOverlay = document.getElementById('prioridadModalOverlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function (event) {
            if (event.target === modalOverlay) {
                closePrioridadModal();
            }
        });
    }

    // Ejecutar la función para habilitar/deshabilitar el botón al cargar la página
    habilitarBoton();
});

// Función para atender un ticket usando AJAX
function atenderTicket(ticketId) {
    try {
        // Verificar primero si el token CSRF existe
        const csrfTokenElement = document.querySelector('input[name="_csrf"]');
        if (!csrfTokenElement) {
            throw new Error('No se encontró el token de seguridad CSRF');
        }
        const csrfToken = csrfTokenElement.value;

        fetch(`/tickets/atender/${ticketId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken
            }
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.error || `Error HTTP: ${response.status}`);
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // Recargar la página para reflejar todos los cambios
                window.location.reload();
            } else {
                alert('Error al atender el ticket: ' + (data.error || 'Error desconocido'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Hubo un error al atender el ticket: ' + error.message);
        });
    } catch (error) {
        console.error('Error en atenderTicket:', error);
        alert('Error al procesar la solicitud: ' + error.message);
    }
}




// Función para enviar una respuesta al ticket usando AJAX
function responderTicket(event) {
    event.preventDefault(); // Evita que el formulario se envíe de forma tradicional

    // Verificar si el ticket está siendo atendido
    const ticketId = document.getElementById('ticketId').value;
    const ticketAsignado = document.getElementById('asignadoPara').value !== 'Sin Asignar';

    if (!ticketAsignado) {
        alert('Debes atender el ticket primero antes de enviar mensajes.');
        return;
    }

    // Deshabilita el botón de envío para prevenir envíos múltiples
    const submitButton = event.target.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.disabled = true;
    }

    const formData = new FormData(event.target); // Obtiene los datos del formulario
    const actionUrl = event.target.getAttribute('action');

    fetch(actionUrl, {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRF-TOKEN': document.querySelector('input[name="_csrf"]').value
        }
    })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error HTTP: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    // Agrega el nuevo mensaje al chat sin recargar la página
                    const chatMessages = document.querySelector('.chat-messages');
                    if (chatMessages) {
                        const newMessage = document.createElement('div');
                        newMessage.classList.add('message');
                        if (data.esNotaInterna) {
                            newMessage.classList.add('internal-note');
                        }

                        newMessage.innerHTML = `
                    <div class="message-header">
                        <span class="user-name">${data.emisorNombre}</span>
                        <span class="message-time">${data.fechaHora}</span>
                    </div>
                    <div class="message-content">${data.mensaje}</div>
                `;
                        chatMessages.appendChild(newMessage);
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                    }

                    // Limpia el textarea
                    const respuestaTextarea = document.getElementById('respuesta');
                    if (respuestaTextarea) {
                        respuestaTextarea.value = '';
                    }
                } else {
                    alert('Error al enviar el mensaje: ' + data.error);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Hubo un error al enviar el mensaje: ' + error.message);
            })
            .finally(() => {
                // Re-habilita el botón de envío después de completar la operación
                if (submitButton) {
                    submitButton.disabled = false;
                }
            });
}

document.addEventListener('DOMContentLoaded', function () {
    // Verificar el estado del ticket para mostrar/ocultar botones
    function updateTicketButtons() {
        // Obtener información del ticket
        const ticketEstado = document.querySelector('input#estado').value ||
                document.querySelector('select#estado').value;

        // Botón de cerrar ticket
        const btnCerrarTicket = document.querySelector('button[data-bs-target="#resolveTicketModal"]');

        if (btnCerrarTicket) {
            // Solo mostrar si está en progreso
            if (ticketEstado === 'En Progreso') {
                btnCerrarTicket.style.display = 'inline-block';
            } else {
                btnCerrarTicket.style.display = 'none';
            }
        }
    }

    // Ejecutar al cargar la página
    updateTicketButtons();

    // Actualizar si cambia el estado
    const selectEstado = document.querySelector('select#estado');
    if (selectEstado) {
        selectEstado.addEventListener('change', updateTicketButtons);
    }
});

// Función para verificar la prioridad antes de mostrar el modal de cierre
function verificarPrioridadYCerrar() {
    const prioridad = document.getElementById('prioridad').value;

    if (prioridad === 'Sin Asignar') {
        // Mostrar modal de error si no hay prioridad asignada
        openErrorPriorityModal();
    } else {
        // Mostrar modal de confirmación si hay prioridad asignada
        openResolveTicketModal();
    }
}

// Función para abrir el modal de confirmación de cierre
function openResolveTicketModal() {
    const modalOverlay = document.getElementById('resolveTicketModalOverlay');
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Función para cerrar el modal de confirmación de cierre
function closeResolveTicketModal() {
    const modalOverlay = document.getElementById('resolveTicketModalOverlay');
    modalOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Función para abrir el modal de error de prioridad
function openErrorPriorityModal() {
    const modalOverlay = document.getElementById('errorPriorityModalOverlay');
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Función para cerrar el modal de error de prioridad
function closeErrorPriorityModal() {
    const modalOverlay = document.getElementById('errorPriorityModalOverlay');
    modalOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Configuración inicial de los modales
document.addEventListener('DOMContentLoaded', function () {
    // Configurar el botón de cierre de ticket
    const btnCerrarTicket = document.getElementById('btnCerrarTicket');
    if (btnCerrarTicket) {
        btnCerrarTicket.onclick = verificarPrioridadYCerrar;
    }

    // Cerrar el modal de confirmación al hacer clic fuera del contenido
    const resolveModalOverlay = document.getElementById('resolveTicketModalOverlay');
    if (resolveModalOverlay) {
        resolveModalOverlay.addEventListener('click', function (event) {
            if (event.target === resolveModalOverlay) {
                closeResolveTicketModal();
            }
        });
    }

    // Configurar el botón de cierre en el modal de error
    const btnCerrarError = document.querySelector('#errorPriorityModalOverlay .btn-primary');
    if (btnCerrarError) {
        btnCerrarError.onclick = closeErrorPriorityModal;
    }

    // Cerrar el modal de error al hacer clic fuera del contenido
    const errorModalOverlay = document.getElementById('errorPriorityModalOverlay');
    if (errorModalOverlay) {
        errorModalOverlay.addEventListener('click', function (event) {
            if (event.target === errorModalOverlay) {
                closeErrorPriorityModal();
            }
        });
    }
});

// Función para abrir el modal de asignación de tickets
function openAssignTicketsModal() {
    const modalOverlay = document.getElementById('assignTicketsModalOverlay');
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Obtener el select
    const soportistaSelectElement = document.getElementById('soportistaSelect');

    // Limpiar opciones existentes
    soportistaSelectElement.innerHTML = '<option value="">Seleccionar soportista...</option>';

    // Mostrar mensaje de carga
    soportistaSelectElement.innerHTML += '<option disabled>Cargando soportistas...</option>';

    // Obtener datos del endpoint
    fetch('/tickets/usuarios/soportistas')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error en la respuesta del servidor: ' + response.status);
                }
                return response.json();
            })
            .then(data => {
                console.log('Soportistas cargados:', data);
                // Limpiar opciones después de cargar
                soportistaSelectElement.innerHTML = '<option value="">Seleccionar soportista...</option>';

                // Agregar opciones al select
                if (data && data.length > 0) {
                    data.forEach(soportista => {
                        const option = document.createElement('option');
                        option.value = soportista.id;
                        option.textContent = soportista.nombreCompleto;
                        soportistaSelectElement.appendChild(option);
                    });
                } else {
                    soportistaSelectElement.innerHTML += '<option disabled>No hay soportistas disponibles</option>';
                }
            })
            .catch(error => {
                console.error('Error cargando soportistas:', error);
                soportistaSelectElement.innerHTML = '<option value="">Error al cargar soportistas</option>';
                alert('Error cargando la lista de soportistas: ' + error.message);
            });
}

// Función para cerrar el modal de asignación de tickets
function closeAssignTicketsModal() {
    const modalOverlay = document.getElementById('assignTicketsModalOverlay');
    modalOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Función para asignar un ticket a un soportista
function assignTickets() {
    // Verificar si el modal de asignación de tickets está visible
    const assignTicketsModal = document.getElementById('assignTicketsModalOverlay');
    if (!assignTicketsModal || !assignTicketsModal.classList.contains('active')) {
        console.error('El modal de asignación de tickets no está abierto.');
        return;
    }

    // Obtener el ID del soportista seleccionado
    const soportistaSelect = document.getElementById('soportistaSelect');
    if (!soportistaSelect || !soportistaSelect.value) {
        alert('Por favor, seleccione un soportista para asignar el ticket.');
        return;
    }
    const soportistaId = soportistaSelect.value;

    // Obtener el ID del ticket desde la URL de la página
    const urlParts = window.location.pathname.split('/');
    const ticketId = urlParts[urlParts.length - 1];

    console.log('Asignando ticket', ticketId, 'al soportista', soportistaId);

    // Obtener el token CSRF
    const csrfToken = document.querySelector('input[name="_csrf"]').value;

    // Datos para enviar al servidor
    const data = {
        soportistaId: soportistaId,
        ticketId: ticketId
    };

    // Realizar la petición AJAX
    fetch('/tickets/asignar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrfToken
        },
        body: JSON.stringify(data)
    })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error HTTP: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    // Cerrar el modal
                    closeAssignTicketsModal();

                    // Recargar la página para reflejar los cambios
                    window.location.reload();
                } else {
                    alert('Error al asignar el ticket: ' + data.error);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Hubo un error al asignar el ticket: ' + error.message);
            });
}

// Asegurarnos que los botones tengan los event listeners correctos
document.addEventListener('DOMContentLoaded', function () {
    // Botón para abrir el modal de asignación
    const assignBtn = document.querySelector('[onclick="openAssignTicketsModal()"]');
    if (assignBtn) {
        assignBtn.removeAttribute('onclick');
        assignBtn.addEventListener('click', openAssignTicketsModal);
    }

    // Botón confirmar en el modal de asignación
    const confirmAssignBtn = document.querySelector('.modal-footer .btn-primary');
    if (confirmAssignBtn) {
        confirmAssignBtn.removeAttribute('onclick');
        confirmAssignBtn.addEventListener('click', assignTickets);
    }
});

// Función para desactivar un ticket
function desactivarTicket(ticketId) {
    const csrfToken = document.querySelector('input[name="_csrf"]').value;

    fetch(`/tickets/desactivar/${ticketId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrfToken
        }
    })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => {
                        throw new Error(err.error || `Error HTTP: ${response.status}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    // Actualizar la interfaz sin recargar
                    alert('Ticket desactivado correctamente');
                    window.location.reload(); // Recargar la página para reflejar cambios
                } else {
                    alert('Error al desactivar el ticket: ' + data.error);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Hubo un error al desactivar el ticket: ' + error.message);
            });
}

// Función para asignar un ticket a un soportista
function assignTicketToSupporter() {
    // Obtener el ID del soportista seleccionado
    const soportistaSelect = document.getElementById('soportistaSelect');
    if (!soportistaSelect || !soportistaSelect.value) {
        alert('Por favor, seleccione un soportista para asignar el ticket.');
        return;
    }
    const soportistaId = soportistaSelect.value;

    // Obtener el ID del ticket
    const ticketId = document.getElementById('ticketId').value;

    // Obtener el token CSRF
    const csrfToken = document.querySelector('input[name="_csrf"]').value;

    // Datos para enviar al servidor
    const data = {
        soportistaId: soportistaId,
        ticketId: ticketId
    };

    // Realizar la petición AJAX
    fetch('/tickets/asignar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrfToken
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Cerrar el modal
            closeAssignTicketsModal();
            // Mostrar mensaje de éxito
            alert('Ticket asignado correctamente');
            // Recargar la página para reflejar los cambios
            window.location.reload();
        } else {
            alert('Error al asignar el ticket: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Hubo un error al asignar el ticket: ' + error.message);
    });
}

// Configurar los event listeners para la asignación de tickets
document.addEventListener('DOMContentLoaded', function () {
    // Botón para abrir el modal de asignación
    const btnAsignarTicket = document.getElementById('asignarTicket');
    if (btnAsignarTicket) {
        btnAsignarTicket.addEventListener('click', openAssignTicketsModal);
    }

    // Botón para confirmar la asignación
    const btnConfirmarAsignacion = document.getElementById('confirmAssignBtn');
    if (btnConfirmarAsignacion) {
        btnConfirmarAsignacion.addEventListener('click', assignTicketToSupporter);
    }

    // Cerrar el modal al hacer clic fuera del contenido
    const assignModalOverlay = document.getElementById('assignTicketsModalOverlay');
    if (assignModalOverlay) {
        assignModalOverlay.addEventListener('click', function (event) {
            if (event.target === assignModalOverlay) {
                closeAssignTicketsModal();
            }
        });
    }
});





function openReabrirTicketModal() {
    const modal = document.getElementById('reabrirTicketModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeReabrirTicketModal() {
    const modal = document.getElementById('reabrirTicketModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}
















// Función para verificar el estado del ticket y habilitar/deshabilitar botones
function actualizarEstadoBotones() {
    const estadoTicket = document.querySelector('input#estado').value ||
            document.querySelector('select#estado').value;
    const esSoportista = document.body.getAttribute('data-user-role') === 'ROL_SOPORTISTA';

    // Obtener todos los botones de acción
    const actionButtons = document.querySelectorAll('.ticket-summary .action-button');

    // Verificar si el ticket está resuelto, desactivado o abierto para soportistas
    const deshabilitar = estadoTicket === 'Resuelto' || 
                        estadoTicket === 'Desactivado' || 
                        (estadoTicket === 'Abierto' && esSoportista);

    // Aplicar el estado a todos los botones
    actionButtons.forEach(button => {
        button.disabled = deshabilitar;

        // Aplicar estilos visuales
        if (deshabilitar) {
            button.style.opacity = '0.6';
            button.style.cursor = 'not-allowed';
        } else {
            button.style.opacity = '';
            button.style.cursor = '';
        }
    });
}

// Llamar a la función cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    actualizarEstadoBotones();

    // También llamar cuando cambia el estado del ticket (si es editable)
    const selectEstado = document.querySelector('select#estado');
    if (selectEstado) {
        selectEstado.addEventListener('change', actualizarEstadoBotones);
    }
});








// Función para verificar el rol del usuario y estado del ticket
function verificarPermisosBotones() {
    const estadoTicket = document.querySelector('input#estado').value ||
            document.querySelector('select#estado').value;
    const esSoportista = document.body.getAttribute('data-user-role') === 'ROL_SOPORTISTA';

    // Obtener los botones principales
    const btnHeredarTicket = document.getElementById('btnHeredarTicket');
    const btnAsignarPrioridad = document.getElementById('btnAsignarPrioridad');

    // Verificar si el ticket está asignado
    const ticketAsignado = document.getElementById('asignadoPara').value !== 'Sin Asignar';

    // Si el ticket está resuelto o desactivado, deshabilitar todos los botones
    if (estadoTicket === 'Resuelto' || estadoTicket === 'Desactivado') {
        if (btnHeredarTicket)
            btnHeredarTicket.disabled = true;
        if (btnAsignarPrioridad)
            btnAsignarPrioridad.disabled = true;

        // Aplicar estilos a los botones deshabilitados
        const actionButtons = document.querySelectorAll('.ticket-summary .action-button:disabled');
        actionButtons.forEach(btn => {
            btn.style.opacity = '0.6';
            btn.style.cursor = 'not-allowed';
        });
    }
    // Si el ticket está asignado y no está resuelto/desactivado, habilitar los botones
    else if (ticketAsignado) {
        if (btnHeredarTicket)
            btnHeredarTicket.disabled = false;
        if (btnAsignarPrioridad)
            btnAsignarPrioridad.disabled = false;

        // Restaurar estilos de los botones
        const actionButtons = document.querySelectorAll('.ticket-summary .action-button');
        actionButtons.forEach(btn => {
            btn.style.opacity = '';
            btn.style.cursor = '';
        });
    }
}


// Función para verificar el estado del ticket y habilitar/deshabilitar botones
function actualizarEstadoBotones() {
    const estadoTicket = document.querySelector('input#estado').value ||
            document.querySelector('select#estado').value;

    // Obtener todos los botones de acción
    const actionButtons = document.querySelectorAll('.ticket-summary .action-button');

    // Verificar si el ticket está resuelto o desactivado
    const deshabilitar = estadoTicket === 'Resuelto' || estadoTicket === 'Desactivado';

    // Aplicar el estado a todos los botones
    actionButtons.forEach(button => {
        button.disabled = deshabilitar;

        // Aplicar estilos visuales
        if (deshabilitar) {
            button.style.opacity = '0.6';
            button.style.cursor = 'not-allowed';
        } else {
            button.style.opacity = '';
            button.style.cursor = '';
        }
    });
}

// Llamar a la función cuando se carga la página
document.addEventListener('DOMContentLoaded', function () {
    actualizarEstadoBotones();

    // También llamar cuando cambia el estado del ticket (si es editable)
    const selectEstado = document.querySelector('select#estado');
    if (selectEstado) {
        selectEstado.addEventListener('change', actualizarEstadoBotones);
    }
});


//Revisar este metodo encargado de fijar el resumen del tciket ya que presenta problemas en el responsive
/*
 document.addEventListener('DOMContentLoaded', function () {
 const ticketSummary = document.querySelector('.ticket-summary');
 const ticketDetails = document.querySelector('.ticket-details');
 const buttonContainer = document.querySelector('.back-button-container');
 
 // Guardar el tamaño original del panel derecho
 let originalDetailsWidth = ticketDetails.offsetWidth;
 let originalDetailsHeight = ticketDetails.offsetHeight;
 
 // Guardar la altura del contenedor de botones
 let containerHeight = buttonContainer.offsetHeight;
 
 // Calcular el offset para el comportamiento sticky
 const offset = containerHeight + 27; // 15px de margen adicional
 
 // Función para manejar el scroll
 function handleScroll() {
 const scrollPosition = window.scrollY;
 
 if (window.innerWidth > 768) { // Solo aplicar sticky en pantallas grandes
 if (scrollPosition > offset) {
 // Aplicar sticky state
 ticketSummary.style.transform = `translateY(${containerHeight}px)`;
 ticketSummary.classList.add('sticky');
 ticketDetails.classList.add('sticky');
 
 // Mantener el ancho original del panel derecho
 ticketDetails.style.width = `${originalDetailsWidth}px`;
 ticketDetails.style.height = `${originalDetailsHeight}px`;
 } else {
 // Remover sticky state
 ticketSummary.style.transform = '';
 ticketSummary.classList.remove('sticky');
 ticketDetails.classList.remove('sticky');
 
 // Restaurar el tamaño original del panel derecho
 ticketDetails.style.width = '';
 ticketDetails.style.height = '';
 }
 } else {
 // En dispositivos móviles, no aplicar sticky
 ticketSummary.style.transform = '';
 ticketSummary.classList.remove('sticky');
 ticketDetails.classList.remove('sticky');
 
 // Restaurar el tamaño original del panel derecho
 ticketDetails.style.width = '';
 ticketDetails.style.height = '';
 }
 }
 
 // Función para manejar el redimensionamiento de la ventana
 function handleResize() {
 // Recalcular el tamaño original del panel derecho si la ventana es mayor a 768px
 if (window.innerWidth > 768) {
 originalDetailsWidth = ticketDetails.offsetWidth;
 originalDetailsHeight = ticketDetails.offsetHeight;
 }
 
 // Recalcular la altura del contenedor de botones
 containerHeight = buttonContainer.offsetHeight;
 
 // Forzar la actualización del scroll
 handleScroll();
 }
 
 // Throttling para mejor rendimiento
 let ticking = false;
 window.addEventListener('scroll', function () {
 if (!ticking) {
 window.requestAnimationFrame(function () {
 handleScroll();
 ticking = false;
 });
 ticking = true;
 }
 });
 
 // Manejar cambios de tamaño de ventana
 window.addEventListener('resize', function () {
 handleResize();
 });
 
 // Inicialización
 handleScroll();
 });
 */