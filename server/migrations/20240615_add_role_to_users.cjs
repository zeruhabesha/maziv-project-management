'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Resolve actual table name ("Users" vs users)
    const resolveTable = async () => {
      try { await queryInterface.describeTable('Users'); return 'Users'; } catch {}
      try { await queryInterface.describeTable('users'); return 'users'; } catch {}
      throw new Error('Users table not found (tried "Users" and users)');
    };

    const tableName = await resolveTable();
    const tableRef  = { tableName, schema: 'public' };

    // Skip if column exists
    const columns = await queryInterface.describeTable(tableRef);
    if (columns.role) return;

    const enumTypeName = `enum_${tableName}_role`;
    await queryInterface.sequelize.query(
      `DO $$
       BEGIN
         IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${enumTypeName}') THEN
           CREATE TYPE "${enumTypeName}" AS ENUM ('admin','manager','user');
         END IF;
       END$$;`
    );

    await queryInterface.addColumn(tableRef, 'role', {
      type: Sequelize.ENUM('admin', 'manager', 'user'),
      allowNull: false,
      defaultValue: 'user',
    });
  },

  async down(queryInterface) {
    const resolveTable = async () => {
      try { await queryInterface.describeTable('Users'); return 'Users'; } catch {}
      try { await queryInterface.describeTable('users'); return 'users'; } catch {}
      return null;
    };

    const tableName = await resolveTable();
    if (!tableName) return;
    const tableRef  = { tableName, schema: 'public' };

    try {
      const columns = await queryInterface.describeTable(tableRef);
      if (columns.role) await queryInterface.removeColumn(tableRef, 'role');
    } catch {}

    const candidates = new Set([
      `enum_${tableName}_role`,
      'enum_users_role',
      'enum_Users_role',
    ]);

    for (const t of candidates) {
      await queryInterface.sequelize.query(
        `DO $$
         BEGIN
           IF EXISTS (SELECT 1 FROM pg_type WHERE typname = '${t}') THEN
             DROP TYPE "${t}";
           END IF;
         END$$;`
      );
    }
  }
};
