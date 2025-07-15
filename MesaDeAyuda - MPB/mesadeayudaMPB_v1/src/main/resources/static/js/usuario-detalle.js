document.addEventListener('DOMContentLoaded', function () {
    const modal = document.getElementById('fileModal');
    const modalImage = document.getElementById('modalFileImage');
    const modalPdf = document.getElementById('modalFilePdf');
    const modalFileName = document.getElementById('modalFileName');
    const closeBtn = document.querySelector('.close-modal');
    const fileItems = document.querySelectorAll('.file-item');
    const body = document.body;

    // Elementos para el modal de cancelación
    const cancelButton = document.querySelector('.cancel-button');
    const cancelModal = document.getElementById('cancelTicketModal');
    const confirmCancel = document.getElementById('confirmCancel');
    const closeCancelModal = document.getElementById('closeCancelModal');

    // Depuración: Verificar todos los archivos disponibles
    console.log("Archivos adjuntos encontrados:");
    fileItems.forEach(item => {
        console.log({
            src: item.getAttribute('data-src'),
            type: item.getAttribute('data-type'),
            name: item.getAttribute('data-filename')
        });
    });

    // Manejar clic en archivos
    fileItems.forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();

            const fileSrc = this.getAttribute('data-src');
            const fileType = this.getAttribute('data-type');
            const fileName = this.getAttribute('data-filename');

            console.log(`Intentando abrir archivo: ${fileName} (${fileType}) desde ${fileSrc}`);

            // Mostrar nombre del archivo
            modalFileName.textContent = fileName;

            if (fileType === 'image') {
                // Configuración para imágenes
                modalPdf.style.display = 'none';
                modalImage.style.display = 'block';

                const img = new Image();
                img.onload = function () {
                    modalImage.src = fileSrc;
                    showModal();
                };
                img.onerror = function () {
                    console.error("Error al cargar la imagen:", fileSrc);
                    alert('No se pudo cargar la imagen. Por favor, inténtelo nuevamente.');
                };
                img.src = fileSrc;

            } else if (fileType === 'pdf') {
                modalImage.style.display = 'none';
                modalPdf.style.display = 'block';

                // Limpiar el iframe y establecer el tipo de contenido
                modalPdf.src = '';

                // Usar un objeto Blob para asegurar la visualización
                fetch(fileSrc)
                        .then(response => {
                            if (!response.ok)
                                throw new Error('Network response was not ok');
                            return response.blob();
                        })
                        .then(blob => {
                            const blobUrl = URL.createObjectURL(blob);
                            modalPdf.src = blobUrl + '#toolbar=0&navpanes=0&scrollbar=0';
                            console.log("PDF cargado como blob:", blobUrl);
                            showModal();

                            // Liberar el objeto URL cuando el modal se cierre
                            modalPdf.onload = function () {
                                URL.revokeObjectURL(blobUrl);
                            };
                        })
                        .catch(error => {
                            console.error("Error al cargar el PDF:", error);
                            alert('No se pudo cargar el PDF. Por favor, inténtelo nuevamente.');
                        });
            }
        });
    });

    // Manejar clic en el botón de cancelar
    if (cancelButton) {
        cancelButton.addEventListener('click', function (e) {
            e.preventDefault();
            showCancelModal();
        });
    }

    // Manejar confirmación de cancelación
    if (confirmCancel) {
        confirmCancel.addEventListener('click', function () {
            cancelTicket();
        });
    }

    // Manejar cierre del modal de cancelación
    if (closeCancelModal) {
        closeCancelModal.addEventListener('click', function () {
            hideCancelModal();
        });
    }

    function showModal() {
        body.classList.add('modal-open');
        modal.style.display = 'flex';
    }

    function closeModal() {
        modal.style.display = 'none';
        body.classList.remove('modal-open');
        modalImage.src = '';
        modalPdf.src = '';
    }

    // Mostrar modal de cancelación
    function showCancelModal() {
        body.classList.add('modal-open');
        cancelModal.style.display = 'flex';
    }

    // Ocultar modal de cancelación
    function hideCancelModal() {
        cancelModal.style.display = 'none';
        body.classList.remove('modal-open');
    }

    // Función para cancelar el ticket (versión actualizada)
function cancelTicket() {
    const ticketId = window.location.pathname.split('/').pop();
    
    // Mostrar indicador de carga
    confirmCancel.disabled = true;
    confirmCancel.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Procesando...';
    
    fetch(`/tickets/cancelar/${ticketId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': document.querySelector('meta[name="_csrf"]').content
        },
        credentials: 'include'
    })
    .then(response => {
        // Restaurar botón
        confirmCancel.disabled = false;
        confirmCancel.textContent = 'Confirmar';
        
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.message || 'Error al cancelar el ticket');
            });
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Ocultar modal antes de recargar
            hideCancelModal();
            
            window.location.reload();
            
        } else {
            throw new Error(data.error || 'Error al cancelar el ticket');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al cancelar el ticket: ' + error.message);
        
        // Restaurar botón en caso de error
        confirmCancel.disabled = false;
        confirmCancel.textContent = 'Confirmar';
    });
}

    // Event listeners para cerrar el modal de archivos
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) {
        if (e.target === modal)
            closeModal();
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape')
            closeModal();
    });

    // Event listener para cerrar modal de cancelación al hacer clic fuera
    cancelModal.addEventListener('click', function (e) {
        if (e.target === cancelModal) {
            hideCancelModal();
        }
    });

    // Manejar errores del iframe PDF
    modalPdf.addEventListener('load', function () {
        console.log("PDF cargado con éxito");
    });

    modalPdf.addEventListener('error', function () {
        console.error("Error al cargar el PDF");
        alert('No se pudo cargar el PDF. Por favor, inténtelo nuevamente.');
        closeModal();
    });
});