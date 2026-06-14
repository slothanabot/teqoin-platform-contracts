# TeQoin Flaunch Frontend

Frontend mobile-first untuk platform token launcher di TeQoin Testnet, terinspirasi dari Flaunch.gg dan Clanker.

## 🚀 Cara Run Lokal

Jika ingin menjalankan frontend ini di laptop/PC lokal:

1. Pastikan sudah menginstall [Node.js](https://nodejs.org/) (versi 18+ direkomendasikan).
2. Masuk ke folder `frontend`:
   ```bash
   cd frontend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Jalankan server development:
   ```bash
   npm run dev
   ```
5. Buka `http://localhost:3000` di browser. Gunakan inspect element mode mobile (F12) untuk melihat tampilan HP yang responsif.

---

## ☁️ Cara Deploy ke Vercel (Gratis & Online)

Agar website bisa diakses oleh siapa saja lewat HP:

1. Push folder `frontend` ini ke repository GitHub kamu.
2. Buka [Vercel](https://vercel.com/) dan login menggunakan akun GitHub kamu.
3. Klik **"Add New"** -> **"Project"**.
4. Pilih repository `teqoin-platform` (atau nama repo yang kamu gunakan).
5. Pada bagian **Root Directory**, pilih folder `frontend` (jika kamu meletakkannya di dalam subfolder).
6. Klik **"Deploy"**! Vercel akan otomatis meng-compile dan memberikan link website online gratis.

---

## 🛠️ Kontrak yang Digunakan

| Kontrak | Address |
| --- | --- |
| **TokenFactory** | `0x1FB4F3e6e7d57aE31F5495973CA9298af383d18C` |
| **WETH9** | `0xbed97c4c145313c1738921a1fc4CC49Fa3Ddf518` |
| **UniswapV2Factory** | `0x313e11Cd89b602B688DEF51cfdF730a62e7A572f` |
| **UniswapV2Router** | `0xFfa2Af532BF7225af501eA0420b28B2B7698c0b6` |
