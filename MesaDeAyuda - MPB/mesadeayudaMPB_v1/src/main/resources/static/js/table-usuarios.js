document.addEventListener("DOMContentLoaded", function () {
    // Configuración inicial de la tabla
    const table = document.querySelector('.tickets-table');
    const tableContainer = document.querySelector('.table-container');
    const sidebar = document.querySelector('.sidebar');
    // Anchos por defecto de las columnas
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
    // Eliminar estas líneas (si existen):
    function saveColumnWidths(widths) {
        localStorage.setItem('usersTableColumnWidths', JSON.stringify(widths));
    }

// Y modificar la función getColumnWidths para que siempre devuelva los anchos por defecto:
    function getColumnWidths() {
        return defaultColumnWidths; // Siempre devuelve los anchos por defecto
    }

    // Obtener los anchos actuales
    let currentColumnWidths = getColumnWidths();
    // Ajustar el ancho de la tabla y las columnas
    function adjustTableWidth() {
        if (!table || !tableContainer)
            return;

        requestAnimationFrame(() => {
            // Resetear siempre a los anchos por defecto
            currentColumnWidths = [...defaultColumnWidths];

            const containerWidth = tableContainer.offsetWidth;
            const totalColumnsWidth = currentColumnWidths.reduce((a, b) => a + b, 0);

            // Ajustar el ancho de la tabla
            table.style.width = containerWidth >= totalColumnsWidth
                    ? `${containerWidth}px`
                    : `${totalColumnsWidth}px`;

            // Aplicar los anchos por defecto a todas las columnas
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

    // Variables para el redimensionamiento
    let isResizing = false;
    let currentResizer = null;
    let startX, startWidth;
    // Función de redimensionamiento
    function resize(e) {
        if (!isResizing)
            return;
        const th = currentResizer.closest('th');
        const delta = e.pageX - startX;
        const columnIndex = Array.from(th.parentElement.children).indexOf(th);
        // Calcular el nuevo ancho con límite mínimo
        let newWidth = Math.max(70, startWidth + delta);
        // Actualizar el ancho en el array de anchos actuales
        currentColumnWidths[columnIndex] = newWidth;
        // Aplicar el nuevo ancho a todas las columnas
        const allThCells = table.querySelectorAll(`thead tr:first-child th:nth-child(${columnIndex + 1})`);
        const allTdCells = table.querySelectorAll(`tbody tr td:nth-child(${columnIndex + 1})`);
        allThCells.forEach(cell => {
            cell.style.width = `${newWidth}px`;
        });
        allTdCells.forEach(cell => {
            cell.style.width = `${newWidth}px`;
        });
    }

    // Función para detener el redimensionamiento
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
        // Guardar los nuevos anchos
        saveColumnWidths(currentColumnWidths);
    }

    // Inicializar el redimensionamiento
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

    // Configurar los resizers
    function setupResizers() {
        const resizers = table?.querySelectorAll('.resizer');
        if (!resizers)
            return;
        resizers.forEach(resizer => {
            resizer.addEventListener('mousedown', initResize);
        });
    }

    // Crear elementos resizer dinámicamente
    function createResizers() {
        const headers = table?.querySelectorAll('thead tr:first-child th');
        if (!headers)
            return;
        headers.forEach(header => {
            // Verificar si ya existe un resizer
            if (!header.querySelector('.resizer')) {
                const resizer = document.createElement('div');
                resizer.className = 'resizer';
                header.appendChild(resizer);
            }
        });
        setupResizers();
    }

    // Observar cambios en el sidebar
    if (sidebar) {
        const observer = new MutationObserver(adjustTableWidth);
        observer.observe(sidebar, {
            attributes: true,
            attributeFilter: ['class']
        });
    }

    // Optimizar el resize de la ventana
    let resizeTimeout;
    window.addEventListener('resize', () => {
        if (resizeTimeout) {
            cancelAnimationFrame(resizeTimeout);
        }
        resizeTimeout = requestAnimationFrame(adjustTableWidth);
    });
    // Fijar el search bar al hacer scroll (si existe)
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

    // NUEVO: Implementación de ordenamiento de la tabla
    function initSorting() {
        const headers = table?.querySelectorAll('thead th');
        if (!headers)
            return;

        const sortState = {
            column: null,
            direction: 'asc'
        };

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

                // Mantener los anchos después de ordenar
                adjustTableWidth();
            });
        });

        // Inicializar con la última conexión en orden descendente
        const lastConnectionIndex = 9; // Ajustado por la nueva columna
        sortState.column = lastConnectionIndex;
        sortState.direction = 'desc';
        updateSortIcons(sortState.column, sortState.direction);
        sortTable(lastConnectionIndex, sortState.direction);
    }

    // Función para actualizar los iconos de ordenamiento
    function updateSortIcons(activeColumn, direction) {
        const headers = table?.querySelectorAll('thead th');
        if (!headers)
            return;
        headers.forEach((header, index) => {
            const sortIcon = header.querySelector('.sort-icons i');
            if (!sortIcon)
                return;
            if (index === activeColumn) {
                // Actualizar el icono activo con dirección correcta
                sortIcon.className = direction === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
            } else {
                // Restablecer otros iconos al estado neutral
                sortIcon.className = 'fas fa-sort';
            }
        });
    }

    // Función para ordenar la tabla
    function sortTable(columnIndex, direction) {
        const tbody = table?.querySelector('tbody');
        if (!tbody || tbody.querySelectorAll('tr').length <= 1)
            return;
        const rows = Array.from(tbody.querySelectorAll('tr:not([colspan])')); // Excluir filas de "no hay datos"
        if (rows.length === 0)
            return;
        // Guardar primero si hay una fila de "No hay usuarios registrados"
        const emptyRow = tbody.querySelector('tr[colspan]');
        // Función para comparar valores de celdas
        const compareCells = (rowA, rowB) => {
            const cellA = rowA.querySelector(`td:nth-child(${columnIndex + 1})`);
            const cellB = rowB.querySelector(`td:nth-child(${columnIndex + 1})`);
            if (!cellA || !cellB)
                return 0;
            let valueA = cellA.textContent.trim();
            let valueB = cellB.textContent.trim();
            // Tratamiento especial para la columna de fecha (conversión a objeto Date)
            if (columnIndex === 8) { // Índice de "Última Conexión"
                // Si contiene "Sin conexión", tratar como fecha mínima
                if (valueA === 'Sin conexión')
                    valueA = '01/01/1970 00:00';
                if (valueB === 'Sin conexión')
                    valueB = '01/01/1970 00:00';
                // Convertir formato DD/MM/YYYY HH:MM a objeto Date
                const partsA = valueA.split(' ');
                const partsB = valueB.split(' ');
                if (partsA.length === 2 && partsB.length === 2) {
                    const dateA = partsA[0].split('/').reverse().join('-') + 'T' + partsA[1];
                    const dateB = partsB[0].split('/').reverse().join('-') + 'T' + partsB[1];
                    return direction === 'asc'
                            ? new Date(dateA) - new Date(dateB)
                            : new Date(dateB) - new Date(dateA);
                }
            }

            // Para columnas numéricas, intentar convertir a número
            if (!isNaN(parseFloat(valueA)) && !isNaN(parseFloat(valueB))) {
                return direction === 'asc'
                        ? parseFloat(valueA) - parseFloat(valueB)
                        : parseFloat(valueB) - parseFloat(valueA);
            }

            // Ordenamiento alfanumérico por defecto
            return direction === 'asc'
                    ? valueA.localeCompare(valueB)
                    : valueB.localeCompare(valueA);
        };
        // Ordenar las filas
        rows.sort(compareCells);
        // Volver a agregar las filas en el nuevo orden
        tbody.innerHTML = '';
        rows.forEach(row => tbody.appendChild(row));
        // Volver a agregar la fila vacía si existía
        if (emptyRow) {
            tbody.appendChild(emptyRow);
        }
    }

    // Inicialización completa
    if (table) {
        createResizers();
        adjustTableWidth();
        initSorting(); // Inicializar la funcionalidad de ordenamiento
    } else {
        console.warn('No se encontró la tabla');
    }

    // Configuración del selector de registros por página
    const recordsPerPage = document.getElementById('recordsPerPage');
    if (recordsPerPage) {
        recordsPerPage.addEventListener('change', function () {
            const size = this.value;
            window.location.href = `${window.location.pathname}?page=0&size=${size}`;
        });
    }
});