const User = require("../models/User");
const Note = require("../models/Note");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");

/**
 * Method to retrieve all users
 */
const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find().select("-password").lean();

    if (!users?.length) {
        return res.status(400).json({ message: "No users found" });
    }

    res.json(users);
});

/**
 * Method to create a new user
 */
const createNewUser = asyncHandler(async (req, res) => {
    const { username, password, roles } = req.body;

    // Verify data
    if (!username || !password || !Array.isArray(roles) || !roles.length) {
        return res.status(400).json({ message: "All fields are required " });
    }

    // Check for duplicates
    const duplicate = await User.findOne({ username }).lean().exec();

    if (duplicate) {
        return res.status(409).json({ message: "Duplicate username" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const userObject = { username, password: hashedPassword, roles };

    // Save new user
    const user = await User.create(userObject);

    if (user) {
        res.status(201).json({ message: `New User ${username} created` });
    } else {
        res.status(400).json({ message: "Invalid user data received" });
    }
});

/**
 * Method to update a user
 */
const updateUser = asyncHandler(async (req, res) => {  
    const { id, username, roles, active, password } = req.body;

    // Verify data
    if (!id || !username || !Array.isArray(roles) || !roles.length || typeof active !== "boolean") {
        return res.status(400).json({ message: "All fields are required"});
    }

    const user = await User.findById(id).exec();

    if (!user) {
        return res.status(400).json({ message: "User not found"} );
    }

    // Check for duplicates
    const duplicate = await User.findOne({ username }).lean().exec();

    if (duplicate && duplicate?._id.toString() !== id) {
        return res.status(409).json({ message: "Duplicate username" });
    }

    user.username = username;
    user.roles = roles;
    user.active = active;

    if (password) {
        user.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await user.save();

    res.json({ message: `${updatedUser.username} updated`});
});

/**
 * Method to delete a user
 */
const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.body;

    if (!id) {
        return res.status(400).json({ message: "User ID is required" });
    }

    const note = await Note.findOne({ user: id }).lean().exec();

    if (note) {
        return res.status(400).json({ message: "User has assigned notes" });
    }

    const user = await User.findById(id).exec();

    if (!user) {
        return res.status(400).json({ message: "User not found" });
    }

    const result = await user.deleteOne();

    const reply = `User ${result.username} with ID of ${result._id} is deleted`;

    res.json(reply);
});

module.exports = {
    getAllUsers,
    createNewUser,
    updateUser,
    deleteUser,
};
