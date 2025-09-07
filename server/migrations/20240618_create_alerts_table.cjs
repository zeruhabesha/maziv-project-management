'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const qi = queryInterface;

    // Already exists?
    const alertsExisting =
      (await qi.describeTable('Alerts').then(()=> 'Alerts').catch(()=> null)) ||
      (await qi.describeTable('alerts').then(()=> 'alerts').catch(()=> null));
    if (alertsExisting) return;

    // Resolve referenced tables
    const resolveTable = async (camel, lower) => {
      try { await qi.describeTable(camel); return camel; } catch {}
      try { await qi.describeTable(lower); return lower; } catch {}
      return null;
    };

    const itemsTable    = await resolveTable('Items', 'items');
    const projectsTable = await resolveTable('Projects', 'projects');
    if (!itemsTable)    throw new Error('Items table not found (tried "Items" and items)');
    if (!projectsTable) throw new Error('Projects table not found (tried "Projects" and projects)');

    const targetTable = 'Alerts';
    await qi.createTable(targetTable, {
      id:           { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      project_id:   {
        type: Sequelize.INTEGER, allowNull: true,
        references: { model: { tableName: projectsTable, schema: 'public' }, key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      item_id:      {
        type: Sequelize.INTEGER, allowNull: true,
        references: { model: { tableName: itemsTable, schema: 'public' }, key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      // user_id to be added by later migration (20240620_add_user_id_to_alerts.cjs)

      type:         { type: Sequelize.STRING, allowNull: false },
      message:      { type: Sequelize.TEXT, allowNull: false },
      severity:     { type: Sequelize.STRING, allowNull: false, defaultValue: 'medium' },
      triggered_at: { type: Sequelize.DATE,  allowNull: false, defaultValue: Sequelize.fn('NOW') },
      is_read:      { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },

      createdAt:    { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updatedAt:    { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    await qi.addIndex(targetTable, ['project_id']);
    await qi.addIndex(targetTable, ['item_id']);
    await qi.addIndex(targetTable, ['type']);
    await qi.addIndex(targetTable, ['severity']);
    await qi.addIndex(targetTable, ['triggered_at']);
    await qi.addIndex(targetTable, ['is_read']);
  },

  async down(qi) {
    const t =
      (await qi.describeTable('Alerts').then(()=> 'Alerts').catch(()=> null)) ||
      (await qi.describeTable('alerts').then(()=> 'alerts').catch(()=> null));
    if (t) await qi.dropTable(t);
  }
};
