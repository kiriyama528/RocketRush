
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
                        // ボタンのテキストを「選択済み」に変更
                        this.textContent = '選択済み';
                        this.classList.add('btn-selected');
                        location.reload();  // ページをリロード
                    }
                });
        });
    });

    // 基本装備に戻すボタンの処理
    document.querySelectorAll('.card-remove').forEach(button => {
        button.addEventListener('click', function() {
            const cardId = this.dataset.cardId;
            
            fetch(`/remove_card/${cardId}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        location.reload();  // ページをリロード
                    }
                });
        });
    });

    // 発射ボタンの処理
    document.getElementById('launch-button').addEventListener('click', function() {
        fetch('/launch_rocket', {
            method: 'POST'
        })
            .then(response => response.json())
            .then(data => {
                const resultDiv = document.getElementById('launch-result');
                if (data.success) {
                    resultDiv.innerHTML = `
                        <div class="alert alert-success">
                            発射成功！スコア: ${data.score}点
                        </div>`;
                } else {
                    resultDiv.innerHTML = `
                        <div class="alert alert-danger">
                            発射失敗！ 推力: ${data.total_thrust}kN / 重量: ${data.total_weight}kN
                        </div>`;
                }
                // アニメーション表示
                document.getElementById('rocket-animation').classList.remove('d-none');
                setTimeout(() => {
                    location.reload();  // 3秒後にページをリロード
                }, 3000);
            });
    });

    // 統計情報の更新
    function updateStats() {
        const cards = document.querySelectorAll('.selected-cards .game-card');
        let totalThrust = 0;
        let totalWeight = 0;
        let totalPoints = 0;

        cards.forEach(card => {
            const stats = card.querySelector('.card-stats').textContent;
            const thrustMatch = stats.match(/推力: (\d+)kN/);
            const weightMatch = stats.match(/重量: (\d+)kN/);
            const pointsMatch = stats.match(/ポイント: (\d+)/);

            if (thrustMatch) totalThrust += parseInt(thrustMatch[1]);
            if (weightMatch) totalWeight += parseInt(weightMatch[1]);
            if (pointsMatch) totalPoints += parseInt(pointsMatch[1]);
        });

        // プログレスバーの更新
        document.getElementById('thrust-bar').style.width = `${(totalThrust / 200) * 100}%`;
        document.getElementById('thrust-value').textContent = `${totalThrust} kN`;

        document.getElementById('weight-bar').style.width = `${(totalWeight / 200) * 100}%`;
        document.getElementById('weight-value').textContent = `${totalWeight} kN`;

        document.getElementById('points-bar').style.width = `${(totalPoints / 10) * 100}%`;
        document.getElementById('points-value').textContent = `${totalPoints} pts`;
    }

    // 初期統計情報の更新
    updateStats();
});
