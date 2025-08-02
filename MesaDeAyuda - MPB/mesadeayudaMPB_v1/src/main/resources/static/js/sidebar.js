document.addEventListener('DOMContentLoaded', () => {
    const excludedPaths = [
        '/login',
        '/login.html',
        '/registro/nuevo',
        '/registro/recordar',
        '/registro/verificacion',
        '/registro/cambiar-contrasena',
        '/usuario/cambiar-contrasena'
    ];
    
    const currentPath = window.location.pathname;
    const isExcludedPath = excludedPaths.some(path => 
        currentPath.startsWith(path) || 
        window.location.search.includes('token=') ||
        window.location.search.includes('email=')
    );
    
    if (isExcludedPath) return;

    const sidebar = document.querySelector(".sidebar");
    const mainContent = document.querySelector(".main-content");
    const sidebarToggleBtn = document.querySelector(".sidebar-toggle");
    const mobileToggleBtn = document.querySelector(".mobile-toggle");
    const arrows = document.querySelectorAll(".arrow");
    const menuItems = document.querySelectorAll(".nav-links > li");
    const header = document.querySelector(".header");
    const breadcrumbContainer = document.querySelector(".breadcrumb-container");
    const body = document.body;

    if (!sidebar) return;

    const isMobile = () => window.innerWidth <= 840;

    const adjustMainContent = () => {
        if (!mainContent || !header || !breadcrumbContainer) return;

        if (isMobile()) {
            mainContent.style.marginLeft = "0";
            header.style.left = "0";
            breadcrumbContainer.style.left = "0";
            return;
        }

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
            const arrowToggle = document.querySelector(".arrow-toggle");
            if (sidebarState === 'closed') {
                sidebar.classList.add("close");
                if (arrowToggle) arrowToggle.style.transform = "rotate(-180deg)";
            } else {
                sidebar.classList.remove("close");
                if (arrowToggle) arrowToggle.style.transform = "rotate(0deg)";
            }
        }
        adjustMainContent();
    };

    const saveSidebarState = () => {
        if (!isMobile()) {
            const state = sidebar.classList.contains("close") ? 'closed' : 'open';
            localStorage.setItem('sidebarState', state);
            const arrowToggle = document.querySelector(".arrow-toggle");
            if (arrowToggle) {
                arrowToggle.style.transform = state === 'closed' ? "rotate(-180deg)" : "rotate(0deg)";
            }
        }
    };

    initializeSidebarState();

    if (sidebarToggleBtn) {
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
    }

    window.addEventListener('resize', () => {
        initializeSidebarState();
    });

    if (mobileToggleBtn) {
        mobileToggleBtn.addEventListener("click", () => {
            sidebar.classList.toggle("show");
        });
    }

    document.addEventListener('click', (e) => {
        if (isMobile() && sidebar.classList.contains('show') && !sidebar.contains(e.target) && mobileToggleBtn && !mobileToggleBtn.contains(e.target)) {
            sidebar.classList.remove('show');
        }
    });

    arrows.forEach(arrow => {
        arrow.addEventListener("click", (e) => {
            const parentLi = e.target.closest("li");
            if (parentLi) {
                parentLi.classList.toggle("showMenu");
                e.target.style.transform = parentLi.classList.contains("showMenu") ? "rotate(180deg)" : "rotate(0deg)";
            }
        });
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const excludedPaths = [
        '/login',
        '/login.html',
        '/registro/nuevo',
        '/registro/recordar',
        '/registro/verificacion',
        '/registro/cambiar-contrasena',
        '/usuario/cambiar-contrasena'
    ];
    
    const currentPath = window.location.pathname;
    const isExcludedPath = excludedPaths.some(path => 
        currentPath.startsWith(path) || 
        window.location.search.includes('token=') ||
        window.location.search.includes('email=')
    );
    
    if (isExcludedPath) return;

    const userProfile = document.querySelector('.user-profile');
    const dropdownMenu = document.querySelector('.dropdown-menu');
    const contentDropdown = document.querySelector('.content-dropdown');
    
    if (!userProfile || !dropdownMenu || !contentDropdown) return;

    const chevronIcon = contentDropdown.querySelector('.fa-chevron-down');
    if (!chevronIcon) return;

    function openDropdown() {
        dropdownMenu.style.display = 'flex';
        dropdownMenu.classList.add('show');
        contentDropdown.classList.add('active');
    }

    function closeDropdown() {
        dropdownMenu.classList.remove('show');
        dropdownMenu.classList.add('hide');
        contentDropdown.classList.remove('active');
        setTimeout(() => {
            dropdownMenu.classList.remove('hide');
            dropdownMenu.style.display = 'none';
        }, 100);
    }

    contentDropdown.addEventListener('click', function(event) {
        event.stopPropagation();
        if (dropdownMenu.classList.contains('show')) {
            closeDropdown();
        } else {
            openDropdown();
        }
    });

    document.addEventListener('click', function(event) {
        if (!userProfile.contains(event.target) && dropdownMenu.classList.contains('show')) {
            closeDropdown();
        }
    });
});