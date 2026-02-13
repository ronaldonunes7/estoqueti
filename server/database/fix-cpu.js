const { db } = require('./init');

console.log('🔧 Corrigindo tipo do CPU para consumível (se necessário)...');

// Verificar se CPU deve ser consumível baseado na categoria
db.get('SELECT * FROM assets WHERE name = "CPU"', (err, row) => {
  if (err) {
    console.error('❌ Erro ao buscar CPU:', err);
    process.exit(1);
  }
  
  if (!row) {
    console.log('ℹ️ CPU não encontrado');
    process.exit(0);
  }
  
  console.log('📊 CPU atual:', row);
  
  // Se for categoria Insumos, deve ser consumível
  if (row.category === 'Insumos' && row.asset_type === 'unique') {
    db.run(
      'UPDATE assets SET asset_type = ?, stock_quantity = ?, min_stock = ? WHERE id = ?',
      ['consumable', 0, 5, row.id],
      function(err) {
        if (err) {
          console.error('❌ Erro ao atualizar CPU:', err);
          process.exit(1);
        }
        
        console.log(`✅ CPU atualizado para consumível`);
        process.exit(0);
      }
    );
  } else {
    console.log('ℹ️ CPU não precisa ser alterado');
    process.exit(0);
  }
});