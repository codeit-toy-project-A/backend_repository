import express from 'express';
import mongoose from 'mongoose';
import { DATABASE_URL } from './env.js';
import groupRoutes from './routes/groupRoutes.js';
import Group from './models/GroupSchema.js';
import { MongoClient } from 'mongodb';

mongoose.connect(DATABASE_URL)
    .then(() => console.log('Connected to DB'));

const app = express();

app.use(express.json());

app.get('/hello', (req, res) => {
    res.send("Hi");
})

// 그룹 생성
const client = new MongoClient(DATABASE_URL);

app.post('/api/groups', async (req, res) => {

    const group = new Group(req.body);
    await client.connect();
    const db = client.db("test");
    db.collection('groups').save({
        name: group.name,
        password: group.password,
        isPublic: group.isPublic,
        introduction: group.introduction,
        likeCount: group.likeCount,
        badges: group.badges,
        postCount: group.postCount,
        post: group.post,
    }, (error, result)=>{
        res.status(200).send({message: '가입 성공'});
    });
});


app.use('/api', groupRoutes);


app.listen(3000, () => console.log('Server Started'));
