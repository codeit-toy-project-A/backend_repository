import express from 'express';
import mongoose from 'mongoose';
import { DATABASE_URL } from './env.js';

mongoose.connect(DATABASE_URL).then(() => console.log('Connected to DB'));

const app = express();

app.get('/hello', (req, res) => {
    res.send('Hello Express!');
});

app.listen(3000, () => console.log('Server Started'));