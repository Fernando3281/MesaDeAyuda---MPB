document.addEventListener("DOMContentLoaded", function () {
    const table = document.querySelector('.tickets-table');
    const tableContainer = document.querySelector('.table-container');

    const defaultColumnWidths = [
        50,
        80,
        80,
        180,
        200,
        150,
        120,
        150,
        90,
        150,
        100
    ];
    let currentColumnWidths = [...defaultColumnWidths];

    if (performance.navigation.type === performance.navigation.TYPE_RELOAD) {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('search') || urlParams.has('estado') || urlParams.has('rol') ||
                urlParams.has('sortColumn') || urlParams.has('sortDirection')) {
            window.location.href = `/usuario/listado?page=0&size=15`;
        }
    }

    function getCurrentFilterUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const searchInput = document.getElementById('searchInput');
        const statusFilter = document.getElementById('statusFilter');
        const roleFilter = document.getElementById('roleFilter');
        const recordsPerPage = document.getElementById('recordsPerPage');

        const page = urlParams.get('page') || '0';
        const size = recordsPerPage?.value || urlParams.get('size') || '15';
        const sortColumn = urlParams.get('sortColumn') || '0';
        const sortDirection = urlParams.get('sortDirection') || 'asc';
        const searchQuery = searchInput?.value.trim() || urlParams.get('search') || '';
        const statusValue = statusFilter?.value || urlParams.get('estado') || '';
        const roleValue = roleFilter?.value || urlParams.get('rol') || '';

        let url = `/usuario/listado?page=${page}&size=${size}&sortColumn=${sortColumn}&sortDirection=${sortDirection}`;
        if (searchQuery)
            url += `&search=${encodeURIComponent(searchQuery)}`;
        if (statusValue)
            url += `&estado=${statusValue}`;
        if (roleValue)
            url += `&rol=${roleValue}`;

        return url;
    }

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

    function initSorting() {
        const headers = table?.querySelectorAll('thead th');
        if (!headers)
            return;

        const urlParams = new URLSearchParams(window.location.search);
        const sortState = {
            column: parseInt(urlParams.get('sortColumn')) || 0,
            direction: urlParams.get('sortDirection') || 'asc'
        };

        headers.forEach((header, index) => {
            const sortIcon = header.querySelector('.sort-icons i');
            if (!sortIcon)
                return;

            sortIcon.style.cursor = 'pointer';
            sortIcon.addEventListener('click', () => {
                const newDirection = sortState.column === index && sortState.direction === 'asc' ? 'desc' : 'asc';
                sortState.column = index;
                sortState.direction = newDirection;

                updateSortIcons(sortState.column, sortState.direction);
                applySortAndFilters(index, newDirection);
            });
        });

        updateSortIcons(sortState.column, sortState.direction);
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

    function applySortAndFilters(columnIndex, direction) {
        const searchInput = document.getElementById('searchInput');
        const statusFilter = document.getElementById('statusFilter');
        const roleFilter = document.getElementById('roleFilter');
        const recordsPerPage = document.getElementById('recordsPerPage');

        const searchQuery = searchInput?.value.trim() || '';
        const statusValue = statusFilter?.value || '';
        const roleValue = roleFilter?.value || '';
        const size = recordsPerPage?.value || '15';

        const urlParams = new URLSearchParams(window.location.search);
        const currentPage = urlParams.get('page') || '0';

        showLoader(true);

        let url = `/usuario/listado?page=${currentPage}&size=${size}&sortColumn=${columnIndex}&sortDirection=${direction}`;
        if (searchQuery)
            url += `&search=${encodeURIComponent(searchQuery)}`;
        if (statusValue)
            url += `&estado=${statusValue}`;
        if (roleValue)
            url += `&rol=${roleValue}`;

        window.location.href = url;
    }

    function handleSearch() {
        const searchInput = document.getElementById('searchInput');
        const statusFilter = document.getElementById('statusFilter');
        const roleFilter = document.getElementById('roleFilter');
        const recordsPerPage = document.getElementById('recordsPerPage');

        const searchQuery = searchInput?.value.trim() || '';
        const statusValue = statusFilter?.value || '';
        const roleValue = roleFilter?.value || '';
        const size = recordsPerPage?.value || '15';

        const urlParams = new URLSearchParams(window.location.search);
        const sortColumn = urlParams.get('sortColumn') || '0';
        const sortDirection = urlParams.get('sortDirection') || 'asc';

        showLoader(true);

        let url = `/usuario/listado?page=0&size=${size}&sortColumn=${sortColumn}&sortDirection=${sortDirection}`;
        if (searchQuery)
            url += `&search=${encodeURIComponent(searchQuery)}`;
        if (statusValue)
            url += `&estado=${statusValue}`;
        if (roleValue)
            url += `&rol=${roleValue}`;

        window.location.href = url;
    }

    function setupPagination() {
        const recordsPerPage = document.getElementById('recordsPerPage');
        const paginationButtons = document.querySelectorAll('.pagination-btn, .page-number');

        const urlParams = new URLSearchParams(window.location.search);
        const searchQuery = urlParams.get('search') || '';
        const estadoFiltro = urlParams.get('estado') || '';
        const rolFiltro = urlParams.get('rol') || '';
        const sortColumn = urlParams.get('sortColumn') || '0';
        const sortDirection = urlParams.get('sortDirection') || 'asc';
        const size = urlParams.get('size') || '15';

        if (recordsPerPage) {
            recordsPerPage.value = size;
            recordsPerPage.addEventListener('change', function () {
                let newUrl = `${window.location.pathname}?page=0&size=${this.value}&sortColumn=${sortColumn}&sortDirection=${sortDirection}`;
                if (searchQuery)
                    newUrl += `&search=${encodeURIComponent(searchQuery)}`;
                if (estadoFiltro)
                    newUrl += `&estado=${estadoFiltro}`;
                if (rolFiltro)
                    newUrl += `&rol=${rolFiltro}`;
                window.location.href = newUrl;
            });
        }

        paginationButtons.forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();

                let page = 0;
                if (this.classList.contains('page-number')) {
                    page = parseInt(this.textContent) - 1;
                } else if (this.getAttribute('href')) {
                    const match = this.getAttribute('href').match(/page=(\d+)/);
                    if (match)
                        page = parseInt(match[1]);
                }

                let newUrl = `${window.location.pathname}?page=${page}&size=${size}&sortColumn=${sortColumn}&sortDirection=${sortDirection}`;
                if (searchQuery)
                    newUrl += `&search=${encodeURIComponent(searchQuery)}`;
                if (estadoFiltro)
                    newUrl += `&estado=${estadoFiltro}`;
                if (rolFiltro)
                    newUrl += `&rol=${rolFiltro}`;
                window.location.href = newUrl;
            });
        });
    }

    function setupTableEvents() {
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

    function setupModalCancelButtons() {
        document.querySelectorAll('.modal-overlay .btn-outline').forEach(btn => {
            btn.addEventListener('click', function () {
                const modal = this.closest('.modal-overlay');
                if (modal) {
                    closeModal(modal.id);
                }
            });
        });
    }

    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';

            const firstInput = modal.querySelector('input:not([type="hidden"])');
            if (firstInput)
                firstInput.focus();
        }
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';

            const form = modal.querySelector('form');
            if (form)
                form.reset();
        }
    }

    function loadUserData(userId) {
        showLoader(true);

        fetch(`/usuario/editar/${userId}`, {
            headers: {'Accept': 'application/json'}
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
                    if (data.error)
                        throw new Error(data.error);
                    if (!data.usuario)
                        throw new Error('Datos de usuario no recibidos');

                    const usuario = data.usuario;
                    const roles = data.roles || [];

                    document.getElementById('editUserId').value = usuario.idUsuario;
                    document.getElementById('editNombre').value = usuario.nombre || '';
                    document.getElementById('editApellido').value = usuario.apellido || '';
                    document.getElementById('editCorreoElectronico').value = usuario.correoElectronico || '';
                    document.getElementById('editDepartamento').value = usuario.departamento || '';
                    document.getElementById('editNumeroTelefono').value = usuario.numeroTelefono || '';
                    document.getElementById('editActivo').checked = usuario.activo;

                    const currentImageContainer = document.getElementById('currentImageContainer');
                    const currentImage = document.getElementById('currentImage');
                    if (usuario.tieneImagen) {
                        currentImage.src = `/usuario/imagen/${usuario.idUsuario}?${new Date().getTime()}`;
                        currentImageContainer.style.display = 'block';
                    } else {
                        currentImageContainer.style.display = 'none';
                    }

                    const rolSelect = document.getElementById('editRol');
                    if (roles && roles.length > 0) {
                        rolSelect.value = roles[0];
                    } else {
                        rolSelect.value = '';
                    }

                    openModal('editModal');
                })
                .catch(error => {
                    showToast('error', `Error al cargar datos: ${error.message}`);
                })
                .finally(() => {
                    showLoader(false);
                });
    }

    function handleCreateFormSubmit(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const correoElectronico = formData.get('correoElectronico');

        fetch(`/usuario/validar-correo?correo=${encodeURIComponent(correoElectronico)}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error al validar correo electrónico');
                }
                return response.json();
            })
            .then(data => {
                if (data.existe) {
                    showToast('error', 'El correo electrónico ya está registrado');
                    return;
                }
                enviarFormularioCrear(form, formData);
            })
            .catch(error => {
                showToast('error', 'Error al validar correo electrónico');
            });
    }

    function enviarFormularioCrear(form, formData) {
        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;

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
            headers: {'Accept': 'application/json'}
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

                    closeModal('createModal');
                    sessionStorage.setItem('successMessage', data.message || 'Usuario creado exitosamente');
                    sessionStorage.setItem('successType', 'create');
                    window.location.href = getCurrentFilterUrl();
                })
                .catch(error => {
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
        const correoElectronico = formData.get('correoElectronico');
        const userId = formData.get('idUsuario');

        fetch(`/usuario/validar-correo?correo=${encodeURIComponent(correoElectronico)}&excluir=${userId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error al validar correo electrónico');
                }
                return response.json();
            })
            .then(data => {
                if (data.existe) {
                    showToast('error', 'El correo electrónico ya está registrado');
                    return;
                }
                enviarFormularioEditar(form, formData);
            })
            .catch(error => {
                showToast('error', 'Error al validar correo electrónico');
            });
    }

    function enviarFormularioEditar(form, formData) {
        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;

        if (!formData.get('nombre')?.trim()) {
            showToast('error', 'El campo Nombre es obligatorio');
            return;
        }

        const activeCheckbox = form.querySelector('input[name="activo"][type="checkbox"]');
        if (activeCheckbox) {
            const hiddenActive = form.querySelector('input[name="activo"][type="hidden"]');
            if (hiddenActive) {
                formData.delete('activo');
            }
            formData.set('activo', activeCheckbox.checked ? 'true' : 'false');
        }

        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';
        submitButton.disabled = true;
        showLoader(true);

        fetch(form.action, {
            method: 'POST',
            body: formData,
            headers: {'Accept': 'application/json'}
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

                    closeModal('editModal');
                    sessionStorage.setItem('successMessage', data.message || 'Usuario actualizado exitosamente');
                    sessionStorage.setItem('successType', 'update');
                    window.location.href = getCurrentFilterUrl();
                })
                .catch(error => {
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
                        closeModal('deleteModal');
                        sessionStorage.setItem('successMessage', data.message || 'Usuario eliminado exitosamente');
                        sessionStorage.setItem('successType', 'delete');

                        const urlParams = new URLSearchParams(window.location.search);
                        let currentPage = parseInt(urlParams.get('page') || '0');
                        const size = parseInt(urlParams.get('size') || '15');
                        const sortColumn = urlParams.get('sortColumn') || '0';
                        const sortDirection = urlParams.get('sortDirection') || 'asc';
                        const searchQuery = urlParams.get('search') || '';
                        const estadoFiltro = urlParams.get('estado') || '';
                        const rolFiltro = urlParams.get('rol') || '';

                        const pageInfoElement = document.getElementById('pageInfo');
                        let totalItems = 0;
                        let currentPageItems = 0;
                        if (pageInfoElement) {
                            const match = pageInfoElement.textContent.match(/Mostrando (\d+) a (\d+) de (\d+) registros/);
                            if (match) {
                                const start = parseInt(match[1]);
                                const end = parseInt(match[2]);
                                totalItems = parseInt(match[3]);
                                currentPageItems = end - start + 1;
                            }
                        }

                        const totalItemsAfterDeletion = totalItems - 1;
                        const totalPagesAfterDeletion = Math.ceil(totalItemsAfterDeletion / size);
                        if (currentPageItems === 1 && currentPage > 0 && totalItemsAfterDeletion > 0) {
                            currentPage--;
                        } else if (totalItemsAfterDeletion === 0) {
                            currentPage = 0;
                        }

                        let url = `/usuario/listado?page=${currentPage}&size=${size}&sortColumn=${sortColumn}&sortDirection=${sortDirection}`;
                        if (searchQuery)
                            url += `&search=${encodeURIComponent(searchQuery)}`;
                        if (estadoFiltro)
                            url += `&estado=${estadoFiltro}`;
                        if (rolFiltro)
                            url += `&rol=${rolFiltro}`;

                        window.location.href = url;
                    } else {
                        throw new Error(data.message);
                    }
                })
                .catch(error => {
                    showToast('error', error.message);
                    submitButton.innerHTML = originalButtonText;
                    submitButton.disabled = false;
                    showLoader(false);
                });
    }

    function openDeleteModal(userId, userName) {
        document.getElementById('deleteUserId').value = userId;
        document.getElementById('deleteUserName').textContent = userName;
        document.getElementById('formDeleteUser').setAttribute('action', `/usuario/eliminar/${userId}`);
        openModal('deleteModal');
    }

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

    function checkForSuccessMessages() {
        const successMessage = sessionStorage.getItem('successMessage');
        const successType = sessionStorage.getItem('successType');

        if (successMessage) {
            setTimeout(() => {
                showToast('success', successMessage);
            }, 100);
            sessionStorage.removeItem('successMessage');
            sessionStorage.removeItem('successType');
        }

        const deleteMessage = sessionStorage.getItem('deleteSuccessMessage');
        if (deleteMessage) {
            setTimeout(() => {
                showToast('success', deleteMessage);
            }, 100);
            sessionStorage.removeItem('deleteSuccessMessage');
        }
    }

    function setupEmailValidation() {
        const createEmailInput = document.getElementById('correoElectronico');
        const editEmailInput = document.getElementById('editCorreoElectronico');
        
        if (createEmailInput) {
            createEmailInput.addEventListener('blur', validateEmail);
        }
        
        if (editEmailInput) {
            editEmailInput.addEventListener('blur', validateEmail);
        }
    }

    function validateEmail(event) {
        const emailInput = event.target;
        const email = emailInput.value.trim();
        const form = emailInput.closest('form');
        const userId = form?.querySelector('input[name="idUsuario"]')?.value;
        
        if (!email) return;
        
        let url = `/usuario/validar-correo?correo=${encodeURIComponent(email)}`;
        if (userId) {
            url += `&excluir=${userId}`;
        }
        
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error al validar correo electrónico');
                }
                return response.json();
            })
            .then(data => {
                if (data.existe) {
                    emailInput.setCustomValidity('Este correo electrónico ya está registrado');
                    showToast('error', 'Este correo electrónico ya está registrado');
                } else {
                    emailInput.setCustomValidity('');
                }
            })
            .catch(error => {
            });
    }

    function initialize() {
        checkForSuccessMessages();

        const btnCreateUser = document.getElementById('btnCreateUser');
        if (btnCreateUser) {
            btnCreateUser.addEventListener('click', function (e) {
                e.preventDefault();
                openModal('createModal');
            });
        }

        if (table) {
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

        const createForm = document.getElementById('formCreateUser');
        if (createForm)
            createForm.addEventListener('submit', handleCreateFormSubmit);

        const editForm = document.getElementById('formEditUser');
        if (editForm)
            editForm.addEventListener('submit', handleEditFormSubmit);

        const deleteForm = document.getElementById('formDeleteUser');
        if (deleteForm)
            deleteForm.addEventListener('submit', handleDeleteFormSubmit);

        document.addEventListener('click', function (e) {
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

            if (e.target.closest('a[href^="/usuario/eliminar/"]')) {
                e.preventDefault();
                const link = e.target.closest('a[href^="/usuario/eliminar/"]');
                const userId = link.getAttribute('href').split('/').pop();
                const userName = link.closest('tr').querySelector('td:nth-child(4)').textContent;
                openDeleteModal(userId, userName);
            }

            if (e.target.classList.contains('close-modal') || e.target.closest('.close-modal')) {
                const modal = e.target.closest('.modal-overlay');
                if (modal) {
                    closeModal(modal.id);
                }
            }
        });

        document.querySelectorAll('.toast-close').forEach(closeBtn => {
            closeBtn.addEventListener('click', function () {
                const toast = this.closest('.toast-modal');
                if (toast)
                    toast.style.display = 'none';
            });
        });

        setupFilters();
        setupPagination();
        setupModalCancelButtons();
        setupTableEvents();
        setupEmailValidation();

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

        let resizeTimeout;
        window.addEventListener('resize', () => {
            if (resizeTimeout)
                cancelAnimationFrame(resizeTimeout);
            resizeTimeout = requestAnimationFrame(adjustTableWidth);
        });
    }

    initialize();
});