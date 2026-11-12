# Panduan Deploy ScentPack Dashboard ke VPS (via SSH Terminal)

Panduan praktis untuk mendeploy dashboard **ScentPack (Fulfillment & Ekspedisi)** ke VPS Linux Anda menggunakan **Node.js & PM2**.

> 💡 **Catatan Port:**
> Project *Dashboard Ads Performance* Anda sebelumnya sudah berjalan di port **3000**.
> Maka project **ScentPack** ini dikonfigurasi untuk berjalan di port **3001** agar kedua dashboard dapat berjalan bersamaan di VPS yang sama tanpa bentrok!

---

## 🚀 Langkah Cepat Deploy ke VPS

### 1. Masuk ke Terminal VPS via SSH
Buka Terminal / PowerShell di komputer Anda, lalu login ke VPS:
```bash
ssh root@IP_VPS_ANDA
```

---

### 2. Buat Folder & Clone Repository dari GitHub
Jalankan perintah berikut di terminal VPS:
```bash
# Buat folder khusus scentpack di /var/www
sudo mkdir -p /var/www/scentpack
sudo chown -R $USER:$USER /var/www/scentpack
cd /var/www/scentpack

# Clone repo ScentPack
git clone https://github.com/nickyoyoy/scentpack.git .
```

---

### 3. Install Dependensi & Build Production
```bash
# Install paket yang dibutuhkan
npm install

# Build static production bundle (menghasilkan folder dist/)
npm run build
```

---

### 4. Jalankan Aplikasi dengan PM2 (Port 3001)
```bash
# Jalankan server.js dengan nama 'scentpack' di background port 3001
PORT=3001 pm2 start server.js --name "scentpack"

# Simpan konfigurasi PM2 agar otomatis nyala jika VPS restart
pm2 save
```

---

### 5. Buka Port Firewall VPS (Jika Diperlukan)
Jika VPS Anda menggunakan firewall UFW:
```bash
sudo ufw allow 3001/tcp
sudo ufw reload
```

---

## 🎉 Selesai!

Dashboard ScentPack sekarang sudah live dan dapat diakses 24/7 di:
👉 **`http://IP_VPS_ANDA:3001`**

### Perintah Berguna di VPS:
* **Melihat status:** `pm2 status`
* **Melihat log:** `pm2 logs scentpack`
* **Restart server:** `pm2 restart scentpack`
* **Update kode terbaru:**
  ```bash
  cd /var/www/scentpack
  git pull origin main
  npm run build
  pm2 restart scentpack
  ```
