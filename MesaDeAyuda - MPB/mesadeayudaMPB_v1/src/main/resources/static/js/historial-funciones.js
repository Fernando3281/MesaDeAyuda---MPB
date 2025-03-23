document.addEventListener('DOMContentLoaded', function () {
    const filterChips = document.querySelectorAll('.filter-chip');
    const filterDropdowns = document.querySelectorAll('.filter-dropdown');
    const clearFilters = document.getElementById('clearFilters');
    const activeFilters = document.getElementById('activeFilters');
    const searchInput = document.getElementById('searchInput');
    const ticketList = document.getElementById('ticketList');
    const dateFrom = document.getElementById('dateFrom');
    const dateTo = document.getElementById('dateTo');

    // Hide active filters container by default
    activeFilters.style.display = 'none';

    // Uncheck all checkboxes by default
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });

    // Toggle filter dropdowns
    filterChips.forEach(chip => {
        chip.addEventListener('click', (e) => {
            const filterType = chip.dataset.filter;
            const dropdown = document.getElementById(`${filterType}Filter`);

            // Close other dropdowns
            filterDropdowns.forEach(d => {
                if (d.id !== `${filterType}Filter`) {
                    d.style.display = 'none';
                }
            });

            // Toggle current dropdown
            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';

            // Position dropdown below chip
            const chipRect = chip.getBoundingClientRect();
            dropdown.style.top = `${chipRect.bottom + window.scrollY + 8}px`;
            dropdown.style.left = `${chipRect.left}px`;

            // Toggle active state
            chip.classList.toggle('active');
        });
    });

    // Close dropdowns when clicking outside
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

    // Update active filters display
    function updateActiveFilters() {
        activeFilters.innerHTML = '';
        let hasActiveFilters = false;

        // Get all checked filters
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

        // Add date range if selected
        if (dateFrom.value || dateTo.value) {
            hasActiveFilters = true;
            const dateFilterTag = document.createElement('div');
            dateFilterTag.className = 'active-filter-tag';
            dateFilterTag.innerHTML = `
                ${dateFrom.value} - ${dateTo.value}
                <i class="fas fa-times" data-filter="date"></i>
            `;
            activeFilters.appendChild(dateFilterTag);
        }

        // Show/hide active filters container
        activeFilters.style.display = hasActiveFilters ? 'flex' : 'none';
    }

    // Remove individual filters when clicking on X
    activeFilters.addEventListener('click', (e) => {
        if (e.target.matches('.fa-times')) {
            const filterType = e.target.dataset.filter;
            const filterValue = e.target.dataset.value;

            if (filterType === 'date') {
                dateFrom.value = '';
                dateTo.value = '';
            } else {
                const checkbox = document.querySelector(`input[name="${filterType}"][value="${filterValue}"]`);
                if (checkbox) checkbox.checked = false;
            }

            filterTickets();
            updateActiveFilters();
        }
    });

    // Clear all filters
    clearFilters.addEventListener('click', () => {
        document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
        dateFrom.value = '';
        dateTo.value = '';
        searchInput.value = '';
        filterTickets();
        updateActiveFilters();
    });

    // Filter tickets based on all criteria
    function filterTickets() {
        const tickets = ticketList.getElementsByClassName('ticket-card');
        const searchText = searchInput.value.toLowerCase();
        const selectedStatuses = Array.from(document.querySelectorAll('input[name="status"]:checked')).map(cb => cb.value);
        const selectedPriorities = Array.from(document.querySelectorAll('input[name="priority"]:checked')).map(cb => cb.value);
        const selectedCategories = Array.from(document.querySelectorAll('input[name="category"]:checked')).map(cb => cb.value);

        let visibleTickets = 0;

        Array.from(tickets).forEach(ticket => {
            const ticketPriority = ticket.dataset.priority.toLowerCase();
            const ticketCategory = ticket.dataset.category.toLowerCase();
            const ticketStatus = ticket.dataset.status.toLowerCase();
            const ticketDate = ticket.querySelector('.date').textContent;

            // If no filters are selected in a category, treat it as if all are selected
            const statusMatch = selectedStatuses.length === 0 || selectedStatuses.includes(ticketStatus);
            const priorityMatch = selectedPriorities.length === 0 || selectedPriorities.includes(ticketPriority);
            const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(ticketCategory);
            
            // Check if ticket matches all criteria
            const matchesSearch = ticket.textContent.toLowerCase().includes(searchText);
            const matchesDate = checkDateRange(ticketDate);

            const isVisible = matchesSearch && 
                            statusMatch && 
                            priorityMatch && 
                            categoryMatch && 
                            matchesDate;

            ticket.style.display = isVisible ? 'block' : 'none';

            if (isVisible) {
                visibleTickets++;
            }
        });

        // Update the counter
        document.getElementById('ticketCounter').textContent = visibleTickets;
    }

    // Helper function to check if a date falls within the selected range
    function checkDateRange(ticketDate) {
        if (!dateFrom.value && !dateTo.value) return true;

        const date = new Date(ticketDate);
        const from = dateFrom.value ? new Date(dateFrom.value) : null;
        const to = dateTo.value ? new Date(dateTo.value) : null;

        if (from && to) {
            return date >= from && date <= to;
        } else if (from) {
            return date >= from;
        } else if (to) {
            return date <= to;
        }

        return true;
    }

    // Event listeners for filter changes
    searchInput.addEventListener('input', filterTickets);
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            filterTickets();
            updateActiveFilters();
        });
    });

    // Date filter application
    document.querySelector('.apply-date').addEventListener('click', () => {
        filterTickets();
        updateActiveFilters();
        document.getElementById('dateFilter').style.display = 'none';
    });

    // Initialize filters and counter
    filterTickets();
    updateActiveFilters();
});