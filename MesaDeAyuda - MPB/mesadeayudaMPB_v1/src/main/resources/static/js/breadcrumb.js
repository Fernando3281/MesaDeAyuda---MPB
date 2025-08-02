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

// Mapeo de rutas mejorado con rutas específicas por rol
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

// Rutas principales que resetean el breadcrumb
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

// Rutas que no requieren breadcrumb (páginas de autenticación)
const excludedRoutes = [
    '/login',
    '/registro/nuevo',
    '/registro/recordar',
    '/registro/verificacion',
    '/registro/cambiar-contrasena'
];

// Configuración de jerarquías para breadcrumbs contextuales
const routeHierarchy = {
    '/tickets/manager': ['/tickets/listado', '/tickets/manager'],
    '/tickets/atender': ['/tickets/listado', '/tickets/atender'],
    '/tickets/perfil-solicitante': ['/tickets/listado', '/tickets/perfil-solicitante'],
    '/usuario/detalles': ['/usuario/historial', '/usuario/detalles'],
    '/usuario/editar': ['/usuario/perfil', '/usuario/editar'],
    '/usuario/crear': ['/usuario/listado', '/usuario/crear'],
    '/reportes/datos': ['/reportes/listado', '/reportes/datos']
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
        console.warn('Error inicializando breadcrumb:', e);
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
    
    // Extraer ID de la URL si existe
    const idMatch = currentPath.match(/\/(\d+)$/);
    if (idMatch) {
        pathId = idMatch[1];
        basePath = currentPath.substring(0, currentPath.lastIndexOf('/'));
    }
    
    let pageTitle = getPageTitle(basePath, pathId);
    let history = getStoredHistory();
    
    // Verificar si es una ruta principal
    if (mainRoutes.includes(basePath)) {
        history = buildMainRouteHistory(currentPath, pageTitle);
    } else if (routeHierarchy[basePath]) {
        history = buildHierarchicalHistory(basePath, currentPath, pageTitle, pathId);
    } else {
        history = buildNavigationalHistory(history, currentPath, pageTitle);
    }
    
    saveHistory(history);
    renderBreadcrumb(history);
}

function getPageTitle(basePath, pathId) {
    let pageTitle = routeMappings[basePath];
    
    if (!pageTitle) {
        // Intentar obtener el título del documento
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
        console.warn('Error recuperando historial:', e);
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
    
    // Agregar rutas padre
    for (let i = 0; i < hierarchy.length - 1; i++) {
        const parentPath = hierarchy[i];
        const parentTitle = routeMappings[parentPath] || 'Página Padre';
        history.push({ path: parentPath, title: parentTitle });
    }
    
    // Agregar página actual
    history.push({ path: currentPath, title: pageTitle });
    
    return history;
}

function buildNavigationalHistory(history, currentPath, pageTitle) {
    const existingIndex = history.findIndex(item => item.path === currentPath);
    
    if (existingIndex !== -1) {
        // Si ya existe en el historial, cortar hasta esa posición
        history = history.slice(0, existingIndex + 1);
    } else {
        // Agregar nueva página al historial
        if (history.length === 0 || history[history.length - 1].path !== currentPath) {
            history.push({ path: currentPath, title: pageTitle });
        }
        
        // Limitar el historial a máximo 6 elementos (incluyendo Inicio)
        if (history.length > 6) {
            // Mantener siempre "Inicio" como primer elemento
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
        console.warn('Error guardando historial:', e);
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
            // Último elemento (activo)
            li.classList.add('active');
            li.setAttribute('aria-current', 'page');
            li.textContent = item.title;
        } else {
            // Elementos navegables
            const a = document.createElement('a');
            a.href = item.path;
            a.textContent = item.title;
            a.title = `Ir a ${item.title}`;
            a.addEventListener('click', function(e) {
                navigateToBreadcrumb(e, index);
            });
            li.appendChild(a);
        }
        
        breadcrumbContainer.appendChild(li);
    });
}

function navigateToBreadcrumb(event, index) {
    event.preventDefault();
    
    const history = getStoredHistory();
    
    if (history && history[index]) {
        const targetPath = history[index].path;
        
        // Actualizar historial cortando hasta el elemento seleccionado
        const newHistory = history.slice(0, index + 1);
        saveHistory(newHistory);
        
        // Navegar a la ruta
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
            
            // No procesar enlaces externos o con # 
            if (!href || href.startsWith('#') || href.startsWith('http')) {
                return;
            }
            
            if (mainRoutes.includes(href)) {
                // Resetear historial para rutas principales
                try {
                    sessionStorage.setItem('breadcrumbHistory', JSON.stringify([
                        { path: '/index', title: 'Inicio' }
                    ]));
                } catch (e) {
                    console.warn('Error reseteando historial:', e);
                }
            } else {
                // Agregar página actual al historial antes de navegar
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
        console.warn('Error limpiando historial:', e);
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
    
    // Verificaciones adicionales con parámetros
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

// Función para actualizar breadcrumb cuando el DOM cambia (útil para SPAs)
function refreshBreadcrumb() {
    if (shouldShowBreadcrumb()) {
        updateBreadcrumb();
    }
}

// Escuchar cambios de URL para SPAs (si se implementa en el futuro)
window.addEventListener('popstate', function() {
    setTimeout(refreshBreadcrumb, 100);
});

// Funciones de conexión (mantenidas del código original)
function actualizarUltimaConexion() {
    if (isAuthPage()) {
        return;
    }

    const csrfToken = document.querySelector('input[name="_csrf"]')?.value || 
                     document.querySelector('meta[name="_csrf"]')?.getAttribute('content');
    
    if (!csrfToken) {
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
                console.debug('Respuesta no es JSON válido:', responseText);
            }
        }
    })
    .catch(error => {
        console.debug('Error actualizando conexión:', error);
    });
}

let intervaloUltimaConexion;

function iniciarActualizacionConexion() {
    if (isAuthPage()) {
        return;
    }

    if (intervaloUltimaConexion) {
        clearInterval(intervaloUltimaConexion);
    }

    // Primera actualización después de 1 segundo
    setTimeout(() => {
        actualizarUltimaConexion();
    }, 1000);
    
    // Actualización cada 5 minutos
    intervaloUltimaConexion = setInterval(actualizarUltimaConexion, 300000);
}

// Event listeners para manejo de visibilidad y cierre
document.addEventListener('visibilitychange', function() {
    if (isAuthPage()) {
        return;
    }

    if (document.visibilityState === 'hidden') {
        if (intervaloUltimaConexion) {
            clearInterval(intervaloUltimaConexion);
        }
    } else {
        iniciarActualizacionConexion();
    }
});

window.addEventListener('beforeunload', function() {
    if (intervaloUltimaConexion) {
        clearInterval(intervaloUltimaConexion);
    }
});

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
    if (!isAuthPage()) {
        setTimeout(() => {
            iniciarActualizacionConexion();
        }, 2000);
    }
});

// Exportar funciones para uso externo si es necesario
window.breadcrumbUtils = {
    refresh: refreshBreadcrumb,
    clear: clearBreadcrumbHistory,
    shouldShow: shouldShowBreadcrumb
};