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