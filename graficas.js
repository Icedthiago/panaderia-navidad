async function cargarGraficaVentas() {
    try {
        const res = await fetch(`${API_URL}/api/ventas/productos`);
        const datos = await res.json();

        const etiquetas = datos.map(d => d.producto);
        const valores = datos.map(d => d.cantidad);

        crearGraficaBarras("graficaVentas", etiquetas, valores, "Ventas por producto");

    } catch (err) {
        console.error("Error cargando gráfica:", err);
    }
}

function crearGraficaBarras(idCanvas, etiquetas, valores, titulo = "Gráfica") {
    const ctx = document.getElementById(idCanvas);

    if (!ctx) {
        console.warn("⚠️ No se encontró el canvas:", idCanvas);
        return;
    }

    new Chart(ctx, {
        type: "bar",
        data: {
            labels: etiquetas,
            datasets: [{
                label: titulo,
                data: valores,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    cargarGraficaVentas();
});
