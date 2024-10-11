import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import { DATABASE_URL } from './env.js';
import Group from './models/GroupSchema.js';
import fs from 'fs';
import bcrypt from 'bcrypt';
import Post from './models/postSchema.js';
import Comment from './models/CommentSchema.js';
import cors from 'cors';

// MongoDB 연결
mongoose.connect(DATABASE_URL)
    .then(() => console.log('Connected to DB'));

const app = express();



// JSON 데이터 파싱
app.use(express.json());
app.use(cors());

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

        // 비밀번호 해싱
        const hashedPassword = await bcrypt.hash(groupData.password, 10);
        groupData.password = hashedPassword; // 해싱한 비밀번호로 설정

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
app.put('/api/groups/:groupId', async (req, res) => {
    try {
        const { groupId } = req.params;  // groupId로 통일
        const { password, ...updateData } = req.body;  // 비밀번호와 수정할 데이터를 분리

        // 그룹 찾기
        const group = await Group.findById(groupId);  // groupId 사용
        if (!group) {
            return res.status(404).send({ message: '그룹을 찾을 수 없습니다.' });
        }

        // 비밀번호 검증
        const isPasswordValid = await bcrypt.compare(password, group.password); // 해시된 비밀번호 비교
        if (!isPasswordValid) {
            return res.status(403).send({ message: '비밀번호가 일치하지 않습니다.' });
        }

        // 비밀번호 일치 시 수정
        const updatedGroup = await Group.findByIdAndUpdate(groupId, updateData, { new: true });  // groupId 사용

        res.status(200).send({ message: '수정에 성공했습니다.', group: updatedGroup });
    } catch (error) {
        res.status(400).send({ message: '그룹 수정 실패', error });
    }
});

// 그룹 삭제
app.delete('/api/groups/:groupId', async (req, res) => {
    try {
        const { groupId } = req.params;  // groupId로 통일
        const { password } = req.body;  // 요청 본문에서 비밀번호 받기

        // 그룹 찾기
        const group = await Group.findById(groupId);  // groupId 사용
        if (!group) {
            return res.status(404).send({ message: '그룹을 찾을 수 없습니다.' });
        }

        // 비밀번호 검증
        const isPasswordValid = await bcrypt.compare(password, group.password); // 해시된 비밀번호 비교
        if (!isPasswordValid) {
            return res.status(403).send({ message: '비밀번호가 일치하지 않습니다.' });
        }

        // 비밀번호 일치 시 삭제
        await Group.findByIdAndDelete(groupId);  // groupId 사용

        res.status(200).send({ message: '그룹 삭제 성공' });
    } catch (error) {
        res.status(400).send({ message: '그룹 삭제 실패', error });
    }
});

// 그룹 목록 조회
app.get('/api/groups', async (req, res) => {
    try {
        const { isPublic, sortBy, keyword } = req.query;  // 쿼리로 조건을 받음

        // 검색 조건 생성
        let filter = {};
        if (isPublic != undefined) {
            filter.isPublic = isPublic == 'true';  // 공개 그룹 필터
        }
        if (keyword) {
            filter.name = { $regex: keyword, $options: 'i' };  // 그룹명 검색
        }

        // 정렬 옵션
        let sortOption = {};
        if (sortBy == 'latest') {
            sortOption = { createdAt: -1 };  // 최신순
        } else if (sortBy == 'mostPosted') {
            sortOption = { postCount: -1 };  // 게시글 많은순
        } else if (sortBy == 'mostLiked') {
            sortOption = { likeCount: -1 };  // 공감순
        } else if (sortBy == 'mostBadge') {
            sortOption = { badges: -1 };  // 획득 배지순
        }

        // 그룹 목록 및 총 그룹 수 조회
        const totalItemCount = await Group.countDocuments(filter); // 총 그룹 수

        const groups = await Group.find(filter).sort(sortOption);  // 그룹 목록 조회

        // 필요한 필드만 반환
        const groupList = groups.map(group => ({
            id: group._id,
            imageUrl: group.imageUrl,
            name: group.name,
            introduction: group.introduction,
            isPublic: group.isPublic,
            badgeCount: group.badges.length,
            postCount: group.postCount,
            likeCount: group.likeCount,
            createdAt: group.createdAt
        }));

        // 리스폰스 반환
        res.status(200).send({
            currentPage: 1, // 고정된 값
            totalPages: 5,  // 고정된 값
            totalItemCount, // DB에서 계산된 그룹 총 수
            data: groupList  // 그룹 목록
        });
    } catch (error) {
        res.status(400).send({ message: '그룹 목록 조회 실패', error });
    }
});

// 그룹 상세 조회
app.get('/api/groups/:groupId', async (req, res) => {
    try {
        const { groupId } = req.params;
        const { password } = req.query;

        // 그룹 찾기
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).send({ message: '그룹을 찾을 수 없습니다.' });
        }

        // 비공개 그룹의 경우 비밀번호 확인
        if (!group.isPublic) {
            const isPasswordValid = await bcrypt.compare(password, group.password);
            if (!isPasswordValid) {
                return res.status(403).send({ message: '비밀번호가 일치하지 않습니다.' });
            }
        }

        const dDay = Math.floor((Date.now() - new Date(group.createdAt)) / (1000 * 60 * 60 * 24));

        res.status(200).send({
            imageUrl: group.imageUrl,
            name: group.name,
            introduction: group.introduction,
            isPublic: group.isPublic,
            badges: group.badges,
            postCount: group.postCount,
            likeCount: group.likeCount,
            createdAt: group.createdAt,
            post: group.post,
        });
    } catch (error) {
        res.status(400).send({ message: '그룹 상세 조회 실패', error });
    }
});

// 조회 권한 확인

app.get('/api/groups/:groupId/verify-password', async (req, res) => {
    try {
        const groupId = req.params;
        const password = req.query;
    
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).send({ message: '그룹을 찾을 수 없습니다.' });
        }
    
        const isPasswordValid = await bcrypt.compare(password, group.password);
        
        if(!isPasswordValid) {
            return res.status(401).send({ message: '비밀번호가 틀렸습니다.' });
        }
    
        res.status(200).send({message : '비밀번호가 확인되었습니다.'});
    } catch (error) {
        res.status(400).send({ message: '권한 확인 실패', error });
    }
});

// 공감 보내기
app.post('/api/groups/:groupId/like', async (req, res) => {
    try {
        const { groupId } = req.params;

        // 그룹의 likeCount를 1 증가
        const group = await Group.findByIdAndUpdate(groupId, { $inc: { likeCount: 1 } }, { new: true });
        if (!group) {
            return res.status(404).send({ message: '그룹을 찾을 수 없습니다.' });
        }

        res.status(200).send({ message: '공감이 추가되었습니다.', likeCount: group.likeCount });
    } catch (error) {
        res.status(400).send({ message: '공감 추가 실패', error });
    }
});

// 정적 파일 제공 (이미지 파일 접근 가능하게)
app.use('/uploads', express.static('uploads'));


// 서버 시작
app.listen(3000, () => console.log('Server Started'));

// -------------------------------------------------------- //

// 게시물 기능

// 게시물 생성 

app.post('/api/groups/:groupId/posts', async (req, res) => {
    try {
        const { nickname, title, content, postPassword, groupPassword, imageUrl, tags, location, moment, isPublic } = req.body;
        const { groupId } = req.params;  // URL에서 groupId를 가져옴

        const hashedPostPassword = postPassword ? await bcrypt.hash(postPassword, 10) : null;



        const group = await Group.findById(groupId); 
        if (!group) {
            return res.status(404).send({ message: '그룹을 찾을 수 없습니다.' });
        }
        
        console.log('Group Password:', group.password);
        console.log('Provided Group Password:', groupPassword);

        const isPasswordValid = await bcrypt.compare(groupPassword, group.password);

        if (!isPasswordValid) {
            return res.status(403).send({ message: '그룹 비밀번호가 일치하지 않습니다.' });
        }

        const newPost = new Post({
            groupId : groupId,
            nickname : nickname,
            title : title,
            content : content,
            imageUrl : imageUrl,
            tags : tags,
            location : location,
            moment : moment,
            isPublic : isPublic,
            postPassword: hashedPostPassword,
        });

        await newPost.save();
        res.status(201).send({ message: '게시글이 성공적으로 등록되었습니다.', post: newPost });
    } catch (error) {
        console.log(error); 
        res.status(400).send({ message: '게시글 등록 실패', error });
    }
});

// 게시글 목록 조회
app.get('/api/groups/:groupId/posts', async (req, res) => {
    try {
        const { groupId } = req.params;
        const { keyword, sortBy, isPublic } = req.query;

        // 필터 및 검색 조건
        let filter = {};

        if (isPublic !== undefined) filter.isPublic = isPublic === 'true';
        if (keyword) filter.title = { $regex: keyword, $options: 'i' };  // 제목 검색

        // 정렬 조건
        let sortOption = {};
        if (sortBy === 'latest') sortOption = { createdAt: -1 };  // 최신순
        else if (sortBy === 'mostLiked') sortOption = { likeCount: -1 };  // 공감 많은순
        else if (sortBy === 'mostCommented') sortOption = { commentCount: -1 };  // 공감 많은순

        const posts = await Post.find(filter).sort(sortOption);  // 그룹 목록 조회

        // 필요한 필드만 반환
        const postList = posts.map(post => ({
            id: post._id,
            nickname: post.nickname,
            title: post.title,
            imageUrl: post.imageUrl,
            tags: post.tags,
            location: post.location,
            moment: post.moment,
            isPublic: post.isPublic,
            likeCount: post.likeCount,
            commentCount: post.commentCount,
            createdAt: post.createdAt,
        }));

        // 게시물 수 
        const totalItemCount = await Post.countDocuments(filter);

        // 게시글 반환
        res.status(200).send({
            currentPage: 1, // 고정된 값
            totalPages: 5,
            totalItemCount,
            data : postList,
        });
    } catch (error) {
        res.status(400).send({ message: '게시글 목록 조회 실패', error });
    }
});

// 게시글 삭제
app.delete('/api/posts/:postId', async (req, res) => {
    try {
        const { postId } = req.params;
        const { postPassword } = req.body;

        // 게시글 찾기
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).send({ message: '게시글을 찾을 수 없습니다.' });
        }

        // 비공개 글일 경우 비밀번호 확인
        if (!post.isPublic && postPassword) {
            const isPasswordValid = await bcrypt.compare(postPassword, post.postPassword);
            if (!isPasswordValid) {
                return res.status(403).send({ message: '비밀번호가 일치하지 않습니다.' });
            }
        }

        // 게시글 삭제
        await Post.findByIdAndDelete(postId);
        res.status(200).send({ message: '게시글 삭제 성공' });
    } catch (error) {
        res.status(400).send({ message: '게시글 삭제 실패', error });
    }
});

// 게시글 수정
app.put('/api/posts/:postId', async (req, res) => {
    try {
        const { postId } = req.params;  
        const { postPassword, ...updateData } = req.body;  

        // 게시물 찾기
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).send({ message: '게시물을 찾을 수 없습니다.' });
        }

        // 비밀번호 검증
        const isPasswordValid = await bcrypt.compare(postPassword, post.postPassword); // 해시된 비밀번호 비교
        if (!isPasswordValid) {
            return res.status(403).send({ message: '비밀번호가 일치하지 않습니다.' });
        }

        // 비밀번호 일치 시 수정
        const updatedPost = await Post.findByIdAndUpdate(postId, updateData, { new: true });  

        res.status(200).send({ message: '수정에 성공했습니다.', post: updatedPost });
    } catch (error) {
        res.status(400).send({ message: '게시물 수정 실패', error });
    }
});


// 게시물 상세 조회
app.get('/api/posts/:postId', async (req, res) => {
    try {
        const { postId } = req.params;
        const { postPassword } = req.query;

        // 게시물 찾기
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).send({ message: '게시물을 찾을 수 없습니다.' });
        }

        // 비공개 그룹의 경우 비밀번호 확인
        if (!post.isPublic) {
            const isPasswordValid = await bcrypt.compare(postPassword, post.postPassword);
            if (!isPasswordValid) {
                return res.status(403).send({ message: '비밀번호가 일치하지 않습니다.' });
            }
        }

        res.status(200).send({
            groupId : post.groupId,
            nickname : post.nickname,
            title : post.title,
            content: post.content,
            imageUrl : post.imageUrl,
            tags : post.tags,
            location : post.location,
            moment : post.moment,
            isPublic : post.isPublic,
            likeCount : post.likeCount,
            commentCount : post.commentCount,
            createdAt : post.createdAt,
        });
    } catch (error) {
        res.status(400).send({ message: '게시물 상세 조회 실패', error });
    }
});

// 조회 권한 확인 (게시글)

app.get('/api/posts/:postId/verify-password', async (req, res) => {
    try {
        const postId = req.params;
        const postPassword = req.query;
    
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).send({ message: '게시물을 찾을 수 없습니다.' });
        }
    
        const isPasswordValid = await bcrypt.compare(postPassword, post.postPassword);
        
        if(!isPasswordValid) {
            return res.status(401).send({ message: '비밀번호가 틀렸습니다.' });
        }
    
        res.status(200).send({message : '비밀번호가 확인되었습니다.'});
    } catch (error) {
        res.status(400).send({ message: '권한 확인 실패', error });
    }
});

// 공감 보내기

app.post('/api/posts/:postId/like', async (req, res) => {
    try {
        const { postId } = req.params;

        // 게시물의 likeCount를 1 증가
        const post = await Post.findByIdAndUpdate(postId, { $inc: { likeCount: 1 } }, { new: true });
        if (!post) {
            return res.status(404).send({ message: '게시물을 찾을 수 없습니다.' });
        }

        res.status(200).send({ message: '공감이 추가되었습니다.', likeCount: group.likeCount });
    } catch (error) {
        res.status(400).send({ message: '공감 추가 실패', error });
    }
});

// 게시글 공개 여부 확인

app.get('/api/posts/:postId/is-public', async (req, res) => {
    try {
        const { postId } = req.params;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).send({ message: '게시물을 찾을 수 없습니다.' });
        }
        
        res.status(200).send({
            isPublic : post.isPublic,
        });
    } catch (error) {
        res.status(400).send({ message: '공감 추가 실패', error });
    }
});


// -------------------------------------------------------- //

// 댓글 기능

// 댓글 생성 

app.post('/api/posts/:postId/comments', async (req, res) => {
    try {
        const { nickname, content, password, } = req.body;
        const { postId } = req.params;  

        const hashedCommentPassword = password ? await bcrypt.hash(password, 10) : null;

        const post = await Post.findById(postId); 
        if (!post) {
            return res.status(404).send({ message: '게시물을 찾을 수 없습니다.' });
        }
      
        const newComment = new Comment({
            nickname : nickname,
            content : content,
            password : hashedCommentPassword,
        });

        await newComment.save();
        res.status(201).send({ message: '댓글이 성공적으로 등록되었습니다.', comment: newComment });
    } catch (error) {
        console.log(error); 
        res.status(400).send({ message: '댓글 등록 실패', error });
    }
});



// 댓글 목록 조회
app.get('/api/posts/:postId/comments', async (req, res) => {
    try {
        const { postId } = req.params;

        const post = await Post.findById(postId);

        if(!post) {
            return res.status(404).send({ message: '게시물을 찾을 수 없습니다.' });
        }
        const comments = await Comment.find({postId: postId});

        const totalItemCount = await Comment.countDocuments({postId: postId});

        // 댓글 반환
        res.status(200).send({
            currentPage: 1, // 고정된 값
            totalPages: 5,
            totalItemCount,
            data : comments,
        });
    } catch (error) {
        res.status(400).send({ message: '게시글 목록 조회 실패', error });
    }
});

// 댓글 삭제
app.delete('/api/comments/:commentId', async (req, res) => {
    try {
        const { commentId } = req.params;
        const { password } = req.body;

        // 댓글 찾기
        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).send({ message: '댓글을 찾을 수 없습니다.' });
        }

        // 비밀번호 확인
        const isPasswordValid = await bcrypt.compare(password, comment.password);
        if (!isPasswordValid) {
            return res.status(403).send({ message: '비밀번호가 일치하지 않습니다.' });
        }
        

        // 게시글 삭제
        await Comment.findByIdAndDelete(commentId);
        res.status(200).send({ message: '댓글 삭제 성공' });
    } catch (error) {
        res.status(400).send({ message: '댓글 삭제 실패', error });
    }
});


// 댓글 수정
app.put('/api/comments/:commentId', async (req, res) => {
    try {
        const { commentId } = req.params;  
        const { password, ...updateData } = req.body;  

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).send({ message: '댓글을 찾을 수 없습니다.' });
        }

        // 비밀번호 검증
        const isPasswordValid = await bcrypt.compare(password, comment.password); 
        if (!isPasswordValid) {
            return res.status(403).send({ message: '비밀번호가 일치하지 않습니다.' });
        }

        // 비밀번호 일치 시 수정
        const updatedPost = await Comment.findByIdAndUpdate(commentId, updateData, { new: true });  

        res.status(200).send({ message: '수정에 성공했습니다.', post: updatedPost });
    } catch (error) {
        res.status(400).send({ message: '게시물 수정 실패', error });
    }
});