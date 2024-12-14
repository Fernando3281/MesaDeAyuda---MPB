document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.querySelector(".sidebar");
    const mainContent = document.querySelector(".main-content");
    const sidebarToggleBtn = document.querySelector(".sidebar-toggle");
    const mobileToggleBtn = document.querySelector(".mobile-toggle");
    const arrows = document.querySelectorAll(".arrow");
    const menuItems = document.querySelectorAll(".nav-links > li");
    const header = document.querySelector(".header");
    const breadcrumbContainer = document.querySelector(".breadcrumb-container");

    // Si no hay sidebar, detiene la ejecución del script
    if (!sidebar) {
        console.warn('Sidebar no encontrado. Se detiene la ejecución del script.');
        return;
    }

    const isMobile = () => window.innerWidth <= 840;

    const adjustMainContent = () => {
        if (isMobile()) return; // No ajustar en móvil

        const sidebarClosed = sidebar.classList.contains("close");
        const newLeftPosition = sidebarClosed ? "68px" : "200px";
        header.style.left = newLeftPosition;
        breadcrumbContainer.style.left = newLeftPosition;
        mainContent.style.marginLeft = newLeftPosition;
    };

    const initializeSidebarState = () => {
        if (isMobile()) {
            sidebar.classList.remove("close");
            sidebar.classList.remove("show");
        } else {
            const sidebarState = localStorage.getItem('sidebarState');
            if (sidebarState === 'closed') {
                sidebar.classList.add("close");
                document.querySelector(".arrow-toggle").style.transform = "rotate(-180deg)";
            } else {
                sidebar.classList.remove("close");
                document.querySelector(".arrow-toggle").style.transform = "rotate(0deg)";
            }
        }
        // Forzar el ajuste del contenido al iniciar
        adjustMainContent();
    };

    const saveSidebarState = () => {
        if (!isMobile()) {
            const state = sidebar.classList.contains("close") ? 'closed' : 'open';
            localStorage.setItem('sidebarState', state);
            document.querySelector(".arrow-toggle").style.transform = 
                state === 'closed' ? "rotate(-180deg)" : "rotate(0deg)";
        }
    };

    // Inicializar estado del sidebar y ajustar contenido al cargar la página
    initializeSidebarState();

    // Event listener para botón de toggle del sidebar
    sidebarToggleBtn.addEventListener("click", () => {
        if (!isMobile()) {
            sidebar.classList.toggle("close");
            saveSidebarState();
            adjustMainContent();
            
            if (sidebar.classList.contains("close")) {
                menuItems.forEach(item => {
                    item.classList.remove("showMenu");
                    const arrow = item.querySelector(".arrow");
                    if (arrow) arrow.style.transform = "rotate(0deg)";
                });
            }
        }
    });

    // Ajustar contenido cuando la ventana cambie de tamaño
    window.addEventListener('resize', () => {
        initializeSidebarState();
    });

    // Otros manejadores de eventos y lógica
    mobileToggleBtn.addEventListener("click", () => {
        sidebar.classList.toggle("show");
        const arrowToggle = document.querySelector(".arrow-toggle");
        if (sidebar.classList.contains("show")) {
            arrowToggle.style.display = "none"; // Ocultar flecha
        } else {
            arrowToggle.style.display = "block"; // Mostrar flecha
        }
    });

    arrows.forEach(arrow => {
        arrow.addEventListener("click", (e) => {
            const parentLi = e.target.closest("li");
            parentLi.classList.toggle("showMenu");
            e.target.style.transform = parentLi.classList.contains("showMenu") 
                ? "rotate(180deg)" : "rotate(0deg)";
        });
    });

    document.addEventListener('click', (e) => {
        if (isMobile() && 
            sidebar.classList.contains('show') && 
            !sidebar.contains(e.target) && 
            !mobileToggleBtn.contains(e.target)) {
            sidebar.classList.remove('show');
            document.querySelector(".arrow-toggle").style.display = "block"; // Mostrar flecha al cerrar
        }
    });
});






/////////////////////////
document.addEventListener('DOMContentLoaded', function() {
  const userProfile = document.querySelector('.user-profile');
  const dropdownMenu = document.querySelector('.dropdown-menu');
  
  // Si no hay Dropdown, detiene la ejecución del script
    if (!userProfile) {
        console.warn('Dropdown no encontrado. Se detiene la ejecución del script.');
        return;
    }

  // Toggle al hacer clic en el perfil de usuario
  userProfile.addEventListener('click', function(event) {
    event.stopPropagation(); // Evitar que el click cierre el menú inmediatamente
    dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
  });

  // Cerrar el menú cuando se hace clic fuera de él
  document.addEventListener('click', function(event) {
    if (!userProfile.contains(event.target)) {
      dropdownMenu.style.display = 'none';
    }
  });
});

