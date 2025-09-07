'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const qi = queryInterface;
    const resolveTable = async (camel, lower) => {
      try { await qi.describeTable(camel); return camel; } catch {}
      try { await qi.describeTable(lower); return lower; } catch {}
      return null;
    };

    const usersTable     = await resolveTable('Users', 'users');
    const projectsTable  = await resolveTable('Projects', 'projects');
    const suppliersTable = await resolveTable('Suppliers', 'suppliers');
    const phasesTable    = await resolveTable('Phases', 'phases');

    if (!usersTable)    throw new Error('Users table not found (tried "Users" and users)');
    if (!projectsTable) throw new Error('Projects table not found (tried "Projects" and projects)');
    if (!suppliersTable) throw new Error('Suppliers table not found (tried "Suppliers" and suppliers)');
    if (!phasesTable)    throw new Error('Phases table not found (tried "Phases" and phases)');

    const itemsExisting =
      (await qi.describeTable('Items').then(()=> 'Items').catch(()=> null)) ||
      (await qi.describeTable('items').then(()=> 'items').catch(()=> null));
    if (itemsExisting) return;

    const targetTable = 'Items';
    await qi.createTable(targetTable, {
      id:          { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name:        { type: Sequelize.STRING, allowNull: false },
      type:        { type: Sequelize.STRING, allowNull: true },
      status:      { type: Sequelize.STRING, allowNull: false, defaultValue: 'pending' },
      quantity:    { type: Sequelize.DECIMAL, allowNull: false, defaultValue: 0 },
      unit_price:  { type: Sequelize.DECIMAL, allowNull: false, defaultValue: 0 },
      taxes:       { type: Sequelize.DECIMAL, allowNull: false, defaultValue: 0 },
      deadline:    { type: Sequelize.DATE, allowNull: true },
      file:        { type: Sequelize.STRING, allowNull: true },

      project_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: { tableName: projectsTable, schema: 'public' }, key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      supplier_id: {
        type: Sequelize.INTEGER, allowNull: true,
        references: { model: { tableName: suppliersTable, schema: 'public' }, key: 'id' },
        onUpdate: 'SET NULL', onDelete: 'SET NULL',
      },
      phase_id: {
        type: Sequelize.INTEGER, allowNull: true,
        references: { model: { tableName: phasesTable, schema: 'public' }, key: 'id' },
        onUpdate: 'SET NULL', onDelete: 'SET NULL',
      },
      assigned_to: {
        type: Sequelize.INTEGER, allowNull: true,
        references: { model: { tableName: usersTable, schema: 'public' }, key: 'id' },
        onUpdate: 'SET NULL', onDelete: 'SET NULL',
      },

      createdAt:   { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updatedAt:   { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    await qi.addIndex(targetTable, ['project_id']);
    await qi.addIndex(targetTable, ['supplier_id']);
    await qi.addIndex(targetTable, ['phase_id']);
    await qi.addIndex(targetTable, ['assigned_to']);
    await qi.addIndex(targetTable, ['status']);
    await qi.addIndex(targetTable, ['type']);
    await qi.addIndex(targetTable, ['deadline']);
  },

  async down(qi) {
    const t =
      (await qi.describeTable('Items').then(()=> 'Items').catch(()=> null)) ||
      (await qi.describeTable('items').then(()=> 'items').catch(()=> null));
    if (t) await qi.dropTable(t);
  }
};
