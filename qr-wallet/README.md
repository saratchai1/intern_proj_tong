# My QR Wallet

PWA แบบ local-first สำหรับรวม QR รับเงินหลายธนาคารไว้ในที่เดียว

## MVP

- เพิ่ม QR จากรูปในโทรศัพท์/คอมพิวเตอร์
- เลือกธนาคารหรือ PromptPay
- ตั้งชื่อ QR และชื่อบัญชี
- แสดง QR แบบเต็มจอ
- แชร์หรือดาวน์โหลด QR
- แก้ไขและลบ QR
- เก็บข้อมูลด้วย IndexedDB ในอุปกรณ์นั้น
- ใช้งานออฟไลน์ผ่าน Service Worker
- ติดตั้งเป็น PWA ได้เมื่อเสิร์ฟผ่าน HTTPS

ไม่มีการเชื่อม API ธนาคาร และไม่มีการเก็บ username, password, PIN, OTP หรือ token ของธนาคาร

## รันในเครื่อง

ต้องเสิร์ฟผ่าน HTTP/HTTPS (ไม่ควรเปิด index.html ด้วย file:// เพราะ Service Worker จะไม่ทำงาน)

ตัวอย่าง:

```bash
cd qr-wallet
python -m http.server 8080
```

เปิด http://localhost:8080

## ติดตั้งบนโทรศัพท์

1. Deploy โฟลเดอร์นี้บน HTTPS เช่น GitHub Pages, Netlify หรือ Vercel
2. Android/Chrome: เปิดเว็บแล้วเลือก Install app / Add to Home screen
3. iPhone/Safari: Share > Add to Home Screen

## Privacy model

ข้อมูล QR ถูกเก็บเฉพาะใน IndexedDB ของเบราว์เซอร์บนอุปกรณ์นั้น การล้าง site data / browser data จะลบ QR ที่บันทึกไว้ด้วย

เวอร์ชันนี้ยังไม่มี cloud sync หรือ backup ข้ามเครื่อง
