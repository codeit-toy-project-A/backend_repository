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
    isPublic: {type: Boolean, default: true},
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' }, // 그룹 참조
    groupPassword: {type: mongoose.Schema.Types.ObjectId, ref: 'Group'}, // 그룹 비번 참조
    likeCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }] // 댓글 참조
},

{
    timestamp: true,
});

const Post = mongoose.model('Post', postSchema);

export default Post;