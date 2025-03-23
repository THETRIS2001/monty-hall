document.addEventListener('DOMContentLoaded', () => {
    // Elementi DOM
    const doorsNumberInput = document.getElementById('doors-number');
    const startGameButton = document.getElementById('start-game');
    const doorsContainer = document.getElementById('doors-container');
    const decisionButtons = document.getElementById('decision-buttons');
    const stayButton = document.getElementById('stay-button');
    const switchButton = document.getElementById('switch-button');
    const gameMessage = document.getElementById('game-message');
    const resultOverlay = document.getElementById('result-overlay');
    const resultMessage = document.getElementById('result-message');
    
    // Elementi statistiche
    const stayWinsElement = document.getElementById('stay-wins');
    const switchWinsElement = document.getElementById('switch-wins');
    const stayWinPercentageElement = document.getElementById('stay-win-percentage');
    const switchWinPercentageElement = document.getElementById('switch-win-percentage');
    const stayTotalElement = document.getElementById('stay-total');
    const switchTotalElement = document.getElementById('switch-total');
    
    // Elementi percentuali teoriche
    const expectedStayPercentageElement = document.getElementById('expected-stay-percentage');
    const expectedSwitchPercentageElement = document.getElementById('expected-switch-percentage');
    
    // Variabili di gioco
    let doors = [];
    let prizeDoor = null;
    let selectedDoor = null;
    let revealedDoors = [];
    let gameActive = false;
    
    // Statistiche
    let stayWins = 0;
    let switchWins = 0;
    let stayLosses = 0;
    let switchLosses = 0;
    
    // Inizializza il gioco
    startGameButton.addEventListener('click', startGame);
    
    // Aggiorna le percentuali attese quando cambia il numero di porte
    doorsNumberInput.addEventListener('input', updateExpectedPercentages);
    
    // Calcola le percentuali attese iniziali
    updateExpectedPercentages();
    
    function startGame() {
        // Resetta lo stato del gioco
        doors = [];
        selectedDoor = null;
        revealedDoors = [];
        gameActive = true;
        
        // Ottieni il numero di porte
        const numDoors = parseInt(doorsNumberInput.value);
        if (numDoors < 3) {
            gameMessage.textContent = 'Il numero di porte deve essere almeno 3';
            return;
        }
        
        // Nascondi i pulsanti di decisione
        decisionButtons.classList.add('hidden');
        
        // Svuota il contenitore delle porte
        doorsContainer.innerHTML = '';
        
        // Scegli casualmente la porta con il premio
        prizeDoor = Math.floor(Math.random() * numDoors);
        
        // Crea le porte
        for (let i = 0; i < numDoors; i++) {
            const door = document.createElement('div');
            door.className = 'door';
            door.dataset.index = i;
            
            door.innerHTML = `
                <div class="door-inner">
                    <div class="door-front">${i + 1}</div>
                    <div class="door-back">
                        <div class="door-content">${i === prizeDoor ? '🚗' : '🐐'}</div>
                    </div>
                </div>
            `;
            
            door.addEventListener('click', () => selectDoor(i));
            doorsContainer.appendChild(door);
            doors.push(door);
        }
        
        gameMessage.textContent = 'Seleziona una porta!';
    }
    
    function selectDoor(index) {
        // Prima selezione della porta
        if (gameActive && selectedDoor === null) {
            selectedDoor = index;
            doors[index].classList.add('selected');
            
            // Rivela alcune porte con capre (tutte tranne la selezionata e una con premio o una casuale)
            revealDoors();
            
            // Nascondi i pulsanti di decisione (non li useremo più)
            decisionButtons.classList.add('hidden');
            gameMessage.textContent = 'Clicca sulla porta che vuoi aprire!';
            return;
        }
        
        // Seconda selezione (scelta finale)
        if (gameActive && selectedDoor !== null) {
            // Verifica che la porta cliccata non sia già stata rivelata
            if (revealedDoors.includes(index)) {
                return; // Ignora i click su porte già rivelate
            }
            
            // Determina se il giocatore è rimasto con la scelta originale o ha cambiato
            const decision = (index === selectedDoor) ? 'stay' : 'switch';
            
            // Completa il gioco con la decisione presa
            finishGame(decision);
        }
    }
    
    function revealDoors() {
        // Trova tutte le porte che non sono state selezionate
        const nonSelectedDoors = [];
        for (let i = 0; i < doors.length; i++) {
            if (i !== selectedDoor) {
                nonSelectedDoors.push(i);
            }
        }
        
        // Separa le porte non selezionate in porte con capre e porta con premio
        const goatDoors = [];
        let prizeDoorIndex = -1;
        
        for (let i = 0; i < nonSelectedDoors.length; i++) {
            const index = nonSelectedDoors[i];
            if (index === prizeDoor) {
                prizeDoorIndex = i;
            } else {
                goatDoors.push(index);
            }
        }
        
        // Se abbiamo almeno 2 porte non selezionate (caso normale con 3+ porte totali)
        if (nonSelectedDoors.length >= 2) {
            // Mescola le porte con capre
            shuffleArray(goatDoors);
            
            // Teniamo una porta con capra chiusa (se possibile)
            const doorToKeepClosed = prizeDoorIndex !== -1 ? prizeDoor : goatDoors[0];
            
            // Rivela tutte le altre porte con capre tranne una
            let revealedAtLeastOne = false;
            
            for (let i = 0; i < goatDoors.length; i++) {
                const index = goatDoors[i];
                // Se è l'unica porta con capra e non abbiamo ancora rivelato nessuna porta,
                // dobbiamo rivelarla
                if (goatDoors.length === 1 || index !== doorToKeepClosed || (i > 0 && !revealedAtLeastOne)) {
                    doors[index].classList.add('revealed');
                    doors[index].classList.add('flipped');
                    revealedDoors.push(index);
                    revealedAtLeastOne = true;
                }
            }
            
            // Assicuriamoci che almeno una porta con capra sia stata rivelata
            // Questo è importante soprattutto nel caso di 3 porte totali
            if (!revealedAtLeastOne && goatDoors.length > 0) {
                const indexToReveal = goatDoors[0];
                doors[indexToReveal].classList.add('revealed');
                doors[indexToReveal].classList.add('flipped');
                revealedDoors.push(indexToReveal);
            }
        }
        // Nel caso improbabile di una sola porta non selezionata, non rivelare nulla
        // (questo non dovrebbe mai accadere con almeno 3 porte totali)
    }
    
    function finishGame(decision) {
        if (!gameActive) return;
        gameActive = false;
        
        let finalDoor;
        let won;
        let alternativeDoor;
        
        if (decision === 'stay') {
            // Il giocatore rimane con la porta selezionata
            finalDoor = selectedDoor;
            won = finalDoor === prizeDoor;
            
            // Trova la porta alternativa (quella non rivelata e non selezionata)
            for (let i = 0; i < doors.length; i++) {
                if (i !== selectedDoor && !revealedDoors.includes(i)) {
                    alternativeDoor = i;
                    break;
                }
            }
            
            // Aggiorna statistiche
            if (won) {
                stayWins++;
                stayWinsElement.textContent = stayWins;
            } else {
                stayLosses++;
            }
        } else {
            // Il giocatore cambia porta
            // Trova la porta non rivelata e non selezionata
            for (let i = 0; i < doors.length; i++) {
                if (i !== selectedDoor && !revealedDoors.includes(i)) {
                    finalDoor = i;
                    alternativeDoor = i; // In questo caso, la porta alternativa è la stessa porta finale
                    break;
                }
            }
            
            won = finalDoor === prizeDoor;
            
            // Aggiorna statistiche
            if (won) {
                switchWins++;
                switchWinsElement.textContent = switchWins;
            } else {
                switchLosses++;
            }
        }
        
        // Rivela tutte le porte
        for (let i = 0; i < doors.length; i++) {
            doors[i].classList.add('flipped');
            // Aggiungi classe specifica solo per la porta con auto
            if (i === prizeDoor) {
                doors[i].classList.add('prize-door');
            }
            
            // Aggiungi classe goat-door solo alla porta alternativa con capra
            if (i === alternativeDoor && i !== prizeDoor) {
                doors[i].classList.add('goat-door');
            }
        }
        
        // Evidenzia la porta finale
        doors[finalDoor].classList.add('selected');
        
        // Evidenzia la porta originale e quella alternativa con bordi speciali
        doors[selectedDoor].classList.add('original-selection');
        doors[alternativeDoor].classList.add('alternative-option');
        
        // Prepara il messaggio di risultato
        const resultText = won ? 'Hai vinto! 🎉' : 'Hai perso! 😢';
        
        // Mostra l'overlay con il messaggio di risultato
        resultMessage.textContent = resultText;
        resultMessage.className = 'result-message ' + (won ? 'win' : 'lose');
        resultOverlay.classList.add('visible');
        
        // Nascondi i pulsanti di decisione
        decisionButtons.classList.add('hidden');
        
        // Aggiorna le statistiche totali
        updateStatistics();
    }
    
    function updateStatistics() {
        const totalStay = stayWins + stayLosses;
        const totalSwitch = switchWins + switchLosses;
        
        // Calcola le percentuali basate sul totale delle partite per strategia
        const stayWinPercentage = totalStay > 0 ? (stayWins / totalStay) * 100 : 0;
        const switchWinPercentage = totalSwitch > 0 ? (switchWins / totalSwitch) * 100 : 0;
        
        stayWinPercentageElement.textContent = `${stayWinPercentage.toFixed(1)}%`;
        switchWinPercentageElement.textContent = `${switchWinPercentage.toFixed(1)}%`;
        stayTotalElement.textContent = totalStay;
        switchTotalElement.textContent = totalSwitch;
    }
    
    function updateExpectedPercentages() {
        // Ottieni il numero di porte
        const numDoors = parseInt(doorsNumberInput.value);
        
        // Resetta le statistiche
        stayWins = 0;
        switchWins = 0;
        stayLosses = 0;
        switchLosses = 0;
        
        // Aggiorna gli elementi HTML delle statistiche
        stayWinsElement.textContent = stayWins;
        switchWinsElement.textContent = switchWins;
        stayWinPercentageElement.textContent = '0.0%';
        switchWinPercentageElement.textContent = '0.0%';
        
        // Calcola le percentuali teoriche
        // Probabilità di vincita rimanendo: 1/n
        const stayPercentage = (1 / numDoors) * 100;
        
        // Probabilità di vincita cambiando: (n-1)/n
        const switchPercentage = ((numDoors - 1) / numDoors) * 100;
        
        // Aggiorna gli elementi HTML
        expectedStayPercentageElement.textContent = `${stayPercentage.toFixed(1)}%`;
        expectedSwitchPercentageElement.textContent = `${switchPercentage.toFixed(1)}%`;
    }
    
    // Utility function per mescolare un array
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    // Aggiungi event listener per chiudere l'overlay e iniziare un nuovo gioco
    resultOverlay.addEventListener('click', () => {
        resultOverlay.classList.remove('visible');
        startGame();
    });

});