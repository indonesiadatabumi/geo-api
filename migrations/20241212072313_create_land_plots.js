exports.up = function (knex) {
    return knex.schema.createTable('land_plots', (table) => {
        table.increments('id').primary();
        table.string('name').notNullable();
        table.string('owner').notNullable();
        table.jsonb('properties'); // To store additional JSON data
        table.specificType('geom', 'geometry').notNullable(); // PostGIS geometry column
        table.float('area');
        table.float('perimeter');
        table.specificType('side_lengths', 'float[]'); // Array to store side lengths
        table.timestamps(true, true); // Adds created_at and updated_at columns
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('land_plots');
};
