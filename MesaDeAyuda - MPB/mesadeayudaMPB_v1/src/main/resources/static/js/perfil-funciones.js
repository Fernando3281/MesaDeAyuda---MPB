/**
 * Función que verifica los números de teléfono y ajusta su visualización
 * Si el número es cero o está vacío, limpia el campo y muestra "Sin información..." como placeholder
 */
function formatearTelefonoComoPlaceholder() {
    // Seleccionar todos los elementos que muestran números de teléfono
    const telefonoInputs = document.querySelectorAll('#inputTelefono');
    
    telefonoInputs.forEach(input => {
        const valor = input.value.trim();
        
        // Verificar si el valor es "+506 0" o está vacío o solo tiene espacios o contiene solo "+506"
        if (valor === "+506 0" || valor === "" || valor === "+506 " || valor === "+506") {
            // Limpiar el valor del campo
            input.value = "";
            
            // Establecer "Sin información..." como placeholder
            input.placeholder = "Sin Información...";
        }
    });
}

// Ejecutar la función cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', formatearTelefonoComoPlaceholder);
