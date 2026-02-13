const { db } = require('./init');

console.log('🔄 Migrando tabela external_report_links...');

// Verificar se a coluna store_ids existe
db.get("PRAGMA table_info(external_report_links)", (err, info) => {
  if (err) {
    console.error('❌ Erro ao verificar estrutura da tabela:', err);
    process.exit(1);
  }

  // Verificar se a tabela existe
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='external_report_links'", (err, table) => {
    if (err) {
      console.error('❌ Erro ao verificar tabela:', err);
      process.exit(1);
    }

    if (!table) {
      console.log('ℹ️ Tabela external_report_links não existe, será criada automaticamente');
      process.exit(0);
    }

    // Verificar colunas existentes
    db.all("PRAGMA table_info(external_report_links)", (err, columns) => {
      if (err) {
        console.error('❌ Erro ao listar colunas:', err);
        process.exit(1);
      }

      const columnNames = columns.map(col => col.name);
      console.log('📊 Colunas existentes:', columnNames);

      const missingColumns = [];
      
      if (!columnNames.includes('store_ids')) {
        missingColumns.push('store_ids TEXT');
      }
      
      if (!columnNames.includes('show_financial')) {
        missingColumns.push('show_financial BOOLEAN DEFAULT 1');
      }

      if (missingColumns.length === 0) {
        console.log('✅ Tabela external_report_links já está atualizada');
        process.exit(0);
      }

      console.log('🔧 Adicionando colunas:', missingColumns);

      // Adicionar colunas uma por vez
      let completed = 0;
      missingColumns.forEach((column, index) => {
        const [columnName, columnDef] = column.split(' ', 2);
        
        db.run(`ALTER TABLE external_report_links ADD COLUMN ${column}`, (err) => {
          if (err && !err.message.includes('duplicate column')) {
            console.error(`❌ Erro ao adicionar coluna ${columnName}:`, err);
          } else {
            console.log(`✅ Coluna ${columnName} adicionada`);
          }
          
          completed++;
          if (completed === missingColumns.length) {
            console.log('🎉 Migração concluída com sucesso!');
            process.exit(0);
          }
        });
      });
    });
  });
});