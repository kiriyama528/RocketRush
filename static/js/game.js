function attachCardRemoveListeners() {
    document.querySelectorAll('.card-remove').forEach(button => {
        button.addEventListener('click', function() {
            const cardId = this.dataset.cardId;
            fetch(`/remove_card/${cardId}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // 選択状態をリセット
                        const cardType = data.removed_type;
                        const marketButton = document.querySelector(`.card-${cardType} .card-select.btn-selected`);
                        if (marketButton) {
                            marketButton.classList.remove('btn-selected');
                            marketButton.textContent = '選択';
                        }

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

    // カード選択ボタンのイベントリスナー
    document.querySelectorAll('.card-select').forEach(button => {
        button.addEventListener('click', function() {
            const cardType = this.dataset.cardType;
            const cardId = this.dataset.cardId;

            // すでに選択済みの場合は基本装備に戻す
            if (this.classList.contains('btn-selected')) {
                fetch(`/remove_card/${cardId}`)
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            this.classList.remove('btn-selected');
                            this.textContent = '選択';

                            const selectedArea = document.querySelector('.selected-cards');
                            return fetch('/game');
                        }
                    })
                    .then(response => response.text())
                    .then(html => {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(html, 'text/html');
                        const newCards = doc.querySelector('.selected-cards').innerHTML;
                        const selectedArea = document.querySelector('.selected-cards');
                        selectedArea.innerHTML = newCards;
                        attachCardRemoveListeners();
                        updateStats();
                    });
                return;
            }

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
                                attachCardRemoveListeners();
                                updateStats();
                            });
                    }
                });
        });
    });

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

function updateStats() {
    const selectedCards = document.querySelectorAll('.selected-cards .game-card');

    let totalThrust = 0;
    let totalWeight = 0;
    let totalPoints = 0;

    selectedCards.forEach(card => {
        const stats = card.querySelector('.card-stats').textContent;

        const thrustMatch = stats.match(/推力: (\d+)kN/); //Added kN to match regex in updateProgressBars
        if (thrustMatch) {
            totalThrust += parseInt(thrustMatch[1]);
        }

        const weightMatch = stats.match(/重量: (\d+)kN/); //Added kN to match regex in updateProgressBars
        if (weightMatch) {
            totalWeight += parseInt(weightMatch[1]);
        }

        const pointsMatch = stats.match(/ポイント: (\d+)/);
        if (pointsMatch) {
            totalPoints += parseInt(pointsMatch[1]);
        }
    });

    // プログレスバーの更新
    const maxValue = 200;
    document.querySelector('#thrust-bar').style.width = `${(totalThrust / maxValue) * 100}%`;
    document.querySelector('#thrust-value').textContent = `${totalThrust} kN`;

    document.querySelector('#weight-bar').style.width = `${(totalWeight / maxValue) * 100}%`;
    document.querySelector('#weight-value').textContent = `${totalWeight} kN`;

    document.querySelector('#points-bar').style.width = `${(totalPoints / 20) * 100}%`;
    document.querySelector('#points-value').textContent = `${totalPoints} pts`;
}

function updateProgressBars() {
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

    // Update thrust bar
    const thrustBar = document.getElementById('thrust-bar');
    const thrustValue = document.getElementById('thrust-value');
    thrustBar.style.width = `${(totalThrust / 200) * 100}%`;
    thrustValue.textContent = `${totalThrust} kN`;

    // Update weight bar
    const weightBar = document.getElementById('weight-bar');
    const weightValue = document.getElementById('weight-value');
    weightBar.style.width = `${(totalWeight / 200) * 100}%`;
    weightValue.textContent = `${totalWeight} kN`;

    // Update points bar
    const pointsBar = document.getElementById('points-bar');
    const pointsValue = document.getElementById('points-value');
    pointsBar.style.width = `${(totalPoints / 20) * 100}%`;
    pointsValue.textContent = `${totalPoints} pts`;
}