// server/models/supplier.cjs
module.exports = (sequelize, DataTypes) => {
  const Supplier = sequelize.define('Supplier', {
    id:           { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name:         { type: DataTypes.STRING, allowNull: false },
    company:      { type: DataTypes.STRING },
    contact_name: { type: DataTypes.STRING },
    email:        { type: DataTypes.STRING },
    phone:        { type: DataTypes.STRING },
    address:      { type: DataTypes.STRING },
    createdAt:    { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('NOW()') },
    updatedAt:    { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('NOW()') },
  }, {
    tableName: 'Suppliers',
    freezeTableName: true,
    schema: 'public',
    timestamps: true,
  });

  Supplier.associate = (models) => {
    Supplier.hasMany(models.Item, { foreignKey: 'supplier_id', as: 'Items', onUpdate: 'SET NULL', onDelete: 'SET NULL' });
  };

  return Supplier;
};
