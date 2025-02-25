function attachCardRemoveListeners() {
    document.querySelectorAll('.card-remove').forEach(button => {
        button.addEventListener('click', function() {
            const cardId = this.dataset.cardId;
            fetch(`/remove_card/${cardId}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        return fetch('/game');
                    }
                })
                .then(response => response.text())
                .then(html => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const newCards = doc.querySelector('.selected-cards').innerHTML;
                    document.querySelector('.selected-cards').innerHTML = newCards;
                    updateStats();
                });
        });
    });
}

document.addEventListener('DOMContentLoaded', function() {
    updateStats();
    attachCardSelectListeners();
    attachCardRemoveListeners();
    attachLaunchListener();
});

function attachCardSelectListeners() {
    document.querySelectorAll('.card-select').forEach(button => {
        button.addEventListener('click', function() {
            const cardType = this.dataset.cardType;
            const cardId = this.dataset.cardId;

            fetch(`/select_card/${cardType}/${cardId}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // 選択状態を更新
                        document.querySelectorAll(`.card-select[data-card-type="${cardType}"]`).forEach(btn => {
                            btn.classList.remove('btn-selected');
                            btn.textContent = '選択';
                        });
                        this.classList.add('btn-selected');
                        this.textContent = '選択済み';

                        // 選択したカードを即時反映
                        location.reload();
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                });
        });
    });
}Stats();
                });
        });
    });
}


function attachLaunchListener() {
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
                        発射成功！ スコア: ${data.score} (ラウンド ${data.round}/5)
                    </div>
                `;
            } else {
                resultDiv.innerHTML = `
                    <div class="alert alert-danger">
                        発射失敗... もう一度試してみましょう
                    </div>
                `;
            }

            // アニメーション表示
            const animation = document.getElementById('rocket-animation');
            animation.classList.remove('d-none');
            setTimeout(() => {
                animation.classList.add('d-none');
                window.location.reload();
            }, 3000);
        });
    });
}

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
    const maxValue = 200; // 最大値の設定
    document.getElementById('thrust-bar').style.width = `${(totalThrust / maxValue) * 100}%`;
    document.getElementById('thrust-value').textContent = `${totalThrust} kN`;

    document.getElementById('weight-bar').style.width = `${(totalWeight / maxValue) * 100}%`;
    document.getElementById('weight-value').textContent = `${totalWeight} kN`;

    document.getElementById('points-bar').style.width = `${(totalPoints / 10) * 100}%`;
    document.getElementById('points-value').textContent = `${totalPoints} pts`;
}

document.addEventListener('DOMContentLoaded', updateStats);;

    document.getElementById('points-bar').style.width = `${(totalPoints / 10) * 100}%`;
    document.getElementById('points-value').textContent = `${totalPoints} pts`;
}