const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath);

const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(async () => {
      try {
        // Tabela de usuários
        db.run(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'viewer',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Tabela de ativos
        db.run(`
          CREATE TABLE IF NOT EXISTS assets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            brand_model TEXT NOT NULL,
            serial_number TEXT UNIQUE NOT NULL,
            patrimony_tag TEXT UNIQUE NOT NULL,
            category TEXT NOT NULL CHECK(category IN ('Hardware', 'Periférico', 'Licença', 'Insumos')),
            status TEXT NOT NULL DEFAULT 'Disponível' CHECK(status IN ('Disponível', 'Em Uso', 'Manutenção', 'Descartado')),
            purchase_date DATE,
            purchase_value DECIMAL(10,2),
            warranty_expiry DATE,
            location TEXT,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Tabela de lojas/unidades
        db.run(`
          CREATE TABLE IF NOT EXISTS stores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            address TEXT NOT NULL,
            number TEXT,
            neighborhood TEXT,
            city TEXT NOT NULL,
            cep TEXT,
            phone TEXT,
            responsible TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Tabela de movimentações (histórico imutável) - expandida
        db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='movements'", (err, row) => {
          if (!row) {
            // Tabela não existe, criar nova
            db.run(`
              CREATE TABLE movements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                asset_id INTEGER NOT NULL,
                type TEXT NOT NULL CHECK(type IN ('Entrada', 'Saída', 'Manutenção', 'Descarte', 'Transferência', 'Recebimento')),
                employee_name TEXT NOT NULL,
                destination TEXT,
                store_id INTEGER,
                quantity INTEGER DEFAULT 1,
                responsible_technician TEXT NOT NULL,
                observations TEXT,
                movement_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_by INTEGER NOT NULL,
                FOREIGN KEY (asset_id) REFERENCES assets (id),
                FOREIGN KEY (store_id) REFERENCES stores (id),
                FOREIGN KEY (created_by) REFERENCES users (id)
              )
            `);
            console.log('✅ Tabela movements criada com sucesso!');
          } else {
            // Tabela existe, verificar se tem a constraint correta
            db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='movements'", (err, tableInfo) => {
              if (err) {
                console.error('Erro ao verificar tabela movements:', err);
                return;
              }
              
              console.log('🔍 Verificando constraint da tabela movements...');
              const hasRecebimento = tableInfo && tableInfo.sql.includes('Recebimento');
              const hasTransferencia = tableInfo && tableInfo.sql.includes('Transferência');
              
              if (!hasRecebimento || !hasTransferencia) {
                console.log('⚠️ Atualizando tabela movements para incluir Transferência e Recebimento...');
                console.log('Current SQL:', tableInfo?.sql);
                
                // Backup dos dados existentes
                db.run(`CREATE TABLE movements_backup AS SELECT * FROM movements`, (err) => {
                  if (err) {
                    console.error('Erro ao criar backup:', err);
                    return;
                  }
                  
                  // Dropar tabela antiga
                  db.run(`DROP TABLE movements`, (err) => {
                    if (err) {
                      console.error('Erro ao dropar tabela:', err);
                      return;
                    }
                    
                    // Recriar com nova constraint
                    db.run(`
                      CREATE TABLE movements (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        asset_id INTEGER NOT NULL,
                        type TEXT NOT NULL CHECK(type IN ('Entrada', 'Saída', 'Manutenção', 'Descarte', 'Transferência', 'Recebimento')),
                        employee_name TEXT NOT NULL,
                        destination TEXT,
                        store_id INTEGER,
                        quantity INTEGER DEFAULT 1,
                        responsible_technician TEXT NOT NULL,
                        observations TEXT,
                        movement_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                        created_by INTEGER NOT NULL,
                        FOREIGN KEY (asset_id) REFERENCES assets (id),
                        FOREIGN KEY (store_id) REFERENCES stores (id),
                        FOREIGN KEY (created_by) REFERENCES users (id)
                      )
                    `, (err) => {
                      if (err) {
                        console.error('Erro ao recriar tabela:', err);
                        return;
                      }
                      
                      // Restaurar dados (com valores padrão para novas colunas)
                      db.run(`
                        INSERT INTO movements (
                          id, asset_id, type, employee_name, destination, responsible_technician, 
                          observations, movement_date, created_by, store_id, quantity
                        )
                        SELECT 
                          id, asset_id, type, employee_name, destination, responsible_technician, 
                          observations, movement_date, created_by, NULL, 1
                        FROM movements_backup
                      `, (err) => {
                        if (err) {
                          console.error('Erro ao restaurar dados:', err);
                          return;
                        }
                        
                        // Limpar backup
                        db.run(`DROP TABLE movements_backup`, (err) => {
                          if (err) {
                            console.error('Erro ao limpar backup:', err);
                          } else {
                            console.log('✅ Tabela movements atualizada com sucesso!');
                          }
                        });
                      });
                    });
                  });
                });
              } else {
                console.log('✅ Tabela movements já está atualizada!');
              }
            });
          }
        });

        // Expandir tabela de ativos para suportar insumos
        db.run(`ALTER TABLE assets ADD COLUMN asset_type TEXT DEFAULT 'unique' CHECK(asset_type IN ('unique', 'consumable'))`, (err) => {
          if (err && !err.message.includes('duplicate column')) {
            console.error('Erro ao adicionar coluna asset_type:', err);
          }
        });
        
        db.run(`ALTER TABLE assets ADD COLUMN stock_quantity INTEGER DEFAULT 0`, (err) => {
          if (err && !err.message.includes('duplicate column')) {
            console.error('Erro ao adicionar coluna stock_quantity:', err);
          }
        });
        
        db.run(`ALTER TABLE assets ADD COLUMN min_stock INTEGER DEFAULT 0`, (err) => {
          if (err && !err.message.includes('duplicate column')) {
            console.error('Erro ao adicionar coluna min_stock:', err);
          }
        });

        // Adicionar campo de código de barras
        db.run(`ALTER TABLE assets ADD COLUMN barcode TEXT`, (err) => {
          if (err && !err.message.includes('duplicate column')) {
            console.error('Erro ao adicionar coluna barcode:', err);
          } else if (!err) {
            // Após adicionar a coluna, criar índice único
            db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_assets_barcode ON assets(barcode) WHERE barcode IS NOT NULL`, (err) => {
              if (err) {
                console.error('Erro ao criar índice único para barcode:', err);
              }
            });
          }
        });

        // Atualizar constraint de status para incluir 'Em Trânsito'
        // Verificar se a tabela já tem o novo status
        db.get("PRAGMA table_info(assets)", (err, info) => {
          if (err) {
            console.log('Erro ao verificar estrutura da tabela assets:', err.message);
          } else {
            // Verificar se a constraint já inclui 'Em Trânsito'
            db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='assets'", (err, row) => {
              if (err) {
                console.log('Erro ao verificar constraint:', err.message);
              } else if (row && !row.sql.includes("'Em Trânsito'")) {
                console.log('🔄 Atualizando constraint de status para incluir "Em Trânsito"...');
                
                // Migração: Recriar tabela com nova constraint
                db.serialize(() => {
                  // 1. Criar tabela temporária com nova constraint
                  db.run(`
                    CREATE TABLE assets_new (
                      id INTEGER PRIMARY KEY AUTOINCREMENT,
                      name TEXT NOT NULL,
                      brand_model TEXT NOT NULL,
                      serial_number TEXT UNIQUE NOT NULL,
                      patrimony_tag TEXT UNIQUE NOT NULL,
                      category TEXT NOT NULL CHECK(category IN ('Hardware', 'Periférico', 'Licença', 'Insumos')),
                      status TEXT NOT NULL DEFAULT 'Disponível' CHECK(status IN ('Disponível', 'Em Uso', 'Manutenção', 'Descartado', 'Em Trânsito')),
                      purchase_date DATE,
                      purchase_value DECIMAL(10,2),
                      warranty_expiry DATE,
                      location TEXT,
                      notes TEXT,
                      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                      barcode TEXT UNIQUE,
                      asset_type TEXT NOT NULL DEFAULT 'unique' CHECK(asset_type IN ('unique', 'consumable')),
                      stock_quantity INTEGER DEFAULT 0
                    )
                  `, (err) => {
                    if (err) {
                      console.log('Erro ao criar tabela temporária:', err.message);
                      return;
                    }
                    
                    // 2. Copiar dados da tabela original
                    db.run(`
                      INSERT INTO assets_new 
                      SELECT id, name, brand_model, serial_number, patrimony_tag, category, status, 
                             purchase_date, purchase_value, warranty_expiry, location, notes, 
                             created_at, updated_at, barcode, asset_type, stock_quantity
                      FROM assets
                    `, (err) => {
                      if (err) {
                        console.log('Erro ao copiar dados:', err.message);
                        return;
                      }
                      
                      // 3. Remover tabela original
                      db.run('DROP TABLE assets', (err) => {
                        if (err) {
                          console.log('Erro ao remover tabela original:', err.message);
                          return;
                        }
                        
                        // 4. Renomear tabela nova
                        db.run('ALTER TABLE assets_new RENAME TO assets', (err) => {
                          if (err) {
                            console.log('Erro ao renomear tabela:', err.message);
                          } else {
                            console.log('✅ Constraint de status atualizada com sucesso!');
                          }
                        });
                      });
                    });
                  });
                });
              } else {
                console.log('✅ Constraint de status já está atualizada');
              }
            });
            
            // Normalizar status existentes
            db.run(`
              UPDATE assets SET status = 'Disponível' 
              WHERE status NOT IN ('Disponível', 'Em Uso', 'Manutenção', 'Descartado', 'Em Trânsito')
            `, (err) => {
              if (err) {
                console.log('Aviso: Não foi possível normalizar status:', err.message);
              } else {
                console.log('✅ Status de ativos normalizados');
              }
            });
          }
        });

        // Expandir tabela de movimentações (caso já exista sem as novas colunas)
        db.run(`ALTER TABLE movements ADD COLUMN store_id INTEGER`, (err) => {
          if (err && !err.message.includes('duplicate column')) {
            console.error('Erro ao adicionar coluna store_id:', err);
          }
        });
        
        db.run(`ALTER TABLE movements ADD COLUMN quantity INTEGER DEFAULT 1`, (err) => {
          if (err && !err.message.includes('duplicate column')) {
            console.error('Erro ao adicionar coluna quantity:', err);
          }
        });

        // Criar usuário admin padrão
        const adminPassword = await bcrypt.hash('admin123', 10);
        db.run(`
          INSERT OR IGNORE INTO users (username, email, password, role) 
          VALUES ('admin', 'admin@empresa.com', ?, 'admin')
        `, [adminPassword]);

        // Criar usuário viewer padrão
        const viewerPassword = await bcrypt.hash('viewer123', 10);
        db.run(`
          INSERT OR IGNORE INTO users (username, email, password, role) 
          VALUES ('gerencia', 'gerencia@empresa.com', ?, 'viewer')
        `, [viewerPassword]);

        // Inserir algumas lojas de exemplo
        const sampleStores = [
          ['Shopping Prohospital', 'Av. Dom Luís, 1200', '1200', 'Meireles', 'Fortaleza', '60160-230', '(85) 3456-7890', 'João Silva'],
          ['Shopping Iguatemi', 'Av. Washington Soares, 85', '85', 'Edson Queiroz', 'Fortaleza', '60811-341', '(85) 3456-7891', 'Maria Santos'],
          ['North Shopping', 'Av. Bezerra de Menezes, 2450', '2450', 'São Gerardo', 'Fortaleza', '60325-005', '(85) 3456-7892', 'Pedro Costa']
        ];

        const insertStore = db.prepare(`
          INSERT OR IGNORE INTO stores (name, address, number, neighborhood, city, cep, phone, responsible) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        sampleStores.forEach(store => {
          insertStore.run(store);
        });

        insertStore.finalize();
        console.log('✅ Lojas de exemplo inseridas:', sampleStores.length);

        // Inserir alguns ativos de exemplo (atualizados com valores)
        const sampleAssets = [
          ['Notebook Dell Latitude 5520', 'Dell Latitude 5520', 'DL5520001', 'PAT001', '7891234567890', 'Hardware', 'Disponível', 'unique', 1, 0, '2024-01-15', 3500.00, '2027-01-15'],
          ['Monitor LG 24"', 'LG 24MK430H', 'LG24001', 'PAT002', '7891234567891', 'Periférico', 'Disponível', 'unique', 1, 0, '2024-02-10', 850.00, '2027-02-10'],
          ['Licença Office 365', 'Microsoft Office 365', 'MS365001', 'PAT003', '7891234567892', 'Licença', 'Em Uso', 'unique', 1, 0, '2024-01-01', 450.00, '2025-01-01'],
          ['Desktop HP EliteDesk', 'HP EliteDesk 800 G6', 'HP800001', 'PAT004', '7891234567893', 'Hardware', 'Manutenção', 'unique', 1, 0, '2023-12-05', 2800.00, '2026-12-05'],
          ['Cabo HDMI 2m', 'Cabo HDMI', '', '', '7891234567894', 'Insumos', 'Disponível', 'consumable', 50, 10, '2024-03-01', 25.00, null],
          ['Mouse USB', 'Mouse Óptico USB', '', '', '7891234567895', 'Insumos', 'Disponível', 'consumable', 25, 5, '2024-03-01', 35.00, null],
          ['Teclado USB', 'Teclado ABNT2 USB', '', '', '7891234567896', 'Insumos', 'Disponível', 'consumable', 15, 3, '2024-03-01', 120.00, null]
        ];

        const insertAsset = db.prepare(`
          INSERT OR REPLACE INTO assets (name, brand_model, serial_number, patrimony_tag, barcode, category, status, asset_type, stock_quantity, min_stock, purchase_date, purchase_value, warranty_expiry) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        sampleAssets.forEach(asset => {
          insertAsset.run(asset);
        });

        insertAsset.finalize();

        // Tabela de links externos para relatórios
        db.run(`
          CREATE TABLE IF NOT EXISTS external_report_links (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            token TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            scope TEXT NOT NULL CHECK(scope IN ('general', 'store', 'multi_store')),
            store_ids TEXT, -- JSON array para múltiplas lojas
            period TEXT NOT NULL CHECK(period IN ('7days', '30days', 'current_month')),
            password_hash TEXT,
            expires_at DATETIME NOT NULL,
            show_financial BOOLEAN DEFAULT 1, -- Controle de exibição de valores
            click_count INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT 1,
            created_by INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_accessed DATETIME,
            FOREIGN KEY (created_by) REFERENCES users (id)
          )
        `);

        // Tabela de termos de responsabilidade
        db.run(`
          CREATE TABLE IF NOT EXISTS responsibility_terms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            term_number TEXT UNIQUE NOT NULL,
            movement_id INTEGER NOT NULL,
            recipient_name TEXT NOT NULL,
            recipient_cpf TEXT NOT NULL,
            recipient_email TEXT,
            recipient_unit TEXT NOT NULL,
            signature_data TEXT,
            pdf_path TEXT,
            pdf_blob BLOB,
            created_by INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (movement_id) REFERENCES movements (id),
            FOREIGN KEY (created_by) REFERENCES users (id)
          )
        `);

        console.log('✅ Banco de dados inicializado com sucesso');
        console.log('👤 Usuário Admin: admin / admin123');
        console.log('👤 Usuário Gerência: gerencia / viewer123');
        
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
};

module.exports = { db, initDatabase };