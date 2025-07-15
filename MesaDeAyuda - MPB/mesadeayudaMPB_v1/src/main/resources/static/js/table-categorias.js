document.addEventListener("DOMContentLoaded", function () {
    // 1. Configuración de la tabla y redimensionamiento de columnas
    const table = document.querySelector('.tickets-table');
    const tableContainer = document.querySelector('.table-container');
    const sidebar = document.querySelector('.sidebar');

    const defaultColumnWidths = [40, 200, 400, 60, 80];
    let currentColumnWidths = [...defaultColumnWidths];

    // Funciones para manejo del redimensionamiento de columnas
    function adjustTableWidth() {
        if (!table || !tableContainer)
            return;

        requestAnimationFrame(() => {
            currentColumnWidths = [...defaultColumnWidths];
            const containerWidth = tableContainer.offsetWidth;
            const totalColumnsWidth = currentColumnWidths.reduce((a, b) => a + b, 0);

            table.style.width = containerWidth >= totalColumnsWidth
                    ? `${containerWidth}px`
                    : `${totalColumnsWidth}px`;

            const headers = table.querySelectorAll('thead tr:first-child th');
            headers.forEach((header, index) => {
                if (index < currentColumnWidths.length) {
                    header.style.width = `${currentColumnWidths[index]}px`;
                }
            });

            const rows = table.querySelectorAll('tbody tr');
            rows.forEach(row => {
                const cells = row.children;
                for (let i = 0; i < cells.length; i++) {
                    if (i < currentColumnWidths.length) {
                        cells[i].style.width = `${currentColumnWidths[i]}px`;
                    }
                }
            });
        });
    }

    // 2. Funciones para el ordenamiento de la tabla
    function initSorting() {
        const headers = table?.querySelectorAll('thead th');
        if (!headers)
            return;

        const sortState = {column: null, direction: 'asc'};

        headers.forEach((header, index) => {
            const sortIcon = header.querySelector('.sort-icons i');
            if (!sortIcon)
                return;

            sortIcon.style.cursor = 'pointer';
            sortIcon.addEventListener('click', () => {
                sortState.column = sortState.column === index
                        ? (sortState.direction === 'asc' ? index : null)
                        : index;

                sortState.direction = sortState.column === index
                        ? (sortState.direction === 'asc' ? 'desc' : 'asc')
                        : 'asc';

                updateSortIcons(sortState.column, sortState.direction);
                sortTable(index, sortState.direction);
                adjustTableWidth();
            });
        });

        // Orden inicial por ID ascendente
        sortState.column = 0;
        sortState.direction = 'asc';
        updateSortIcons(sortState.column, sortState.direction);
        sortTable(0, sortState.direction);
    }

    function updateSortIcons(activeColumn, direction) {
        const headers = table?.querySelectorAll('thead th');
        if (!headers)
            return;

        headers.forEach((header, index) => {
            const sortIcon = header.querySelector('.sort-icons i');
            if (!sortIcon)
                return;

            sortIcon.className = index === activeColumn
                    ? (direction === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down')
                    : 'fas fa-sort';
        });
    }

    function sortTable(columnIndex, direction) {
        const tbody = table?.querySelector('tbody');
        if (!tbody || tbody.querySelectorAll('tr').length <= 1)
            return;

        const rows = Array.from(tbody.querySelectorAll('tr:not([colspan])'));
        if (rows.length === 0)
            return;

        const emptyRow = tbody.querySelector('tr[colspan]');

        rows.sort((rowA, rowB) => {
            const cellA = rowA.querySelector(`td:nth-child(${columnIndex + 1})`);
            const cellB = rowB.querySelector(`td:nth-child(${columnIndex + 1})`);
            if (!cellA || !cellB)
                return 0;

            let valueA = cellA.textContent.trim();
            let valueB = cellB.textContent.trim();

            // Para valores numéricos (ID)
            if (columnIndex === 0) {
                const numA = parseInt(valueA) || 0;
                const numB = parseInt(valueB) || 0;
                return direction === 'asc' ? numA - numB : numB - numA;
            }

            // Para estado (Activo/Inactivo)
            if (columnIndex === 3) {
                return direction === 'asc'
                        ? valueA.localeCompare(valueB)
                        : valueB.localeCompare(valueA);
            }

            // Ordenamiento alfanumérico
            return direction === 'asc'
                    ? valueA.localeCompare(valueB)
                    : valueB.localeCompare(valueA);
        });

        tbody.innerHTML = '';
        rows.forEach(row => tbody.appendChild(row));
        if (emptyRow)
            tbody.appendChild(emptyRow);
    }

    // 3. Funciones para los filtros y paginación
    function handleSearch() {
        const searchInput = document.getElementById('searchInputCategorias');
        const searchQuery = searchInput.value.trim();

        showLoader(true);

        // Obtener parámetros actuales de la URL
        const urlParams = new URLSearchParams(window.location.search);
        const currentPage = urlParams.get('page') || 0;
        const currentSize = urlParams.get('size') || 15;

        // Construir URL para la búsqueda
        let url = `/categoria/listado?page=${currentPage}&size=${currentSize}`;
        if (searchQuery) {
            url += `&search=${encodeURIComponent(searchQuery)}`;
        }

        // Realizar la búsqueda asíncrona
        fetch(url, {
            headers: {
                'Accept': 'text/html'
            }
        })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Error en la búsqueda');
                    }
                    return response.text();
                })
                .then(html => {
                    // Parsear el HTML de respuesta
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');

                    // Extraer solo la parte de la tabla y paginación
                    const newTable = doc.querySelector('.table-container');
                    const newPagination = doc.querySelector('.table-header');

                    // Actualizar el DOM
                    if (newTable) {
                        document.querySelector('.table-container').innerHTML = newTable.innerHTML;
                    }
                    if (newPagination) {
                        document.querySelector('.table-header').innerHTML = newPagination.innerHTML;
                    }

                    // Reconfigurar eventos después de actualizar el DOM
                    setupTableEvents();
                })
                .catch(error => {
                    console.error('Error en búsqueda:', error);
                    showToast('error', 'Error al realizar la búsqueda');
                })
                .finally(() => {
                    showLoader(false);
                });
    }

    // Función para configurar eventos después de actualizar la tabla
    function setupTableEvents() {
        // Reconfigurar eventos de los botones de acción
        document.querySelectorAll('button[data-action="edit"]').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                const categoriaId = this.getAttribute('data-id');
                if (!categoriaId) {
                    showToast('error', 'ID de categoría no válido');
                    return;
                }
                loadCategoriaData(categoriaId);
            });
        });

        document.querySelectorAll('button[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                const categoriaId = this.getAttribute('data-id');
                const categoriaName = this.closest('tr').querySelector('td:nth-child(2)').textContent;
                openDeleteModal(categoriaId, categoriaName);
            });
        });

        document.querySelectorAll('button[data-action="toggle"]').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                const categoriaId = this.getAttribute('data-id');
                if (!categoriaId) {
                    showToast('error', 'ID de categoría no válido');
                    return;
                }
                toggleCategoriaEstado(categoriaId);
            });
        });
    }

    function setupFilters() {
        const searchInput = document.getElementById('searchInputCategorias');

        if (searchInput) {
            let searchTimeout;

            searchInput.addEventListener('input', function () {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    handleSearch();
                }, 500);
            });

            // Manejar la tecla Enter
            searchInput.addEventListener('keyup', function (e) {
                if (e.key === 'Enter') {
                    clearTimeout(searchTimeout);
                    handleSearch();
                }
            });
        }
    }
    
    // Asegurar que los botones Cancelar funcionen en todos los modals
    function setupModalCancelButtons() {
        document.querySelectorAll('.neon-modal .btn-secondary').forEach(btn => {
            btn.addEventListener('click', function() {
                const modal = this.closest('.neon-modal');
                if (modal) {
                    closeNeonModal(modal.id);
                }
            });
        });
    }

    function setupPagination() {
        const recordsPerPage = document.getElementById('recordsPerPageCategorias');
        if (!recordsPerPage)
            return;

        recordsPerPage.addEventListener('change', function () {
            const size = this.value;
            const urlParams = new URLSearchParams(window.location.search);
            const searchQuery = urlParams.get('search') || '';

            let newUrl = `${window.location.pathname}?page=0&size=${size}`;

            if (searchQuery)
                newUrl += `&search=${encodeURIComponent(searchQuery)}`;

            window.location.href = newUrl;
        });

        // Establecer valor actual
        const urlParams = new URLSearchParams(window.location.search);
        recordsPerPage.value = urlParams.get('size') || '15';
    }

    // 4. Funciones para los modales
    function openNeonModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = "block";
            document.body.style.overflow = "hidden";

            const firstInput = modal.querySelector('input:not([type="hidden"])');
            if (firstInput)
                firstInput.focus();
        }
    }

    function closeNeonModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = "none";
            document.body.style.overflow = "auto";

            const form = modal.querySelector('form');
            if (form)
                form.reset();
        }
    }

    // 5. Funciones para carga de datos de categoría
    function loadCategoriaData(categoriaId) {
        showLoader(true);

        fetch(`/categoria/obtener/${categoriaId}`, {
            headers: {'Accept': 'application/json'}
        })
                .then(response => {
                    const contentType = response.headers.get('content-type');
                    if (!contentType || !contentType.includes('application/json')) {
                        return response.text().then(text => {
                            throw new Error(`Respuesta no JSON: ${text.substring(0, 100)}...`);
                        });
                    }

                    if (!response.ok) {
                        return response.json().then(err => {
                            throw new Error(err.error || `Error HTTP: ${response.status}`);
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    if (!data.success)
                        throw new Error(data.message || 'Datos de categoría no recibidos');

                    // Llenar formulario
                    document.getElementById('editCategoriaId').value = categoriaId;
                    document.getElementById('editNombre').value = data.nombre || '';
                    document.getElementById('editDescripcion').value = data.descripcion || '';
                    document.getElementById('editActivo').checked = data.activo;

                    // Actualizar acción del formulario
                    document.getElementById('formEditCategoria').setAttribute('action', `/categoria/actualizar/${categoriaId}`);

                    openNeonModal('neonEditCategoriaModal');
                })
                .catch(error => {
                    console.error('Error al cargar categoría:', error);
                    showToast('error', `Error al cargar datos: ${error.message}`);
                })
                .finally(() => {
                    showLoader(false);
                });
    }

    // 6. Funciones para formularios
    function handleCreateFormSubmit(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);

        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;

        // Validación de campos obligatorios
        if (!formData.get('nombre')?.trim()) {
            showToast('error', 'El campo Nombre es obligatorio');
            return;
        }

        // Manejo especial del checkbox 'activo'
        const activoCheckbox = form.querySelector('input[name="activo"][type="checkbox"]');
        if (activoCheckbox) {
            // Eliminar el input hidden de 'activo' para evitar duplicados
            const hiddenActivo = form.querySelector('input[name="activo"][type="hidden"]');
            if (hiddenActivo) {
                formData.delete('activo');
            }
            // Establecer el valor correcto basado en si está marcado o no
            formData.set('activo', activoCheckbox.checked ? 'true' : 'false');
        }

        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando...';
        submitButton.disabled = true;
        showLoader(true);

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
                            throw new Error(err.message || 'Error al crear categoría');
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    if (!data.success) {
                        throw new Error(data.message || 'Error al crear categoría');
                    }

                    closeNeonModal('neonCreateCategoriaModal');
                    
                    // Guardar mensaje en sessionStorage antes de recargar
                    sessionStorage.setItem('successMessage', data.message || 'Categoría creada exitosamente');
                    sessionStorage.setItem('successType', 'create');
                    
                    // Recargar la página para mostrar cambios
                    window.location.reload();
                })
                .catch(error => {
                    console.error('Error al crear categoría:', error);
                    showToast('error', error.message);
                })
                .finally(() => {
                    submitButton.innerHTML = originalButtonText;
                    submitButton.disabled = false;
                    showLoader(false);
                });
    }

    function handleEditFormSubmit(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);

        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;

        // Validación de campos obligatorios
        if (!formData.get('nombre')?.trim()) {
            showToast('error', 'El campo Nombre es obligatorio');
            return;
        }

        // Manejo especial del checkbox 'activo'
        const activoCheckbox = form.querySelector('input[name="activo"][type="checkbox"]');
        if (activoCheckbox) {
            // Eliminar el input hidden de 'activo' para evitar duplicados
            const hiddenActivo = form.querySelector('input[name="activo"][type="hidden"]');
            if (hiddenActivo) {
                formData.delete('activo');
            }
            // Establecer el valor correcto basado en si está marcado o no
            formData.set('activo', activoCheckbox.checked ? 'true' : 'false');
        }

        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';
        submitButton.disabled = true;
        showLoader(true);

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
                            throw new Error(err.message || 'Error al actualizar categoría');
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    if (!data.success) {
                        throw new Error(data.message || 'Error al actualizar categoría');
                    }

                    closeNeonModal('neonEditCategoriaModal');
                    
                    // Guardar mensaje en sessionStorage antes de recargar
                    sessionStorage.setItem('successMessage', data.message || 'Categoría actualizada exitosamente');
                    sessionStorage.setItem('successType', 'update');
                    
                    // Recargar la página para mostrar cambios
                    window.location.reload();
                })
                .catch(error => {
                    console.error('Error al actualizar categoría:', error);
                    showToast('error', error.message);
                })
                .finally(() => {
                    submitButton.innerHTML = originalButtonText;
                    submitButton.disabled = false;
                    showLoader(false);
                });
    }

    function handleDeleteFormSubmit(event) {
        event.preventDefault();

        const form = event.target;
        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;

        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Eliminando...';
        submitButton.disabled = true;
        showLoader(true);

        fetch(form.action, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('input[name="_csrf"]').value
            },
            body: JSON.stringify({})
        })
                .then(response => {
                    if (!response.ok) {
                        return response.json().then(err => {
                            throw new Error(err.error || 'Error al eliminar categoría');
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.success) {
                        // Cerrar modal primero
                        closeNeonModal('neonDeleteCategoriaModal');
                        
                        // Guardar mensaje en sessionStorage antes de recargar
                        sessionStorage.setItem('successMessage', data.message || 'Categoría eliminada exitosamente');
                        sessionStorage.setItem('successType', 'delete');
                        
                        // Recargar la página para mostrar cambios
                        window.location.reload();
                    } else {
                        throw new Error(data.message);
                    }
                })
                .catch(error => {
                    console.error('Error al eliminar categoría:', error);
                    showToast('error', error.message);
                    
                    // Restaurar botón en caso de error
                    submitButton.innerHTML = originalButtonText;
                    submitButton.disabled = false;
                    showLoader(false);
                });
    }

    function toggleCategoriaEstado(categoriaId) {
        showLoader(true);

        fetch(`/categoria/toggle-estado/${categoriaId}`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('input[name="_csrf"]').value
            }
        })
                .then(response => {
                    if (!response.ok) {
                        return response.json().then(err => {
                            throw new Error(err.error || 'Error al cambiar estado');
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.success) {
                        // Guardar mensaje en sessionStorage antes de recargar
                        sessionStorage.setItem('successMessage', data.message || 'Estado actualizado');
                        sessionStorage.setItem('successType', 'toggle');
                        
                        // Recargar la página para mostrar cambios
                        window.location.reload();
                    } else {
                        throw new Error(data.message);
                    }
                })
                .catch(error => {
                    console.error('Error al cambiar estado:', error);
                    showToast('error', error.message);
                })
                .finally(() => {
                    showLoader(false);
                });
    }

    function openDeleteModal(categoriaId, categoriaName) {
        document.getElementById('deleteCategoriaId').value = categoriaId;
        document.getElementById('deleteCategoriaName').textContent = categoriaName;
        document.getElementById('formDeleteCategoria').setAttribute('action', `/categoria/eliminar/${categoriaId}`);
        openNeonModal('neonDeleteCategoriaModal');
    }

    // 7. Funciones auxiliares
    function showToast(type, message) {
        const toast = document.getElementById(`toast-${type}`);
        if (!toast)
            return;

        const messageElement = toast.querySelector('.toast-message span');
        if (messageElement)
            messageElement.textContent = message;

        toast.style.display = 'block';
        setTimeout(() => toast.style.display = 'none', 5000);
    }

    function showLoader(show) {
        const loader = document.getElementById('globalLoader');
        if (loader)
            loader.style.display = show ? 'flex' : 'none';
    }

    // Función para mostrar mensajes después de recargar la página
    function checkForSuccessMessages() {
        const successMessage = sessionStorage.getItem('successMessage');
        const successType = sessionStorage.getItem('successType');
        
        if (successMessage) {
            // Mostrar el toast con un pequeño delay para que la página termine de cargar
            setTimeout(() => {
                showToast('success', successMessage);
            }, 100);
            
            // Limpiar los mensajes del sessionStorage
            sessionStorage.removeItem('successMessage');
            sessionStorage.removeItem('successType');
        }
        
        // También verificar mensaje de eliminación (manteniendo compatibilidad)
        const deleteMessage = sessionStorage.getItem('deleteSuccessMessage');
        if (deleteMessage) {
            setTimeout(() => {
                showToast('success', deleteMessage);
            }, 100);
            sessionStorage.removeItem('deleteSuccessMessage');
        }
    }

    // 8. Configuración inicial
    function initialize() {
        // Verificar mensajes de éxito al cargar la página
        checkForSuccessMessages();
        
        // Configurar el botón de crear categoría
        const btnCreateCategoria = document.getElementById('btnCreateCategoria');
        if (btnCreateCategoria) {
            btnCreateCategoria.addEventListener('click', function (e) {
                e.preventDefault();
                openNeonModal('neonCreateCategoriaModal');
            });
        }

        // Verificar si hay parámetros de éxito en la URL
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('updated')) {
            showToast('success', 'Categoría actualizada correctamente');
            // Limpiar el parámetro de la URL sin recargar
            history.replaceState(null, '', window.location.pathname);
        }

        // Configuración de la tabla
        if (table) {
            // Redimensionamiento
            let isResizing = false;
            let currentResizer = null;
            let startX, startWidth;

            function resize(e) {
                if (!isResizing)
                    return;

                const th = currentResizer.closest('th');
                const delta = e.pageX - startX;
                const columnIndex = Array.from(th.parentElement.children).indexOf(th);
                const newWidth = Math.max(70, startWidth + delta);

                currentColumnWidths[columnIndex] = newWidth;

                const allThCells = table.querySelectorAll(`thead tr:first-child th:nth-child(${columnIndex + 1})`);
                const allTdCells = table.querySelectorAll(`tbody tr td:nth-child(${columnIndex + 1})`);

                allThCells.forEach(cell => cell.style.width = `${newWidth}px`);
                allTdCells.forEach(cell => cell.style.width = `${newWidth}px`);
            }

            function stopResize() {
                if (!isResizing)
                    return;

                isResizing = false;
                currentResizer?.classList.remove('active');
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                document.removeEventListener('mousemove', resize);
                document.removeEventListener('mouseup', stopResize);
                table.classList.remove('resizing');
            }

            function initResize(e) {
                isResizing = true;
                currentResizer = e.target;
                const th = currentResizer.closest('th');

                startX = e.pageX;
                startWidth = th.offsetWidth;
                currentResizer.classList.add('active');
                document.body.style.cursor = 'col-resize';
                document.addEventListener('mousemove', resize);
                document.addEventListener('mouseup', stopResize);
                document.body.style.userSelect = 'none';
                table?.classList.add('resizing');
            }

            function setupResizers() {
                const resizers = table?.querySelectorAll('.resizer');
                if (!resizers)
                    return;

                resizers.forEach(resizer => {
                    resizer.addEventListener('mousedown', initResize);
                });
            }

            function createResizers() {
                const headers = table?.querySelectorAll('thead tr:first-child th');
                if (!headers)
                    return;

                headers.forEach(header => {
                    if (!header.querySelector('.resizer')) {
                        const resizer = document.createElement('div');
                        resizer.className = 'resizer';
                        header.appendChild(resizer);
                    }
                });

                setupResizers();
            }

            createResizers();
            adjustTableWidth();
            initSorting();
        }

        // Configuración de eventos
        const createForm = document.getElementById('formCreateCategoria');
        if (createForm)
            createForm.addEventListener('submit', handleCreateFormSubmit);

        const editForm = document.getElementById('formEditCategoria');
        if (editForm)
            editForm.addEventListener('submit', handleEditFormSubmit);

        const deleteForm = document.getElementById('formDeleteCategoria');
        if (deleteForm)
            deleteForm.addEventListener('submit', handleDeleteFormSubmit);

        // Eventos delegados
        document.addEventListener('click', function (e) {
            // Botones de edición
            if (e.target.closest('button[data-action="edit"]')) {
                e.preventDefault();
                const button = e.target.closest('button[data-action="edit"]');
                const categoriaId = button.getAttribute('data-id');
                if (!categoriaId) {
                    showToast('error', 'ID de categoría no válido');
                    return;
                }
                loadCategoriaData(categoriaId);
            }

            // Botones de eliminación
            if (e.target.closest('button[data-action="delete"]')) {
                e.preventDefault();
                const button = e.target.closest('button[data-action="delete"]');
                const categoriaId = button.getAttribute('data-id');
                const categoriaName = button.closest('tr').querySelector('td:nth-child(2)').textContent;
                openDeleteModal(categoriaId, categoriaName);
            }

            // Botones de toggle estado
            if (e.target.closest('button[data-action="toggle"]')) {
                e.preventDefault();
                const button = e.target.closest('button[data-action="toggle"]');
                const categoriaId = button.getAttribute('data-id');
                if (!categoriaId) {
                    showToast('error', 'ID de categoría no válido');
                    return;
                }
                toggleCategoriaEstado(categoriaId);
            }
        });

        // Cerrar modales
        document.addEventListener('click', function (event) {
            if (event.target.classList.contains('close-modal') ||
                    event.target.closest('.close-modal')) {
                const modal = event.target.closest('.neon-modal');
                if (modal) {
                    closeNeonModal(modal.id);
                }
            }
        });

        document.addEventListener('click', function (event) {
            if (event.target.classList.contains('close-modal') ||
                    event.target.closest('#close-modal')) {
                const modal = event.target.closest('.neon-modal');
                if (modal) {
                    closeNeonModal(modal.id);
                }
            }
        });

        // Cerrar toasts
        document.querySelectorAll('.toast-close').forEach(closeBtn => {
            closeBtn.addEventListener('click', function () {
                const toast = this.closest('.toast-modal');
                if (toast)
                    toast.style.display = 'none';
            });
        });

        // Configurar filtros y paginación
        setupFilters();
        setupPagination();
        setupModalCancelButtons();
        setupTableEvents();

        // Fixed header al hacer scroll
        const searchSection = document.querySelector(".search-section");
        if (searchSection) {
            const offsetTop = searchSection.offsetTop;

            window.addEventListener("scroll", function () {
                const scrollTop = window.scrollY;
                if (scrollTop >= offsetTop) {
                    searchSection.classList.add("fixed");
                    tableContainer.style.marginTop = "0";
                }
            });
        }

        // Resize optimizado
        let resizeTimeout;
        window.addEventListener('resize', () => {
            if (resizeTimeout)
                cancelAnimationFrame(resizeTimeout);
            resizeTimeout = requestAnimationFrame(adjustTableWidth);
        });
    }

    // Iniciar todo
    initialize();
});