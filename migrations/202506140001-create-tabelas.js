export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('Usuarios', {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    email: { type: Sequelize.STRING, unique: true },
    senhaHash: Sequelize.STRING,
    ultimaHoraNegociacao: { type: Sequelize.STRING, defaultValue: '14:00' },
    tokenRecSenha: Sequelize.STRING,
    dataTokenRS: Sequelize.DATE,
    createdAt: Sequelize.DATE,
    updatedAt: Sequelize.DATE
  });
  await queryInterface.createTable('AcaoInteresses', {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    ticker: Sequelize.STRING,
    ordem: Sequelize.INTEGER,
    usuarioId: { type: Sequelize.INTEGER, references: { model: 'Usuarios', key: 'id' }, onDelete: 'CASCADE' },
    createdAt: Sequelize.DATE,
    updatedAt: Sequelize.DATE
  });
  await queryInterface.createTable('OrdemCompras', {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    ticker: Sequelize.STRING,
    quantidade: Sequelize.INTEGER,
    modo: Sequelize.ENUM('mercado','abaixo_de_preco'),
    precoReferencia: Sequelize.DECIMAL(10,2),
    precoExecucao: Sequelize.DECIMAL(10,2),
    status: { type: Sequelize.ENUM('pendente','executada'), defaultValue: 'pendente' },
    dataHoraExecucao: Sequelize.DATE,
    usuarioId: { type: Sequelize.INTEGER, references: { model: 'Usuarios', key: 'id' }, onDelete: 'CASCADE' },
    createdAt: Sequelize.DATE,
    updatedAt: Sequelize.DATE
  });
  await queryInterface.createTable('OrdemVendas', {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    ticker: Sequelize.STRING,
    quantidade: Sequelize.INTEGER,
    modo: Sequelize.ENUM('mercado','a_partir_de_preco'),
    precoReferencia: Sequelize.DECIMAL(10,2),
    precoExecucao: Sequelize.DECIMAL(10,2),
    status: { type: Sequelize.ENUM('pendente','executada'), defaultValue: 'pendente' },
    dataHoraExecucao: Sequelize.DATE,
    usuarioId: { type: Sequelize.INTEGER, references: { model: 'Usuarios', key: 'id' }, onDelete: 'CASCADE' },
    createdAt: Sequelize.DATE,
    updatedAt: Sequelize.DATE
  });
  await queryInterface.createTable('CarteiraItems', {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    ticker: Sequelize.STRING,
    quantidade: Sequelize.INTEGER,
    precoCompraMedio: Sequelize.DECIMAL(10,2),
    usuarioId: { type: Sequelize.INTEGER, references: { model: 'Usuarios', key: 'id' }, onDelete: 'CASCADE' },
    createdAt: Sequelize.DATE,
    updatedAt: Sequelize.DATE
  });
  await queryInterface.createTable('ContaCorrentes', {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    dataHora: Sequelize.DATE,
    descricao: Sequelize.STRING,
    tipo: Sequelize.ENUM('deposito','retirada'),
    valor: Sequelize.DECIMAL(10,2),
    saldoApos: Sequelize.DECIMAL(10,2),
    usuarioId: { type: Sequelize.INTEGER, references: { model: 'Usuarios', key: 'id' }, onDelete: 'CASCADE' },
    createdAt: Sequelize.DATE,
    updatedAt: Sequelize.DATE
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('ContaCorrentes');
  await queryInterface.dropTable('CarteiraItems');
  await queryInterface.dropTable('OrdemVendas');
  await queryInterface.dropTable('OrdemCompras');
  await queryInterface.dropTable('AcaoInteresses');
  await queryInterface.dropTable('Usuarios');
}
