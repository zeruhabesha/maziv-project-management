'use strict';

module.exports = {
  async up(qi, Sequelize) {
    const table =
      (await qi.describeTable('Phases').then(()=> 'Phases').catch(()=> null)) ||
      (await qi.describeTable('phases').then(()=> 'phases').catch(()=> null));
    if (!table) throw new Error('Phases table not found');

    const cols = await qi.describeTable(table);
    if (!cols.sequence_order) {
      await qi.addColumn({ tableName: table, schema: 'public' }, 'sequence_order', {
        type: Sequelize.INTEGER, allowNull: true,
      });

      // Optional: backfill with row_number() if you want a default order
      await qi.sequelize.query(
        `UPDATE "public"."${table}" t
         SET sequence_order = s.rn
         FROM (
           SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn
           FROM "public"."${table}"
         ) s
         WHERE t.id = s.id AND t.sequence_order IS NULL;`
      );
    }
  },

  async down(qi) {
    const table =
      (await qi.describeTable('Phases').then(()=> 'Phases').catch(()=> null)) ||
      (await qi.describeTable('phases').then(()=> 'phases').catch(()=> null));
    if (!table) return;
    const cols = await qi.describeTable(table);
    if (cols.sequence_order) await qi.removeColumn({ tableName: table, schema: 'public' }, 'sequence_order');
  }
};
