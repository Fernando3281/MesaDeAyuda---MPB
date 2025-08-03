document.addEventListener('DOMContentLoaded', function () {
    let selectedSoportista = null;
    let soportistasData = [];
    const filterBtn = document.getElementById("filterBtn");
    const filterRow = document.getElementById("filterRow");
    const clearFiltersBtn = document.getElementById("clearFilters");
    const searchInput = document.getElementById("searchInput");
    const table = document.querySelector('.tickets-table');
    const tbody = table.querySelector('tbody');
    const pageInfo = document.getElementById('pageInfo');
    const recordsSelect = document.getElementById('recordsPerPage');
    const pageNumbers = document.getElementById('pageNumbers');
    const loadingIndicator = createLoadingIndicator();

    const defaultFilterState = {
        globalSearch: '',
        columnFilters: {},
        isFilterActive: false,
        currentPage: 0,
        pageSize: 15,
        sortField: 'fechaApertura',
        sortDirection: 'desc',
        currentSection: 'todos'
    };

    let filterState = {...defaultFilterState};

    const fechaFromApertura = document.getElementById('fechaFromApertura');
    const fechaToApertura = document.getElementById('fechaToApertura');
    const fechaFromActualizado = document.getElementById('fechaFromActualizado');
    const fechaToActualizado = document.getElementById('fechaToActualizado');

    if (fechaFromApertura && fechaToApertura && fechaFromActualizado && fechaToActualizado) {
        flatpickr("#fechaFromApertura", {
            dateFormat: "d/m/Y",
            locale: "es",
            placeholder: "dd/mm/yyyy"
        });

        flatpickr("#fechaToApertura", {
            dateFormat: "d/m/Y",
            locale: "es",
            placeholder: "dd/mm/yyyy"
        });

        flatpickr("#fechaFromActualizado", {
            dateFormat: "d/m/Y",
            locale: "es",
            placeholder: "dd/mm/yyyy"
        });

        flatpickr("#fechaToActualizado", {
            dateFormat: "d/m/Y",
            locale: "es",
            placeholder: "dd/mm/yyyy"
        });
    }

    function convertirFechaParaBackend(fechaTexto) {
        if (!fechaTexto)
            return '';
        const partes = fechaTexto.split('/');
        if (partes.length === 3) {
            return `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
        }
        return fechaTexto;
    }

    function convertirFechaParaMostrar(fechaInput) {
        if (!fechaInput)
            return '';
        const partes = fechaInput.split('-');
        if (partes.length === 3) {
            return `${partes[2]}/${partes[1]}/${partes[0]}`;
        }
        return fechaInput;
    }

    function initializeBackButton() {
        const backButton = document.querySelector('.back-button, .btn-back');
        if (backButton) {
            backButton.removeEventListener('click', handleBackButtonClick);
            backButton.addEventListener('click', handleBackButtonClick);
        }

        window.removeEventListener('popstate', handlePopState);
        window.addEventListener('popstate', handlePopState);
    }

    function handlePopState(event) {
        if (event.state && event.state.filterState) {
            restoreFilterState(event.state.filterState);
        } else {
            const savedState = loadSavedState();
            if (savedState) {
                restoreFilterState(savedState);
            }
        }
    }

    function handleBackButtonClick(e) {
        e.preventDefault();
        e.stopPropagation();

        try {
            sessionStorage.setItem('isBackNavigation', 'true');
            const savedState = loadSavedState();

            if (savedState) {
                navigateWithFilters(savedState);
            } else {
                window.location.href = '/tickets/listado';
            }
        } catch (error) {
            window.location.href = '/tickets/listado';
        }
    }

    function navigateWithFilters(filters) {
        let baseUrl = '/tickets/listado';
        if (filters.currentSection) {
            switch (filters.currentSection) {
                case 'mis-tickets':
                    baseUrl = '/tickets/mis-tickets';
                    break;
                case 'sin-asignar':
                    baseUrl = '/tickets/sin-asignar';
                    break;
            }
        }

        const params = new URLSearchParams();
        params.set('page', filters.currentPage || 0);
        params.set('size', filters.pageSize || 15);
        if (filters.sortField)
            params.set('sortField', filters.sortField);
        if (filters.sortDirection)
            params.set('sortDirection', filters.sortDirection);
        if (filters.globalSearch)
            params.set('search', filters.globalSearch);

        if (filters.columnFilters) {
            Object.entries(filters.columnFilters).forEach(([column, value]) => {
                if (value)
                    params.set(`filter_${column}`, value);
            });
        }

        if (filters.fechaFromApertura)
            params.set('filter_fechaAperturaFrom', filters.fechaFromApertura);
        if (filters.fechaToApertura)
            params.set('filter_fechaAperturaTo', filters.fechaToApertura);
        if (filters.fechaFromActualizado)
            params.set('filter_fechaActualizacionFrom', filters.fechaFromActualizado);
        if (filters.fechaToActualizado)
            params.set('filter_fechaActualizacionTo', filters.fechaToActualizado);

        const finalUrl = `${baseUrl}?${params.toString()}`;
        window.location.href = finalUrl;
    }

    function restoreFilterState(savedState) {
        filterState.globalSearch = savedState.globalSearch || '';
        filterState.columnFilters = savedState.columnFilters || {};
        filterState.currentPage = savedState.currentPage || 0;
        filterState.pageSize = savedState.pageSize || 15;
        filterState.sortField = savedState.sortField || 'fechaApertura';
        filterState.sortDirection = savedState.sortDirection || 'desc';
        filterState.currentSection = savedState.currentSection || getCurrentSection();

        if (searchInput)
            searchInput.value = filterState.globalSearch;

        Object.entries(filterState.columnFilters).forEach(([column, value]) => {
            const input = filterRow.querySelector(`input[data-column="${column}"]`);
            if (input)
                input.value = value;
        });

        if (savedState.fechaFromApertura && fechaFromApertura)
            fechaFromApertura.value = convertirFechaParaMostrar(savedState.fechaFromApertura);
        if (savedState.fechaToApertura && fechaToApertura)
            fechaToApertura.value = convertirFechaParaMostrar(savedState.fechaToApertura);
        if (savedState.fechaFromActualizado && fechaFromActualizado)
            fechaFromActualizado.value = convertirFechaParaMostrar(savedState.fechaFromActualizado);
        if (savedState.fechaToActualizado && fechaToActualizado)
            fechaToActualizado.value = convertirFechaParaMostrar(savedState.fechaToActualizado);

        filterState.isFilterActive = hasActiveFilters();
        applyFiltersAsync();
    }

    function loadSavedState() {
        try {
            const savedState = sessionStorage.getItem('ticketsTableState') ||
                    localStorage.getItem('ticketsTableState');
            return savedState ? JSON.parse(savedState) : null;
        } catch (e) {
            return null;
        }
    }

    function saveCurrentState() {
        const currentState = {
            globalSearch: filterState.globalSearch,
            columnFilters: {...filterState.columnFilters},
            currentPage: filterState.currentPage,
            pageSize: filterState.pageSize,
            sortField: filterState.sortField,
            sortDirection: filterState.sortDirection,
            isFilterActive: filterState.isFilterActive,
            currentSection: filterState.currentSection,
            fechaFromApertura: convertirFechaParaBackend(fechaFromApertura?.value || ''),
            fechaToApertura: convertirFechaParaBackend(fechaToApertura?.value || ''),
            fechaFromActualizado: convertirFechaParaBackend(fechaFromActualizado?.value || ''),
            fechaToActualizado: convertirFechaParaBackend(fechaToActualizado?.value || ''),
            timestamp: Date.now()
        };

        sessionStorage.setItem('ticketsTableState', JSON.stringify(currentState));
        localStorage.setItem('ticketsTableState', JSON.stringify(currentState));
    }

    function clearStoredStatesOnReload() {
        if (window.performance && (
                window.performance.navigation.type === window.performance.navigation.TYPE_RELOAD ||
                window.performance.getEntriesByType('navigation')[0]?.type === 'reload'
                )) {
            sessionStorage.removeItem('ticketsTableState');
            localStorage.removeItem('ticketsTableState');
            localStorage.removeItem('tableColumnWidths');
            sessionStorage.removeItem('isBackNavigation');
        }
    }

    function getCurrentSection() {
        const currentPath = window.location.pathname;
        if (currentPath.includes('/tickets/mis-tickets'))
            return 'mis-tickets';
        if (currentPath.includes('/tickets/sin-asignar'))
            return 'sin-asignar';
        return 'todos';
    }

    function initializeFilters() {
        clearStoredStatesOnReload();

        filterRow.style.display = "none";
        filterBtn.classList.remove('active');
        filterState.currentSection = getCurrentSection();

        const isBackNavigation = sessionStorage.getItem('isBackNavigation') === 'true';

        if (isBackNavigation) {
            sessionStorage.removeItem('isBackNavigation');
            const savedState = loadSavedState();
            if (savedState) {
                restoreFilterState(savedState);
                return;
            }
        }

        resetFilterState();

        const urlParams = new URLSearchParams(window.location.search);
        let hasUrlParams = false;

        if (!window.performance || (
                window.performance.navigation.type !== window.performance.navigation.TYPE_RELOAD &&
                window.performance.getEntriesByType('navigation')[0]?.type !== 'reload'
                )) {
            filterState.currentPage = parseInt(urlParams.get('page')) || 0;
            filterState.pageSize = parseInt(urlParams.get('size')) || 15;
            filterState.sortField = urlParams.get('sortField') || 'fechaApertura';
            filterState.sortDirection = urlParams.get('sortDirection') || 'desc';
            filterState.globalSearch = urlParams.get('search') || '';

            filterState.columnFilters = {};
            urlParams.forEach((value, key) => {
                if (key.startsWith('filter_') && key !== 'filter_fechaAperturaFrom' && key !== 'filter_fechaAperturaTo' &&
                        key !== 'filter_fechaActualizacionFrom' && key !== 'filter_fechaActualizacionTo') {
                    const column = key.replace('filter_', '');
                    filterState.columnFilters[column] = value;
                    hasUrlParams = true;
                }
            });

            const fechaFromAperturaValue = urlParams.get('filter_fechaAperturaFrom') || '';
            const fechaToAperturaValue = urlParams.get('filter_fechaAperturaTo') || '';
            const fechaFromActualizadoValue = urlParams.get('filter_fechaActualizacionFrom') || '';
            const fechaToActualizadoValue = urlParams.get('filter_fechaActualizacionTo') || '';

            if (fechaFromAperturaValue && fechaFromApertura) {
                fechaFromApertura.value = convertirFechaParaMostrar(fechaFromAperturaValue);
                hasUrlParams = true;
            }
            if (fechaToAperturaValue && fechaToApertura) {
                fechaToApertura.value = convertirFechaParaMostrar(fechaToAperturaValue);
                hasUrlParams = true;
            }
            if (fechaFromActualizadoValue && fechaFromActualizado) {
                fechaFromActualizado.value = convertirFechaParaMostrar(fechaFromActualizadoValue);
                hasUrlParams = true;
            }
            if (fechaToActualizadoValue && fechaToActualizado) {
                fechaToActualizado.value = convertirFechaParaMostrar(fechaToActualizadoValue);
                hasUrlParams = true;
            }

            if (searchInput)
                searchInput.value = filterState.globalSearch;
            Object.entries(filterState.columnFilters).forEach(([column, value]) => {
                const input = filterRow.querySelector(`input[data-column="${column}"]`);
                if (input)
                    input.value = value;
            });
        }

        filterState.isFilterActive = hasActiveFilters();
        if ((filterState.isFilterActive || hasUrlParams) && !isBackNavigation) {
            applyFiltersAsync();
        } else {
            applyFiltersAsync();
        }

        if (recordsSelect)
            recordsSelect.value = filterState.pageSize;

        setupFilterEvents();
        initializeDateFilters();

        if (window.location.search) {
            window.history.replaceState({}, '', window.location.pathname);
        }
    }

    function resetFilterState() {
        const filterInputs = filterRow.querySelectorAll('input[type="text"]');
        filterInputs.forEach(input => input.value = '');
        if (searchInput)
            searchInput.value = '';
        if (fechaFromApertura)
            fechaFromApertura.value = '';
        if (fechaToApertura)
            fechaToApertura.value = '';
        if (fechaFromActualizado)
            fechaFromActualizado.value = '';
        if (fechaToActualizado)
            fechaToActualizado.value = '';

        if (fechaFromApertura?._flatpickr)
            fechaFromApertura._flatpickr.clear();
        if (fechaToApertura?._flatpickr)
            fechaToApertura._flatpickr.clear();
        if (fechaFromActualizado?._flatpickr)
            fechaFromActualizado._flatpickr.clear();
        if (fechaToActualizado?._flatpickr)
            fechaToActualizado._flatpickr.clear();

        filterState = {...defaultFilterState, currentSection: getCurrentSection()};
    }

    function setupFilterEvents() {
        filterBtn.addEventListener("click", function () {
            const isFilterRowVisible = filterRow.style.display !== "none";
            filterRow.style.display = isFilterRowVisible ? "none" : "table-header-group";
            filterBtn.classList.toggle('active', !isFilterRowVisible);

            if (!isFilterRowVisible) {
                setTimeout(() => {
                    const firstFilterInput = filterRow.querySelector('input');
                    if (firstFilterInput)
                        firstFilterInput.focus();
                }, 100);
            }
        });

        clearFiltersBtn.addEventListener("click", function () {
            resetFilterState();
            applyFiltersAsync();
            saveCurrentState();
        });

        const filterInputs = filterRow.querySelectorAll('input[type="text"][data-column]');
        filterInputs.forEach(input => {
            const columnName = input.getAttribute('data-column');
            input.addEventListener('input', debounce(() => {
                let value = input.value.trim();

                if (columnName === 'solicitante' || columnName === 'asignadoPara') {
                    if (value.startsWith('#')) {
                        filterState.columnFilters[columnName + '_codigo'] = value.substring(1);
                        filterState.columnFilters[columnName] = '';
                    } else {
                        filterState.columnFilters[columnName] = value;
                        filterState.columnFilters[columnName + '_codigo'] = '';
                    }
                } else {
                    filterState.columnFilters[columnName] = value;
                }

                filterState.isFilterActive = hasActiveFilters();
                filterState.currentPage = 0;
                applyFiltersAsync();
            }, 300));
        });

        if (searchInput) {
            searchInput.addEventListener('input', debounce(() => {
                filterState.globalSearch = searchInput.value;
                filterState.isFilterActive = hasActiveFilters();
                filterState.currentPage = 0;
                applyFiltersAsync();
            }, 300));
        }

        if (recordsSelect) {
            recordsSelect.addEventListener('change', function () {
                const selectedSize = parseInt(this.value);
                filterState.pageSize = Math.min(selectedSize, 1000);
                filterState.currentPage = 0;
                applyFiltersAsync();
            });
        }

        [fechaFromApertura, fechaToApertura, fechaFromActualizado, fechaToActualizado].forEach(input => {
            if (input) {
                input.addEventListener('change', () => {
                    filterState.isFilterActive = hasActiveFilters();
                    filterState.currentPage = 0;
                });
            }
        });
    }

    function hasActiveFilters() {
        if (filterState.globalSearch.length > 0)
            return true;
        if (Object.values(filterState.columnFilters).some(filter => filter.length > 0))
            return true;
        if (fechaFromApertura?.value)
            return true;
        if (fechaToApertura?.value)
            return true;
        if (fechaFromActualizado?.value)
            return true;
        if (fechaToActualizado?.value)
            return true;
        return false;
    }

    async function applyFiltersAsync() {
        try {
            showLoading();

            if (filterState.pageSize > 1000) {
                filterState.pageSize = 1000;
                if (recordsSelect)
                    recordsSelect.value = '1000';
            }

            let baseUrl = '/tickets/listado';
            const currentPath = window.location.pathname;

            if (currentPath.includes('/tickets/mis-tickets')) {
                baseUrl = '/tickets/mis-tickets';
                filterState.currentSection = 'mis-tickets';
            } else if (currentPath.includes('/tickets/sin-asignar')) {
                baseUrl = '/tickets/sin-asignar';
                filterState.currentSection = 'sin-asignar';
            } else {
                filterState.currentSection = 'todos';
            }

            const params = new URLSearchParams();
            params.set('page', filterState.currentPage.toString());
            params.set('size', filterState.pageSize.toString());
            params.set('sortField', filterState.sortField);
            params.set('sortDirection', filterState.sortDirection);

            if (filterState.globalSearch)
                params.set('search', filterState.globalSearch);

            Object.entries(filterState.columnFilters).forEach(([column, value]) => {
                if (value) {
                    if (column === 'asignadoPara' && isSinAsignar(value)) {
                        params.set(`filter_${column}`, 'Sin Asignar');
                    } else {
                        params.set(`filter_${column}`, value);
                    }
            }
            });

            const fechaFromAperturaValue = fechaFromApertura?.value ? convertirFechaParaBackend(fechaFromApertura.value) : '';
            const fechaToAperturaValue = fechaToApertura?.value ? convertirFechaParaBackend(fechaToApertura.value) : '';
            const fechaFromActualizadoValue = fechaFromActualizado?.value ? convertirFechaParaBackend(fechaFromActualizado.value) : '';
            const fechaToActualizadoValue = fechaToActualizado?.value ? convertirFechaParaBackend(fechaToActualizado.value) : '';

            if (fechaFromAperturaValue)
                params.set('filter_fechaAperturaFrom', fechaFromAperturaValue);
            if (fechaToAperturaValue)
                params.set('filter_fechaAperturaTo', fechaToAperturaValue);
            if (fechaFromActualizadoValue)
                params.set('filter_fechaActualizacionFrom', fechaFromActualizadoValue);
            if (fechaToActualizadoValue)
                params.set('filter_fechaActualizacionTo', fechaToActualizadoValue);

            saveCurrentState();

            const response = await fetch(`${baseUrl}?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (!response.ok)
                throw new Error('Error en la petición');

            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            const newTbody = doc.querySelector('tbody');
            if (newTbody && tbody) {
                tbody.innerHTML = newTbody.innerHTML;
                initializeCheckboxEvents();
                initializeTicketLinks();
            }

            const totalItemsMatch = html.match(/de\s+(\d+)\s+registros/);
            const totalItems = totalItemsMatch ? parseInt(totalItemsMatch[1]) : 0;
            updatePaginationInfo(totalItems);

            updateURL();
            updateSortIcons(filterState.sortField, filterState.sortDirection);

        } catch (error) {
            showErrorMessage('Error al cargar los datos. Por favor, intenta nuevamente.');
        } finally {
            hideLoading();
        }
    }

    function isSinAsignar(value) {
        if (!value || typeof value !== 'string')
            return false;
        const normalizedValue = value.trim().toLowerCase();
        return normalizedValue === 'sin asignar';
    }

    function initializeDateFilters() {
        const dateFilters = document.querySelectorAll('.date-filter-dropdown');

        dateFilters.forEach(filter => {
            const container = filter.closest('.date-filter-container');
            const popup = container.querySelector('.date-filter-popup');
            const applyBtn = popup.querySelector('.date-filter-apply');
            const clearBtn = popup.querySelector('.date-filter-clear');

            filter.addEventListener('click', (e) => {
                e.stopPropagation();

                document.querySelectorAll('.date-filter-container').forEach(c => {
                    if (c !== container)
                        c.classList.remove('active');
                });

                container.classList.toggle('active');

                if (container.classList.contains('active')) {
                    const rect = filter.getBoundingClientRect();
                    const popupWidth = popup.offsetWidth;
                    const popupHeight = popup.offsetHeight;
                    const isLastColumn = container.closest('th:nth-child(10)');

                    let left, top;

                    if (isLastColumn) {
                        const tableRect = table.getBoundingClientRect();
                        const tableRight = tableRect.right;
                        const windowWidth = window.innerWidth;

                        left = Math.min(tableRight - popupWidth, windowWidth - popupWidth - 10);
                        top = rect.bottom + window.scrollY;

                        const spaceBelow = window.innerHeight - rect.bottom;
                        if (spaceBelow < popupHeight && rect.top > popupHeight) {
                            top = rect.top + window.scrollY - popupHeight - 2;
                        }
                    } else {
                        left = rect.left;
                        top = rect.bottom + window.scrollY;

                        if (left + popupWidth > window.innerWidth) {
                            left = window.innerWidth - popupWidth - 10;
                        }

                        const spaceBelow = window.innerHeight - rect.bottom;
                        if (spaceBelow < popupHeight && rect.top > popupHeight) {
                            top = rect.top + window.scrollY - 2;
                        }
                    }

                    popup.style.left = `${left}px`;
                    popup.style.top = `${top}px`;
                }
            });

            applyBtn.addEventListener('click', () => {
                container.classList.remove('active');
                filterState.currentPage = 0;
                applyFiltersAsync();
            });

            if (clearBtn) {
                clearBtn.addEventListener('click', () => {
                    const inputs = popup.querySelectorAll('.date-filter-input');
                    inputs.forEach(input => {
                        if (input._flatpickr) {
                            input._flatpickr.clear();
                        } else {
                            input.value = '';
                        }
                    });
                });
            }
        });

        document.addEventListener('click', (e) => {
            const isClickInsideDateFilter = e.target.closest('.date-filter-container') ||
                    e.target.closest('.flatpickr-calendar') ||
                    e.target.classList.contains('date-filter-input') ||
                    e.target.classList.contains('flatpickr-data') ||
                    e.target.classList.contains('date-filter-clear');
            if (!isClickInsideDateFilter) {
                document.querySelectorAll('span.date-filter-container').forEach(c => {
                    c.classList.remove('active');
                });
            }
        });

        window.addEventListener('resize', () => {
            document.querySelectorAll('.date-filter-container.active').forEach(container => {
                const popup = container.querySelector('.date-filter-popup');
                const filter = container.querySelector('.date-filter-dropdown');

                if (popup && filter.state) {
                    const rect = filter.getBoundingClientRect();
                    const popupWidth = popup.offsetWidth;
                    const popupHeight = popup.offsetHeight;
                    const isLastColumn = container.closest('th:nth-child(10)');

                    let left, top;

                    if (isLastColumn) {
                        const tableRect = table.getBoundingClientRect();
                        const tableRight = tableRect.right;
                        const windowWidth = window.innerWidth;

                        left = Math.min(tableRight - popupWidth, windowWidth - popupWidth - 10);
                        top = rect.bottom + window.scrollY;

                        const spaceBelow = window.innerHeight - rect.bottom;
                        if (spaceBelow < popupHeight && rect.top > popupHeight) {
                            top = rect.top + window.scrollY - popupHeight - 2;
                        }
                    } else {
                        left = rect.left;
                        top = rect.bottom + window.scrollY;

                        if (left + popupWidth > windowWidth) {
                            left = window.innerWidth - popupWidth - 10;
                        }

                        const spaceBelow = window.innerHeight - rect.bottom;
                        if (spaceBelow < popupHeight && rect.top > popupHeight) {
                            top = rect.top + window.scrollY - popupHeight - 2;
                        }
                    }

                    popup.style.left = `${left}px`;
                    popup.style.top = `${top}px`;
                }
            });
        });
    }

    document.getElementById('exportBtn').addEventListener('click', function (e) {
        e.stopPropagation();
        const exportMenu = document.getElementById('exportMenu');
        exportMenu.style.display = exportMenu.style.display === 'block' ? 'none' : 'block';
    });

    document.addEventListener('click', function (e) {
        const exportMenu = document.getElementById('exportMenu');
        if (exportMenu.style.display === 'block' && !e.target.closest('.export-container')) {
            exportMenu.style.display = 'none';
        }
    });

    document.querySelectorAll('.export-item').forEach(item => {
        item.addEventListener('click', function () {
            const format = this.getAttribute('data-format');
            exportTickets(format);
        });
    });

    function exportTickets(format) {
        let tipoExportacion;
        switch (format) {
            case 'pdf':
                tipoExportacion = 'Pdf';
                break;
            case 'excel':
                tipoExportacion = 'Xls';
                break;
            case 'csv':
                tipoExportacion = 'Csv';
                break;
            case 'rtf':
                tipoExportacion = 'Rtf';
                break;
            default:
                tipoExportacion = 'Pdf';
        }

        const params = new URLSearchParams();
        params.set('tipo', tipoExportacion);

        if (filterState.globalSearch)
            params.set('search', filterState.globalSearch);

        Object.entries(filterState.columnFilters).forEach(([column, value]) => {
            if (value) {
                if (column === 'asignadoPara' && isSinAsignar(value)) {
                    params.set(`filter_${column}`, 'Sin Asignar');
                } else {
                    params.set(`filter_${column}`, value);
                }
        }
        });

        const fechaFromAperturaValue = fechaFromApertura?.value ? convertirFechaParaBackend(fechaFromApertura.value) : '';
        const fechaToAperturaValue = fechaToApertura?.value ? convertirFechaParaBackend(fechaToApertura.value) : '';
        const fechaFromActualizadoValue = fechaFromActualizado?.value ? convertirFechaParaBackend(fechaFromActualizado.value) : '';
        const fechaToActualizadoValue = fechaToActualizado?.value ? convertirFechaParaBackend(fechaToActualizado.value) : '';

        if (fechaFromAperturaValue)
            params.set('filter_fechaAperturaFrom', fechaFromAperturaValue);
        if (fechaToAperturaValue)
            params.set('filter_fechaAperturaTo', fechaToAperturaValue);
        if (fechaFromActualizadoValue)
            params.set('filter_fechaActualizadoFrom', fechaFromActualizadoValue);
        if (fechaToActualizadoValue)
            params.set('filter_fechaActualizadoTo', fechaToActualizadoValue);

        let baseUrl = 'reportes/exportarTickets';
        const currentPath = window.location.pathname;
        if (currentPath.includes('/tickets/mis-tickets')) {
            params.set('section', 'mis-tickets');
        } else if (currentPath.includes('/tickets/sin-asignar')) {
            params.set('section', 'sin-asignar');
        } else {
            params.set('section', 'todos');
        }

        const url = `${baseUrl}?${params.toString()}`;
        showLoading();

        if (format === 'pdf') {
            window.open(url, '_blank');
        } else {
            const a = document.createElement('a');
            a.href = url;
            a.download = `reporte_tickets.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }

        document.getElementById('exportMenu').style.display = 'none';
        hideLoading();
    }

    function handlePaginationClick(newPage) {
        filterState.currentPage = newPage;
        applyFiltersAsync();
    }

    function updatePaginationInfo(totalItems) {
        if (!pageInfo)
            return;

        const start = totalItems === 0 ? 0 : filterState.currentPage * filterState.pageSize + 1;
        const end = Math.min((filterState.currentPage + 1) * filterState.pageSize, totalItems);

        pageInfo.textContent = `Mostrando ${start} a ${end} de ${totalItems} registros`;

        if (pageNumbers) {
            const totalPages = Math.ceil(totalItems / filterState.pageSize);
            let startPage, endPage;

            if (totalPages <= 5) {
                startPage = 0;
                endPage = totalPages - 1;
            } else {
                startPage = Math.max(0, filterState.currentPage - 2);
                endPage = Math.min(totalPages - 1, filterState.currentPage + 2);

                if (filterState.currentPage < 3) {
                    endPage = 4;
                } else if (filterState.currentPage > totalPages - 4) {
                    startPage = totalPages - 5;
                }
            }

            pageNumbers.innerHTML = '';

            if (totalItems > 0) {
                if (totalPages <= 1) {
                    const pageBtn = document.createElement('button');
                    pageBtn.className = 'page-number active';
                    pageBtn.textContent = '1';
                    pageBtn.onclick = function () {
                        handlePaginationClick(0);
                    };
                    pageNumbers.appendChild(pageBtn);
                } else {
                    for (let i = startPage; i <= endPage; i++) {
                        const pageBtn = document.createElement('button');
                        pageBtn.className = `page-number ${i === filterState.currentPage ? 'active' : ''}`;
                        pageBtn.textContent = i + 1;
                        pageBtn.onclick = function () {
                            handlePaginationClick(i);
                        };
                        pageNumbers.appendChild(pageBtn);
                    }
                }
            }
        }
    }

    function updateURL() {
        let baseUrl = '/tickets/listado';
        const currentPath = window.location.pathname;

        if (currentPath.includes('/tickets/mis-tickets')) {
            baseUrl = '/tickets/mis-tickets';
            filterState.currentSection = 'mis-tickets';
        } else if (currentPath.includes('/tickets/sin-asignar')) {
            baseUrl = '/tickets/sin-asignar';
            filterState.currentSection = 'sin-asignar';
        } else {
            filterState.currentSection = 'todos';
        }

        const params = new URLSearchParams();
        params.set('page', filterState.currentPage);
        params.set('size', filterState.pageSize);
        params.set('sortField', filterState.sortField);
        params.set('sortDirection', filterState.sortDirection);

        if (filterState.globalSearch)
            params.set('search', filterState.globalSearch);

        Object.entries(filterState.columnFilters).forEach(([column, value]) => {
            if (value) {
                if (column === 'asignadoPara' && isSinAsignar(value)) {
                    params.set(`filter_${column}`, 'Sin Asignar');
                } else {
                    params.set(`filter_${column}`, value);
                }
        }
        });

        const fechaFromAperturaValue = fechaFromApertura?.value ? convertirFechaParaBackend(fechaFromApertura.value) : '';
        const fechaToAperturaValue = fechaToApertura?.value ? convertirFechaParaBackend(fechaToApertura.value) : '';
        const fechaFromActualizadoValue = fechaFromActualizado?.value ? convertirFechaParaBackend(fechaFromActualizado.value) : '';
        const fechaToActualizadoValue = fechaToActualizado?.value ? convertirFechaParaBackend(fechaToActualizado.value) : '';

        if (fechaFromAperturaValue)
            params.set('filter_fechaAperturaFrom', fechaFromAperturaValue);
        if (fechaToAperturaValue)
            params.set('filter_fechaAperturaTo', fechaToAperturaValue);
        if (fechaFromActualizadoValue)
            params.set('filter_fechaActualizadoFrom', fechaFromActualizadoValue);
        if (fechaToActualizadoValue)
            params.set('filter_fechaToActualizadoTo', fechaToActualizadoValue);

        const newUrl = `${baseUrl}?${params.toString()}`;
        window.history.replaceState({
            filterState: getCurrentFilterState(),
            timestamp: Date.now()
        }, '', newUrl);

        saveCurrentState();
    }

    function initializeTicketLinks() {
        document.querySelectorAll('.ticket-link').forEach(link => {
            link.removeEventListener('click', handleTicketLinkClick);
            link.addEventListener('click', handleTicketLinkClick);
        });
    }

    function handleTicketLinkClick(e) {
        if (e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
            e.preventDefault();
            saveCurrentState();
            window.location.href = e.currentTarget.href;
        }
    }

    function initializeCheckboxEvents() {
        const selectAll = document.getElementById('selectAll');
        const checkboxes = document.querySelectorAll('.ticket-checkbox');
        const assignBtn = document.getElementById('assignTicketsBtn');

        if (!selectAll || !assignBtn)
            return;

        function updateCheckboxStates() {
            const checkedBoxes = Array.from(checkboxes).filter(cb => cb.checked);
            assignBtn.style.display = checkedBoxes.length > 0 ? 'flex' : 'none';
            if (selectAll) {
                selectAll.checked = checkedBoxes.length === checkboxes.length;
                selectAll.indeterminate = checkedBoxes.length > 0 && checkedBoxes.length < checkboxes.length;
            }
        }

        if (selectAll) {
            selectAll.addEventListener('change', function () {
                checkboxes.forEach(checkbox => {
                    checkbox.checked = this.checked;
                });
                updateCheckboxStates();
            });
        }

        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', updateCheckboxStates);
        });

        updateCheckboxStates();
    }

    function showErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc3545;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 1001;
            max-width: 300px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        `;

        document.body.appendChild(errorDiv);

        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    function initializeSorting() {
        const sortIcons = document.querySelectorAll('.sort-icon');

        sortIcons.forEach(icon => {
            icon.removeEventListener('click', handleSortClick);
            icon.addEventListener('click', handleSortClick);
        });
    }

    function handleSortClick(e) {
        e.preventDefault();
        e.stopPropagation();

        const columnName = this.getAttribute('data-column');
        if (!columnName)
            return;

        if (filterState.sortField === columnName) {
            filterState.sortDirection = filterState.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            filterState.sortField = columnName;
            filterState.sortDirection = 'desc';
        }

        filterState.currentPage = 0;
        applyFiltersAsync();
    }

    function updateSortIcons(activeColumn, direction) {
        const sortIcons = document.querySelectorAll('.sort-icon');

        sortIcons.forEach(icon => {
            const iconColumn = icon.getAttribute('data-column');
            icon.className = 'fas fa-sort sort-icon';
            if (iconColumn === activeColumn) {
                icon.className = direction === 'asc'
                        ? 'fas fa-sort-up sort-icon active'
                        : 'fas fa-sort-down sort-icon active';
            }
        });
    }

    function reinitializeEvents() {
        initializeCheckboxEvents();
        initializeSorting();
    }

    function setLoadingState(isLoading) {
        if (isLoading) {
            showLoading();
            if (filterBtn)
                filterBtn.disabled = true;
            if (clearFiltersBtn)
                clearFiltersBtn.disabled = true;
            if (recordsSelect)
                recordsSelect.disabled = true;
        } else {
            hideLoading();
            if (filterBtn)
                filterBtn.disabled = false;
            if (clearFiltersBtn)
                clearFiltersBtn.disabled = false;
            if (recordsSelect)
                recordsSelect.disabled = false;
        }
    }

    function getCurrentFilterState() {
        return {
            globalSearch: filterState.globalSearch,
            columnFilters: {...filterState.columnFilters},
            currentPage: filterState.currentPage,
            pageSize: filterState.pageSize,
            sortField: filterState.sortField,
            sortDirection: filterState.sortDirection,
            isFilterActive: filterState.isFilterActive,
            currentSection: filterState.currentSection,
            fechaFromApertura: convertirFechaParaBackend(fechaFromApertura?.value || ''),
            fechaToApertura: convertirFechaParaBackend(fechaToApertura?.value || ''),
            fechaFromActualizado: convertirFechaParaBackend(fechaFromActualizado?.value || ''),
            fechaToActualizado: convertirFechaParaBackend(fechaToActualizado?.value || '')
        };
    }

    const refreshBtn = document.getElementById('btnRefreshMessages');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            applyFiltersAsync();
        });
    }

    function createLoadingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'loading-indicator';
        indicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cargando...';
        indicator.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 255, 255, 0.9);
            padding: 10px 20px;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 1000;
            display: none;
        `;
        document.body.appendChild(indicator);
        return indicator;
    }

    function showLoading() {
        loadingIndicator.style.display = 'block';
        if (tbody)
            tbody.style.opacity = '0.5';
    }

    function hideLoading() {
        loadingIndicator.style.display = 'none';
        if (tbody)
            tbody.style.opacity = '1';
    }

    function initializeAll() {
        initializeFilters();
        initializeSorting();
        initializeCheckboxEvents();
        initializeBackButton();
        initializeTicketLinks();

        updateSortIcons(filterState.sortField, filterState.sortDirection);

        const totalItemsElement = document.querySelector('[th\\:text*="totalItems"]');
        if (totalItemsElement) {
            const totalItemsText = totalItemsElement.textContent;
            const totalItemsMatch = totalItemsText.match(/\d+/);
            if (totalItemsMatch) {
                const totalItems = parseInt(totalItemsMatch[0]);
                updatePaginationInfo(totalItems);
            }
        }
    }

    function handleTableResize() {
        const table = document.querySelector('.table-resizable');
        const tableContainer = document.querySelector('.table-container');
        const sidebar = document.querySelector('.sidebar');

        if (!table || !tableContainer) {
            return;
        }

        const defaultColumnWidths = [
            40,
            120,
            100,
            300,
            120,
            100,
            100,
            100,
            120,
            100
        ];

        const MIN_COLUMN_WIDTH = 80;
        const MAX_COLUMN_WIDTH = 600;

        function isPageReload() {
            const currentTimestamp = Date.now();
            const lastLoadTimestamp = sessionStorage.getItem('lastPageLoadTimestamp');
            const isNewSession = !lastLoadTimestamp || (currentTimestamp - parseInt(lastLoadTimestamp) > 1000);
            sessionStorage.setItem('lastPageLoadTimestamp', currentTimestamp.toString());
            return isNewSession || window.performance?.navigation?.type === window.performance.navigation.TYPE_RELOAD ||
                    performance.getEntriesByType('navigation')[0]?.type === 'reload';
        }

        function getColumnWidths() {
            try {
                if (isPageReload()) {
                    localStorage.removeItem('tableColumnWidths');
                    return defaultColumnWidths;
                }

                const savedWidths = localStorage.getItem('tableColumnWidths');
                if (savedWidths) {
                    const parsedWidths = JSON.parse(savedWidths);
                    if (Array.isArray(parsedWidths) && parsedWidths.length === defaultColumnWidths.length) {
                        return parsedWidths.map(width => Math.max(MIN_COLUMN_WIDTH, Math.min(MAX_COLUMN_WIDTH, width)));
                    }
                }
                return defaultColumnWidths;
            } catch (error) {
                return defaultColumnWidths;
            }
        }

        function saveColumnWidths(widths) {
            try {
                localStorage.setItem('tableColumnWidths', JSON.stringify(widths));
            } catch (error) {
            }
        }

        let currentColumnWidths = getColumnWidths();

        const thead = table.querySelector('thead');
        const tbody = table.querySelector('tbody');
        const filterRow = table.querySelector('#filterRow');

        function adjustTableWidth() {
            requestAnimationFrame(() => {
                const containerWidth = tableContainer.offsetWidth;
                const totalColumnsWidth = currentColumnWidths.reduce((a, b) => a + b, 0);

                table.style.width = containerWidth >= totalColumnsWidth
                        ? `${containerWidth}px`
                        : `${totalColumnsWidth}px`;

                const rows = [
                    ...thead.querySelectorAll('tr'),
                    ...(filterRow ? [filterRow] : []),
                    ...tbody.querySelectorAll('tr')
                ];

                rows.forEach(row => {
                    const cells = Array.from(row.children);
                    cells.forEach((cell, index) => {
                        if (index < currentColumnWidths.length) {
                            cell.style.width = `${currentColumnWidths[index]}px`;
                            cell.style.minWidth = `${currentColumnWidths[index]}px`;
                            cell.style.maxWidth = `${currentColumnWidths[index]}px`;
                        }
                    });
                });
            });
        }

        let isResizing = false;
        let currentResizer = null;
        let startX = 0;
        let startWidth = 0;
        let columnIndex = 0;

        function resize(e) {
            if (!isResizing)
                return;

            requestAnimationFrame(() => {
                const delta = e.pageX - startX;
                const newWidth = Math.max(MIN_COLUMN_WIDTH, Math.min(MAX_COLUMN_WIDTH, startWidth + delta));

                currentColumnWidths[columnIndex] = newWidth;

                const cells = table.querySelectorAll(`
                    thead tr th:nth-child(${columnIndex + 1}),
                    #filterRow th:nth-child(${columnIndex + 1}),
                    tbody td:nth-child(${columnIndex + 1})
                `);

                cells.forEach(cell => {
                    cell.style.width = `${newWidth}px`;
                    cell.style.minWidth = `${newWidth}px`;
                    cell.style.maxWidth = `${newWidth}px`;
                });

                adjustTableWidth();
            });
        }

        function stopResize() {
            if (!isResizing)
                return;

            isResizing = false;
            if (currentResizer) {
                currentResizer.classList.remove('active');
            }
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            table.classList.remove('resizing');

            document.removeEventListener('mousemove', resize);
            document.removeEventListener('mouseup', stopResize);

            saveColumnWidths(currentColumnWidths);
        }

        function initResize(e) {
            const resizer = e.target;
            const th = resizer.parentElement;
            columnIndex = th.cellIndex;

            if (columnIndex === 0)
                return;

            isResizing = true;
            currentResizer = resizer;
            startX = e.pageX;
            startWidth = th.offsetWidth;

            currentResizer.classList.add('active');
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            table.classList.add('resizing');

            document.addEventListener('mousemove', resize);
            document.addEventListener('mouseup', stopResize);
        }

        const resizers = table.querySelectorAll('.resizer');
        resizers.forEach((resizer, index) => {
            if (index === 0)
                return;
            resizer.addEventListener('mousedown', initResize);
        });

        if (sidebar) {
            const observer = new MutationObserver(adjustTableWidth);
            observer.observe(sidebar, {
                attributes: true,
                attributeFilter: ['class']
            });
        }

        const sidebarToggleBtn = document.querySelector('.sidebar-toggle');
        if (sidebarToggleBtn) {
            sidebarToggleBtn.addEventListener('click', () => setTimeout(adjustTableWidth, 300));
        }

        const mobileToggleBtn = document.querySelector('.mobile-toggle');
        if (mobileToggleBtn) {
            mobileToggleBtn.addEventListener('click', () => setTimeout(adjustTableWidth, 300));
        }

        let resizeTimeout;
        window.addEventListener('resize', () => {
            if (resizeTimeout) {
                cancelAnimationFrame(resizeTimeout);
            }
            resizeTimeout = requestAnimationFrame(adjustTableWidth);
        });

        adjustTableWidth();
    }

    const selectAll = document.getElementById('selectAll');
    const checkboxes = document.querySelectorAll('.ticket-checkbox');
    const assignBtn = document.getElementById('assignTicketsBtn');

    if (selectAll && assignBtn) {
        function updateAssignButtonVisibility() {
            const anyChecked = Array.from(checkboxes).some(checkbox => checkbox.checked);
            assignBtn.style.display = anyChecked ? 'flex' : 'none';
        }

        selectAll.addEventListener('change', function () {
            checkboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
            });
            updateAssignButtonVisibility();
        });

        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function () {
                const allChecked = Array.from(checkboxes).every(cb => cb.checked);
                const someChecked = Array.from(checkboxes).some(cb => cb.checked);

                if (selectAll) {
                    selectAll.checked = allChecked;
                    selectAll.indeterminate = someChecked && !allChecked;
                }

                updateAssignButtonVisibility();
            });
        });

        assignBtn.addEventListener('click', function () {
            const selectedTickets = Array.from(document.querySelectorAll('.ticket-checkbox:checked')).map(cb => {
                const row = cb.closest('tr');
                return {
                    id: cb.getAttribute('data-id'),
                    codigo: row.querySelector('.ticket-link').textContent.trim(),
                    categoria: row.querySelector('td:nth-child(8)').textContent.trim(),
                    titulo: row.querySelector('td:nth-child(4)').textContent.trim()
                };
            });

            if (selectedTickets.length === 0) {
                showErrorMessage('Por favor, seleccione al menos un ticket.');
                return;
            }

            openAssignTicketsModal(selectedTickets);
        });

        updateAssignButtonVisibility();
    }

    const searchInputSoportista = document.getElementById('soportistaSearchInput');
    if (searchInputSoportista) {
        searchInputSoportista.addEventListener('input', filterSoportistas);
        searchInputSoportista.addEventListener('focus', positionFloatingContainer);
    }

    const clearBtn = document.getElementById('clearSearchBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearSearch);
    }

    const confirmBtn = document.getElementById('confirmAssignBtn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', confirmAssignTicket);
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

    window.addEventListener('resize', positionFloatingContainer);

    function openAssignTicketsModal(selectedTickets) {
        const modalOverlay = document.getElementById('assignTicketsModalOverlay');
        if (!modalOverlay) {
            showErrorMessage('No se pudo abrir el modal de asignación.');
            return;
        }

        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        const ticketList = document.getElementById('ticketList');
        const ticketCountBadge = document.querySelectorAll('#ticketCountBadge');
        const ticketSummarySpan = document.querySelector('.ticket-summary-section .section-header span');

        if (ticketList && ticketCountBadge && ticketSummarySpan) {
            ticketList.innerHTML = '';
            selectedTickets.forEach(ticket => {
                const li = document.createElement('li');
                li.className = 'ticket-item';
                li.innerHTML = `
                    <span class="ticket-id">${ticket.codigo}</span> - 
                    <span class="ticket-category">${ticket.categoria}</span>: 
                    <span class="ticket-title">${ticket.titulo}</span>
                `;
                ticketList.appendChild(li);
            });

            const count = selectedTickets.length;
            ticketCountBadge.forEach(badge => badge.textContent = count);
            ticketSummarySpan.textContent = `Resumen de tickets (${count} ticket${count > 1 ? 's' : ''})`;
        }

        window.selectedTicketIds = selectedTickets.map(ticket => ticket.id);

        loadSoportistas();

        selectedSoportista = null;
        const searchInput = document.getElementById('soportistaSearchInput');
        if (searchInput)
            searchInput.value = '';

        const resultsContainer = document.getElementById('floatingResultsContainer');
        if (resultsContainer)
            resultsContainer.style.display = 'none';

        const confirmBtn = document.getElementById('confirmAssignBtn');
        if (confirmBtn)
            confirmBtn.disabled = true;
    }

    window.closeAssignTicketsModal = function () {
        const modalOverlay = document.getElementById('assignTicketsModalOverlay');
        if (modalOverlay) {
            modalOverlay.classList.remove('active');
            document.body.style.overflow = '';
            resetConfirmButton();
        }
    };

    function loadSoportistas() {
        const resultsContainer = document.getElementById('soportistasList');
        const loadingMessage = document.getElementById('loadingMessage');
        const errorMessage = document.getElementById('errorMessage');

        if (!resultsContainer || !loadingMessage || !errorMessage)
            return;

        loadingMessage.style.display = 'flex';
        errorMessage.style.display = 'none';
        resultsContainer.innerHTML = '';

        fetch('/tickets/usuarios/soportistas', {
            method: 'GET',
            headers: {'Content-Type': 'application/json'}
        })
                .then(response => response.json())
                .then(data => {
                    loadingMessage.style.display = 'none';
                    resultsContainer.innerHTML = '';

                    const usuarioActualId = document.getElementById('usuarioActualId')?.value;
                    const usuarioActualRol = document.getElementById('usuarioActualRol')?.value;

                    soportistasData = data.filter(soportista => {
                        if (soportista.id == usuarioActualId)
                            return false;

                        if (usuarioActualRol === 'ROL_SOPORTISTA') {
                            return soportista.rol === 'ROL_SOPORTISTA';
                        }

                        return true;
                    });

                    if (soportistasData.length === 0) {
                        resultsContainer.innerHTML = '<div class="no-results">No se encontraron colaboradores</div>';
                        return;
                    }

                    soportistasData.forEach(soportista => {
                        const div = document.createElement('div');
                        div.className = 'soportista-item';
                        div.setAttribute('data-id', soportista.id);

                        const rolClass = soportista.rol && soportista.rol.toLowerCase() === 'rol_administrador' ? 'administrador' : 'soportista';
                        const rolText = soportista.rol && soportista.rol.toLowerCase() === 'rol_administrador' ? 'ADMINISTRADOR' : 'SOPORTISTA';

                        const imagenUrl = soportista.imagen ? `/usuario/imagen/${soportista.id}` : '';

                        const avatarContent = soportista.imagen
                                ? `<img src="${imagenUrl}" alt="${soportista.nombreCompleto}" class="soportista-avatar-img" onerror="this.onerror=null; this.parentNode.innerHTML='<i class=\\'fas fa-user\\'></i>'">`
                                : `<i class="fas fa-user"></i>`;

                        div.innerHTML = `
                    <div class="soportista-avatar">
                        ${avatarContent}
                    </div>
                    <div class="soportista-info">
                        <div class="soportista-name">${soportista.nombreCompleto || soportista.nombre}</div>
                        <div class="soportista-id">ID: ${soportista.codigo || soportista.id}</div>
                    </div>
                `;

                        div.addEventListener('click', () => selectSoportista(soportista, div));
                        resultsContainer.appendChild(div);
                    });
                })
                .catch(error => {
                    loadingMessage.style.display = 'none';
                    errorMessage.style.display = 'block';
                    errorMessage.textContent = 'Error al cargar colaboradores: ' + error.message;
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

    function filterSoportistas() {
        const searchInput = document.getElementById('soportistaSearchInput');
        const searchTerm = searchInput.value.toLowerCase().trim();
        const resultsContainer = document.getElementById('floatingResultsContainer');
        const loadingMessage = document.getElementById('loadingMessage');
        const errorMessage = document.getElementById('errorMessage');
        const soportistasList = document.getElementById('soportistasList');

        if (searchTerm === '') {
            resultsContainer.style.display = 'none';
            return;
        }

        resultsContainer.style.display = 'block';
        positionFloatingContainer();

        if (soportistasData.length === 0) {
            if (loadingMessage)
                loadingMessage.style.display = 'flex';
            if (errorMessage)
                errorMessage.style.display = 'none';
            loadSoportistas();
        } else {
            const filteredSoportistas = soportistasData.filter(soportista => {
                const nombre = (soportista.nombreCompleto || '').toLowerCase();
                const codigo = (soportista.codigo || '').toLowerCase();
                const correo = (soportista.correo || '').toLowerCase();
                const rol = (soportista.rol || '').toLowerCase();

                return nombre.includes(searchTerm) ||
                        codigo.includes(searchTerm) ||
                        correo.includes(searchTerm) ||
                        rol.includes(searchTerm);
            });

            if (soportistasList) {
                soportistasList.innerHTML = '';

                if (filteredSoportistas.length === 0) {
                    soportistasList.innerHTML = '<div class="no-results">No se encontraron colaboradores</div>';
                    return;
                }

                filteredSoportistas.forEach(soportista => {
                    const div = document.createElement('div');
                    div.className = 'soportista-item';
                    div.setAttribute('data-id', soportista.id);

                    const rolClass = soportista.rol && soportista.rol.toLowerCase() === 'rol_administrador' ? 'administrador' : 'soportista';
                    const rolText = soportista.rol && soportista.rol.toLowerCase() === 'rol_administrador' ? 'ADMINISTRADOR' : 'SOPORTISTA';

                    const imagenUrl = soportista.imagen ? `/usuario/imagen/${soportista.id}` : '';

                    const avatarContent = soportista.imagen
                            ? `<img src="${imagenUrl}" alt="${soportista.nombreCompleto}" class="soportista-avatar-img" onerror="this.onerror=null; this.parentNode.innerHTML='<i class=\\'fas fa-user\\'></i>'">`
                            : `<i class="fas fa-user"></i>`;

                    div.innerHTML = `
                <div class="soportista-avatar">
                    ${avatarContent}
                </div>
                <div class="soportista-info">
                    <div class="soportista-name">${soportista.nombreCompleto || soportista.nombre}</div>
                    <div class="soportista-id">ID: ${soportista.codigo || soportista.id}</div>
                </div>
                <div class="soportista-role ${rolClass}">${rolText}</div>
            `;

                    div.addEventListener('click', () => selectSoportista(soportista, div));
                    soportistasList.appendChild(div);
                });
            }
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
            showErrorMessage('Por favor, seleccione un colaborador para asignar los tickets.');
            return;
        }

        const confirmBtn = document.getElementById('confirmAssignBtn');
        if (confirmBtn) {
            confirmBtn.disabled = true;
            confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Asignando...';
        }

        const ticketIds = window.selectedTicketIds || [];
        if (ticketIds.length === 0) {
            showErrorMessage('No se han seleccionado tickets para asignar.');
            resetConfirmButton();
            return;
        }

        const csrfToken = document.querySelector('input[name="_csrf"]').value;
        const data = {
            soportistaId: selectedSoportista.id,
            ticketIds: ticketIds
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
                    if (!response.ok) {
                        throw new Error('Error en la respuesta del servidor');
                    }
                    return response.json();
                })
                .then(result => {
                    if (result.success) {
                        closeAssignTicketsModal();
                        applyFiltersAsync();
                        showSuccessMessage(`Tickets asignados exitosamente a ${selectedSoportista.nombreCompleto}.`);
                    } else {
                        showErrorMessage(result.error || 'Error desconocido al asignar los tickets.');
                    }
                })
                .catch(error => {
                    showErrorMessage('Error de conexión al asignar los tickets. Por favor, intente nuevamente.');
                })
                .finally(() => {
                    resetConfirmButton();
                });
    }

    function resetConfirmButton() {
        const confirmBtn = document.getElementById('confirmAssignBtn');
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = 'Confirmar Asignación';
        }
    }

    function showSuccessMessage(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'notification success show';
        successDiv.textContent = message;
        document.body.appendChild(successDiv);
        setTimeout(() => successDiv.remove(), 5000);
    }

    const closeModalBtn = document.querySelector('.modal-close-btn, .close-modal-btn');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeAssignTicketsModal);
    }

    initializeAll();
    handleTableResize();
});