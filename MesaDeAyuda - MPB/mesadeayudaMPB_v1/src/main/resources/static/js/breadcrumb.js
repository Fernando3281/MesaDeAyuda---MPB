document.addEventListener('DOMContentLoaded', function() {
    const breadcrumbContainer = document.querySelector('.breadcrumb');
    if (!breadcrumbContainer) {
        return;
    }

    initBreadcrumb();
    updateBreadcrumb();
    setupNavigationListeners();
    setupLogoClickListeners();
});

const routeMappings = {
    '/index': 'Inicio',
    '/login': 'Iniciar Sesión',
    '/tickets/nuevo': 'Nuevo Ticket',
    '/tickets/listado': 'Listado de Tickets',
    '/tickets/sin-asignar': 'Tickets Sin Asignar',
    '/tickets/mis-tickets': 'Mis Tickets',
    '/tickets/manager': 'Gestión de Ticket',
    '/tickets/perfil-solicitante': 'Perfil del Solicitante',
    '/tickets/atender': 'Atender Ticket',
    '/mensajes/inbox': 'Bandeja de Entrada',
    '/mensajes/listado': 'Mensajes',
    '/reportes/listado': 'Reportes y Estadísticas',
    '/reportes/datos': 'Datos de Reportes',
    '/usuario/historial': 'Historial de Tickets',
    '/usuario/configuracion': 'Ajustes',
    '/usuario/perfil': 'Mi Perfil',
    '/usuario/editar': 'Editar Perfil',
    '/usuario/listado': 'Gestión de Usuarios',
    '/usuario/crear': 'Crear Usuario',
    '/usuario/detalles': 'Detalles de Ticket',
    '/departamento/listado': 'Gestión de Departamentos',
    '/categoria/listado': 'Gestión de Categorías',
    '/api/auditoria/ticket': 'Historial de Auditoría',
    '/archivos/ticket': 'Archivos Adjuntos',
    '/registro/nuevo': 'Registro de Usuario',
    '/registro/recordar': 'Recuperar Contraseña',
    '/registro/verificacion': 'Verificar Email',
    '/registro/cambiar-contrasena': 'Cambiar Contraseña'
};

const mainRoutes = [
    '/tickets/nuevo',
    '/tickets/listado',
    '/tickets/sin-asignar',
    '/tickets/mis-tickets',
    '/usuario/historial',
    '/mensajes/inbox',
    '/mensajes/listado',
    '/reportes/listado',
    '/usuario/configuracion',
    '/usuario/perfil',
    '/usuario/listado',
    '/departamento/listado',
    '/categoria/listado'
];

const excludedRoutes = [
    '/login',
    '/registro/nuevo',
    '/registro/recordar',
    '/registro/verificacion',
    '/registro/cambiar-contrasena'
];

const routeHierarchy = {
    '/tickets/manager': ['/tickets/listado', '/tickets/manager'],
    '/tickets/perfil-solicitante': ['/tickets/listado', '/tickets/manager', '/tickets/perfil-solicitante'],
    '/tickets/atender': ['/tickets/listado', '/tickets/atender'],
    '/usuario/detalles': ['/usuario/historial', '/usuario/detalles'],
    '/usuario/editar': ['/usuario/perfil', '/usuario/editar'],
    '/usuario/crear': ['/usuario/listado', '/usuario/crear'],
    '/reportes/datos': ['/reportes/listado', '/reportes/datos']
};

const restrictedAccessRoutes = {
    '/tickets/perfil-solicitante': '/tickets/manager'
};

function initBreadcrumb() {
    try {
        const storedHistory = sessionStorage.getItem('breadcrumbHistory');
        if (!storedHistory || !isValidJson(storedHistory)) {
            sessionStorage.setItem('breadcrumbHistory', JSON.stringify([
                { path: '/index', title: 'Inicio' }
            ]));
        }
    } catch (e) {
        sessionStorage.setItem('breadcrumbHistory', JSON.stringify([
            { path: '/index', title: 'Inicio' }
        ]));
    }
}

function isValidJson(str) {
    try {
        JSON.parse(str);
        return true;
    } catch (e) {
        return false;
    }
}

function shouldShowBreadcrumb() {
    const currentPath = window.location.pathname;
    return !excludedRoutes.includes(currentPath) && !isAuthPage();
}

function updateBreadcrumb() {
    const breadcrumbContainer = document.querySelector('.breadcrumb');
    if (!breadcrumbContainer || !shouldShowBreadcrumb()) {
        if (breadcrumbContainer) {
            breadcrumbContainer.style.display = 'none';
        }
        return;
    }

    breadcrumbContainer.style.display = 'block';
    
    const currentPath = window.location.pathname;
    let basePath = currentPath;
    let pathId = null;
    
    const idMatch = currentPath.match(/\/(\d+)$/);
    if (idMatch) {
        pathId = idMatch[1];
        basePath = currentPath.substring(0, currentPath.lastIndexOf('/'));
    }
    
    let pageTitle = getPageTitle(basePath, pathId);
    let history = getStoredHistory();
    
    if (restrictedAccessRoutes[basePath]) {
        history = buildRestrictedAccessHistory(basePath, currentPath, pageTitle, history);
    }
    else if (mainRoutes.includes(basePath)) {
        history = buildMainRouteHistory(currentPath, pageTitle);
    } 
    else if (routeHierarchy[basePath]) {
        history = buildHierarchicalHistory(basePath, currentPath, pageTitle, pathId);
    } 
    else {
        history = buildNavigationalHistory(history, currentPath, pageTitle);
    }
    
    saveHistory(history);
    renderBreadcrumb(history);
}

function buildRestrictedAccessHistory(basePath, currentPath, pageTitle, currentHistory) {
    const requiredParent = restrictedAccessRoutes[basePath];
    
    const hasValidParent = currentHistory.some(item => item.path === requiredParent);
    
    if (hasValidParent) {
        return buildHierarchicalHistory(basePath, currentPath, pageTitle);
    } else {
        const parentTitle = routeMappings[requiredParent] || 'Página Padre';
        return [
            { path: '/index', title: 'Inicio' },
            { path: '/tickets/listado', title: 'Listado de Tickets' },
            { path: requiredParent, title: parentTitle },
            { path: currentPath, title: pageTitle }
        ];
    }
}

function getPageTitle(basePath, pathId) {
    let pageTitle = routeMappings[basePath];
    
    if (!pageTitle) {
        const docTitle = document.title.replace(' - Mesa de Ayuda', '').replace(' - Centro de Soporte', '');
        pageTitle = docTitle || 'Página Actual';
    }
    
    return pageTitle;
}

function getStoredHistory() {
    try {
        const storedHistory = sessionStorage.getItem('breadcrumbHistory');
        return storedHistory && isValidJson(storedHistory) ? JSON.parse(storedHistory) : [];
    } catch (e) {
        return [];
    }
}

function buildMainRouteHistory(currentPath, pageTitle) {
    return [
        { path: '/index', title: 'Inicio' },
        { path: currentPath, title: pageTitle }
    ];
}

function buildHierarchicalHistory(basePath, currentPath, pageTitle, pathId) {
    const hierarchy = routeHierarchy[basePath];
    const history = [{ path: '/index', title: 'Inicio' }];
    
    for (let i = 0; i < hierarchy.length - 1; i++) {
        const parentPath = hierarchy[i];
        const parentTitle = routeMappings[parentPath] || 'Página Padre';
        history.push({ path: parentPath, title: parentTitle });
    }
    
    history.push({ path: currentPath, title: pageTitle });
    
    return history;
}

function buildNavigationalHistory(history, currentPath, pageTitle) {
    const existingIndex = history.findIndex(item => item.path === currentPath);
    
    if (existingIndex !== -1) {
        history = history.slice(0, existingIndex + 1);
    } else {
        if (history.length === 0 || history[history.length - 1].path !== currentPath) {
            history.push({ path: currentPath, title: pageTitle });
        }
        
        if (history.length > 6) {
            const inicio = history[0];
            const restantes = history.slice(-5);
            history = [inicio, ...restantes];
        }
    }
    
    return history;
}

function saveHistory(history) {
    try {
        sessionStorage.setItem('breadcrumbHistory', JSON.stringify(history));
    } catch (e) {
        
    }
}

function renderBreadcrumb(history) {
    const breadcrumbContainer = document.querySelector('.breadcrumb');
    
    if (!breadcrumbContainer) {
        return;
    }
    
    breadcrumbContainer.innerHTML = '';
    
    history.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'breadcrumb-item';
        
        if (index === history.length - 1) {
            li.classList.add('active');
            li.setAttribute('aria-current', 'page');
            li.textContent = item.title;
        } else {
            const a = document.createElement('a');
            a.href = item.path;
            a.textContent = item.title;
            a.title = `Ir a ${item.title}`;
            
            if (isRestrictedRoute(item.path)) {
                a.addEventListener('click', function(e) {
                    handleRestrictedNavigation(e, item.path, index);
                });
            } else {
                a.addEventListener('click', function(e) {
                    navigateToBreadcrumb(e, index);
                });
            }
            
            li.appendChild(a);
        }
        
        breadcrumbContainer.appendChild(li);
    });
}

function isRestrictedRoute(path) {
    return Object.values(restrictedAccessRoutes).includes(path);
}

function handleRestrictedNavigation(event, targetPath, index) {
    event.preventDefault();
    
    const history = getStoredHistory();
    
    if (history && history[index]) {
        const newHistory = history.slice(0, index + 1);
        
        newHistory[newHistory.length - 1].fromRestricted = true;
        
        saveHistory(newHistory);
        window.location.href = targetPath;
    }
}

function navigateToBreadcrumb(event, index) {
    event.preventDefault();
    
    const history = getStoredHistory();
    
    if (history && history[index]) {
        const targetPath = history[index].path;
        
        const newHistory = history.slice(0, index + 1);
        saveHistory(newHistory);
        
        window.location.href = targetPath;
    }
}

function setupNavigationListeners() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) {
        return;
    }
    
    sidebar.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            if (!href || href.startsWith('#') || href.startsWith('http')) {
                return;
            }
            
            if (href === '/tickets/perfil-solicitante') {
                const currentPath = window.location.pathname;
                if (currentPath !== '/tickets/manager') {
                    e.preventDefault();
                    window.location.href = '/tickets/manager';
                    return;
                }
            }
            
            if (mainRoutes.includes(href)) {
                try {
                    sessionStorage.setItem('breadcrumbHistory', JSON.stringify([
                        { path: '/index', title: 'Inicio' }
                    ]));
                } catch (e) {
                    
                }
            } else {
                const currentPath = window.location.pathname;
                if (!excludedRoutes.includes(currentPath)) {
                    updateCurrentPageInHistory();
                }
            }
        });
    });
}

function updateCurrentPageInHistory() {
    const currentPath = window.location.pathname;
    const currentTitle = document.title.replace(' - Mesa de Ayuda', '').replace(' - Centro de Soporte', '');
    
    let history = getStoredHistory();
    
    if (history.length === 0 || history[history.length - 1].path !== currentPath) {
        history.push({ 
            path: currentPath, 
            title: currentTitle || 'Página Actual'
        });
        saveHistory(history);
    }
}

function setupLogoClickListeners() {
    const logoLinks = document.querySelectorAll('.logo-details a, .sidebar a[href="/index"], .sidebar a[href="/"]');
    
    logoLinks.forEach(link => {
        link.addEventListener('click', clearBreadcrumbHistory);
    });
}

function clearBreadcrumbHistory() {
    try {
        sessionStorage.removeItem('breadcrumbHistory');
    } catch (e) {
        
    }
    initBreadcrumb();
}

function isAuthPage() {
    const currentPath = window.location.pathname;
    const currentSearch = window.location.search;
    
    const authRoutes = [
        '/login',
        '/login.html',
        '/registro/nuevo',
        '/registro/recordar',
        '/registro/verificacion',
        '/usuario/cambiar-contrasena',
        '/registro/cambiar-contrasena'
    ];
    
    if (authRoutes.includes(currentPath)) {
        return true;
    }
    
    if (currentPath === '/registro/verificacion' && currentSearch.includes('email=')) {
        return true;
    }
    
    if (currentPath === '/login' && currentSearch.length > 0) {
        return true;
    }
    
    if ((currentPath === '/usuario/cambiar-contrasena' || currentPath === '/registro/cambiar-contrasena') 
        && currentSearch.includes('token=')) {
        return true;
    }
    
    return false;
}

function refreshBreadcrumb() {
    if (shouldShowBreadcrumb()) {
        updateBreadcrumb();
    }
}

window.addEventListener('popstate', function() {
    setTimeout(refreshBreadcrumb, 100);
});

let ultimaConexionActiva = false;

function actualizarUltimaConexion() {
    if (isAuthPage() || !ultimaConexionActiva) {
        return;
    }

    const csrfToken = document.querySelector('input[name="_csrf"]')?.value || 
                     document.querySelector('meta[name="_csrf"]')?.getAttribute('content');
    
    if (!csrfToken) {
        ultimaConexionActiva = false;
        return;
    }

    fetch('/usuario/actualizar-ultima-conexion', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrfToken
        },
        credentials: 'same-origin'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.text();
    })
    .then(responseText => {
        if (responseText && responseText.trim() !== '') {
            try {
                JSON.parse(responseText);
            } catch (jsonError) {
                
            }
        }
    })
    .catch(error => {
        ultimaConexionActiva = false;
        if (intervaloUltimaConexion) {
            clearInterval(intervaloUltimaConexion);
        }
    });
}

let intervaloUltimaConexion;

function iniciarActualizacionConexion() {
    if (isAuthPage()) {
        return;
    }

    const csrfToken = document.querySelector('input[name="_csrf"]')?.value || 
                     document.querySelector('meta[name="_csrf"]')?.getAttribute('content');
    
    if (!csrfToken) {
        return;
    }

    ultimaConexionActiva = true;

    if (intervaloUltimaConexion) {
        clearInterval(intervaloUltimaConexion);
    }

    setTimeout(() => {
        actualizarUltimaConexion();
    }, 1000);
    
    intervaloUltimaConexion = setInterval(actualizarUltimaConexion, 300000);
}

document.addEventListener('visibilitychange', function() {
    if (isAuthPage()) {
        return;
    }

    if (document.visibilityState === 'hidden') {
        ultimaConexionActiva = false;
        if (intervaloUltimaConexion) {
            clearInterval(intervaloUltimaConexion);
        }
    } else {
        iniciarActualizacionConexion();
    }
});

window.addEventListener('beforeunload', function() {
    ultimaConexionActiva = false;
    if (intervaloUltimaConexion) {
        clearInterval(intervaloUltimaConexion);
    }
});

document.addEventListener('DOMContentLoaded', function() {
    if (!isAuthPage()) {
        setTimeout(() => {
            iniciarActualizacionConexion();
        }, 2000);
    }
});

window.breadcrumbUtils = {
    refresh: refreshBreadcrumb,
    clear: clearBreadcrumbHistory,
    shouldShow: shouldShowBreadcrumb
};