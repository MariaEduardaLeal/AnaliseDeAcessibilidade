const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Analysis = sequelize.define('Analysis', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isUrl: true,
    },
  },
  status: {
    type: DataTypes.ENUM('processing', 'completed', 'error'),
    allowNull: false,
    defaultValue: 'processing',
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 100,
    },
  },
  results: {
    type: DataTypes.JSON,
    allowNull: true,
  },
}, {
  timestamps: true, // Adiciona createdAt e updatedAt automaticamente
});

module.exports = Analysis;