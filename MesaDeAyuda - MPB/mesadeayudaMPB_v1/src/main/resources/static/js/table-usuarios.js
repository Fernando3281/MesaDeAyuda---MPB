document.addEventListener("DOMContentLoaded", function () {
    // 1. Configuración de la tabla y redimensionamiento de columnas
    const table = document.querySelector('.tickets-table');
    const tableContainer = document.querySelector('.table-container');
    const sidebar = document.querySelector('.sidebar');

    const defaultColumnWidths = [
        50, // ID
        80, // Imagen
        80, // Código
        180, // Nombre Completo
        200, // Correo Electrónico
        150, // Departamento
        120, // Teléfono
        150, // Roles
        90, // Estado
        150, // Última Conexión
        100  // Acciones
    ];
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

            // Tratamiento especial para fechas (Última Conexión)
            if (columnIndex === 9) {
                if (valueA === 'Sin conexión')
                    valueA = '01/01/1970 00:00:00';
                if (valueB === 'Sin conexión')
                    valueB = '01/01/1970 00:00:00';

                // Parsear fecha con horas, minutos y segundos
                const parseDate = (dateStr) => {
                    const [datePart, timePart] = dateStr.split(' ');
                    if (!datePart || !timePart)
                        return new Date(0);

                    const [day, month, year] = datePart.split('/');
                    const [hours, minutes, seconds] = timePart.split(':');

                    // Asegurar que tenemos segundos (si no vienen, asumir 00)
                    const secs = seconds !== undefined ? seconds : '00';

                    return new Date(
                            year, month - 1, day,
                            hours || 0, minutes || 0, secs || 0
                            );
                };

                const dateA = parseDate(valueA);
                const dateB = parseDate(valueB);

                return direction === 'asc'
                        ? dateA - dateB
                        : dateB - dateA;
            }

            // Para valores numéricos (ID)
            if (columnIndex === 0) {
                const numA = parseInt(valueA) || 0;
                const numB = parseInt(valueB) || 0;
                return direction === 'asc' ? numA - numB : numB - numA;
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
        const searchInput = document.getElementById('searchInput');
        const statusFilter = document.getElementById('statusFilter');
        const roleFilter = document.getElementById('roleFilter');
        const recordsPerPage = document.getElementById('recordsPerPage');

        const searchQuery = searchInput.value.trim();
        const statusValue = statusFilter.value;
        const roleValue = roleFilter.value;
        const size = recordsPerPage.value;

        showLoader(true);

        // Construir URL para la búsqueda
        let url = `/usuario/listado?page=0&size=${size}`;

        if (searchQuery) {
            url += `&search=${encodeURIComponent(searchQuery)}`;
        }
        if (statusValue) {
            url += `&estado=${statusValue}`;
        }
        if (roleValue) {
            url += `&rol=${roleValue}`;
        }

        // Redirigir a la nueva URL con los filtros
        window.location.href = url;
    }

// Modificar los botones de paginación para mantener los filtros
    function setupPagination() {
        const recordsPerPage = document.getElementById('recordsPerPage');
        if (!recordsPerPage)
            return;

        recordsPerPage.addEventListener('change', function () {
            const size = this.value;
            const urlParams = new URLSearchParams(window.location.search);
            const searchQuery = urlParams.get('search') || '';
            const estadoFiltro = urlParams.get('estado') || '';
            const rolFiltro = urlParams.get('rol') || '';

            let newUrl = `${window.location.pathname}?page=0&size=${size}`;

            if (searchQuery)
                newUrl += `&search=${encodeURIComponent(searchQuery)}`;
            if (estadoFiltro)
                newUrl += `&estado=${estadoFiltro}`;
            if (rolFiltro)
                newUrl += `&rol=${rolFiltro}`;

            window.location.href = newUrl;
        });

        // Configurar los botones de paginación para mantener los filtros
        document.querySelectorAll('.pagination-btn, .page-number').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();

                const urlParams = new URLSearchParams(window.location.search);
                const searchQuery = urlParams.get('search') || '';
                const estadoFiltro = urlParams.get('estado') || '';
                const rolFiltro = urlParams.get('rol') || '';
                const size = urlParams.get('size') || '15';

                let page = 0;
                if (this.getAttribute('data-page')) {
                    page = parseInt(this.getAttribute('data-page'));
                } else if (this.getAttribute('href') && this.getAttribute('href').includes('page=')) {
                    const match = this.getAttribute('href').match(/page=(\d+)/);
                    if (match)
                        page = parseInt(match[1]);
                }

                let newUrl = `${window.location.pathname}?page=${page}&size=${size}`;

                if (searchQuery)
                    newUrl += `&search=${encodeURIComponent(searchQuery)}`;
                if (estadoFiltro)
                    newUrl += `&estado=${estadoFiltro}`;
                if (rolFiltro)
                    newUrl += `&rol=${rolFiltro}`;

                window.location.href = newUrl;
            });
        });

        // Establecer valor actual
        const urlParams = new URLSearchParams(window.location.search);
        recordsPerPage.value = urlParams.get('size') || '15';
    }

    // Función para configurar eventos después de actualizar la tabla
    function setupTableEvents() {
        // Reconfigurar eventos de los botones de acción
        document.querySelectorAll('button[data-action="edit"]').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                const userId = this.getAttribute('data-id');
                if (!userId) {
                    showToast('error', 'ID de usuario no válido');
                    return;
                }
                loadUserData(userId);
            });
        });

        document.querySelectorAll('a[href^="/usuario/eliminar/"]').forEach(link => {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                const userId = this.getAttribute('href').split('/').pop();
                const userName = this.closest('tr').querySelector('td:nth-child(4)').textContent;
                openDeleteModal(userId, userName);
            });
        });
    }

    function setupFilters() {
        const searchInput = document.getElementById('searchInput');
        const statusFilter = document.getElementById('statusFilter');
        const roleFilter = document.getElementById('roleFilter');

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

        if (statusFilter) {
            statusFilter.addEventListener('change', handleSearch);
        }

        if (roleFilter) {
            roleFilter.addEventListener('change', handleSearch);
        }
    }

    // Asegurar que los botones Cancelar funcionen en todos los modals
    function setupModalCancelButtons() {
        document.querySelectorAll('.neon-modal .btn-secondary').forEach(btn => {
            btn.addEventListener('click', function () {
                const modal = this.closest('.neon-modal');
                if (modal) {
                    closeNeonModal(modal.id);
                }
            });
        });
    }

    function setupPagination() {
        const recordsPerPage = document.getElementById('recordsPerPage');
        if (!recordsPerPage)
            return;

        recordsPerPage.addEventListener('change', function () {
            const size = this.value;
            const urlParams = new URLSearchParams(window.location.search);
            const searchQuery = urlParams.get('search') || '';
            const estadoFiltro = urlParams.get('estado') || '';
            const rolFiltro = urlParams.get('rol') || '';

            let newUrl = `${window.location.pathname}?page=0&size=${size}`;

            if (searchQuery)
                newUrl += `&search=${encodeURIComponent(searchQuery)}`;
            if (estadoFiltro)
                newUrl += `&estado=${estadoFiltro}`;
            if (rolFiltro)
                newUrl += `&rol=${rolFiltro}`;

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

    // 5. Funciones para carga de datos de usuario
    function loadUserData(userId) {
        showLoader(true);

        fetch(`/usuario/editar/${userId}`, {
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
                    if (data.error)
                        throw new Error(data.error);
                    if (!data.usuario)
                        throw new Error('Datos de usuario no recibidos');

                    const usuario = data.usuario;
                    const roles = data.roles || [];

                    // Llenar formulario
                    document.getElementById('editUserId').value = usuario.idUsuario;
                    document.getElementById('editNombre').value = usuario.nombre || '';
                    document.getElementById('editApellido').value = usuario.apellido || '';
                    document.getElementById('editCorreoElectronico').value = usuario.correoElectronico || '';
                    document.getElementById('editDepartamento').value = usuario.departamento || '';
                    document.getElementById('editNumeroTelefono').value = usuario.numeroTelefono || '';
                    document.getElementById('editActivo').checked = usuario.activo;

                    // Imagen actual
                    const currentImageContainer = document.getElementById('currentImageContainer');
                    const currentImage = document.getElementById('currentImage');

                    if (usuario.tieneImagen) {
                        currentImage.src = `/usuario/imagen/${usuario.idUsuario}?${new Date().getTime()}`;
                        currentImageContainer.style.display = 'block';
                    } else {
                        currentImageContainer.style.display = 'none';
                    }

                    // Rol
                    const rolSelect = document.getElementById('editRol');
                    if (roles && roles.length > 0) {
                        rolSelect.value = roles[0];
                    } else {
                        rolSelect.value = '';
                    }

                    openNeonModal('neonEditModal');
                })
                .catch(error => {
                    console.error('Error al cargar usuario:', error);
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
        const requiredFields = {
            'nombre': 'Nombre',
            'correoElectronico': 'Correo electrónico',
            'departamento': 'Departamento',
            'contrasena': 'Contraseña'
        };

        let missingFields = [];

        for (const [field, name] of Object.entries(requiredFields)) {
            if (!formData.get(field)) {
                missingFields.push(name);
            }
        }

        if (missingFields.length > 0) {
            showToast('error', `Los siguientes campos son obligatorios: ${missingFields.join(', ')}`);
            return;
        }

        // Validación de contraseña
        const password = formData.get('contrasena');
        if (password.length < 3) {
            showToast('error', 'La contraseña debe tener al menos 3 caracteres');
            return;
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
                            throw new Error(err.message || 'Error al crear usuario');
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    if (!data.success) {
                        throw new Error(data.message || 'Error al crear usuario');
                    }

                    closeNeonModal('neonCreateModal');

                    // Guardar mensaje en sessionStorage antes de recargar
                    sessionStorage.setItem('successMessage', data.message || 'Usuario creado exitosamente');
                    sessionStorage.setItem('successType', 'create');

                    // Recargar la página para mostrar cambios
                    window.location.reload();
                })
                .catch(error => {
                    console.error('Error al crear usuario:', error);
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
        const activeCheckbox = form.querySelector('input[name="activo"][type="checkbox"]');
        if (activeCheckbox) {
            // Eliminar el input hidden de 'activo' para evitar duplicados
            const hiddenActive = form.querySelector('input[name="activo"][type="hidden"]');
            if (hiddenActive) {
                formData.delete('activo');
            }
            // Establecer el valor correcto basado en si está marcado o no
            formData.set('activo', activeCheckbox.checked ? 'true' : 'false');
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
                            throw new Error(err.message || 'Error al actualizar usuario');
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    if (!data.success) {
                        throw new Error(data.message || 'Error al actualizar usuario');
                    }

                    closeNeonModal('neonEditModal');

                    // Guardar mensaje en sessionStorage antes de recargar
                    sessionStorage.setItem('successMessage', data.message || 'Usuario actualizado exitosamente');
                    sessionStorage.setItem('successType', 'update');

                    // Recargar la página para mostrar cambios
                    window.location.reload();
                })
                .catch(error => {
                    console.error('Error al actualizar usuario:', error);
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
                            throw new Error(err.error || 'Error al eliminar usuario');
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.success) {
                        // Cerrar modal primero
                        closeNeonModal('neonDeleteModal');

                        // Guardar mensaje en sessionStorage antes de recargar
                        sessionStorage.setItem('successMessage', data.message || 'Usuario eliminado exitosamente');
                        sessionStorage.setItem('successType', 'delete');

                        // Recargar la página para mostrar cambios
                        window.location.reload();
                    } else {
                        throw new Error(data.message);
                    }
                })
                .catch(error => {
                    console.error('Error al eliminar usuario:', error);
                    showToast('error', error.message);

                    // Restaurar botón en caso de error
                    submitButton.innerHTML = originalButtonText;
                    submitButton.disabled = false;
                    showLoader(false);
                });
    }

    function openDeleteModal(userId, userName) {
        document.getElementById('deleteUserId').value = userId;
        document.getElementById('deleteUserName').textContent = userName;
        document.getElementById('formDeleteUser').setAttribute('action', `/usuario/eliminar/${userId}`);
        openNeonModal('neonDeleteModal');
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

        // Configurar el botón de crear usuario
        const btnCreateUser = document.getElementById('btnCreateUser');
        if (btnCreateUser) {
            btnCreateUser.addEventListener('click', function (e) {
                e.preventDefault();
                openNeonModal('neonCreateModal');
            });
        }

        // Verificar si hay parámetros de éxito en la URL
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('updated')) {
            showToast('success', 'Usuario actualizado correctamente');
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
        const createForm = document.getElementById('formCreateUser');
        if (createForm)
            createForm.addEventListener('submit', handleCreateFormSubmit);

        const editForm = document.getElementById('formEditUser');
        if (editForm)
            editForm.addEventListener('submit', handleEditFormSubmit);

        const deleteForm = document.getElementById('formDeleteUser');
        if (deleteForm)
            deleteForm.addEventListener('submit', handleDeleteFormSubmit);

        // Eventos delegados
        document.addEventListener('click', function (e) {
            // Botones de edición
            if (e.target.closest('button[data-action="edit"]')) {
                e.preventDefault();
                const button = e.target.closest('button[data-action="edit"]');
                const userId = button.getAttribute('data-id');
                if (!userId) {
                    showToast('error', 'ID de usuario no válido');
                    return;
                }
                loadUserData(userId);
            }

            // Enlaces de eliminación
            if (e.target.closest('a[href^="/usuario/eliminar/"]')) {
                e.preventDefault();
                const link = e.target.closest('a[href^="/usuario/eliminar/"]');
                const userId = link.getAttribute('href').split('/').pop();
                const userName = link.closest('tr').querySelector('td:nth-child(4)').textContent;
                openDeleteModal(userId, userName);
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
                    tableContainer.style.marginTop = `${searchSection.offsetHeight}px`;
                } else {
                    searchSection.classList.remove("fixed");
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