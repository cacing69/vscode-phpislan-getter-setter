# PHP Getter Setter Generator

Ekstensi Visual Studio Code untuk secara otomatis menghasilkan method getter dan setter pada class PHP.

## Cara Menggunakan

1. Buka file PHP yang berisi properti class.
2. Tekan `Ctrl+Shift+P`.
3. Ketik `Generate PHP Getter/Setter`.
4. Pilih salah satu: Getter saja, Setter saja, atau keduanya.
5. Method akan otomatis ditambahkan sebelum `}` akhir class.

## Fitur

- Deteksi tipe nullable (misalnya `?string`)
- Auto-insert `?? null` jika perlu
- Dukungan setter, getter, atau keduanya
