document.addEventListener('DOMContentLoaded', function () {
    const imageInput = document.getElementById('imageInput');
    const previewContainer = document.getElementById('imagePreviewContainer');
    const uploadBox = document.getElementById('uploadBox');
    const uploadText = document.getElementById('uploadText');
    const maxImages = 2;
    const maxSizeMB = 5;
    const maxSizeBytes = maxSizeMB * 1024 * 1024; // 5MB en bytes

    // Configuración de estado de imágenes
    const imageState = {
        files: [],

        // Método para agregar imagen
        addImage(file) {
            if (this.files.length >= maxImages) {
                this.showNotification(`No se pueden agregar más de ${maxImages} imágenes`);
                return false;
            }

            if (!this.validateImage(file)) {
                return false;
            }

            this.files.push(file);
            this.toggleUploadText();
            this.updateHoverState(); // Actualizar estado del hover
            return true;
        },

        resetUploadBoxStyle() {
            uploadBox.style.borderColor = '#ccc';
            uploadBox.style.backgroundColor = '#f8f9fa';
            uploadBox.classList.remove('drag-over');
        },

        // Método para eliminar imagen
        removeImage(index) {
            this.files.splice(index, 1);
            this.renderPreviews();
            this.updateInputFiles();
            this.toggleUploadText();
            this.updateHoverState(); // Actualizar estado del hover
        },

        // Actualizar el estado del hover basado en si hay archivos o no
        updateHoverState() {
            if (this.files.length >= maxImages) {
                // Solo deshabilitar hover cuando se alcanza el máximo de imágenes
                uploadBox.classList.add('has-images');
                this.resetUploadBoxStyle();
            } else {
                // Permitir hover cuando hay espacio para más imágenes
                uploadBox.classList.remove('has-images');
            }
        },

        // Validar imagen
        validateImage(file) {
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];

            if (!allowedTypes.includes(file.type)) {
                this.showNotification('Solo se permiten imágenes JPG, PNG y GIF');
                return false;
            }

            if (file.size > maxSizeBytes) {
                this.showNotification(`La imagen "${file.name}" excede el tamaño máximo de ${maxSizeMB}MB`);
                return false;
            }

            return true;
        },

        // Renderizar vistas previas
        renderPreviews() {
            previewContainer.innerHTML = '';

            this.files.forEach((file, index) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const previewWrapper = document.createElement('div');
                    previewWrapper.className = 'image-preview-wrapper';
                    previewWrapper.innerHTML = `
                        <div class="image-preview">
                            <img src="${e.target.result}" alt="Preview" data-index="${index}">
                            <button type="button" class="delete-image-btn" data-index="${index}">
                                <i class="fas fa-trash"></i>
                            </button>
                            <div class="image-name">${file.name}</div>
                        </div>
                    `;

                    previewWrapper.querySelector('.delete-image-btn').addEventListener('click', (e) => {
                        const indexToRemove = e.currentTarget.dataset.index;
                        this.removeImage(indexToRemove);
                    });

                    previewWrapper.querySelector('img').addEventListener('click', (e) => {
                        const imgSrc = e.target.src;
                        openModal(imgSrc);
                    });

                    previewContainer.appendChild(previewWrapper);
                };
                reader.readAsDataURL(file);
            });
        },

        // Actualizar input de archivos
        updateInputFiles() {
            const dataTransfer = new DataTransfer();
            this.files.forEach(file => {
                dataTransfer.items.add(new File([file], file.name, {
                    type: file.type,
                    lastModified: file.lastModified
                }));
            });
            imageInput.files = dataTransfer.files;
        },

        // Manejar selección de archivos (MODIFICADO)
        handleFileSelection(newFiles) {
            const availableSlots = maxImages - this.files.length;

            // Detener completamente si no hay slots disponibles
            if (availableSlots <= 0) {
                this.showNotification(`No se pueden agregar más de ${maxImages} imágenes`);
                return;
            }

            // Verificar si se están intentando subir más archivos de los permitidos
            if (newFiles.length > availableSlots) {
                this.showNotification(`Solo puedes agregar ${availableSlots} imagen(es) más. El máximo permitido es ${maxImages}.`);
            }

            // Tomar solo la cantidad de archivos permitidos
            const filesToAdd = Array.from(newFiles).slice(0, availableSlots);

            // Verificar el tamaño de cada archivo antes de procesarlo
            let hasOversizedFiles = false;
            let hasInvalidTypes = false;
            let validFiles = [];

            filesToAdd.forEach(file => {
                // Verificar tamaño
                if (file.size > maxSizeBytes) {
                    hasOversizedFiles = true;
                    this.showNotification(`La imagen "${file.name}" excede el tamaño máximo de ${maxSizeMB}MB`);
                    return;
                }

                // Verificar tipo
                const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
                if (!allowedTypes.includes(file.type)) {
                    hasInvalidTypes = true;
                    return;
                }

                // Si pasa ambas validaciones, agregar al array de archivos válidos
                validFiles.push(file);
            });

            if (hasInvalidTypes) {
                this.showNotification('Solo se permiten imágenes JPG, PNG y GIF');
            }

            // Procesar solo los archivos válidos
            validFiles.forEach(file => {
                this.addImage(file);
            });

            this.renderPreviews();
            this.updateInputFiles();
        },

        // Mostrar/ocultar texto de subida
        toggleUploadText() {
            if (this.files.length > 0) {
                uploadText.style.display = 'none';
            } else {
                uploadText.style.display = 'flex';
            }
        },

        // Nuevo método para mostrar notificaciones del navegador
        showNotification(message) {
            // Verificar si las notificaciones están soportadas
            if (!('Notification' in window)) {
                console.log('Este navegador no soporta notificaciones');
                alert(message); // Fallback a alert tradicional
                return;
            }

            // Verificar permisos de notificación
            if (Notification.permission === 'granted') {
                // Si ya tenemos permiso, crear y mostrar la notificación
                const notification = new Notification('Mesa de Ayuda', {
                    body: message,
                    icon: '/favicon.ico' // Puedes cambiar esto a la ruta de tu favicon
                });

                // Cerrar la notificación después de 5 segundos
                setTimeout(() => {
                    notification.close();
                }, 5000);
            } else if (Notification.permission !== 'denied') {
                // Si no se ha pedido permiso, pedirlo
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        // Si nos dan permiso, mostrar la notificación
                        const notification = new Notification('Mesa de Ayuda', {
                            body: message,
                            icon: '/favicon.ico'
                        });

                        // Cerrar la notificación después de 5 segundos
                        setTimeout(() => {
                            notification.close();
                        }, 5000);
                    } else {
                        // Si nos niegan el permiso, fallback a alert
                        alert(message);
                    }
                });
            } else {
                // Si ya nos han negado el permiso, fallback a alert
                alert(message);
            }
        }
    };

    // Función para abrir el modal
    function openModal(imgSrc) {
        const modal = document.getElementById('imageModal');
        const modalImg = document.getElementById('modalImage');
        modal.style.display = 'block';
        modalImg.src = imgSrc;
    }

    // Función para cerrar el modal
    document.querySelector('.close-modal').addEventListener('click', () => {
        const modal = document.getElementById('imageModal');
        modal.style.display = 'none';
    });

    // Eventos de arrastre (MODIFICADOS)
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadBox.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();

            // Solo agregar la clase si no hay imágenes
            if (!uploadBox.classList.contains('has-images')) {
                // Verificar que es una imagen válida (incluyendo PNG y GIF)
                if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
                    let isValid = Array.from(e.dataTransfer.items).some(item => {
                        return item.kind === 'file' &&
                                (item.type === 'image/jpeg' ||
                                        item.type === 'image/png' ||
                                        item.type === 'image/gif');
                    });

                    if (isValid) {
                        uploadBox.classList.add('drag-over');
                        uploadBox.style.borderColor = '#0d6efd';
                        uploadBox.style.backgroundColor = '#f1f8ff';
                    }
                } else {
                    // Fallback si no podemos verificar el tipo (comportamiento anterior)
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
            // Solo restaurar estilos si no hay imágenes
            if (!uploadBox.classList.contains('has-images')) {
                uploadBox.style.borderColor = '#ccc';
                uploadBox.style.backgroundColor = '#f8f9fa';
            }
        });
    });

    // Manejar soltar archivos (MODIFICADO)
    uploadBox.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();

        uploadBox.classList.remove('drag-over');

        // Validar número de archivos incluso antes de procesarlos
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const totalFiles = imageState.files.length + e.dataTransfer.files.length;

            if (totalFiles > maxImages) {
                imageState.showNotification(`No se pueden agregar más de ${maxImages} imágenes`);
            } else {
                imageState.handleFileSelection(e.dataTransfer.files);
            }
        }

        // Restaurar estilos
        if (!uploadBox.classList.contains('has-images')) {
            uploadBox.style.borderColor = '#ccc';
            uploadBox.style.backgroundColor = '#f8f9fa';
        }
    });

    // Evento de cambio de input
    imageInput.addEventListener('change', (e) => {
        imageState.handleFileSelection(e.target.files);
    });

    // Eventos de hover (mouseenter/mouseleave)
    uploadBox.addEventListener('mouseenter', function () {
        // Modificar para permitir hover incluso con una imagen
        // siempre que no se haya alcanzado el máximo de imágenes
        if (imageState.files.length < maxImages) {
            uploadBox.style.borderColor = '#0d6efd';
            uploadBox.style.backgroundColor = '#f1f8ff';
        }
    });

    uploadBox.addEventListener('mouseleave', function () {
        // Modificar también aquí con la misma lógica
        if (imageState.files.length < maxImages) {
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

    // Configuración del modal y otros elementos
    const modal = document.getElementById('imageModal');
    const closeBtn = document.querySelector('.close-modal');

    closeBtn.onclick = function () {
        modal.style.display = 'none';
    };

    window.onclick = function (event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };

    //Metodo para mostrar y ocultar el popover
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

    // También debes agregar un poco de CSS para esto
    // Puedes añadir estas reglas a tu archivo CSS o insertarlas dinámicamente:
    const style = document.createElement('style');
    style.textContent = `
        .upload-box.has-images {
            pointer-events: auto !important; /* Permitir eventos para los botones de eliminar */
        }
        
        .upload-box.has-images #imageInput {
            pointer-events: none; /* Desactivar eventos para el input cuando hay imágenes */
        }
        
        /* Asegúrate de permitir clicks en los botones de eliminar */
        .upload-box.has-images .delete-image-btn {
            pointer-events: auto !important;
        }
        
        .upload-box.has-images img {
            pointer-events: auto !important;
        }
    `;
    document.head.appendChild(style);

    // Solicitar permiso para notificaciones al cargar la página
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }
});














$(document).ready(function () {
    // Almacenar la URL de referencia al cargar la página
    const previousPage = document.referrer;
    sessionStorage.setItem('previousPanel', previousPage);

    // Flag para prevenir múltiples envíos
    let isSubmitting = false;

    // Inicializar el modal con configuración para evitar cierre accidental
    var successModal = new bootstrap.Modal(document.getElementById('successModal'), {
        backdrop: 'static',
        keyboard: false
    });

    // Manejar el envío del formulario
    $('form').on('submit', function (e) {
        // Prevenir la acción por defecto inmediatamente
        e.preventDefault();

        // Verificar si ya se está enviando el formulario
        if (isSubmitting) {
            return false;
        }

        // Marcar como enviando
        isSubmitting = true;

        // Deshabilitar el botón para evitar múltiples envíos
        const $submitButton = $('#submitButton');
        $submitButton.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Enviando...');

        // Crear FormData para enviar los archivos
        var formData = new FormData(this);

        // Enviar el formulario mediante AJAX
        $.ajax({
            url: $(this).attr('action'),
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function (response) {
                // Mostrar el modal con la animación
                successModal.show();

                // Limpiar el formulario si el envío fue exitoso
                $('form')[0].reset();
                $('#imagePreviewContainer').empty();
            },
            error: function (xhr) {
                // Mostrar error al usuario
                alert('Error al enviar el ticket: ' + (xhr.responseJSON?.message || xhr.statusText));
            },
        });

        // Retornar falso para asegurar que no se envíe el formulario
        return false;
    });

    // Manejar el botón de confirmación
    $('#confirmButton').on('click', function () {
        successModal.hide();

        // Obtener la URL almacenada o usar una por defecto
        const previousPanel = sessionStorage.getItem('previousPanel') || '/index';

        // Redirigir al panel anterior
        window.location.href = previousPanel;
    });
});