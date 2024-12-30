// app.post('/api/land-plots', 
const db = require('../db');
exports.createLandplots = async (req, res) => {
    const { name, owner, geometry, properties } = req.body;

    if (!name || !owner || !geometry) {
        return res.status(400).send('Name, owner, and geometry are required');
    }

    try {
        const geom = `SRID=4326;${geometry}`; // Geometry in WKT format
        const area = await db.raw(`SELECT ST_Area(ST_GeomFromText(?)) AS area`, [geom]);
        const perimeter = await db.raw(`SELECT ST_Perimeter(ST_GeomFromText(?)) AS perimeter`, [geom]);

        const result = await db('land_plots').insert({
            name,
            owner,
            properties: JSON.stringify(properties),
            geom,
            area: area.rows[0].area,
            perimeter: perimeter.rows[0].perimeter
        }).returning('*');

        res.status(201).json(result[0]);
    } catch (err) {
        console.error('Error creating land plot:', err);
        res.status(500).send('Error creating land plot');
    }
};

exports.getAllLandplots = async (req, res) => {
    try {
        const plots = await db.select('*').from('land_plots');
        res.status(200).json(plots);
    } catch (err) {
        console.error('Error fetching land plots:', err);
        res.status(500).send('Error fetching land plots');
    }
};

exports.editLandplots = async (req, res) => {
    const { id } = req.params;
    const { name, owner, geometry, properties } = req.body;

    try {
        const geom = geometry ? `SRID=4326;${geometry}` : null;
        const updates = { name, owner, properties: JSON.stringify(properties) };

        if (geom) {
            const area = await db.raw(`SELECT ST_Area(ST_GeomFromText(?)) AS area`, [geom]);
            const perimeter = await db.raw(`SELECT ST_Perimeter(ST_GeomFromText(?)) AS perimeter`, [geom]);
            updates.geom = geom;
            updates.area = area.rows[0].area;
            updates.perimeter = perimeter.rows[0].perimeter;
        }

        const result = await db('land_plots').where({ id }).update(updates).returning('*');
        res.status(200).json(result[0]);
    } catch (err) {
        console.error('Error updating land plot:', err);
        res.status(500).send('Error updating land plot');
    }
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