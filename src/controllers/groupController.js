class GroupController {
    // 그룹 생성
    async createGroup(req, res) {
        try {
            const newGroup = await groupService.createGroup(req.body);
            res.status(201).json(newGroup);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create group' });
        }
    }

    async updateGroup(req, res) {

    }

    async deleteGroup(req, res) {

    }

    async getGroups(req, res) {

    }

    async getGroupById(req, res) {

    }

    async likeGroup(req, res) {

    }

    async verifyPassword(req, res) {

    }

    async isPublic(req, res) {

    }
}

export default new GroupController();