let ticketsChart, statusChart;
let chartData = {
    tickets: {
        '6m': /*[[${ticketsPorMes}]]*/ {},
        '1y': /*[[${ticketsPorUltimoAnio}]]*/ {},
        '3m': /*[[${ticketsPorUltimoTrimestre}]]*/ {},
        currentPeriod: '6m'
    },
    status: {
        '6m': /*[[${estadoTicketsPorMes}]]*/ {},
        '1y': /*[[${estadoTicketsPorUltimoAnio}]]*/ {},
        '3m': /*[[${estadoTicketsPorUltimoTrimestre}]]*/ {},
        currentPeriod: '6m'
    }
};

let datosAnteriores = null;

function formatDateTime(date) {
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    };
    return new Intl.DateTimeFormat('es-ES', options).format(date);
}

function updateLastUpdateTime() {
    const now = new Date();
    document.getElementById('lastUpdateTime').textContent = formatDateTime(now);
}

function hayCambiosEnDatos(nuevosDatos) {
    if (!datosAnteriores) {
        return true;
    }

    const camposAComparar = [
        'totalTickets', 'ticketsAbiertos', 'ticketsPendientes',
        'ticketsResueltos', 'ticketsCerrados', 'totalUsuarios',
        'totalColaboradores'
    ];

    for (const campo of camposAComparar) {
        if (nuevosDatos[campo] !== datosAnteriores[campo]) {
            return true;
        }
    }

    const periodos = ['6m', '1y', '3m'];
    for (const periodo of periodos) {
        const key = `ticketsPor${periodo === '6m' ? 'Mes' : periodo === '1y' ? 'UltimoAnio' : 'UltimoTrimestre'}`;
        const nuevos = nuevosDatos[key] || {};
        const anteriores = datosAnteriores[key] || {};
        const nuevasKeys = Object.keys(nuevos);
        const anterioresKeys = Object.keys(anteriores);

        if (nuevasKeys.length !== anterioresKeys.length) {
            return true;
        }

        for (const mes of nuevasKeys) {
            if (nuevos[mes] !== anteriores[mes]) {
                return true;
            }
        }
    }

    const compararMapas = (nuevoMapa, anteriorMapa, nombre) => {
        if (!nuevoMapa || !anteriorMapa) {
            return true;
        }
        const nuevasKeys = Object.keys(nuevoMapa);
        const anterioresKeys = Object.keys(anteriorMapa);
        if (nuevasKeys.length !== anterioresKeys.length) {
            return true;
        }
        for (const key of nuevasKeys) {
            if (nuevoMapa[key] !== anteriorMapa[key]) {
                return true;
            }
        }
        return false;
    };

    if (compararMapas(nuevosDatos.categoriasPopulares, datosAnteriores.categoriasPopulares, 'categoriasPopulares') ||
            compararMapas(nuevosDatos.colaboradoresActivos, datosAnteriores.colaboradoresActivos, 'colaboradoresActivos')) {
        return true;
    }

    if (nuevosDatos.historialAuditoria && datosAnteriores.historialAuditoria) {
        if (nuevosDatos.historialAuditoria.length !== datosAnteriores.historialAuditoria.length) {
            return true;
        }
        for (let i = 0; i < nuevosDatos.historialAuditoria.length; i++) {
            const nuevo = nuevosDatos.historialAuditoria[i];
            const anterior = datosAnteriores.historialAuditoria[i];
            if (nuevo.fechaAccion !== anterior.fechaAccion || nuevo.accion !== anterior.accion || nuevo.usuario !== anterior.usuario) {
                return true;
            }
        }
    } else if (nuevosDatos.historialAuditoria !== datosAnteriores.historialAuditoria) {
        return true;
    }

    return false;
}

function getCommonChartOptions() {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    boxWidth: 12,
                    padding: 10,
                    font: {
                        size: window.innerWidth < 768 ? 10 : 12
                    }
                }
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                bodyFont: {
                    size: window.innerWidth < 768 ? 10 : 12
                },
                titleFont: {
                    size: window.innerWidth < 768 ? 10 : 12
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    font: {
                        size: window.innerWidth < 768 ? 10 : 12
                    },
                    maxRotation: window.innerWidth < 768 ? 45 : 0,
                    autoSkip: true,
                    maxTicksLimit: window.innerWidth < 768 ? 6 : 12
                },
                grid: {
                    display: false
                }
            },
            y: {
                beginAtZero: true,
                ticks: {
                    precision: 0,
                    font: {
                        size: window.innerWidth < 768 ? 10 : 12
                    }
                },
                grid: {
                    drawBorder: false
                }
            }
        },
        layout: {
            padding: {
                top: 10,
                right: window.innerWidth < 768 ? 5 : 15,
                bottom: window.innerWidth < 768 ? 5 : 15,
                left: window.innerWidth < 768 ? 5 : 15
            }
        }
    };
}

function createTicketsChart(ticketsData) {
    const meses = Object.keys(ticketsData);
    const valoresTickets = Object.values(ticketsData);

    const ticketsPorMesData = {
        labels: meses,
        datasets: [{
                label: 'Total Tickets',
                data: valoresTickets,
                backgroundColor: 'rgba(52, 152, 219, 0.2)',
                borderColor: 'rgba(52, 152, 219, 1)',
                borderWidth: window.innerWidth < 768 ? 1 : 2,
                tension: 0.1,
                fill: true,
                pointRadius: window.innerWidth < 768 ? 3 : 4,
                pointHoverRadius: window.innerWidth < 768 ? 5 : 6
            }]
    };

    const ticketsCtx = document.getElementById('ticketsChart');
    if (ticketsCtx) {
        if (ticketsChart) {
            ticketsChart.destroy();
        }
        ticketsChart = new Chart(ticketsCtx, {
            type: 'line',
            data: ticketsPorMesData,
            options: getCommonChartOptions()
        });

        const handleResize = () => {
            if (ticketsChart) {
                ticketsChart.options = getCommonChartOptions();
                ticketsChart.update();
            }
        };

        window.addEventListener('resize', handleResize);

        ticketsCtx.chart = {
            destroy: function () {
                window.removeEventListener('resize', handleResize);
                Chart.prototype.destroy.apply(ticketsChart, arguments);
            }
        };
    }
}

function createStatusChart(statusData) {
    const meses = Object.keys(statusData);
    const resueltos = meses.map(mes => statusData[mes]?.Resueltos || 0);
    const pendientes = meses.map(mes => statusData[mes]?.Pendientes || 0);

    const estadoTicketsPorMesData = {
        labels: meses,
        datasets: [
            {
                label: 'Resueltos',
                data: resueltos,
                backgroundColor: 'rgba(46, 204, 113, 0.7)',
                borderColor: 'rgba(46, 204, 113, 1)',
                borderWidth: 1
            },
            {
                label: 'Pendientes',
                data: pendientes,
                backgroundColor: 'rgba(231, 76, 60, 0.7)',
                borderColor: 'rgba(231, 76, 60, 1)',
                borderWidth: 1
            }
        ]
    };

    const statusCtx = document.getElementById('statusChart');
    if (statusCtx) {
        if (statusChart) {
            statusChart.destroy();
        }
        statusChart = new Chart(statusCtx, {
            type: 'bar',
            data: estadoTicketsPorMesData,
            options: {
                ...getCommonChartOptions(),
                scales: {
                    x: {stacked: true},
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        ticks: {precision: 0}
                    }
                }
            }
        });
    }
}

function updatePeriodInfo(chartType, period) {
    const periodInfo = document.getElementById(`${chartType}PeriodInfo`);
    let text = '';
    switch (period) {
        case '6m':
            text = 'Mostrando últimos 6 meses';
            break;
        case '1y':
            text = 'Mostrando último año';
            break;
        case '3m':
            text = 'Mostrando último trimestre';
            break;
    }
    if (periodInfo) {
        periodInfo.textContent = text;
    }
}

function updateChart(chartType) {
    const currentPeriod = chartData[chartType].currentPeriod;
    const data = chartData[chartType][currentPeriod];

    if (chartType === 'tickets') {
        createTicketsChart(data);
    } else if (chartType === 'status') {
        createStatusChart(data);
    }
    updatePeriodInfo(chartType, currentPeriod);
}

function initSingleChart(chartType) {
    const currentPeriod = chartData[chartType].currentPeriod;
    const data = chartData[chartType][currentPeriod];

    if (chartType === 'tickets') {
        createTicketsChart(data);
    } else if (chartType === 'status') {
        createStatusChart(data);
    }
    updatePeriodInfo(chartType, currentPeriod);
}

function initCharts() {
    initSingleChart('tickets');
    initSingleChart('status');
}

function actualizarTablas(data) {
    const categoriasTbody = document.getElementById('categoriasTbody');
    if (categoriasTbody) {
        categoriasTbody.innerHTML = '';
        if (!data.categoriasPopulares || Object.keys(data.categoriasPopulares).length === 0) {
            categoriasTbody.innerHTML = '<tr><td colspan="2" class="no-data">No hay datos disponibles</td></tr>';
        } else {
            const sortedCategorias = Object.entries(data.categoriasPopulares)
                    .sort((a, b) => b[1] - a[1]);
            for (const [categoria, cantidad] of sortedCategorias) {
                const row = document.createElement('tr');
                row.innerHTML = `<td>${categoria}</td><td>${cantidad}</td>`;
                categoriasTbody.appendChild(row);
            }
        }
    }

    const colaboradoresTbody = document.getElementById('colaboradoresTbody');
    if (colaboradoresTbody) {
        colaboradoresTbody.innerHTML = '';
        if (!data.colaboradoresActivos || Object.keys(data.colaboradoresActivos).length === 0) {
            colaboradoresTbody.innerHTML = '<tr><td colspan="2" class="no-data">No hay colaboradores registrados</td></tr>';
        } else {
            const sortedColaboradores = Object.entries(data.colaboradoresActivos);
            for (const [colaborador, cantidad] of sortedColaboradores) {
                const row = document.createElement('tr');
                row.innerHTML = `<td>${colaborador}</td><td>${cantidad}</td>`;
                colaboradoresTbody.appendChild(row);
            }
        }
    }
}

function actualizarHistorialAuditoria(data) {
    const actividadList = document.querySelector('.activity-list');
    if (actividadList) {
        actividadList.innerHTML = '';
        if (!data.historialAuditoria || data.historialAuditoria.length === 0) {
            actividadList.innerHTML = `
                                    <li class="activity-item no-activity">
                                        <div class="activity-icon"><i class="fas fa-info-circle"></i></div>
                                        <div class="activity-content">
                                            <div class="activity-action">No hay actividad reciente</div>
                                            <div class="activity-meta">
                                                <span>Sistema</span>
                                                <span>-</span>
                                            </div>
                                        </div>
                                    </li>`;
        } else {
            data.historialAuditoria.sort((a, b) => new Date(b.fechaAccion) - new Date(a.fechaAccion));
            data.historialAuditoria.slice(0, 50).forEach(actividad => {
                const li = document.createElement('li');
                li.className = 'activity-item';
                li.innerHTML = `
                                        <div class="activity-icon">
                                            <i class="fas ${actividad.icono || 'fa-ticket-alt'}"></i>
                                        </div>
                                        <div class="activity-content">
                                            <div class="activity-action">${actividad.accion || 'Acción no especificada'}</div>
                                            <div class="activity-meta">
                                                <span>${actividad.usuario || 'Sistema'}</span>
                                                <span>${actividad.tiempo || '-'}</span>
                                                ${actividad.infoTicket ? `<span> | ${actividad.infoTicket}</span>` : ''}
                                            </div>
                                            ${actividad.detalle ? `<div class="activity-details">${actividad.detalle}</div>` : ''}
                                        </div>`;
                actividadList.appendChild(li);
            });
        }
    }
}

async function actualizarDashboard() {
    try {
        const response = await fetch('/reportes/datos', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`Error en la solicitud: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (!data) {
            return;
        }

        if (!hayCambiosEnDatos(data)) {
            return;
        }

        updateLastUpdateTime();

        datosAnteriores = JSON.parse(JSON.stringify(data));

        const stats = [
            {id: 'totalTickets', key: 'totalTickets'},
            {id: 'ticketsAbiertos', key: 'ticketsAbiertos'},
            {id: 'ticketsPendientes', key: 'ticketsPendientes'},
            {id: 'ticketsResueltos', key: 'ticketsResueltos'},
            {id: 'ticketsCerrados', key: 'ticketsCerrados'},
            {id: 'totalUsuarios', key: 'totalUsuarios'},
            {id: 'totalColaboradores', key: 'totalColaboradores'}
        ];

        stats.forEach(stat => {
            const element = document.getElementById(stat.id);
            if (element && data[stat.key] !== undefined) {
                element.textContent = data[stat.key];
            }
        });

        const chartDataChanged = {
            tickets: false,
            status: false
        };

        if (JSON.stringify(data.ticketsPorMes) !== JSON.stringify(chartData.tickets['6m']) ||
                JSON.stringify(data.ticketsPorUltimoAnio) !== JSON.stringify(chartData.tickets['1y']) ||
                JSON.stringify(data.ticketsPorUltimoTrimestre) !== JSON.stringify(chartData.tickets['3m'])) {
            chartData.tickets['6m'] = data.ticketsPorMes || {};
            chartData.tickets['1y'] = data.ticketsPorUltimoAnio || {};
            chartData.tickets['3m'] = data.ticketsPorUltimoTrimestre || {};
            chartDataChanged.tickets = true;
        }

        if (JSON.stringify(data.estadoTicketsPorMes) !== JSON.stringify(chartData.status['6m']) ||
                JSON.stringify(data.estadoTicketsPorUltimoAnio) !== JSON.stringify(chartData.status['1y']) ||
                JSON.stringify(data.estadoTicketsPorUltimoTrimestre) !== JSON.stringify(chartData.status['3m'])) {
            chartData.status['6m'] = data.estadoTicketsPorMes || {};
            chartData.status['1y'] = data.estadoTicketsPorUltimoAnio || {};
            chartData.status['3m'] = data.estadoTicketsPorUltimoTrimestre || {};
            chartDataChanged.status = true;
        }

        if (chartDataChanged.tickets) {
            updateChart('tickets');
        }

        if (chartDataChanged.status) {
            updateChart('status');
        }

        actualizarTablas(data);

        actualizarHistorialAuditoria(data);
    } catch (error) {
    }
}

document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.chart-select').forEach(select => {
        select.addEventListener('change', function () {
            const chartType = this.dataset.chart;
            const period = this.value;
            chartData[chartType].currentPeriod = period;
            updateChart(chartType);
        });
    });

    updateLastUpdateTime();

    initCharts();

    setTimeout(() => {
        actualizarDashboard();
    }, 10);

    setInterval(() => {
        actualizarDashboard();
    }, 60000);
});