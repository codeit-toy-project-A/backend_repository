import express from 'express';
import mongoose from 'mongoose';
import { DATABASE_URL } from './env.js';
import groupRoutes from './routes/groupRoutes.js';
import Group from './models/GroupSchema.js';

mongoose.connect(DATABASE_URL)
    .then(() => console.log('Connected to DB'));

const app = express();

app.use(express.json());

app.get('/hello', (req, res) => {
    res.send("Hi");
})

// 그룹 생성
app.post('/api/groups', async (req, res) => {
    try {
        const group = new Group(req.body);
        const savedGroup = await group.save();  // Mongoose의 save 메서드 사용
        res.status(201).send({ message: '그룹 생성 성공', group: savedGroup });
    } catch (error) {
        res.status(400).send({ error: '그룹 생성 실패', details: error });
    }
});

// 그룹 수정
app.put('/api/groups/:groupId', async (req, res) => {
    try {
        const { groupId } = req.params;
        const updateData = req.body;

        const updateGroup = await Group.findOneAndUpdate({ groupId: groupId }, updateData, { new: true });
        
        if (!updateGroup) {
            return res.status(404).send({ message: '그룹을 찾을 수 없습니다.' });
        }

        res.status(200).send({ message: '수정에 성공했습니다.', group: updateGroup });

    } catch (error) {
        res.status(400).send({ message: '그룹 수정 실패', error });
    }
});

// 그룹 삭제
app.delete('/api/groups/:groupId', async (req, res) => {
    try {
        const { groupId } = req.params; 

        const deletedGroup = await Group.findByIdAndDelete(groupId);
        if (!deletedGroup) {
            return res.status(404).send({ message: '그룹을 찾을 수 없습니다.' });
        }

        res.status(200).send({ message: '그룹 삭제 성공' });
    } catch (error) {
        res.status(400).send({ message: '그룹 삭제 실패', error });
    }
});

app.use('/api', groupRoutes);


app.listen(3000, () => console.log('Server Started'));