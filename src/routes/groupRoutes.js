import express from 'express';
import groupController from '../controllers/groupController.js';

const router = express.Router();

//그룹 등록
router.post('/groups', groupController.createGroup);

//그룹 목록 조회
router.get('/groups',groupController.getGroups);

//그룹 수정
router.put('/groups/:groupid',groupController.updateGroup);

//그룹 삭제
router.delete('/groups/:groupid',groupController.deleteGroup);

//그룹 상세 정보 조회
router.get('/groups/:groupid',groupController.getGroupById);

//그룹 공감하기
router.post('/groups/:groupid/like',groupController.likeGroup);

//그룹 조회 권한 확인
router.post('/groups/:groupid/verify-password', groupController.verifyPassword);

//그룹 공개 여부 확인
router.get('/groups/:groupid/is-public',groupController.isPublic)

const groupRoutes = router;

export default groupRoutes;