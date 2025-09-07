'use strict';

module.exports = {
  async up(qi, Sequelize) {
    const table =
      (await qi.describeTable('Suppliers').then(()=> 'Suppliers').catch(()=> null)) ||
      (await qi.describeTable('suppliers').then(()=> 'suppliers').catch(()=> null));
    if (!table) throw new Error('Suppliers table not found');

    const cols = await qi.describeTable(table);
    if (!cols.contact_name) {
      await qi.addColumn({ tableName: table, schema: 'public' }, 'contact_name', {
        type: Sequelize.STRING, allowNull: true,
      });
    }
  },

  async down(qi) {
    const table =
      (await qi.describeTable('Suppliers').then(()=> 'Suppliers').catch(()=> null)) ||
      (await qi.describeTable('suppliers').then(()=> 'suppliers').catch(()=> null));
    if (!table) return;
    const cols = await qi.describeTable(table);
    if (cols.contact_name) await qi.removeColumn({ tableName: table, schema: 'public' }, 'contact_name');
  }
};
