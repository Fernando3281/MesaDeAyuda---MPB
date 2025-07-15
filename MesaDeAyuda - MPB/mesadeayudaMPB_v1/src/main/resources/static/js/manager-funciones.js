/* manager-funciones.js */

/*Metodos para obtener los archivos adjuntado al ticket*/
let currentFiles = [];
let currentIndex = 0;

// Variable para manejar el debounce de la búsqueda
let searchTimeout = null;

// Variables globales para el modo edición
let isEditMode = false;
let originalValues = {};

// Función para manejar la entrada de búsqueda con debounce
function handleSearchInput() {
    const searchInput = document.getElementById('searchMessages');
    const ticketId = document.getElementById('ticketId').value;

    // Cancelar el timeout anterior si existe
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }

    // Establecer un nuevo timeout para ejecutar la búsqueda después de 500ms
    searchTimeout = setTimeout(() => {
        const searchTerm = searchInput.value.trim();
        loadMessages(ticketId, searchTerm);
    }, 50);
}

// Función para mostrar el visor de archivos
function showFileViewer(fileUrl, fileType, fileName) {
    const fileViewer = document.getElementById('fileViewer');
    const imageContainer = document.getElementById('imageContainer');
    const pdfContainer = document.getElementById('pdfContainer');
    const modalImage = document.getElementById('currentImage');
    const pdfViewerContent = document.getElementById('pdfViewerContent');

    // Mostrar el contenedor adecuado según el tipo de archivo
    if (fileType === 'image') {
        modalImage.src = fileUrl;
        modalImage.alt = fileName;
        imageContainer.style.display = 'flex';
        pdfContainer.style.display = 'none';
    } else if (fileType === 'pdf') {
        pdfViewerContent.src = fileUrl;
        imageContainer.style.display = 'none';
        pdfContainer.style.display = 'flex';
    }

    // Mostrar el visor
    fileViewer.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Actualizar el contador
    updateFileCounter();
}

// Función para cerrar el visor
function closeViewer() {
    document.getElementById('fileViewer').classList.remove('active');
    document.body.style.overflow = 'auto';

    // Limpiar el visor de PDF
    document.getElementById('pdfViewerContent').src = '';

    // Limpiar las variables de estado
    currentFiles = [];
    currentIndex = 0;
}

// Función para navegar entre archivos
function changeFile(direction) {
    currentIndex += direction;

    // Manejar el bucle de archivos
    if (currentIndex < 0) {
        currentIndex = currentFiles.length - 1;
    } else if (currentIndex >= currentFiles.length) {
        currentIndex = 0;
    }

    // Cargar el nuevo archivo
    const file = currentFiles[currentIndex];
    showFileViewer(file.url, file.type, file.name);
}

// Función para actualizar el contador de archivos
function updateFileCounter() {
    const fileCounter = document.getElementById('fileCounter');
    if (currentFiles.length > 1) {
        fileCounter.textContent = `${currentIndex + 1} de ${currentFiles.length}`;
        fileCounter.style.display = 'block';
    } else {
        fileCounter.style.display = 'none';
    }
}

// Función para cargar miniaturas
function loadThumbnails() {
    const thumbnailContainer = document.getElementById('thumbnailContainer');
    thumbnailContainer.innerHTML = '';

    currentFiles.forEach((file, index) => {
        const thumbnail = document.createElement('div');
        thumbnail.className = `thumbnail ${index === currentIndex ? 'active' : ''}`;
        thumbnail.innerHTML = `
            <img src="${file.thumbnail || file.url}" class="thumbnail-image" alt="${file.name}">
            <span class="thumbnail-name">${file.name}</span>
        `;

        thumbnail.addEventListener('click', () => {
            currentIndex = index;
            showFileViewer(file.url, file.type, file.name);

            // Actualizar miniaturas activas
            document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
            thumbnail.classList.add('active');
        });

        thumbnailContainer.appendChild(thumbnail);
    });
}

/**
 * Maneja la visualización del popover de información de estado
 */
function setupEstadoPopover() {
    const estadoInfoIcon = document.querySelector('.password-info-icon');
    const estadoPopover = document.querySelector('.password-popover');
    
    if (estadoInfoIcon && estadoPopover) {
        // Mostrar popover al hacer hover en el ícono
        estadoInfoIcon.addEventListener('mouseenter', function () {
            estadoPopover.style.display = 'block';
        });
        
        // Ocultar popover al salir del ícono
        estadoInfoIcon.addEventListener('mouseleave', function () {
            estadoPopover.style.display = 'none';
        });
        
        // Evitar interacción con el popover - se oculta inmediatamente
        estadoPopover.addEventListener('mouseenter', function() {
            estadoPopover.style.display = 'none';
        });
        
        // Asegurar que el popover esté oculto inicialmente
        estadoPopover.style.display = 'none';
    }
}

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    setupEstadoPopover();
});

// Función alternativa más estricta (recomendada para tu caso)
function setupEstadoPopoverStrict() {
    const estadoInfoIcon = document.querySelector('.password-info-icon');
    const estadoPopover = document.querySelector('.password-popover');
    
    if (estadoInfoIcon && estadoPopover) {
        estadoInfoIcon.addEventListener('mouseenter', function () {
            estadoPopover.style.display = 'block';
        });
        
        estadoInfoIcon.addEventListener('mouseleave', function () {
            estadoPopover.style.display = 'none';
        });
        
        // Evitar completamente la interacción con el popover
        estadoPopover.style.pointerEvents = 'none';
        
        // Asegurar que el popover esté oculto inicialmente
        estadoPopover.style.display = 'none';
    }
}

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    setupEstadoPopover();
});

// Función alternativa más estricta si quieres que desaparezca SOLO cuando sale del ícono
function setupEstadoPopoverStrict() {
    const estadoInfoIcon = document.querySelector('.password-info-icon');
    const estadoPopover = document.querySelector('.password-popover');
    
    if (estadoInfoIcon && estadoPopover) {
        estadoInfoIcon.addEventListener('mouseenter', function () {
            estadoPopover.style.display = 'block';
        });
        
        estadoInfoIcon.addEventListener('mouseleave', function () {
            estadoPopover.style.display = 'none';
        });
        
        // Evitar que el popover interfiera con el mouse
        estadoPopover.style.pointerEvents = 'none';
        
        // Asegurar que el popover esté oculto inicialmente
        estadoPopover.style.display = 'none';
    }
}

// Actualiza la función loadAuditHistory para manejar el estado de loading
function loadAuditHistory(ticketId, filter = 'all', page = 0) {
    const btnRefresh = document.getElementById('btnRefreshAudit');
    const auditTimeline = document.getElementById('auditTimeline');

    if (!auditTimeline)
        return;

    // Mostrar indicador de carga
    auditTimeline.innerHTML = `
        <div class="loading-audit">
            <i class="fas fa-spinner fa-spin"></i>
            <span>Cargando historial...</span>
        </div>
    `;

    // Construir URL con parámetros
    const url = `/api/auditoria/ticket/${ticketId}?page=${page}&size=20&filter=${filter}`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error HTTP ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (!data.success) {
                throw new Error(data.error || 'Error en los datos del historial');
            }

            if (!data.historial || !Array.isArray(data.historial)) {
                throw new Error('Formato de datos incorrecto');
            }

            renderAuditTimeline(data.historial, filter, data.totalPages, page, ticketId);
        })
        .catch(error => {
            console.error('Error cargando historial:', error);
            auditTimeline.innerHTML = `
                <div class="error-audit">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Error: ${error.message}</span>
                    <button onclick="loadAuditHistory(${ticketId}, '${filter}', ${page})" 
                            class="btn btn-sm btn-secondary mt-2">
                        <i class="fas fa-redo"></i> Reintentar
                    </button>
                </div>
            `;
        })
        .finally(() => {
            // Quitar clase de loading cuando termine
            if (btnRefresh) {
                btnRefresh.classList.remove('loading');
            }
        });
}

function renderAuditTimeline(historial, filter, totalPages = 1, currentPage = 0, ticketId) {
    const auditTimeline = document.getElementById('auditTimeline');
    if (!auditTimeline)
        return;

    // Filtrar según el tipo seleccionado
    const filteredItems = filter === 'all'
        ? historial
        : historial.filter(item => item.accion === filter);

    if (filteredItems.length === 0) {
        auditTimeline.innerHTML = `
            <div class="empty-audit text-center py-4">
                <i class="far fa-folder-open fa-3x text-muted mb-3"></i>
                <p class="text-muted">No hay registros de auditoría para este filtro</p>
            </div>
        `;
        return;
    }

    let html = '<div class="audit-timeline-container">';

    filteredItems.forEach((item) => {
        const fecha = new Date(item.fechaAccion);
        const fechaFormateada = fecha.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        // Determinar el icono, color y título según la acción
        let icono, colorClass, titulo, itemClass = '', mostrarCambios = false;
        switch (item.accion) {
            case 'CREACION':
                icono = 'fa-plus-circle';
                colorClass = 'text-success';
                titulo = 'Ticket creado';
                itemClass = 'creacion';
                break;
            case 'CANCELACION':
                icono = 'fa-times-circle';
                colorClass = 'text-danger';
                titulo = 'Ticket cancelado';
                itemClass = 'cancelacion';
                break;
            case 'ASIGNACION':
                // Verificar tipo de asignación
                if (item.detalle.includes('atendido directamente') || item.detalle.includes('atendio el ticket')) {
                    icono = 'fa-clipboard-check';
                    colorClass = 'text-primary';
                    titulo = 'El ticket fue atendido por';
                    itemClass = 'asignacion-directa';
                } else {
                    icono = 'fa-user-plus';
                    colorClass = 'text-primary';
                    titulo = 'Ticket asignado';
                    itemClass = 'asignacion';
                }
                mostrarCambios = true;
                break;
            case 'CAMBIO_PRIORIDAD':
                icono = 'fa-thumbtack';
                colorClass = 'text-info';
                titulo = 'Prioridad asignada';
                itemClass = 'cambio-prioridad';
                mostrarCambios = true;
                break;
            case 'RESPUESTA_PUBLICA':
                icono = 'fa-comment';
                colorClass = 'text-info';
                titulo = 'Respuesta pública añadida';
                itemClass = 'respuesta-publica';
                break;
            case 'NOTA_INTERNA':
                icono = 'fa-sticky-note';
                colorClass = 'text-warning';
                titulo = 'Nota interna añadida';
                itemClass = 'nota-interna';
                break;
            case 'ELIMINACION_RESPUESTA_PUBLICA':
                icono = 'fa-trash-alt';
                colorClass = 'text-danger';
                titulo = 'Respuesta pública eliminada';
                itemClass = 'eliminacion-respuesta';
                break;
            case 'ELIMINACION_NOTA_INTERNA':
                icono = 'fa-trash-alt';
                colorClass = 'text-warning';
                titulo = 'Nota interna eliminada';
                itemClass = 'eliminacion-nota';
                break;
            case 'CAMBIO_ESTADO':
                icono = 'fa-exchange-alt';
                colorClass = 'text-secondary';
                titulo = 'Cambio de estado';
                itemClass = 'cambio-estado';
                mostrarCambios = true;
                break;
            case 'ACTUALIZACION':
                icono = 'fa-pen';
                colorClass = 'text-info';
                titulo = 'Ticket actualizado';
                itemClass = 'actualizacion';
                mostrarCambios = true;
                break;
            case 'CIERRE':
                icono = 'fa-lock';
                colorClass = 'text-danger';
                titulo = item.detalle.includes('automáticamente') ? 'Ticket cerrado automáticamente' : 'Ticket cerrado';
                itemClass = 'cierre';
                mostrarCambios = true;
                break;
            case 'CIERRE_AUTOMATICO':
                icono = 'fa-robot';
                colorClass = 'text-dark';
                titulo = 'Ticket cerrado automáticamente';
                itemClass = 'cierre-automatico';
                mostrarCambios = true;
                break;
            case 'DESACTIVACION':
                icono = 'fa-ban';
                colorClass = 'text-danger';
                titulo = 'Ticket desactivado';
                itemClass = 'desactivacion';
                mostrarCambios = true;
                break;
            case 'REAPERTURA':
                icono = 'fa-undo';
                colorClass = 'text-warning';
                titulo = 'Ticket reabierto';
                itemClass = 'reapertura';
                mostrarCambios = true;
                break;
            default:
                icono = 'fa-info-circle';
                colorClass = 'text-secondary';
                titulo = item.accion;
                itemClass = 'otro';
        }

        // Construir el HTML para los cambios (old/new)
        let cambiosHtml = '';
        if ((mostrarCambios && item.valorAnterior && item.valorNuevo) ||
            item.accion.includes('ELIMINACION')) {

            // Caso especial para eliminación de mensajes
            if (item.accion.includes('ELIMINACION')) {
                cambiosHtml = `
                    <div class="audit-item-changes mt-2">
                        <div class="change-row">
                            <span class="change-label">Mensaje eliminado:</span>
                            <span class="text-eliminado">
                                ${formatAuditValue(item.valorAnterior.replace('Mensaje Eliminado: ', ''))}
                            </span>
                        </div>
                    </div>
                `;
            } else {
                // Caso normal para otros tipos de cambios
                cambiosHtml = `
                    <div class="audit-item-changes mt-2">
                        ${item.valorAnterior ? `
                        <div class="change-row">
                            <span class="change-label">Anterior:</span>
                            <span class="change-old">
                                ${formatAuditValue(item.valorAnterior)}
                            </span>
                        </div>` : ''}
                        ${item.valorNuevo ? `
                        <div class="change-row">
                            <span class="change-label">Nuevo:</span>
                            <span class="change-new">${formatAuditValue(item.valorNuevo)}</span>
                        </div>` : ''}
                    </div>
                `;
            }
        }

        html += `
            <div class="audit-item ${itemClass}">
                <div class="audit-item-badge ${colorClass}">
                    <i class="fas ${icono}"></i>
                </div>
                <div class="audit-item-content">
                    <div class="audit-item-header">
                        <span class="audit-item-title font-weight-bold">
                            ${titulo}
                        </span>
                        <span class="audit-item-time text-muted small">
                            ${fechaFormateada}
                        </span>
                    </div>
                    ${item.usuario ? `
                        <div class="audit-item-user text-muted small">
                            <i class="fas fa-user"></i> 
                            ${item.usuario.nombre} ${item.usuario.apellido}
                            <span class="user-code">#${item.usuario.codigo || 'Sin código'}</span>
                        </div>` : ''}
                    ${cambiosHtml}
                </div>
            </div>
        `;
    });

    html += '</div>';
    auditTimeline.innerHTML = html;
}

function getActionDescription(accion, detalle) {
    const acciones = {
        'CREACION': 'Ticket creado',
        'CANCELADO': 'Ticket Cancelado',
        'ACTUALIZACION': 'Ticket actualizado',
        'ASIGNACION': detalle || 'Ticket asignado',
        'RESPUESTA_PUBLICA': 'Respuesta pública añadida',
        'NOTA_INTERNA': 'Nota interna añadida',
        'ELIMINACION_RESPUESTA_PUBLICA': 'Respuesta pública eliminada',
        'ELIMINACION_NOTA_INTERNA': 'Nota interna eliminada',
        'CAMBIO_ESTADO': 'Cambio de estado',
        'CIERRE': 'Ticket cerrado',
        'CIERRE_AUTOMATICO': 'Ticket cerrado automáticamente',
        'DESACTIVACION': 'Ticket desactivado',
        'REAPERTURA': 'Ticket reabierto'
    };

    return acciones[accion] || accion;
}

function formatAuditValue(value) {
    if (!value)
        return '-';

    // Si es muy largo, truncar
    if (value.length > 100) {
        return value.substring(0, 100) + '...';
    }

    // Si parece un objeto serializado, intentar formatearlo
    if (value.includes('=') && value.includes(',')) {
        try {
            const lines = value.split(', ')
                .map(line => {
                    const parts = line.split('=');
                    return parts.length === 2
                        ? `<span class="change-field">${parts[0]}:</span> <span class="change-value">${parts[1]}</span>`
                        : line;
                })
                .join('<br>');
            return lines;
        } catch (e) {
            return value;
        }
    }

    return value;
}

// Configurar eventos al cargar la página
document.addEventListener('DOMContentLoaded', function () {
    // Manejar clics en los items de archivo
    document.addEventListener('click', function (e) {
        if (e.target.closest('.file-item')) {
            e.preventDefault();
            e.stopPropagation();

            const fileItem = e.target.closest('.file-item');
            const fileId = fileItem.getAttribute('data-id');
            const fileType = fileItem.getAttribute('data-type');
            const fileName = fileItem.getAttribute('data-name');

            // Obtener todos los archivos del ticket
            const fileItems = document.querySelectorAll('.file-item');
            currentFiles = Array.from(fileItems).map(item => ({
                id: item.getAttribute('data-id'),
                type: item.getAttribute('data-type'),
                name: item.getAttribute('data-name'),
                url: `/archivos/ver/${item.getAttribute('data-id')}`
            }));

            // Encontrar el índice del archivo seleccionado
            currentIndex = Array.from(fileItems).findIndex(item =>
                item.getAttribute('data-id') === fileId
            );

            // Mostrar el visor
            showFileViewer(`/archivos/ver/${fileId}`, fileType, fileName);

            // Cargar miniaturas
            loadThumbnails();
        }
    });

    // Cerrar visor al hacer clic en el botón de cerrar
    document.querySelector('.close-viewer').addEventListener('click', closeViewer);

    // Cerrar visor al hacer clic fuera del contenido
    document.getElementById('fileViewer').addEventListener('click', function (e) {
        if (e.target === this) {
            closeViewer();
        }
    });

    // Manejar teclado para navegación
    document.addEventListener('keydown', function (e) {
        const viewer = document.getElementById('fileViewer');
        if (viewer.classList.contains('active')) {
            if (e.key === 'ArrowLeft') {
                changeFile(-1);
            } else if (e.key === 'ArrowRight') {
                changeFile(1);
            } else if (e.key === 'Escape') {
                closeViewer();
            }
        }
    });

    // Configurar evento para cargar historial de auditoría
    setTimeout(() => {
        const ticketIdElement = document.getElementById('ticketId');
        const auditFilter = document.getElementById('auditFilter');

        if (ticketIdElement && ticketIdElement.value) {
            const ticketId = ticketIdElement.value;
            console.log('Cargando historial para ticket:', ticketId);

            // Cargar historial inicial
            loadAuditHistory(ticketId);

            // Configurar filtro
            if (auditFilter) {
                auditFilter.addEventListener('change', function () {
                    console.log('Filtro cambiado a:', this.value);
                    loadAuditHistory(ticketId, this.value);
                });
            }
        } else {
            console.error('No se encontró el ID del ticket');
        }
    }, 500);
});

/*Funcion para cambiar de paneles*/
document.addEventListener('DOMContentLoaded', function() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    // Configurar el estado inicial
    tabPanes.forEach(pane => {
        pane.style.display = 'none';
        pane.style.opacity = '40';
        pane.style.transform = 'translateY(0px)'; 
        pane.style.transition = 'all 0.3s ease';
    });
    
    // Mostrar el tab activo inicialmente (sin animación)
    const initialActivePane = document.querySelector('.tab-pane.active');
    if (initialActivePane) {
        initialActivePane.style.display = 'block';
        initialActivePane.style.opacity = '1';
        initialActivePane.style.transform = 'translateY(-10)';
    }
    
    // Función para cambiar de tab con animación de entrada solamente
    function switchTab(targetTab) {
        const targetPane = document.getElementById(targetTab);
        
        // Si ya está activo, no hacer nada
        if (targetPane.classList.contains('active')) {
            return;
        }
        
        // Cancelar edición si está activa
        if (!cancelarEdicionSiActiva()) {
            return;
        }
        
        // Ocultar todos los paneles inmediatamente (sin animación)
        tabPanes.forEach(pane => {
            pane.style.display = 'none';
            pane.classList.remove('active');
        });
        
        // Mostrar y animar el nuevo tab
        targetPane.style.display = 'block';
        targetPane.classList.add('active');
        
        // Reiniciar posición inicial para la animación (desde arriba)
        targetPane.style.opacity = '0';
        targetPane.style.transform = 'translateY(10px)';
        
        // Pequeño delay para permitir que el navegador procese el cambio de display
        setTimeout(() => {
            targetPane.style.opacity = '1';
            targetPane.style.transform = 'translateY(0)'; // Animación hacia abajo
            
            // Scroll al final si es el tab de chat
            if (targetTab === 'tab2') {
                const chatContainer = document.getElementById('chatMessagesContainer');
                if (chatContainer) {
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                }
            }
        }, 10);
    }
    
    // Configurar event listeners para los botones de tab
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Quitar clase active de todos los botones
            tabButtons.forEach(btn => btn.classList.remove('active'));
            
            // Agregar clase active al botón clickeado
            this.classList.add('active');
            
            // Cambiar al tab correspondiente con animación
            switchTab(targetTab);
        });
    });
    
    // Eliminar las clases de animación del CSS para los tabs
    const style = document.createElement('style');
    style.textContent = `
        .tab-pane {
            display: none;
        }
        .tab-pane.active {
            display: block;
        }
    `;
    document.head.appendChild(style);
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
    document.body.style.overflow = 'hidden';

    const prioridadActual = document.getElementById('prioridad').value;
    const selectPrioridad = document.getElementById('prioridadSelect');
    if (selectPrioridad) {
        selectPrioridad.value = prioridadActual;
    }
}

// Función para cerrar el modal de asignar prioridad
function closePrioridadModal() {
    const modalOverlay = document.getElementById('prioridadModalOverlay');
    modalOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Función para manejar el envío del formulario de prioridad
function handlePrioridadSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);
    const btnSubmit = form.querySelector('#btnActualizarPrioridad');

    // Mostrar indicador de carga
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';

    fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: {
            'Accept': 'application/json'
        }
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.error || 'Error al actualizar la prioridad');
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // Recargar la página para ver los cambios
                window.location.reload();
            } else {
                throw new Error(data.error || 'Error al actualizar la prioridad');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert(error.message); // Mostrar error simple con alert
        })
        .finally(() => {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = 'Actualizar Prioridad';
        });
}

// Configurar eventos al cargar la página
document.addEventListener('DOMContentLoaded', function () {
    // Configurar el formulario de prioridad
    const formPrioridad = document.getElementById('formAsignarPrioridad');
    if (formPrioridad) {
        formPrioridad.addEventListener('submit', handlePrioridadSubmit);
    }

    // Botón para cerrar el modal
    const closeModalBtn = document.getElementById('closePrioridadModalBtn');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closePrioridadModal);
    }

    // Cerrar al hacer clic fuera del modal
    const modalOverlay = document.getElementById('prioridadModalOverlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function (e) {
            if (e.target === modalOverlay) {
                closePrioridadModal();
            }
        });
    }
});

// Función para atender un ticket usando AJAX
function atenderTicket(ticketId) {
    fetch(`/tickets/atender/${ticketId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('input[name="_csrf"]').value
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Actualizar la interfaz
                document.getElementById('asignadoPara').value = data.asignadoParaNombre;

                // Recargar el historial de auditoría
                loadAuditHistory(ticketId);

                // Recargar la página para ver los cambios
                location.reload();
            } else {
                alert('Error: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al atender el ticket');
        });
}

// Función para inicializar TinyMCE con opciones personalizadas limitadas
function initTinyMCE() {
    if (tinymce.get('editor')) {
        tinymce.remove('editor');
    }

    tinymce.init({
        selector: '#editor',
        plugins: 'autolink lists link searchreplace visualblocks code fullscreen help wordcount',
        toolbar: 'undo redo | bold italic underline strikethrough | link | numlist bullist | help',
        menubar: false,
        height: 200,
        branding: false,

        // Configuración mejorada de formatos
        forced_root_block: 'p',
        br_in_pre: false,
        block_formats: 'Paragraph=p;Heading 1=h1;Heading 2=h2',

        // Configuración explícita de formatos para evitar iconos residuales
        formats: {
            bold: {inline: 'strong'},
            italic: {inline: 'em'},
            underline: {inline: 'span', styles: {'text-decoration': 'underline'}},
            strikethrough: {
                inline: 'span',
                styles: {'text-decoration': 'line-through'},
                // Removemos exact: true y clear_child_styles para permitir toggle
                remove: 'all'
            }
        },

        // Configuración de estilos
        style_formats: [
            {title: 'Bold', format: 'bold'},
            {title: 'Italic', format: 'italic'},
            {title: 'Underline', format: 'underline'},
            {title: 'Strikethrough', format: 'strikethrough'}
        ],

        // Configuración de limpieza
        valid_elements: '*[*]',
        valid_children: '+body[style]',
        extended_valid_elements: 'span[style|class],a[href|target|rel]',
        convert_fonts_to_spans: false,

        setup: function (editor) {
            editor.on('init', function () {
                // Limpiar formatos al cambiar
                editor.on('change', function () {
                    const content = editor.getContent();
                    document.getElementById('respuesta').value = content;
                    document.getElementById('respuestaTexto').value = editor.getContent({format: 'text'});
                });

                // Inyectar CSS en el iframe del editor
                var iframe = document.querySelector('.tox-edit-area iframe');
                if (iframe && iframe.contentDocument) {
                    var style = iframe.contentDocument.createElement('style');
                    style.innerHTML = `
                    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap');
                    body, body * {
                        font-family: "Poppins", sans-serif !important;
                    }
                `;
                    iframe.contentDocument.head.appendChild(style);
                }

                // Custom handler para strikethrough toggle mejorado
                editor.on('ExecCommand', function (e) {
                    if (e.command === 'mceToggleFormat' && e.value === 'strikethrough') {
                        // Pequeño delay para permitir que el comando se ejecute primero
                        setTimeout(function () {
                            // Limpiar spans vacíos que puedan quedar
                            const emptySpans = editor.dom.select('span:not([style]):empty');
                            emptySpans.forEach(span => editor.dom.remove(span));

                            // Limpiar spans con solo estilos de background residuales
                            const bgSpans = editor.dom.select('span[style*="background"]');
                            bgSpans.forEach(span => {
                                const style = span.getAttribute('style');
                                if (style && !style.includes('line-through')) {
                                    editor.dom.remove(span, true); // true = mantener contenido
                                }
                            });
                        }, 10);
                    }
                });
            });

            // Ocultar botones no deseados
            editor.on('init', function () {
                const toolbar = editor.getContainer().querySelector('.tox-toolbar');
                if (toolbar) {
                    const unwantedButtons = [
                        '[title="Font sizes"]',
                        '[title="Fonts"]',
                        '[title="Paragraphs"]',
                        '[title="Line height"]',
                        '[title="Align left"]',
                        '[title="Align center"]',
                        '[title="Align right"]',
                        '[title="Justify"]',
                        '[title="Blocks"]',
                        '[title="Font family"]'
                    ];

                    unwantedButtons.forEach(selector => {
                        const button = toolbar.querySelector(selector);
                        if (button)
                            button.style.display = 'none';
                    });
                }
            });
        },

        // Estilos CSS críticos para eliminar la figura azul
        content_style: `
            body { 
                font-family: "Poppins", sans-serif; 
                font-size: 13px; 
                line-height: 1.5; 
                color: #333;
                margin: 0;
                padding: 10px;
            }
            /* Eliminar márgenes de los párrafos */
            p { 
                margin: 0 !important; 
                padding: 0 !important;
            }
            h1, h2, h3, h4, h5, h6 { 
                margin: 10px 0; 
                font-weight: 600; 
                color: #222; 
            }
            ul, ol { margin: 10px 0; padding-left: 25px; }
            li { margin-bottom: 5px; }
            a { color: #007bff; text-decoration: underline; }
            a:hover { color: #0056b3; }
            hr { border: 0; height: 1px; background-color: #ddd; margin: 15px 0; }
            /* Estilos más específicos para strikethrough */
            span[style*="line-through"] {
                text-decoration: line-through !important;
                background-color: transparent !important;
                background-image: none !important;
                box-shadow: none !important;
                border: none !important;
            }
            /* Limpiar cualquier span vacío */
            span:empty {
                display: none;
            }
        `,

        // Configuración adicional de seguridad
        paste_as_text: true,
        entity_encoding: 'raw',
        trim_whitespace: true,
        end_container_on_empty_block: true
    });
}

// Función para enviar respuesta
function responderTicket(event) {
    event.preventDefault();

    const editor = tinymce.get('editor');
    if (!editor) {
        console.error('Editor TinyMCE no está inicializado');
        return;
    }

    // Obtener contenido HTML y texto plano
    let contenidoHTML = editor.getContent().trim();
    let contenidoTexto = editor.getContent({format: 'text'}).trim();

    // Validar contenido
    if (!contenidoTexto) {
        alert('Por favor escribe un mensaje antes de enviar.');
        return;
    }

    // Obtener si es nota interna
    const esNotaInterna = document.getElementById('esNotaInterna').value === 'true';

    // Actualizar campos del formulario
    document.querySelector('input[name="respuesta"]').value = contenidoHTML;
    document.querySelector('input[name="respuestaTexto"]').value = contenidoTexto;

    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

    // Enviar como FormData para manejar ambos campos
    const formData = new FormData(form);

    fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: {
            'Accept': 'application/json'
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
                // Obtener el ID del ticket y el término de búsqueda actual
                const ticketId = document.getElementById('ticketId').value;
                const searchTerm = document.getElementById('searchMessages').value.trim();

                // Recargar mensajes manteniendo el filtro actual
                loadMessages(ticketId, searchTerm);

                // Limpiar el editor
                editor.setContent('');

                // Restablecer el tipo de respuesta a público si era nota interna
                if (esNotaInterna) {
                    document.getElementById('responseType').textContent = 'Respuesta Pública';
                    document.getElementById('esNotaInterna').value = 'false';
                }
            } else {
                throw new Error(data.error || 'Error al enviar el mensaje');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('Error al enviar el mensaje: ' + error.message);
        })
        .finally(() => {
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Respuesta';
        });
}

// Función para actualizar el estado del área de respuesta
function actualizarEstadoAreaRespuesta() {
    const ticketEstado = document.querySelector('input#estado')?.value || document.querySelector('select#estado')?.value;
    const textarea = document.getElementById('respuesta');
    const submitButton = document.querySelector('#formResponderTicket button[type="submit"]');
    const responseTypeButton = document.getElementById('responseType');
    const statusMessage = document.querySelector('.status-message');

    // Si no hay estado definido, salir de la función
    if (!ticketEstado)
        return;

    // Bloquear completamente si el estado es Desactivado
    if (ticketEstado === 'Desactivado') {
        if (textarea) {
            textarea.disabled = true;
            textarea.placeholder = 'Este ticket está desactivado. Por lo que no se aceptan mas mensajes.';
        }
        if (submitButton)
            submitButton.disabled = true;
        if (responseTypeButton)
            responseTypeButton.disabled = true;

        if (statusMessage) {
            statusMessage.style.display = 'flex';
            statusMessage.querySelector('span').textContent = 'Este ticket está desactivado. Por lo que no se aceptan mas mensajes.';
            statusMessage.className = 'status-message info';
        }
        return;
    }
}

// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', function () {
    // Cargar TinyMCE desde WebJars
    const script = document.createElement('script');
    script.src = '/webjars/tinymce/6.8.3/tinymce.min.js';
    script.onload = function () {
        // Inicializar TinyMCE después de cargar el script
        initTinyMCE();

        // Configurar el evento submit del formulario
        const formResponderTicket = document.getElementById('formResponderTicket');
        if (formResponderTicket) {
            formResponderTicket.addEventListener('submit', responderTicket);
        }
    };
    document.head.appendChild(script);

    // Inicializar estado del área de respuesta
    actualizarEstadoAreaRespuesta();

    // Observar cambios en el estado del ticket
    const selectEstado = document.querySelector('select#estado');
    if (selectEstado) {
        selectEstado.addEventListener('change', actualizarEstadoAreaRespuesta);
    }

    // Observar cambios en la asignación
    const asignadoPara = document.getElementById('asignadoPara');
    if (asignadoPara) {
        const observer = new MutationObserver(actualizarEstadoAreaRespuesta);
        observer.observe(asignadoPara, {attributes: true, attributeFilter: ['value']});
    }
});

function bloquearElementosRespuesta() {
    // Obtener el estado ACTUAL del ticket (usando el input hidden)
    const estadoTicket = document.getElementById('estadoTicket')?.value;
    const usuarioActualId = document.getElementById('usuarioActualId')?.value;
    const usuarioRol = document.getElementById('usuarioActualRol')?.value;
    const solicitanteId = document.getElementById('solicitanteId')?.value;

    if (!estadoTicket)
        return;

    // Elementos a controlar
    const btnEnviar = document.querySelector('#formResponderTicket button[type="submit"]');
    const btnTipoRespuesta = document.getElementById('responseType');
    const editor = document.querySelector('.tox-edit-area');
    const esNotaInternaInput = document.getElementById('esNotaInterna');

    // Estados que requieren bloqueo TOTAL (Desactivado)
    const estadosBloqueoTotal = ['Desactivado'];
    // Estados que permiten solo NOTAS INTERNAS (Resuelto)
    const estadoSoloNotas = ['Resuelto'];

    const debeBloquearTotal = estadosBloqueoTotal.includes(estadoTicket);
    const permiteSoloNotas = estadoSoloNotas.includes(estadoTicket);

    // Si el ticket está Cerrado, solo permitir a administradores
    const esCerrado = estadoTicket === 'Cerrado';
    const esAdmin = usuarioRol === 'ROL_ADMINISTRADOR';

    // 1. Bloqueo TOTAL (Ticket Desactivado)
    if (debeBloquearTotal) {
        if (btnEnviar) {
            btnEnviar.disabled = true;
            btnEnviar.style.opacity = '0.5';
            btnEnviar.style.cursor = 'not-allowed';
        }

        if (btnTipoRespuesta) {
            btnTipoRespuesta.disabled = true;
            btnTipoRespuesta.style.opacity = '0.5';
            btnTipoRespuesta.style.cursor = 'not-allowed';
            btnTipoRespuesta.onclick = null;
        }

        if (editor) {
            editor.style.pointerEvents = 'none';
            editor.style.opacity = '0.5';
            tinymce.get('editor')?.setMode('readonly');
        }
    }
    // 2. Solo NOTAS INTERNAS (Ticket Resuelto)
    else if (permiteSoloNotas) {
        if (btnEnviar) {
            btnEnviar.disabled = false;
            btnEnviar.style.opacity = '1';
            btnEnviar.style.cursor = 'pointer';
        }

        if (btnTipoRespuesta) {
            btnTipoRespuesta.textContent = 'Nota Interna';
            esNotaInternaInput.value = 'true';
        }

        if (editor) {
            editor.style.pointerEvents = 'auto';
            editor.style.opacity = '1';
            tinymce.get('editor')?.setMode('design');
        }
    }
    // 3. Ticket CERRADO (Solo Admin puede interactuar)
    else if (esCerrado) {
        const esCreador = usuarioActualId == solicitanteId;
        const habilitarParaAdmin = esAdmin;
        const habilitarParaCreadorSoporte = esCreador && esSoportista;

        if (btnEnviar) {
            const habilitar = habilitarParaAdmin || habilitarParaCreadorSoporte;
            btnEnviar.disabled = !habilitar;
            btnEnviar.style.opacity = habilitar ? '1' : '0.5';
            btnEnviar.style.cursor = habilitar ? 'pointer' : 'not-allowed';
        }

        if (btnTipoRespuesta) {
            if (habilitarParaCreadorSoporte) {
                // Forzar nota interna para el creador soportista
                btnTipoRespuesta.textContent = 'Nota Interna';
                esNotaInternaInput.value = 'true';
                btnTipoRespuesta.disabled = true;
                btnTipoRespuesta.style.opacity = '0.5';
                btnTipoRespuesta.style.cursor = 'not-allowed';
            } else if (habilitarParaAdmin) {
                btnTipoRespuesta.disabled = false;
                btnTipoRespuesta.style.opacity = '1';
                btnTipoRespuesta.style.cursor = 'pointer';
                btnTipoRespuesta.onclick = toggleResponseType;
            } else {
                btnTipoRespuesta.disabled = true;
                btnTipoRespuesta.style.opacity = '0.5';
                btnTipoRespuesta.style.cursor = 'not-allowed';
            }
        }

        if (editor) {
            const habilitar = habilitarParaAdmin || habilitarParaCreadorSoporte;
            editor.style.pointerEvents = habilitar ? 'auto' : 'none';
            editor.style.opacity = habilitar ? '1' : '0.5';
            tinymce.get('editor')?.setMode(habilitar ? 'design' : 'readonly');
        }
    }
    // 4. Ticket ABIERTO/PENDIENTE (Totalmente habilitado)
    else {
        if (btnEnviar) {
            btnEnviar.disabled = false;
            btnEnviar.style.opacity = '1';
            btnEnviar.style.cursor = 'pointer';
        }

        if (btnTipoRespuesta) {
            btnTipoRespuesta.disabled = false;
            btnTipoRespuesta.style.opacity = '1';
            btnTipoRespuesta.style.cursor = 'pointer';
            btnTipoRespuesta.onclick = toggleResponseType;
            btnTipoRespuesta.textContent = 'Respuesta Pública';
            esNotaInternaInput.value = 'false';
        }

        if (editor) {
            editor.style.pointerEvents = 'auto';
            editor.style.opacity = '1';
            tinymce.get('editor')?.setMode('design');
        }
    }
}

// Mantener el observador de cambios del método anterior
function iniciarObservadorEstado() {
    const estadoElement = document.querySelector('input#estado') || document.querySelector('select#estado');
    if (estadoElement) {
        const observer = new MutationObserver(bloquearElementosRespuesta);
        observer.observe(estadoElement, {attributes: true, attributeFilter: ['value']});
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    bloquearElementosRespuesta();
    iniciarObservadorEstado();

    if (typeof tinymce !== 'undefined') {
        tinymce.init({
            selector: '#editor',
            setup: (editor) => {
                editor.on('init', bloquearElementosRespuesta);
            }
        });
    }
});

// Lógica para manejar cambios AJAX (si es necesario)
document.addEventListener('ticketStateChanged', bloquearElementosRespuesta);

// Función para verificar la prioridad y usuario asignado antes de mostrar el modal de cierre
function verificarPrioridadYCerrar() {
    const prioridad = document.getElementById('prioridad').value;
    const asignadoPara = document.getElementById('asignadoPara').value;

    if (prioridad === 'Sin Asignar' && asignadoPara === 'Sin Asignar') {
        // Mostrar modal de error si no hay prioridad ni usuario asignado
        showErrorModal('Para cerrar un ticket primero debe asignar una prioridad y un usuario responsable.');
    } else if (prioridad === 'Sin Asignar') {
        // Mostrar modal de error si no hay prioridad asignada
        showErrorModal('Para cerrar un ticket primero se le debe asignar un nivel de prioridad.');
    } else if (asignadoPara === 'Sin Asignar') {
        // Mostrar modal de error si no hay usuario asignado
        showErrorModal('Para cerrar un ticket primero debe asignar un usuario responsable.');
    } else {
        // Mostrar modal de confirmación si hay prioridad y usuario asignado
        openResolveTicketModal();
    }
}

// Función para mostrar modal de error con mensaje personalizado
function showErrorModal(message) {
    const modalOverlay = document.getElementById('errorPriorityModalOverlay');
    const modalBody = modalOverlay.querySelector('.modal-body p');

    modalBody.textContent = message;
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Función para abrir el modal de confirmación de cierre
function openResolveTicketModal() {
    const modalOverlay = document.getElementById('resolveTicketModalOverlay');
    modalOverlay.classList.add('active');
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

// Función para cerrar el modal de error de prioridad/usuario
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

function openReabrirTicketModal() {
    const modal = document.getElementById('reabrirTicketModal');
    modal.classList.add('active');
}

function closeReabrirTicketModal() {
    const modal = document.getElementById('reabrirTicketModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Función para abrir el modal de confirmación de desactivación
function openDeactivateTicketModal() {
    const modalOverlay = document.getElementById('deactivateTicketModalOverlay');
    modalOverlay.classList.add('active');
}

// Función para cerrar el modal de confirmación de desactivación
function closeDeactivateTicketModal() {
    const modalOverlay = document.getElementById('deactivateTicketModalOverlay');
    modalOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Función para confirmar la desactivación del ticket
function confirmDeactivateTicket() {
    const ticketId = document.getElementById('ticketId').value;
    const csrfToken = document.querySelector('input[name="_csrf"]').value;

    // Mostrar indicador de carga
    const btnDesactivar = document.querySelector('#deactivateTicketModalOverlay .btn-danger');
    btnDesactivar.disabled = true;
    btnDesactivar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Desactivando...';

    fetch(`/tickets/desactivar/${ticketId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrfToken
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al desactivar el ticket');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                window.location.reload();
            } else {
                throw new Error(data.error || 'Error al desactivar el ticket');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert(error.message);
            // Restaurar botón
            btnDesactivar.disabled = false;
            btnDesactivar.innerHTML = 'Desactivar Ticket';
        });
}

// Configuración inicial del modal de desactivación
document.addEventListener('DOMContentLoaded', function () {
    // Cerrar el modal de desactivación al hacer clic fuera del contenido
    const deactivateModalOverlay = document.getElementById('deactivateTicketModalOverlay');
    if (deactivateModalOverlay) {
        deactivateModalOverlay.addEventListener('click', function (event) {
            if (event.target === deactivateModalOverlay) {
                closeDeactivateTicketModal();
            }
        });
    }
});

/* Método para actualizar ticket - modo edición */
function toggleEditMode() {
    const tab1Button = document.querySelector('.tab-button[data-tab="tab1"]');
    if (tab1Button && !tab1Button.classList.contains('active')) {
        tab1Button.click();
    }

    isEditMode = !isEditMode;

    const camposEditables = [
        'breveDescripcion',
        'descripcion',
        'codigo',
        'impacto',
        'categoria',
        'prioridad',
        'estado'
    ];

    // Alternar el estado de los campos específicos
    camposEditables.forEach(id => {
        const field = document.getElementById(id);
        if (field) {
            if (isEditMode) {
                field.removeAttribute('readonly');
                field.classList.remove('no-interaction');
                if (field.tagName === 'SELECT') {
                    field.disabled = false;
                }
            } else {
                field.setAttribute('readonly', '');
                // Aplicar la clase solo si es un SELECT
                if (field.tagName === 'SELECT') {
                    field.classList.add('no-interaction');
                } else {
                    field.classList.remove('no-interaction');
                }
            }
        }
    });

    // Mostrar/ocultar botones según el modo
    const backButtons = document.querySelectorAll('.back-button-container button:not(#btnGuardarCambios):not(#btnCancelarEdicion)');
    const saveButton = document.getElementById('btnGuardarCambios');
    const cancelButton = document.getElementById('btnCancelarEdicion');

    if (isEditMode) {
        // Ocultar todos los botones excepto guardar y cancelar
        backButtons.forEach(button => {
            button.style.display = 'none';
        });

        // Crear o mostrar botón de cancelar
        if (!cancelButton) {
            const btnCancelar = document.createElement('button');
            btnCancelar.id = 'btnCancelarEdicion';
            btnCancelar.className = 'btn btn-outline-danger';
            btnCancelar.innerHTML = '<i class="fa-solid fa-xmark"></i> Cancelar';
            btnCancelar.onclick = cancelarEdicion;

            document.querySelector('.back-button-container').appendChild(btnCancelar);
        } else {
            cancelButton.style.display = 'inline-block';
        }

        // Crear o mostrar botón de guardar
        if (!saveButton) {
            const btnGuardar = document.createElement('button');
            btnGuardar.id = 'btnGuardarCambios';
            btnGuardar.className = 'btn btn-primary';
            btnGuardar.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar Cambios';
            btnGuardar.onclick = guardarCambiosTicket;

            document.querySelector('.back-button-container').appendChild(btnGuardar);
        } else {
            saveButton.style.display = 'inline-block';
        }
    } else {
        // Mostrar todos los botones originales
        backButtons.forEach(button => {
            button.style.display = 'inline-block';
        });

        // Ocultar botones de guardar y cancelar
        if (saveButton)
            saveButton.style.display = 'none';
        if (cancelButton)
            cancelButton.style.display = 'none';
    }
}

/* Función para guardar los cambios del ticket */
function guardarCambiosTicket() {
    const ticketId = document.getElementById('ticketId').value;
    const csrfToken = document.querySelector('input[name="_csrf"]').value;

    // Recopilar datos del formulario
    const datosActualizados = {
        codigo: document.getElementById('codigo').value,
        impacto: document.getElementById('impacto').value,
        categoria: document.getElementById('categoria').value,
        prioridad: document.getElementById('prioridad').value,
        estado: document.getElementById('estado').value,
        titulo: document.getElementById('breveDescripcion').value,
        descripcion: document.getElementById('descripcion').value
    };

    // Mostrar indicador de carga
    const btnGuardar = document.getElementById('btnGuardarCambios');
    const btnCancelar = document.getElementById('btnCancelarEdicion');
    btnGuardar.disabled = true;
    btnCancelar.disabled = true;
    btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

    // Enviar datos al servidor
    fetch(`/tickets/actualizar/${ticketId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrfToken
        },
        body: JSON.stringify(datosActualizados)
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
                // Salir del modo edición
                toggleEditMode();
                // Recargar la página para ver los cambios
                window.location.reload();
            } else {
                throw new Error(data.error || 'Error al actualizar el ticket');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert(error.message);
            // Restaurar botones
            btnGuardar.disabled = false;
            btnCancelar.disabled = false;
            btnGuardar.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar Cambios';
        });
}

/* Función para cancelar la edición */
function cancelarEdicion() {
    if (confirm('¿Estás seguro de que quieres cancelar la edición? Los cambios no guardados se perderán.')) {
        // Restaurar valores originales
        for (const id in originalValues) {
            const field = document.getElementById(id);
            if (field)
                field.value = originalValues[id];
        }

        // Salir del modo edición
        toggleEditMode();
    }
}

/* Función para verificar si hay cambios sin guardar al cambiar de pestaña */
function cancelarEdicionSiActiva() {
    if (isEditMode) {
        cancelarEdicion();
        return false; // Prevenir el cambio de pestaña si el usuario cancela
    }
    return true;
}

/* Evento para el botón de Actualizar Ticket */
document.addEventListener('DOMContentLoaded', function () {
    const btnActualizarTicket = document.querySelector('[data-bs-target="#elevateTicketModal"]');
    if (btnActualizarTicket) {
        btnActualizarTicket.onclick = toggleEditMode;
    }

    // Modificar la función de cambio de pestañas para incluir la cancelación de edición
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(button => {
        button.addEventListener('click', function () {
            if (!cancelarEdicionSiActiva())
                return;

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

// Función para refrescar los mensajes
function refreshMessages() {
    const btnRefresh = document.getElementById('btnRefreshMessages');
    const ticketId = document.getElementById('ticketId').value;
    const searchInput = document.getElementById('searchMessages');
    const searchTerm = searchInput ? searchInput.value.trim() : null;

    // Agregar clase de loading
    btnRefresh.classList.add('loading');

    // Recargar mensajes
    loadMessages(ticketId, searchTerm);

    // Quitar clase de loading después de 1 segundo (o cuando termine la carga)
    setTimeout(() => {
        btnRefresh.classList.remove('loading');
    }, 1000);
}

// Función para refrescar el historial de auditoría
function refreshAuditHistory() {
    const btnRefresh = document.getElementById('btnRefreshAudit');
    const ticketId = document.getElementById('ticketId').value;
    const auditFilter = document.getElementById('auditFilter');
    const filterValue = auditFilter ? auditFilter.value : 'all';

    // Agregar clase de loading
    if (btnRefresh) {
        btnRefresh.classList.add('loading');
    }

    // Recargar historial
    loadAuditHistory(ticketId, filterValue);

    // Quitar clase de loading después de 1 segundo (o cuando termine la carga)
    setTimeout(() => {
        if (btnRefresh) {
            btnRefresh.classList.remove('loading');
        }
    }, 1000);
}

// Configurar el evento click en el botón de refresh
document.addEventListener('DOMContentLoaded', function () {
    const btnRefresh = document.getElementById('btnRefreshMessages');
    if (btnRefresh) {
        btnRefresh.addEventListener('click', refreshMessages);
    }

    const btnRefreshAudit = document.getElementById('btnRefreshAudit');
    if (btnRefreshAudit) {
        btnRefreshAudit.addEventListener('click', refreshAuditHistory);
    }
});

// Función para cargar mensajes con manejo de errores mejorado
function loadMessages(ticketId, searchTerm = null) {
    // Validar que exista el ticketId
    if (!ticketId) {
        console.error('No se proporcionó un ID de ticket válido');
        showEmptyState();
        return;
    }

    const btnRefresh = document.getElementById('btnRefreshMessages');
    const filterType = document.getElementById('messageFilter').value;
    const url = `/tickets/mensajes/${ticketId}?filtro=${filterType}` +
        (searchTerm ? `&busqueda=${encodeURIComponent(searchTerm)}` : '');

    // Mostrar indicador de carga
    const container = document.getElementById('chatMessagesContainer');
    if (container) {
        container.innerHTML = `
            <div class="loading-messages">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Cargando mensajes...</span>
            </div>
        `;
    }

    // Agregar timeout para evitar carga infinita
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
            reject(new Error('Tiempo de espera agotado al cargar mensajes'));
        }, 10000); // 10 segundos de timeout
    });

    Promise.race([
        fetch(url, {
            headers: {
                'Accept': 'application/json'
            },
            credentials: 'include'
        }),
        timeoutPromise
    ])
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (!data || !data.success) {
                throw new Error(data?.error || 'Respuesta inválida del servidor');
            }

            // Actualizar el contador con el filtro actual PRIMERO
            updateTotalMessageCounter(data.mensajes?.length || 0, filterType, searchTerm);

            // Renderizar los mensajes filtrados
            renderMessages(data.mensajes);

            // Mostrar mensaje si no hay resultados pero sí hay búsqueda/filtro
            if ((searchTerm || filterType !== 'all') && data.mensajes.length === 0) {
                showNoResultsMessage(searchTerm, filterType);
            }
        })
        .catch(error => {
            console.error('Error al cargar mensajes:', error);
            showToast('Error al cargar mensajes: ' + error.message);
            showEmptyState();
            // Resetear contador en caso de error
            updateTotalMessageCounter(0, filterType, searchTerm);
        })
        .finally(() => {
            if (btnRefresh) {
                btnRefresh.classList.remove('loading');
            }
        });
}

// Función auxiliar para actualizar el contador total
function updateTotalMessageCounter(count, filterType, searchTerm = null) {
    const counterElement = document.getElementById('totalMessagesCounter');
    if (!counterElement)
        return;

    let countText = count.toString();

    counterElement.textContent = `(${countText} Mensajes)`;
}

// Función para mostrar estado vacío
function showEmptyState() {
    const container = document.getElementById('chatMessagesContainer');
    if (container) {
        container.innerHTML = `
            <div class="empty-messages-placeholder">
                <i class="far fa-comment-dots"></i>
                <p>No hay mensajes para mostrar</p>
                <small>Cuando envíes o recibas mensajes, aparecerán aquí</small>
            </div>
        `;
    }
}

// Función para mostrar mensaje cuando no hay resultados de búsqueda/filtro
function showNoResultsMessage(searchTerm, filterType) {
    const container = document.getElementById('chatMessagesContainer');
    if (!container)
        return;

    let message = 'No se encontraron mensajes';
    let submessage = 'Intenta con otros términos de búsqueda o ajusta los filtros';

    if (searchTerm) {
        message = `No hay resultados para "${searchTerm}"`;
    } else if (filterType !== 'all') {
        const filterText = {
            'usuario': 'del solicitante',
            'soporte': 'del equipo de soporte',
            'notas': 'notas internas'
        }[filterType];
        message = `No hay ${filterText} para mostrar`;
    }

    container.innerHTML = `
        <div class="empty-messages-placeholder">
            <i class="fas fa-search"></i>
            <p>${message}</p>
            <small>${submessage}</small>
        </div>
    `;
}

// Función para renderizar mensajes
function renderMessages(mensajes) {
    const container = document.getElementById('chatMessagesContainer');
    if (!container)
        return;

    // Limpiar contenedor
    container.innerHTML = '';

    if (!mensajes || mensajes.length === 0) {
        showEmptyState();
        return;
    }

    // Ordenar mensajes del más antiguo al más reciente (para que el scroll quede abajo)
    const mensajesOrdenados = [...mensajes].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    mensajesOrdenados.forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.className = msg.esNotaInterna ? 'message internal-note' : 'message';
        messageDiv.setAttribute('data-id', msg.id);
        messageDiv.setAttribute('data-user', msg.esMio);

        // Determinar rol y clase CSS
        let rolTexto = 'Usuario';
        let rolClase = 'role-usuario';

        if (msg.emisor.rol) {
            if (msg.emisor.rol.includes('ADMINISTRADOR')) {
                rolTexto = 'Administrador';
                rolClase = 'role-admin';
            } else if (msg.emisor.rol.includes('SOPORTISTA')) {
                rolTexto = 'Soporte';
                rolClase = 'role-soporte';
            }
        }

        // Construir HTML del mensaje
        messageDiv.innerHTML = `
            <div class="message-header">
                <div class="user-avatar">
                    <img src="${msg.emisor.tieneImagen ? `/usuario/imagen/${msg.emisor.id}` : '/img/ImagenDefaultPerfil.jpg'}" 
                         alt="Foto de perfil"
                         onerror="this.src='/img/ImagenDefaultPerfil.jpg'">
                </div>
                <div class="message-info">
                    <span class="user-name-message">${msg.emisor.nombre} ${msg.emisor.apellido}</span>
                    <span class="message-time">${formatDateTime(msg.fecha)}</span>
                </div>
                <span class="user-role ${rolClase}">${rolTexto}</span>
            </div>
            <div class="message-content">${msg.contenido}</div>
            ${msg.esMio ? `
            <div class="message-footer">
                <button class="btn-delete-message" data-id="${msg.id}">
                    <i class="fas fa-trash-alt"></i> Eliminar
                </button>
            </div>` : ''}
        `;

        container.appendChild(messageDiv);
    });

    // Scroll al final
    container.scrollTop = container.scrollHeight;
}

// Función auxiliar para formatear fecha
function formatDateTime(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    } catch (e) {
        console.error('Error al formatear fecha:', e);
        return dateString;
    }
}

// Función para eliminar mensaje
function eliminarMensaje(messageId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este mensaje?')) {
        return;
    }

    fetch(`/mensajes/${messageId}`, {
        method: 'DELETE',
        headers: {
            'Accept': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('input[name="_csrf"]')?.value || ''
        },
        credentials: 'include'
    })
        .then(response => response.json())
        .then(data => {
            if (data?.success) {
                // Eliminar el mensaje del DOM
                const messageElement = document.querySelector(`.message[data-id="${messageId}"]`);
                if (messageElement) {
                    messageElement.remove();
                }

                // Recargar mensajes para actualizar contadores correctamente
                const ticketId = document.getElementById('ticketId')?.value;
                const searchTerm = document.getElementById('searchMessages')?.value.trim() || null;
                if (ticketId) {
                    loadMessages(ticketId, searchTerm);
                }

                showToast('Mensaje eliminado correctamente');
            } else {
                throw new Error(data?.error || 'Error al eliminar el mensaje');
            }
        })
        .catch(error => {
            console.error('Error al eliminar mensaje:', error);
            showToast('Error al eliminar el mensaje: ' + error.message);
        });
}

// Configuración inicial al cargar la página
document.addEventListener('DOMContentLoaded', function () {
    // Verificar que existan los elementos necesarios
    const ticketIdElement = document.getElementById('ticketId');
    if (!ticketIdElement) {
        console.error('No se encontró el elemento con el ID del ticket');
        return;
    }

    const ticketId = ticketIdElement.value;
    if (!ticketId) {
        console.error('No se encontró el ID del ticket');
        return;
    }

    // Configurar eventos de búsqueda
    const searchInput = document.getElementById('searchMessages');
    if (searchInput) {
        // Configurar el evento input para búsqueda en tiempo real
        searchInput.addEventListener('input', handleSearchInput);
    }

    // Configurar filtro
    const messageFilter = document.getElementById('messageFilter');
    if (messageFilter) {
        messageFilter.addEventListener('change', () => {
            const searchTerm = searchInput?.value.trim() || null;
            loadMessages(ticketId, searchTerm);
        });
    }

    // Configurar delegación de eventos para eliminar mensajes
    const chatContainer = document.getElementById('chatMessagesContainer');
    if (chatContainer) {
        chatContainer.addEventListener('click', function (e) {
            const deleteBtn = e.target.closest('.btn-delete-message');
            if (deleteBtn) {
                const messageId = deleteBtn.dataset.id;
                if (messageId) {
                    eliminarMensaje(messageId);
                }
            }
        });
    }

    // Cargar mensajes iniciales
    loadMessages(ticketId);
});

// Función para actualizar el tiempo restante para cierre automático
function actualizarTiempoCierre() {
    const ticketId = document.getElementById('ticketId').value;
    const estadoTicket = document.querySelector('input#estado')?.value ||
        document.querySelector('select#estado')?.value;

    // Solo actualizar si el ticket está en estado Resuelto
    if (estadoTicket === 'Resuelto') {
        fetch(`/tickets/tiempoCierre/${ticketId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const tiempoElement = document.getElementById('tiempoCierreRestante');
                    if (data.cerradoAutomaticamente) {
                        tiempoElement.textContent = "Se cerrará pronto";
                        tiempoElement.classList.add('text-warning');
                    } else if (data.horasRestantes > 0) {
                        // Verificar si es singular o plural
                        const textoHoras = data.horasRestantes === 1 ? "Hora" : "horas";
                        tiempoElement.textContent = `${data.horasRestantes} ${textoHoras}`;

                        tiempoElement.classList.remove('text-warning');
                        tiempoElement.classList.add('text-success');
                    } else {
                        tiempoElement.textContent = "Se cerrará pronto";
                        tiempoElement.classList.add('text-warning');
                    }
                }
            })
            .catch(error => {
                console.error('Error al obtener tiempo de cierre:', error);
            });
    }
}

// Actualizar inmediatamente al cargar la página
document.addEventListener('DOMContentLoaded', function () {
    actualizarTiempoCierre();

    // Actualizar cada minuto
    setInterval(actualizarTiempoCierre, 60000);
});

// También actualizar cuando cambie el estado del ticket (si es editable)
const selectEstado = document.querySelector('select#estado');
if (selectEstado) {
    selectEstado.addEventListener('change', function () {
        actualizarTiempoCierre();
    });
}




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