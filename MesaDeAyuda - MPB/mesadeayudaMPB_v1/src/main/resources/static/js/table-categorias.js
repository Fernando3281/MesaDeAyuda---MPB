document.addEventListener("DOMContentLoaded", function () {
    const table = document.querySelector('.tickets-table');
    const tableContainer = document.querySelector('.table-container');

    const defaultColumnWidths = [40, 200, 400, 60, 80];
    let currentColumnWidths = [...defaultColumnWidths];

    let tableState = {
        page: 0,
        size: 15,
        sortColumn: 0,
        sortDirection: 'asc',
        search: ''
    };

    window.openModal = openModal;
    window.closeModal = closeModal;
    window.openNeonModal = openModal;

    if (performance.navigation && performance.navigation.type === performance.navigation.TYPE_RELOAD) {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('search') || urlParams.has('sortColumn') || urlParams.has('sortDirection')) {
            window.location.href = `/categoria/listado?page=0&size=15`;
        }
    }

    function initializeTableState() {
        const urlParams = new URLSearchParams(window.location.search);
        tableState = {
            page: parseInt(urlParams.get('page')) || 0,
            size: parseInt(urlParams.get('size')) || 15,
            sortColumn: parseInt(urlParams.get('sortColumn')) || 0,
            sortDirection: urlParams.get('sortDirection') || 'asc',
            search: urlParams.get('search') || ''
        };
    }

    function buildTableUrl() {
        let url = `/categoria/listado?page=${tableState.page}&size=${tableState.size}`;
        if (tableState.sortColumn !== undefined && tableState.sortDirection) {
            url += `&sortColumn=${tableState.sortColumn}&sortDirection=${tableState.sortDirection}`;
        }
        if (tableState.search) {
            url += `&search=${encodeURIComponent(tableState.search)}`;
        }
        return url;
    }

    async function refreshTable() {
        showLoader(true);
        try {
            const response = await fetch(buildTableUrl(), {
                headers: {'Accept': 'text/html'}
            });
            if (!response.ok) {
                throw new Error('Error al cargar la tabla');
            }
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            const newTableBody = doc.querySelector('.tickets-table tbody');
            if (newTableBody) {
                document.querySelector('.tickets-table tbody').innerHTML = newTableBody.innerHTML;
            }

            const newPagination = doc.querySelector('.pagination-controls');
            const newPageInfo = doc.querySelector('#pageInfoCategorias');
            if (newPagination) {
                document.querySelector('.pagination-controls').innerHTML = newPagination.innerHTML;
            }
            if (newPageInfo) {
                document.querySelector('#pageInfoCategorias').innerHTML = newPageInfo.innerHTML;
            }

            setupTableEvents();
            setupPagination();
            adjustTableWidth();
            initSorting();
        } catch (error) {
            showToast('error', 'Error al actualizar la tabla');
        } finally {
            showLoader(false);
        }
    }

    function adjustTableWidth() {
        if (!table || !tableContainer) return;

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
        if (!headers) return;

        headers.forEach((header, index) => {
            const sortIcon = header.querySelector('.sort-icons i');
            if (!sortIcon) return;

            sortIcon.style.cursor = 'pointer';
            
            const newSortIcon = sortIcon.cloneNode(true);
            sortIcon.parentNode.replaceChild(newSortIcon, sortIcon);
            
            newSortIcon.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                if (tableState.sortColumn === index) {
                    tableState.sortDirection = tableState.sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    tableState.sortColumn = index;
                    tableState.sortDirection = 'asc';
                }
                tableState.page = 0;
                updateSortIcons(tableState.sortColumn, tableState.sortDirection);
                applySortAndFilters();
            });
        });

        updateSortIcons(tableState.sortColumn, tableState.sortDirection);
    }

    function updateSortIcons(activeColumn, direction) {
        const headers = table?.querySelectorAll('thead th');
        if (!headers) return;

        headers.forEach((header, index) => {
            const sortIcon = header.querySelector('.sort-icons i');
            if (!sortIcon) return;

            sortIcon.className = index === activeColumn
                    ? (direction === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down')
                    : 'fas fa-sort';
        });
    }

    function applySortAndFilters() {
        showLoader(true);
        const newUrl = buildTableUrl();
        history.pushState({}, '', newUrl);
        refreshTable();
    }

    async function handleSearch() {
        const searchInput = document.getElementById('searchInputCategorias');
        tableState.search = searchInput?.value.trim() || '';
        tableState.page = 0;
        applySortAndFilters();
    }

    function setupPagination() {
        const recordsPerPage = document.getElementById('recordsPerPageCategorias');
        const paginationButtons = document.querySelectorAll('.pagination-btn, .page-number');

        if (recordsPerPage) {
            recordsPerPage.value = tableState.size;
            recordsPerPage.removeEventListener('change', handleRecordsPerPageChange);
            recordsPerPage.addEventListener('change', handleRecordsPerPageChange);
        }

        paginationButtons.forEach(btn => {
            btn.removeEventListener('click', handlePaginationClick);
            btn.addEventListener('click', handlePaginationClick);
        });
    }

    function handleRecordsPerPageChange() {
        tableState.size = parseInt(this.value);
        tableState.page = 0;
        applySortAndFilters();
    }

    function handlePaginationClick(e) {
        e.preventDefault();
        let page = 0;
        if (this.classList.contains('page-number')) {
            page = parseInt(this.textContent) - 1;
        } else if (this.getAttribute('onclick')) {
            const match = this.getAttribute('onclick').match(/page=(\d+)/);
            if (match) page = parseInt(match[1]);
        } else if (this.hasAttribute('data-page')) {
            page = parseInt(this.getAttribute('data-page'));
        }
        tableState.page = page;
        applySortAndFilters();
    }

    function setupTableEvents() {
        document.querySelectorAll('button[data-action="edit"]').forEach(btn => {
            btn.removeEventListener('click', handleEditClick);
            btn.addEventListener('click', handleEditClick);
        });

        document.querySelectorAll('button[data-action="delete"]').forEach(btn => {
            btn.removeEventListener('click', handleDeleteClick);
            btn.addEventListener('click', handleDeleteClick);
        });

        document.querySelectorAll('button[data-action="toggle"]').forEach(btn => {
            btn.removeEventListener('click', handleToggleClick);
            btn.addEventListener('click', handleToggleClick);
        });
    }

    function handleEditClick(e) {
        e.preventDefault();
        const categoriaId = this.getAttribute('data-id');
        if (!categoriaId) {
            showToast('error', 'ID de categoría no válido');
            return;
        }
        loadCategoriaData(categoriaId);
    }

    function handleDeleteClick(e) {
        e.preventDefault();
        const categoriaId = this.getAttribute('data-id');
        const categoriaName = this.closest('tr').querySelector('td:nth-child(2)').textContent;
        openDeleteModal(categoriaId, categoriaName);
    }

    function handleToggleClick(e) {
        e.preventDefault();
        const categoriaId = this.getAttribute('data-id');
        if (!categoriaId) {
            showToast('error', 'ID de categoría no válido');
            return;
        }
        toggleCategoriaEstado(categoriaId);
    }

    function setupFilters() {
        const searchInput = document.getElementById('searchInputCategorias');
        if (searchInput) {
            searchInput.value = tableState.search;
            let searchTimeout;
            
            searchInput.removeEventListener('input', handleSearchInput);
            searchInput.removeEventListener('keyup', handleSearchKeyup);
            
            searchInput.addEventListener('input', handleSearchInput);
            searchInput.addEventListener('keyup', handleSearchKeyup);
        }
    }

    function handleSearchInput() {
        clearTimeout(window.searchTimeout);
        window.searchTimeout = setTimeout(() => {
            handleSearch();
        }, 500);
    }

    function handleSearchKeyup(e) {
        if (e.key === 'Enter') {
            clearTimeout(window.searchTimeout);
            handleSearch();
        }
    }

    function setupModalCancelButtons() {
        document.querySelectorAll('.modal-overlay .btn-outline').forEach(btn => {
            btn.removeEventListener('click', handleModalCancel);
            btn.addEventListener('click', handleModalCancel);
        });
    }

    function handleModalCancel() {
        const modal = this.closest('.modal-overlay');
        if (modal) {
            closeModal(modal.id);
        }
    }

    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            const firstInput = modal.querySelector('input:not([type="hidden"])');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';

            const form = modal.querySelector('form');
            if (form) {
                form.reset();
            }
        }
    }

    function loadCategoriaData(categoriaId) {
        showLoader(true);
        fetch(`/categoria/obtener/${categoriaId}`, {
            headers: {'Accept': 'application/json'}
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.message || `Error HTTP: ${response.status}`);
                }).catch(() => {
                    throw new Error(`Error HTTP: ${response.status}`);
                });
            }
            return response.json();
        })
        .then(data => {
            if (!data.success) {
                throw new Error(data.message || 'Datos de categoría no recibidos');
            }
            
            document.getElementById('editCategoriaId').value = categoriaId;
            document.getElementById('editNombre').value = data.nombre || '';
            document.getElementById('editDescripcion').value = data.descripcion || '';
            document.getElementById('editActivo').checked = data.activo;
            document.getElementById('formEditCategoria').setAttribute('action', `/categoria/actualizar/${categoriaId}`);
            openModal('editCategoriaModal');
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

        const activoCheckbox = form.querySelector('input[name="activo"][type="checkbox"]');
        if (activoCheckbox) {
            const hiddenActivo = form.querySelector('input[name="activo"][type="hidden"]');
            if (hiddenActivo) {
                formData.delete('activo');
            }
            formData.set('activo', activoCheckbox.checked ? 'true' : 'false');
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
                    throw new Error(err.message || 'Error al crear categoría');
                }).catch(() => {
                    throw new Error('Error al crear categoría');
                });
            }
            return response.json();
        })
        .then(data => {
            if (!data.success) {
                throw new Error(data.message || 'Error al crear categoría');
            }
            closeModal('createCategoriaModal');
            showToast('success', data.message || 'Categoría creada exitosamente');
            refreshTable();
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

        const activoCheckbox = form.querySelector('input[name="activo"][type="checkbox"]');
        if (activoCheckbox) {
            const hiddenActivo = form.querySelector('input[name="activo"][type="hidden"]');
            if (hiddenActivo) {
                formData.delete('activo');
            }
            formData.set('activo', activoCheckbox.checked ? 'true' : 'false');
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
                    throw new Error(err.message || 'Error al actualizar categoría');
                }).catch(() => {
                    throw new Error('Error al actualizar categoría');
                });
            }
            return response.json();
        })
        .then(data => {
            if (!data.success) {
                throw new Error(data.message || 'Error al actualizar categoría');
            }
            closeModal('editCategoriaModal');
            showToast('success', data.message || 'Categoría actualizada exitosamente');
            refreshTable();
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

        const csrfToken = document.querySelector('input[name="_csrf"]')?.value || '';

        fetch(form.action, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken
            },
            body: JSON.stringify({})
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.message || 'Error al eliminar categoría');
                }).catch(() => {
                    throw new Error('Error al eliminar categoría');
                });
            }
            return response.json();
        })
        .then(data => {
            if (!data.success) {
                throw new Error(data.message || 'Error al eliminar categoría');
            }
            closeModal('deleteCategoriaModal');
            showToast('success', data.message || 'Categoría eliminada exitosamente');
            refreshTable();
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

    function toggleCategoriaEstado(categoriaId) {
        showLoader(true);
        const csrfToken = document.querySelector('input[name="_csrf"]')?.value || '';

        fetch(`/categoria/toggle-estado/${categoriaId}`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken
            }
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.message || 'Error al cambiar estado');
                }).catch(() => {
                    throw new Error('Error al cambiar estado');
                });
            }
            return response.json();
        })
        .then(data => {
            if (!data.success) {
                throw new Error(data.message || 'Error al cambiar estado');
            }
            showToast('success', data.message || 'Estado actualizado');
            refreshTable();
        })
        .catch(error => {
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
        openModal('deleteCategoriaModal');
    }

    function showToast(type, message) {
        const toast = document.getElementById(`toast-${type}`);
        if (!toast) return;

        const messageElement = toast.querySelector('.toast-message span');
        if (messageElement) {
            messageElement.textContent = message;
        }

        toast.style.display = 'block';
        
        setTimeout(() => {
            toast.style.display = 'none';
        }, 5000);
    }

    function showLoader(show) {
        const loader = document.getElementById('globalLoader');
        if (loader) {
            loader.style.display = show ? 'flex' : 'none';
        }
    }

    function checkForSuccessMessages() {
        const successMessage = sessionStorage.getItem('successMessage');
        if (successMessage) {
            setTimeout(() => {
                showToast('success', successMessage);
            }, 100);
            sessionStorage.removeItem('successMessage');
        }

        const deleteMessage = sessionStorage.getItem('deleteSuccessMessage');
        if (deleteMessage) {
            setTimeout(() => {
                showToast('success', deleteMessage);
            }, 100);
            sessionStorage.removeItem('deleteSuccessMessage');
        }
    }

    function setupTableResize() {
        if (!table) return;

        let isResizing = false;
        let currentResizer = null;
        let startX, startWidth;

        function resize(e) {
            if (!isResizing) return;
            
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
            if (!isResizing) return;
            
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
            if (!resizers) return;
            
            resizers.forEach(resizer => {
                resizer.removeEventListener('mousedown', initResize);
                resizer.addEventListener('mousedown', initResize);
            });
        }

        function createResizers() {
            const headers = table?.querySelectorAll('thead tr:first-child th');
            if (!headers) return;
            
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
    }

    function initialize() {
        try {
            initializeTableState();
            checkForSuccessMessages();

            const btnCreateCategoria = document.getElementById('btnCreateCategoria');
            if (btnCreateCategoria) {
                btnCreateCategoria.removeEventListener('click', handleCreateButtonClick);
                btnCreateCategoria.addEventListener('click', handleCreateButtonClick);
            }

            if (table) {
                setupTableResize();
                adjustTableWidth();
                initSorting();
            }

            const createForm = document.getElementById('formCreateCategoria');
            if (createForm) {
                createForm.removeEventListener('submit', handleCreateFormSubmit);
                createForm.addEventListener('submit', handleCreateFormSubmit);
            }

            const editForm = document.getElementById('formEditCategoria');
            if (editForm) {
                editForm.removeEventListener('submit', handleEditFormSubmit);
                editForm.addEventListener('submit', handleEditFormSubmit);
            }

            const deleteForm = document.getElementById('formDeleteCategoria');
            if (deleteForm) {
                deleteForm.removeEventListener('submit', handleDeleteFormSubmit);
                deleteForm.addEventListener('submit', handleDeleteFormSubmit);
            }

            document.querySelectorAll('.toast-close').forEach(closeBtn => {
                closeBtn.removeEventListener('click', handleToastClose);
                closeBtn.addEventListener('click', handleToastClose);
            });

            setupFilters();
            setupPagination();
            setupModalCancelButtons();
            setupTableEvents();
            setupStickySearch();
            setupWindowResize();

        } catch (error) {
        }
    }

    function handleCreateButtonClick(e) {
        e.preventDefault();
        openModal('createCategoriaModal');
    }

    function handleToastClose() {
        const toast = this.closest('.toast-modal');
        if (toast) {
            toast.style.display = 'none';
        }
    }

    function setupStickySearch() {
        const searchSection = document.querySelector(".search-section");
        if (searchSection && tableContainer) {
            const offsetTop = searchSection.offsetTop;
            
            function handleScroll() {
                const scrollTop = window.scrollY;
                if (scrollTop >= offsetTop) {
                    searchSection.classList.add("fixed");
                    tableContainer.style.marginTop = `${searchSection.offsetHeight}px`;
                } else {
                    searchSection.classList.remove("fixed");
                    tableContainer.style.marginTop = "0";
                }
            }
            
            window.removeEventListener('scroll', handleScroll);
            window.addEventListener("scroll", handleScroll);
        }
    }

    function setupWindowResize() {
        let resizeTimeout;
        
        function handleResize() {
            if (resizeTimeout) {
                cancelAnimationFrame(resizeTimeout);
            }
            resizeTimeout = requestAnimationFrame(adjustTableWidth);
        }
        
        window.removeEventListener('resize', handleResize);
        window.addEventListener('resize', handleResize);
    }

    initialize();
});