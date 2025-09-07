'use strict';

/**
 * Adds a "role" column to the Users table (supports either "users" or "Users").
 * Default: 'user' | ENUM('admin','manager','user')
 *
 * Works around case-sensitivity by probing which table exists.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1) Detect actual table casing
    const [{ exists_lower }] = await queryInterface.sequelize.query(
      `SELECT to_regclass('public.users') AS exists_lower;`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const [{ exists_upper }] = await queryInterface.sequelize.query(
      `SELECT to_regclass('public."Users"') AS exists_upper;`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const tableName = exists_lower ? 'users' : exists_upper ? 'Users' : null;
    if (!tableName) {
      throw new Error(`Users table not found (tried public.users and public."Users").`);
    }

    // 2) Add the role column (ENUM). We pass schema-qualified table ref for safety.
    const tableRef = { tableName, schema: 'public' };

    // Create enum type explicitly to avoid name collisions in some setups
    // Type name follows Sequelize's default naming: enum_<table>_<column>
    const enumTypeName = `enum_${tableName}_role`;

    // Create type if not exists (Postgres 9.6+ doesn't support IF NOT EXISTS; we guard with try/catch)
    try {
      await queryInterface.sequelize.query(
        `DO $$
         BEGIN
           IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${enumTypeName}') THEN
             CREATE TYPE "${enumTypeName}" AS ENUM ('admin','manager','user');
           END IF;
         END$$;`
      );
    } catch (e) {
      // If it already exists, continue
    }

    await queryInterface.addColumn(tableRef, 'role', {
      type: Sequelize.ENUM('admin', 'manager', 'user'),
      allowNull: false,
      defaultValue: 'user',
    });
  },

  async down(queryInterface, Sequelize) {
    // Detect table casing again
    const [{ exists_lower }] = await queryInterface.sequelize.query(
      `SELECT to_regclass('public.users') AS exists_lower;`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const [{ exists_upper }] = await queryInterface.sequelize.query(
      `SELECT to_regclass('public."Users"') AS exists_upper;`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const tableName = exists_lower ? 'users' : exists_upper ? 'Users' : null;
    if (!tableName) return; // nothing to do

    const tableRef = { tableName, schema: 'public' };

    // Remove column if present
    try {
      await queryInterface.removeColumn(tableRef, 'role');
    } catch (e) {
      // ignore if it wasn't added
    }

    // Drop possible enum types to keep schema clean (cover both casings)
    const candidates = [
      `enum_${tableName}_role`, // the type we probably used
      `enum_users_role`,
      `enum_Users_role`,
    ];

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
  },
};
