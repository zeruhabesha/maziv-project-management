'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const qi = queryInterface;

    const resolveTable = async (preferred, fallback) => {
      // Try quoted Preferred ("Users"), then lowercase fallback (users)
      try { await qi.describeTable(preferred); return preferred; } catch {}
      try { await qi.describeTable(fallback); return fallback; } catch {}
      return null;
    };

    // Detect dependent tables (support either "Camel" or lowercase)
    const usersTable     = await resolveTable('Users', 'users');
    const projectsTable  = await resolveTable('Projects', 'projects');
    const suppliersTable = await resolveTable('Suppliers', 'suppliers');
    const phasesTable    = await resolveTable('Phases', 'phases');

    if (!usersTable)    throw new Error('Users table not found (tried "Users" and users)');
    if (!projectsTable) throw new Error('Projects table not found (tried "Projects" and projects)');
    if (!suppliersTable) throw new Error('Suppliers table not found (tried "Suppliers" and suppliers)');
    if (!phasesTable)    throw new Error('Phases table not found (tried "Phases" and phases)');

    // Decide target Items table name.
    // If you already standardized on "Items" elsewhere, keep it; otherwise you can switch to lowercase.
    const itemsTable = await resolveTable('Items', 'items');
    if (itemsTable) {
      // Table already exists → no-op
      return;
    }

    // Create the Items table (use "Items" to match prior style; change to 'items' if you prefer)
    const targetTable = 'Items';

    await qi.createTable(targetTable, {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      // Core fields used throughout your code
      name:       { type: Sequelize.STRING, allowNull: false },
      type:       { type: Sequelize.STRING, allowNull: true },    // e.g., material/service/etc.
      status:     { type: Sequelize.STRING, allowNull: false, defaultValue: 'pending' },
      quantity:   { type: Sequelize.DECIMAL, allowNull: false, defaultValue: 0 },
      unit_price: { type: Sequelize.DECIMAL, allowNull: false, defaultValue: 0 },
      taxes:      { type: Sequelize.DECIMAL, allowNull: false, defaultValue: 0 },
      deadline:   { type: Sequelize.DATE, allowNull: true },
      file:       { type: Sequelize.STRING, allowNull: true },

      // Foreign keys
      project_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: { tableName: projectsTable, schema: 'public' },
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      supplier_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: { tableName: suppliersTable, schema: 'public' },
          key: 'id',
        },
        onUpdate: 'SET NULL',
        onDelete: 'SET NULL',
      },
      phase_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: { tableName: phasesTable, schema: 'public' },
          key: 'id',
        },
        onUpdate: 'SET NULL',
        onDelete: 'SET NULL',
      },
      assigned_to: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: { tableName: usersTable, schema: 'public' },
          key: 'id',
        },
        onUpdate: 'SET NULL',
        onDelete: 'SET NULL',
      },

      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    // Helpful indexes (optional but recommended)
    await qi.addIndex(targetTable, ['project_id']);
    await qi.addIndex(targetTable, ['supplier_id']);
    await qi.addIndex(targetTable, ['phase_id']);
    await qi.addIndex(targetTable, ['assigned_to']);
    await qi.addIndex(targetTable, ['status']);
    await qi.addIndex(targetTable, ['type']);
    await qi.addIndex(targetTable, ['deadline']);
  },

  async down(queryInterface) {
    const qi = queryInterface;

    // Drop either Items or items if it exists
    const table =
      (await qi.describeTable('Items').then(()=> 'Items').catch(()=> null)) ||
      (await qi.describeTable('items').then(()=> 'items').catch(()=> null));

    if (table) {
      await qi.dropTable(table);
    }
  }
};
