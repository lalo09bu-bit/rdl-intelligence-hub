import db from '../server/config/database.js';

setTimeout(() => {
    db.run(
        "UPDATE usuarios SET rol = 'RH', puesto = 'Dirección de Recursos Humanos & Talento', departamento = 'Recursos Humanos' WHERE email = 'analista.rh04@icloud.com' OR nombre LIKE '%Andres%'",
        function(err) {
            if (err) {
                console.error("Error updating user:", err);
            } else {
                console.log(`✅ Usuario actualizado a rol RH. Filas afectadas: ${this.changes}`);
            }
            db.all("SELECT id, nombre, email, rol, puesto FROM usuarios", [], (err, rows) => {
                console.log("Usuarios finales:", rows);
                process.exit(0);
            });
        }
    );
}, 600);
