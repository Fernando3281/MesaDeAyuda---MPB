document.addEventListener('DOMContentLoaded', function () {
    // Variables globales
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

    // Estado de filtros
    let filterState = {
        globalSearch: '',
        columnFilters: {},
        isFilterActive: false,
        currentPage: 0,
        pageSize: 15,
        sortField: 'fechaApertura',
        sortDirection: 'desc'
    };

    // Crear indicador de carga
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

    // Mostrar/ocultar indicador de carga
    function showLoading() {
        loadingIndicator.style.display = 'block';
        tbody.style.opacity = '0.5';
    }

    function hideLoading() {
        loadingIndicator.style.display = 'none';
        tbody.style.opacity = '1';
    }

    // Función para verificar si el valor es "Sin Asignar"
    function isSinAsignar(value) {
        if (!value || typeof value !== 'string')
            return false;
        const normalizedValue = value.trim().toLowerCase();
        return normalizedValue === 'sin asignar';
    }

    // Función para calcular dinámicamente la posición del date-filter-popup
    function initializeDateFilters() {
        const dateFilters = document.querySelectorAll('.date-filter-dropdown');

        dateFilters.forEach(filter => {
            const container = filter.closest('.date-filter-container');
            const popup = container.querySelector('.date-filter-popup');
            const applyBtn = popup.querySelector('.date-filter-apply');

            filter.addEventListener('click', (e) => {
                e.stopPropagation();

                // Cerrar otros popups
                document.querySelectorAll('.date-filter-container').forEach(c => {
                    if (c !== container)
                        c.classList.remove('active');
                });

                // Alternar este popup
                container.classList.toggle('active');

                if (container.classList.contains('active')) {
                    // Calcular posición
                    const rect = filter.getBoundingClientRect();
                    const popupWidth = popup.offsetWidth;
                    const popupHeight = popup.offsetHeight;

                    // Determinar si es la última columna (Actualizado)
                    const isLastColumn = container.closest('th:nth-child(10)');

                    let left, top;

                    if (isLastColumn) {
                        // Posicionamiento especial para la columna "Actualizado"
                        const tableRect = table.getBoundingClientRect();
                        const tableRight = tableRect.right;
                        const windowWidth = window.innerWidth;

                        // Posicionar el popup alineado a la derecha de la tabla
                        left = Math.min(
                                tableRight - popupWidth,
                                windowWidth - popupWidth - 10
                                );

                        // Posición vertical
                        top = rect.bottom + window.scrollY;

                        // Ajustar si no hay espacio debajo
                        const spaceBelow = window.innerHeight - rect.bottom;
                        if (spaceBelow < popupHeight && rect.top > popupHeight) {
                            top = rect.top + window.scrollY - popupHeight - 2;
                        }
                    } else {
                        // Posicionamiento normal para otras columnas
                        left = rect.left;
                        top = rect.bottom + window.scrollY;

                        // Ajustar si se sale por la derecha
                        if (left + popupWidth > window.innerWidth) {
                            left = window.innerWidth - popupWidth - 10;
                        }

                        // Ajustar si se sale por abajo
                        const spaceBelow = window.innerHeight - rect.bottom;
                        if (spaceBelow < popupHeight && rect.top > popupHeight) {
                            top = rect.top + window.scrollY - popupHeight - 2;
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
        });

        // Cerrar al hacer clic fuera
        document.addEventListener('click', () => {
            document.querySelectorAll('.date-filter-container').forEach(c => {
                c.classList.remove('active');
            });
        });

        // Recalcular posición al redimensionar la ventana
        window.addEventListener('resize', () => {
            document.querySelectorAll('.date-filter-container.active').forEach(container => {
                const popup = container.querySelector('.date-filter-popup');
                const filter = container.querySelector('.date-filter-dropdown');

                if (popup && filter) {
                    const rect = filter.getBoundingClientRect();
                    const popupWidth = popup.offsetWidth;
                    const popupHeight = popup.offsetHeight;
                    const isLastColumn = container.closest('th:nth-child(10)');

                    let left, top;

                    if (isLastColumn) {
                        const tableRect = table.getBoundingClientRect();
                        const tableRight = tableRect.right;
                        const windowWidth = window.innerWidth;

                        left = Math.min(
                                tableRight - popupWidth,
                                windowWidth - popupWidth - 10
                                );
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
                            top = rect.top + window.scrollY - popupHeight - 2;
                        }
                    }

                    popup.style.left = `${left}px`;
                    popup.style.top = `${top}px`;
                }
            });
        });
    }

    // ======= Inicialización de filtros mejorada =======
    function initializeFilters() {
        // Ocultar fila de filtros al inicio
        let isFilterRowVisible = false;
        filterRow.style.display = "none";
        filterBtn.classList.remove('active');

        // Limpiar todos los inputs de filtros
        const filterInputs = filterRow.querySelectorAll('input[type="text"]');
        filterInputs.forEach(input => {
            input.value = '';
        });

        // Limpiar búsqueda global
        searchInput.value = '';

        // Limpiar filtros de fecha
        document.getElementById('dateFromApertura').value = '';
        document.getElementById('dateToApertura').value = '';
        document.getElementById('dateFromActualizado').value = '';
        document.getElementById('dateToActualizado').value = '';

        // Resetear estado de filtros (ignorando parámetros URL)
        filterState = {
            globalSearch: '',
            columnFilters: {},
            isFilterActive: false,
            currentPage: 0,
            pageSize: 15,
            sortField: 'fechaApertura',
            sortDirection: 'desc'
        };

        // Limpiar la URL si tiene parámetros
        if (window.location.search) {
            window.history.replaceState({}, '', window.location.pathname);
        }

        // Inicializar controles de fecha
        initializeDateFilters();

        // Establecer valor por defecto en selector de registros por página
        if (recordsSelect) {
            recordsSelect.value = filterState.pageSize;
        }

        // Toggle de filtros
        filterBtn.addEventListener("click", function() {
            isFilterRowVisible = !isFilterRowVisible;
            filterRow.style.display = isFilterRowVisible ? "table-header-group" : "none";
            filterBtn.classList.toggle('active', isFilterRowVisible);

            if (isFilterRowVisible) {
                setTimeout(() => {
                    const firstFilterInput = filterRow.querySelector('input');
                    if (firstFilterInput) {
                        firstFilterInput.focus();
                    }
                }, 100);
            }
        });

        // Limpiar filtros (botón)
        clearFiltersBtn.addEventListener("click", function() {
            // Limpiar inputs de texto
            filterInputs.forEach(input => {
                input.value = '';
            });

            // Limpiar filtros de fecha
            document.getElementById('dateFromApertura').value = '';
            document.getElementById('dateToApertura').value = '';
            document.getElementById('dateFromActualizado').value = '';
            document.getElementById('dateToActualizado').value = '';

            // Limpiar estado
            filterState.columnFilters = {};
            filterState.globalSearch = '';
            searchInput.value = '';
            filterState.isFilterActive = false;
            filterState.currentPage = 0;

            // Aplicar cambios
            applyFiltersAsync();
        });

        // Configurar eventos para filtros de columna
        filterInputs.forEach(input => {
            const columnName = input.getAttribute('data-column');

            input.addEventListener('input', debounce(() => {
                const value = input.value.trim();

                if (columnName === 'asignadoPara' && isSinAsignar(value)) {
                    filterState.columnFilters[columnName] = 'Sin Asignar';
                } else {
                    filterState.columnFilters[columnName] = value;
                }

                filterState.isFilterActive = hasActiveFilters();
                filterState.currentPage = 0;
                applyFiltersAsync();
            }, 300));
        });

        // Configurar búsqueda global
        searchInput.addEventListener('input', debounce(() => {
            filterState.globalSearch = searchInput.value;
            filterState.isFilterActive = hasActiveFilters();
            filterState.currentPage = 0;
            applyFiltersAsync();
        }, 300));

        // Configurar selector de registros por página
        recordsSelect.addEventListener('change', function() {
            // Validar que el tamaño de página no exceda el máximo permitido
            const selectedSize = parseInt(this.value);
            filterState.pageSize = Math.min(selectedSize, 1000); // Máximo 1000 registros
            filterState.currentPage = 0;
            applyFiltersAsync();
        });

        // Aplicar estado inicial limpio
        applyFiltersAsync();
    }

    // ======= Verificar si hay filtros activos =======
    function hasActiveFilters() {
        // Verificar búsqueda global
        if (filterState.globalSearch.length > 0)
            return true;

        // Verificar filtros de columna
        if (Object.values(filterState.columnFilters).some(filter => filter.length > 0))
            return true;

        // Verificar filtros de fecha
        if (document.getElementById('dateFromApertura').value)
            return true;
        if (document.getElementById('dateToApertura').value)
            return true;
        if (document.getElementById('dateFromActualizado').value)
            return true;
        if (document.getElementById('dateToActualizado').value)
            return true;

        return false;
    }

    // ======= Aplicar filtros de forma asíncrona =======
    async function applyFiltersAsync() {
        try {
            showLoading();

            // Validar que el tamaño de página no exceda el máximo permitido
            if (filterState.pageSize > 1000) {
                filterState.pageSize = 1000;
                if (recordsSelect) {
                    recordsSelect.value = '1000';
                }
            }

            // Construir parámetros para la petición
            const params = new URLSearchParams();
            params.set('page', filterState.currentPage.toString());
            params.set('size', filterState.pageSize.toString());

            // Asegurar que siempre se envíen los parámetros de ordenamiento
            params.set('sortField', filterState.sortField);
            params.set('sortDirection', filterState.sortDirection);

            console.log('Parámetros de ordenamiento enviados:', {
                sortField: filterState.sortField,
                sortDirection: filterState.sortDirection
            });

            // Agregar búsqueda global si existe
            if (filterState.globalSearch) {
                params.set('search', filterState.globalSearch);
            }

            // Agregar filtros de columnas
            Object.entries(filterState.columnFilters).forEach(([column, value]) => {
                if (value) {
                    // Manejo especial para "Sin Asignar"
                    if (column === 'asignadoPara' && isSinAsignar(value)) {
                        // Cambiar 'null' por 'Sin Asignar'
                        params.set(`filter_${column}`, 'Sin Asignar');
                    } else {
                        params.set(`filter_${column}`, value);
                    }
                }
            });

            // Agregar filtros de fecha
            const dateFromApertura = document.getElementById('dateFromApertura').value;
            const dateToApertura = document.getElementById('dateToApertura').value;
            if (dateFromApertura)
                params.set('filter_fechaAperturaFrom', dateFromApertura);
            if (dateToApertura)
                params.set('filter_fechaAperturaTo', dateToApertura);

            const dateFromActualizado = document.getElementById('dateFromActualizado').value;
            const dateToActualizado = document.getElementById('dateToActualizado').value;
            if (dateFromActualizado)
                params.set('filter_fechaActualizacionFrom', dateFromActualizado);
            if (dateToActualizado)
                params.set('filter_fechaActualizacionTo', dateToActualizado);

            // Realizar petición AJAX
            const response = await fetch(`/tickets/listado?${params.toString()}`, {
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

            // Actualizar contenido
            const newTbody = doc.querySelector('tbody');
            if (newTbody) {
                tbody.innerHTML = newTbody.innerHTML;
                initializeCheckboxEvents();
            }

            // Actualizar paginación
            const totalItemsMatch = html.match(/de\s+(\d+)\s+registros/);
            const totalItems = totalItemsMatch ? parseInt(totalItemsMatch[1]) : 0;
            updatePaginationInfo(totalItems);

            // Actualizar URL e iconos
            updateURL();
            updateSortIcons(filterState.sortField, filterState.sortDirection);

        } catch (error) {
            console.error('Error al aplicar filtros:', error);
            showErrorMessage('Error al cargar los datos. Por favor, intenta nuevamente.');
        } finally {
            hideLoading();
        }
    }

    // ======= Función para manejar clics en paginación =======
    function handlePaginationClick(newPage) {
        filterState.currentPage = newPage;
        applyFiltersAsync();
    }

    // ======= Actualizar información de paginación =======
    function updatePaginationInfo(totalItems) {
        if (!pageInfo)
            return;

        const start = totalItems === 0 ? 0 : filterState.currentPage * filterState.pageSize + 1;
        const end = Math.min((filterState.currentPage + 1) * filterState.pageSize, totalItems);

        pageInfo.textContent = `Mostrando ${start} a ${end} de ${totalItems} registros`;

        // Actualizar números de página
        if (pageNumbers) {
            const totalPages = Math.ceil(totalItems / filterState.pageSize);

            // Calcular el rango de páginas a mostrar, asegurando al menos 5 páginas si es posible
            let startPage, endPage;

            if (totalPages <= 5) {
                // Mostrar todas las páginas si hay 5 o menos
                startPage = 0;
                endPage = totalPages - 1;
            } else {
                // Mostrar 5 páginas alrededor de la página actual
                startPage = Math.max(0, filterState.currentPage - 2);
                endPage = Math.min(totalPages - 1, filterState.currentPage + 2);

                // Ajustar si estamos cerca del inicio o final
                if (filterState.currentPage < 3) {
                    endPage = 4;
                } else if (filterState.currentPage > totalPages - 4) {
                    startPage = totalPages - 5;
                }
            }

            pageNumbers.innerHTML = '';

            // Siempre mostrar al menos la página 1 si hay registros
            if (totalItems > 0) {
                // Si solo hay una página, mostrar solo la página 1
                if (totalPages <= 1) {
                    const pageBtn = document.createElement('button');
                    pageBtn.className = 'page-number active';
                    pageBtn.textContent = '1';
                    pageBtn.onclick = function () {
                        handlePaginationClick(0);
                    };
                    pageNumbers.appendChild(pageBtn);
                } else {
                    // Múltiples páginas: mostrar rango normal
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

    // ======= Actualizar URL sin recargar =======
    function updateURL() {
        const params = new URLSearchParams();
        params.set('page', filterState.currentPage.toString());
        params.set('size', filterState.pageSize.toString());

        // CRÍTICO: Siempre incluir parámetros de ordenamiento en la URL
        params.set('sortField', filterState.sortField);
        params.set('sortDirection', filterState.sortDirection);

        if (filterState.globalSearch) {
            params.set('search', filterState.globalSearch);
        }

        Object.entries(filterState.columnFilters).forEach(([column, value]) => {
            if (value) {
                if (column === 'asignadoPara' && isSinAsignar(value)) {
                    // Cambiar 'null' por 'Sin Asignar'
                    params.set(`filter_${column}`, 'Sin Asignar');
                } else {
                    params.set(`filter_${column}`, value);
                }
            }
        });

        // Agregar filtros de fecha para Apertura
        const dateFromApertura = document.getElementById('dateFromApertura').value;
        const dateToApertura = document.getElementById('dateToApertura').value;

        if (dateFromApertura) {
            params.set('filter_fechaAperturaFrom', dateFromApertura);
        }
        if (dateToApertura) {
            params.set('filter_fechaAperturaTo', dateToApertura);
        }

        // Agregar filtros de fecha para Actualizado
        const dateFromActualizado = document.getElementById('dateFromActualizado').value;
        const dateToActualizado = document.getElementById('dateToActualizado').value;

        if (dateFromActualizado) {
            params.set('filter_fechaActualizacionFrom', dateFromActualizado);
        }
        if (dateToActualizado) {
            params.set('filter_fechaActualizacionTo', dateToActualizado);
        }

        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState({}, '', newUrl);
    }

    // ======= Inicializar eventos de checkboxes =======
    function initializeCheckboxEvents() {
        const selectAll = document.getElementById('selectAll');
        const checkboxes = document.querySelectorAll('.ticket-checkbox');

        if (selectAll) {
            selectAll.addEventListener('change', function () {
                checkboxes.forEach(checkbox => {
                    checkbox.checked = this.checked;
                });
            });
        }

        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function () {
                const allChecked = Array.from(checkboxes).every(cb => cb.checked);
                const someChecked = Array.from(checkboxes).some(cb => cb.checked);

                if (selectAll) {
                    selectAll.checked = allChecked;
                    selectAll.indeterminate = someChecked && !allChecked;
                }
            });
        });
    }

    // ======= Mostrar mensaje de error =======
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

    // ======= Función debounce =======
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

    // ======= Configurar ordenamiento mejorado =======
    function initializeSorting() {
        const sortIcons = document.querySelectorAll('.sort-icon');

        sortIcons.forEach(icon => {
            // Remover listeners anteriores para evitar duplicados
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

        console.log('Ordenamiento solicitado para:', columnName);

        // Determinar nueva dirección
        if (filterState.sortField === columnName) {
            filterState.sortDirection = filterState.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            filterState.sortField = columnName;
            filterState.sortDirection = 'desc'; // Por defecto descendente para fechas
        }

        // Resetear a primera página
        filterState.currentPage = 0;

        console.log('Nuevo estado de ordenamiento:', {
            sortField: filterState.sortField,
            sortDirection: filterState.sortDirection
        });

        applyFiltersAsync();
    }

    // ======= Función separada para manejar clics de ordenamiento =======
    function handleSortClick(e) {
        e.preventDefault();
        e.stopPropagation();

        const columnName = this.getAttribute('data-column');

        if (!columnName) {
            console.warn('Columna no especificada para ordenamiento');
            return;
        }

        console.log('Clic en ordenamiento:', {
            columna: columnName,
            estadoActual: filterState.sortField,
            direccionActual: filterState.sortDirection
        });

        // Cambiar dirección si es la misma columna
        if (filterState.sortField === columnName) {
            filterState.sortDirection = filterState.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            filterState.sortField = columnName;
            filterState.sortDirection = 'asc'; // Por defecto ascendente al cambiar de columna
        }

        // Resetear a la primera página al cambiar ordenamiento
        filterState.currentPage = 0;

        console.log('Nuevo estado de ordenamiento:', {
            sortField: filterState.sortField,
            sortDirection: filterState.sortDirection
        });

        // Aplicar filtros con el nuevo ordenamiento
        applyFiltersAsync();
    }

    // ======= Actualizar iconos de ordenamiento mejorado =======
    function updateSortIcons(activeColumn, direction) {
        const sortIcons = document.querySelectorAll('.sort-icon');

        console.log('Actualizando iconos de ordenamiento:', {
            activeColumn: activeColumn,
            direction: direction,
            totalIcons: sortIcons.length
        });

        sortIcons.forEach(icon => {
            const iconColumn = icon.getAttribute('data-column');

            // Resetear a icono neutro
            icon.className = 'fas fa-sort sort-icon';

            // Aplicar clase activa si es la columna actual
            if (iconColumn === activeColumn) {
                icon.className = direction === 'asc'
                        ? 'fas fa-sort-up sort-icon active'
                        : 'fas fa-sort-down sort-icon active';

                console.log(`Icono actualizado para columna ${iconColumn}:`, {
                    direction: direction,
                    className: icon.className
                });
            }
        });
    }

    // ======= Función para reinicializar eventos después de actualizar contenido =======
    function reinitializeEvents() {
        // Reinicializar eventos de checkboxes
        initializeCheckboxEvents();

        // Reinicializar eventos de ordenamiento
        initializeSorting();
    }

    // ======= Función para manejar estados de carga =======
    function setLoadingState(isLoading) {
        if (isLoading) {
            showLoading();
            // Deshabilitar controles durante la carga
            if (filterBtn)
                filterBtn.disabled = true;
            if (clearFiltersBtn)
                clearFiltersBtn.disabled = true;
            if (recordsSelect)
                recordsSelect.disabled = true;
        } else {
            hideLoading();
            // Rehabilitar controles
            if (filterBtn)
                filterBtn.disabled = false;
            if (clearFiltersBtn)
                clearFiltersBtn.disabled = false;
            if (recordsSelect)
                recordsSelect.disabled = false;
        }
    }

    // ======= Función para obtener el estado actual de filtros =======
    function getCurrentFilterState() {
        return {
            globalSearch: filterState.globalSearch,
            columnFilters: {...filterState.columnFilters},
            currentPage: filterState.currentPage,
            pageSize: filterState.pageSize,
            sortField: filterState.sortField,
            sortDirection: filterState.sortDirection,
            isFilterActive: filterState.isFilterActive
        };
    }

    // ======= Inicializar todo =======
    initializeFilters();
    initializeSorting();
    initializeCheckboxEvents();

    // Configurar indicadores de ordenamiento inicial
    updateSortIcons(filterState.sortField, filterState.sortDirection);

    // Actualizar paginación basada en el total de elementos
    const totalItemsElement = document.querySelector('[th\\:text*="totalItems"]');
    if (totalItemsElement) {
        const totalItemsText = totalItemsElement.textContent;
        const totalItemsMatch = totalItemsText.match(/\d+/);
        if (totalItemsMatch) {
            const totalItems = parseInt(totalItemsMatch[0]);
            updatePaginationInfo(totalItems);
        }
    }

    // Manejar eventos de navegación del navegador (back/forward)
    window.addEventListener('popstate', function (event) {
        if (event.state && event.state.filterState) {
            filterState = event.state.filterState;
            applyFiltersAsync();
        }
    });

    // Exponer funciones útiles globalmente para debugging
    window.ticketTableDebug = {
        getFilterState: getCurrentFilterState,
        applyFilters: applyFiltersAsync,
        updateSortIcons: updateSortIcons
    };
});