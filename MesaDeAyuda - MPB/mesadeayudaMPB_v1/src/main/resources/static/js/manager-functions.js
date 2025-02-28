document.addEventListener('DOMContentLoaded', function () {
    const ticketSummary = document.querySelector('.ticket-summary');
    const ticketDetails = document.querySelector('.ticket-details');
    const buttonContainer = document.querySelector('.back-button-container');

    // Obtener dimensiones iniciales
    let initialDetailsWidth = ticketDetails.offsetWidth;
    let containerHeight = buttonContainer.offsetHeight;

    // Calcular offset considerando el contenedor de botones
    const offset = buttonContainer.offsetHeight + 27; // 15px de margen adicional

    function handleScroll() {
        const scrollPosition = window.scrollY;
        const summaryRect = ticketSummary.getBoundingClientRect();
        const containerRect = buttonContainer.getBoundingClientRect();

        if (window.innerWidth > 768) { // Solo aplicar sticky en pantallas grandes
            if (scrollPosition > offset) {
                // Aplicar sticky state con animación suave
                ticketSummary.style.transform = `translateY(${containerHeight + 0}px)`;
                ticketSummary.classList.add('sticky');
                ticketDetails.classList.add('sticky');

                // Mantener el ancho consistente
                ticketDetails.style.width = `${initialDetailsWidth}px`;
            } else {
                // Remover sticky state con animación suave
                ticketSummary.style.transform = '';
                ticketSummary.classList.remove('sticky');
                ticketDetails.classList.remove('sticky');
                ticketDetails.style.width = '';
            }
        } else {
            // En dispositivos móviles, no aplicar sticky
            ticketSummary.style.transform = '';
            ticketSummary.classList.remove('sticky');
            ticketDetails.classList.remove('sticky');
            ticketDetails.style.width = '';
        }
    }

    // Throttling para mejor rendimiento
    let ticking = false;
    window.addEventListener('scroll', function () {
        if (!ticking) {
            window.requestAnimationFrame(function () {
                handleScroll();
                ticking = false;
            });
            ticking = true;
        }
    });

    // Manejar cambios de tamaño de ventana
    window.addEventListener('resize', function () {
        initialDetailsWidth = ticketDetails.offsetWidth;
        containerHeight = buttonContainer.offsetHeight;
        handleScroll();
    });

    // Inicialización
    handleScroll();
});





document.addEventListener('DOMContentLoaded', function () {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(button => {
        button.addEventListener('click', function () {
            const targetTab = this.getAttribute('data-tab');

            // Remove active class from all buttons and panes
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));

            // Add active class to the clicked button and corresponding pane
            this.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });
});



/*Funcion para mostrar y ocultar el Popover*/
document.addEventListener('DOMContentLoaded', function () {
    let popover = document.createElement('div');
    popover.className = 'popover';
    document.body.appendChild(popover);

    let hideTimeout = null;

    function showPopover(event) {
        const button = event.currentTarget;
        const message = button.getAttribute('data-popover');

        popover.textContent = message;
        clearTimeout(hideTimeout);
        popover.style.display = 'block';

        const rect = button.getBoundingClientRect();
        const popoverHeight = popover.offsetHeight;
        const popoverWidth = popover.offsetWidth;
        const leftPosition = rect.left + (rect.width / 2) - (popoverWidth / 2);

        popover.style.top = `${rect.top + window.scrollY - popoverHeight - 10}px`;
        popover.style.left = `${Math.max(10, leftPosition)}px`;
    }

    function hidePopover() {
        hideTimeout = setTimeout(() => {
            popover.style.display = 'none';
        }, 50);
    }

    document.querySelectorAll('.popover-btn').forEach(button => {
        button.addEventListener('mouseenter', showPopover);
        button.addEventListener('mouseleave', hidePopover);
    });

    popover.addEventListener('mouseenter', () => clearTimeout(hideTimeout));
    popover.addEventListener('mouseleave', hidePopover);
});

// Obtiene el usuario para redirijir al panel de perfil
function viewSolicitanteProfile(idUsuario, currentUserId) {
    if (idUsuario) {
        window.location.href = `/usuario/perfil/${idUsuario}`;
    }
}

// Function to update button visibility
function updateProfileButton(solicitanteId, currentUserId) {
    const updateButton = document.querySelector('.btn-update');
    if (updateButton) {
        if (solicitanteId !== currentUserId) {
            updateButton.style.display = 'none';
        }
    }
}
