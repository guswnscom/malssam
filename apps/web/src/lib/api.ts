import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 180000, // 3분 타임아웃 (설교 생성에 시간이 걸림)
});

// 요청 인터셉터: JWT 토큰 추가
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// 응답 인터셉터: 401 시 로그인 페이지 이동 (Sprint 1에서 토큰 갱신 추가)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // TODO Sprint 1: refresh token 로직
      // 지금은 로그인으로 리다이렉트
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);
