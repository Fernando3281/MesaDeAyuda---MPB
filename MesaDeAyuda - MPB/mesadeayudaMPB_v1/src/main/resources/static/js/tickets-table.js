//tickets-table.js
function handleTableResize() {
    const table = document.querySelector('.table-resizable');
    const tableContainer = document.querySelector('.table-container');
    const sidebar = document.querySelector('.sidebar');

    // Anchos por defecto de las columnas
    const defaultColumnWidths = [
        40, // Checkbox
        120, // Código
        100, // Apertura
        300, // Breve Descripción
        120, // Solicitante
        100, // Prioridad
        100, // Estado
        100, // Categoría
        120, // Asignado para
        100  // Actualizado
    ];

    // Función para obtener los anchos guardados o usar los por defecto
    function getColumnWidths() {
        // Al cargar la página, limpiar los anchos guardados
        if (window.performance && window.performance.navigation.type === window.performance.navigation.TYPE_RELOAD) {
            localStorage.removeItem('tableColumnWidths');
            return defaultColumnWidths;
        }
        
        const savedWidths = localStorage.getItem('tableColumnWidths');
        return savedWidths ? JSON.parse(savedWidths) : defaultColumnWidths;
    }

    // Función para guardar los anchos de las columnas
    function saveColumnWidths(widths) {
        localStorage.setItem('tableColumnWidths', JSON.stringify(widths));
    }

    // Obtener los anchos actuales
    let currentColumnWidths = getColumnWidths();

    function adjustTableWidth() {
        if (!table || !tableContainer)
            return;

        requestAnimationFrame(() => {
            const containerWidth = tableContainer.offsetWidth;
            const totalColumnsWidth = currentColumnWidths.reduce((a, b) => a + b, 0);

            // Ajustar el ancho de la tabla
            table.style.width = containerWidth >= totalColumnsWidth
                    ? `${containerWidth}px`
                    : `${totalColumnsWidth}px`;

            // Aplicar los anchos guardados a todas las columnas
            const columns = table.querySelectorAll('tr');
            columns.forEach(row => {
                const cells = row.children;
                for (let i = 0; i < cells.length; i++) {
                    if (i < currentColumnWidths.length) {
                        cells[i].style.width = `${currentColumnWidths[i]}px`;
                    }
                }
            });
        });
    }

    // Función modificada de redimensionamiento
    function resize(e) {
        if (!isResizing)
            return;

        const th = currentResizer.parentElement;
        const delta = e.pageX - startX;
        const columnIndex = th.cellIndex;

        // No permitir redimensionar la columna del checkbox
        if (columnIndex === 0)
            return;

        // Calcular el nuevo ancho con límite mínimo
        let newWidth = Math.max(80, startWidth + delta);

        // Actualizar el ancho en el array de anchos actuales
        currentColumnWidths[columnIndex] = newWidth;

        // Aplicar el nuevo ancho a todas las columnas (incluyendo el #filterRow)
        th.style.width = `${newWidth}px`;

        const cells = table.querySelectorAll(
                `thead tr:first-child th:nth-child(${columnIndex + 1}), 
         thead tr#filterRow th:nth-child(${columnIndex + 1}), 
         tbody td:nth-child(${columnIndex + 1})`
                );

        cells.forEach(cell => {
            cell.style.width = `${newWidth}px`;
        });
    }


    // Función modificada para detener el redimensionamiento
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
    let isResizing = false;
    let currentResizer = null;
    let startX, startWidth;
    
    

    function initResize(e) {
        isResizing = true;
        currentResizer = e.target;
        const th = currentResizer.parentElement;

        startX = e.pageX;
        startWidth = th.offsetWidth;

        currentResizer.classList.add('active');
        document.body.style.cursor = 'col-resize';
        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stopResize);
        document.body.style.userSelect = 'none';
        table.classList.add('resizing');
    }

    // Configurar los resizers
    const resizers = table.querySelectorAll('.resizer');
    resizers.forEach((resizer, index) => {
        if (index === 0)
            return; // Evitar que la columna del checkbox sea redimensionable
        resizer.addEventListener('mousedown', initResize);
    });

    // Observar cambios en el sidebar
    const observer = new MutationObserver(adjustTableWidth);
    if (sidebar) {
        observer.observe(sidebar, {
            attributes: true,
            attributeFilter: ['class']
        });
    }

    // Event listeners para los botones de toggle
    const sidebarToggleBtn = document.querySelector('.sidebar-toggle');
    if (sidebarToggleBtn) {
        sidebarToggleBtn.addEventListener('click', adjustTableWidth);
    }

    const mobileToggleBtn = document.querySelector('.mobile-toggle');
    if (mobileToggleBtn) {
        mobileToggleBtn.addEventListener('click', adjustTableWidth);
    }

    // Optimizar el resize de la ventana
    let resizeTimeout;
    window.addEventListener('resize', () => {
        if (resizeTimeout) {
            cancelAnimationFrame(resizeTimeout);
        }
        resizeTimeout = requestAnimationFrame(adjustTableWidth);
    });

    // Ajuste inicial
    adjustTableWidth();
}

// Inicializar cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', handleTableResize);




////////////////////////////




//codigo1

document.addEventListener("DOMContentLoaded", function () {
    const searchSection = document.querySelector(".search-section");
    const tableContainer = document.querySelector(".table-container");
    const mainContent = document.querySelector(".content-wrapper");

    const offsetTop = searchSection.offsetTop; // Posición inicial del search bar

    window.addEventListener("scroll", function () {
        const scrollTop = window.scrollY;

        if (scrollTop >= offsetTop) {
            // Fija el search bar en la parte superior
            searchSection.classList.add("fixed");
            tableContainer.style.marginTop = `${searchSection.offsetHeight}px`; // Evita solapamiento
        } else {
            // Restaura el comportamiento normal
            searchSection.classList.remove("fixed");
            tableContainer.style.marginTop = "0";
        }
    });
});



function adjustTableWidth() {
    if (!table || !tableContainer) return;

    requestAnimationFrame(() => {
        const containerWidth = tableContainer.offsetWidth;
        const totalColumnsWidth = currentColumnWidths.reduce((a, b) => a + b, 0);

        table.style.width = containerWidth >= totalColumnsWidth
            ? `${containerWidth}px`
            : `${totalColumnsWidth}px`;

        const rows = table.querySelectorAll('thead tr, tbody tr');
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


document.addEventListener("DOMContentLoaded", function() {
    // Configuración del ordenamiento
    const table = document.querySelector('.tickets-table');
    const sortIcons = document.querySelectorAll('.sort-icon');
    let currentSort = {
        column: null,
        direction: 'asc' // 'asc' o 'desc'
    };

    // Función para actualizar los iconos de ordenamiento
    function updateSortIcons(activeColumn, direction) {
        sortIcons.forEach(icon => {
            icon.className = 'fas fa-sort sort-icon';
            if (icon.getAttribute('data-column') === activeColumn) {
                icon.className = direction === 'asc' 
                    ? 'fas fa-sort-up sort-icon' 
                    : 'fas fa-sort-down sort-icon';
            }
        });
    }

    // Función para ordenar la tabla
    function sortTable(columnName, direction) {
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr:not([colspan])'));
        
        if (rows.length === 0) return;

        rows.sort((rowA, rowB) => {
            let valueA, valueB;
            const cellA = getCellValue(rowA, columnName);
            const cellB = getCellValue(rowB, columnName);

            // Manejo especial para fechas
            if (columnName === 'fechaApertura' || columnName === 'fechaActualizacion') {
                const dateA = parseDate(cellA);
                const dateB = parseDate(cellB);
                return direction === 'asc' ? dateA - dateB : dateB - dateA;
            }

            // Ordenamiento alfanumérico por defecto
            return direction === 'asc' 
                ? cellA.localeCompare(cellB) 
                : cellB.localeCompare(cellA);
        });

        // Reconstruir la tabla
        tbody.innerHTML = '';
        rows.forEach(row => tbody.appendChild(row));
        
        // Actualizar el estado de ordenamiento
        currentSort.column = columnName;
        currentSort.direction = direction;
        updateSortIcons(columnName, direction);
    }

    // Función auxiliar para obtener el valor de una celda basado en el nombre de la columna
    function getCellValue(row, columnName) {
        const cells = row.querySelectorAll('td');
        switch(columnName) {
            case 'codigo':
                return cells[1].textContent.trim();
            case 'fechaApertura':
                return cells[2].textContent.trim();
            case 'titulo':
                return cells[3].textContent.trim();
            case 'solicitante':
                return cells[4].textContent.trim();
            case 'prioridad':
                return cells[5].textContent.trim();
            case 'estado':
                return cells[6].textContent.trim();
            case 'categoria':
                return cells[7].textContent.trim();
            case 'asignadoPara':
                return cells[8].textContent.trim();
            case 'fechaActualizacion':
                return cells[9].textContent.trim();
            default:
                return '';
        }
    }

    // Función para parsear fechas en formato dd/MM/yyyy
    function parseDate(dateStr) {
        if (!dateStr) return new Date(0);
        
        // Separar fecha y hora si existen
        const parts = dateStr.split('\n');
        const datePart = parts[0].trim();
        
        const [day, month, year] = datePart.split('/');
        return new Date(year, month - 1, day);
    }

    // Event listeners para los iconos de ordenamiento
    sortIcons.forEach(icon => {
        icon.addEventListener('click', function() {
            const columnName = this.getAttribute('data-column');
            
            // Determinar la dirección del ordenamiento
            let direction = 'asc';
            if (currentSort.column === columnName) {
                direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
            }
            
            sortTable(columnName, direction);
        });
    });

    // Orden inicial por fecha de apertura descendente
    sortTable('fechaApertura', 'desc');
});