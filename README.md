# 💸 บันทึกรายจ่าย — Web Version

## Deploy บน Render.com (ฟรี)

### ขั้นที่ 1 — Push ขึ้น GitHub
```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/expense-tracker.git
git push -u origin main
```

### ขั้นที่ 2 — Deploy บน Render
1. ไปที่ https://render.com → Sign in with GitHub
2. กด **New → Blueprint**
3. เลือก repo `expense-tracker`
4. Render จะอ่าน `render.yaml` และสร้าง:
   - Web Service (Node.js)
   - PostgreSQL Database (ฟรี)
5. กด **Apply** → รอ 5-10 นาที
6. ได้ URL `https://expense-tracker-xxxx.onrender.com` ✅

## หมายเหตุ
- Free tier จะ sleep หลังไม่มีคนใช้ 15 นาที (ครั้งแรกอาจช้า 30 วินาที)
- Database ฟรีมีอายุ 90 วัน จากนั้นต้องสร้างใหม่
