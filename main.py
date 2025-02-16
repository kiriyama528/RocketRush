import os
import logging
from app import app

# デバッグログの設定
logging.basicConfig(level=logging.DEBUG)

if __name__ == "__main__":
    # 環境変数からポート番号を取得（デフォルト5000）
    port = int(os.environ.get("PORT", 5000))
    # 開発サーバーの起動
    app.run(host="0.0.0.0", port=port, debug=True)
