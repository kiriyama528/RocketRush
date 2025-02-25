document.addEventListener('DOMContentLoaded', function() {
    attachCardSelectListeners();
    updateStats();
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
                        // 選択したカードの情報を更新し、ページをリロード
                        location.reload();
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                });
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
    document.getElementById('thrust-bar').style.width = `${(totalThrust / 200) * 100}%`;
    document.getElementById('thrust-value').textContent = `${totalThrust} kN`;

    document.getElementById('weight-bar').style.width = `${(totalWeight / 200) * 100}%`;
    document.getElementById('weight-value').textContent = `${totalWeight} kN`;

    document.getElementById('points-bar').style.width = `${(totalPoints / 10) * 100}%`;
    document.getElementById('points-value').textContent = `${totalPoints} pts`;
}

// Launch button functionality
function attachLaunchListener() {
    document.getElementById('launch-button').addEventListener('click', function() {
        fetch('/launch_rocket', {
            method: 'POST'
        })
        .then(response => response.json())
        .then(data => {
            window.location.reload();
        })
        .catch(error => console.error('Error:', error));
    });
}