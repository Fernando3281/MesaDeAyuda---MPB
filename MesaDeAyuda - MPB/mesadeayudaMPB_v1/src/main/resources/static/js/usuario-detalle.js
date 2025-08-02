document.addEventListener('DOMContentLoaded', function () {
    const modal = document.getElementById('fileModal');
    const modalImage = document.getElementById('modalFileImage');
    const modalPdf = document.getElementById('modalFilePdf');
    const modalFileName = document.getElementById('modalFileName');
    const closeBtn = document.querySelector('.close-modal');
    const fileItems = document.querySelectorAll('.file-item');
    const cancelButton = document.querySelector('.cancel-button');
    const cancelModal = document.getElementById('cancelTicketModal');
    const confirmCancel = document.getElementById('confirmCancel');
    const closeCancelModal = document.getElementById('closeCancelModal');
    const backButton = document.getElementById('ticketDetailsBackButton');

    function storePreviousUrl() {
        const referrer = document.referrer;
        const currentOrigin = window.location.origin;
        const defaultUrl = '/usuario/historial';

        if (referrer && referrer.startsWith(currentOrigin)) {
            sessionStorage.setItem('ticketDetailsPreviousUrl', referrer);
        } else {
            sessionStorage.setItem('ticketDetailsPreviousUrl', defaultUrl);
        }
    }

    function handleBackButtonClick(e) {
        e.preventDefault();
        const previousUrl = sessionStorage.getItem('ticketDetailsPreviousUrl') || '/usuario/historial';
        sessionStorage.removeItem('ticketDetailsPreviousUrl');
        window.location.href = previousUrl;
    }

    if (backButton) {
        storePreviousUrl();
        backButton.addEventListener('click', handleBackButtonClick);
    }

    fileItems.forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();

            const fileSrc = this.getAttribute('data-src');
            const fileType = this.getAttribute('data-type');
            const fileName = this.getAttribute('data-filename');

            modalFileName.textContent = fileName;

            if (fileType === 'image') {
                modalPdf.style.display = 'none';
                modalImage.style.display = 'block';

                const img = new Image();
                img.onload = function () {
                    modalImage.src = fileSrc;
                    showModal();
                };
                img.onerror = function () {
                    alert('No se pudo cargar la imagen. Por favor, inténtelo nuevamente.');
                };
                img.src = fileSrc;
            } else if (fileType === 'pdf') {
                modalImage.style.display = 'none';
                modalPdf.style.display = 'block';

                modalPdf.src = '';

                fetch(fileSrc)
                    .then(response => {
                        if (!response.ok) throw new Error('Network response was not ok');
                        return response.blob();
                    })
                    .then(blob => {
                        const blobUrl = URL.createObjectURL(blob);
                        modalPdf.src = blobUrl + '#toolbar=0&navpanes=0&scrollbar=0';
                        showModal();

                        modalPdf.onload = function () {
                            URL.revokeObjectURL(blobUrl);
                        };
                    })
                    .catch(error => {
                        alert('No se pudo cargar el PDF. Por favor, inténtelo nuevamente.');
                    });
            }
        });
    });

    if (cancelButton) {
        cancelButton.addEventListener('click', function (e) {
            e.preventDefault();
            showCancelModal();
        });
    }

    if (confirmCancel) {
        confirmCancel.addEventListener('click', function () {
            cancelTicket();
        });
    }

    if (closeCancelModal) {
        closeCancelModal.addEventListener('click', function () {
            hideCancelModal();
        });
    }

    function showModal() {
        modal.style.display = 'flex';
    }

    function closeModal() {
        modal.style.display = 'none';
        modalImage.src = '';
        modalPdf.src = '';
    }

    function showCancelModal() {
        cancelModal.style.display = 'flex';
    }

    function hideCancelModal() {
        cancelModal.style.display = 'none';
    }

    function cancelTicket() {
        const ticketId = window.location.pathname.split('/').pop();
        
        confirmCancel.disabled = true;
        confirmCancel.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Procesando...';
        
        fetch(`/tickets/cancelar/${ticketId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': document.querySelector('meta[name="_csrf"]').content
            },
            credentials: 'include'
        })
        .then(response => {
            confirmCancel.disabled = false;
            confirmCancel.textContent = 'Confirmar';
            
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.message || 'Error al cancelar el ticket');
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                hideCancelModal();
                window.location.reload();
            } else {
                throw new Error(data.error || 'Error al cancelar el ticket');
            }
        })
        .catch(error => {
            alert('Error al cancelar el ticket: ' + error.message);
            confirmCancel.disabled = false;
            confirmCancel.textContent = 'Confirmar';
        });
    }

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) {
        if (e.target === modal) closeModal();
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeModal();
    });

    cancelModal.addEventListener('click', function (e) {
        if (e.target === cancelModal) {
            hideCancelModal();
        }
    });

    modalPdf.addEventListener('load', function () {
    });

    modalPdf.addEventListener('error', function () {
        alert('No se pudo cargar el PDF. Por favor, inténtelo nuevamente.');
        closeModal();
    });
});