var estadoTickets6m = {};
var estadoTickets1y = {};
var estadoTickets3m = {};
let ticketsChart;

document.addEventListener('DOMContentLoaded', function () {
    const chartElement = document.getElementById('ticketsChart');
    if (chartElement) {
        initializeCharts();
        updateStats();
        setInterval(updateStats, 30000);
    }
});

function initializeCharts() {
    const chartElement = document.getElementById('ticketsChart');
    if (!chartElement) return;

    const ctx1 = chartElement.getContext('2d');
    const labels = Object.keys(estadoTickets6m);
    const dataPendientes = labels.map(mes => estadoTickets6m[mes]?.Pendientes || 0);
    const dataResueltos = labels.map(mes => estadoTickets6m[mes]?.Resueltos || 0);

    ticketsChart = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Tickets Pendientes',
                data: dataPendientes,
                borderColor: '#11214D',
                backgroundColor: 'rgba(17, 33, 77, 0.1)',
                tension: 0.4,
                fill: true
            }, {
                label: 'Tickets Resueltos',
                data: dataResueltos,
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        title: function (context) {
                            return context[0].label;
                        },
                        label: function (context) {
                            return context.dataset.label + ': ' + context.parsed.y + ' tickets';
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    },
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

function updateChart() {
    const period = document.getElementById('chartPeriod').value;
    let dataSet;

    switch (period) {
        case 'year':
            dataSet = estadoTickets1y;
            break;
        case 'quarter':
            dataSet = estadoTickets3m;
            break;
        default:
            dataSet = estadoTickets6m;
    }

    const hasData = dataSet && Object.keys(dataSet).length > 0;

    if (hasData) {
        const labels = Object.keys(dataSet);
        const dataPendientes = labels.map(mes => dataSet[mes]?.Pendientes || 0);
        const dataResueltos = labels.map(mes => dataSet[mes]?.Resueltos || 0);

        ticketsChart.data.labels = labels;
        ticketsChart.data.datasets[0].data = dataPendientes;
        ticketsChart.data.datasets[1].data = dataResueltos;

        const chartContainer = document.querySelector('.chart-container');
        const existingMessage = chartContainer.querySelector('.no-data-message');
        if (existingMessage) {
            existingMessage.remove();
        }
    } else {
        ticketsChart.data.labels = ['Sin datos'];
        ticketsChart.data.datasets[0].data = [0];
        ticketsChart.data.datasets[1].data = [0];

        const chartContainer = document.querySelector('.chart-container');
        let existingMessage = chartContainer.querySelector('.no-data-message');
        if (!existingMessage) {
            const noDataMessage = document.createElement('div');
            noDataMessage.className = 'no-data-message';
            noDataMessage.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #666; font-size: 14px; text-align: center; z-index: 10;';
            noDataMessage.textContent = 'No hay datos disponibles para el período seleccionado.';
            chartContainer.style.position = 'relative';
            chartContainer.appendChild(noDataMessage);
        }
    }

    ticketsChart.update('active');
}

function updateStats() {
    fetch('/reportes/datos')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor');
            }
            return response.json();
        })
        .then(data => {
            const pendingCountElement = document.getElementById('pending-count');
            const completedCountElement = document.getElementById('completed-count');
            
            if (pendingCountElement) {
                pendingCountElement.textContent = data.misTicketsPendientes || 0;
            }
            if (completedCountElement) {
                completedCountElement.textContent = data.misTicketsResueltos || 0;
            }

            const collaboratorsElement = document.getElementById('collaborators-count');
            const openTicketsElement = document.getElementById('open-tickets-count');
            
            if (collaboratorsElement) {
                collaboratorsElement.textContent = data.totalColaboradores || 0;
            }
            if (openTicketsElement) {
                openTicketsElement.textContent = data.ticketsAbiertos || 0;
            }

            if (document.getElementById('ticketsChart')) {
                if (data.estadoTicketsPorMes) {
                    estadoTickets6m = data.estadoTicketsPorMes;
                }
                if (data.estadoTicketsPorUltimoAnio) {
                    estadoTickets1y = data.estadoTicketsPorUltimoAnio;
                }
                if (data.estadoTicketsPorUltimoTrimestre) {
                    estadoTickets3m = data.estadoTicketsPorUltimoTrimestre;
                }

                updateChart();
            }
        })
        .catch(error => {
            const errorMsg = document.createElement('div');
            errorMsg.style.cssText = 'color: #ff6b6b; font-size: 12px; margin-top: 5px;';
            errorMsg.textContent = 'Error al cargar datos actualizados';
        });
}

document.querySelectorAll('.faq-question').forEach(question => {
    question.addEventListener('click', () => {
        const faqItem = question.parentElement;
        const answer = faqItem.querySelector('.faq-answer');
        const icon = question.querySelector('i');
        const isActive = faqItem.classList.contains('active');

        document.querySelectorAll('.faq-item').forEach(item => {
            if (item !== faqItem) {
                const otherAnswer = item.querySelector('.faq-answer');
                const otherIcon = item.querySelector('i');
                
                if (otherAnswer.style.maxHeight && otherAnswer.style.maxHeight !== '0px') {
                    otherAnswer.style.maxHeight = otherAnswer.scrollHeight + 'px';
                    void otherAnswer.offsetHeight;
                    otherAnswer.style.maxHeight = '0';
                    otherAnswer.style.paddingTop = '0';
                    otherAnswer.style.paddingBottom = '0';
                    otherIcon.style.transform = 'rotate(0deg)';
                    
                    setTimeout(() => {
                        item.classList.remove('active');
                    }, 300);
                } else {
                    item.classList.remove('active');
                }
            }
        });

        if (!isActive) {
            faqItem.classList.add('active');
            answer.style.maxHeight = '0';
            answer.style.paddingTop = '0';
            answer.style.paddingBottom = '0';
            void answer.offsetHeight;
            answer.style.maxHeight = '100px';
            answer.style.paddingTop = '1.25rem';
            answer.style.paddingBottom = '1.25rem';
            icon.style.transform = 'rotate(180deg)';
        } else {
            answer.style.maxHeight = answer.scrollHeight + 'px';
            void answer.offsetHeight;
            answer.style.maxHeight = '0';
            answer.style.paddingTop = '0';
            answer.style.paddingBottom = '0';
            icon.style.transform = 'rotate(0deg)';
            
            setTimeout(() => {
                faqItem.classList.remove('active');
            }, 10);
        }
    });
});