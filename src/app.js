import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import { DATABASE_URL } from './env.js';
import groupRoutes from './routes/groupRoutes.js';
import Group from './models/GroupSchema.js';
import fs from 'fs';

// MongoDB 연결
mongoose.connect(DATABASE_URL)
    .then(() => console.log('Connected to DB'));

const app = express();

// JSON 데이터 파싱
app.use(express.json());

// 업로드 폴더 확인 및 생성
const uploadDir = path.resolve('./uploads');  // 절대 경로로 설정
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Multer 설정 (이미지 업로드 처리)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);  // 절대 경로로 이미지가 저장될 폴더 지정
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
            groupData.imageUrl = `./uploads/${req.file.filename}`;  // 이미지 경로를 설정
        }

        const newGroup = new Group(groupData);
        await newGroup.save();

        res.status(201).send({ message: '그룹 생성 성공', group: newGroup });
    } catch (error) {
        res.status(400).send({ message: '그룹 생성 실패', error });
    }
});


// 그룹 수정
app.put('/api/groups/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { password, ...updateData } = req.body;  // 비밀번호와 수정할 데이터를 분리

        // 그룹 찾기
        const group = await Group.findById(id);
        if (!group) {
            return res.status(404).send({ message: '그룹을 찾을 수 없습니다.' });
        }

        // 비밀번호 검증
        if (group.password !== password) {
            return res.status(403).send({ message: '비밀번호가 일치하지 않습니다.' });
        }

        // 비밀번호 일치 시 수정
        const updatedGroup = await Group.findByIdAndUpdate(id, updateData, { new: true });

        res.status(200).send({ message: '수정에 성공했습니다.', group: updatedGroup });
    } catch (error) {
        res.status(400).send({ message: '그룹 수정 실패', error });
    }
});

// 그룹 삭제
app.delete('/api/groups/:groupId', async (req, res) => {
    try {
        const { groupId } = req.params;
        const { password } = req.body;  // 요청 본문에서 비밀번호 받기

        // 그룹 찾기
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).send({ message: '그룹을 찾을 수 없습니다.' });
        }

        // 비밀번호 검증
        if (group.password !== password) {
            return res.status(403).send({ message: '비밀번호가 일치하지 않습니다.' });
        }

        // 비밀번호 일치 시 삭제
        await Group.findByIdAndDelete(groupId);

        res.status(200).send({ message: '그룹 삭제 성공' });
    } catch (error) {
        res.status(400).send({ message: '그룹 삭제 실패', error });
    }
});

// 그룹 목록 조회
app.get('/api/groups', async (req, res) => {
    try {
        const { isPublic, sortBy, search } = req.query;  // 쿼리로 조건을 받음

        // 검색 조건 생성
        let filter = {};
        if (isPublic !== undefined) {
            filter.isPublic = isPublic === 'true';  // 공개 그룹 필터
        }
        if (search) {
            filter.name = { $regex: search, $options: 'i' };  // 그룹명 검색
        }

        // 정렬 옵션
        let sortOption = {};
        if (sortBy === 'recent') {
            sortOption = { createdAt: -1 };  // 최신순
        } else if (sortBy === 'posts') {
            sortOption = { postCount: -1 };  // 게시글 많은순
        } else if (sortBy === 'likes') {
            sortOption = { likeCount: -1 };  // 공감순
        } else if (sortBy === 'badges') {
            sortOption = { badges: -1 };  // 획득 배지순
        }

        // 그룹 목록 조회
        const groups = await Group.find(filter).sort(sortOption);

        // 필요한 필드만 반환
        const groupList = groups.map(group => ({
            imageUrl: group.imageUrl,
            name: group.name,
            introduction: group.introduction,
            isPublic: group.isPublic,
            dDay: Math.floor((Date.now() - new Date(group.createdAt)) / (1000 * 60 * 60 * 24)),  // 디데이 계산
            badgeCount: group.badges.length,
            memoryCount: group.postCount,
            likeCount: group.likeCount,
        }));

        res.status(200).send(groupList);
    } catch (error) {
        res.status(400).send({ message: '그룹 목록 조회 실패', error });
    }
});

// 그룹 상세 조회
app.get('/api/groups/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { password } = req.query;  // 비공개 그룹 비밀번호를 쿼리로 받음

        // 그룹 찾기
        const group = await Group.findById(id);
        if (!group) {
            return res.status(404).send({ message: '그룹을 찾을 수 없습니다.' });
        }

        // 비공개 그룹의 경우 비밀번호 확인
        if (!group.isPublic && group.password !== password) {
            return res.status(403).send({ message: '비밀번호가 일치하지 않습니다.' });
        }

        // 디데이 계산
        const dDay = Math.floor((Date.now() - new Date(group.createdAt)) / (1000 * 60 * 60 * 24));

        // 그룹 상세 정보 반환
        res.status(200).send({
            imageUrl: group.imageUrl,
            name: group.name,
            introduction: group.introduction,
            isPublic: group.isPublic,
            dDay: dDay,
            badges: group.badges,
            memoryCount: group.postCount,
            likeCount: group.likeCount,
            post: group.post,
        });
    } catch (error) {
        res.status(400).send({ message: '그룹 상세 조회 실패', error });
    }
});

// 정적 파일 제공 (이미지 파일 접근 가능하게)
app.use('/uploads', express.static('uploads'));

app.use('/api', groupRoutes);

// 서버 시작
app.listen(3000, () => console.log('Server Started'));
