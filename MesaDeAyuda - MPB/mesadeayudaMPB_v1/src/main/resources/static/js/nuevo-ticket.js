document.addEventListener('DOMContentLoaded', function() {
    const imageInput = document.getElementById('imageInput');
    const previewContainer = document.getElementById('imagePreviewContainer');
    const uploadText = document.getElementById('uploadText');
    const uploadBox = document.getElementById('uploadBox');
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const closeModal = document.querySelector('.close-modal');

    // Variables for tracking uploaded images
    let uploadedImages = [];
    const maxImages = 2;

    function validateImage(file) {
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (file.size > maxSize) {
            showAlert('Cada imagen debe ser menor a 5MB');
            return false;
        }

        if (!file.type.startsWith('image/')) {
            showAlert('Solo se permiten archivos de imagen');
            return false;
        }

        return true;
    }

    function showAlert(message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-warning alert-dismissible fade show';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        document.querySelector('.main-form').insertBefore(alertDiv, document.querySelector('h1'));
    }

    function addImagePreview(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const wrapper = document.createElement('div');
            wrapper.className = 'image-preview-wrapper';

            wrapper.innerHTML = `
                <div class="image-preview">
                    <img src="${e.target.result}" alt="Preview">
                    <div class="image-preview-overlay">
                        <button type="button" class="view-image-btn" title="Ver imagen">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button type="button" class="delete-image-btn" title="Eliminar imagen">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <div class="image-name">${file.name}</div>
                </div>
            `;

            // Delete image event
            wrapper.querySelector('.delete-image-btn').addEventListener('click', () => {
                uploadedImages = uploadedImages.filter(img => img !== file);
                wrapper.remove();
                updateUploadState();
                
                // Create a new FileList with remaining files
                const newFileList = new DataTransfer();
                uploadedImages.forEach(img => newFileList.items.add(img));
                imageInput.files = newFileList.files;
            });

            // View image event
            wrapper.querySelector('.view-image-btn').addEventListener('click', () => {
                modalImage.src = e.target.result;
                modal.style.display = 'block';
            });

            previewContainer.appendChild(wrapper);
            uploadedImages.push(file);
            updateUploadState();
        };
        reader.readAsDataURL(file);
    }

    function updateUploadState() {
        uploadText.style.display = uploadedImages.length >= maxImages ? 'none' : 'flex';
        imageInput.disabled = uploadedImages.length >= maxImages;

        if (uploadedImages.length === 0) {
            previewContainer.innerHTML = '<div id="uploadText"><i class="fas fa-arrow-up-from-bracket"></i><span>Subir Imagen</span></div>';
        }
    }

    // File input change event
    imageInput.addEventListener('change', function(e) {
        const files = Array.from(e.target.files);

        if (uploadedImages.length + files.length > maxImages) {
            showAlert(`Solo se permiten máximo ${maxImages} imágenes`);
            this.value = '';
            return;
        }

        files.forEach(file => {
            if (validateImage(file)) {
                addImagePreview(file);
            }
        });
    });

    // Modal events
    closeModal.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });

    // Drag and drop functionality
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadBox.addEventListener(eventName, preventDefaults);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadBox.addEventListener(eventName, () => {
            uploadBox.classList.add('drag-over');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadBox.addEventListener(eventName, () => {
            uploadBox.classList.remove('drag-over');
        });
    });

    uploadBox.addEventListener('drop', (e) => {
        const files = Array.from(e.dataTransfer.files);

        if (uploadedImages.length + files.length > maxImages) {
            showAlert(`Solo se permiten máximo ${maxImages} imágenes`);
            return;
        }

        files.forEach(file => {
            if (validateImage(file)) {
                addImagePreview(file);
            }
        });
    });

    // Initialize upload state
    updateUploadState();
});





//Contador de Caracteres en "Breve Descripcion"
document.addEventListener('DOMContentLoaded', function () {
    // Selecciona el campo de texto y el contador de caracteres
    const inputField = document.querySelector('input[name="titulo"]');
    const characterCount = document.querySelector('.character-count');

    // Verifica si los elementos existen
    if (inputField && characterCount) {
        // Escucha el evento 'input' en el campo de texto
        inputField.addEventListener('input', function () {
            // Obtiene la longitud del texto ingresado
            const currentLength = inputField.value.length;
            // Actualiza el texto del contador
            characterCount.textContent = `${currentLength} / 80`;
        });
    }
});




//Contador de Caracteres en "Breve Descripcion"
document.addEventListener('DOMContentLoaded', function () {
    // Selecciona el campo de texto y el contador de caracteres
    const inputField = document.querySelector('input[name="titulo"]');
    const characterCount = document.querySelector('.character-count');

    // Verifica si los elementos existen
    if (inputField && characterCount) {
        // Escucha el evento 'input' en el campo de texto
        inputField.addEventListener('input', function () {
            // Obtiene la longitud del texto ingresado
            const currentLength = inputField.value.length;
            // Actualiza el texto del contador
            characterCount.textContent = `${currentLength} / 80`;
        });
    }
});