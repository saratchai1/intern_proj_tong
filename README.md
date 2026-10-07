# intern_proj_tong

## Undervalue Lab

เพิ่ม MVP สำหรับคัดกรองและเปรียบเทียบหุ้น undervalued ที่ [undervalue-lab/](./undervalue-lab/README.md)

ฟีเจอร์หลัก:
- Screener: market cap, FCF yield, ROIC, upside, sector, value-trap risk
- Company comparison 2–5 บริษัท
- Deterministic DCF playground + sensitivity matrix
- Reverse DCF เพื่อดู growth ที่ราคาปัจจุบันกำลัง imply
- Thesis / catalyst / risk / value-trap review
- CSV export, JSON import, local watchlist
- ข้อมูล bundled เป็น research snapshot ไม่ใช่ live feed

> ขั้นต่อไปคือเชื่อม market/fundamentals provider แบบ server-side + SEC filings + PostgreSQL เพื่อให้ scan ตลาดและ update valuation อัตโนมัติ

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
