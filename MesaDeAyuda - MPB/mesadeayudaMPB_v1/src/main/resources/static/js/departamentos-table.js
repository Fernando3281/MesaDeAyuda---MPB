function handleTableResize() {
    const table = document.querySelector('.table-resizable');
    const tableContainer = document.querySelector('.table-container');
    const sidebar = document.querySelector('.sidebar');

    // Anchos por defecto de las columnas
    const defaultColumnWidths = [
        40, // Checkbox
        200, // Nombre
        300, // Descripción
        120  // Acciones
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

        // Aplicar el nuevo ancho a todas las columnas
        th.style.width = `${newWidth}px`;

        const cells = table.querySelectorAll(
                `thead tr:first-child th:nth-child(${columnIndex + 1}), 
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