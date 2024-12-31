const express = require('express');
const {
    createLandplots,
    getAllLandplots,
    editLandplots,
    deleteLandPlots,
    importLandPlots
} = require('../controllers/LandPlots');

const router = express.Router();
/**
 * @swagger
 * /api/land-plots:
 *   post:
 *     summary: Create a new land plot.
 *     description: This endpoint creates a new land plot and stores its information in the database. The geometry is provided in WKT format and is used to calculate the area and perimeter.
 *     tags:
 *       - Landplots
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - owner
 *               - geometry
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the land plot.
 *               owner:
 *                 type: string
 *                 description: The owner of the land plot.
 *               geometry:
 *                 type: string
 *                 description: The geometry of the land plot in WKT format.
 *               properties:
 *                 type: object
 *                 description: Additional properties of the land plot (optional).
 *     responses:
 *       201:
 *         description: Land plot created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: The ID of the newly created land plot.
 *                 name:
 *                   type: string
 *                   description: The name of the land plot.
 *                 owner:
 *                   type: string
 *                   description: The owner of the land plot.
 *                 properties:
 *                   type: object
 *                   description: Additional properties of the land plot.
 *                 area:
 *                   type: number
 *                   description: The area of the land plot.
 *                 perimeter:
 *                   type: number
 *                   description: The perimeter of the land plot.
 *       400:
 *         description: Bad request. Missing required fields.
 *       500:
 *         description: Internal server error. Failed to create the land plot.
 */
router.post('/', createLandplots);

/**
 * @swagger
 * /api/land-plots:
 *   get:
 *     summary: Retrieve all land plots.
 *     description: Fetches all land plots from the database along with their details.
 *     tags:
 *       - Landplots
 *     responses:
 *       200:
 *         description: A list of land plots.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: The unique identifier of the land plot.
 *                   name:
 *                     type: string
 *                     description: The name of the land plot.
 *                   owner:
 *                     type: string
 *                     description: The owner of the land plot.
 *                   properties:
 *                     type: object
 *                     description: Additional properties of the land plot.
 *                   geom:
 *                     type: string
 *                     description: The geometry of the land plot in WKT format.
 *                   area:
 *                     type: number
 *                     description: The area of the land plot.
 *                   perimeter:
 *                     type: number
 *                     description: The perimeter of the land plot.
 *       500:
 *         description: Internal server error. Failed to fetch the land plots.
 */
router.get('/', getAllLandplots);

/**
 * @swagger
 * /api/land-plots/{id}:
 *   patch:
 *     summary: Update an existing land plot.
 *     description: Updates the details of an existing land plot. The geometry can also be updated, which will recalculate the area and perimeter.
 *     tags:
 *       - Landplots
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The unique identifier of the land plot to update.
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The updated name of the land plot.
 *               owner:
 *                 type: string
 *                 description: The updated owner of the land plot.
 *               geometry:
 *                 type: string
 *                 description: The updated geometry of the land plot in WKT format.
 *               properties:
 *                 type: object
 *                 description: Additional updated properties of the land plot.
 *     responses:
 *       200:
 *         description: Land plot updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: The unique identifier of the land plot.
 *                 name:
 *                   type: string
 *                   description: The updated name of the land plot.
 *                 owner:
 *                   type: string
 *                   description: The updated owner of the land plot.
 *                 properties:
 *                   type: object
 *                   description: The updated additional properties of the land plot.
 *                 area:
 *                   type: number
 *                   description: The recalculated area of the land plot (if geometry was updated).
 *                 perimeter:
 *                   type: number
 *                   description: The recalculated perimeter of the land plot (if geometry was updated).
 *       400:
 *         description: Bad request. Invalid or missing data.
 *       500:
 *         description: Internal server error. Failed to update the land plot.
 */
router.patch('/:id', editLandplots);

/**
 * @swagger
 * /api/land-plots/{id}:
 *   delete:
 *     summary: Delete a land plot.
 *     description: Deletes an existing land plot from the database based on its ID.
 *     tags:
 *       - Landplots
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The unique identifier of the land plot to delete.
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Land plot deleted successfully.
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Land plot deleted
 *       404:
 *         description: Land plot not found.
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Land plot not found
 *       500:
 *         description: Internal server error. Failed to delete the land plot.
 */
router.delete('/:id', deleteLandPlots);

/**
 * @swagger
 * /api/land-plots/import:
 *   post:
 *     summary: Import land plots from a GeoJSON file.
 *     description: Imports land plot data from a GeoJSON file. Each feature in the GeoJSON file is inserted as a new land plot in the database.
 *     tags:
 *       - Landplots
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               filePath:
 *                 type: string
 *                 description: The path to the GeoJSON file containing land plot data.
 *                 example: "/path/to/landplots.geojson"
 *     responses:
 *       201:
 *         description: GeoJSON data imported successfully.
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: GeoJSON data imported successfully
 *       400:
 *         description: Bad request. Invalid or missing filePath.
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Invalid filePath
 *       500:
 *         description: Internal server error. Failed to import GeoJSON data.
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Error importing GeoJSON data
 */
router.post('/import', importLandPlots);
module.exports = router;