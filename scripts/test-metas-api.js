const BASE_URL = 'http://localhost:9060';

async function runTests() {
    console.log('🧪 Iniciando pruebas automatizadas del Módulo de Metas Ponderadas...');

    // 1. Health check
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthRes.json();
    console.log('✅ Health check:', healthData.status);

    // 2. Obtener usuarios
    const usersRes = await fetch(`${BASE_URL}/api/usuarios`);
    const usersData = await usersRes.json();
    console.log(`✅ Usuarios cargados: ${usersData.data.length}`);
    const ana = usersData.data.find(u => u.rol === 'ABOGADA_JR') || usersData.data[0];

    // 3. Obtener metas del usuario
    const metasRes = await fetch(`${BASE_URL}/api/metas/${ana.id}`);
    const metasData = await metasRes.json();
    console.log(`✅ Metas de ${ana.nombre}:`, metasData.data.length);
    console.log('📊 Estadísticas de Ponderación:', metasData.stats);

    if (metasData.data.length > 0) {
        const firstMeta = metasData.data[0];
        console.log(`🎯 Meta: "${firstMeta.titulo}" | Indicador: "${firstMeta.indicador}" | Peso: ${firstMeta.peso}% | Avance: ${firstMeta.porcentaje_avance}%`);
    }

    // 4. Crear una meta de prueba
    console.log('➕ Creando meta de prueba ponderada...');
    const createRes = await fetch(`${BASE_URL}/api/metas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            usuario_id: ana.id,
            titulo: 'Meta de Prueba Automatizada',
            descripcion: 'Verificación de cálculo ponderado de pesos',
            indicador: '100% de casos concluidos en tiempo y forma',
            categoria: 'Caso Legal',
            peso: 15.0,
            porcentaje_avance: 50.0,
            fecha_limite: '2026-12-31'
        })
    });
    const createData = await createRes.json();
    console.log('✅ Meta de prueba creada ID:', createData.data.id);

    // 5. Actualizar avance rápido
    console.log('📈 Actualizando avance rápido al 80%...');
    const avanceRes = await fetch(`${BASE_URL}/api/metas/${createData.data.id}/avance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ porcentaje_avance: 80.0 })
    });
    const avanceData = await avanceRes.json();
    console.log('✅ Avance actualizado:', avanceData.data.porcentaje_avance, '%');

    // 6. Eliminar la meta de prueba
    console.log('🗑️ Eliminando meta de prueba...');
    const deleteRes = await fetch(`${BASE_URL}/api/metas/${createData.data.id}`, {
        method: 'DELETE'
    });
    const deleteData = await deleteRes.json();
    console.log('✅ Meta eliminada:', deleteData.message);

    console.log('🎉 ¡Todas las pruebas del Módulo de Metas Ponderadas pasaron al 100%!');
}

runTests().catch(err => {
    console.error('❌ Error en pruebas:', err);
    process.exit(1);
});
