function attachCardRemoveListeners() {
    document.querySelectorAll('.card-remove').forEach(button => {
        button.addEventListener('click', function() {
            const cardId = this.dataset.cardId;
            fetch(`/remove_card/${cardId}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // カードリストを更新
                        const selectedArea = document.querySelector('.selected-cards');
                        fetch('/game')
                            .then(response => response.text())
                            .then(html => {
                                const parser = new DOMParser();
                                const doc = parser.parseFromString(html, 'text/html');
                                const newCards = doc.querySelector('.selected-cards').innerHTML;
                                selectedArea.innerHTML = newCards;
                                attachCardRemoveListeners();
                                updateStats();
                            });
                    }
                });
        });
    });
}

document.addEventListener('DOMContentLoaded', function() {
    attachCardRemoveListeners();
    // 推力と重量の表示を更新する関数
    function updateStats() {
        const selectedCards = document.querySelectorAll('.selected-cards .game-card');
        
        let totalThrust = 0;
        let totalWeight = 0;
        let totalPoints = 0;

        selectedCards.forEach(card => {
            const stats = card.querySelector('.card-stats').textContent;
            
            const thrustMatch = stats.match(/推力: (\d+)/);
            if (thrustMatch) {
                totalThrust += parseInt(thrustMatch[1]);
            }
            
            const weightMatch = stats.match(/重量: (\d+)/);
            if (weightMatch) {
                totalWeight += parseInt(weightMatch[1]);
            }
            
            const pointsMatch = stats.match(/ポイント: (\d+)/);
            if (pointsMatch) {
                totalPoints += parseInt(pointsMatch[1]);
            }
        });

        // プログレスバーの更新
        const maxValue = 200; // 最大値を設定
        document.querySelector('#thrust-bar').style.width = `${(totalThrust / maxValue) * 100}%`;
        document.querySelector('#thrust-value').textContent = `${totalThrust} kN`;
        
        document.querySelector('#weight-bar').style.width = `${(totalWeight / maxValue) * 100}%`;
        document.querySelector('#weight-value').textContent = `${totalWeight} kN`;
        
        document.querySelector('#points-bar').style.width = `${(totalPoints / 20) * 100}%`;
        document.querySelector('#points-value').textContent = `${totalPoints} pts`;

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

                        // 選択したカードを即時反映
                        const selectedArea = document.querySelector('.selected-cards');
                        fetch('/game')
                            .then(response => response.text())
                            .then(html => {
                                const parser = new DOMParser();
                                const doc = parser.parseFromString(html, 'text/html');
                                const newCards = doc.querySelector('.selected-cards').innerHTML;
                                selectedArea.innerHTML = newCards;
                                
                                // イベントリスナーを再設定
                                attachCardRemoveListeners();
                                // 統計を更新
                                updateStats();
                            });
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