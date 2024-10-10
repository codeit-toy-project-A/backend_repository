import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema({
    nickname: String,
    content: String,
    password: String,
},

{
    timestamps: true,
});

const Comment = mongoose.model('Comment', CommentSchema);

export default Comment;