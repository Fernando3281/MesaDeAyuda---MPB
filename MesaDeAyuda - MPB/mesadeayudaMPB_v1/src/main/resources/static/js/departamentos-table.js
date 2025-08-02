function handleTableResize() {
    const table = document.querySelector('.table-resizable');
    const tableContainer = document.querySelector('.table-container');
    const sidebar = document.querySelector('.sidebar');

    const defaultColumnWidths = [
        40,
        200,
        300,
        120
    ];

    function getColumnWidths() {
        if (window.performance && window.performance.navigation.type === window.performance.navigation.TYPE_RELOAD) {
            localStorage.removeItem('tableColumnWidths');
            return defaultColumnWidths;
        }
        
        const savedWidths = localStorage.getItem('tableColumnWidths');
        return savedWidths ? JSON.parse(savedWidths) : defaultColumnWidths;
    }

    function saveColumnWidths(widths) {
        localStorage.setItem('tableColumnWidths', JSON.stringify(widths));
    }

    let currentColumnWidths = getColumnWidths();

    function adjustTableWidth() {
        if (!table || !tableContainer)
            return;

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

    function resize(e) {
        if (!isResizing)
            return;

        const th = currentResizer.parentElement;
        const delta = e.pageX - startX;
        const columnIndex = th.cellIndex;

        if (columnIndex === 0)
            return;

        let newWidth = Math.max(80, startWidth + delta);

        currentColumnWidths[columnIndex] = newWidth;

        th.style.width = `${newWidth}px`;

        const cells = table.querySelectorAll(
                `thead tr:first-child th:nth-child(${columnIndex + 1}), 
         tbody td:nth-child(${columnIndex + 1})`
                );

        cells.forEach(cell => {
            cell.style.width = `${newWidth}px`;
        });
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

        saveColumnWidths(currentColumnWidths);
    }

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

    const resizers = table.querySelectorAll('.resizer');
    resizers.forEach((resizer, index) => {
        if (index === 0)
            return;
        resizer.addEventListener('mousedown', initResize);
    });

    const observer = new MutationObserver(adjustTableWidth);
    if (sidebar) {
        observer.observe(sidebar, {
            attributes: true,
            attributeFilter: ['class']
        });
    }

    const sidebarToggleBtn = document.querySelector('.sidebar-toggle');
    if (sidebarToggleBtn) {
        sidebarToggleBtn.addEventListener('click', adjustTableWidth);
    }

    const mobileToggleBtn = document.querySelector('.mobile-toggle');
    if (mobileToggleBtn) {
        mobileToggleBtn.addEventListener('click', adjustTableWidth);
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

function handleVisibilityToggle() {
    const toggles = document.querySelectorAll('.toggle-visibilidad');
    
    const csrfToken = document.querySelector('meta[name="_csrf"]')?.content || 
                     document.querySelector('input[name="_csrf"]')?.value || 
                     '';
    
    toggles.forEach(toggle => {
        toggle.addEventListener('change', async function() {
            const id = this.getAttribute('data-id');
            const isVisible = this.checked;
            
            try {
                const response = await fetch(`/departamento/toggle-visibilidad/${id}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': csrfToken
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                
                if (!data.success) {
                    this.checked = !isVisible;
                }
            } catch (error) {
                this.checked = !isVisible;
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', function() {
    handleTableResize();
    handleVisibilityToggle();
});