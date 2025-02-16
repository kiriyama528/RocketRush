document.addEventListener('DOMContentLoaded', function() {
    // 推力と重量の表示を更新する関数
    function updateStats() {
        const hand = Array.from(document.querySelectorAll('.game-card')).map(card => {
            const thrustEl = card.querySelector('.card-stats p:first-child');
            const weightEl = card.querySelector('.card-stats p:nth-child(2)');
            return {
                thrust: thrustEl ? parseInt(thrustEl.textContent.match(/\d+/)[0]) : 0,
                weight: parseInt(weightEl.textContent.match(/\d+/)[0])
            };
        });

        const totalThrust = hand.reduce((sum, card) => sum + card.thrust, 0);
        const totalWeight = hand.reduce((sum, card) => sum + card.weight, 0);
        const requiredThrust = parseInt(document.querySelector('#required-thrust-bar span').textContent);

        // プログレスバーの更新
        const thrustBar = document.querySelector('#thrust-bar');
        const weightBar = document.querySelector('#weight-bar');

        thrustBar.style.width = `${(totalThrust / 200) * 100}%`;
        weightBar.style.width = `${(totalWeight / 200) * 100}%`;

        document.querySelector('#thrust-value').textContent = `${totalThrust} kN`;
        document.querySelector('#weight-value').textContent = `${totalWeight} kN`;

        // 発射ボタンの状態を更新
        const launchButton = document.getElementById('launch-button');
        if (totalThrust >= totalWeight && totalThrust >= requiredThrust) {
            launchButton.classList.remove('btn-danger');
            launchButton.classList.add('btn-success');
        } else {
            launchButton.classList.remove('btn-success');
            launchButton.classList.add('btn-danger');
        }
    }

    // カード選択の処理
    document.querySelectorAll('.card-select').forEach(button => {
        button.addEventListener('click', function() {
            const cardType = this.dataset.cardType;
            const cardId = this.dataset.cardId;

            fetch(`/select_card/${cardType}/${cardId}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // 選択状態を更新
                        document.querySelectorAll(`.card-${cardType} .card-select`).forEach(btn => {
                            btn.classList.remove('btn-selected');
                            btn.textContent = '選択';
                        });
                        this.classList.add('btn-selected');
                        this.textContent = '選択済み';

                        updateStats();
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
                        location.reload();
                    } else {
                        alert('カードの取り外しに失敗しました');
                    }
                });
        });
    });

    // ロケット発射の処理
    document.getElementById('launch-button').addEventListener('click', function() {
        const rocketAnimation = document.getElementById('rocket-animation');
        rocketAnimation.classList.remove('d-none');

        fetch('/launch_rocket', {
            method: 'POST',
        })
        .then(response => response.json())
        .then(data => {
            const rocket = rocketAnimation.querySelector('.rocket');
            if (data.success) {
                rocket.classList.add('launch-success');
                showSuccessMessage(data);
            } else {
                rocket.classList.add('launch-failure');
                showFailureMessage(data);
            }
            // 結果に関わらず次のラウンドへ
            setTimeout(() => {
                rocketAnimation.classList.add('d-none');
                rocket.classList.remove('launch-success', 'launch-failure');
                location.reload();
            }, 2500);
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

    // 初期状態の更新
    updateStats();
});