/* eslint-disable camelcase */
exports.up = (pgm) => {
  pgm.createTable('threads', {
    id: {
      type: 'VARCHAR(50)', // or 'UUID' if you're using UUIDs
      primaryKey: true,
    },
    title: {
      type: 'VARCHAR(255)',
      notNull: true,
    },
    body: {
      type: 'TEXT',
      notNull: true,
    },
    owner: {
      type: 'VARCHAR(50)', // or 'UUID' if using UUIDs
      notNull: true,
      references: '"users"(id)', // Correct foreign key reference
      onDelete: 'CASCADE', // Ensures threads are deleted if the user is deleted
    },
    date: {
      type: 'TIMESTAMP',
      default: pgm.func('current_timestamp'),
      notNull: true,
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('threads');
};
