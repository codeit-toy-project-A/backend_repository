// DB와 직접적으로 상호작용하는 공간
import Group from "../models/GroupSchema"; 

const { Group } = require("../models/GroupSchema.js");

class GroupRepository {
 

    async createGroup(data) {
        const group = new Group(req.body);
        return group;
    }


}

export default new GroupRepository();