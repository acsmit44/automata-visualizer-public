// page elements
let createAutomatonButton = document.getElementById("createAutomaton");
let startButton = document.getElementById("toggleStartStop");
let progressButton = document.getElementById("inputProgress");
let undoButton = document.getElementById("inputUndo");
let finishButton = document.getElementById("inputFinish");
let resetButton = document.getElementById("inputReset");
let inputLabel = document.getElementById("inputTracker");

// variables for automaton visualizing
let network;
let layoutSeed;
let nodePositions = [];
let fsm = undefined;
let fsmType = '';
let machineStates = [];
let fsmActive = false;
let inputString = '';
let inputIndex = 0;
let progressedLast = false;

let createAutomaton = function() {
    let regexString = document.getElementById("regex").value;
    let lex = lexer.createNew();
    lexer.processInput(lex, regexString);
    const newFSM = parser.parseRegexSection(lex);
    newFSM.alphabet = lex.alphabet;
    nfa.assignStateIDs(newFSM);
    return newFSM;
};

let resetGraph = function() {
    graphData.nodes = [];
    graphData.edges = [];
};

let resetAutomaton = function() {
    machineStates = [];
    inputString = '';
    inputIndex = 0;
    fsmActive = false;
    inputLabel.innerHTML = '';
    inputLabel.style.display = 'none';
};

let toggleButtons = function() {
    for (let btn of [progressButton, resetButton, undoButton, finishButton]) {
        btn.disabled = !fsmActive;
    }
};

let setInputLabel = function() {
    if (inputIndex < 0 || inputIndex === inputString.length) {
        inputLabel.innerHTML = inputString;
    }
    else {
        inputLabel.innerHTML =
            `${inputString.slice(0, inputIndex)}` +
            `<mark>${inputString[inputIndex]}</mark>` +
            `${inputString.slice(inputIndex + 1, inputString.length)}`;
    }
    inputLabel.style.display = 'inline-block';
};

createAutomatonButton.onclick = function() {
    fsmActive = false;
    toggleButtons();
    resetGraph();
    fsm = createAutomaton();
    fsmType = document.getElementById('automatonType').value;
    if (fsmType === 'NFA') {
        visualizer.createGraphFromNFA(graphData, fsm);
    }
    else if (fsmType === 'DFA') {
        fsm = dfa.convertFromNFA(fsm, fsm.alphabet);
        visualizer.createGraphFromDFA(graphData, fsm);
    }
    networkData.nodes = new vis.DataSet(graphData.nodes);
    networkData.edges = new vis.DataSet(graphData.edges);
    let options = {
        physics: false
    };
    network = new vis.Network(container, networkData, options);
    layoutSeed = network.getSeed();
};

startButton.onclick = function() {
    if (fsm === undefined) {
        throw new Error(`Automata has not been generated yet.`);
    }
    resetAutomaton();
    let machineState = new Set();
    let advanceState;
    if (fsmType === 'NFA') {
        nfa.init(machineState, fsm);
        advanceState = nfa.advanceState;
    }
    else if (fsmType === 'DFA') {
        dfa.init(machineState, fsm);
        advanceState = dfa.advanceState;
    }
    visualizer.reset(networkData);
    fsmActive = true;
    toggleButtons();
    inputString = document.getElementById("inputString").value;
    while (inputIndex < inputString.length) {
        let c = inputString[inputIndex++];
        machineStates.push(new Set(machineState));
        advanceState(fsm, machineState, c);
    }
    machineStates.push(machineState);
    inputIndex = 0;
    visualizer.colorStates(machineStates[inputIndex], networkData);
    setInputLabel();
};

progressButton.onclick = function() {
    if (inputIndex === machineStates.length - 1) {
        console.log('Cannot progress. Reached end of input.');
        return;
    }
    inputIndex++;
    visualizer.colorStates(machineStates[inputIndex], networkData);
    setInputLabel();
};

undoButton.onclick = function() {
    if (inputIndex === 0) {
        console.log('Cannot undo. Input is still at beginning of the string.');
        return;
    }
    inputIndex--;
    visualizer.colorStates(machineStates[inputIndex], networkData);
    setInputLabel();
};

finishButton.onclick = function() {
    inputIndex = machineStates.length - 1;
    visualizer.colorStates(machineStates[inputIndex], networkData);
    setInputLabel();
};

resetButton.onclick = function() {
    resetAutomaton();
    toggleButtons();
    visualizer.reset(networkData);
};