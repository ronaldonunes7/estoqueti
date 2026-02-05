const { db } = require('./init');

/**
 * Script de Reset Completo do Banco de Dados
 * Remove todos os dados operacionais preservando estrutura e usuários
 */

const resetDatabase = () => {
  console.log('🗃️ Iniciando reset completo do banco de dados...');
  
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Desabilitar foreign keys temporariamente para facilitar a limpeza
      db.run('PRAGMA foreign_keys = OFF', (err) => {
        if (err) {
          console.error('Erro ao desabilitar foreign keys:', err);
          return reject(err);
        }

        console.log('🔓 Foreign keys desabilitadas temporariamente');

        // 1. LIMPAR DADOS OPERACIONAIS (respeitando ordem de dependências)
        
        // Movimentações e histórico
        db.run('DELETE FROM movements', (err) => {
          if (err) console.error('Erro ao limpar movements:', err);
          else console.log('✅ Tabela movements limpa');
        });

        // Links de relatórios externos
        db.run('DELETE FROM external_report_links', (err) => {
          if (err) console.error('Erro ao limpar external_report_links:', err);
          else console.log('✅ Tabela external_report_links limpa');
        });

        // Termos de responsabilidade
        db.run('DELETE FROM responsibility_terms', (err) => {
          if (err) console.error('Erro ao limpar responsibility_terms:', err);
          else console.log('✅ Tabela responsibility_terms limpa');
        });

        // Ativos (principal tabela operacional)
        db.run('DELETE FROM assets', (err) => {
          if (err) console.error('Erro ao limpar assets:', err);
          else console.log('✅ Tabela assets limpa');
        });

        // Lojas/Unidades
        db.run('DELETE FROM stores', (err) => {
          if (err) console.error('Erro ao limpar stores:', err);
          else console.log('✅ Tabela stores limpa');
        });

        // 2. RESETAR CONTADORES DE ID (sqlite_sequence)
        db.run('DELETE FROM sqlite_sequence WHERE name IN ("assets", "stores", "movements", "external_report_links", "responsibility_terms")', (err) => {
          if (err) console.error('Erro ao resetar sequences:', err);
          else console.log('✅ Contadores de ID resetados');
        });

        // 3. CRIAR FLAG PARA EVITAR INSERÇÃO DE DADOS DE EXEMPLO
        const fs = require('fs');
        const path = require('path');
        const flagPath = path.join(__dirname, '.reset_flag');
        
        try {
          fs.writeFileSync(flagPath, 'reset_done');
          console.log('🚩 Flag de reset criada - dados de exemplo não serão inseridos');
        } catch (err) {
          console.error('Erro ao criar flag de reset:', err);
        }

        // 4. REABILITAR FOREIGN KEYS
        db.run('PRAGMA foreign_keys = ON', (err) => {
          if (err) {
            console.error('Erro ao reabilitar foreign keys:', err);
            return reject(err);
          }

          console.log('🔒 Foreign keys reabilitadas');

          // 5. VERIFICAR INTEGRIDADE
          db.run('PRAGMA integrity_check', (err) => {
            if (err) {
              console.error('Erro na verificação de integridade:', err);
              return reject(err);
            }

            console.log('✅ Verificação de integridade concluída');
            console.log('🎉 Reset do banco de dados concluído com sucesso!');
            console.log('');
            console.log('📊 Estado atual:');
            console.log('- Usuários: PRESERVADOS');
            console.log('- Configurações: PRESERVADAS');
            console.log('- Ativos: LIMPOS (IDs começam em 1)');
            console.log('- Movimentações: LIMPAS (IDs começam em 1)');
            console.log('- Lojas: LIMPAS (IDs começam em 1)');
            console.log('- Links externos: LIMPOS (IDs começam em 1)');
            console.log('- Dados de exemplo: NÃO SERÃO INSERIDOS');
            console.log('');
            console.log('🚀 Sistema pronto para testes do zero!');
            
            resolve();
          });
        });
      });
    });
  });
};

// Executar reset se chamado diretamente
if (require.main === module) {
  resetDatabase()
    .then(() => {
      console.log('✅ Reset concluído. Encerrando processo...');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro durante o reset:', error);
      process.exit(1);
    });
}

module.exports = { resetDatabase };