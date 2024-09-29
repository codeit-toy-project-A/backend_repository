import mongoose from "mongoose";

const GroupSchema = new mongoose.Schema (
    {   
        name: {
            type: String,
        },
        password: {
            type: String,
        },
        isPublic: {
            type: Boolean,
            default: true,
        },
        introduction: {
            type: String,
        },
        likeCount: {
            type: Number,
        },
        badges: {
            type: Array,
        },
        postCount: {
            type: Number,
        },
        post: {
            type: Array,
        },
        imageUrl: {
            type: String,
        },
    },
    
    {
        timestamps : true,
    }
)



const Group = mongoose.model('Group', GroupSchema);

export default Group;