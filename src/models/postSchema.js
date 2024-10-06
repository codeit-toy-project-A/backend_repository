import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
    nickname: String,
    title: String,
    content: String,
    postPassword: String,
    imageUrl: String, 
    tags: Array,
    location: String,
    moment: Date, 
    groupPassword: String,
    isPublic: {type: Boolean, default: true},
    likeCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
},

{
    timestamps: true,
});

const Post = mongoose.model('Post', postSchema);

export default Post;