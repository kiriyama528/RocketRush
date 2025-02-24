document.addEventListener('DOMContentLoaded', function() {
    // 推力と重量の表示を更新する関数
    function updateStats() {
        const selectedCards = document.querySelectorAll('.selected-cards .game-card');
        
        let totalThrust = 0;
        let totalWeight = 0;
        let totalPoints = 0;

        selectedCards.forEach(card => {
            const thrustEl = card.querySelector('.card-stats p:nth-child(1)');
            const weightEl = card.querySelector('.card-stats p:nth-child(2)');
            const pointsEl = card.querySelector('.card-stats p:nth-child(3)');

            if (thrustEl && thrustEl.textContent.includes('推力')) {
                totalThrust += parseInt(thrustEl.textContent.match(/\d+/)[0]);
            }
            if (weightEl && weightEl.textContent.includes('重量')) {
                totalWeight += parseInt(weightEl.textContent.match(/\d+/)[0]);
            }
            if (pointsEl && pointsEl.textContent.includes('ポイント')) {
                totalPoints += parseInt(pointsEl.textContent.match(/\d+/)[0]);
            }
        });

        const requiredThrust = parseInt(document.querySelector('#required-thrust-bar span').textContent);

        // プログレスバーの更新
        const thrustBar = document.querySelector('#thrust-bar');
        const weightBar = document.querySelector('#weight-bar');
        const pointsBar = document.querySelector('#points-bar');

        thrustBar.style.width = `${(totalThrust / 200) * 100}%`;
        weightBar.style.width = `${(totalWeight / 200) * 100}%`;
        pointsBar.style.width = `${(totalPoints / 20) * 100}%`;

        document.querySelector('#thrust-value').textContent = `${totalThrust} kN`;
        document.querySelector('#weight-value').textContent = `${totalWeight} kN`;
        document.querySelector('#points-value').textContent = `${totalPoints} pts`;

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

                        // 統計を更新
                        updateStats();
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
                        // 統計を更新
                        updateStats();
                    }
                });
        });
    });

    // 初期状態の統計を更新
    updateStats();

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
                        打ち上げ成功！スコア: ${data.score}点
                    </div>
                `;
            } else {
                resultDiv.innerHTML = `
                    <div class="alert alert-danger">
                        打ち上げ失敗！必要な条件を満たしていません。
                    </div>
                `;
            }
            setTimeout(() => {
                location.reload();
            }, 2000);
        });
    });
});