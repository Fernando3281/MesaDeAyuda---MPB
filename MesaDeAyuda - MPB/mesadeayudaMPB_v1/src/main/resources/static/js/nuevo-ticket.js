document.addEventListener('DOMContentLoaded', function () {
    const imageInput = document.getElementById('imageInput');
    const previewContainer = document.getElementById('imagePreviewContainer');
    const uploadBox = document.getElementById('uploadBox');
    const uploadText = document.getElementById('uploadText');
    const maxFiles = 2;
    const maxSizeMB = 5;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    // Función para abrir el modal de imagen
    function openModal(imgSrc) {
        const modal = document.getElementById('imageModal');
        const modalImg = document.getElementById('modalImage');
        modal.style.display = 'block';
        modalImg.src = imgSrc;
    }

    // Función para abrir el modal de PDF
    function openPdfModal(pdfUrl) {
        const modal = document.getElementById('pdfModal');
        const modalContent = document.getElementById('pdfModalContent');
        modal.style.display = 'block';
        modalContent.src = pdfUrl;
    }

    // Función para cerrar el modal de imagen
    document.querySelector('.close-modal').addEventListener('click', () => {
        const modal = document.getElementById('imageModal');
        modal.style.display = 'none';
    });

    // Función para cerrar el modal de PDF
    document.querySelector('.close-pdf-modal').addEventListener('click', () => {
        const modal = document.getElementById('pdfModal');
        modal.style.display = 'none';
        document.getElementById('pdfModalContent').src = '';
    });

    // Configuración de estado de archivos
    const fileState = {
        files: [],

        // Método para agregar archivo
        addFile(file) {
            if (this.files.length >= maxFiles) {
                this.showNotification(`No se pueden agregar más de ${maxFiles} archivos`);
                return false;
            }

            if (!this.validateFile(file)) {
                return false;
            }

            this.files.push(file);
            this.toggleUploadText();
            this.updateHoverState();
            return true;
        },

        resetUploadBoxStyle() {
            uploadBox.style.borderColor = '#ccc';
            uploadBox.style.backgroundColor = '#f8f9fa';
            uploadBox.classList.remove('drag-over');
        },

        // Método para eliminar archivo
        removeFile(index) {
            // Liberar URL de objeto si es un PDF
            if (this.files[index].type === 'application/pdf') {
                const pdfPreviews = document.querySelectorAll('.pdf-preview');
                if (pdfPreviews[index]) {
                    const pdfUrl = pdfPreviews[index].getAttribute('data-pdf-url');
                    if (pdfUrl)
                        URL.revokeObjectURL(pdfUrl);
                }
            }

            this.files.splice(index, 1);
            this.renderPreviews();
            this.updateInputFiles();
            this.toggleUploadText();
            this.updateHoverState();
        },

        // Actualizar el estado del hover
        updateHoverState() {
            if (this.files.length >= maxFiles) {
                uploadBox.classList.add('has-files');
                this.resetUploadBoxStyle();
            } else {
                uploadBox.classList.remove('has-files');
            }
        },

        // Validar archivo
        validateFile(file) {
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];

            if (!allowedTypes.includes(file.type)) {
                this.showNotification('Solo se permiten imágenes JPG, PNG, GIF y archivos PDF');
                return false;
            }

            if (file.size > maxSizeBytes) {
                this.showNotification(`El archivo "${file.name}" excede el tamaño máximo de ${maxSizeMB}MB`);
                return false;
            }

            return true;
        },

        // Renderizar vistas previas
        renderPreviews() {
            previewContainer.innerHTML = '';

            this.files.forEach((file, index) => {
                const previewWrapper = document.createElement('div');
                previewWrapper.className = 'file-preview-wrapper';

                if (file.type.startsWith('image/')) {
                    // Procesar como imagen
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const imgSrc = e.target.result; // Guardamos la URL de la imagen

                        previewWrapper.innerHTML = `
                            <div class="image-preview" data-img-src="${imgSrc}">
                                <img src="${imgSrc}" alt="Preview" data-index="${index}">
                                <div class="image-preview-overlay">
                                    <button type="button" class="delete-image-btn" data-index="${index}">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                                <div class="image-name">${this.truncateFileName(file.name)}</div>
                            </div>
                        `;

                        // Evento para abrir el modal
                        previewWrapper.querySelector('.image-preview').addEventListener('click', (e) => {
                            if (!e.target.closest('.delete-image-btn')) {
                                const imgSrc = e.currentTarget.getAttribute('data-img-src');
                                openModal(imgSrc);
                            }
                        });

                        // Evento para eliminar
                        previewWrapper.querySelector('.delete-image-btn').addEventListener('click', (e) => {
                            e.stopPropagation();
                            const indexToRemove = e.currentTarget.dataset.index;
                            this.removeFile(indexToRemove);
                        });

                        previewContainer.appendChild(previewWrapper);
                    };
                    reader.readAsDataURL(file);
                } else if (file.type === 'application/pdf') {
                    // Procesar como PDF
                    const pdfUrl = URL.createObjectURL(file);
                    const fileName = this.truncateFileName(file.name);

                    previewWrapper.innerHTML = `
                        <div class="pdf-preview" data-pdf-url="${pdfUrl}">
                            <div class="pdf-thumbnail">
                                <i class="fas fa-file-pdf pdf-icon"></i>
                            </div>
                            <div class="pdf-preview-overlay">
                                <button type="button" class="delete-image-btn" data-index="${index}">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                            <div class="image-name">${fileName}</div>
                        </div>
                    `;

                    // Abrir PDF al hacer clic en la miniatura
                    previewWrapper.querySelector('.pdf-preview').addEventListener('click', (e) => {
                        // Evitar que se active cuando se hace clic en el botón de eliminar
                        if (!e.target.closest('.delete-image-btn')) {
                            const pdfUrl = e.currentTarget.getAttribute('data-pdf-url');
                            openPdfModal(pdfUrl);
                        }
                    });

                    previewWrapper.querySelector('.delete-image-btn').addEventListener('click', (e) => {
                        e.stopPropagation();
                        const indexToRemove = e.currentTarget.dataset.index;
                        this.removeFile(indexToRemove);
                    });

                    previewContainer.appendChild(previewWrapper);
                }
            });
        },

        // Acortar nombres de archivo largos
        truncateFileName(name) {
            if (name.length > 20) {
                return name.substring(0, 17) + '...';
            }
            return name;
        },

        // Actualizar input de archivos
        updateInputFiles() {
            const dataTransfer = new DataTransfer();
            this.files.forEach(file => {
                dataTransfer.items.add(file);
            });
            imageInput.files = dataTransfer.files;
        },

        // Manejar selección de archivos
        handleFileSelection(newFiles) {
            const availableSlots = maxFiles - this.files.length;

            if (availableSlots <= 0) {
                this.showNotification(`No se pueden agregar más de ${maxFiles} archivos`);
                return;
            }

            if (newFiles.length > availableSlots) {
                this.showNotification(`Solo puedes agregar ${availableSlots} archivo(s) más. El máximo permitido es ${maxFiles}.`);
            }

            const filesToAdd = Array.from(newFiles).slice(0, availableSlots);
            let hasOversizedFiles = false;
            let hasInvalidTypes = false;
            let validFiles = [];

            filesToAdd.forEach(file => {
                if (file.size > maxSizeBytes) {
                    hasOversizedFiles = true;
                    this.showNotification(`El archivo "${file.name}" excede el tamaño máximo de ${maxSizeMB}MB`);
                    return;
                }

                const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
                if (!allowedTypes.includes(file.type)) {
                    hasInvalidTypes = true;
                    return;
                }

                validFiles.push(file);
            });

            if (hasInvalidTypes) {
                this.showNotification('Solo se permiten imágenes JPG, PNG, GIF y archivos PDF');
            }

            validFiles.forEach(file => {
                this.addFile(file);
            });

            this.renderPreviews();
            this.updateInputFiles();
        },

        // Mostrar/ocultar texto de subida
        toggleUploadText() {
            uploadText.style.display = this.files.length > 0 ? 'none' : 'flex';
        },

        // Mostrar notificaciones
        showNotification(message) {
            alert(message);
        }
    };

    // Eventos de arrastre
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadBox.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (!uploadBox.classList.contains('has-files')) {
                let isValid = false;

                if (e.dataTransfer.items) {
                    isValid = Array.from(e.dataTransfer.items).some(item => {
                        return item.kind === 'file' && (
                                item.type.startsWith('image/') ||
                                item.type === 'application/pdf'
                                );
                    });
                } else if (e.dataTransfer.files) {
                    isValid = Array.from(e.dataTransfer.files).some(file => {
                        return file.type.startsWith('image/') ||
                                file.type === 'application/pdf';
                    });
                }

                if (isValid) {
                    uploadBox.classList.add('drag-over');
                    uploadBox.style.borderColor = '#0d6efd';
                    uploadBox.style.backgroundColor = '#f1f8ff';
                }
            }
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadBox.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadBox.classList.remove('drag-over');

            if (!uploadBox.classList.contains('has-files')) {
                uploadBox.style.borderColor = '#ccc';
                uploadBox.style.backgroundColor = '#f8f9fa';
            }
        });
    });

    // Manejar soltar archivos
    uploadBox.addEventListener('drop', (e) => {
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const totalFiles = fileState.files.length + e.dataTransfer.files.length;

            if (totalFiles > maxFiles) {
                fileState.showNotification(`No se pueden agregar más de ${maxFiles} archivos`);
            } else {
                fileState.handleFileSelection(e.dataTransfer.files);
            }
        }
    });

    // Evento de cambio de input
    imageInput.addEventListener('change', (e) => {
        fileState.handleFileSelection(e.target.files);
    });

    // Eventos de hover
    uploadBox.addEventListener('mouseenter', function () {
        if (fileState.files.length < maxFiles) {
            uploadBox.style.borderColor = '#0d6efd';
            uploadBox.style.backgroundColor = '#f1f8ff';
        }
    });

    uploadBox.addEventListener('mouseleave', function () {
        if (fileState.files.length < maxFiles) {
            uploadBox.style.borderColor = '#ccc';
            uploadBox.style.backgroundColor = '#f8f9fa';
        }
    });

    // Contador de Caracteres en "Breve Descripcion"
    const inputField = document.querySelector('input[name="titulo"]');
    const characterCount = document.querySelector('.character-count');

    if (inputField && characterCount) {
        inputField.addEventListener('input', function () {
            const currentLength = inputField.value.length;
            characterCount.textContent = `${currentLength} / 80`;
        });
    }

    // Cerrar modales al hacer clic fuera
    window.onclick = function (event) {
        const imageModal = document.getElementById('imageModal');
        const pdfModal = document.getElementById('pdfModal');

        if (event.target === imageModal) {
            imageModal.style.display = 'none';
        }

        if (event.target === pdfModal) {
            pdfModal.style.display = 'none';
            document.getElementById('pdfModalContent').src = '';
        }
    };

    // Método para mostrar y ocultar el popover
    const infoIcon = document.querySelector('.info-icon');
    const popover = document.querySelector('.popover');

    if (infoIcon && popover) {
        infoIcon.addEventListener('mouseenter', function () {
            popover.style.display = 'block';
        });

        infoIcon.addEventListener('mouseleave', function () {
            popover.style.display = 'none';
        });
    }

    // Solicitar permiso para notificaciones al cargar la página
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }

    // =============================================
    // FUNCIONALIDAD PARA ASIGNAR SOPORTISTA (MODIFICADA)
    // =============================================

    const btnAsignarSoportista = document.getElementById('btnAsignarSoportista');
    const infoSoportista = document.getElementById('infoSoportista');
    const infoText = document.getElementById('infoText');
    const confirmarAsignacion = document.getElementById('confirmarAsignacion');
    const asignadoParaId = document.getElementById('asignadoParaId');
    const btnCambiarSoportista = document.getElementById('btnCambiarSoportista');
    const btnEliminarSoportista = document.getElementById('btnEliminarSoportista');
    const searchSoportista = document.getElementById('searchSoportista');
    const btnClearSearch = document.getElementById('btnClearSearch');
    const soportistasList = document.getElementById('soportistasList');
    const modalElement = document.getElementById('asignarSoportistaModal');

    // Variables para almacenar la selección
    let selectedSoportistaId = null;
    let selectedSoportistaName = null;

    // Inicializar estados de los botones
    function initSoportistaButtons() {
        if (asignadoParaId && asignadoParaId.value) {
            if (btnAsignarSoportista) btnAsignarSoportista.disabled = true;
            if (btnCambiarSoportista) btnCambiarSoportista.disabled = false;
            if (btnEliminarSoportista) btnEliminarSoportista.disabled = false;

            // Actualizar el texto del botón con el nombre del soportista asignado
            const selectedItem = document.querySelector(`.soportista-item[data-id="${asignadoParaId.value}"]`);
            if (selectedItem) {
                const name = selectedItem.querySelector('.soportista-name').textContent;
                document.getElementById('nombreSoportista').textContent = name;
            }
        } else {
            if (btnAsignarSoportista) btnAsignarSoportista.disabled = false;
            if (btnCambiarSoportista) btnCambiarSoportista.disabled = true;
            if (btnEliminarSoportista) btnEliminarSoportista.disabled = true;
        }
    }

    // Configurar el modal para no afectar el body
    function configureModal() {
        if (!modalElement) return;
        
        // Eliminar la clase 'fade' si existe para evitar animaciones
        modalElement.classList.remove('fade');

        // Configurar eventos personalizados
        modalElement.addEventListener('show.bs.modal', function () {
            // Limpiar estilos del body
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        });

        modalElement.addEventListener('shown.bs.modal', function () {
            // Enfocar el campo de búsqueda al abrir
            if (searchSoportista) {
                searchSoportista.focus();
            }
        });

        modalElement.addEventListener('hidden.bs.modal', function () {
            // Limpiar estilos del body
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';

            // Limpiar selección
            document.querySelectorAll('.soportista-item').forEach(item => {
                item.classList.remove('active');
            });
            selectedSoportistaId = null;
            selectedSoportistaName = null;
            if (infoSoportista) infoSoportista.style.display = 'none';

            // Limpiar búsqueda si existe
            if (searchSoportista) {
                searchSoportista.value = '';
                filterSoportistas('');
            }
        });
    }

    // Función para abrir el modal
    function openAssignModal() {
        if (!modalElement) return;
        
        const modal = new bootstrap.Modal(modalElement, {
            backdrop: true,
            keyboard: true,
            focus: true
        });
        modal.show();
    }

    // Función para filtrar soportistas
    function filterSoportistas(searchTerm) {
        const items = document.querySelectorAll('.soportista-item');
        let hasMatches = false;

        items.forEach(item => {
            const name = item.querySelector('.soportista-name')?.textContent.toLowerCase() || '';
            const code = item.querySelector('.soportista-code')?.textContent.toLowerCase() || '';
            const roles = Array.from(item.querySelectorAll('.role-badge')).map(badge =>
                badge.textContent.toLowerCase()
            ).join(' ');

            const searchLower = searchTerm.toLowerCase();
            const itemText = `${name} ${code} ${roles}`;

            if (itemText.includes(searchLower)) {
                item.style.display = 'flex';
                hasMatches = true;
            } else {
                item.style.display = 'none';
            }
        });

        // Mostrar mensaje si no hay coincidencias
        const noResults = document.getElementById('noResults');
        if (!hasMatches && searchTerm) {
            if (!noResults && soportistasList) {
                const noResultsDiv = document.createElement('div');
                noResultsDiv.id = 'noResults';
                noResultsDiv.className = 'alert alert-warning mt-2';
                noResultsDiv.textContent = 'No se encontraron colaboradores que coincidan con la búsqueda';
                soportistasList.appendChild(noResultsDiv);
            }
        } else if (noResults) {
            noResults.remove();
        }
    }

    // Función para resetear la selección de soportista
    function resetSoportistaSelection() {
        if (asignadoParaId) asignadoParaId.value = '';
        const nombreSoportista = document.getElementById('nombreSoportista');
        if (nombreSoportista) nombreSoportista.textContent = 'Asignar a soportista...';
        selectedSoportistaId = null;
        selectedSoportistaName = null;

        if (btnAsignarSoportista) btnAsignarSoportista.disabled = false;
        if (btnCambiarSoportista) btnCambiarSoportista.disabled = true;
        if (btnEliminarSoportista) btnEliminarSoportista.disabled = true;
    }

    // Inicialización
    initSoportistaButtons();
    configureModal();

    // Evento para seleccionar soportista (delegación de eventos)
    if (soportistasList) {
        soportistasList.addEventListener('click', function (e) {
            const item = e.target.closest('.soportista-item');
            if (!item)
                return;

            // Remover selección previa
            document.querySelectorAll('.soportista-item').forEach(i => i.classList.remove('active'));

            // Agregar selección al item clickeado
            item.classList.add('active');
            selectedSoportistaId = item.getAttribute('data-id');
            selectedSoportistaName = item.querySelector('.soportista-name').textContent;

            // Mostrar información del soportista seleccionado
            const codigo = item.querySelector('.soportista-code').textContent;

            if (infoText) infoText.textContent = `Asignar el ticket a: ${selectedSoportistaName} (${codigo})`;
            if (infoSoportista) infoSoportista.style.display = 'block';
        });
    }

    // Configurar eventos de búsqueda
    if (searchSoportista) {
        searchSoportista.addEventListener('input', function () {
            filterSoportistas(this.value);
        });
    }

    if (btnClearSearch) {
        btnClearSearch.addEventListener('click', function () {
            if (searchSoportista) {
                searchSoportista.value = "";
                filterSoportistas("");
                searchSoportista.focus();
            }
        });
    }

    // Confirmar asignación
    if (confirmarAsignacion) {
        confirmarAsignacion.addEventListener('click', function () {
            if (selectedSoportistaId) {
                if (asignadoParaId) asignadoParaId.value = selectedSoportistaId;
                const nombreSoportista = document.getElementById('nombreSoportista');
                if (nombreSoportista) nombreSoportista.textContent = selectedSoportistaName;

                if (btnAsignarSoportista) btnAsignarSoportista.disabled = true;
                if (btnCambiarSoportista) btnCambiarSoportista.disabled = false;
                if (btnEliminarSoportista) btnEliminarSoportista.disabled = false;

                if (modalElement) {
                    const modal = bootstrap.Modal.getInstance(modalElement);
                    if (modal) modal.hide();
                }
            } else {
                alert('Por favor seleccione un colaborador');
            }
        });
    }

    // Evento para cambiar soportista
    if (btnCambiarSoportista) {
        btnCambiarSoportista.addEventListener('click', function (e) {
            e.preventDefault();
            openAssignModal();
        });
    }

    // Evento para eliminar soportista
    if (btnEliminarSoportista) {
        btnEliminarSoportista.addEventListener('click', function (e) {
            e.preventDefault();
            resetSoportistaSelection();
        });
    }

    // Evento del botón principal de asignar
    if (btnAsignarSoportista) {
        btnAsignarSoportista.addEventListener('click', function (e) {
            if (!this.disabled) {
                openAssignModal();
            }
        });
    }

    // =============================================
    // FUNCIONALIDAD ADICIONAL
    // =============================================

    // Script para el desplegable de campos de administrador
    const toggleBtn = document.getElementById('adminFieldsToggle');
    const adminFields = document.getElementById('adminFields');

    if (toggleBtn && adminFields) {
        toggleBtn.addEventListener('click', function () {
            this.classList.toggle('active');
            adminFields.classList.toggle('active');
        });
    }

    // =============================================
    // MANEJO DEL FORMULARIO CON MODAL DE CONFIRMACIÓN
    // =============================================
    
    // Variables para el control del envío
    let isSubmitting = false;
    const successModal = document.getElementById('successModal');
    let bootstrapSuccessModal = null;

    // Inicializar el modal de éxito
    if (successModal) {
        bootstrapSuccessModal = new bootstrap.Modal(successModal, {
            backdrop: 'static',
            keyboard: false
        });
    }

    // Función para mostrar el modal de éxito
    function showSuccessModal() {
        if (bootstrapSuccessModal) {
            bootstrapSuccessModal.show();
        }
    }

    // Función para limpiar el formulario después del envío exitoso
    function resetForm() {
        const form = document.querySelector('form[action="/tickets/guardar"]');
        if (form) {
            form.reset();
        }
        
        // Limpiar previsualizaciones de archivos
        if (previewContainer) {
            previewContainer.innerHTML = '';
        }
        
        // Resetear estado de archivos
        fileState.files = [];
        fileState.toggleUploadText();
        fileState.updateHoverState();

        // Limpiar selección de soportista si existe
        resetSoportistaSelection();
    }

    // Función para manejar el envío del formulario
    function handleFormSubmit(event) {
        event.preventDefault();
        
        if (isSubmitting) {
            return false;
        }

        const form = event.target.closest('form') || document.querySelector('form[action="/tickets/guardar"]');
        const submitButton = document.getElementById('submitButton');

        // Validación del formulario
        if (!form.checkValidity()) {
            form.reportValidity();
            return false;
        }

        // Marcar como enviando
        isSubmitting = true;
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        }

        // Crear FormData
        const formData = new FormData(form);

        // Realizar petición AJAX
        fetch(form.action, {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (response.ok) {
                // Si la respuesta es exitosa, mostrar el modal
                showSuccessModal();
                resetForm();
            } else {
                // Si hay error, intentar obtener el mensaje de error
                return response.text().then(text => {
                    throw new Error(`Error ${response.status}: ${text || response.statusText}`);
                });
            }
        })
        .catch(error => {
            console.error('Error al enviar el ticket:', error);
            alert('Error al enviar el ticket: ' + error.message);
        })
        .finally(() => {
            // Restaurar botón y estado
            isSubmitting = false;
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = 'Enviar Ticket <i class="fa-solid fa-paper-plane"></i>';
            }
        });

        return false;
    }

    // Prevenir el envío tradicional del formulario
    const form = document.querySelector('form[action="/tickets/guardar"]');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }

    // Manejar click del botón de envío
    const submitButton = document.getElementById('submitButton');
    if (submitButton) {
        submitButton.addEventListener('click', function(event) {
            event.preventDefault();
            handleFormSubmit(event);
        });
    }

    // Manejar el botón de confirmación del modal de éxito
    const confirmButton = document.getElementById('confirmButton');
    if (confirmButton) {
        confirmButton.addEventListener('click', function() {
            if (bootstrapSuccessModal) {
                bootstrapSuccessModal.hide();
            }
            
            // Redirigir a la página anterior o a la página de listado
            const previousPage = sessionStorage.getItem('previousPanel') || '/tickets/listado';
            window.location.href = previousPage;
        });
    }

    // Guardar página anterior para redirección
    const previousPage = document.referrer;
    if (previousPage) {
        sessionStorage.setItem('previousPanel', previousPage);
    }
});