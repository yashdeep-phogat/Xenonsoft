const User = require("../models/User");
const Note = require("../models/Note");
const asyncHandler = require("express-async-handler");

/**
 * Method to retrieve all notes
 */
const getAllNotes = asyncHandler(async (req, res) => {
    const notes = await Note.find().lean();

    if (!notes?.length) {
        return res.status(400).json({ message: "No notes found" });
    }

    // Include user to each note
    const notesWithUser = await Promise.all(
        notes.map(async (note) => {
            const user = await User.findById(note.user).lean().exec();
            return { ...note, username: user.username };
        })
    );

    res.json(notesWithUser);
});

/**
 * Method to create a note
 */
const createNewNote = asyncHandler(async (req, res) => {
    const { user, title, text } = req.body;

    // Verify data
    if (!user || !title || !text) {
        return res.status(400).json({ message: "All fields are required" });
    }

    // Check for duplicates
    const duplicate = await Note.findOne({ title }).lean().exec();

    if (duplicate) {
        return res.status(400).json({ message: "Duplicate note title" });
    }

    const noteObject = { user, title, text };

    // Save new note
    const note = await Note.create(noteObject);

    if (note) {
        res.status(201).json({ message: `New Note ${title} created` });
    } else {
        res.status(400).json({ message: "Invalid note data received" });
    }
});

/**
 * Method to update a note
 */
const updateNote = asyncHandler(async (req, res) => {
    const { id, user, title, text, completed } = req.body;

    // Verify data
    if (!id || !user || !title || !text || typeof completed !== "boolean") {
        return res.status(400).json({ message: "All fields are required" });
    }

    // Check if note exists
    const note = await Note.findById(id).exec();

    if (!note) {
        return res.status(400).json({ message: "Note not found" });
    }

    // Check for duplicates
    const duplicate = await Note.findOne({ title }).lean().exec();

    // Check if duplicate is equivalent to currently being edited note
    if (duplicate && duplicate?._id.toString() !== id) {
        return res.status(409).json({ message: "Duplicate note title" });
    }

    // Save note
    note.user = user;
    note.title = title;
    note.text = text;
    note.completed = completed;

    const updatedNote = await note.save();
    
    res.json(`"${updatedNote.title}" updated`);
});

/**
 * Method to delete a note
 */
const deleteNote = asyncHandler(async (req, res) => {
    const { id } = req.body;

    // Verify data
    if (!id) {
        return res.status(400).json({ message: "Note ID is required" });
    }

    // Check if note exists
    const note = await Note.findById(id).exec();

    if (!note) {
        return res.status(400).json({ message: "Note not found" });
    }

    const result = await note.deleteOne();

    const reply = `Note ${result.title} with ID of ${result._id} is deleted`;

    res.json(reply);
});

module.exports = {
    getAllNotes,
    createNewNote,
    updateNote,
    deleteNote,
};
