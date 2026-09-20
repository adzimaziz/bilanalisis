# Kampung Kilowatt 3D

Buka `game-3d.html` secara terus dalam browser moden, atau hidangkan folder ini sebagai website statik. Fail 3D sudah dibina; tiada server aplikasi atau CDN diperlukan untuk game. Font Google adalah pilihan dan mempunyai fon gantian tempatan.

## Ubah game

- `game-3d-src.js`: model 3D, cerita, drag-and-drop dan kawalan kamera.
- `game-3d.css`: rupa page dan susun atur telefon.
- `game-3d.html`: struktur page.

Selepas mengubah JavaScript:

```sh
npm ci --ignore-scripts
npm run build:3d
```

Sertakan `game-3d.js`, `game-3d.js.LEGAL.txt` dan `tenaga-music.m4a` (muzik latar, dikongsi dengan game 2D) apabila menerbitkan website, bersama HTML, CSS dan lesen dalam `THIRD-PARTY-NOTICES.txt`. Folder `node_modules` dan fail sumber tidak perlu diterbitkan. Game menggunakan Three.js 0.180.0 dan esbuild 0.25.10 untuk membina bundle tempatan.

## Cara main

Seret buah ke petak bercahaya, atau tekan buah kemudian tekan petak. Pilihan petak berbutang juga tersedia untuk papan kekunci. Seret ruang kosong untuk memusingkan kamera; cubit atau gunakan butang untuk zum. Escape membatalkan pilihan. Selepas empat cerita selesai, tambah hiasan pada petak kosong dan seret hiasan untuk mengalihkannya. Kemajuan bermula semula apabila halaman dimuat semula.

Jika WebGL tidak tersedia, halaman menawarkan pautan kepada game 2D.
