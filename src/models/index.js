import sequelize from '../config/database.js';
import { DataTypes } from 'sequelize';

export const Usuario = sequelize.define('Usuario', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  senhaHash: { type: DataTypes.STRING, allowNull: false },
  ultimaHoraNegociacao: { type: DataTypes.STRING, defaultValue: '14:00' },
  tokenRecSenha: { type: DataTypes.STRING },
  dataTokenRS: { type: DataTypes.DATE }
});

export const AcaoInteresse = sequelize.define('AcaoInteresse', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  ticker: { type: DataTypes.STRING, allowNull: false },
  ordem: { type: DataTypes.INTEGER, allowNull: false }
});

export const OrdemCompra = sequelize.define('OrdemCompra', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  ticker: DataTypes.STRING,
  quantidade: DataTypes.INTEGER,
  modo: DataTypes.ENUM('mercado','abaixo_de_preco'),
  precoReferencia: DataTypes.DECIMAL(10,4),
  precoExecucao: DataTypes.DECIMAL(10,4),
  status: { type: DataTypes.ENUM('pendente','executada'), defaultValue: 'pendente' },
  dataHoraExecucao: DataTypes.DATE
});

export const OrdemVenda = sequelize.define('OrdemVenda', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  ticker: DataTypes.STRING,
  quantidade: DataTypes.INTEGER,
  modo: DataTypes.ENUM('mercado','a_partir_de_preco'),
  precoReferencia: DataTypes.DECIMAL(10,4),
  precoExecucao: DataTypes.DECIMAL(10,4),
  status: { type: DataTypes.ENUM('pendente','executada'), defaultValue: 'pendente' },
  dataHoraExecucao: DataTypes.DATE
});

export const CarteiraItem = sequelize.define('CarteiraItem', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  ticker: DataTypes.STRING,
  quantidade: DataTypes.INTEGER,
  precoCompraMedio: DataTypes.DECIMAL(10,4)
});

export const ContaCorrente = sequelize.define('ContaCorrente', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  dataHora: DataTypes.DATE,
  descricao: DataTypes.STRING,
  tipo: DataTypes.ENUM('deposito','retirada'),
  valor: DataTypes.DECIMAL(10,4),
  saldoApos: DataTypes.DECIMAL(10,4)
});

// Associações
Usuario.hasMany(AcaoInteresse, { foreignKey: 'usuarioId', onDelete: 'CASCADE' });
AcaoInteresse.belongsTo(Usuario, { foreignKey: 'usuarioId' });

Usuario.hasMany(OrdemCompra, { foreignKey: 'usuarioId', onDelete: 'CASCADE' });
Usuario.hasMany(OrdemVenda, { foreignKey: 'usuarioId', onDelete: 'CASCADE' });

Usuario.hasMany(CarteiraItem, { foreignKey: 'usuarioId', onDelete: 'CASCADE' });
Usuario.hasMany(ContaCorrente, { foreignKey: 'usuarioId', onDelete: 'CASCADE' });

export default sequelize;
