const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 INICIANDO DEPLOY AUTOMÁTICO TAKUMINET...');

// 1. Verificar que existe package.json en backend
if (!fs.existsSync(path.join(__dirname, 'backend', 'package.json'))) {
  console.error('❌ Error: No se encuentra package.json en la carpeta backend');
  process.exit(1);
}

// 2. Inicializar Git si no existe
try {
  execSync('git init', { stdio: 'inherit' });
  execSync('git add .', { stdio: 'inherit' });
  execSync('git commit -m "Deploy TakumiNet a producción"', { stdio: 'inherit' });
  console.log('✅ Git configurado');
} catch (e) {
  console.log('ℹ️ Git ya inicializado');
}

// 3. Crear repositorio GitHub
try {
  execSync('gh repo create takuminet-produccion --public --push', { stdio: 'inherit' });
  console.log('✅ Repositorio GitHub creado');
} catch (e) {
  console.log('ℹ️ Repositorio ya existe');
}

console.log('🎯 EJECUTA ESTE COMANDO FINAL PARA OBTENER LA URL:');
console.log('render blueprints create');