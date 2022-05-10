dfa = {};

dfa.count = 0;

dfa.createNew = function() {
    const newDFA = {
        states: {},
        alphabet: new Set(),
        q0: undefined
    };

    return newDFA;
};

dfa.addState = function(DFA, stateID, isFinal) {
    if (stateID in DFA.states) {
        return false;
    }
    const newState = {
        id: dfa.count++,
        strID: stateID,
        transitions: {},
        isFinal: isFinal
    };
    DFA.states[stateID] = newState;
    return true;
};

dfa.addTransition = function(DFA, fromID, symbol, toID) {
    if (!(fromID in DFA.states)) {
        throw new Error(`state ${fromID} not in DFA.`)
    }
    else if (!(toID in DFA.states)) {
        throw new Error(`state ${toID} not in DFA.`)
    }
    else if (symbol in DFA.states[fromID].transitions) {
        throw new Error(`symbol ${symbol} already in state ${fromID}'s `
                        `transitions.`)
    }
    else {
        DFA.states[fromID].transitions[symbol] = DFA.states[toID];
    }
};

dfa.convertFromNFA = function(enfa, alphabet) {
    dfa.count = 0;
    let machineState = new Set();
    nfa.init(machineState, enfa);
    const DFA = dfa.createNew();
    DFA.alphabet = enfa.alphabet;
    DFA.q0 = nfa.machineStateToString(machineState);
    dfa.addState(DFA, DFA.q0, false);
    const stateQueue = [new Set(machineState)];
    while (stateQueue.length > 0) {
        let newQ = stateQueue.shift();
        dfa.processNFAState(newQ, stateQueue, DFA, alphabet);
    }
    return DFA;
};

dfa.processNFAState = function(machineState, stateQueue, DFA, alphabet) {
    for (let symbol of alphabet) {
        let newState = new Set();
        for (let state of machineState) {
            if (symbol in state.transitions) {
                newState.add(state.transitions[symbol]);
            }
        }
        for (let nextState of Array.from(newState)) {
            nfa.doEpsilonTransitions(nextState, newState);
        }
        let fromID = nfa.machineStateToString(machineState);
        let toID = nfa.machineStateToString(newState);
        if (dfa.addState(DFA, toID, nfa.isFinalState(newState))) {
            stateQueue.push(newState);
        }
        dfa.addTransition(DFA, fromID, symbol, toID);
    }
};

dfa.init = function(machineState, DFA) {
    machineState.add(DFA.states[DFA.q0]);
};

dfa.run = function(DFA, inputString) {
    let machineState = new Set();
    dfa.init(machineState, DFA);
    for (let symbol of inputString) {
        dfa.advanceState(DFA, machineState, symbol);
    }
    return dfa.isFinalState(machineState);
};

dfa.advanceState = function(DFA, machineState, input) {
    let nextMachineState = new Set();
    const curState = machineState.values().next().value;
    nextMachineState.add(DFA.states[curState.strID].transitions[input]);
    machineState.clear();
    utils.set.union(machineState, nextMachineState);
};

dfa.isFinalState = function(machineState) {
    const lastState = machineState.values().next().value;
    return lastState.isFinal;
};