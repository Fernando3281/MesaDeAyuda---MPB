function saveFiltersToSessionStorage() {
    const filters = {
        search: document.getElementById('searchInput')?.value || '',
        status: Array.from(document.querySelectorAll('input[name="status"]:checked')).map(cb => cb.value),
        priority: Array.from(document.querySelectorAll('input[name="priority"]:checked')).map(cb => cb.value),
        category: Array.from(document.querySelectorAll('input[name="category"]:checked')).map(cb => cb.value),
        fechaFrom: document.getElementById('fechaFrom')?.value || '',
        fechaTo: document.getElementById('fechaTo')?.value || ''
    };

    sessionStorage.setItem('ticketFilters', JSON.stringify(filters));
}

function loadFiltersFromSessionStorage() {
    const savedFilters = sessionStorage.getItem('ticketFilters');
    if (!savedFilters)
        return;

    try {
        const filters = JSON.parse(savedFilters);

        if (filters.search && document.getElementById('searchInput')) {
            document.getElementById('searchInput').value = filters.search;
        }

        document.querySelectorAll('input[name="status"]').forEach(cb => {
            cb.checked = filters.status.includes(cb.value);
        });

        document.querySelectorAll('input[name="priority"]').forEach(cb => {
            cb.checked = filters.priority.includes(cb.value);
        });

        document.querySelectorAll('input[name="category"]').forEach(cb => {
            cb.checked = filters.category.includes(cb.value);
        });

        if (filters.fechaFrom && document.getElementById('fechaFrom')) {
            document.getElementById('fechaFrom').value = filters.fechaFrom;
            if (document.getElementById('fechaFrom')._flatpickr) {
                document.getElementById('fechaFrom')._flatpickr.setDate(filters.fechaFrom, false, 'd/m/Y');
            }
        }

        if (filters.fechaTo && document.getElementById('fechaTo')) {
            document.getElementById('fechaTo').value = filters.fechaTo;
            if (document.getElementById('fechaTo')._flatpickr) {
                document.getElementById('fechaTo')._flatpickr.setDate(filters.fechaTo, false, 'd/m/Y');
            }
        }

    } catch (e) {

    }
}

function clearFiltersFromSessionStorage() {
    sessionStorage.removeItem('ticketFilters');
}

document.addEventListener('DOMContentLoaded', function () {
    const filterChips = document.querySelectorAll('.filter-chip');
    const filterDropdowns = document.querySelectorAll('.filter-dropdown');
    const clearFilters = document.getElementById('clearFilters');
    const activeFilters = document.getElementById('activeFilters');
    const searchInput = document.getElementById('searchInput');
    const ticketList = document.getElementById('ticketList');
    const fechaFrom = document.getElementById('fechaFrom');
    const fechaTo = document.getElementById('fechaTo');

    const cancelModal = document.getElementById('cancelTicketModal');
    const confirmCancel = document.getElementById('confirmCancel');
    const closeCancelModal = document.getElementById('closeCancelModal');
    let currentTicketId = null;

    const fileModal = document.getElementById('fileModal');
    const modalFileImage = document.getElementById('modalFileImage');
    const modalFilePdf = document.getElementById('modalFilePdf');
    const modalFileName = document.getElementById('modalFileName');
    const closeModal = document.querySelector('.close-modal');

    const ticketListContainer = document.querySelector('.ticket-list-container');
    const esSoportistaOAdmin = ticketListContainer ? ticketListContainer.dataset.esSoportistaAdmin === 'true' : false;

    const fromTicketDetails = sessionStorage.getItem('fromTicketDetails') === 'true';

    if (fechaFrom && fechaTo) {
        flatpickr("#fechaFrom", {
            dateFormat: "d/m/Y",
            locale: "es",
            placeholder: "dd/mm/yyyy",
            allowInput: true
        });

        flatpickr("#fechaTo", {
            dateFormat: "d/m/Y",
            locale: "es",
            placeholder: "dd/mm/yyyy",
            allowInput: true
        });
    }

    function getCsrfToken() {
        const metaTag = document.querySelector('meta[name="_csrf"]');
        return metaTag ? metaTag.getAttribute('content') : null;
    }

    function getCsrfHeader() {
        const metaTag = document.querySelector('meta[name="_csrf_header"]');
        return metaTag ? metaTag.getAttribute('content') : 'X-CSRF-TOKEN';
    }

    function hayFiltrosAplicados() {
        const checkboxesMarcados = document.querySelectorAll('input[type="checkbox"]:checked').length > 0;
        const hayFiltroFecha = fechaFrom && fechaTo && (fechaFrom.value || fechaTo.value);
        const hayBusqueda = searchInput && searchInput.value.trim() !== '';
        return checkboxesMarcados || hayFiltroFecha || hayBusqueda;
    }

    function actualizarVisibilidadBotonLimpiar() {
        if (clearFilters) {
            clearFilters.style.display = hayFiltrosAplicados() ? 'flex' : 'none';
        }
    }

    function mapearEstadoParaFiltro(estadoMostrado) {
        if (!esSoportistaOAdmin) {
            switch (estadoMostrado.toLowerCase()) {
                case 'en revisión':
                    return 'abierto';
                case 'en progreso':
                    return 'pendiente';
                case 'solucionado':
                    return 'resuelto';
                case 'desactivado':
                    return 'desactivado';
                case 'cancelado':
                    return 'cancelado';
                default:
                    return estadoMostrado.toLowerCase();
            }
        }
        return estadoMostrado.toLowerCase();
    }

    if (ticketList) {
        if (!fromTicketDetails) {
            if (activeFilters)
                activeFilters.style.display = 'none';
            document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                cb.checked = false;
            });
            if (fechaFrom)
                fechaFrom.value = '';
            if (fechaTo)
                fechaTo.value = '';
            if (searchInput)
                searchInput.value = '';
            clearFiltersFromSessionStorage();
        } else {
            loadFiltersFromSessionStorage();
            sessionStorage.removeItem('fromTicketDetails');
        }

        actualizarVisibilidadBotonLimpiar();

        filterChips.forEach(chip => {
            chip.addEventListener('click', (e) => {
                e.stopPropagation();
                const filterType = chip.dataset.filter;
                const dropdown = document.getElementById(`${filterType}Filter`);

                const isCurrentlyActive = chip.classList.contains('active');

                filterDropdowns.forEach(d => {
                    d.style.display = 'none';
                });
                filterChips.forEach(c => {
                    c.classList.remove('active');
                });

                if (!isCurrentlyActive) {
                    dropdown.style.display = 'block';
                    chip.classList.add('active');

                    const chipRect = chip.getBoundingClientRect();
                    dropdown.style.top = `${chipRect.bottom + window.scrollY + 8}px`;
                    dropdown.style.left = `${chipRect.left}px`;
                }
            });
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.filter-chip') && !e.target.closest('.filter-dropdown')) {
                filterDropdowns.forEach(dropdown => {
                    dropdown.style.display = 'none';
                });
                filterChips.forEach(chip => {
                    chip.classList.remove('active');
                });
            }
        });

        function updateActiveFilters() {
            if (!activeFilters)
                return;

            activeFilters.innerHTML = '';
            let hasActiveFilters = false;

            document.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
                hasActiveFilters = true;
                const filterTag = document.createElement('div');
                filterTag.className = 'active-filter-tag';
                filterTag.innerHTML = `
                    ${checkbox.value}
                    <i class="fas fa-times" data-filter="${checkbox.name}" data-value="${checkbox.value}"></i>
                `;
                activeFilters.appendChild(filterTag);
            });

            if (fechaFrom && fechaTo && (fechaFrom.value || fechaTo.value)) {
                hasActiveFilters = true;
                const dateFilterTag = document.createElement('div');
                dateFilterTag.className = 'active-filter-tag';
                const fechaDesde = fechaFrom.value || '...';
                const fechaHasta = fechaTo.value || '...';
                dateFilterTag.innerHTML = `
                    ${fechaDesde} / ${fechaHasta}
                    <i class="fas fa-times" data-filter="date"></i>
                `;
                activeFilters.appendChild(dateFilterTag);
            }

            activeFilters.style.display = hasActiveFilters ? 'flex' : 'none';
            actualizarVisibilidadBotonLimpiar();
        }

        if (activeFilters) {
            activeFilters.addEventListener('click', (e) => {
                if (e.target.matches('.fa-times')) {
                    const filterType = e.target.dataset.filter;
                    const filterValue = e.target.dataset.value;

                    if (filterType === 'date') {
                        if (fechaFrom)
                            fechaFrom.value = '';
                        if (fechaTo)
                            fechaTo.value = '';
                        if (fechaFrom && fechaFrom._flatpickr)
                            fechaFrom._flatpickr.clear();
                        if (fechaTo && fechaTo._flatpickr)
                            fechaTo._flatpickr.clear();
                    } else {
                        const checkbox = document.querySelector(`input[name="${filterType}"][value="${filterValue}"]`);
                        if (checkbox)
                            checkbox.checked = false;
                    }

                    filterTickets();
                    updateActiveFilters();
                    saveFiltersToSessionStorage();
                }
            });
        }

        if (clearFilters) {
            clearFilters.addEventListener('click', () => {
                document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
                if (fechaFrom)
                    fechaFrom.value = '';
                if (fechaTo)
                    fechaTo.value = '';
                if (fechaFrom && fechaFrom._flatpickr)
                    fechaFrom._flatpickr.clear();
                if (fechaTo && fechaTo._flatpickr)
                    fechaTo._flatpickr.clear();
                if (searchInput)
                    searchInput.value = '';
                filterTickets();
                updateActiveFilters();
                clearFiltersFromSessionStorage();
            });
        }

        function filterTickets() {
            if (!ticketList)
                return;

            const tickets = ticketList.getElementsByClassName('ticket-card');
            const searchText = searchInput ? searchInput.value.toLowerCase() : '';
            const selectedStatuses = Array.from(document.querySelectorAll('input[name="status"]:checked')).map(cb => cb.value.toLowerCase());
            const selectedPriorities = Array.from(document.querySelectorAll('input[name="priority"]:checked')).map(cb => cb.value.toLowerCase());
            const selectedCategories = Array.from(document.querySelectorAll('input[name="category"]:checked')).map(cb => cb.value.toLowerCase());
            const noMatchesMessage = document.getElementById('noMatchesMessage');
            const noTicketsMessage = document.querySelector('.no-tickets-message');

            let visibleTickets = 0;

            Array.from(tickets).forEach(ticket => {
                const ticketPriority = ticket.dataset.priority.toLowerCase();
                const ticketCategory = ticket.dataset.category.toLowerCase();
                const ticketStatus = ticket.dataset.status.toLowerCase();
                const ticketDateElement = ticket.querySelector('.date span');
                const ticketDateText = ticketDateElement ? ticketDateElement.textContent : '';

                const estadoOriginal = mapearEstadoParaFiltro(ticketStatus);

                const statusMatch = selectedStatuses.length === 0 || selectedStatuses.includes(estadoOriginal);
                const priorityMatch = selectedPriorities.length === 0 || selectedPriorities.includes(ticketPriority);
                const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(ticketCategory);

                const matchesSearch = searchText === '' || ticket.textContent.toLowerCase().includes(searchText);

                const matchesDate = checkDateRange(ticketDateText);

                const isVisible = matchesSearch && statusMatch && priorityMatch && categoryMatch && matchesDate;

                ticket.style.display = isVisible ? 'block' : 'none';

                if (isVisible) {
                    visibleTickets++;
                }
            });

            const ticketCounter = document.getElementById('ticketCounter');
            if (ticketCounter)
                ticketCounter.textContent = visibleTickets;

            if (noMatchesMessage) {
                noMatchesMessage.style.display = visibleTickets === 0 && tickets.length > 0 ? 'flex' : 'none';
            }
            if (noTicketsMessage) {
                noTicketsMessage.style.display = tickets.length === 0 ? 'flex' : 'none';
            }
        }

        const clearFiltersFromNoMatches = document.getElementById('clearFiltersFromNoMatches');
        if (clearFiltersFromNoMatches) {
            clearFiltersFromNoMatches.addEventListener('click', () => {
                document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
                if (fechaFrom)
                    fechaFrom.value = '';
                if (fechaTo)
                    fechaTo.value = '';
                if (fechaFrom && fechaFrom._flatpickr)
                    fechaFrom._flatpickr.clear();
                if (fechaTo && fechaTo._flatpickr)
                    fechaTo._flatpickr.clear();
                if (searchInput)
                    searchInput.value = '';
                filterTickets();
                updateActiveFilters();
                clearFiltersFromSessionStorage();
            });
        }

        function checkDateRange(dateText) {
            if (!dateText || (!fechaFrom && !fechaTo))
                return true;
            if (!fechaFrom.value && !fechaTo.value)
                return true;

            try {
                const [day, month, year] = dateText.split('-');
                const ticketDate = new Date(`${year}-${month}-${day}`);

                const from = fechaFrom && fechaFrom.value ? parseFlatpickrDate(fechaFrom.value) : null;
                const to = fechaTo && fechaTo.value ? parseFlatpickrDate(fechaTo.value) : null;

                if (from && to) {
                    return ticketDate >= from && ticketDate <= to;
                } else if (from) {
                    return ticketDate >= from;
                } else if (to) {
                    return ticketDate <= to;
                }
            } catch (e) {
                return true;
            }

            return true;
        }

        function parseFlatpickrDate(dateStr) {
            if (!dateStr)
                return null;
            const [day, month, year] = dateStr.split('/');
            return new Date(`${year}-${month}-${day}`);
        }

        if (searchInput) {
            searchInput.addEventListener('input', () => {
                filterTickets();
                saveFiltersToSessionStorage();
            });
        }

        document.querySelectorAll('input[name="status"], input[name="priority"], input[name="category"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                filterTickets();
                updateActiveFilters();
                saveFiltersToSessionStorage();
            });
        });

        const applyDateButton = document.querySelector('.apply-date');
        if (applyDateButton) {
            applyDateButton.addEventListener('click', () => {
                filterTickets();
                updateActiveFilters();
                saveFiltersToSessionStorage();
                const dateFilter = document.getElementById('dateFilter');
                if (dateFilter)
                    dateFilter.style.display = 'none';
            });
        }

        if (fechaFrom) {
            fechaFrom.addEventListener('change', () => {
                updateActiveFilters();
                saveFiltersToSessionStorage();
            });
        }

        if (fechaTo) {
            fechaTo.addEventListener('change', () => {
                updateActiveFilters();
                saveFiltersToSessionStorage();
            });
        }

        filterTickets();
        updateActiveFilters();

        document.addEventListener('click', function (e) {
            const detailsButton = e.target.closest('.button-32:not(.cancel-button)');
            if (detailsButton && detailsButton.textContent.includes('Ver Detalles')) {
                saveFiltersToSessionStorage();
            }
        });
    }

    function showCancelModal(ticketId) {
        const ticketCard = document.querySelector(`.ticket-card[data-id="${ticketId}"]`);
        const ticketDetails = document.querySelector('.ticket-details');
        let ticketCode, ticketTitle;

        if (ticketCard) {
            const ticketIdElement = ticketCard.querySelector('.ticket-id span');
            const ticketTitleElement = ticketCard.querySelector('.ticket-content h3');
            ticketCode = ticketIdElement ? ticketIdElement.textContent : '';
            ticketTitle = ticketTitleElement ? ticketTitleElement.textContent : '';
        } else if (ticketDetails) {
            const ticketIdElement = ticketDetails.querySelector('.ticket-id span');
            const ticketTitleElement = ticketDetails.querySelector('.ticket-title');
            ticketCode = ticketIdElement ? ticketIdElement.textContent : '';
            ticketTitle = ticketTitleElement ? ticketTitleElement.textContent : '';
        }

        if (ticketCode && ticketTitle) {
            const ticketToCancelCode = document.getElementById('ticketToCancelCode');
            const ticketToCancelTitle = document.getElementById('ticketToCancelTitle');

            if (ticketToCancelCode)
                ticketToCancelCode.textContent = ticketCode;
            if (ticketToCancelTitle)
                ticketToCancelTitle.textContent = ticketTitle;

            currentTicketId = ticketId;
            document.body.classList.add('modal-open');
            if (cancelModal)
                cancelModal.style.display = 'flex';
        }
    }

    function hideCancelModal() {
        document.body.classList.remove('modal-open');
        if (cancelModal)
            cancelModal.style.display = 'none';
        currentTicketId = null;
        const ticketToCancelCode = document.getElementById('ticketToCancelCode');
        const ticketToCancelTitle = document.getElementById('ticketToCancelTitle');
        if (ticketToCancelCode)
            ticketToCancelCode.textContent = '';
        if (ticketToCancelTitle)
            ticketToCancelTitle.textContent = '';
    }

    function cancelTicket() {
        if (!currentTicketId) {
            alert('Error: No se pudo identificar el ticket a cancelar');
            return;
        }

        if (confirmCancel) {
            confirmCancel.disabled = true;
            confirmCancel.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Procesando...';
        }

        const csrfToken = getCsrfToken();
        const csrfHeader = getCsrfHeader();

        if (!csrfToken) {
            alert('Error de seguridad: Token CSRF no encontrado');
            if (confirmCancel) {
                confirmCancel.disabled = false;
                confirmCancel.textContent = 'Confirmar';
            }
            return;
        }

        const headers = {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        };
        headers[csrfHeader] = csrfToken;

        fetch(`/tickets/cancelar/${currentTicketId}`, {
            method: 'POST',
            headers: headers,
            credentials: 'include'
        })
                .then(response => {
                    if (confirmCancel) {
                        confirmCancel.disabled = false;
                        confirmCancel.textContent = 'Confirmar';
                    }

                    if (!response.ok) {
                        return response.json().then(err => {
                            throw new Error(err.error || `Error ${response.status}: ${response.statusText}`);
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.success) {
                        hideCancelModal();
                        if (document.querySelector('.ticket-details')) {
                            window.location.href = '/usuario/historial';
                        } else {
                            window.location.reload();
                        }
                    } else {
                        throw new Error(data.error || 'Error al cancelar el ticket');
                    }
                })
                .catch(error => {
                    alert('Error al cancelar el ticket: ' + error.message);
                    if (confirmCancel) {
                        confirmCancel.disabled = false;
                        confirmCancel.textContent = 'Confirmar';
                    }
                });
    }

    if (confirmCancel) {
        confirmCancel.addEventListener('click', cancelTicket);
    }

    if (closeCancelModal) {
        closeCancelModal.addEventListener('click', hideCancelModal);
    }

    if (cancelModal) {
        cancelModal.addEventListener('click', function (e) {
            if (e.target === cancelModal) {
                hideCancelModal();
            }
        });
    }

    document.addEventListener('click', function (e) {
        const cancelButton = e.target.closest('.cancel-button');
        if (cancelButton) {
            e.preventDefault();
            const ticketCard = cancelButton.closest('.ticket-card');
            let ticketId;

            if (ticketCard) {
                ticketId = ticketCard.dataset.id;
            } else {
                const ticketDetails = cancelButton.closest('.ticket-details');
                if (ticketDetails) {
                    const ticketIdElement = ticketDetails.querySelector('.ticket-id span');
                    ticketId = ticketIdElement ? ticketIdElement.textContent.replace('#', '') : '';
                }
            }

            if (ticketId) {
                showCancelModal(ticketId);
            }
        }
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            hideCancelModal();
            if (fileModal) {
                fileModal.style.display = 'none';
                if (modalFileImage)
                    modalFileImage.style.display = 'none';
                if (modalFilePdf)
                    modalFilePdf.style.display = 'none';
                if (modalFileName)
                    modalFileName.textContent = '';
            }
        }
    });

    if (fileModal) {
        document.querySelectorAll('.file-item').forEach(fileItem => {
            fileItem.addEventListener('click', () => {
                const src = fileItem.dataset.src;
                const type = fileItem.dataset.type;
                const filename = fileItem.dataset.filename;

                if (modalFileName)
                    modalFileName.textContent = filename;

                if (type === 'image' && modalFileImage) {
                    modalFileImage.src = src;
                    modalFileImage.style.display = 'block';
                    if (modalFilePdf)
                        modalFilePdf.style.display = 'none';
                } else if (type === 'pdf' && modalFilePdf) {
                    modalFilePdf.src = src;
                    modalFilePdf.style.display = 'block';
                    if (modalFileImage)
                        modalFileImage.style.display = 'none';
                }

                if (fileModal)
                    fileModal.style.display = 'block';
            });
        });

        if (closeModal) {
            closeModal.addEventListener('click', () => {
                if (fileModal)
                    fileModal.style.display = 'none';
                if (modalFileImage)
                    modalFileImage.style.display = 'none';
                if (modalFilePdf)
                    modalFilePdf.style.display = 'none';
                if (modalFileName)
                    modalFileName.textContent = '';
            });
        }

        if (fileModal) {
            fileModal.addEventListener('click', function (e) {
                if (e.target === fileModal) {
                    fileModal.style.display = 'none';
                    if (modalFileImage)
                        modalFileImage.style.display = 'none';
                    if (modalFilePdf)
                        modalFilePdf.style.display = 'none';
                    if (modalFileName)
                        modalFileName.textContent = '';
                }
            });
        }
    }
});