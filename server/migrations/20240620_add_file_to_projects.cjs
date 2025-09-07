'use strict';

module.exports = {
  async up(qi, Sequelize) {
    const table =
      (await qi.describeTable('Projects').then(()=> 'Projects').catch(()=> null)) ||
      (await qi.describeTable('projects').then(()=> 'projects').catch(()=> null));
    if (!table) throw new Error('Projects table not found');

    const cols = await qi.describeTable(table);
    if (!cols.file) {
      await qi.addColumn({ tableName: table, schema: 'public' }, 'file', {
        type: Sequelize.STRING, allowNull: true,
      });
    }
  },

  async down(qi) {
    const table =
      (await qi.describeTable('Projects').then(()=> 'Projects').catch(()=> null)) ||
      (await qi.describeTable('projects').then(()=> 'projects').catch(()=> null));
    if (!table) return;
    const cols = await qi.describeTable(table);
    if (cols.file) await qi.removeColumn({ tableName: table, schema: 'public' }, 'file');
  }
};
