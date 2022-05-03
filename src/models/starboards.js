const { Schema, model } = require('mongoose');

const  StarboardSchema = new Schema({
    server_id: String,
    original_message_id: String,
    new_message_id: String,
    reaction_count: Number,
});


const STARBOARD = model('STARBOARD', StarboardSchema);

module.exports = {
    StarboardSchema,
    STARBOARD
};
