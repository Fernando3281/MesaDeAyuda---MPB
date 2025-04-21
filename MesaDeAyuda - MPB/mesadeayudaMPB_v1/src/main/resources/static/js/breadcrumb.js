// breadcrumb.js
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar el sistema de breadcrumb
    initBreadcrumb();

    // Actualizar el breadcrumb con la página actual
    updateBreadcrumb();
});

// Objeto con las rutas y sus titulos
const routeMappings = {
    '/index': 'Inicio',
    '/tickets/nuevo': 'Nuevo Ticket',
    '/tickets/listado': 'Mis Tickets',
    '/tickets/manager': 'Gestion de Ticket',
    '/tickets/perfil-solicitante': 'Perfil del Solicitante',
    '/usuario/historial': 'Historial',
    '/mensajes/inbox': 'Mensajes',
    '/tickets/reporte-manager': 'Reportes',
    '/usuario/configuracion': 'Ajustes',
    '/usuario/perfil': 'Mi Perfil',
    '/usuario/editar': 'Editar Perfil',
    '/usuario/listado': 'Gestión de Usuarios',
    '/departamento/listado': 'Gestión de Departamentos',
    '/usuario/crear': 'Crear Usuario',
    '/usuario/detalles': 'Detalles de Usuario'
};

// Lista de rutas principales que deben reiniciar el breadcrumb al "Inicio"
const mainRoutes = [
    '/tickets/nuevo',
    '/tickets/listado',
    '/usuario/historial',
    '/mensajes/inbox',
    '/usuario/configuracion',
    '/usuario/perfil'
];

// Función para inicializar el breadcrumb
function initBreadcrumb() {
    // Si no existe el historial en sessionStorage, crearlo
    if (!sessionStorage.getItem('breadcrumbHistory')) {
        sessionStorage.setItem('breadcrumbHistory', JSON.stringify([
            { path: '/index', title: 'Inicio' }
        ]));
    }
}

// Función para actualizar el breadcrumb con la página actual
function updateBreadcrumb() {
    // Obtener la ruta actual
    const currentPath = window.location.pathname;
    
    // Verificar si la ruta actual incluye un ID (para detalles)
    let basePath = currentPath;
    let pathId = null;
    
    // Extraer el ID si existe en la ruta (por ejemplo: /usuario/detalles/1)
    const idMatch = currentPath.match(/\/(\d+)$/);
    if (idMatch) {
        pathId = idMatch[1];
        basePath = currentPath.substring(0, currentPath.lastIndexOf('/'));
    }
    
    // Obtener el título de la página actual o usar un valor predeterminado
    let pageTitle = getPageTitle(basePath, pathId);
    
    // Obtener el historial existente
    let history = JSON.parse(sessionStorage.getItem('breadcrumbHistory')) || [];
    
    // Verificar si la ruta actual es una de las rutas principales
    if (mainRoutes.includes(basePath)) {
        // Reiniciar el breadcrumb a "Inicio" + ruta actual
        history = [
            { path: '/index', title: 'Inicio' },
            { path: currentPath, title: pageTitle }
        ];
    } else {
        // Verificar si ya estamos en esta ruta
        const existingIndex = history.findIndex(item => item.path === currentPath);
        
        if (existingIndex !== -1) {
            // Si ya estamos en esta ruta, eliminar todas las rutas posteriores
            history = history.slice(0, existingIndex + 1);
        } else {
            // Si es una nueva ruta, agregarla al historial
            // Evitar duplicados consecutivos
            if (history.length === 0 || history[history.length - 1].path !== currentPath) {
                history.push({ path: currentPath, title: pageTitle });
            }
            
            // Limitar el historial a las últimas 5 rutas
            if (history.length > 5) {
                history = history.slice(history.length - 5);
            }
        }
    }
    
    // Guardar el historial actualizado
    sessionStorage.setItem('breadcrumbHistory', JSON.stringify(history));
    
    // Renderizar el breadcrumb
    renderBreadcrumb(history);
}

// Función para obtener el título de la página actual
function getPageTitle(path, id) {
    // Casos especiales para rutas con IDs
    if (path === '/usuario/detalles' && id) {
        return 'Detalles del Ticket';
    }
    
    // Buscar en el mapeo de rutas
    return routeMappings[path] || 'Página Actual';
}

// Función para renderizar el breadcrumb
function renderBreadcrumb(history) {
    const breadcrumbContainer = document.querySelector('.breadcrumb');
    
    if (!breadcrumbContainer) {
        console.error('No se encontró el contenedor de breadcrumb');
        return;
    }
    
    // Limpiar el breadcrumb actual
    breadcrumbContainer.innerHTML = '';
    
    // Agregar cada elemento al breadcrumb
    history.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'breadcrumb-item';
        
        if (index === history.length - 1) {
            // El último elemento es el actual (activo)
            li.classList.add('active');
            li.setAttribute('aria-current', 'page');
            li.textContent = item.title;
        } else {
            // Los elementos anteriores son enlaces
            const a = document.createElement('a');
            a.href = item.path;
            a.textContent = item.title;
            a.addEventListener('click', function(e) {
                navigateToBreadcrumb(e, index);
            });
            li.appendChild(a);
        }
        
        breadcrumbContainer.appendChild(li);
    });
}

// Función para navegar a una ruta específica del breadcrumb
function navigateToBreadcrumb(event, index) {
    event.preventDefault();
    
    const history = JSON.parse(sessionStorage.getItem('breadcrumbHistory'));
    
    if (history && history[index]) {
        // Truncar el historial hasta el índice seleccionado
        const newHistory = history.slice(0, index + 1);
        sessionStorage.setItem('breadcrumbHistory', JSON.stringify(newHistory));
        
        // Navegar a la ruta
        window.location.href = history[index].path;
    }
}

// Función para agregar un listener a todos los enlaces de navegación
function setupNavigationListeners() {
    // Capturar clics en enlaces del sidebar
    document.querySelectorAll('.sidebar a').forEach(link => {
        link.addEventListener('click', function() {
            // Verificar si es un enlace a una ruta principal
            const href = this.getAttribute('href');
            if (mainRoutes.includes(href)) {
                // Si es una ruta principal, reiniciar el breadcrumb
                sessionStorage.setItem('breadcrumbHistory', JSON.stringify([
                    { path: '/index', title: 'Inicio' }
                ]));
            } else {
                // Comportamiento normal para otras rutas
                const currentPath = window.location.pathname;
                let history = JSON.parse(sessionStorage.getItem('breadcrumbHistory')) || [];
                
                // Evitar duplicados consecutivos
                if (history.length === 0 || history[history.length - 1].path !== currentPath) {
                    history.push({ 
                        path: currentPath, 
                        title: document.title.replace(' - Mesa de Ayuda', '') 
                    });
                    sessionStorage.setItem('breadcrumbHistory', JSON.stringify(history));
                }
            }
        });
    });
}

// Ejecutar la configuración de los listeners cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', setupNavigationListeners);

// Función para limpiar el historial de breadcrumb
function clearBreadcrumbHistory() {
    sessionStorage.removeItem('breadcrumbHistory');
    initBreadcrumb();
    updateBreadcrumb();
}

// Resetear el breadcrumb cuando se hace clic en el logo o inicio
document.addEventListener('DOMContentLoaded', function() {
    const logoLinks = document.querySelectorAll('.logo-details a, .sidebar a[href="/index"]');
    logoLinks.forEach(link => {
        link.addEventListener('click', clearBreadcrumbHistory);
    });
});