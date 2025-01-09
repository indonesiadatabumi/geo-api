const db = require('../db');
const wkx = require('wkx');

exports.createLandplots = async (req, res) => {
    const { name, owner, geometry, properties } = req.body;

    if (!name || !owner || !geometry) {
        return res.status(400).send('Name, owner, and geometry are required');
    }

    try {
        const rawQuery = `
            WITH plot_geom AS (
                SELECT 
                    ST_SetSRID(ST_GeomFromGeoJSON(?), 4326) AS geom
            ),
            plot_details AS (
                SELECT
                    g.geom,
                    ST_Area(g.geom) AS area,
                    ST_Perimeter(g.geom) AS perimeter,
                    JSON_AGG(ST_Length(ST_MakeLine(p1.geom, p2.geom))) AS side_lengths
                FROM plot_geom g,
                LATERAL (
                    SELECT geom
                    FROM ST_DumpPoints(g.geom) AS d1
                    ORDER BY d1.path
                ) AS p1,
                LATERAL (
                    SELECT geom
                    FROM ST_DumpPoints(g.geom) AS d2
                    ORDER BY d2.path
                    LIMIT 1 OFFSET 1
                ) AS p2
                WHERE ST_Contains(g.geom, ST_Centroid(ST_MakeLine(p1.geom, p2.geom)))
                GROUP BY g.geom
            )
            INSERT INTO land_plots (name, owner, geom, area, perimeter, side_lengths, properties)
            SELECT ?, ?, pd.geom, pd.area, pd.perimeter, pd.side_lengths, ?
            FROM plot_details pd
            RETURNING *;
        `;

        const result = await db.raw(
            rawQuery,
            [JSON.stringify(geometry), name, owner, JSON.stringify(properties)]
        );
        result.rows[0].geom = wkx.Geometry.parse(Buffer.from(result.rows[0].geom, 'hex')).toGeoJSON();
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating land plot:', err);
        res.status(500).send('Error creating land plot');
    }

    // const { name, owner, geometry, properties } = req.body;

    // if (!name || !owner || !geometry) {
    //     return res.status(400).send('Name, owner, and geometry are required');
    // }

    // try {
    //     const rawQuery =
    //         `WITH plot_geom AS (
    //         SELECT 
    //             ST_SetSRID(ST_GeomFromGeoJSON(?), 4326) AS geom
    //         ),
    //         plot_details AS (
    //         SELECT
    //             ST_Area(geom) AS area,
    //             ST_Perimeter(geom) AS perimeter
    //         FROM plot_geom
    //         )
    //         INSERT INTO land_plots (name, owner, geom, area, perimeter, properties)
    //         SELECT ?, ?, geom, area, perimeter, ?
    //         FROM plot_geom, plot_details
    //         RETURNING *;`;
    //     const result = await db.raw(
    //         rawQuery,
    //         [JSON.stringify(geometry), name, owner, JSON.stringify(properties)]
    //     );
    //     result.rows[0].geom = wkx.Geometry.parse(Buffer.from(result.rows[0].geom, 'hex')).toGeoJSON();
    //     res.status(201).json(result.rows[0]);
    // } catch (err) {
    //     console.error('Error creating land plot:', err);
    //     res.status(500).send('Error creating land plot');
    // }
};

exports.getAllLandplots = async (req, res) => {
    try {
        // Fetch all plots
        const plots = await db.select('*').from('land_plots');

        // Convert WKB to GeoJSON for each plot
        const plotsWithGeoJSON = plots.map(plot => {
            return {
                ...plot,
                geom: wkx.Geometry.parse(Buffer.from(plot.geom, 'hex')).toGeoJSON(),
            };
        });

        // Send the updated response
        res.status(200).json(plotsWithGeoJSON);
    } catch (err) {
        console.error('Error fetching land plots:', err);
        res.status(500).send('Error fetching land plots');
    }
};

exports.editLandplots = async (req, res) => {
    const { id } = req.params;
    const { name, owner, geometry, properties } = req.body;

    try {
        const updates = { name, owner, properties: JSON.stringify(properties) };

        if (geometry) {
            // Ensure GeoJSON is passed as a string
            const geoJsonString = JSON.stringify(geometry);

            // Generate geometry using ST_GeomFromGeoJSON and cast explicitly
            const geomQuery = await db.raw(
                `SELECT ST_SetSRID(ST_GeomFromGeoJSON(?::json)::geometry, 4326) AS geom`,
                [geoJsonString]
            );
            const geom = geomQuery.rows[0].geom;

            // Calculate area and perimeter with explicit casts
            const areaQuery = await db.raw(`SELECT ST_Area(?::geometry) AS area`, [geom]);
            const perimeterQuery = await db.raw(`SELECT ST_Perimeter(?::geometry) AS perimeter`, [geom]);

            // Calculate side lengths
            const sideLengthsQuery = await db.raw(`
                SELECT JSON_AGG(ST_Length(ST_MakeLine(p1.geom, p2.geom))) AS side_lengths
                FROM (
                    SELECT geom, path
                    FROM ST_DumpPoints(?::geometry)
                    ORDER BY path
                ) AS p1,
                LATERAL (
                    SELECT geom
                    FROM ST_DumpPoints(?::geometry)
                    WHERE path = ARRAY[p1.path[1] + 1]
                ) AS p2
            `, [geom, geom]);

            const sideLengths = sideLengthsQuery.rows[0].side_lengths;

            updates.geom = geom;
            updates.area = areaQuery.rows[0].area;
            updates.perimeter = perimeterQuery.rows[0].perimeter;
            updates.side_lengths = JSON.stringify(sideLengths);
        }

        // Update the land plot
        const updatedResult = await db('land_plots').where({ id }).update(updates).returning('*');
        const updatedPlot = updatedResult[0];

        // Convert WKB to GeoJSON using ST_AsGeoJSON
        const geoJsonQuery = await db.raw(`SELECT ST_AsGeoJSON(geom) AS geojson FROM land_plots WHERE id = ?`, [id]);
        updatedPlot.geom = JSON.parse(geoJsonQuery.rows[0].geojson); // Parse GeoJSON into an object

        res.status(200).json(updatedPlot);
    } catch (err) {
        console.error('Error updating land plot:', err);
        res.status(500).send('Error updating land plot');
    }
    // const { id } = req.params;
    // const { name, owner, geometry, properties } = req.body;

    // try {
    //     const updates = { name, owner, properties: JSON.stringify(properties) };

    //     if (geometry) {
    //         // Ensure GeoJSON is passed as a string
    //         const geoJsonString = JSON.stringify(geometry);

    //         // Generate geometry using ST_GeomFromGeoJSON and cast explicitly
    //         const geomQuery = await db.raw(
    //             `SELECT ST_SetSRID(ST_GeomFromGeoJSON(?::json)::geometry, 4326) AS geom`,
    //             [geoJsonString]
    //         );
    //         const geom = geomQuery.rows[0].geom;

    //         // Calculate area and perimeter with explicit casts
    //         const areaQuery = await db.raw(`SELECT ST_Area(?::geometry) AS area`, [geom]);
    //         const perimeterQuery = await db.raw(`SELECT ST_Perimeter(?::geometry) AS perimeter`, [geom]);

    //         updates.geom = geom;
    //         updates.area = areaQuery.rows[0].area;
    //         updates.perimeter = perimeterQuery.rows[0].perimeter;
    //     }

    //     // Update the land plot
    //     const updatedResult = await db('land_plots').where({ id }).update(updates).returning('*');
    //     const updatedPlot = updatedResult[0];

    //     // Convert WKB to GeoJSON using ST_AsGeoJSON
    //     const geoJsonQuery = await db.raw(`SELECT ST_AsGeoJSON(geom) AS geojson FROM land_plots WHERE id = ?`, [id]);
    //     updatedPlot.geom = JSON.parse(geoJsonQuery.rows[0].geojson); // Parse GeoJSON into an object

    //     res.status(200).json(updatedPlot);
    // } catch (err) {
    //     console.error('Error updating land plot:', err);
    //     res.status(500).send('Error updating land plot');
    // }
};


exports.deleteLandPlots = async (req, res) => {
    const { id } = req.params;

    try {
        await db('land_plots').where({ id }).del();
        res.status(200).send('Land plot deleted');
    } catch (err) {
        console.error('Error deleting land plot:', err);
        res.status(500).send('Error deleting land plot');
    }
};

exports.importLandPlots = async (req, res) => {
    const filePath = req.body.filePath;

    try {
        const geojson = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        for (const feature of geojson.features) {
            const geom = `SRID=4326;${JSON.stringify(feature.geometry)}`;
            const { name, owner, properties } = feature.properties;

            const area = await db.raw(`SELECT ST_Area(ST_GeomFromText(?)) AS area`, [geom]);
            const perimeter = await db.raw(`SELECT ST_Perimeter(ST_GeomFromText(?)) AS perimeter`, [geom]);

            await db('land_plots').insert({
                name,
                owner,
                properties: JSON.stringify(properties),
                geom,
                area: area.rows[0].area,
                perimeter: perimeter.rows[0].perimeter
            });
        }

        res.status(201).send('GeoJSON data imported successfully');
    } catch (err) {
        console.error('Error importing GeoJSON data:', err);
        res.status(500).send('Error importing GeoJSON data');
    }
};