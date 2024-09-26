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


app.use('/api', groupRoutes);


app.listen(3000, () => console.log('Server Started'));