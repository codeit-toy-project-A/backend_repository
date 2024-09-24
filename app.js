import express from 'express';
import mongoose from 'mongoose';

mongoose.connect('mongodb+srv://sangfjrzl:<ShbGijfB6WyTdSxN>@jogackjip.cskhu.mongodb.net/?retryWrites=true&w=majority&appName=JoGackJip');

const app = express();

app.get('/hello', (req, res) => {
    res.send('Hello Express!');
});

app.listen(3000, () => console.log('Server Started'));