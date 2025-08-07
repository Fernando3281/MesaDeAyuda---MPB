let currentFiles = [];
let currentIndex = 0;
let searchTimeout = null;
let isEditMode = false;
let originalValues = {};

function handleSearchInput() {
    const searchInput = document.getElementById('searchMessages');
    const ticketId = document.getElementById('ticketId').value;
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    searchTimeout = setTimeout(() => {
        const searchTerm = searchInput.value.trim();
        loadMessages(ticketId, searchTerm);
    }, 50);
}

function showFileViewer(fileUrl, fileType, fileName) {
    const fileViewer = document.getElementById('fileViewer');
    const imageContainer = document.getElementById('imageContainer');
    const pdfContainer = document.getElementById('pdfContainer');
    const modalImage = document.getElementById('currentImage');
    const pdfViewerContent = document.getElementById('pdfViewerContent');
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
    fileViewer.classList.add('active');
    document.body.style.overflow = 'hidden';
    updateFileCounter();
}

function closeViewer() {
    document.getElementById('fileViewer').classList.remove('active');
    document.body.style.overflow = 'auto';
    document.getElementById('pdfViewerContent').src = '';
    currentFiles = [];
    currentIndex = 0;
}

function changeFile(direction) {
    currentIndex += direction;
    if (currentIndex < 0) {
        currentIndex = currentFiles.length - 1;
    } else if (currentIndex >= currentFiles.length) {
        currentIndex = 0;
    }
    const file = currentFiles[currentIndex];
    showFileViewer(file.url, file.type, file.name);
}

function updateFileCounter() {
    const fileCounter = document.getElementById('fileCounter');
    if (currentFiles.length > 1) {
        fileCounter.textContent = `${currentIndex + 1} de ${currentFiles.length}`;
        fileCounter.style.display = 'block';
    } else {
        fileCounter.style.display = 'none';
    }
}

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
            document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
            thumbnail.classList.add('active');
        });
        thumbnailContainer.appendChild(thumbnail);
    });
}

function setupEstadoPopover() {
    const estadoInfoIcon = document.querySelector('.password-info-icon');
    const estadoPopover = document.querySelector('.password-popover');
    if (estadoInfoIcon && estadoPopover) {
        estadoInfoIcon.addEventListener('mouseenter', function () {
            estadoPopover.style.display = 'block';
        });
        estadoInfoIcon.addEventListener('mouseleave', function () {
            estadoPopover.style.display = 'none';
        });
        estadoPopover.addEventListener('mouseenter', function () {
            estadoPopover.style.display = 'none';
        });
        estadoPopover.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', function () {
    setupEstadoPopover();
});

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
        estadoPopover.style.pointerEvents = 'none';
        estadoPopover.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', function () {
    setupEstadoPopover();
});

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
        estadoPopover.style.pointerEvents = 'none';
        estadoPopover.style.display = 'none';
    }
}

function loadAuditHistory(ticketId, filter = 'all', page = 0) {
    const btnRefresh = document.getElementById('btnRefreshAudit');
    const auditTimeline = document.getElementById('auditTimeline');
    if (!auditTimeline)
        return;
    auditTimeline.innerHTML = `
        <div class="loading-audit">
            <i class="fas fa-spinner fa-spin"></i>
            <span>Cargando historial...</span>
        </div>
    `;
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
                if (btnRefresh) {
                    btnRefresh.classList.remove('loading');
                }
            });
}

function renderAuditTimeline(historial, filter, totalPages = 1, currentPage = 0, ticketId) {
    const auditTimeline = document.getElementById('auditTimeline');
    if (!auditTimeline)
        return;
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
        let cambiosHtml = '';
        if ((mostrarCambios && item.valorAnterior && item.valorNuevo) ||
                item.accion.includes('ELIMINACION')) {
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
    if (value.length > 100) {
        return value.substring(0, 100) + '...';
    }
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

document.addEventListener('DOMContentLoaded', function () {
    document.addEventListener('click', function (e) {
        if (e.target.closest('.file-item')) {
            e.preventDefault();
            e.stopPropagation();
            const fileItem = e.target.closest('.file-item');
            const fileId = fileItem.getAttribute('data-id');
            const fileType = fileItem.getAttribute('data-type');
            const fileName = fileItem.getAttribute('data-name');
            const fileItems = document.querySelectorAll('.file-item');
            currentFiles = Array.from(fileItems).map(item => ({
                    id: item.getAttribute('data-id'),
                    type: item.getAttribute('data-type'),
                    name: item.getAttribute('data-name'),
                    url: `/archivos/ver/${item.getAttribute('data-id')}`
                }));
            currentIndex = Array.from(fileItems).findIndex(item =>
                item.getAttribute('data-id') === fileId
            );
            showFileViewer(`/archivos/ver/${fileId}`, fileType, fileName);
            loadThumbnails();
        }
    });
    document.querySelector('.close-viewer').addEventListener('click', closeViewer);
    document.getElementById('fileViewer').addEventListener('click', function (e) {
        if (e.target === this) {
            closeViewer();
        }
    });
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
    setTimeout(() => {
        const ticketIdElement = document.getElementById('ticketId');
        const auditFilter = document.getElementById('auditFilter');
        if (ticketIdElement && ticketIdElement.value) {
            const ticketId = ticketIdElement.value;
            loadAuditHistory(ticketId);
            if (auditFilter) {
                auditFilter.addEventListener('change', function () {
                    loadAuditHistory(ticketId, this.value);
                });
            }
        }
    }, 500);
});

document.addEventListener('DOMContentLoaded', function () {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');
    tabPanes.forEach(pane => {
        pane.style.display = 'none';
        pane.style.opacity = '40';
        pane.style.transform = 'translateY(0px)';
        pane.style.transition = 'all 0.3s ease';
    });
    const initialActivePane = document.querySelector('.tab-pane.active');
    if (initialActivePane) {
        initialActivePane.style.display = 'block';
        initialActivePane.style.opacity = '1';
        initialActivePane.style.transform = 'translateY(-10)';
    }
    function switchTab(targetTab) {
        const targetPane = document.getElementById(targetTab);
        if (targetPane.classList.contains('active')) {
            return;
        }
        if (!cancelarEdicionSiActiva()) {
            return;
        }
        tabPanes.forEach(pane => {
            pane.style.display = 'none';
            pane.classList.remove('active');
        });
        targetPane.style.display = 'block';
        targetPane.classList.add('active');
        targetPane.style.opacity = '0';
        targetPane.style.transform = 'translateY(10px)';
        setTimeout(() => {
            targetPane.style.opacity = '1';
            targetPane.style.transform = 'translateY(0)';
            if (targetTab === 'tab2') {
                const chatContainer = document.getElementById('chatMessagesContainer');
                if (chatContainer) {
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                }
            }
        }, 10);
    }
    tabButtons.forEach(button => {
        button.addEventListener('click', function () {
            const targetTab = this.getAttribute('data-tab');
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            switchTab(targetTab);
        });
    });
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

function toggleResponseType() {
    const button = document.getElementById('responseType');
    const hiddenInput = document.getElementById('esNotaInterna');
    if (button.classList.contains('public-response')) {
        button.classList.remove('public-response');
        button.classList.add('internal-note');
        button.textContent = 'Nota Interna';
        hiddenInput.value = 'true';
    } else {
        button.classList.remove('internal-note');
        button.classList.add('public-response');
        button.textContent = 'Respuesta Pública';
        hiddenInput.value = 'false';
    }
}

function habilitarBoton() {
    const selectPrioridad = document.getElementById('prioridadSelect');
    const btnActualizarPrioridad = document.getElementById('btnActualizarPrioridad');
    if (selectPrioridad.value !== "Sin Asignar") {
        btnActualizarPrioridad.disabled = false;
    } else {
        btnActualizarPrioridad.disabled = true;
    }
}

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

function closePrioridadModal() {
    const modalOverlay = document.getElementById('prioridadModalOverlay');
    modalOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function handlePrioridadSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const btnSubmit = form.querySelector('#btnActualizarPrioridad');
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
                    window.location.reload();
                } else {
                    throw new Error(data.error || 'Error al actualizar la prioridad');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert(error.message);
            })
            .finally(() => {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = 'Actualizar Prioridad';
            });
}

document.addEventListener('DOMContentLoaded', function () {
    const formPrioridad = document.getElementById('formAsignarPrioridad');
    if (formPrioridad) {
        formPrioridad.addEventListener('submit', handlePrioridadSubmit);
    }
    const closeModalBtn = document.getElementById('closePrioridadModalBtn');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closePrioridadModal);
    }
    const modalOverlay = document.getElementById('prioridadModalOverlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function (e) {
            if (e.target === modalOverlay) {
                closePrioridadModal();
            }
        });
    }
});

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
                    document.getElementById('asignadoPara').value = data.asignadoParaNombre;
                    loadAuditHistory(ticketId);
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
        forced_root_block: 'p',
        br_in_pre: false,
        block_formats: 'Paragraph=p;Heading 1=h1;Heading 2=h2',
        formats: {
            bold: {inline: 'strong'},
            italic: {inline: 'em'},
            underline: {inline: 'span', styles: {'text-decoration': 'underline'}},
            strikethrough: {
                inline: 'span',
                styles: {'text-decoration': 'line-through'},
                remove: 'all'
            }
        },
        style_formats: [
            {title: 'Bold', format: 'bold'},
            {title: 'Italic', format: 'italic'},
            {title: 'Underline', format: 'underline'},
            {title: 'Strikethrough', format: 'strikethrough'}
        ],
        valid_elements: '*[*]',
        valid_children: '+body[style]',
        extended_valid_elements: 'span[style|class],a[href|target|rel]',
        convert_fonts_to_spans: false,
        setup: function (editor) {
            editor.on('init', function () {
                editor.on('change', function () {
                    const content = editor.getContent();
                    document.getElementById('respuesta').value = content;
                    document.getElementById('respuestaTexto').value = editor.getContent({format: 'text'});
                });
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
                editor.on('ExecCommand', function (e) {
                    if (e.command === 'mceToggleFormat' && e.value === 'strikethrough') {
                        setTimeout(function () {
                            const emptySpans = editor.dom.select('span:not([style]):empty');
                            emptySpans.forEach(span => editor.dom.remove(span));
                            const bgSpans = editor.dom.select('span[style*="background"]');
                            bgSpans.forEach(span => {
                                const style = span.getAttribute('style');
                                if (style && !style.includes('line-through')) {
                                    editor.dom.remove(span, true);
                                }
                            });
                        }, 10);
                    }
                });
            });
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
        content_style: `
            body { 
                font-family: "Poppins", sans-serif; 
                font-size: 13px; 
                line-height: 1.5; 
                color: #333;
                margin: 0;
                padding: 10px;
            }
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
            span[style*="line-through"] {
                text-decoration: line-through !important;
                background-color: transparent !important;
                background-image: none !important;
                box-shadow: none !important;
                border: none !important;
            }
            span:empty {
                display: none;
            }
        `,
        paste_as_text: true,
        entity_encoding: 'raw',
        trim_whitespace: true,
        end_container_on_empty_block: true
    });
}

function responderTicket(event) {
    event.preventDefault();
    const editor = tinymce.get('editor');
    if (!editor) {
        console.error('Editor TinyMCE no está inicializado');
        return;
    }
    let contenidoHTML = editor.getContent().trim();
    let contenidoTexto = editor.getContent({format: 'text'}).trim();
    if (!contenidoTexto) {
        alert('Por favor escribe un mensaje antes de enviar.');
        return;
    }
    const esNotaInterna = document.getElementById('esNotaInterna').value === 'true';
    document.querySelector('input[name="respuesta"]').value = contenidoHTML;
    document.querySelector('input[name="respuestaTexto"]').value = contenidoTexto;
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
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
                    const ticketId = document.getElementById('ticketId').value;
                    const searchTerm = document.getElementById('searchMessages').value.trim();
                    loadMessages(ticketId, searchTerm);
                    editor.setContent('');
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

function actualizarEstadoAreaRespuesta() {
    const ticketEstado = document.querySelector('input#estado')?.value || document.querySelector('select#estado')?.value;
    const textarea = document.getElementById('respuesta');
    const submitButton = document.querySelector('#formResponderTicket button[type="submit"]');
    const responseTypeButton = document.getElementById('responseType');
    const statusMessage = document.querySelector('.status-message');
    if (!ticketEstado)
        return;
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

document.addEventListener('DOMContentLoaded', function () {
    const script = document.createElement('script');
    script.src = '/webjars/tinymce/6.8.3/tinymce.min.js';
    script.onload = function () {
        initTinyMCE();
        const formResponderTicket = document.getElementById('formResponderTicket');
        if (formResponderTicket) {
            formResponderTicket.addEventListener('submit', responderTicket);
        }
    };
    document.head.appendChild(script);
    actualizarEstadoAreaRespuesta();
    const selectEstado = document.querySelector('select#estado');
    if (selectEstado) {
        selectEstado.addEventListener('change', actualizarEstadoAreaRespuesta);
    }
    const asignadoPara = document.getElementById('asignadoPara');
    if (asignadoPara) {
        const observer = new MutationObserver(actualizarEstadoAreaRespuesta);
        observer.observe(asignadoPara, {attributes: true, attributeFilter: ['value']});
    }
});

function bloquearElementosRespuesta() {
    const estadoTicket = document.getElementById('estadoTicket')?.value;
    const usuarioActualId = document.getElementById('usuarioActualId')?.value;
    const usuarioRol = document.getElementById('usuarioActualRol')?.value;
    const solicitanteId = document.getElementById('solicitanteId')?.value;
    if (!estadoTicket)
        return;
    const btnEnviar = document.querySelector('#formResponderTicket button[type="submit"]');
    const btnTipoRespuesta = document.getElementById('responseType');
    const editor = document.querySelector('.tox-edit-area');
    const esNotaInternaInput = document.getElementById('esNotaInterna');
    const statusMessage = document.querySelector('.status-message.info');
    const estadosBloqueoTotal = ['Desactivado'];
    const estadoSoloNotas = ['Resuelto'];
    const debeBloquearTotal = estadosBloqueoTotal.includes(estadoTicket);
    const permiteSoloNotas = estadoSoloNotas.includes(estadoTicket);
    const esCerrado = estadoTicket === 'Cerrado';
    const esAdmin = usuarioRol === 'ROL_ADMINISTRADOR';
    const esSoportista = usuarioRol === 'ROL_SOPORTISTA';
    const esCreador = usuarioActualId == solicitanteId;
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
    else if (esCerrado) {
        const habilitarParaAdminSoporte = esAdmin || esSoportista;
        if (btnEnviar) {
            btnEnviar.disabled = !habilitarParaAdminSoporte;
            btnEnviar.style.opacity = habilitarParaAdminSoporte ? '1' : '0.5';
            btnEnviar.style.cursor = habilitarParaAdminSoporte ? 'pointer' : 'not-allowed';
        }
        if (btnTipoRespuesta) {
            btnTipoRespuesta.disabled = !habilitarParaAdminSoporte;
            btnTipoRespuesta.style.opacity = habilitarParaAdminSoporte ? '1' : '0.5';
            btnTipoRespuesta.style.cursor = habilitarParaAdminSoporte ? 'pointer' : 'not-allowed';
            btnTipoRespuesta.onclick = habilitarParaAdminSoporte ? toggleResponseType : null;
        }
        if (editor) {
            editor.style.pointerEvents = habilitarParaAdminSoporte ? 'auto' : 'none';
            editor.style.opacity = habilitarParaAdminSoporte ? '1' : '0.5';
            tinymce.get('editor')?.setMode(habilitarParaAdminSoporte ? 'design' : 'readonly');
        }
        if (statusMessage) {
            statusMessage.style.display = 'flex';
        }
    }
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

function iniciarObservadorEstado() {
    const estadoElement = document.querySelector('input#estado') || document.querySelector('select#estado');
    if (estadoElement) {
        const observer = new MutationObserver(bloquearElementosRespuesta);
        observer.observe(estadoElement, {attributes: true, attributeFilter: ['value']});
    }
}

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

document.addEventListener('ticketStateChanged', bloquearElementosRespuesta);

function verificarPrioridadYCerrar() {
    const prioridad = document.getElementById('prioridad').value;
    const asignadoPara = document.getElementById('asignadoPara').value;
    if (prioridad === 'Sin Asignar' && asignadoPara === 'Sin Asignar') {
        showErrorModal('Para cerrar un ticket primero debe asignar una prioridad y un usuario responsable.');
    } else if (prioridad === 'Sin Asignar') {
        showErrorModal('Para cerrar un ticket primero se le debe asignar un nivel de prioridad.');
    } else if (asignadoPara === 'Sin Asignar') {
        showErrorModal('Para cerrar un ticket primero debe asignar un usuario responsable.');
    } else {
        openResolveTicketModal();
    }
}

function showErrorModal(message) {
    const modalOverlay = document.getElementById('errorPriorityModalOverlay');
    const modalBody = modalOverlay.querySelector('.modal-body p');
    modalBody.textContent = message;
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function openResolveTicketModal() {
    const modalOverlay = document.getElementById('resolveTicketModalOverlay');
    modalOverlay.classList.add('active');
}

function closeResolveTicketModal() {
    const modalOverlay = document.getElementById('resolveTicketModalOverlay');
    modalOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function openErrorPriorityModal() {
    const modalOverlay = document.getElementById('errorPriorityModalOverlay');
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeErrorPriorityModal() {
    const modalOverlay = document.getElementById('errorPriorityModalOverlay');
    modalOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
}

document.addEventListener('DOMContentLoaded', function () {
    const btnCerrarTicket = document.getElementById('btnCerrarTicket');
    if (btnCerrarTicket) {
        btnCerrarTicket.onclick = verificarPrioridadYCerrar;
    }
    const resolveModalOverlay = document.getElementById('resolveTicketModalOverlay');
    if (resolveModalOverlay) {
        resolveModalOverlay.addEventListener('click', function (event) {
            if (event.target === resolveModalOverlay) {
                closeResolveTicketModal();
            }
        });
    }
    const btnCerrarError = document.querySelector('#errorPriorityModalOverlay .btn-primary');
    if (btnCerrarError) {
        btnCerrarError.onclick = closeErrorPriorityModal;
    }
    const errorModalOverlay = document.getElementById('errorPriorityModalOverlay');
    if (errorModalOverlay) {
        errorModalOverlay.addEventListener('click', function (event) {
            if (event.target === errorModalOverlay) {
                closeErrorPriorityModal();
            }
        });
    }
});

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
                    alert('Ticket desactivado correctamente');
                    window.location.reload();
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

function openDeactivateTicketModal() {
    const modalOverlay = document.getElementById('deactivateTicketModalOverlay');
    modalOverlay.classList.add('active');
}

function closeDeactivateTicketModal() {
    const modalOverlay = document.getElementById('deactivateTicketModalOverlay');
    modalOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function confirmDeactivateTicket() {
    const ticketId = document.getElementById('ticketId').value;
    const csrfToken = document.querySelector('input[name="_csrf"]').value;
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
                btnDesactivar.disabled = false;
                btnDesactivar.innerHTML = 'Desactivar Ticket';
            });
}

document.addEventListener('DOMContentLoaded', function () {
    const deactivateModalOverlay = document.getElementById('deactivateTicketModalOverlay');
    if (deactivateModalOverlay) {
        deactivateModalOverlay.addEventListener('click', function (event) {
            if (event.target === deactivateModalOverlay) {
                closeDeactivateTicketModal();
            }
        });
    }
});

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
                if (field.tagName === 'SELECT') {
                    field.classList.add('no-interaction');
                } else {
                    field.classList.remove('no-interaction');
                }
            }
        }
    });
    const backButtons = document.querySelectorAll('.back-button-container button:not(#btnGuardarCambios):not(#btnCancelarEdicion)');
    const saveButton = document.getElementById('btnGuardarCambios');
    const cancelButton = document.getElementById('btnCancelarEdicion');
    if (isEditMode) {
        backButtons.forEach(button => {
            button.style.display = 'none';
        });
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
        backButtons.forEach(button => {
            button.style.display = 'inline-block';
        });
        if (saveButton)
            saveButton.style.display = 'none';
        if (cancelButton)
            cancelButton.style.display = 'none';
    }
}

function guardarCambiosTicket() {
    const ticketId = document.getElementById('ticketId').value;
    const csrfToken = document.querySelector('input[name="_csrf"]').value;
    const datosActualizados = {
        codigo: document.getElementById('codigo').value,
        impacto: document.getElementById('impacto').value,
        categoria: document.getElementById('categoria').value,
        prioridad: document.getElementById('prioridad').value,
        estado: document.getElementById('estado').value,
        titulo: document.getElementById('breveDescripcion').value,
        descripcion: document.getElementById('descripcion').value
    };
    const btnGuardar = document.getElementById('btnGuardarCambios');
    const btnCancelar = document.getElementById('btnCancelarEdicion');
    btnGuardar.disabled = true;
    btnCancelar.disabled = true;
    btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
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
                    toggleEditMode();
                    window.location.reload();
                } else {
                    throw new Error(data.error || 'Error al actualizar el ticket');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert(error.message);
                btnGuardar.disabled = false;
                btnCancelar.disabled = false;
                btnGuardar.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar Cambios';
            });
}

function cancelarEdicion() {
    if (confirm('¿Estás seguro de que quieres cancelar la edición? Los cambios no guardados se perderán.')) {
        for (const id in originalValues) {
            const field = document.getElementById(id);
            if (field)
                field.value = originalValues[id];
        }
        toggleEditMode();
    }
}

function cancelarEdicionSiActiva() {
    if (isEditMode) {
        cancelarEdicion();
        return false;
    }
    return true;
}

document.addEventListener('DOMContentLoaded', function () {
    const btnActualizarTicket = document.querySelector('[data-bs-target="#elevateTicketModal"]');
    if (btnActualizarTicket) {
        btnActualizarTicket.onclick = toggleEditMode;
    }
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');
    tabButtons.forEach(button => {
        button.addEventListener('click', function () {
            if (!cancelarEdicionSiActiva())
                return;
            const targetTab = this.getAttribute('data-tab');
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            this.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });
});

function refreshMessages() {
    const btnRefresh = document.getElementById('btnRefreshMessages');
    const ticketId = document.getElementById('ticketId').value;
    const searchInput = document.getElementById('searchMessages');
    const searchTerm = searchInput ? searchInput.value.trim() : null;
    btnRefresh.classList.add('loading');
    loadMessages(ticketId, searchTerm);
    setTimeout(() => {
        btnRefresh.classList.remove('loading');
    }, 1000);
}

function refreshAuditHistory() {
    const btnRefresh = document.getElementById('btnRefreshAudit');
    const ticketId = document.getElementById('ticketId').value;
    const auditFilter = document.getElementById('auditFilter');
    const filterValue = auditFilter ? auditFilter.value : 'all';
    if (btnRefresh) {
        btnRefresh.classList.add('loading');
    }
    loadAuditHistory(ticketId, filterValue);
    setTimeout(() => {
        if (btnRefresh) {
            btnRefresh.classList.remove('loading');
        }
    }, 1000);
}

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

function loadMessages(ticketId, searchTerm = null) {
    if (!ticketId) {
        console.error('No se proporcionó un ID de ticket válido');
        showEmptyState();
        return;
    }
    const btnRefresh = document.getElementById('btnRefreshMessages');
    const filterType = document.getElementById('messageFilter').value;
    const url = `/tickets/mensajes/${ticketId}?filtro=${filterType}` +
            (searchTerm ? `&busqueda=${encodeURIComponent(searchTerm)}` : '');
    const container = document.getElementById('chatMessagesContainer');
    if (container) {
        container.innerHTML = `
            <div class="loading-messages">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Cargando mensajes...</span>
            </div>
        `;
    }
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
            reject(new Error('Tiempo de espera agotado al cargar mensajes'));
        }, 10000);
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
                updateTotalMessageCounter(data.mensajes?.length || 0, filterType, searchTerm);
                renderMessages(data.mensajes);
                if ((searchTerm || filterType !== 'all') && data.mensajes.length === 0) {
                    showNoResultsMessage(searchTerm, filterType);
                }
            })
            .catch(error => {
                console.error('Error al cargar mensajes:', error);
                showToast('Error al cargar mensajes: ' + error.message);
                showEmptyState();
                updateTotalMessageCounter(0, filterType, searchTerm);
            })
            .finally(() => {
                if (btnRefresh) {
                    btnRefresh.classList.remove('loading');
                }
            });
}

function updateTotalMessageCounter(count, filterType, searchTerm = null) {
    const counterElement = document.getElementById('totalMessagesCounter');
    if (!counterElement)
        return;
    let countText = count.toString();
    counterElement.textContent = `(${countText} Mensajes)`;
}

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

function renderMessages(mensajes) {
    const container = document.getElementById('chatMessagesContainer');
    if (!container)
        return;
    container.innerHTML = '';
    if (!mensajes || mensajes.length === 0) {
        showEmptyState();
        return;
    }
    const mensajesOrdenados = [...mensajes].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    mensajesOrdenados.forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.className = msg.esNotaInterna ? 'message internal-note' : 'message';
        messageDiv.setAttribute('data-id', msg.id);
        messageDiv.setAttribute('data-user', msg.esMio);
        let rolTexto = 'Usuario';
        let rolClase = 'role-usuario';
        if (msg.emisor.rol) {
            if (msg.emisor.rol.includes('ADMINISTRADOR')) {
                rolTexto = 'Administrador';
                rolClase = 'role-admin';
            } else if (msg.emisor.rol.includes('SOPORTISTA')) {
                rolTexto = 'Soportista';
                rolClase = 'role-soporte';
            }
        }
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
    container.scrollTop = container.scrollHeight;
}

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
                    const messageElement = document.querySelector(`.message[data-id="${messageId}"]`);
                    if (messageElement) {
                        messageElement.remove();
                    }
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

document.addEventListener('DOMContentLoaded', function () {
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
    const searchInput = document.getElementById('searchMessages');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearchInput);
    }
    const messageFilter = document.getElementById('messageFilter');
    if (messageFilter) {
        messageFilter.addEventListener('change', () => {
            const searchTerm = searchInput?.value.trim() || null;
            loadMessages(ticketId, searchTerm);
        });
    }
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
    loadMessages(ticketId);
});

function actualizarTiempoCierre() {
    const ticketId = document.getElementById('ticketId').value;
    const estadoTicket = document.querySelector('input#estado')?.value ||
            document.querySelector('select#estado')?.value;
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

document.addEventListener('DOMContentLoaded', function () {
    actualizarTiempoCierre();
    setInterval(actualizarTiempoCierre, 60000);
});

const selectEstado = document.querySelector('select#estado');
if (selectEstado) {
    selectEstado.addEventListener('change', function () {
        actualizarTiempoCierre();
    });
}

let soportistasData = [];
let selectedSoportista = null;
let filteredSoportistas = [];

function openAssignTicketsModal() {
    const modalOverlay = document.getElementById('assignTicketsModalOverlay');
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    selectedSoportista = null;
    const searchInput = document.getElementById('soportistaSearchInput');
    if (searchInput) {
        searchInput.value = '';
    }
    const resultsContainer = document.getElementById('floatingResultsContainer');
    if (resultsContainer) {
        resultsContainer.style.display = 'none';
    }
    const confirmBtn = document.getElementById('confirmAssignBtn');
    if (confirmBtn) {
        confirmBtn.disabled = true;
    }
    loadSoportistas();
}

function closeAssignTicketsModal() {
    const modalOverlay = document.getElementById('assignTicketsModalOverlay');
    modalOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
    selectedSoportista = null;
    soportistasData = [];
    filteredSoportistas = [];
    const confirmBtn = document.getElementById('confirmAssignBtn');
    if (confirmBtn) {
        confirmBtn.disabled = true;
    }
}

function loadSoportistas() {
    const soportistasList = document.getElementById('soportistasList');
    const loadingMessage = document.getElementById('loadingMessage');
    const errorMessage = document.getElementById('errorMessage');
    const usuarioActual = {
        id: document.getElementById('usuarioActualId')?.value || null,
        rol: document.getElementById('usuarioActualRol')?.value || null
    };
    if (loadingMessage)
        loadingMessage.style.display = 'flex';
    if (errorMessage)
        errorMessage.style.display = 'none';
    if (soportistasList)
        soportistasList.innerHTML = '';
    fetch('/tickets/usuarios/soportistas')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error en la respuesta del servidor: ' + response.status);
                }
                return response.json();
            })
            .then(data => {
                soportistasData = data.filter(soportista => {
                    if (soportista.id == usuarioActual.id)
                        return false;
                    if (usuarioActual.rol === 'ROL_SOPORTISTA') {
                        return soportista.rol === 'ROL_SOPORTISTA';
                    }
                    return true;
                });
                filteredSoportistas = [...soportistasData];
                if (loadingMessage)
                    loadingMessage.style.display = 'none';
                const searchInput = document.getElementById('soportistaSearchInput');
                if (searchInput && searchInput.value.trim() !== '') {
                    renderSoportistasList(filteredSoportistas);
                }
            })
            .catch(error => {
                console.error('Error cargando soportistas:', error);
                if (loadingMessage)
                    loadingMessage.style.display = 'none';
                if (errorMessage) {
                    errorMessage.style.display = 'block';
                    errorMessage.textContent = 'Error al cargar colaboradores: ' + error.message;
                }
            });
}

function renderSoportistasList(soportistas) {
    const soportistasList = document.getElementById('soportistasList');
    if (!soportistasList)
        return;
    soportistasList.innerHTML = '';
    if (!soportistas || soportistas.length === 0) {
        soportistasList.innerHTML = '<div class="no-results">No se encontraron colaboradores</div>';
        return;
    }
    soportistas.forEach(soportista => {
        const soportistaItem = document.createElement('div');
        soportistaItem.className = 'soportista-item';
        soportistaItem.setAttribute('data-id', soportista.id);
        let rolText = '';
        if (soportista.rol) {
            if (soportista.rol.toLowerCase() === 'rol_administrador') {
                rolText = 'Administrador';
            } else if (soportista.rol.toLowerCase() === 'rol_soportista') {
                rolText = 'Soportista';
            } else {
                rolText = soportista.rol.replace('ROL_', '').charAt(0).toUpperCase() +
                        soportista.rol.replace('ROL_', '').slice(1).toLowerCase();
            }
        }
        const imagenUrl = soportista.imagen ? `/usuario/imagen/${soportista.id}` : '';
        const avatarContent = soportista.imagen
                ? `<img src="${imagenUrl}" alt="${soportista.nombreCompleto}" class="soportista-avatar-img" onerror="this.onerror=null; this.parentNode.innerHTML='<i class=\\'fas fa-user\\'></i>'">`
                : `<i class="fas fa-user"></i>`;
        soportistaItem.innerHTML = `
            <div class="soportista-avatar">
                ${avatarContent}
            </div>
            <div class="soportista-info">
                <div class="soportista-name">${soportista.nombreCompleto || soportista.nombre}</div>
                <div class="soportista-details">
                    <span class="soportista-id">ID: ${soportista.codigo || soportista.id}</span>
                </div>
            </div>
        <span class="soportista-role">${rolText}</span>
        `;
        soportistaItem.addEventListener('click', () => selectSoportista(soportista, soportistaItem));
        soportistasList.appendChild(soportistaItem);
    });
}

function selectSoportista(soportista, element) {
    const previousSelected = document.querySelector('.soportista-item.selected');
    if (previousSelected) {
        previousSelected.classList.remove('selected');
    }
    element.classList.add('selected');
    selectedSoportista = soportista;
    const searchInput = document.getElementById('soportistaSearchInput');
    if (searchInput) {
        searchInput.value = soportista.nombreCompleto || soportista.nombre;
    }
    const resultsContainer = document.getElementById('floatingResultsContainer');
    if (resultsContainer) {
        resultsContainer.style.display = 'none';
    }
    const confirmBtn = document.getElementById('confirmAssignBtn');
    if (confirmBtn) {
        confirmBtn.disabled = false;
    }
}

function normalizeText(text) {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function filterSoportistas() {
    const searchInput = document.getElementById('soportistaSearchInput');
    const searchTerm = normalizeText(searchInput.value.trim());
    const resultsContainer = document.getElementById('floatingResultsContainer');
    const loadingMessage = document.getElementById('loadingMessage');
    const errorMessage = document.getElementById('errorMessage');
    if (searchTerm === '') {
        resultsContainer.style.display = 'none';
        return;
    }
    resultsContainer.style.display = 'block';
    positionFloatingContainer();
    if (soportistasData.length === 0) {
        if (loadingMessage) loadingMessage.style.display = 'flex';
        if (errorMessage) errorMessage.style.display = 'none';
        loadSoportistas();
    } else {
        filteredSoportistas = soportistasData.filter(soportista => {
            const nombre = normalizeText(soportista.nombreCompleto || '');
            const codigo = normalizeText(soportista.codigo || '');
            let rolText = '';
            if (soportista.rol) {
                if (soportista.rol.toLowerCase() === 'rol_administrador') {
                    rolText = 'administrador';
                } else if (soportista.rol.toLowerCase() === 'rol_soportista') {
                    rolText = 'soportista';
                } else {
                    rolText = normalizeText(soportista.rol.replace('ROL_', ''));
                }
            }
            return nombre.includes(searchTerm) ||
                   codigo.includes(searchTerm) ||
                   rolText.includes(searchTerm);
        });
        filteredSoportistas.sort((a, b) => {
            const aNombre = normalizeText(a.nombreCompleto || '');
            const bNombre = normalizeText(b.nombreCompleto || '');
            const aCodigo = normalizeText(a.codigo || '');
            const bCodigo = normalizeText(b.codigo || '');
            if (aNombre === searchTerm || aCodigo === searchTerm) return -1;
            if (bNombre === searchTerm || bCodigo === searchTerm) return 1;
            const aStartsWith = aNombre.startsWith(searchTerm) || aCodigo.startsWith(searchTerm);
            const bStartsWith = bNombre.startsWith(searchTerm) || bCodigo.startsWith(searchTerm);
            if (aStartsWith && !bStartsWith) return -1;
            if (!aStartsWith && bStartsWith) return 1;
            return aNombre.localeCompare(bNombre);
        });
        renderSoportistasList(filteredSoportistas);
    }
}

function positionFloatingContainer() {
    const searchInput = document.getElementById('soportistaSearchInput');
    const resultsContainer = document.getElementById('floatingResultsContainer');
    if (searchInput && resultsContainer) {
        const inputRect = searchInput.getBoundingClientRect();
        const modalBody = document.querySelector('.modal-body');
        const modalRect = modalBody.getBoundingClientRect();
        resultsContainer.style.width = `${inputRect.width}px`;
        resultsContainer.style.top = `${inputRect.bottom + window.scrollY}px`;
        resultsContainer.style.left = `${inputRect.left + window.scrollX}px`;
        resultsContainer.style.maxHeight = `${window.innerHeight - inputRect.bottom - 20}px`;
    }
}

function clearSearch() {
    const searchInput = document.getElementById('soportistaSearchInput');
    const resultsContainer = document.getElementById('floatingResultsContainer');
    if (searchInput) {
        searchInput.value = '';
        resultsContainer.style.display = 'none';
        selectedSoportista = null;
        const selectedItem = document.querySelector('.soportista-item.selected');
        if (selectedItem) {
            selectedItem.classList.remove('selected');
        }
        const confirmBtn = document.getElementById('confirmAssignBtn');
        if (confirmBtn) {
            confirmBtn.disabled = true;
        }
    }
}

function confirmAssignTicket() {
    if (!selectedSoportista) {
        alert('Por favor, seleccione un colaborador para asignar el ticket.');
        return;
    }
    const confirmBtn = document.getElementById('confirmAssignBtn');
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Asignando...';
    }
    const ticketIdElement = document.getElementById('ticketId');
    const ticketId = ticketIdElement ? ticketIdElement.value : null;
    if (!ticketId) {
        alert('Error: No se pudo obtener el ID del ticket.');
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = 'Confirmar Asignación';
        }
        return;
    }
    const csrfToken = document.querySelector('input[name="_csrf"]').value;
    const data = {
        soportistaId: selectedSoportista.id,
        ticketIds: [ticketId]
    };
    fetch('/tickets/asignar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrfToken
        },
        body: JSON.stringify(data)
    })
            .then(response => {
                return response.json().then(data => ({
                        status: response.status,
                        ok: response.ok,
                        data: data
                    }));
            })
            .then(result => {
                if (result.ok && result.data.success) {
                    closeAssignTicketsModal();
                    window.location.reload();
                } else {
                    const errorMessage = result.data.error || 'Error desconocido al asignar el ticket';
                    alert('Error al asignar el ticket: ' + errorMessage);
                    if (confirmBtn) {
                        confirmBtn.disabled = false;
                        confirmBtn.innerHTML = 'Confirmar Asignación';
                    }
                }
            })
            .catch(error => {
                console.error('Error en la petición:', error);
                alert('Error de conexión al asignar el ticket. Por favor, intente nuevamente.');
                if (confirmBtn) {
                    confirmBtn.disabled = false;
                    confirmBtn.innerHTML = 'Confirmar Asignación';
                }
            });
}

document.addEventListener('DOMContentLoaded', function () {
    const btnAsignarTicket = document.getElementById('asignarTicket');
    if (btnAsignarTicket) {
        btnAsignarTicket.addEventListener('click', openAssignTicketsModal);
    }
    const searchInput = document.getElementById('soportistaSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterSoportistas);
        searchInput.addEventListener('focus', positionFloatingContainer);
    }
    const clearBtn = document.getElementById('clearSearchBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearSearch);
    }
    const btnConfirmarAsignacion = document.getElementById('confirmAssignBtn');
    if (btnConfirmarAsignacion) {
        btnConfirmarAsignacion.addEventListener('click', confirmAssignTicket);
    }
    const assignModalOverlay = document.getElementById('assignTicketsModalOverlay');
    if (assignModalOverlay) {
        assignModalOverlay.addEventListener('click', function (event) {
            if (event.target === assignModalOverlay) {
                closeAssignTicketsModal();
            }
        });
    }
    document.addEventListener('click', function (event) {
        const resultsContainer = document.getElementById('floatingResultsContainer');
        const searchInput = document.getElementById('soportistaSearchInput');
        if (resultsContainer && resultsContainer.style.display === 'block' &&
                event.target !== searchInput && !resultsContainer.contains(event.target)) {
            resultsContainer.style.display = 'none';
        }
    });
    if (!document.getElementById('usuarioActualId')) {
        const usuarioIdInput = document.createElement('input');
        usuarioIdInput.type = 'hidden';
        usuarioIdInput.id = 'usuarioActualId';
        usuarioIdInput.value = '[[${usuarioActual?.idUsuario}]]';
        document.body.appendChild(usuarioIdInput);
    }
    if (!document.getElementById('usuarioActualRol')) {
        const usuarioRolInput = document.createElement('input');
        usuarioRolInput.type = 'hidden';
        usuarioRolInput.id = 'usuarioActualRol';
        usuarioRolInput.value = '[[${usuarioActual?.roles?.get(0)?.nombre}]]';
        document.body.appendChild(usuarioRolInput);
    }
    positionFloatingContainer();
});

window.addEventListener('resize', positionFloatingContainer);

document.addEventListener('DOMContentLoaded', function () {
    initializeBackButton();

    function initializeBackButton() {
        const backButton = document.querySelector('.back-button, .btn-back');
        if (backButton) {
            backButton.removeEventListener('click', handleManagerBackClick);
            backButton.addEventListener('click', handleManagerBackClick);
        }
    }

    function handleManagerBackClick(e) {
        e.preventDefault();
        e.stopPropagation();

        try {
            const savedState = sessionStorage.getItem('ticketsTableState');

            if (savedState) {
                const filters = JSON.parse(savedState);
                const stateAge = Date.now() - (filters.timestamp || 0);
                const oneHour = 60 * 60 * 1000;

                if (stateAge > oneHour) {
                    window.location.href = '/tickets/listado';
                    return;
                }

                let baseUrl = '/tickets/listado';

                if (filters.currentSection) {
                    switch (filters.currentSection) {
                        case 'mis-tickets':
                            baseUrl = '/tickets/mis-tickets';
                            break;
                        case 'sin-asignar':
                            baseUrl = '/tickets/sin-asignar';
                            break;
                        case 'todos':
                        default:
                            baseUrl = '/tickets/listado';
                            break;
                    }
                }

                const params = new URLSearchParams();

                params.set('page', filters.currentPage || 0);
                params.set('size', filters.pageSize || 15);
                params.set('sortField', filters.sortField || 'fechaApertura');
                params.set('sortDirection', filters.sortDirection || 'desc');

                if (filters.globalSearch) {
                    params.set('search', filters.globalSearch);
                }

                if (filters.columnFilters && typeof filters.columnFilters === 'object') {
                    Object.entries(filters.columnFilters).forEach(([column, value]) => {
                        if (value && value.toString().trim()) {
                            params.set(`filter_${column}`, value);
                        }
                    });
                }

                if (filters.fechaFromApertura) {
                    params.set('filter_fechaAperturaFrom', filters.fechaFromApertura);
                }
                if (filters.fechaToApertura) {
                    params.set('filter_fechaAperturaTo', filters.fechaToApertura);
                }

                if (filters.fechaFromActualizado) {
                    params.set('filter_fechaActualizadoFrom', filters.fechaFromActualizado);
                }
                if (filters.fechaToActualizado) {
                    params.set('filter_fechaActualizadoTo', filters.fechaToActualizado);
                }

                const finalUrl = `${baseUrl}?${params.toString()}`;

                const loadingIndicator = document.querySelector('.loading-indicator');
                if (loadingIndicator) {
                    loadingIndicator.style.display = 'block';
                }

                window.location.href = finalUrl;

            } else {
                window.location.href = '/tickets/listado';
            }

        } catch (error) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'alert alert-warning';
            errorDiv.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                max-width: 300px;
                padding: 10px;
                border-radius: 5px;
                background-color: #fff3cd;
                border: 1px solid #1px;
                color: #856404;
            `;
            errorDiv.innerHTML = `
                <strong>Aviso:</strong> Hubo un problema al restaurar los filtros. 
                Redirigiendo a la vista principal...
                <button type="button" class="btn-close" style="float: right;" onclick="this.parentElement.remove()">×</button>
            `;
            document.body.appendChild(errorDiv);

            setTimeout(() => {
                errorDiv.remove();
                window.location.href = '/tickets/listado';
            }, 3000);
        }
    }

    function cleanOldStates() {
        try {
            const savedState = sessionStorage.getItem('ticketsTableState');
            if (savedState) {
                const state = JSON.parse(savedState);
                const stateAge = Date.now() - (state.timestamp || 0);
                const oneDay = 24 * 60 * 60 * 1000;

                if (stateAge > oneDay) {
                    sessionStorage.removeItem('ticketsTableState');
                    localStorage.removeItem('ticketsTableState');
                }
            }
        } catch (error) {
            sessionStorage.removeItem('ticketsTableState');
            localStorage.removeItem('ticketsTableState');
        }
    }

    cleanOldStates();

    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        window.managerDebug = {
            getStoredState: () => {
                try {
                    return JSON.parse(sessionStorage.getItem('ticketsTableState') || '{}');
                } catch {
                    return {};
                }
            },
            clearStoredState: () => {
                sessionStorage.removeItem('ticketsTableState');
            },
            testBackButton: () => {
                const backButton = document.querySelector('.back-button, .btn-back');
                if (backButton) {
                    backButton.click();
                }
            }
        };
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