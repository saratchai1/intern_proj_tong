# intern_proj_tong

## My QR Wallet

เพิ่ม PWA สำหรับรวม QR รับเงินหลายธนาคารไว้ในที่เดียวแบบ local-first ที่ [qr-wallet/](./qr-wallet/README.md)

**Live:** https://intern-proj-tong-qr.vercel.app

ฟีเจอร์หลัก:
- เพิ่ม QR จากรูปในโทรศัพท์/คอมพิวเตอร์
- เก็บข้อมูลใน IndexedDB ของเครื่อง
- เปิด QR เต็มจอ แชร์ ดาวน์โหลด แก้ไข และลบ
- ใช้งานออฟไลน์
- ติดตั้งลงหน้า Home Screen ได้
- ไม่เชื่อม API ธนาคาร และไม่เก็บ username/password/PIN/OTP

Vercel เชื่อมกับ `main` และ `qr-wallet/` เพื่อ deploy อัตโนมัติ

ไฟล์รายงานสหกิจเดิมใน repository ไม่ถูกแก้ไข
