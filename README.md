# Word Learning Assistant Chrome Extension

Bu Chrome uzantısı, web sayfalarında okuma yaparken bilmediğiniz kelimeleri kolayca çevirmenize ve kaydetmenize olanak sağlar.

## Özellikler

- 🔍 Metin seçimi ile anında çeviri
- 📚 Birden fazla çeviri alternatifi
- 📝 Örnek cümlelerle kullanım
- 💾 Kelimeleri kaydetme ve daha sonra inceleme
- 🌐 İngilizce -> Türkçe çeviri desteği (diğer diller yakında)

## Kurulum

### Geliştirici Modu

1. Bu repoyu klonlayın:

   ```bash
   git clone https://github.com/your-username/word-learning-assistant.git
   cd word-learning-assistant
   ```

2. Bağımlılıkları yükleyin:

   ```bash
   npm install
   ```

3. Chrome'da uzantıyı yükleyin:
   - Chrome'u açın ve `chrome://extensions/` adresine gidin
   - Sağ üst köşedeki "Geliştirici modu"nu etkinleştirin
   - "Paketlenmemiş öğe yükle" butonuna tıklayın
   - Klonladığınız proje klasörünü seçin

### Son Kullanıcı Kurulumu

1. Chrome Web Store'dan uzantıyı indirin (yakında eklenecek)
2. Chrome'da uzantıyı etkinleştirin

## Geliştirme

### Proje Yapısı

```
extension/
├── manifest.json           # Uzantı yapılandırması
├── src/
│   ├── background.js      # Arka plan işlemleri
│   ├── content.js         # Sayfa içi işlemler
│   ├── translationService.js  # Çeviri API entegrasyonu
│   └── popup/             # Popup arayüzü
│       ├── popup.html
│       └── popup.js
├── styles/
│   └── tooltip.css        # Tooltip stilleri
└── assets/
    └── icons/             # Uzantı ikonları
```

### Geliştirme İçin Test Etme

1. Uzantıyı geliştirici modunda yükledikten sonra:

   - Chrome'da herhangi bir web sayfasını açın
   - Bir kelime veya metin seçin
   - Tooltip'in görünmesini bekleyin

2. Değişikliklerinizi test etmek için:

   - Kod değişikliklerini yapın
   - `chrome://extensions/` sayfasına gidin
   - Uzantının yanındaki "Yenile" (↻) ikonuna tıklayın
   - Sayfayı yenileyin ve değişiklikleri test edin

3. Console loglarını görüntülemek için:
   - Uzantı ikonuna sağ tıklayın
   - "Incele" seçeneğini seçin
   - Console sekmesine gidin

### API Kullanımı

Uzantı şu API'leri kullanmaktadır:

1. MyMemory Translation API

   - Ücretsiz kullanım: Günlük 1000 kelime
   - Rate limit: IP başına saatte 100 istek
   - [API Dokümantasyonu](https://mymemory.translated.net/doc/spec.php)

2. Tatoeba API
   - Örnek cümleler için kullanılır
   - Ücretsiz ve limitsiz
   - [API Dokümantasyonu](https://tatoeba.org/eng/api_v0)

### Hata Ayıklama

1. Content Script Hata Ayıklama:

   - Sayfada sağ tıklayın -> "İncele"
   - Console'da hataları ve logları kontrol edin

2. Background Script Hata Ayıklama:

   - `chrome://extensions` sayfasına gidin
   - Uzantının "background page" linkine tıklayın
   - DevTools'da hataları ve logları kontrol edin

3. Popup Hata Ayıklama:
   - Uzantı ikonuna sağ tıklayın -> "İncele"
   - DevTools'da hataları ve logları kontrol edin

## Katkıda Bulunma

1. Bu repoyu forklayın
2. Yeni bir branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## Yapılacaklar

- [ ] Daha fazla dil desteği
- [ ] Örnek cümlelerin çevirisi
- [ ] Kelime listesi export/import özelliği
- [ ] Kelime tekrar hatırlatmaları
- [ ] Offline çalışma modu

## Lisans

MIT License - Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## İletişim

Can Bulgay - [@canbulgay](https://linkedin.com/in/canbulgay) - canbulgay.dev

Proje Linki: [https://github.com/canbulgay/word-learning-assistant](https://github.com/canbulgay/word-learning-assistant)
