// ==============================================
// GRAFICAS.JS - REEMPLAZAR TODO EL ARCHIVO
// ==============================================

const API_URL = "https://panaderia-navidad.onrender.com";

// Colores navideños
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
    'rgba(255, 152, 0, 0.8)',
    'rgba(156, 39, 176, 0.8)',
    'rgba(233, 30, 99, 0.8)'
];

// ==============================================
// 1. PRODUCTOS MÁS VENDIDOS
// ==============================================
async function cargarGraficaProductosMasVendidos() {
    try {
        const res = await fetch(`${API_URL}/api/estadisticas/productos-mas-vendidos`);
        const data = await res.json();

        if (!data.success || !data.productos || data.productos.length === 0) {
            mostrarMensajeSinDatos('grafica-productos-vendidos');
            return;
        }

        const ctx = document.getElementById('grafica-productos-vendidos');
        if (!ctx) {
            console.error("Canvas grafica-productos-vendidos no encontrado");
            return;
        }

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
                        borderWidth: 3,
                        type: 'line',
                        yAxisID: 'y1',
                        tension: 0.4
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
                        font: { size: 20, weight: 'bold' },
                        color: '#ffd700'
                    },
                    legend: {
                        display: true,
                        position: 'top',
                        labels: { color: '#fff', font: { size: 13 } }
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
                            color: '#fff',
                            font: { size: 14 }
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
                            color: '#fff',
                            font: { size: 14 }
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
                        ticks: { 
                            color: '#fff',
                            maxRotation: 45,
                            minRotation: 45
                        },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    }
                }
            }
        });

        console.log("✅ Gráfica productos más vendidos cargada");

    } catch (err) {
        console.error("Error cargando productos más vendidos:", err);
        mostrarMensajeSinDatos('grafica-productos-vendidos');
    }
}

// ==============================================
// 2. VENTAS POR TEMPORADA
// ==============================================
async function cargarGraficaVentasPorTemporada() {
    try {
        const res = await fetch(`${API_URL}/api/estadisticas/ventas-por-temporada`);
        const data = await res.json();

        if (!data.success || !data.temporadas || data.temporadas.length === 0) {
            mostrarMensajeSinDatos('grafica-temporadas');
            return;
        }

        const ctx = document.getElementById('grafica-temporadas');
        if (!ctx) {
            console.error("Canvas grafica-temporadas no encontrado");
            return;
        }

        const etiquetas = data.temporadas.map(t => t.temporada);
        const ingresos = data.temporadas.map(t => parseFloat(t.ingresos));

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: etiquetas,
                datasets: [{
                    label: 'Ingresos por Temporada',
                    data: ingresos,
                    backgroundColor: COLORES_ARRAY.slice(0, etiquetas.length),
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
                        font: { size: 20, weight: 'bold' },
                        color: '#ffd700'
                    },
                    legend: {
                        display: true,
                        position: 'right',
                        labels: { 
                            color: '#fff', 
                            font: { size: 12 },
                            padding: 15
                        }
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

        console.log("✅ Gráfica temporadas cargada");

    } catch (err) {
        console.error("Error cargando ventas por temporada:", err);
        mostrarMensajeSinDatos('grafica-temporadas');
    }
}

// ==============================================
// 3. VENTAS POR MES
// ==============================================
async function cargarGraficaVentasPorMes() {
    try {
        const res = await fetch(`${API_URL}/api/estadisticas/ventas-por-mes`);
        const data = await res.json();

        if (!data.success || !data.meses || data.meses.length === 0) {
            mostrarMensajeSinDatos('grafica-ventas-mes');
            return;
        }

        const ctx = document.getElementById('grafica-ventas-mes');
        if (!ctx) {
            console.error("Canvas grafica-ventas-mes no encontrado");
            return;
        }

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
                        yAxisID: 'y',
                        pointRadius: 5,
                        pointHoverRadius: 7
                    },
                    {
                        label: 'Ingresos ($)',
                        data: ingresos,
                        borderColor: COLORES.verde,
                        backgroundColor: 'rgba(30, 153, 101, 0.2)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        yAxisID: 'y1',
                        pointRadius: 5,
                        pointHoverRadius: 7
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '📈 Evolución de Ventas (Últimos 12 Meses)',
                        font: { size: 20, weight: 'bold' },
                        color: '#ffd700'
                    },
                    legend: {
                        display: true,
                        position: 'top',
                        labels: { color: '#fff', font: { size: 13 } }
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
                            color: '#fff',
                            font: { size: 14 }
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
                            color: '#fff',
                            font: { size: 14 }
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
                        ticks: { 
                            color: '#fff',
                            maxRotation: 45,
                            minRotation: 45
                        },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    }
                }
            }
        });

        console.log("✅ Gráfica ventas por mes cargada");

    } catch (err) {
        console.error("Error cargando ventas por mes:", err);
        mostrarMensajeSinDatos('grafica-ventas-mes');
    }
}

// ==============================================
// 4. TOP CLIENTES
// ==============================================
async function cargarGraficaTopClientes() {
    try {
        const res = await fetch(`${API_URL}/api/estadisticas/top-clientes`);
        const data = await res.json();

        if (!data.success || !data.clientes || data.clientes.length === 0) {
            mostrarMensajeSinDatos('grafica-top-clientes');
            return;
        }

        const ctx = document.getElementById('grafica-top-clientes');
        if (!ctx) {
            console.error("Canvas grafica-top-clientes no encontrado");
            return;
        }

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
                        font: { size: 20, weight: 'bold' },
                        color: '#ffd700'
                    },
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const index = context.dataIndex;
                                const cliente = data.clientes[index];
                                return [
                                    'Gastado: $' + context.parsed.x.toFixed(2),
                                    'Compras: ' + cliente.num_compras
                                ];
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
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        title: {
                            display: true,
                            text: 'Total Gastado ($)',
                            color: '#fff',
                            font: { size: 14 }
                        }
                    },
                    y: {
                        ticks: { color: '#fff' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    }
                }
            }
        });

        console.log("✅ Gráfica top clientes cargada");

    } catch (err) {
        console.error("Error cargando top clientes:", err);
        mostrarMensajeSinDatos('grafica-top-clientes');
    }
}

// ==============================================
// 5. TARJETAS DE ESTADÍSTICAS
// ==============================================
async function cargarTarjetasEstadisticas() {
    try {
        const res = await fetch(`${API_URL}/api/estadisticas/ingresos-totales`);
        const data = await res.json();

        if (!data.success) {
            console.error("Error obteniendo estadísticas generales");
            return;
        }

        const stats = data.estadisticas;

        const totalVentasElem = document.getElementById('total-ventas');
        const ingresosTotalesElem = document.getElementById('ingresos-totales');
        const promedioVentaElem = document.getElementById('promedio-venta');
        const ventaMaximaElem = document.getElementById('venta-maxima');

        if (totalVentasElem) {
            totalVentasElem.textContent = stats.total_ventas || '0';
        }
        
        if (ingresosTotalesElem) {
            ingresosTotalesElem.textContent = '$' + parseFloat(stats.ingresos_totales || 0).toFixed(2);
        }
        
        if (promedioVentaElem) {
            promedioVentaElem.textContent = '$' + parseFloat(stats.promedio_venta || 0).toFixed(2);
        }
        
        if (ventaMaximaElem) {
            ventaMaximaElem.textContent = '$' + parseFloat(stats.venta_maxima || 0).toFixed(2);
        }

        console.log("✅ Tarjetas de estadísticas cargadas");

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
        if (!tbody) {
            console.error("tbody-stock-bajo no encontrado");
            return;
        }

        if (!data.success || !data.productos || data.productos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 20px; color: #28a745;">
                        <i class="fas fa-check-circle fa-2x mb-2"></i><br>
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
                    <span class="badge ${p.stock < 5 ? 'bg-danger' : 'bg-warning text-dark'}">
                        ${p.stock} ${p.stock === 1 ? 'unidad' : 'unidades'}
                    </span>
                </td>
                <td>${p.temporada}</td>
                <td>$${parseFloat(p.precio).toFixed(2)}</td>
            </tr>
        `).join('');

        console.log("✅ Tabla de stock bajo cargada");

    } catch (err) {
        console.error("Error cargando stock bajo:", err);
    }
}

// ==============================================
// 7. FUNCIÓN AUXILIAR
// ==============================================
function mostrarMensajeSinDatos(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const container = canvas.parentElement;
    if (!container) return;

    container.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: #fff;">
            <i class="fas fa-chart-line fa-4x mb-4" style="opacity: 0.3;"></i>
            <h5 style="color: #ffd700; margin-bottom: 15px;">Sin datos disponibles</h5>
            <p style="opacity: 0.8; margin: 0;">
                No hay suficientes datos para generar esta gráfica.<br>
                Realiza algunas ventas para ver estadísticas.
            </p>
        </div>
    `;
}

// ==============================================
// 8. ACTUALIZAR TODO
// ==============================================
async function actualizarTodasLasGraficas() {
    const btnActualizar = document.getElementById('btn-actualizar-graficas');
    
    if (btnActualizar) {
        btnActualizar.disabled = true;
        btnActualizar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';
    }

    console.log("🔄 Iniciando actualización de gráficas...");

    try {
        await Promise.all([
            cargarTarjetasEstadisticas(),
            cargarGraficaProductosMasVendidos(),
            cargarGraficaVentasPorTemporada(),
            cargarGraficaVentasPorMes(),
            cargarGraficaTopClientes(),
            cargarTablaStockBajo()
        ]);

        console.log("✅ Todas las gráficas actualizadas exitosamente");

        if (btnActualizar) {
            btnActualizar.innerHTML = '<i class="fas fa-check"></i> ¡Actualizado!';
            setTimeout(() => {
                btnActualizar.innerHTML = '<i class="fas fa-sync-alt"></i> Actualizar Gráficas';
                btnActualizar.disabled = false;
            }, 2000);
        }

    } catch (err) {
        console.error("❌ Error actualizando gráficas:", err);
        
        if (btnActualizar) {
            btnActualizar.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error';
            btnActualizar.disabled = false;
        }
    }
}

// ==============================================
// 9. INICIALIZACIÓN
// ==============================================
document.addEventListener("DOMContentLoaded", async () => {
    console.log("🎄 Sistema de gráficas iniciando...");

    // Esperar 500ms para asegurar que el DOM está completamente listo
    setTimeout(async () => {
        await actualizarTodasLasGraficas();
        
        // Configurar botón de actualización
        const btnActualizar = document.getElementById('btn-actualizar-graficas');
        if (btnActualizar) {
            btnActualizar.addEventListener('click', actualizarTodasLasGraficas);
            console.log("✅ Botón actualizar configurado");
        }
    }, 500);
});

// Exportar función global
window.actualizarTodasLasGraficas = actualizarTodasLasGraficas;