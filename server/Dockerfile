# Google Cloud Run 배포용 Dockerfile
FROM node:20-alpine

# 작업 디렉터리 설정
WORKDIR /app

# 패키지 정보 복사 및 설치
COPY package*.json ./
RUN npm install --only=production

# 소스 코드 복사
COPY . .

# 포트 노출
EXPOSE 5000

# 앱 실행
CMD ["npm", "start"]
