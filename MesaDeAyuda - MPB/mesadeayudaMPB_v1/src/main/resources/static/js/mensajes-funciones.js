let refreshInterval;
let refreshChatListInterval;
let ultimoMensajeId = 0;
let ticketActualId = null;
let estaCargando = false;
let ultimaActualizacionChats = 0;
let chatsActuales = [];
let eventSource = null;
let reconnectAttempts = 0;
let maxReconnectAttempts = 3;
let sseReconnectDelay = 5000;

function getCsrfToken() {
    return document.querySelector('meta[name="_csrf_token"]').getAttribute('content');
}

function getCsrfHeader() {
    return document.querySelector('meta[name="_csrf_header"]').getAttribute('content');
}

function formatDateWithIcon(dateString) {
    if (!dateString)
        return '';
    const date = new Date(dateString);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
        return `<i class="fa-regular fa-clock" style="margin-right: 5px;"></i>Hoy ${date.toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'})}`;
    }
    return `<i class="fa-regular fa-clock" style="margin-right: 5px;"></i>${date.toLocaleDateString('es-ES', {day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'})}`;
}

function iniciarVerificacionPeriodica() {
    detenerVerificacionPeriodica();
    refreshInterval = setInterval(verificarNuevosMensajes, 60000);
    refreshChatListInterval = setInterval(verificarNuevosChats, 60000);
    verificarNuevosMensajes();
    verificarNuevosChats();
}

function detenerVerificacionPeriodica() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
    if (refreshChatListInterval) {
        clearInterval(refreshChatListInterval);
        refreshChatListInterval = null;
    }
}

function verificarNuevosMensajes() {
    if (!ticketActualId || ultimoMensajeId === 0 || estaCargando)
        return;

    const timestamp = new Date().getTime();

    fetch(`/mensajes/verificar-nuevos/${ticketActualId}?ultimoMensajeId=${ultimoMensajeId}&_=${timestamp}`, {
        headers: {
            'Content-Type': 'application/json',
            [getCsrfHeader()]: getCsrfToken()
        },
        cache: 'no-store'
    })
            .then(response => {
                if (!response.ok)
                    throw new Error('Error en la verificación');
                return response.json();
            })
            .then(data => {
                if (data.success && data.hayNuevos) {
                    const activeTicketElement = document.querySelector('.ticket-item.active');
                    if (activeTicketElement) {
                        estaCargando = true;
                        loadMessages(ticketActualId, activeTicketElement)
                                .finally(() => {
                                    estaCargando = false;
                                });
                    }
                }
            })
            .catch(error => {
                console.error('Error al verificar nuevos mensajes:', error);
            });
}

function verificarNuevosChats() {
    if (estaCargando) {
        return;
    }

    const timestamp = new Date().getTime();
    if (timestamp - ultimaActualizacionChats < 5000) {
        return;
    }

    estaCargando = true;
    ultimaActualizacionChats = timestamp;

    fetch(`/mensajes/tickets/actualizados?_=${timestamp}`, {
        headers: {
            'Content-Type': 'application/json',
            [getCsrfHeader()]: getCsrfToken()
        },
        cache: 'no-store'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (!data.success) {
            throw new Error(data.error || 'Error al verificar chats');
        }

        const nuevosChats = data.tickets;
        const hayCambios = JSON.stringify(nuevosChats) !== JSON.stringify(chatsActuales);

        if (hayCambios) {
            chatsActuales = nuevosChats;
            actualizarListaChats(data.tickets);

            if (ticketActualId) {
                const ticketActualizado = nuevosChats.find(t => t.id === ticketActualId);
                if (ticketActualizado) {
                    actualizarEstadoTicketUI(ticketActualizado);
                }
            }
        }
    })
    .catch(error => {
        console.error('Error al verificar nuevos chats:', error);
        setTimeout(verificarNuevosChats, 10000);
    })
    .finally(() => {
        estaCargando = false;
    });
}

function actualizarListaChats(tickets) {
    const ticketsListContainer = document.querySelector('.tickets-list-container');
    if (!ticketsListContainer)
        return;

    const currentActiveId = ticketActualId;
    const scrollPos = ticketsListContainer.scrollTop;
    const searchTerm = document.getElementById('ticketSearch')?.value || '';

    if (tickets.length === 0) {
        ticketsListContainer.innerHTML = `
            <div class="no-messages-container">
                <i class="fas fa-inbox no-messages-icon"></i>
                <h3 class="no-messages-title">No tienes tickets</h3>
                <p class="no-messages-description">
                    Actualmente no tienes tickets con mensajes. Cuando crees o recibas un ticket, 
                    aparecerá en esta sección.
                </p>
                <a href="/tickets/nuevo" class="no-messages-action">
                    <i class="fas fa-plus"></i> Crear nuevo ticket
                </a>
            </div>`;
        return;
    }

    const fragment = document.createDocumentFragment();
    let hasActiveTicket = false;

    tickets.forEach(ticket => {
        const isActive = currentActiveId === ticket.id;
        if (isActive)
            hasActiveTicket = true;

        const ticketElement = document.createElement('div');
        ticketElement.className = `ticket-item ${isActive ? 'active' : ''}`;
        ticketElement.id = `ticket-${ticket.id}`;
        ticketElement.onclick = () => loadMessages(ticket.id, ticketElement);
        ticketElement.innerHTML = `
            <span class="ticket-code">${ticket.codigo}</span>
            <span class="ticket-title">${ticket.titulo}</span>
            <div class="ticket-metadata">
                <span class="ticket-status">${ticket.estado}</span>
                <span class="ticket-date">${formatDateWithIcon(ticket.fechaActualizacion)}</span>
            </div>
        `;

        const matchesSearch = !searchTerm ||
                ticket.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ticket.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ticket.estado.toLowerCase().includes(searchTerm.toLowerCase());

        ticketElement.style.display = matchesSearch ? 'flex' : 'none';
        fragment.appendChild(ticketElement);
    });

    ticketsListContainer.innerHTML = '';
    ticketsListContainer.appendChild(fragment);
    ticketsListContainer.scrollTop = scrollPos;

    if (currentActiveId && !hasActiveTicket) {
        clearMessageView();
    }
}

function actualizarEstadoTicketUI(ticketData) {
    if (!ticketData || !ticketActualId)
        return;

    const ticketElement = document.getElementById(`ticket-${ticketData.id}`);
    if (ticketElement) {
        const statusElement = ticketElement.querySelector('.ticket-status');
        const dateElement = ticketElement.querySelector('.ticket-date');

        if (statusElement)
            statusElement.textContent = ticketData.estado;
        if (dateElement)
            dateElement.innerHTML = formatDateWithIcon(ticketData.fechaActualizacion);
    }

    const ticketStatusElement = document.getElementById('ticketStatus');
    if (ticketStatusElement) {
        ticketStatusElement.textContent = ticketData.estado;
    }

    const sendButton = document.getElementById('sendButton');
    if (sendButton) {
        const usuarioRol = document.getElementById('usuarioRol')?.value || '';

        if (ticketData.estado === 'Desactivado') {
            sendButton.disabled = true;
            sendButton.title = 'No se pueden enviar mensajes en un ticket desactivado';
        } else if (ticketData.estado === 'Cerrado') {
            if (usuarioRol.includes('ROL_ADMINISTRADOR') || usuarioRol.includes('ROL_SOPORTISTA')) {
                sendButton.disabled = false;
                sendButton.title = '';
            } else {
                sendButton.disabled = true;
                sendButton.title = 'Solo administradores o soportistas pueden enviar mensajes en un ticket cerrado';
            }
        } else {
            sendButton.disabled = false;
            sendButton.title = '';
        }
    }
}

function clearMessageView() {
    ticketActualId = null;
    ultimoMensajeId = 0;
    updateSelectionState(false);
    detenerVerificacionPeriodica();
}

function updateSelectionState(hasSelection, ticketData = null) {
    const messagesHeader = document.getElementById('messagesHeader');
    const messageInputArea = document.getElementById('messageInputArea');
    const noSelectionPlaceholder = document.getElementById('noSelectionPlaceholder');
    const noMessagesPlaceholder = document.getElementById('noMessagesPlaceholder');
    const messagesArea = document.getElementById('messagesArea');
    const sendButton = document.getElementById('sendButton');
    const usuarioRol = document.getElementById('usuarioRol')?.value || '';

    if (hasSelection && ticketData) {
        messagesHeader.style.display = 'block';
        messageInputArea.style.display = 'flex';
        noSelectionPlaceholder.style.display = 'none';
        messagesArea.classList.add('has-selected');

        document.getElementById('ticketTitleMain').textContent = ticketData.titulo;

        const ticketDetailsHTML = `
            <span>Código: <strong>${ticketData.codigo}</strong></span>
            <span>Estado: <strong>${ticketData.estado}</strong></span>
            <span>Prioridad: <strong>${ticketData.prioridad}</strong></span>
            <span>Categoría: <strong>${ticketData.categoria}</strong></span>
        `;

        document.getElementById('ticketDetails').innerHTML = ticketDetailsHTML;

        if (ticketData.estado === 'Desactivado') {
            sendButton.disabled = true;
            sendButton.title = 'No se pueden enviar mensajes en un ticket desactivado';
        } else if (ticketData.estado === 'Cerrado') {
            if (usuarioRol.includes('ROL_ADMINISTRADOR') || usuarioRol.includes('ROL_SOPORTISTA')) {
                sendButton.disabled = false;
                sendButton.title = '';
            } else {
                sendButton.disabled = true;
                sendButton.title = 'Solo administradores o soportistas pueden enviar mensajes en un ticket cerrado';
            }
        } else {
            sendButton.disabled = false;
            sendButton.title = '';
        }
    } else {
        messagesHeader.style.display = 'none';
        messageInputArea.style.display = 'none';
        noSelectionPlaceholder.style.display = 'block';
        noMessagesPlaceholder.style.display = 'none';
        messagesArea.classList.remove('has-selected');
        sendButton.disabled = true;

        detenerVerificacionPeriodica();
        ticketActualId = null;
        ultimoMensajeId = 0;
    }
}

function loadMessages(ticketId, element) {
    if ((element && element.classList.contains('active') && !estaCargando) ||
        (ticketId === ticketActualId && !estaCargando)) {
        return Promise.resolve();
    }

    estaCargando = true;
    const messagesList = document.getElementById('messagesList');
    messagesList.innerHTML = '<div class="loading-messages">Cargando mensajes...</div>';

    document.querySelectorAll('.ticket-item').forEach(item => {
        item.classList.remove('active');
    });

    if (element) {
        element.classList.add('active');
    }

    const timestamp = new Date().getTime();

    return fetch(`/mensajes/cargar/${ticketId}?_=${timestamp}`, {
        headers: {
            'Content-Type': 'application/json',
            [getCsrfHeader()]: getCsrfToken()
        },
        cache: 'no-store'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (!data.success) {
            throw new Error(data.error || 'Error al cargar los mensajes');
        }

        ticketActualId = ticketId;
        ultimoMensajeId = data.mensajes?.length > 0 
            ? Math.max(...data.mensajes.map(m => m.id)) 
            : 0;

        iniciarVerificacionPeriodica();
        updateSelectionState(true, data.ticket);
        renderMessages(data.mensajes || []);

        const ticketElement = document.getElementById(`ticket-${ticketId}`);
        if (ticketElement) {
            const dateElement = ticketElement.querySelector('.ticket-date');
            if (dateElement) {
                dateElement.innerHTML = formatDateWithIcon(data.ticket.fechaActualizacion);
            }
        }

        setTimeout(() => {
            messagesList.scrollTop = messagesList.scrollHeight;
        }, 100);
    })
    .catch(error => {
        console.error('Error al cargar mensajes:', error);
        showError('Error al cargar los mensajes. Por favor intente nuevamente.');
        clearMessageView();
        return Promise.reject(error);
    })
    .finally(() => {
        estaCargando = false;
    });
}

function renderMessages(messages) {
    const messagesList = document.getElementById('messagesList');
    const noMessagesPlaceholder = document.getElementById('noMessagesPlaceholder');

    if (messages.length === 0) {
        if (noMessagesPlaceholder) {
            noMessagesPlaceholder.style.display = 'block';
        }
        messagesList.innerHTML = '';
        return;
    }

    if (noMessagesPlaceholder) {
        noMessagesPlaceholder.style.display = 'none';
    }

    messagesList.innerHTML = '';

    messages.forEach(message => {
        const messageDiv = document.createElement('div');
        messageDiv.className = message.esMio ? 'message-container my-message' : 'message-container other-message';

        const avatar = document.createElement('img');
        avatar.className = 'message-avatar';
        avatar.src = '/usuario/imagen/' + message.emisor.id;
        avatar.alt = message.emisor.nombre;
        avatar.onerror = function () {
            this.src = '/img/ImagenDefaultPerfil.jpg';
        };

        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'message-content-wrapper';

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';

        const messageHeader = document.createElement('div');
        messageHeader.className = 'message-header';

        const senderName = document.createElement('span');
        senderName.className = 'sender-name';
        senderName.textContent = message.emisor.nombre + ' ' + message.emisor.apellido;

        if (message.emisor.rol.includes('ROL_ADMINISTRADOR')) {
            senderName.classList.add('role-admin');
        } else if (message.emisor.rol.includes('ROL_SOPORTISTA')) {
            senderName.classList.add('role-soporte');
        }

        const messageTime = document.createElement('span');
        messageTime.className = 'message-time';
        messageTime.innerHTML = formatDateWithIcon(message.fecha);

        messageHeader.appendChild(senderName);
        messageHeader.appendChild(messageTime);

        const messageText = document.createElement('div');
        messageText.className = 'message-text';
        messageText.innerHTML = message.contenido;

        if (message.esNotaInterna) {
            messageContent.classList.add('internal-note');
            const internalNote = document.createElement('span');
            internalNote.className = 'internal-note-badge';
            internalNote.textContent = 'Nota Interna';
            messageHeader.appendChild(internalNote);
        }

        messageContent.appendChild(messageHeader);
        messageContent.appendChild(messageText);
        contentWrapper.appendChild(messageContent);

        if (message.esMio) {
            messageDiv.appendChild(contentWrapper);
            messageDiv.appendChild(avatar);
        } else {
            messageDiv.appendChild(avatar);
            messageDiv.appendChild(contentWrapper);
        }

        messagesList.appendChild(messageDiv);
    });

    setTimeout(() => {
        messagesList.scrollTop = messagesList.scrollHeight;
    }, 0);
}

function showError(message) {
    const messagesList = document.getElementById('messagesList');
    const noMessagesPlaceholder = document.getElementById('noMessagesPlaceholder');

    if (noMessagesPlaceholder) {
        noMessagesPlaceholder.style.display = 'none';
    }

    messagesList.innerHTML = `<div class="no-messages" style="color: #f44336; text-align: center; padding: 20px;">${message}</div>`;
}

function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const message = messageInput.value.trim();

    if (message === '') {
        messageInput.focus();
        return;
    }

    if (sendButton.disabled) {
        showError('No puedes enviar mensajes en este ticket debido a su estado.');
        return;
    }

    const activeTicket = document.querySelector('.ticket-item.active');
    if (!activeTicket) {
        showError('No hay un ticket seleccionado');
        sendButton.disabled = false;
        sendButton.textContent = 'Enviar';
        return;
    }

    const ticketId = activeTicket.id.replace('ticket-', '');

    const originalButtonText = sendButton.textContent;
    sendButton.disabled = true;
    sendButton.textContent = 'Enviando...';

    fetch('/mensajes/enviar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            [getCsrfHeader()]: getCsrfToken()
        },
        body: JSON.stringify({
            ticketId: ticketId,
            contenido: message
        })
    })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error en la respuesta del servidor');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    messageInput.value = '';
                    messageInput.style.height = 'auto';
                    messageInput.focus();

                    const messagesList = document.getElementById('messagesList');
                    const noMessagesPlaceholder = document.getElementById('noMessagesPlaceholder');
                    if (noMessagesPlaceholder) {
                        noMessagesPlaceholder.style.display = 'none';
                    }

                    const newMessage = data.nuevoMensaje;
                    renderSingleMessage(newMessage, messagesList);

                    if (newMessage && newMessage.id) {
                        ultimoMensajeId = newMessage.id;
                    }

                    updateTicketItem(ticketId, newMessage.fecha);

                    setTimeout(() => {
                        messagesList.scrollTop = messagesList.scrollHeight;
                    }, 0);
                } else {
                    showError(data.error || 'Error al enviar el mensaje');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showError('Error al enviar el mensaje. Por favor intente nuevamente.');
            })
            .finally(() => {
                sendButton.disabled = false;
                sendButton.textContent = originalButtonText;
            });
}

function renderSingleMessage(message, container) {
    const messageDiv = document.createElement('div');
    messageDiv.className = message.esMio ? 'message-container my-message' : 'message-container other-message';

    const avatar = document.createElement('img');
    avatar.className = 'message-avatar';
    avatar.src = '/usuario/imagen/' + message.emisor.id;
    avatar.alt = message.emisor.nombre;
    avatar.onerror = function () {
        this.src = '/img/ImagenDefaultPerfil.jpg';
    };

    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'message-content-wrapper';

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';

    const messageHeader = document.createElement('div');
    messageHeader.className = 'message-header';

    const senderName = document.createElement('span');
    senderName.className = 'sender-name';
    senderName.textContent = message.emisor.nombre + ' ' + message.emisor.apellido;

    if (message.emisor.rol.includes('ROL_ADMINISTRADOR')) {
        senderName.classList.add('role-admin');
    } else if (message.emisor.rol.includes('ROL_SOPORTISTA')) {
        senderName.classList.add('role-soporte');
    }

    const messageTime = document.createElement('span');
    messageTime.className = 'message-time';
    messageTime.innerHTML = formatDateWithIcon(message.fecha);

    messageHeader.appendChild(senderName);
    messageHeader.appendChild(messageTime);

    const messageText = document.createElement('div');
    messageText.className = 'message-text';
    messageText.innerHTML = message.contenido;

    if (message.esNotaInterna) {
        messageContent.classList.add('internal-note');
        const internalNote = document.createElement('span');
        internalNote.className = 'internal-note-badge';
        internalNote.textContent = 'Nota Interna';
        messageHeader.appendChild(internalNote);
    }

    messageContent.appendChild(messageHeader);
    messageContent.appendChild(messageText);
    contentWrapper.appendChild(messageContent);

    if (message.esMio) {
        messageDiv.appendChild(contentWrapper);
        messageDiv.appendChild(avatar);
    } else {
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(contentWrapper);
    }

    container.appendChild(messageDiv);
}

function updateTicketItem(ticketId, newDate) {
    const ticketElement = document.getElementById(`ticket-${ticketId}`);
    if (ticketElement) {
        const dateElement = ticketElement.querySelector('.ticket-date');
        if (dateElement) {
            dateElement.innerHTML = formatDateWithIcon(newDate);
        }

        const ticketsListContainer = ticketElement.parentNode;
        if (ticketsListContainer.firstChild !== ticketElement) {
            ticketsListContainer.insertBefore(ticketElement, ticketsListContainer.firstChild);
        }

        saveTicketsOrder();
    }
}

function saveTicketsOrder() {
    try {
        const tickets = Array.from(document.querySelectorAll('.ticket-item')).map(ticket => ({
                id: ticket.id.replace('ticket-', ''),
                isActive: ticket.classList.contains('active')
            }));
        localStorage.setItem('ticketsOrder', JSON.stringify(tickets));
    } catch (error) {
        console.warn('No se pudo guardar el orden de tickets en localStorage:', error);
    }
}

function applySavedOrder() {
    try {
        const savedOrder = localStorage.getItem('ticketsOrder');
        if (!savedOrder)
            return;

        const ticketsOrder = JSON.parse(savedOrder);
        const ticketsListContainer = document.querySelector('.tickets-list-container');
        if (!ticketsListContainer)
            return;

        ticketsOrder.forEach(ticketInfo => {
            const ticketElement = document.getElementById(`ticket-${ticketInfo.id}`);
            if (ticketElement) {
                ticketElement.classList.remove('active');
                ticketsListContainer.appendChild(ticketElement);
            }
        });
    } catch (error) {
        console.warn('No se pudo aplicar el orden guardado de tickets:', error);
    }
}

function handleTextareaResize(textarea) {
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 120);
    textarea.style.height = newHeight + 'px';
}

function filterTickets(searchTerm) {
    const tickets = document.querySelectorAll('.ticket-item');
    const normalizedSearch = searchTerm.toLowerCase().trim();

    tickets.forEach(ticket => {
        const title = ticket.querySelector('.ticket-title').textContent.toLowerCase();
        const code = ticket.querySelector('.ticket-code').textContent.toLowerCase();
        const status = ticket.querySelector('.ticket-status').textContent.toLowerCase();

        const matches = title.includes(normalizedSearch) ||
                code.includes(normalizedSearch) ||
                status.includes(normalizedSearch);

        ticket.style.display = matches ? 'flex' : 'none';
    });
}

document.addEventListener('DOMContentLoaded', function () {
    updateSelectionState(false);

    verificarNuevosChats();

    const sendButton = document.getElementById('sendButton');
    if (sendButton) {
        sendButton.addEventListener('click', sendMessage);
        sendButton.disabled = true;
    }

    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        messageInput.addEventListener('input', function () {
            handleTextareaResize(this);
        });

        messageInput.addEventListener('paste', function () {
            setTimeout(() => {
                handleTextareaResize(this);
            }, 10);
        });
    }

    const ticketSearch = document.getElementById('ticketSearch');
    if (ticketSearch) {
        let searchTimeout;

        ticketSearch.addEventListener('input', function () {
            clearTimeout(searchTimeout);
            const searchTerm = this.value;

            searchTimeout = setTimeout(() => {
                filterTickets(searchTerm);
            }, 300);
        });

        ticketSearch.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                this.value = '';
                filterTickets('');
                this.blur();
            }
        });
    }

    window.addEventListener('beforeunload', detenerVerificacionPeriodica);
    window.addEventListener('unload', detenerVerificacionPeriodica);
    
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            if (refreshInterval) {
                clearInterval(refreshInterval);
                refreshInterval = setInterval(verificarNuevosMensajes, 30000);
            }
            if (refreshChatListInterval) {
                clearInterval(refreshChatListInterval);
                refreshChatListInterval = setInterval(verificarNuevosChats, 60000);
            }
        } else {
            if (ticketActualId) {
                iniciarVerificacionPeriodica();
            }
        }
    });
});