// server/models/item.cjs
module.exports = (sequelize, DataTypes) => {
  const Item = sequelize.define('Item', {
    id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name:        { type: DataTypes.STRING, allowNull: false },
    type:        { type: DataTypes.STRING },
    status:      { type: DataTypes.STRING, allowNull: false, defaultValue: 'pending' },
    quantity:    { type: DataTypes.DECIMAL, allowNull: false, defaultValue: 0 },
    unit_price:  { type: DataTypes.DECIMAL, allowNull: false, defaultValue: 0 },
    taxes:       { type: DataTypes.DECIMAL, allowNull: false, defaultValue: 0 },
    deadline:    { type: DataTypes.DATE },
    file:        { type: DataTypes.STRING },

    project_id:  { type: DataTypes.INTEGER, allowNull: false },
    supplier_id: { type: DataTypes.INTEGER },
    phase_id:    { type: DataTypes.INTEGER },
    assigned_to: { type: DataTypes.INTEGER },

    createdAt:   { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('NOW()') },
    updatedAt:   { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('NOW()') },
  }, {
    tableName: 'Items',
    freezeTableName: true,
    schema: 'public',
    timestamps: true,
  });

  Item.associate = (models) => {
    Item.belongsTo(models.Project,  { foreignKey: 'project_id',  as: 'Project' });
    Item.belongsTo(models.Supplier, { foreignKey: 'supplier_id', as: 'Supplier' });
    Item.belongsTo(models.Phase,    { foreignKey: 'phase_id',    as: 'Phase' });
    Item.belongsTo(models.User,     { foreignKey: 'assigned_to', as: 'Assignee' });
    Item.hasMany(models.Alert,      { foreignKey: 'item_id',     as: 'Alerts', onUpdate: 'CASCADE', onDelete: 'SET NULL' });
  };

  return Item;
};
