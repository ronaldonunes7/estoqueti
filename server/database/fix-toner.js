const { db } = require('./init');

console.log('🔧 Corrigindo tipo do TONER para consumível...');

// Atualizar TONER para ser consumível
db.run(
  'UPDATE assets SET asset_type = ?, stock_quantity = ?, min_stock = ? WHERE name = ? OR name LIKE ?',
  ['consumable', 0, 5, 'TONER', '%TONER%'],
  function(err) {
    if (err) {
      console.error('❌ Erro ao atualizar TONER:', err);
      process.exit(1);
    }
    
    console.log(`✅ ${this.changes} ativo(s) atualizado(s) para consumível`);
    
    // Verificar resultado
    db.all('SELECT id, name, asset_type, stock_quantity, min_stock FROM assets WHERE name LIKE "%TONER%"', (err, rows) => {
      if (err) {
        console.error('❌ Erro ao verificar resultado:', err);
        process.exit(1);
      }
      
      console.log('📊 Ativos TONER após correção:');
      rows.forEach(row => {
        console.log(`  - ID: ${row.id}, Nome: ${row.name}, Tipo: ${row.asset_type}, Estoque: ${row.stock_quantity}, Min: ${row.min_stock}`);
      });
      
      console.log('🎉 Correção concluída! Agora você pode adicionar saldo ao TONER.');
      process.exit(0);
    });
  }
);