import express from 'express';
import mongoose from 'mongoose';
import { DATABASE_URL } from './env.js';
import groupRoutes from './routes/groupRoutes.js';
import Group from './models/GroupSchema.js';

mongoose.connect(DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,})
    .then(() => console.log('Connected to DB'));

const app = express();

app.use(express.json());

app.get('/hello', (req, res) => {
    res.send("Hi");
})

// 그룹 생성

app.post('/api/groups', (req, res) => {
    const group = new Group(req.body);
    console.log(group);

    db.collection('groups').insertOne({
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
