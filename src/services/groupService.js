class GroupService {
    // 그룹 생성
    async createGroup(data) {
        const { password, ...rest } = data;
        const hashedPassword = await bcrypt.hash(password, 10);
        return groupRepository.createGroup({ ...rest, password: hashedPassword });
    }

    async updateGroup() {

    }

    async deleteGroup() {

    }

    async getGroups() {

    }

    async getGroupById() {

    }

    async likeGroup() {

    }

    async verifyPassword() {

    }

    async isPublic() {

    }
}

export default new GroupService();