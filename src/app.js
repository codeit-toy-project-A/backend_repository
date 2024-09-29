import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import { DATABASE_URL } from './env.js';
import groupRoutes from './routes/groupRoutes.js';
import Group from './models/GroupSchema.js';

// MongoDB 연결
mongoose.connect(DATABASE_URL)
    .then(() => console.log('Connected to DB'));

const app = express();

// JSON 데이터 파싱
app.use(express.json());

// Multer 설정 (이미지 업로드 처리)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');  // 이미지가 저장될 폴더
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));  // 파일 이름 중복 방지
    }
});

const upload = multer({ storage: storage });

// 그룹 생성 요청 처리 (이미지 업로드 포함)
app.post('/api/groups', upload.single('image'), async (req, res) => {
    try {
        const groupData = req.body;

        // 이미지 파일이 업로드된 경우에만 imageUrl을 설정
        if (req.file) {
            groupData.imageUrl = `/uploads/${req.file.filename}`;  // 이미지 경로를 설정
        }

        const newGroup = new Group(groupData);
        await newGroup.save();

        res.status(201).send({ message: '그룹 생성 성공', group: newGroup });
    } catch (error) {
        res.status(400).send({ message: '그룹 생성 실패', error });
    }
});

// 정적 파일 제공 (이미지 파일 접근 가능하게)
app.use('/uploads', express.static('uploads'));

app.use('/api', groupRoutes);

// 서버 시작
app.listen(3000, () => console.log('Server Started'));
