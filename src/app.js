import express from 'express';
import mongoose from 'mongoose';
import { DATABASE_URL } from './env.js';
import groupRoutes from './routes/groupRoutes.js';
import Group from './models/GroupSchema.js';

mongoose.connect(DATABASE_URL).then(() => console.log('Connected to DB'));

const app = express();

app.use(express.json());

app.get('/hello', (req, res) => {
    res.send("Hi");
})

// 그룹 생성

app.post('/api/groups', (req, res) => {
    const group = new Group(req.body);
    group.save((err, groupInfo) => {
        if (err) return res.json({ success: false, err });
        return res.status(200).json({
          success: true,
        });
    })
});


app.use('/api', groupRoutes);


app.listen(3000, () => console.log('Server Started'));

