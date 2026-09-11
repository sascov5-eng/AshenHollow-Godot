# Pale Hall — iOS (unsigned IPA)

Закрытая бета 2.0. 2D action-platformer в духе Hollow Knight.

Один зал, три стража, рывок, скольжение по стенам, удар и лечение души.
Сенсорное управление для iPhone.

Репозиторий собирает **неподписанный IPA**. Подписываете и ставите вы сами — как с `AshenHollow`.

Bundle ID: `app.ashenhollow.prototype`  
Имя на домашнем экране: **Pale Hall**

## Как получить IPA

1. Откройте вкладку **Actions** в этом репозитории.
2. Дождитесь workflow **Build Pale Hall IPA** (запускается на каждый push в `main` и вручную).
3. Скачайте артефакт **PaleHall-unsigned-ipa** → файл `PaleHall-unsigned.ipa`.
4. Подпишите своим сертификатом:
   - [iOS App Signer](https://github.com/DanTheMan827/ios-app-signer)
   - Sideloadly
   - или `codesign` / Xcode
5. Установите на iPhone (Sideloadly, AltStore, TrollStore — чем пользуетесь).

## Управление на телефоне

| Действие | Кнопка |
| --- | --- |
| Ходьба | Стик слева |
| Прыжок | Прыжок (удерживайте для высоты) |
| Рывок | Рывок |
| Удар | Атака |
| Лечение | Хилл (на земле, нужна душа) |
| Пауза | Пауза |

Цель: победить трёх стражей. Дверь откроется, когда зал будет чист. Скамья — точка возрождения.

## Сборка веб-бандла локально

```bash
npm install
npm run build:ios
```

Готовый пакет лежит в `Resources/www`. Сам IPA собирается только на macOS (GitHub Actions `macos-15`).

## Браузерная версия

```bash
npm install
npm run dev
```
