/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: "admin@security.local"
 *         password:
 *           type: string
 *           example: "admin123"
 *     DepartmentDetails:
 *       type: object
 *       nullable: true
 *       properties:
 *         id:
 *           type: string
 *           example: "69df3b3fd7d1b53419bd0764"
 *         name:
 *           type: string
 *           example: "IT Security"
 *         code:
 *           type: string
 *           example: "IT_SECURITY"
 *         isActive:
 *           type: boolean
 *           example: true
 *     UserProfile:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "69de10b99483fb26418de666"
 *         username:
 *           type: string
 *           example: "admin"
 *         email:
 *           type: string
 *           format: email
 *           example: "admin@security.local"
 *         firstName:
 *           type: string
 *           example: "System"
 *         lastName:
 *           type: string
 *           example: "Administrator"
 *         role:
 *           type: string
 *           enum: [admin, analyst, viewer]
 *           example: "admin"
 *         department:
 *           type: string
 *           nullable: true
 *           description: Legacy display name kept for compatibility
 *           example: "IT Security"
 *         departmentId:
 *           type: string
 *           nullable: true
 *           example: "69df3b3fd7d1b53419bd0764"
 *         departmentDetails:
 *           $ref: '#/components/schemas/DepartmentDetails'
 *         isActive:
 *           type: boolean
 *           example: true
 *         lastLogin:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Register a new user
 *     description: Creates a new user account and returns a JWT token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *                 example: "analyst01"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "analyst@company.com"
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: "SecurePass123!"
 *               firstName:
 *                 type: string
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 example: "Doe"
 *               department:
 *                 type: string
 *                 description: Legacy department name. Optional when departmentId is used.
 *                 example: "IT Security"
 *               departmentId:
 *                 type: string
 *                 nullable: true
 *                 description: Optional canonical department reference.
 *                 example: "69df3b3fd7d1b53419bd0764"
 *               role:
 *                 type: string
 *                 enum: [admin, analyst, viewer]
 *                 default: viewer
 *                 example: "analyst"
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/UserProfile'
 *       400:
 *         description: Invalid payload or duplicate user
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Log in a user
 *     description: Validates credentials and returns a JWT token plus user profile.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Invalid credentials or disabled account
 */

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Authentication]
 *     summary: Get current user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current authenticated user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Invalid or expired token
 *
 *   put:
 *     tags: [Authentication]
 *     summary: Update current user profile
 *     description: Updates the current user's editable profile fields.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 example: "Smith"
 *               department:
 *                 type: string
 *                 example: "Cyber Security"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/UserProfile'
 */

/**
 * @swagger
 * /api/auth/change-password:
 *   put:
 *     tags: [Authentication]
 *     summary: Change current user password
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: "oldpassword123"
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 example: "NewPassword123!"
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         description: Current password is incorrect
 */

/**
 * @swagger
 * /api/auth/users:
 *   get:
 *     tags: [Users]
 *     summary: List users (Admin only)
 *     description: Returns paginated users with legacy and canonical department fields.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, analyst, viewer]
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: string
 *         description: Filter users by canonical department id
 *     responses:
 *       200:
 *         description: Paginated user list
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
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserProfile'
 *       403:
 *         description: Admin role required
 */

/**
 * @swagger
 * /api/auth/users/{id}:
 *   put:
 *     tags: [Users]
 *     summary: Update a user (Admin only)
 *     description: Updates role, status, legacy department, or canonical department assignment.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [admin, analyst, viewer]
 *                 example: "analyst"
 *               isActive:
 *                 type: boolean
 *                 example: true
 *               department:
 *                 type: string
 *                 nullable: true
 *                 example: "IT Security"
 *               departmentId:
 *                 type: string
 *                 nullable: true
 *                 description: Set to a department id to assign, or null/empty to clear the canonical department link.
 *                 example: "69df3b3fd7d1b53419bd0764"
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UserProfile'
 *       400:
 *         description: Invalid department id or invalid payload
 *       404:
 *         description: User not found
 *       403:
 *         description: Admin role required
 */
