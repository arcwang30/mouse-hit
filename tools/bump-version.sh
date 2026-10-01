#!/bin/sh
# 把 src/index.html 裡 CSS / JS 網址後面的 ?v=版本號 換成目前時間,
# 讓玩家的瀏覽器在每次更新後一定重新下載新檔案(不會用到快取的舊版)。
# 由 .git/hooks/pre-commit 在每次 commit 前自動執行;要手動跑也可以:sh tools/bump-version.sh
cd "$(git rev-parse --show-toplevel)" || exit 1
V=$(date +%Y%m%d%H%M)
sed -i -E "s/\?v=[0-9]+/?v=$V/g" src/index.html
git add src/index.html
