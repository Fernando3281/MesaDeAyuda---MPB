document.addEventListener("DOMContentLoaded", function () {
    const table = document.querySelector('.tickets-table');
    const tableContainer = document.querySelector('.table-container');

    const defaultColumnWidths = [40, 200, 400, 60, 60, 80];
    let currentColumnWidths = [...defaultColumnWidths];

    if (performance.navigation.type === performance.navigation.TYPE_RELOAD) {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('search') || urlParams.has('sortColumn') || urlParams.has('sortDirection')) {
            window.location.href = `/departamento/listado?page=0&size=15`;
        }
    }

    function getCurrentFilterUrl(overridePage = null) {
        const urlParams = new URLSearchParams(window.location.search);
        const searchInput = document.getElementById('searchInputDepartamentos');
        const recordsPerPage = document.getElementById('recordsPerPageDepartamentos');

        const page = overridePage !== null ? overridePage : (urlParams.get('page') || '0');
        const size = recordsPerPage?.value || urlParams.get('size') || '15';
        const sortColumn = urlParams.get('sortColumn') || '0';
        const sortDirection = urlParams.get('sortDirection') || 'asc';
        const searchQuery = searchInput?.value.trim() || urlParams.get('search') || '';

        let url = `/departamento/listado?page=${page}&size=${size}&sortColumn=${sortColumn}&sortDirection=${sortDirection}`;
        if (searchQuery)
            url += `&search=${encodeURIComponent(searchQuery)}`;

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
            if (!sortIcon || index === 5)
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
        sortTable(sortState.column, sortState.direction);
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

            if (columnIndex === 0 || columnIndex === 3) {
                const numA = parseInt(valueA) || 0;
                const numB = parseInt(valueB) || 0;
                return direction === 'asc' ? numA - numB : numB - numA;
            }

            if (columnIndex === 4) {
                valueA = valueA === 'Visible' ? '1' : '0';
                valueB = valueB === 'Visible' ? '1' : '0';
                return direction === 'asc'
                        ? valueA.localeCompare(valueB)
                        : valueB.localeCompare(valueA);
            }

            return direction === 'asc'
                    ? valueA.localeCompare(valueB)
                    : valueB.localeCompare(valueA);
        });

        tbody.innerHTML = '';
        rows.forEach(row => tbody.appendChild(row));
        if (emptyRow)
            tbody.appendChild(emptyRow);
    }

    async function applySortAndFilters(columnIndex, direction) {
        const searchInput = document.getElementById('searchInputDepartamentos');
        const recordsPerPage = document.getElementById('recordsPerPageDepartamentos');

        const searchQuery = searchInput?.value.trim() || '';
        const size = recordsPerPage?.value || '15';
        const urlParams = new URLSearchParams(window.location.search);
        const currentPage = urlParams.get('page') || '0';

        showLoader(true);

        try {
            let url = `/departamento/listado?page=${currentPage}&size=${size}&sortColumn=${columnIndex}&sortDirection=${direction}`;
            if (searchQuery)
                url += `&search=${encodeURIComponent(searchQuery)}`;

            const response = await fetch(url, {
                headers: {'Accept': 'text/html'}
            });

            if (!response.ok) {
                throw new Error('Error al ordenar la tabla');
            }

            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const newTable = doc.querySelector('.tickets-table');
            const newPagination = doc.querySelector('.table-header');

            if (newTable) {
                const currentTable = document.querySelector('.tickets-table');
                currentTable.innerHTML = newTable.innerHTML;
            }

            if (newPagination) {
                const currentPagination = document.querySelector('.table-header');
                currentPagination.innerHTML = newPagination.innerHTML;
                setupPagination();
            }

            history.pushState({}, '', url);
            setupTableEvents();
            adjustTableWidth();
            initSorting();
        } catch (error) {
            showToast('error', 'Error al ordenar la tabla');
            sortTable(columnIndex, direction);
        } finally {
            showLoader(false);
        }
    }

    async function handleSearch() {
        const searchInput = document.getElementById('searchInputDepartamentos');
        const recordsPerPage = document.getElementById('recordsPerPageDepartamentos');

        const searchQuery = searchInput?.value.trim() || '';
        const size = recordsPerPage?.value || '15';
        const urlParams = new URLSearchParams(window.location.search);
        const sortColumn = urlParams.get('sortColumn') || '0';
        const sortDirection = urlParams.get('sortDirection') || 'asc';

        showLoader(true);

        try {
            let url = `/departamento/listado?page=0&size=${size}&sortColumn=${sortColumn}&sortDirection=${sortDirection}`;
            if (searchQuery)
                url += `&search=${encodeURIComponent(searchQuery)}`;

            const response = await fetch(url, {
                headers: {'Accept': 'text/html'}
            });

            if (!response.ok) {
                throw new Error('Error en la búsqueda');
            }

            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const newTable = doc.querySelector('.tickets-table');
            const newPagination = doc.querySelector('.table-header');

            if (newTable) {
                const currentTable = document.querySelector('.tickets-table');
                currentTable.innerHTML = newTable.innerHTML;
            }

            if (newPagination) {
                const currentPagination = document.querySelector('.table-header');
                currentPagination.innerHTML = newPagination.innerHTML;
                setupPagination();
            }

            history.pushState({}, '', url);
            setupTableEvents();
            adjustTableWidth();
            initSorting();
        } catch (error) {
            showToast('error', 'Error al realizar la búsqueda');
        } finally {
            showLoader(false);
        }
    }

    function setupPagination() {
        const recordsPerPage = document.getElementById('recordsPerPageDepartamentos');
        if (!recordsPerPage)
            return;

        const urlParams = new URLSearchParams(window.location.search);
        const searchQuery = urlParams.get('search') || '';
        const sortColumn = urlParams.get('sortColumn') || '0';
        const sortDirection = urlParams.get('sortDirection') || 'asc';
        const size = urlParams.get('size') || '15';

        recordsPerPage.value = size;
        recordsPerPage.addEventListener('change', function () {
            let newUrl = `/departamento/listado?page=0&size=${this.value}&sortColumn=${sortColumn}&sortDirection=${sortDirection}`;
            if (searchQuery)
                newUrl += `&search=${encodeURIComponent(searchQuery)}`;
            window.location.href = newUrl;
        });

        document.querySelectorAll('.pagination-btn, .page-number').forEach(btn => {
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

                let newUrl = `/departamento/listado?page=${page}&size=${size}&sortColumn=${sortColumn}&sortDirection=${sortDirection}`;
                if (searchQuery)
                    newUrl += `&search=${encodeURIComponent(searchQuery)}`;
                window.location.href = newUrl;
            });
        });
    }

    function setupTableEvents() {
        document.querySelectorAll('button[data-action="edit"]').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                const departamentoId = this.getAttribute('data-id');
                if (!departamentoId) {
                    showToast('error', 'ID de departamento no válido');
                    return;
                }
                loadDepartamentoData(departamentoId);
            });
        });

        document.querySelectorAll('button[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                const departamentoId = this.getAttribute('data-id');
                const departamentoName = this.closest('tr').querySelector('td:nth-child(2)').textContent;
                openDeleteModal(departamentoId, departamentoName);
            });
        });

        document.querySelectorAll('button[data-action="toggle"]').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                const departamentoId = this.getAttribute('data-id');
                if (!departamentoId) {
                    showToast('error', 'ID de departamento no válido');
                    return;
                }
                toggleDepartamentoVisibility(departamentoId);
            });
        });
    }

    function setupFilters() {
        const searchInput = document.getElementById('searchInputDepartamentos');
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

    function loadDepartamentoData(departamentoId) {
        showLoader(true);

        fetch(`/departamento/obtener/${departamentoId}`, {
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
                    if (!data.success)
                        throw new Error(data.message || 'Datos de departamento no recibidos');

                    document.getElementById('editDepartamentoId').value = departamentoId;
                    document.getElementById('editNombre').value = data.nombre || '';
                    document.getElementById('editDescripcion').value = data.descripcion || '';
                    document.getElementById('editVisible').checked = data.visible;

                    document.getElementById('formEditDepartamento').setAttribute('action', `/departamento/actualizar/${departamentoId}`);
                    openModal('editDepartamentoModal');
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
        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;

        if (!formData.get('nombre')?.trim()) {
            showToast('error', 'El campo Nombre es obligatorio');
            return;
        }

        const visibleCheckbox = form.querySelector('input[name="visible"][type="checkbox"]');
        if (visibleCheckbox) {
            const hiddenVisible = form.querySelector('input[name="visible"][type="hidden"]');
            if (hiddenVisible)
                formData.delete('visible');
            formData.set('visible', visibleCheckbox.checked ? 'true' : 'false');
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
                            throw new Error(err.message || 'Error al crear departamento');
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    if (!data.success) {
                        throw new Error(data.message || 'Error al crear departamento');
                    }

                    closeModal('createDepartamentoModal');
                    sessionStorage.setItem('successMessage', data.message || 'Departamento creado exitosamente');
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
        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;

        if (!formData.get('nombre')?.trim()) {
            showToast('error', 'El campo Nombre es obligatorio');
            return;
        }

        const visibleCheckbox = form.querySelector('input[name="visible"][type="checkbox"]');
        if (visibleCheckbox) {
            const hiddenVisible = form.querySelector('input[name="visible"][type="hidden"]');
            if (hiddenVisible)
                formData.delete('visible');
            formData.set('visible', visibleCheckbox.checked ? 'true' : 'false');
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
                            throw new Error(err.message || 'Error al actualizar departamento');
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    if (!data.success) {
                        throw new Error(data.message || 'Error al actualizar departamento');
                    }

                    closeModal('editDepartamentoModal');
                    sessionStorage.setItem('successMessage', data.message || 'Departamento actualizado exitosamente');
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
                            throw new Error(err.error || 'Error al eliminar departamento');
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.success) {
                        closeModal('deleteDepartamentoModal');
                        sessionStorage.setItem('successMessage', data.message || 'Departamento eliminado exitosamente');
                        sessionStorage.setItem('successType', 'delete');

                        const urlParams = new URLSearchParams(window.location.search);
                        let currentPage = parseInt(urlParams.get('page') || '0');
                        const size = parseInt(urlParams.get('size') || '15');
                        const sortColumn = urlParams.get('sortColumn') || '0';
                        const sortDirection = urlParams.get('sortDirection') || 'asc';
                        const searchQuery = urlParams.get('search') || '';

                        const pageInfoElement = document.getElementById('pageInfoDepartamentos');
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

                        let url = `/departamento/listado?page=${currentPage}&size=${size}&sortColumn=${sortColumn}&sortDirection=${sortDirection}`;
                        if (searchQuery)
                            url += `&search=${encodeURIComponent(searchQuery)}`;

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

    function toggleDepartamentoVisibility(departamentoId) {
        showLoader(true);

        const csrfToken = document.querySelector('input[name="_csrf"]')?.value;
        if (!csrfToken) {
            showLoader(false);
            showToast('error', 'Error: Token CSRF no encontrado');
            return;
        }

        const controller = new AbortController();
        const signal = controller.signal;

        const timeoutId = setTimeout(() => {
            controller.abort();
        }, 30000);

        fetch(`/departamento/toggle-visibilidad/${departamentoId}`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken
            },
            body: JSON.stringify({}),
            signal: signal
        })
                .then(response => {
                    clearTimeout(timeoutId);

                    if (!response.ok) {
                        const contentType = response.headers.get('content-type');
                        if (contentType && contentType.includes('application/json')) {
                            return response.json().then(err => {
                                throw new Error(err.error || err.message || `Error HTTP: ${response.status} ${response.statusText}`);
                            });
                        } else {
                            throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
                        }
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.success) {
                        sessionStorage.setItem('successMessage', data.message || 'Visibilidad actualizada correctamente');
                        sessionStorage.setItem('successType', 'toggle');
                        window.location.href = getCurrentFilterUrl();
                    } else {
                        throw new Error(data.message || 'Error desconocido al cambiar visibilidad');
                    }
                })
                .catch(error => {
                    if (error.name === 'AbortError') {
                        showToast('error', 'La operación tardó demasiado tiempo. Por favor, intente nuevamente.');
                    } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
                        showToast('error', 'Error de conexión. Verifique su conexión a internet.');
                    } else if (error.message.includes('timeout')) {
                        showToast('error', 'La operación tardó demasiado tiempo. Intente nuevamente.');
                    } else {
                        showToast('error', error.message || 'Error al cambiar visibilidad del departamento');
                    }
                })
                .finally(() => {
                    clearTimeout(timeoutId);
                    showLoader(false);
                });
    }

    function openDeleteModal(departamentoId, departamentoName) {
        document.getElementById('deleteDepartamentoId').value = departamentoId;
        document.getElementById('deleteDepartamentoName').textContent = departamentoName;
        document.getElementById('formDeleteDepartamento').setAttribute('action', `/departamento/eliminar/${departamentoId}`);
        openModal('deleteDepartamentoModal');
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

    function initialize() {
        checkForSuccessMessages();

        const btnCreateDepartamento = document.getElementById('btnCreateDepartamento');
        if (btnCreateDepartamento) {
            btnCreateDepartamento.addEventListener('click', function (e) {
                e.preventDefault();
                openModal('createDepartamentoModal');
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

        const createForm = document.getElementById('formCreateDepartamento');
        if (createForm)
            createForm.addEventListener('submit', handleCreateFormSubmit);

        const editForm = document.getElementById('formEditDepartamento');
        if (editForm)
            editForm.addEventListener('submit', handleEditFormSubmit);

        const deleteForm = document.getElementById('formDeleteDepartamento');
        if (deleteForm)
            deleteForm.addEventListener('submit', handleDeleteFormSubmit);

        document.addEventListener('click', function (e) {
            if (e.target.closest('button[data-action="edit"]')) {
                e.preventDefault();
                const button = e.target.closest('button[data-action="edit"]');
                const departamentoId = button.getAttribute('data-id');
                if (!departamentoId) {
                    showToast('error', 'ID de departamento no válido');
                    return;
                }
                loadDepartamentoData(departamentoId);
            }

            if (e.target.closest('button[data-action="delete"]')) {
                e.preventDefault();
                const button = e.target.closest('button[data-action="delete"]');
                const departamentoId = button.getAttribute('data-id');
                const departamentoName = button.closest('tr').querySelector('td:nth-child(2)').textContent;
                openDeleteModal(departamentoId, departamentoName);
            }

            if (e.target.closest('button[data-action="toggle"]')) {
                e.preventDefault();
                const button = e.target.closest('button[data-action="toggle"]');
                const departamentoId = button.getAttribute('data-id');
                if (!departamentoId) {
                    showToast('error', 'ID de departamento no válido');
                    return;
                }
                toggleDepartamentoVisibility(departamentoId);
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