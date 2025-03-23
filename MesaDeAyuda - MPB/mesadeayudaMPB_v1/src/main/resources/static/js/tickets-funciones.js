document.addEventListener('DOMContentLoaded', function () {
    // ======= Export Functionality =======
    const exportBtn = document.getElementById('exportBtn');
    const exportMenu = document.getElementById('exportMenu');
    const selectAllCheckbox = document.getElementById('selectAll');
    const rowCheckboxes = document.querySelectorAll('tbody .checkbox-custom');

    // Show/hide export menu
    exportBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        exportMenu.classList.toggle('show');
    });

    // Close menu when clicking outside
    document.addEventListener('click', function (e) {
        if (!exportMenu.contains(e.target) && !exportBtn.contains(e.target)) {
            exportMenu.classList.remove('show');
        }
    });

    // Get data to export
    function getDataToExport() {
        const rows = document.querySelectorAll('tbody tr');
        const selectedData = [];
        let anyCheckboxChecked = false;

        rows.forEach(row => {
            const checkbox = row.querySelector('.checkbox-custom');
            if (!checkbox.checked && selectAllCheckbox.checked) {
                anyCheckboxChecked = true;
            }
            if (checkbox.checked || !anyCheckboxChecked) {
                const rowData = {
                    codigo: row.cells[1].textContent.trim(),
                    apertura: row.cells[2].textContent.trim(),
                    descripcion: row.cells[3].textContent.trim(),
                    solicitante: row.cells[4].textContent.trim(),
                    prioridad: row.cells[5].textContent.trim(),
                    estado: row.cells[6].textContent.trim(),
                    categoria: row.cells[7].textContent.trim(),
                    asignado: row.cells[8].textContent.trim(),
                    actualizado: row.cells[9].textContent.trim()
                };
                selectedData.push(rowData);
            }
        });

        return selectedData;
    }

    // Show notifications
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    // Export format handlers
    document.querySelectorAll('.export-item').forEach(item => {
        item.addEventListener('click', function () {
            const format = this.dataset.format;
            const data = getDataToExport();

            if (data.length === 0) {
                showNotification('No hay datos para exportar', 'error');
                return;
            }

            const spinner = document.createElement('span');
            spinner.className = 'loading-spinner';
            exportBtn.prepend(spinner);
            exportBtn.disabled = true;

            try {
                switch (format) {
                    case 'json':
                        downloadFile(JSON.stringify(data, null, 2), 'tickets.json', 'application/json');
                        break;
                    case 'xml':
                        downloadFile(generateXML(data), 'tickets.xml', 'application/xml');
                        break;
                    case 'csv':
                        downloadFile(generateCSV(data), 'tickets.csv', 'text/csv');
                        break;
                    case 'txt':
                        downloadFile(generateTXT(data), 'tickets.txt', 'text/plain');
                        break;
                    case 'sql':
                        downloadFile(generateSQL(data), 'tickets.sql', 'application/sql');
                        break;
                    case 'excel':
                        generateExcel(data);
                        break;
                }

                showNotification(`Exportación a ${format.toUpperCase()} completada con éxito`);
            } catch (error) {
                showNotification('Error al exportar los datos', 'error');
                console.error('Error en la exportación:', error);
            } finally {
                spinner.remove();
                exportBtn.disabled = false;
                exportMenu.classList.remove('show');
            }
        });
    });

    // Download file helper
    function downloadFile(content, fileName, mimeType) {
        const blob = new Blob([content], {type: mimeType});
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }

    // Format generation functions
    function generateXML(data) {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<tickets>\n';
        data.forEach(item => {
            xml += '  <ticket>\n';
            for (const [key, value] of Object.entries(item)) {
                xml += `    <${key}>${value}</${key}>\n`;
            }
            xml += '  </ticket>\n';
        });
        xml += '</tickets>';
        return xml;
    }

    function generateCSV(data) {
        const headers = Object.keys(data[0]);
        return [
            headers.join(','),
            ...data.map(row => headers.map(header => JSON.stringify(row[header])).join(','))
        ].join('\n');
    }

    function generateTXT(data) {
        return data.map(item =>
            Object.entries(item)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join('\n')
        ).join('\n\n');
    }

    function generateSQL(data) {
        let sql = 'INSERT INTO tickets (codigo, apertura, descripcion, solicitante, prioridad, estado, categoria, asignado, actualizado) VALUES\n';
        sql += data.map(item =>
                `(${Object.values(item).map(value => `'${value.replace(/'/g, "''")}'`).join(', ')})`
        ).join(',\n');
        sql += ';';
        return sql;
    }

    function generateExcel(data) {
        const csv = generateCSV(data);
        downloadFile(csv, 'tickets.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }

    // ======= Checkbox Management =======
    function initializeCheckboxes() {
        // Uncheck all checkboxes on page load
        selectAllCheckbox.checked = false;
        rowCheckboxes.forEach(checkbox => {
            checkbox.checked = false;
        });

        // Select all checkbox handler
        selectAllCheckbox.addEventListener('change', function () {
            rowCheckboxes.forEach(checkbox => {
                checkbox.checked = selectAllCheckbox.checked;
            });
        });

        // Individual checkbox handlers
        rowCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function () {
                const allChecked = Array.from(rowCheckboxes).every(cb => cb.checked);
                selectAllCheckbox.checked = allChecked;
                if (!allChecked) {
                    selectAllCheckbox.checked = false;
                }
            });
        });
    }

    // ======= Filter Row Management =======
    const filterBtn = document.getElementById("filterBtn");
    const filterRow = document.getElementById("filterRow");
    const clearFiltersBtn = document.getElementById("clearFilters");

    function clearFilterInputs() {
        const filterInputs = document.querySelectorAll('.filter-row input[type="text"]');
        filterInputs.forEach(input => {
            input.value = '';
        });
    }

    // Initialize filters
    clearFilterInputs();

    // Filter button click handler
    filterBtn.addEventListener("click", function () {
        filterRow.style.display = filterRow.style.display === "none" ||
                filterRow.style.display === "" ? "table-header-group" : "none";
    });

    // Clear filters button handler
    clearFiltersBtn.addEventListener("click", clearFilterInputs);

    // ======= Pagination Management =======
    let currentPage = 1;
    let recordsPerPage = 10;
    const totalRecords = 57;

    const recordsSelect = document.getElementById('recordsPerPage');
    const pageInfo = document.getElementById('pageInfo');
    const firstPageBtn = document.getElementById('firstPage');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const lastPageBtn = document.getElementById('lastPage');
    const pageNumbers = document.getElementById('pageNumbers');

    function updatePageInfo() {
        const totalPages = Math.ceil(totalRecords / recordsPerPage);
        const start = ((currentPage - 1) * recordsPerPage) + 1;
        const end = Math.min(currentPage * recordsPerPage, totalRecords);

        pageInfo.textContent = `Mostrando ${start} a ${end} de ${totalRecords} registros`;

        // Update button states
        firstPageBtn.disabled = currentPage === 1;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages;
        lastPageBtn.disabled = currentPage === totalPages;

        updatePageNumbers(totalPages);
    }

    function updatePageNumbers(totalPages) {
        pageNumbers.innerHTML = '';
        let startPage = Math.max(1, currentPage - 2); // Centrar la página actual
        let endPage = Math.min(totalPages, startPage + 4); // Mostrar máximo 5 páginas

        // Ajustar el rango si estamos cerca del inicio o del final
        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }

        // Botón para la primera página
        if (startPage > 1) {
            const firstPageButton = document.createElement('button');
            firstPageButton.className = 'page-number';
            firstPageButton.textContent = '1';
            firstPageButton.addEventListener('click', () => {
                currentPage = 1;
                updatePageInfo();
            });
            pageNumbers.appendChild(firstPageButton);

            if (startPage > 2) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                pageNumbers.appendChild(ellipsis);
            }
        }

        // Botones para las páginas en el rango
        for (let i = startPage; i <= endPage; i++) {
            const button = document.createElement('button');
            button.className = `page-number${i === currentPage ? ' active' : ''}`;
            button.textContent = i;
            button.addEventListener('click', () => {
                if (i !== currentPage) {
                    currentPage = i;
                    updatePageInfo();
                }
            });
            pageNumbers.appendChild(button);
        }

        // Botón para la última página
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                pageNumbers.appendChild(ellipsis);
            }

            const lastPageButton = document.createElement('button');
            lastPageButton.className = 'page-number';
            lastPageButton.textContent = totalPages;
            lastPageButton.addEventListener('click', () => {
                currentPage = totalPages;
                updatePageInfo();
            });
            pageNumbers.appendChild(lastPageButton);
        }
    }

    // Pagination event listeners
    recordsSelect.addEventListener('change', function () {
        recordsPerPage = parseInt(this.value);
        currentPage = 1;
        updatePageInfo();
    });

    firstPageBtn.addEventListener('click', () => {
        if (currentPage !== 1) {
            currentPage = 1;
            updatePageInfo();
        }
    });

    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            updatePageInfo();
        }
    });

    nextPageBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(totalRecords / recordsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            updatePageInfo();
        }
    });

    lastPageBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(totalRecords / recordsPerPage);
        if (currentPage !== totalPages) {
            currentPage = totalPages;
            updatePageInfo();
        }
    });

    // Initialize pagination
    updatePageInfo();
    initializeCheckboxes();
});