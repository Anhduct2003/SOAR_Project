/**
 * @swagger
 * /api/departments:
 *   get:
 *     tags: [Departments]
 *     summary: List departments (Admin only)
 *     description: Returns department records for management screens and user assignment dropdowns.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Case-insensitive search over name, code, and description
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, code, createdAt, updatedAt, sortOrder]
 *           default: sortOrder
 *       - in: query
 *         name: sortDir
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *     responses:
 *       200:
 *         description: Department list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 3
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Department'
 *       403:
 *         description: Admin role required
 *
 *   post:
 *     tags: [Departments]
 *     summary: Create a department (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: "Threat Hunting"
 *               code:
 *                 type: string
 *                 maxLength: 100
 *                 description: Optional. Generated automatically if omitted or blank.
 *                 example: "THREAT_HUNTING"
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 example: "Handles proactive threat analysis and hunts."
 *               manager:
 *                 type: string
 *                 nullable: true
 *                 description: Optional user id for department manager
 *               parentDepartment:
 *                 type: string
 *                 nullable: true
 *                 description: Optional parent department id
 *               isActive:
 *                 type: boolean
 *                 example: true
 *               sortOrder:
 *                 type: integer
 *                 minimum: 0
 *                 example: 10
 *     responses:
 *       201:
 *         description: Department created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Department'
 *       400:
 *         description: Invalid payload or invalid manager
 */

/**
 * @swagger
 * /api/departments/{id}:
 *   get:
 *     tags: [Departments]
 *     summary: Get a department by id (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Department details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Department'
 *       404:
 *         description: Department not found
 *
 *   put:
 *     tags: [Departments]
 *     summary: Update a department (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             minProperties: 1
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               code:
 *                 type: string
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 500
 *               manager:
 *                 type: string
 *                 nullable: true
 *               parentDepartment:
 *                 type: string
 *                 nullable: true
 *               isActive:
 *                 type: boolean
 *               sortOrder:
 *                 type: integer
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Department updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Department'
 *       400:
 *         description: Invalid payload, invalid manager, invalid parent, self-parent, or cycle
 *       404:
 *         description: Department not found
 *
 *   delete:
 *     tags: [Departments]
 *     summary: Soft-delete a department (Admin only)
 *     description: Marks the department inactive by setting `isActive=false`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Department deactivated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Department'
 *       404:
 *         description: Department not found
 *       400:
 *         description: Department still has active child departments
 */
