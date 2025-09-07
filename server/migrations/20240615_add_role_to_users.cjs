'use strict';

/**
 * Adds a "role" column to Users table (supports "users" or "Users").
 * Uses ENUM('admin','manager','user'), default 'user'.
 *
 * Idempotent:
 *  - Skips add if column already exists
 *  - Creates enum type only if missing
 *  - Works regardless of table casing
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Resolve actual table name by probing both casings
    const resolveTable = async () => {
      try { await queryInterface.describeTable('Users'); return 'Users'; } catch {}
      try { await queryInterface.describeTable('users'); return 'users'; } catch {}
      throw new Error('Users table not found (tried "Users" and users)');
    };

    const tableName = await resolveTable();
    const tableRef  = { tableName, schema: 'public' };

    // If the column already exists, no-op
    const columns = await queryInterface.describeTable(tableRef);
    if (columns.role) return;

    // Ensure enum type exists before adding column
    const enumTypeName = `enum_${tableName}_role`;
    await queryInterface.sequelize.query(
      `DO $$
       BEGIN
         IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${enumTypeName}') THEN
           CREATE TYPE "${enumTypeName}" AS ENUM ('admin','manager','user');
         END IF;
       END$$;`
    );

    // Finally add the column (ENUM)
    await queryInterface.addColumn(tableRef, 'role', {
      type: Sequelize.ENUM('admin', 'manager', 'user'),
      allowNull: false,
      defaultValue: 'user',
    });
  },

  async down(queryInterface, Sequelize) {
    // Resolve table name again
    const resolveTable = async () => {
      try { await queryInterface.describeTable('Users'); return 'Users'; } catch {}
      try { await queryInterface.describeTable('users'); return 'users'; } catch {}
      return null;
    };

    const tableName = await resolveTable();
    if (!tableName) return; // nothing to do if table not found
    const tableRef  = { tableName, schema: 'public' };

    // Remove column if present
    try {
      const columns = await queryInterface.describeTable(tableRef);
      if (columns.role) {
        await queryInterface.removeColumn(tableRef, 'role');
      }
    } catch (_) {
      // ignore (column may not exist)
    }

    // Drop possible enum types to keep schema clean
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
