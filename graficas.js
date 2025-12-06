// ==============================================
// GRAFICAS.JS - SISTEMA COMPLETO DE ESTADÍSTICAS
// ==============================================

const API_URL = "https://panaderia-navidad.onrender.com";

// Colores navideños para las gráficas
const COLORES = {
    rojo: 'rgba(200, 35, 51, 0.8)',
    verde: 'rgba(30, 153, 101, 0.8)',
    dorado: 'rgba(255, 215, 0, 0.8)',
    blanco: 'rgba(255, 255, 255, 0.8)',
    rojoClaro: 'rgba(220, 65, 65, 0.8)',
    verdeClaro: 'rgba(45, 183, 121, 0.8)'
};

const COLORES_ARRAY = [
    COLORES.rojo,
    COLORES.verde,
    COLORES.dorado,
    COLORES.rojoClaro,
    COLORES.verdeClaro,
    'rgba(129, 13, 19, 0.8)',
    'rgba(100, 181, 246, 0.8)',
    'rgba(255, 152, 0, 0.8)'
];

// ==============================================
// 1. PRODUCTOS MÁS VENDIDOS
// ==============================================
async function cargarGraficaProductosMasVendidos() {
    try {
        const res = await fetch(`${API_URL}/api/estadisticas/productos-mas-vendidos`);
        const data = await res.json();

        if (!data.success || !data.productos.length) {
            mostrarMensajeSinDatos('grafica-productos-vendidos');
            return;
        }

        const ctx = document.getElementById('grafica-productos-vendidos');
        if (!ctx) return;

        const etiquetas = data.productos.map(p => p.producto);
        const cantidades = data.productos.map(p => parseInt(p.total_vendido));
        const ingresos = data.productos.map(p => parseFloat(p.ingresos_totales));

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: etiquetas,
                datasets: [
                    {
                        label: 'Unidades Vendidas',
                        data: cantidades,
                        backgroundColor: COLORES.rojo,
                        borderColor: COLORES.rojo,
                        borderWidth: 2,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Ingresos ($)',
                        data: ingresos,
                        backgroundColor: COLORES.verde,
                        borderColor: COLORES.verde,
                        borderWidth: 2,
                        type: 'line',
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '🏆 TOP 10 - Productos Más Vendidos',
                        font: { size: 18, weight: 'bold' },
                        color: '#ffd700'
                    },
                    legend: {
                        display: true,
                        position: 'top',
                        labels: { color: '#fff', font: { size: 12 } }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) label += ': ';
                                if (context.parsed.y !== null) {
                                    if (context.datasetIndex === 1) {
                                        label += '$' + context.parsed.y.toFixed(2);
                                    } else {
                                        label += context.parsed.y + ' unidades';
                                    }
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Unidades Vendidas',
                            color: '#fff'
                        },
                        ticks: { color: '#fff' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Ingresos ($)',
                            color: '#fff'
                        },
                        ticks: { 
                            color: '#fff',
                            callback: function(value) {
                                return '$' + value.toFixed(0);
                            }
                        },
                        grid: { drawOnChartArea: false }
                    },
                    x: {
                        ticks: { color: '#fff' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    }
                }
            }
        });

    } catch (err) {
        console.error("Error cargando productos más vendidos:", err);
    }
}

// ==============================================
// 2. VENTAS POR TEMPORADA
// ==============================================
async function cargarGraficaVentasPorTemporada() {
    try {
        const res = await fetch(`${API_URL}/api/estadisticas/ventas-por-temporada`);
        const data = await res.json();

        if (!data.success || !data.temporadas.length) {
            mostrarMensajeSinDatos('grafica-temporadas');
            return;
        }

        const ctx = document.getElementById('grafica-temporadas');
        if (!ctx) return;

        const etiquetas = data.temporadas.map(t => t.temporada);
        const ingresos = data.temporadas.map(t => parseFloat(t.ingresos));

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: etiquetas,
                datasets: [{
                    label: 'Ingresos por Temporada',
                    data: ingresos,
                    backgroundColor: COLORES_ARRAY,
                    borderColor: '#fff',
                    borderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '🎄 Ventas por Temporada',
                        font: { size: 18, weight: 'bold' },
                        color: '#ffd700'
                    },
                    legend: {
                        display: true,
                        position: 'right',
                        labels: { color: '#fff', font: { size: 12 } }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return label + ': $' + value.toFixed(2) + ' (' + percentage + '%)';
                            }
                        }
                    }
                }
            }
        });

    } catch (err) {
        console.error("Error cargando ventas por temporada:", err);
    }
}

// ==============================================
// 3. VENTAS POR MES
// ==============================================
async function cargarGraficaVentasPorMes() {
    try {
        const res = await fetch(`${API_URL}/api/estadisticas/ventas-por-mes`);
        const data = await res.json();

        if (!data.success || !data.meses.length) {
            mostrarMensajeSinDatos('grafica-ventas-mes');
            return;
        }

        const ctx = document.getElementById('grafica-ventas-mes');
        if (!ctx) return;

        const etiquetas = data.meses.map(m => {
            const [year, month] = m.mes.split('-');
            const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 
                          'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            return `${meses[parseInt(month) - 1]} ${year}`;
        });
        const ventas = data.meses.map(m => parseInt(m.num_ventas));
        const ingresos = data.meses.map(m => parseFloat(m.ingresos));

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: etiquetas,
                datasets: [
                    {
                        label: 'Número de Ventas',
                        data: ventas,
                        borderColor: COLORES.rojo,
                        backgroundColor: COLORES.rojo,
                        borderWidth: 3,
                        fill: false,
                        tension: 0.4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Ingresos ($)',
                        data: ingresos,
                        borderColor: COLORES.verde,
                        backgroundColor: COLORES.verde,
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '📈 Evolución de Ventas Mensual',
                        font: { size: 18, weight: 'bold' },
                        color: '#ffd700'
                    },
                    legend: {
                        display: true,
                        position: 'top',
                        labels: { color: '#fff', font: { size: 12 } }
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Número de Ventas',
                            color: '#fff'
                        },
                        ticks: { color: '#fff' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Ingresos ($)',
                            color: '#fff'
                        },
                        ticks: { 
                            color: '#fff',
                            callback: function(value) {
                                return '$' + value.toFixed(0);
                            }
                        },
                        grid: { drawOnChartArea: false }
                    },
                    x: {
                        ticks: { color: '#fff' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    }
                }
            }
        });

    } catch (err) {
        console.error("Error cargando ventas por mes:", err);
    }
}

// ==============================================
// 4. TOP CLIENTES
// ==============================================
async function cargarGraficaTopClientes() {
    try {
        const res = await fetch(`${API_URL}/api/estadisticas/top-clientes`);
        const data = await res.json();

        if (!data.success || !data.clientes.length) {
            mostrarMensajeSinDatos('grafica-top-clientes');
            return;
        }

        const ctx = document.getElementById('grafica-top-clientes');
        if (!ctx) return;

        const etiquetas = data.clientes.map(c => c.nombre);
        const gastos = data.clientes.map(c => parseFloat(c.total_gastado));

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: etiquetas,
                datasets: [{
                    label: 'Total Gastado ($)',
                    data: gastos,
                    backgroundColor: COLORES.dorado,
                    borderColor: COLORES.dorado,
                    borderWidth: 2
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '👥 Top 10 - Mejores Clientes',
                        font: { size: 18, weight: 'bold' },
                        color: '#ffd700'
                    },
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return 'Gastado: $' + context.parsed.x.toFixed(2);
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { 
                            color: '#fff',
                            callback: function(value) {
                                return '$' + value;
                            }
                        },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    },
                    y: {
                        ticks: { color: '#fff' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    }
                }
            }
        });

    } catch (err) {
        console.error("Error cargando top clientes:", err);
    }
}

// ==============================================
// 5. TARJETAS DE ESTADÍSTICAS
// ==============================================
async function cargarTarjetasEstadisticas() {
    try {
        const res = await fetch(`${API_URL}/api/estadisticas/ingresos-totales`);
        const data = await res.json();

        if (!data.success) return;

        const stats = data.estadisticas;

        document.getElementById('total-ventas').textContent = stats.total_ventas || '0';
        document.getElementById('ingresos-totales').textContent = 
            '$' + parseFloat(stats.ingresos_totales || 0).toFixed(2);
        document.getElementById('promedio-venta').textContent = 
            '$' + parseFloat(stats.promedio_venta || 0).toFixed(2);
        document.getElementById('venta-maxima').textContent = 
            '$' + parseFloat(stats.venta_maxima || 0).toFixed(2);

    } catch (err) {
        console.error("Error cargando estadísticas generales:", err);
    }
}

// ==============================================
// 6. TABLA DE STOCK BAJO
// ==============================================
async function cargarTablaStockBajo() {
    try {
        const res = await fetch(`${API_URL}/api/estadisticas/stock-bajo`);
        const data = await res.json();

        const tbody = document.getElementById('tbody-stock-bajo');
        if (!tbody) return;

        if (!data.success || !data.productos.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 20px;">
                        ✅ No hay productos con stock bajo
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = data.productos.map(p => `
            <tr>
                <td>${p.id_producto}</td>
                <td>${p.nombre}</td>
                <td>
                    <span class="badge ${p.stock < 5 ? 'bg-danger' : 'bg-warning'}">
                        ${p.stock}
                    </span>
                </td>
                <td>${p.temporada}</td>
                <td>$${parseFloat(p.precio).toFixed(2)}</td>
            </tr>
        `).join('');

    } catch (err) {
        console.error("Error cargando stock bajo:", err);
    }
}

// ==============================================
// 7. FUNCIONES AUXILIARES
// ==============================================
function mostrarMensajeSinDatos(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const container = canvas.parentElement;
    container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #fff;">
            <i class="fas fa-chart-line fa-3x mb-3" style="opacity: 0.5;"></i>
            <p>No hay datos suficientes para mostrar esta gráfica</p>
        </div>
    `;
}

// ==============================================
// 8. BOTÓN ACTUALIZAR TODO
// ==============================================
async function actualizarTodasLasGraficas() {
    const btnActualizar = document.getElementById('btn-actualizar-graficas');
    if (btnActualizar) {
        btnActualizar.disabled = true;
        btnActualizar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';
    }

    await Promise.all([
        cargarGraficaProductosMasVendidos(),
        cargarGraficaVentasPorTemporada(),
        cargarGraficaVentasPorMes(),
        cargarGraficaTopClientes(),
        cargarTarjetasEstadisticas(),
        cargarTablaStockBajo()
    ]);

    if (btnActualizar) {
        btnActualizar.disabled = false;
        btnActualizar.innerHTML = '<i class="fas fa-sync-alt"></i> Actualizar Gráficas';
    }

    console.log("✅ Todas las gráficas actualizadas");
}

// ==============================================
// 9. INICIALIZACIÓN
// ==============================================
document.addEventListener("DOMContentLoaded", async () => {
    console.log("🎄 Cargando sistema de gráficas...");

    // Cargar todas las gráficas
    await actualizarTodasLasGraficas();

    // Configurar botón de actualización
    const btnActualizar = document.getElementById('btn-actualizar-graficas');
    if (btnActualizar) {
        btnActualizar.addEventListener('click', actualizarTodasLasGraficas);
    }

    console.log("✅ Sistema de gráficas listo");
});

// Exportar funciones
window.actualizarTodasLasGraficas = actualizarTodasLasGraficas;