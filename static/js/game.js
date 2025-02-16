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
                        // 同じ種類の他のカードの選択状態をリセット
                        document.querySelectorAll(`.card-${cardType} .card-select`).forEach(btn => {
                            btn.classList.remove('btn-selected');
                            btn.textContent = '選択';
                        });

                        // 選択されたカードの状態を更新
                        this.classList.add('btn-selected');
                        this.textContent = '選択済み';

                        updateGameState();
                    } else {
                        alert('カードの選択に失敗しました');
                    }
                });
        });
    });

    // カード取り外しの処理
    document.querySelectorAll('.card-remove').forEach(button => {
        button.addEventListener('click', function() {
            const cardId = this.dataset.cardId;

            fetch(`/remove_card/${cardId}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        updateGameState();
                    } else {
                        alert('カードの取り外しに失敗しました');
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

    function showSuccessMessage(data) {
        const messageDiv = document.getElementById('launch-result');
        messageDiv.innerHTML = `
            <div class="alert alert-success">
                <h4><i class="fas fa-check-circle"></i> 発射成功！</h4>
                <p>総推力: ${data.total_thrust}kN</p>
                <p>総重量: ${data.total_weight}kN</p>
                <p>スコア: ${data.score}点</p>
            </div>
        `;
    }

    function showFailureMessage(data) {
        const messageDiv = document.getElementById('launch-result');
        messageDiv.innerHTML = `
            <div class="alert alert-danger">
                <h4><i class="fas fa-times-circle"></i> 発射失敗</h4>
                <p>総推力: ${data.total_thrust}kN</p>
                <p>総重量: ${data.total_weight}kN</p>
                <p>スコア: ${data.score}点</p>
            </div>
        `;
    }

    function updateGameState() {
        location.reload();
    }
});