# My QR Wallet

PWA แบบ local-first สำหรับรวม QR รับเงินหลายธนาคารไว้ในที่เดียว

## Live app

https://intern-proj-tong-qr.vercel.app

Vercel เชื่อมกับ branch `main` และ root directory `qr-wallet` ดังนั้นการ push การแก้ไขในโฟลเดอร์นี้จะ deploy อัตโนมัติ

## Features

- เพิ่ม QR จากรูปในโทรศัพท์/คอมพิวเตอร์
- เลือกธนาคารหรือ PromptPay
- ตั้งชื่อ QR ชื่อบัญชี และเลขบัญชี
- จัดหมวดหมู่ได้เอง เช่น ส่วนตัว งาน ร้านค้า และกรองหน้า Home ตามหมวด
- **Smart Scan:** อ่าน screenshot/รูป QR เพื่อช่วยหา ธนาคาร ชื่อบัญชี และเลขบัญชีอัตโนมัติ
- Smart Scan ใช้ Tesseract OCR (Thai + English) ใน browser และใช้ BarcodeDetector อ่าน QR เมื่ออุปกรณ์รองรับ
- คัดลอกเลขบัญชีได้จากหน้า card และหน้าดู QR เพื่อนำไปวางในแอปธนาคารอื่นได้เร็วขึ้น
- **เรียกเก็บเงิน:** เลือกบัญชีปลายทางของตัวเอง ใส่จำนวนเงิน/รายละเอียด แล้วคัดลอกหรือแชร์คำขอรับเงินพร้อม QR
- ถ้า QR ที่บันทึกไว้เป็น PromptPay/Thai QR Payment ที่อ่าน payload ได้ ระบบจะสร้าง **Dynamic PromptPay QR** ใหม่และฝังจำนวนเงินใน Tag 54 พร้อมคำนวณ CRC ใหม่
- ถ้า QR ไม่ใช่ PromptPay หรืออ่าน payload ไม่ได้ ระบบจะ fallback เป็น QR เดิมและใส่ยอดในข้อความเรียกเก็บแทน
- ใช้ BarcodeDetector เมื่อรองรับ และ fallback เป็น jsQR เพื่ออ่าน QR ข้าม browser
- ใช้ qrcode-generator เพื่อสร้าง QR ใหม่ใน browser โดยไม่ส่ง payload ไป backend
- แสดง QR แบบเต็มจอ
- แชร์หรือดาวน์โหลด QR
- แก้ไขและลบ QR
- เก็บข้อมูลด้วย IndexedDB ในอุปกรณ์นั้น
- ใช้งานออฟไลน์ผ่าน Service Worker
- ติดตั้งเป็น PWA ได้ผ่าน HTTPS

ไม่มีการเชื่อม API ธนาคาร และไม่มีการเก็บ username, password, PIN, OTP หรือ token ของธนาคาร

## Smart Scan privacy

ภาพที่เลือกจะถูกอ่านใน browser ของอุปกรณ์ ไม่ส่งรูปไป backend ของแอป

ครั้งแรกที่ใช้ OCR ต้องเชื่อมต่ออินเทอร์เน็ตเพื่อโหลด Tesseract.js และโมเดลภาษา Thai/English จาก CDN หลังจากนั้นความเร็วขึ้นอยู่กับ browser และสเปกเครื่อง

ระบบ **ไม่เติมตัวเลขที่ภาพปิดบัง** เช่น `123-X-XXXX-0` ให้ครบเอง ผู้ใช้ต้องตรวจข้อมูลก่อนบันทึกเสมอ

## รันในเครื่อง

ต้องเสิร์ฟผ่าน HTTP/HTTPS (ไม่ควรเปิด index.html ด้วย file:// เพราะ Service Worker จะไม่ทำงาน)

ตัวอย่าง:

```bash
cd qr-wallet
python -m http.server 8080
```

เปิด http://localhost:8080

## ติดตั้งบนโทรศัพท์

1. เปิด https://intern-proj-tong-qr.vercel.app
2. Android/Chrome: เลือก Install app / Add to Home screen
3. iPhone/Safari: Share > Add to Home Screen

## Privacy model

ข้อมูล QR และเลขบัญชีถูกเก็บเฉพาะใน IndexedDB ของเบราว์เซอร์บนอุปกรณ์นั้น การล้าง site data / browser data จะลบข้อมูลที่บันทึกไว้ด้วย

เวอร์ชันนี้ยังไม่มี cloud sync หรือ backup ข้ามเครื่อง
