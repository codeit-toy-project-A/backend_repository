import mongoose from "mongoose";

const GroupSchema = new mongoose.Schema (
    {
        name: {
            type: String,
        },
        password: {
            type: String,
        },
    },
    {
        timestamps : true,
    }
)
    
const Group = mongoose.model('Group', GroupSchema);

export default Group;