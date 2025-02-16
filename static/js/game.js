document.addEventListener('DOMContentLoaded', function() {
    // カード選択の処理
    document.querySelectorAll('.card-select').forEach(button => {
        button.addEventListener('click', function() {
            const cardType = this.dataset.cardType;
            const cardId = this.dataset.cardId;

            fetch(`/select_card/${cardType}/${cardId}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // カードの選択状態を更新
                        updateCardSelection(cardType, cardId, data.action);
                        updateGameState();
                    } else {
                        alert('カードの選択に失敗しました');
                    }
                });
        });
    });

    // ロケット発射の処理
    document.getElementById('launch-button').addEventListener('click', function() {
        fetch('/launch_rocket', {
            method: 'POST',
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showSuccessMessage(data);
            } else {
                showFailureMessage(data);
            }
            // 結果に関わらず次のラウンドへ
            setTimeout(updateGameState, 2000);
        });
    });

    function updateCardSelection(cardType, cardId, action) {
        // 同じ種類のカードの選択状態をリセット
        document.querySelectorAll(`.card-select[data-card-type="${cardType}"]`).forEach(btn => {
            btn.classList.remove('btn-success');
            btn.classList.add('btn-primary');
            btn.textContent = '選択';
        });

        if (action !== 'removed') {
            // 選択されたカードのボタンを更新
            const selectedBtn = document.querySelector(`.card-select[data-card-id="${cardId}"]`);
            if (selectedBtn) {
                selectedBtn.classList.remove('btn-primary');
                selectedBtn.classList.add('btn-success');
                selectedBtn.textContent = '選択済み';
            }
        }
    }

    function showSuccessMessage(data) {
        const messageDiv = document.getElementById('launch-result');
        messageDiv.innerHTML = `
            <div class="alert alert-success">
                発射成功！<br>
                総推力: ${data.total_thrust}kN<br>
                総重量: ${data.total_weight}kN<br>
                スコア: ${data.score}点
            </div>
        `;
    }

    function showFailureMessage(data) {
        const messageDiv = document.getElementById('launch-result');
        messageDiv.innerHTML = `
            <div class="alert alert-danger">
                発射失敗<br>
                総推力: ${data.total_thrust}kN<br>
                総重量: ${data.total_weight}kN<br>
                スコア: ${data.score}点
            </div>
        `;
    }

    function updateGameState() {
        location.reload();
    }
});